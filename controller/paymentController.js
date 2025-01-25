const Razorpay = require("razorpay");
const crypto = require("crypto");
const axios = require("axios");

const UserAddress = require("../models/userAddresModel");
const Order = require("../models/orderModel");
const productModel = require("../models/productModel");

// live
const razorpayInstance = new Razorpay({
  key_id: "rzp_live_Kj4UB5uRmQsvf7",
  key_secret: "mCh31xM76nqPFP5aACpi8ty5",
});
// const razorpayInstance = new Razorpay({
//   key_id: "rzp_test_imXSQj8w4l8YC5",
//   key_secret: "1HNBJZCDD6jgbxKJGDIubzbj",
// });

// Create Order
exports.createOrder = async (req, res) => {
  try {
    const {
      amount,
      currency,
      id,
      quantity,
      paymentMethod,
      address,
      items,
      coupon,
      size,
      sku,
    } = req.body;

    const loginResponse = await axios.post(
      "https://api.nimbuspost.com/v1/users/login",
      {
        email: "vijaydobariya24+1775@gmail.com",
        password: "pZFqmNcK20",
      }
    );
    const token = loginResponse.data.data;

    const options = {
      amount: amount,
      currency: currency || "INR",
      receipt: `receipt_order_${new Date().getTime()}`,
      payment_capture: 1,
    };

    razorpayInstance.orders
      .all()
      .then(() => {
        console.log("Authentication successful");
      })
      .catch((error) => {
        console.log("Error in authentication:", error);
      });

    const userData = req.user;

    const order = await razorpayInstance.orders.create(options);

    let userAddress = await UserAddress.findOne({
      user: userData?.userId,
    }).sort({ createdAt: -1 });

    if (!userAddress) {
      return res.status(400).json({
        success: false,
        message: "User address not found",
      });
    }

    userAddress = { ...userAddress._doc };

    // Handle single product (if 'id' and 'quantity' are provided)
    let orderItems = [];
    if (id && quantity) {
      let product = await productModel.findOne({ _id: id });

      orderItems.push({
        product_price: product.weight,
        quantity: quantity,
        total_price: amount,
        seller: userData.userId,
        status: "Confirmed",
        product: id,
        size: size || product.size[0],
        sku: sku,
      });
    }

    // Handle multiple products (if 'items' array is provided)
    if (items && Array.isArray(items) && items.length > 0) {
      for (let item of items) {
        let product = await productModel.findOne({ _id: item.id });

        orderItems.push({
          product_price: product.weight,
          quantity: item.quantity,
          total_price: product.weight * item.quantity * 100,
          seller: userData.userId,
          status: "Confirmed",
          product: item.id,
          size: item.size,
          sku: item.sku,
        });
      }
    }

    const newOrder = new Order({
      shippingInfo: {
        frist_name: address.first_name,
        last_name: address.last_name,
        address: address.address,
        city: address.city,
        state: address.state,
        country: "India",
        postal_code: address.postal_code,
        email: address.email,
        phone_no: address.phone_no,
      },
      order_items: orderItems,
      user: userData.userId,
      payment_info: {
        id: order.id,
        status: "Paid",
      },
      paidAt: new Date(),
      items_price: 100,
      tax_price: 0,
      shipping_price: 40,
      total_price: amount,
      order_status: "Processing",
    });

    await newOrder.save();

    let codorder = [];

    // Handling single product case
    if (id && quantity) {
      let product = await productModel.findOne({ _id: id });
      product.quantity -= quantity;
      product.save();
      if (!product) {
        return res.status(400).json({
          success: false,
          message: `Product with id ${id} not found`,
        });
      }

      codorder.push({
        name: product.name,
        qty: quantity,
        price: product.weight,
        sku: sku,
        size: size,
      });
    }

    if (items && Array.isArray(items) && items.length > 0) {
      for (let index = 0; index < items.length; index++) {
        let item = items[index];
        let product = await productModel.findOne({ _id: item.id });
        product.quantity -= item.quantity;
        product.save();
        // Construct SKU based on index (e.g., sku001, sku002, etc.)
        // let sku = `sku${String(index + 1).padStart(3, '0')}`; // Ensures SKU is in the format sku001, sku002, etc.

        codorder.push({
          name: product.name,
          qty: item.quantity,
          price: product.weight, // This seems to refer to the weight; ensure it's the right field.
          sku: item.sku,
          size: item.size,
        });
      }
    }

    if (paymentMethod === "cod") {
      const shipmentResponse = await axios.post(
        "https://api.nimbuspost.com/v1/shipments",
        {
          order_number: "order_" + new Date().getTime(),
          shipping_charges: 0,
          discount: 0,
          cod_charges: 0,
          payment_type: paymentMethod,
          order_amount: amount / 100,
          package_weight: 400,
          package_length: 26,
          package_breadth: 22,
          package_height: 4,
          consignee: {
            name: `${address.first_name} ${address.last_name}`,
            address: address.address,
            address_2: "",
            city: address.city,
            state: address.state,
            pincode: address.postal_code,
            phone: address.phone_no.toString(),
          },
          pickup: {
            warehouse_name: "warehouse 1",
            name: "Vikalp Sharma",
            address:
              "30, 2nd floor, 2nd gali, new estate, near T.V Coumpund, opp pani tanki",
            address_2: "Road No-6 udhna-Surat",
            city: "surat",
            state: "gujarat",
            pincode: "394210",
            phone: "9978141527",
          },
          order_items: codorder,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
    }

    res.status(200).json({
      success: true,
      order,
      newOrder,
    });
  } catch (error) {
    console.error("Error in creating Razorpay order:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create order",
      error: error.message,
    });
  }
};

// Verify Payment
exports.verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      id,
      quantity,
      amount,
      paymentMethod,
      address,
      items,
      coupon,
      size,
      sku,
    } = req.body;

    // Validate if at least single product (id) or multiple products (items) are present
    if (!id && (!items || !Array.isArray(items) || items.length === 0)) {
      return res.status(400).json({
        success: false,
        message: "Product id or items array must be provided",
      });
    }

    // Generate the expected signature
    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac("sha256", razorpayInstance.key_secret)
      .update(sign.toString())
      .digest("hex");

    // Check if the signatures match
    if (razorpay_signature === expectedSign) {
      const loginResponse = await axios.post(
        "https://api.nimbuspost.com/v1/users/login",
        {
          email: "vijaydobariya24+1775@gmail.com",
          password: "pZFqmNcK20",
        }
      );

      const token = loginResponse.data.data;
      const userData = req.user;

      let userAddress = await UserAddress.findOne({
        user: userData?.userId,
      }).sort({ createdAt: -1 });

      if (!userAddress) {
        return res.status(400).json({
          success: false,
          message: "User address not found",
        });
      }

      userAddress = { ...userAddress._doc };

      // Prepare order items
      let orderItems = [];

      // Handling single product case
      if (id && quantity) {
        let product = await productModel.findOne({ _id: id });
        product.quantity -= quantity;
        product.save();

        if (!product) {
          return res.status(400).json({
            success: false,
            message: `Product with id ${id} not found`,
          });
        }

        orderItems.push({
          name: product.name,
          qty: quantity,
          price: product.weight,
          sku: sku,
          size: size,
        });
      }

      // Handling multiple product case
      if (items && Array.isArray(items)) {
        for (let item of items) {
          let product = await productModel.findOne({ _id: item.id });
          product.quantity -= item.quantity;
          product.save();
          if (!product) {
            return res.status(400).json({
              success: false,
              message: `Product with id ${item.id} not found`,
            });
          }

          orderItems.push({
            name: product.name,
            qty: item.quantity,
            price: product.weight,
            sku: item.sku,
            size: item.size,
          });
        }
      }

      // Creating shipment
      const shipmentResponse = await axios.post(
        "https://api.nimbuspost.com/v1/shipments",
        {
          order_number: razorpay_order_id,
          shipping_charges: 0,
          discount: 0,
          cod_charges: 0,
          payment_type: paymentMethod,
          order_amount: amount,
          package_weight: 400,
          package_length: 26,
          package_breadth: 22,
          package_height: 4,
          consignee: {
            name: `${address.first_name} ${address.last_name}`,
            address: address.address,
            address_2: "",
            city: address.city,
            state: address.state,
            pincode: address.postal_code,
            phone: address.phone_no.toString(),
          },
          pickup: {
            warehouse_name: "warehouse 1",
            name: "Vikalp Sharma",
            address:
              "30, 2nd floor, 2nd gali, new estate, near T.V Coumpund, opp pani tanki",
            address_2: "Road No-6 udhna-Surat",
            city: "surat",
            state: "gujarat",
            pincode: "394210",
            phone: "9978141527",
          },
          order_items: orderItems, // Use the orderItems array here
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      res.status(200).json({
        success: true,
        message: "Payment verified successfully and shipment created",
        shipmentDetails: shipmentResponse.data,
        address,
      });
    } else {
      res
        .status(400)
        .json({ success: false, message: "Invalid signature sent!" });
    }
  } catch (error) {
    console.error("Error in verifying payment:", error);
    res.status(500).json({
      success: false,
      message: "Failed to verify payment",
      error: error.message,
    });
  }
};
