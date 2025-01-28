const catchAsyncErrors = require("../errors/catchAsyncErrors");
const Product = require("../models/productModel");
const Category = require("../models/categoryModel");
const { StatusCodes } = require("http-status-codes");
const ApiFeatures = require("../utils/apifeatures");
const ErrorHander = require("../middleware/errorhander");
const userModel = require("../models/userModel");
const Review = require("../models/reviewsModel");
const cloudinary = require("cloudinary");

// create product

// const createProduct = catchAsyncErrors(async (req, res, next) => {
//     try {
//         if (!req.cloudinaryResults || req.cloudinaryResults.length === 0) {
//             return next(new ErrorHander("No file provided"));
//         }

//         const mediaLinks = req.cloudinaryResults.map((result) => ({
//             public_id: result.public_id,
//             url: result.secure_url,
//             resource_type: result.resource_type // This will be 'image' or 'video'
//         }));

//         const newPayload = { ...req.body, images: mediaLinks }

//         const product = await Product.create(newPayload);

//         res.status(StatusCodes.CREATED).json({
//             status: StatusCodes.CREATED,
//             success: true,
//             message: "Product created successfully",
//             product,
//         });
//     } catch (err) {
//         console.error(err);
//         res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
//             status: StatusCodes.INTERNAL_SERVER_ERROR,
//             success: false,
//             message: "Internal server error",
//         });
//     }
// });
const createProduct = catchAsyncErrors(async (req, res, next) => {
  try {
    if (!req.cloudinaryResults || req.cloudinaryResults.length === 0) {
      return next(new ErrorHander("No file provided"));
    }

    const mediaLinks = req.cloudinaryResults.map((result) => ({
      public_id: result.public_id,
      url: result.secure_url,
      resource_type: result.resource_type,
    }));

    const sizeSkus = JSON.parse(req.body.sizeSkus);

    const newPayload = {
      ...req.body,
      images: mediaLinks,
      sizeSkus: sizeSkus,
    };

    const product = await Product.create(newPayload);

    console.log(product)

    res.status(StatusCodes.CREATED).json({
      status: StatusCodes.CREATED,
      success: true,
      message: "Product created successfully",
      product,
    });
  } catch (err) {
    console.error(err);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: StatusCodes.INTERNAL_SERVER_ERROR,
      success: false,
      message: "Internal server error",
    });
  }
});

const getSimilarProduct = catchAsyncErrors(async (req, res, next) => {
  const { categoryId, productId } = req.params;

  try {
    if (!categoryId || !productId) {
      return res.status(400).json({
        success: false,
        message: "Missing categoryId or productId in request",
      });
    }

    const similarProducts = await Product.find({
      category: categoryId,
      _id: { $ne: productId },
    })
      .limit(5)
      .exec();

    if (!similarProducts || similarProducts.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No similar products found",
      });
    }

    const productsSummary = similarProducts.map((product) => ({
      id: product._id,
      name: product.name,
      image: product.images?.[0]?.url || null,
      price: product.price,
      weight: product.weight,
    }));

    res.status(200).json({
      success: true,
      products: productsSummary,
    });
  } catch (error) {
    console.error("Error fetching similar products:", error);

    res.status(500).json({
      success: false,
      message: "An error occurred while fetching similar products",
    });
  }
});

const getFeaturedProducts = catchAsyncErrors(async (req, res, next) => {
  try {
    const featuredProducts = await Product.find({ isFeatured: true })
      .limit(5)
      .exec();

    if (!featuredProducts || featuredProducts.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No featured products found",
      });
    }

    const productsSummary = featuredProducts.map((product) => ({
      id: product._id,
      name: product.name,
      image: product.images.length > 0 ? product.images[0].url : null,
      price: product.price,
      weight: product.weight,
    }));

    res.status(200).json({
      success: true,
      products: productsSummary,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

const getPopularProducts = catchAsyncErrors(async (req, res, next) => {
  try {
    const popularProducts = await Product.find({ isPopular: true })
      .limit(5)
      .exec();

    if (!popularProducts || popularProducts.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No popular products found",
      });
    }

    const productsSummary = popularProducts.map((product) => ({
      id: product._id,
      name: product.name,
      image: product.images.length > 0 ? product.images[0].url : null,
      price: product.price,
      weight: product.weight,
    }));

    res.status(200).json({
      success: true,
      products: productsSummary,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

//get all Product
// const getAllSellerProducts = catchAsyncErrors(async (req, res, next) => {
//     const sellerId = req.user.userId;

//     // Pagination
//     const page = parseInt(req.query.page) || 1;
//     const limit = 10;
//     const skip = (page - 1) * limit;

//     // Search
//     const searchQuery = req.query.search || '';
//     const searchFilter = searchQuery
//         ? { name: { $regex: searchQuery, $options: 'i' }, seller: sellerId }
//         : { seller: sellerId };

//     // Min/Max price filtering
//     const minPrice = parseFloat(req.query.minPrice) || 0;
//     const maxPrice = parseFloat(req.query.maxPrice) || Number.MAX_SAFE_INTEGER;
//     searchFilter.price = { $gte: minPrice, $lte: maxPrice };

//     // Category filtering
//     const category = req.query.category || '';
//     if (category) {
//         searchFilter.category = category;
//     }

//     const allProduct = await Product.find(searchFilter)
//         .select('-seller') // Exclude the 'seller' field from the response
//         .skip(skip)
//         .limit(limit)
//         .populate({ path: "category", select: { name: 1 } });

//     const totalProductsCount = await Product.countDocuments(searchFilter);

//     res.status(StatusCodes.OK).json({
//         data: allProduct,
//         status: StatusCodes.OK,
//         success: true,
//         currentPage: page,
//         totalPages: Math.ceil(totalProductsCount / limit),
//         totalProductsCount,
//         countProduct: allProduct.length
//     });
// })

const getAllSellerProducts = catchAsyncErrors(async (req, res, next) => {
  const sellerId = req.user.userId;

  // Pagination
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.count) || 10;
  const skip = (page - 1) * limit;

  // Search
  const searchQuery = req.query.searchText || "";
  const skuQuery = req.query.sku || "";
  const searchFilter = {
    seller: sellerId,
    $and: [
      {
        $or: [{ name: { $regex: searchQuery, $options: "i" } }],
      },
      {
        $or: [{ sku: { $regex: skuQuery, $options: "i" } }],
      },
    ],
  };

  // Min/Max price filtering
  const minPrice = parseFloat(req.query.minPrice) || 0;
  const maxPrice = parseFloat(req.query.maxPrice) || Number.MAX_SAFE_INTEGER;
  searchFilter.price = { $gte: minPrice, $lte: maxPrice };

  // Category filtering
  const category = req.query.category || "";
  if (category) {
    searchFilter.category = category;
  }

  // Quantity filtering
  const quantitySearch = req.query.quantity || "";
  if (quantitySearch) {
    searchFilter.quantity = parseInt(quantitySearch);
  }

  // Status filtering
  const status = req.query.status;
  if (status === "0" || status === "1") {
    searchFilter.status = parseInt(status);
  }

  const allProduct = await Product.find(searchFilter)
    .select("-seller") // Exclude the 'seller' field from the response
    .skip(skip)
    .limit(limit)
    .populate({ path: "category", select: { name: 1 } });

  const totalProductsCount = await Product.countDocuments(searchFilter);

  res.status(StatusCodes.OK).json({
    data: allProduct,
    status: StatusCodes.OK,
    success: true,
    currentPage: page,
    totalPages: Math.ceil(totalProductsCount / limit),
    totalProductsCount,
    countProduct: allProduct.length,
  });
});

const getAllProducts = catchAsyncErrors(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 12;
  const skip = (page - 1) * limit;

  let filters = {};
  const { search, minPrice, maxPrice, category } = req.query;

  if (search) {
    filters.name = { $regex: new RegExp(search, "i") };
  }
  if (minPrice || maxPrice) {
    filters.price = {};
    if (minPrice) filters.price.$gte = parseInt(minPrice);
    if (maxPrice) filters.price.$lte = parseInt(maxPrice);
  }

  if (category) {
    const parentCategory = await Category.findOne({
      name: { $regex: new RegExp(category, "i") },
    });
    if (!parentCategory) {
      return res.status(StatusCodes.NOT_FOUND).json({
        status: StatusCodes.NOT_FOUND,
        success: false,
        message: `Category with name "${category}" not found.`,
      });
    }
    const subcategories = await Category.find({
      parent_category: parentCategory._id,
    });
    const categoryIds = [
      parentCategory._id,
      ...subcategories.map((sub) => sub._id),
    ];
    filters.category = { $in: categoryIds };
  }
  const allProduct = await Product.find(filters)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate({ path: "category", select: { name: 1 } });

  const totalProductsCount = await Product.countDocuments(filters);

  res.status(StatusCodes.OK).json({
    data: allProduct,
    status: StatusCodes.OK,
    success: true,
    currentPage: page,
    totalPages: Math.ceil(totalProductsCount / limit),
    totalProductsCount,
  });
});

//get singel product
const getProductDetails = catchAsyncErrors(async (req, res, next) => {
  let product = await Product.findById(req.params.id).populate({
    path: "category",
    select: { name: 1 },
  });
  if (!product) {
    return next(new ErrorHander("Product note found", 404));
  }
  res.status(StatusCodes.OK).json({
    status: StatusCodes.OK,
    success: true,
    data: product,
  });
});

// find product by category

const getProductCategoryDetails = catchAsyncErrors(async (req, res, next) => {
  let product = await Product.find({ category: req.params.id }).populate({
    path: "category",
    select: { name: 1 },
  });
  if (!product) {
    return next(new ErrorHander("Product note found", 404));
  }
  res.status(StatusCodes.OK).json({
    status: StatusCodes.OK,
    success: true,
    data: product,
  });
});

// updateProduct --- Admin

// const updateProduct = catchAsyncErrors(async (req, res, next) => {
//   let product = await Product.findById(req.params.id);

//   if (!product) {
//     return next(new ErrorHander("Product note found", 404));
//   }
//   const mediaLinks = req.cloudinaryResults.map((result) => ({
//     public_id: result.public_id,
//     url: result.secure_url,
//     resource_type: result.resource_type,
//   }));
//   const sizeSkus = JSON.parse(req.body.sizeSkus);

//   const newPayload = {
//     ...req.body,
//     images: mediaLinks,
//     sizeSkus: sizeSkus,
//   };

//   product = await Product.findByIdAndUpdate(
//    {_id: req.params.id} ,

//     { $push: { image: {mediaLinks ,newPayload}}},
//     {
//       new: true,
//       runValidators: true,
//       useFindAndModify: false,
//     }
//   );
// console.log(product,"oooooo")
//   res.status(StatusCodes.OK).json({
//     status: StatusCodes.OK,
//     success: true,
//     message: "Product Updated successfully",
//   });
// });
const updateProduct = catchAsyncErrors(async (req, res, next) => {
    try {
      let product = await Product.findById(req.params.id);
  
      if (!product) {
        return next(new ErrorHander("Product not found", 404));
      }
  
      let newPayload = { ...req.body };
  
      if (req.cloudinaryResults && req.cloudinaryResults.length > 0) {
        const newMediaLinks = req.cloudinaryResults.map((result) => ({
          public_id: result.public_id,
          url: result.secure_url,
          resource_type: result.resource_type,
        }));
       
        newPayload.images = [...product.images, ...newMediaLinks];
      }
  
      if (req.body.sizeSkus) {
        newPayload.sizeSkus = JSON.parse(req.body.sizeSkus);
      }
  
    

      product = await Product.findByIdAndUpdate(
        req.params.id,
        newPayload,
        {
          new: true,
          runValidators: true,
          useFindAndModify: false,
        }
      );
  
      res.status(StatusCodes.OK).json({
        status: StatusCodes.OK,
        success: true,
        message: "Product Updated successfully",
        product, // Return updated product in response
      });
    } catch (err) {
      console.error(err);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        status: StatusCodes.INTERNAL_SERVER_ERROR,
        success: false,
        message: "Internal server error",
      });
    }
  });
  const deleteProductImage = catchAsyncErrors(async (req, res, next) => {
    const { id } = req.params; // Get product ID from URL params
    const { imageIndex } = req.body; // Get image index from request body
   console.log(req.body)
    try {
      // Find the product
      const product = await Product.findById(id);
      
      if (!product) {
        return res.status(404).json({
          success: false,
          message: "Product not found"
        });
      }
      
      // Remove the image from the array
      if (imageIndex >= 0 && imageIndex < product.images.length) {
        // Optional: Delete the actual file from storage here if needed
        // const imageToDelete = product.images[imageIndex];
        // await deleteFileFromStorage(imageToDelete.url);
        
        product.images.splice(imageIndex, 1);
        await product.save();
        
        return res.status(200).json({
          success: true,
          message: "Image deleted successfully",
          images: product.images
        });
      } else {
        return res.status(400).json({
          success: false,
          message: "Invalid image index"
        });
      }
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Error deleting image",
        error: error.message
      });
    }
  });

// 


const deleteProduct = catchAsyncErrors(async (req, res, next) => {
  const productIds = req.body.productIds;

  if (!Array.isArray(productIds) || productIds.length === 0) {
    return next(new ErrorHander("Invalid product IDs array", 400));
  }

  for (const id of productIds) {
    const product = await Product.findById(id);

    if (!product) {
      console.log(`Product not found: ${id}`);
      continue;
    }

    if (product.images.length > 0) {
      for (const image of product.images) {
        console.log("Deleting existing file:", image.public_id);
        await cloudinary.uploader.destroy(image.public_id);
      }
    } else {
      console.log("No existing file to delete");
    }

    await product.deleteOne();
    console.log(`Product deleted successfully: ${id}`);
  }

  res.status(StatusCodes.OK).json({
    status: StatusCodes.OK,
    success: true,
    message: "Products deleted successfully",
  });
});

const enableProducts = catchAsyncErrors(async (req, res, next) => {
  const productIds = req.body.productIds;

  if (!Array.isArray(productIds) || productIds.length === 0) {
    return next(new ErrorHander("Invalid product IDs array", 400));
  }

  await Product.updateMany(
    { _id: { $in: productIds } },
    { $set: { status: 1 } }
  );

  res.status(StatusCodes.OK).json({
    status: StatusCodes.OK,
    success: true,
    message: "Products enabled successfully",
  });
});

const disableProducts = catchAsyncErrors(async (req, res, next) => {
   
  const productIds = req.body.productIds;

  if (!Array.isArray(productIds) || productIds.length === 0) {
    return next(new ErrorHander("Invalid product IDs array", 400));
  }

  await Product.updateMany(
    { _id: { $in: productIds } },
    { $set: { status: 0 } }
  );

  res.status(StatusCodes.OK).json({
    status: StatusCodes.OK,
    success: true,
    message: "Products disabled successfully",
  });
});

const creatProductReview = catchAsyncErrors(async (req, res, next) => {
  const { rating, comment, productId } = req.body; // Ensure productId is coming from the request body

  const review = {
    user: req.user.userId,
    name: req.user.name,
    rating: Number(rating),
    comment,
  };

  const product = await Product.findById(productId); // Find product by productId from body
  if (!product) {
    return res.status(404).json({
      success: false,
      message: "Product not found",
    });
  }

  const isReviewed = product.reviews.find(
    (rev) => rev.user.toString() === req.user.userId.toString()
  );

  if (isReviewed) {
    product.reviews.forEach((rev) => {
      if (rev.user.toString() === req.user.userId.toString()) {
        rev.rating = rating;
        rev.comment = comment;
      }
    });
  } else {
    product.reviews.push(review);
  }

  product.numOfReviews = product.reviews.length;

  let avg = 0;
  product.reviews.forEach((rev) => {
    avg += rev.rating;
  });
  product.ratings = avg / product.reviews.length;

  await product.save({ validateBeforeSave: false });

  const newReviews = await Review.findOne({
    user: req.user.userId,
    product: productId,
  });
  if (newReviews) {
    newReviews.comment = comment;
    newReviews.rating = rating;
    await newReviews.save({ validateBeforeSave: false });
  } else {
    const newReview = new Review({
      user: req.user.userId,
      product: productId,
      comment: comment,
      rating: rating,
    });
    await newReview.save();
  }

  res.status(200).json({
    success: true,
    message: "Review added successfully",
  });
});

const getReviewUser = catchAsyncErrors(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 10;
  const skip = (page - 1) * limit;

  const reviews = await Review.find({ user: req.user.userId })
    .skip(skip)
    .limit(limit)
    .populate("product");

  if (!reviews) {
    return next(new ErrorHander("Reviews not found", 404));
  }

  const totalReviewsCount = reviews?.length;

  res.status(StatusCodes.OK).json({
    data: reviews,
    status: StatusCodes.OK,
    success: true,
    currentPage: page,
    totalPages: Math.ceil(totalReviewsCount / limit),
    totalReviewsCount,
  });
});

// get all Review
const getAllReview = catchAsyncErrors(async (req, res, next) => {
  const product = await Product.findById(req.params.productId);
  if (!product) {
    return next(new ErrorHander("Product not found", 404));
  }
  res.status(StatusCodes.OK).json({
    status: StatusCodes.OK,
    success: true,
    ratings: product.ratings,
    reviews: product.reviews,
  });
});

// delete Review
const deleteReview = catchAsyncErrors(async (req, res, next) => {
  const userId = req.query.userId;
  const productId = req.query.productId;
  const product = await Product.findById(productId);
  if (!product) {
    return next(new ErrorHander("Product not found", 404));
  }
  const reviews = product.reviews.filter(
    (rev) => rev._id?.toString() !== req.query.reviewId.toString()
  );
  let avg = 0;
  reviews.forEach((rev) => {
    avg += rev.rating;
  });
  let ratings = 0;
  reviews.length === 0 ? (ratings = 0) : (ratings = avg / reviews.length);
  const numOfReviews = reviews.length;
  await Product.findByIdAndUpdate(
    productId,
    {
      reviews,
      ratings,
      numOfReviews,
    },
    {
      new: true,
      runValidators: true,
      useFindAndModify: false,
    }
  );
  await Review.findOneAndRemove({ user: userId, product: productId });

  res.status(StatusCodes.OK).json({
    status: StatusCodes.OK,
    success: true,
    message: "Review deleted successfully",
  });
});

module.exports = {
  createProduct,
  getAllProducts,
  getAllSellerProducts,
  getProductDetails,
  updateProduct,
  deleteProductImage,
  deleteProduct,
  creatProductReview,
  getAllReview,
  deleteReview,
  getProductCategoryDetails,
  getReviewUser,
  enableProducts,
  disableProducts,
  getSimilarProduct,
  getFeaturedProducts,
  getPopularProducts
};
