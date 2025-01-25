const express = require("express");
const {
    addOrUpdateProductMeasurements,
    getProductMeasurementById,
    removeProductMeasurement
} = require("../controller/productMeasurementController");

const router = express.Router();

router.post("/add", addOrUpdateProductMeasurements);
router.get("/:productId", getProductMeasurementById);
router.delete("/:id", removeProductMeasurement);

module.exports = router;
