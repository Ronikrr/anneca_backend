const mongoose = require("mongoose");

const measurementSchema = mongoose.Schema({
    size: {
        type: String,
        required: true,
    },
    age: {
        type: String,
        required: true,
    },
    chest: {
        type: Number,
    },
    dressLength: {
        type: Number,
    },
    waist: {
        type: Number,
    },
    shortLength: {
        type: Number,
    },
    frokLength: {
        type: Number,
    },
    topLength: {
        type: Number,
    },
    skirtLength: {
        type: Number,
    },
    blouseLength: {
        type: Number,
    },
    bottomLength: {
        type: Number,
    },
});

const productMeasurementSchema = mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true,
    },
    measurements: [measurementSchema],
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model("ProductMeasurement", productMeasurementSchema);
