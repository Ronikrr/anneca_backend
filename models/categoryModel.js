const mongoose = require("mongoose");

const productCategorySchema = mongoose.Schema({
    name: {
        type: String,
        required: [true, "Please Enter Category name"],
        unique: true,
    },
    description: {
        type: String,
        required: [true, "Please Enter Description"],
    },
    status: {
        type: Number,
        required: true,
        enum: [0, 1],  // 0 for inactive, 1 for active
        default: 0,
    },
    products: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
    }],
    parent_category: {  // New field for parent category reference
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        default: null,  // Default is null when no parent category is assigned
    },
    url_key: {
        type: String,
        default: "",
    },
    meta_title: {
        type: String,
        default: "",
    },
    meta_keywords: {
        type: String,
        default: "",
    },
    meta_description: {
        type: String,
        default: "",
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model("Category", productCategorySchema);