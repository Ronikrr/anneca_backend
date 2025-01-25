const express = require("express")

const {
    createProductCategory,
    getAllProductCategory,
    updateProductCategory,
    deleteProductCtegory,
    getOneProductCategory,
    addProductoncategory,
    removeProductoncategory
} = require('../controller/categoryController')

const {
    authenticateUser,
    authorizePermission
} = require('../middleware/auth')

const router = express.Router()

router
    .route("/")
    .get(getAllProductCategory)

router
    .route("/new")
    .post(authenticateUser, authorizePermission("admin"), createProductCategory)

router
    .route("/seller/category/update-with-products/:categoryId")
    .put(authenticateUser, authorizePermission("admin"), addProductoncategory)

router
    .route("/seller/category/remove-products/:categoryId")
    .put(authenticateUser, authorizePermission("admin"), removeProductoncategory)

router
    .route("/seller/category/:id")
    .put(authenticateUser, authorizePermission("admin"), updateProductCategory)
    .get(getOneProductCategory)
    .delete(authenticateUser, authorizePermission("admin"), deleteProductCtegory)

module.exports = router