const express = require('express')

const {
    getAllProducts,
    getProductDetails,
    createProduct,
    updateProduct,
    deleteProduct,
    creatProductReview,
    getAllReview,
    deleteReview,
    getAllSellerProducts,
    getProductCategoryDetails,
    getReviewUser,
    enableProducts,
    disableProducts,
    getSimilarProduct,
    getFeaturedProducts,
    deleteProductImage,
    getPopularProducts
} = require('../controller/productController')

const {
    authenticateUser,
    authorizePermission
} = require('../middleware/auth')

const router = express.Router()

router
    .route("/")
    .get(getAllProducts)

router.get("/similar/:categoryId/:productId", getSimilarProduct);
router.get("/featured", getFeaturedProducts);
router.get("/popular", getPopularProducts);

router
    .route("/seller/product")
    .get(authenticateUser, authorizePermission("admin"), getAllSellerProducts)

router.route("/new")
    .post(authenticateUser, authorizePermission("admin"), createProduct)

router
    .route("/:id")
    .put(authenticateUser, authorizePermission("admin"), updateProduct)
router
    .route("/productImage/:id")
    .post(authenticateUser, authorizePermission("admin"), deleteProductImage)

router
    .route("/bulk-delete")
    .delete(authenticateUser, authorizePermission("admin"), deleteProduct);

router
    .route("/bulk-enable")
    .patch(authenticateUser, authorizePermission("admin"), enableProducts);

router
    .route("/bulk-disable")
    .patch(authenticateUser, authorizePermission("admin"), disableProducts);

router
    .route("/:id")
    .get(getProductDetails)

router
    .route("/category/:id")
    .get(getProductCategoryDetails)

router
    .route("/add-review")
    .post(authenticateUser, creatProductReview)

router.get("/get-review/:productId",getAllReview)
router.delete("/delete-review",authenticateUser, deleteReview)

router
    .route("/user/review")
    .get(authenticateUser, authorizePermission("user"), getReviewUser)

module.exports = router