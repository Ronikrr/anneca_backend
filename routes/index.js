"use strict";
const express = require("express");
const router = express();
const multer = require("multer");
const cloudinary = require("cloudinary").v2; // Cloudinary package

cloudinary.config({
    cloud_name: 'dero2fjc8',
    api_key: '191372879618316',
    api_secret: 'O2jysO-EmSoy7ejeWzYDhR8YMK8'
});

// Multer setup
const storage = multer.memoryStorage(); // Store files in memory for Cloudinary upload
const localMulter = multer({ storage: storage });

// Middleware for uploading to Cloudinary
const uploadToCloudinary = (req, res, next) => {
    if (!req.files || req.files.length === 0) {
        return next();
    }

    const promises = req.files.map((file) => {
        return new Promise((resolve, reject) => {
            const uploadOptions = { folder: 'anneca' };
            if (file.mimetype.startsWith('video/')) {
                uploadOptions.resource_type = 'video';
            }

            cloudinary.uploader.upload_stream(uploadOptions, (error, result) => {
                if (error) {
                    return reject(error);
                }
                resolve(result);
            }).end(file.buffer);
        });
    });

    Promise.all(promises)
        .then((cloudinaryResults) => {
            req.cloudinaryResults = cloudinaryResults;
            next();
        })
        .catch((error) => {
            console.error("Error uploading to Cloudinary:", error);
            next(error);
        });
};

// Route imports
const product = require("./productRoute")
const productCategory = require("./productCategory")
const user = require("./userRoute")
const order = require("./orderRoute")
const payment = require("./paymentRoute")
const commen = require("./commenDataRoute")
const cart = require("./cartRoute")
const userAddress = require("./userAddressRoute")
const storInfo = require("./storeInfoRoute")
const Coupon = require("./coupon")
const productMeasurements = require("./productMeasurementRoutes")

router.use("/product", localMulter.array("media"), uploadToCloudinary, product)
router.use("/auth", user)
router.use("/order", order)
router.use("/category", productCategory)
router.use("/payment", payment)
router.use("/commen", commen)
router.use("/cart", cart)
router.use("/address", userAddress)
router.use("/store", storInfo)
router.use("/measurements", productMeasurements)
router.use("/coupon", Coupon)

module.exports = router;