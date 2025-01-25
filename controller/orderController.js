const Order = require("../models/orderModel");
const Product = require("../models/productModel");
const ErrorHander = require("../middleware/errorhander");
const catchAsyncErrors = require("../errors/catchAsyncErrors");
const { StatusCodes } = require("http-status-codes");
const nodemailer = require("nodemailer");
const { jsPDF } = require("jspdf");
require("jspdf-autotable");
const fs = require("fs");

const mongoose = require("mongoose");
const cron = require("node-cron");

// create new order -- user
const newOrder = catchAsyncErrors(async (req, res, next) => {
  req.body.paidAt = Date.now();

  var items_price = 0;
  for (var i in req.body.order_items) {
    req.body.order_items[i].total_price =
      req.body.order_items[i].product_price * req.body.order_items[i].quantity;
    items_price += req.body.order_items[i].total_price;
  }

  req.body.items_price = items_price;

  const orders = await Order.create(req.body);
  
  res.status(StatusCodes.CREATED).json({
    status: StatusCodes.CREATED,
    success: true,
    message: "Order placed successfully",
  });
});

// get singelOrder
const getSingelOrder = catchAsyncErrors(async (req, res, next) => {
  const orders = await Order.findById(req.params.id).populate(
    "user",
    "name email"
  );
  if (!orders) {
    return next(new ErrorHander("Order not found with this id", 404));
  }
  res.status(StatusCodes.OK).json({
    status: StatusCodes.OK,
    success: true,
    data: orders,
  });
});

// get logedin user orders
const getUserOrders = catchAsyncErrors(async (req, res, next) => {
  const { userId } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 200;
  const skip = (page - 1) * limit;

  const totalCount = await Order.countDocuments({ user: userId });

  // Fetch orders sorted by createdAt in descending order
  const orders = await Order.find({ user: userId })
    .populate("order_items.product")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  if (!orders) {
    return next(new ErrorHander("Order not found with this id", 404));
  }

  res.status(StatusCodes.OK).json({
    data: orders,
    status: StatusCodes.OK,
    success: true,
    currentPage: page,
    totalPages: Math.ceil(totalCount / limit),
    totalCount,
  });
});
// get all orders = seller
const getOrderListForSeller = catchAsyncErrors(async (req, res, next) => {
  const { sellerId } = req.params;

  const orders = await Order.find({
    "order_items.seller": mongoose.Types.ObjectId(sellerId), // Convert string to ObjectId
  }).exec();

  const sellerOrders = orders.map((order) => {
    const filteredItems = order.order_items.filter(
      (item) => item.seller.toString() === sellerId
    );
    return { ...order._doc, order_items: filteredItems };
  });

  res.status(StatusCodes.OK).json({
    status: StatusCodes.OK,
    success: true,
    data: sellerOrders,
    totalCount: sellerOrders.length,
  });
});

// get all order for Admin

const getAllOrders = catchAsyncErrors(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  const statusFilter = req.query.status;
  const period = req.query.timeframe;
  const qStartDate = req?.query?.startDate;
  const qEndDate = req?.query?.endDate;

 

  let startDate;
  let endDate = new Date();

  if (qStartDate && qEndDate) {
    startDate = new Date(qStartDate);
    startDate.setHours(0, 0, 0, 0);
    endDate = new Date(qEndDate);
    endDate.setHours(23, 59, 59, 999);
  } else {
    switch (period) {
      case "1day":
        startDate = new Date();
        startDate.setHours(0, 0, 0, 0);
        break;
      case "1month":
        startDate = new Date(
          endDate.getFullYear(),
          endDate.getMonth() - 1,
          endDate.getDate()
        );
        break;
      case "6months":
        startDate = new Date(
          endDate.getFullYear(),
          endDate.getMonth() - 6,
          endDate.getDate()
        );
        break;
      case "1year":
        startDate = new Date(
          endDate.getFullYear() - 1,
          endDate.getMonth(),
          endDate.getDate()
        );
        break;
      default:
        return next(new ErrorHander("Invalid period specified", 400));
    }
  }

  // Build the query
  let query = {
    createdAt: { $gte: startDate, $lte: endDate },
  };
  if (statusFilter && statusFilter !== "all") {
    query.order_status = statusFilter;
  }

  // console.log(query,"lllll")

  const totalCount = await Order.countDocuments(query);

  const orders = await Order.find(query)
    .populate("order_items.product")
    .populate("user")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  res.status(StatusCodes.OK).json({
    status: StatusCodes.OK,
    success: true,
    data: orders,
    currentPage: page,
    totalPages: Math.ceil(totalCount / limit),
    totalCount,
  });
});



// Function to generate PDF for the given orders and period/status
const generatePDFReport = (orders, title) => {
  return new Promise((resolve) => {
    const doc = new jsPDF();
    doc.text(`Order Report - ${title}`, 14, 22);

    const tableColumn = ["Order ID", "User", "Total Price", "Status", "Date"];
    const tableRows = [];

    orders.forEach((order) => {
      const orderData = [
        order._id,
        order.user.name || order.shippingInfo.frist_name,
        `${(order.total_price / 100).toFixed(2)}`,
        order.order_status,
        new Date(order.createdAt).toLocaleDateString(),
      ];
      tableRows.push(orderData);
    });

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 30,
      margin: { top: 10 },
      theme: "grid",
    });

    const filename = `order_report_${title}.pdf`;
    doc.save(filename);
    resolve(filename);
  });
};

const checkTodayOrders = catchAsyncErrors(async (req, res, next) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayOrders = await Order.countDocuments({
    createdAt: { $gte: today },
  });

  const twentyFourHoursAgo = new Date();
  twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

  const last24HoursOrders = await Order.find({
    createdAt: { $gte: twentyFourHoursAgo },
  });

  res.status(StatusCodes.OK).json({
    status: StatusCodes.OK,
    success: true,
    data: last24HoursOrders,
    couunt: todayOrders,
    hasTodayOrders: todayOrders > 0,
  });
});

// Download report with time period and status filtering
const downloadOrderReport = catchAsyncErrors(async (req, res, next) => {
  const { period, status } = req.params;
  const qStartDate = req?.query?.startDate;
  const qEndDate = req?.query?.endDate;

  let startDate;
  let endDate = new Date();

  if (qStartDate && qEndDate) {
    startDate = new Date(qStartDate);
    startDate.setHours(0, 0, 0, 0);
    endDate = new Date(qEndDate);
    endDate.setHours(23, 59, 59, 999);
  } else {
    switch (period) {
      case "1day":
        startDate = new Date();
        startDate.setHours(0, 0, 0, 0);
        break;
      case "1month":
        startDate = new Date(
          endDate.getFullYear(),
          endDate.getMonth() - 1,
          endDate.getDate()
        );
        break;
      case "6months":
        startDate = new Date(
          endDate.getFullYear(),
          endDate.getMonth() - 6,
          endDate.getDate()
        );
        break;
      case "1year":
        startDate = new Date(
          endDate.getFullYear() - 1,
          endDate.getMonth(),
          endDate.getDate()
        );
        break;
      default:
        return next(new ErrorHander("Invalid period specified", 400));
    }
  }

  // Build query to filter orders by date and status (if provided)
  let query = {
    createdAt: { $gte: startDate, $lte: endDate },
  };
  if (status && status !== "all") {
    query.order_status = status;
  }

  const orders = await Order.find(query).sort({ createdAt: -1 });

  const title = `${period}_${status || "All"}`;
  const filename = await generatePDFReport(orders, title);

  res.download(filename, (err) => {
    if (err) {
      next(new ErrorHander("Error downloading file", 500));
    }
  });
});

const updateOrederProductStatus = catchAsyncErrors(async (req, res, next) => {
  const itemId = req.params.itemId;

  const order = await Order.findOne({ "order_items._id": itemId });
  if (!order) {
    return next(new ErrorHander("Order not found", 404));
  }

  const orderedProduct = order.order_items.find(
    (item) => item._id.toString() === itemId
  );
  if (!orderedProduct) {
    return next(new ErrorHander("Ordered product not found", 404));
  }

  if (orderedProduct.status === "Confirmed") {
    return next(new ErrorHander("Product Satus already confirmd", 404));
  }

  if (orderedProduct.status === "Cancelled") {
    return next(
      new ErrorHander("Product Satus Cancelled do not change status", 404)
    );
  }

  orderedProduct.status = "Confirmed";
  await order.save();

  const product = await Product.findById(orderedProduct.product);
  product.stock -= orderedProduct.quantity;
  await product.save();

  res.status(StatusCodes.OK).json({
    status: StatusCodes.OK,
    success: true,
    message: "Order item status updated successfully",
    data: orderedProduct,
  });
});

const transporter = nodemailer.createTransport({
  service: "gmail",
  // auth: {
  //   user: 'princeradadiya0003@gmail.com',
  //   pass: 'bvavprbxjrpclwil',
  // },
  auth: {
    user: "annecafashion06@gmail.com",
    pass: "kwyilpscnfivlugy",
  },
});
const formatPrice = (price) => {
  return (price / 100).toFixed(2);
};

const cancleOrderbyUser = catchAsyncErrors(async (req, res, next) => {
  const orderId = req.params.orderId;
  // Find the order by its ID
  const order = await Order.findById(orderId).populate("user", "email name");
  // console.log(order)
  if (!order) {
    return next(new ErrorHander("Order not found", 404));
  }
  if (order.order_status === "Cancelled") {
    return next(new ErrorHander("Order already Cancelled", 404));
  }

  for (const item of order.order_items) {
    item.status = "Cancelled";
  }
  order.order_status = "Cancelled";
  await order.save();

  // Revert stock for confirmed items
  for (var i in order.order_items) {
    if (order.order_items[i].status === "Confirmed") {
      const product = await Product.findById(order.order_items[i].product);
      product.stock += order.order_items[i].quantity;
      await product.save({ validateBeforeSave: false });
    }
  }

  // Fetch product details for each order item
  const orderItemsWithDetails = await Promise.all(
    order.order_items.map(async (item) => {
      const product = await Product.findById(item.product);
      return {
        ...item.toObject(),
        productDetails: product,
      };
    })
  );

  // Send cancellation email to the user
  const mailOptions = {
    from: order.user.email, // Sender address
    to: "annecafashion06@gmail.com", // User email
    subject: `Order #${order._id} Cancellation`,
    html: `
        <h1>Order Cancellation</h1>
        <p>Dear ${order.user.name},</p>
        <p>Your order with ID <strong>#${
          order._id
        }</strong> has been successfully cancelled.</p>
        <h3>Order Details:</h3>
        <ul>
          ${orderItemsWithDetails
            .map(
              (item) => `
            <li>
              <h4>Product: ${item.productDetails.name}</h4>
             ${item.productDetails.description}
             
              <p>Quantity: ${item.quantity}</p>
              <p>Price: ₹${item.product_price}</p>
              
            </li>
          `
            )
            .join("")}
        </ul>
        <p>Total Order Value: ₹${formatPrice(order.total_price)}</p>
        <p>We hope to serve you again soon.</p>
      `,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error("Error sending email:", error);
    } else {
      console.log("Email sent: " + info.response);
    }
  });

  res.status(StatusCodes.OK).json({
    status: StatusCodes.OK,
    success: true,
    message: "Order cancelled successfully and email sent to the user.",
    data: order,
  });
});

// change status for item product in 3 day left
// Schedule task to run every hour
cron.schedule("0 * * * *", async () => {
  const orders = await Order.find({ "order_items.status": "Pending" });
  const currentTime = new Date();
  const cancellationThreshold = 3 * 24 * 60 * 60 * 1000;

  for (const order of orders) {
    for (const item of order.order_items) {
      if (item.status === "Pending") {
        const creationTime = item.createdAt;
        if (currentTime - creationTime >= cancellationThreshold) {
          item.status = "Cancelled";
        }
      }
    }

    // if (order.order_items.some(item => item.status === 'Confirmed')) {
    //     order.order_status = 'Confirmed';
    // } else {
    //     order.order_status = 'Cancelled';
    // }

    await order.save();
  }
});

// get order Lifetime Sale - seller
const getOrderLifetime = catchAsyncErrors(async (req, res, next) => {
  const sellerId = req.params.sellerId;

  // Find all orders where the seller's ID matches
  const lifetimeSales = await Order.aggregate([
    { $match: { "order_items.seller": sellerId } },
    { $group: { _id: null, totalSales: { $sum: "$total_price" } } },
  ]);

  const totalOrders = await Order.countDocuments({
    "order_items.seller": sellerId,
  });

  const completedOrders = await Order.countDocuments({
    "order_items.seller": sellerId,
    order_status: "Delivered",
  });

  // Get the number of cancelled orders for the seller
  const cancelledOrders = await Order.countDocuments({
    "order_items.seller": sellerId,
    order_status: "Cancelled",
  });

  const totalSales = lifetimeSales.length > 0 ? lifetimeSales[0].totalSales : 0;
  const completedPercentage =
    totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0;
  const cancelledPercentage =
    totalOrders > 0 ? (cancelledOrders / totalOrders) * 100 : 0;

  res.status(StatusCodes.OK).json({
    status: StatusCodes.OK,
    success: true,
    lifetimeSales: totalSales,
    totalOrders: totalOrders,
    completedPercentage: completedPercentage.toFixed(2),
    cancelledPercentage: cancelledPercentage.toFixed(2),
  });
});

// Sale Statistic graf detail monthly - dayly - weekly seller
const getSaleStatisticMonth = catchAsyncErrors(async (req, res, next) => {
  const sellerId = req.params.sellerId;

  // Find orders where the seller's ID matches
  const orders = await Order.find({
    "order_items.seller": sellerId,
  });

  // Initialize an array to hold monthly sales data
  const monthlySales = Array(12).fill(0);

  orders.forEach((order) => {
    const month = order.createdAt.getMonth();
    monthlySales[month] += order.total_price;
  });

  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  res.status(StatusCodes.OK).json({
    status: StatusCodes.OK,
    success: true,
    labels: monthNames,
    data: monthlySales,
  });
});

const getSaleStatisticDay = catchAsyncErrors(async (req, res, next) => {
  const sellerId = req.params.sellerId;

  // Find orders where the seller's ID matches
  const orders = await Order.find({
    "order_items.seller": sellerId,
  });

  const dailySales = new Array(31).fill(0); // Assuming max days in a month is 31

  // Calculate daily sales
  orders.forEach((order) => {
    const day = order.createdAt.getDate();
    dailySales[day - 1] += order.total_price;
  });

  const labels = dailySales.map((_, index) => {
    const date = new Date();
    date.setDate(index + 1);
    return `${date.toLocaleString("default", { month: "short" })} ${date
      .getDate()
      .toString()
      .padStart(2, "0")}`;
  });

  res.status(StatusCodes.OK).json({
    status: StatusCodes.OK,
    success: true,
    labels,
    data: dailySales,
  });
});

const getSaleStatisticWeek = catchAsyncErrors(async (req, res, next) => {
  const sellerId = req.params.sellerId;

  // Find orders where the seller's ID matches
  const orders = await Order.find({
    "order_items.seller": sellerId,
  });

  const weeklySales = new Array(4).fill(0);

  // Calculate weekly sales
  orders.forEach((order) => {
    const week = Math.floor(order.createdAt.getDate() / 7);
    weeklySales[week] += order.total_price;
  });

  const labels = weeklySales.map((_, index) => `Week ${index + 1}`);

  res.status(StatusCodes.OK).json({
    status: StatusCodes.OK,
    success: true,
    labels,
    data: weeklySales,
  });
});

// get ordered product state - seller
const getProductStates = catchAsyncErrors(async (req, res, next) => {
  const sellerId = req.params.sellerId;

  const completedOrders = await Order.find({
    "order_items.seller": sellerId,
    order_status: "Delivered",
  });

  const productStats = {};

  completedOrders.forEach((order) => {
    order.order_items.forEach((item) => {
      if (item.seller.toString() === sellerId) {
        const productId = item.product.toString();

        if (!productStats[productId]) {
          productStats[productId] = {
            product: null,
            totalQuantity: 0,
            totalPrice: 0,
          };
        }

        productStats[productId].totalQuantity += item.quantity;
        productStats[productId].totalPrice += item.total_price;
      }
    });
  });

  for (const productId in productStats) {
    const productInfo = await Product.findById(productId);
    productStats[productId].product = productInfo;
  }

  //Format the response as an array
  const response = Object.values(productStats);

  res.status(StatusCodes.OK).json({
    status: StatusCodes.OK,
    success: true,
    data: response,
  });
});

module.exports = {
  newOrder,
  getSingelOrder,
  getUserOrders,
  getOrderListForSeller,
  updateOrederProductStatus,
  getAllOrders,
  cancleOrderbyUser,
  getOrderLifetime,
  getSaleStatisticMonth,
  getSaleStatisticDay,
  getSaleStatisticWeek,
  getProductStates,
  checkTodayOrders,
  downloadOrderReport,
};
{
  /* <p>Total: ₹${formatPrice(item.total_price)}</p> */
}
