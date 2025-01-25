const express = require("express")

const {
    authenticateUser,
    authorizePermission
} = require('../middleware/auth')

const { getStoreInfo, updateStoreInfo } = require("../controller/storeInfoController")
const router = express.Router()

router
    .route("/seller/storeInfo/:userId")
    .get(authenticateUser, authorizePermission("admin"), getStoreInfo)

router
    .route("/seller/storeInfo/:userId")
    .put(authenticateUser, authorizePermission("admin"), updateStoreInfo)

module.exports = router