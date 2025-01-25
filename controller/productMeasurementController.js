const catchAsyncErrors = require("../errors/catchAsyncErrors");
const ProductMeasurement = require("../models/productMeasurementModel");
const { StatusCodes } = require("http-status-codes");
const ErrorHander = require("../middleware/errorhander");
const { default: mongoose } = require("mongoose");

// Add or Update specific measurements for a product
const addOrUpdateProductMeasurements = catchAsyncErrors(async (req, res, next) => {
    const { productId, measurements } = req.body;

    let productMeasurement = await ProductMeasurement.findOne({ productId });

    if (productMeasurement) {
        // Update existing measurements array by size
        measurements.forEach(newMeasurement => {
            const existingMeasurementIndex = productMeasurement.measurements.findIndex(
                measurement => measurement.size === newMeasurement.size
            );

            if (existingMeasurementIndex !== -1) {
                // Update the existing measurement for this size
                productMeasurement.measurements[existingMeasurementIndex] = newMeasurement;
            } else {
                // Add a new measurement entry for the size
                productMeasurement.measurements.push(newMeasurement);
            }
        });

        await productMeasurement.save();
        res.status(StatusCodes.OK).json({
            success: true,
            status: StatusCodes.OK,
            data: productMeasurement,
            message: "Product measurements updated successfully."
        });
    } else {
        // If no previous record exists, create a new entry
        productMeasurement = await ProductMeasurement.create({
            productId,
            measurements
        });

        res.status(StatusCodes.CREATED).json({
            success: true,
            status: StatusCodes.CREATED,
            data: productMeasurement,
            message: "Product measurements added successfully."
        });
    }
});

// Get product measurements by product ID
const getProductMeasurementById = catchAsyncErrors(async (req, res, next) => {
    const { productId } = req.params;
var bb = {productId:productId}

    const measurement = await ProductMeasurement.findOne(bb);
    if (!measurement) {
        return next(new ErrorHander("Product measurement not found.", 404));
    }

    res.status(StatusCodes.OK).json({
        success: true,
        status: StatusCodes.OK,
        data: measurement
    });
});

// Remove product measurement
const removeProductMeasurement = catchAsyncErrors(async (req, res, next) => {
    const { id } = req.params;

    const measurement = await ProductMeasurement.findById(id);
    if (!measurement) {
        return next(new ErrorHander("Product measurement not found.", 404));
    }

    await measurement.remove();
    res.status(StatusCodes.OK).json({
        success: true,
        status: StatusCodes.OK,
        message: "Product measurement removed successfully"
    });
});

module.exports = {
    addOrUpdateProductMeasurements,
    getProductMeasurementById,
    removeProductMeasurement
};
