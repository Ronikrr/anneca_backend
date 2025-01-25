const catchAsyncErrors = require("../errors/catchAsyncErrors")
const { StatusCodes } = require("http-status-codes");
const ProductCategory = require("../models/categoryModel");
const ErrorHander = require("../middleware/errorhander");
const Product = require("../models/productModel");

const createProductCategory = catchAsyncErrors(async (req, res, next) => {
    const { 
        name, 
        description, 
        status, 
        products, 
        url_key, 
        meta_title, 
        meta_keywords, 
        meta_description, 
        parent_category
    } = req.body;

    if (parent_category) {
        const parentCategoryExists = await ProductCategory.findById(parent_category);
        if (!parentCategoryExists) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                status: StatusCodes.BAD_REQUEST,
                success: false,
                message: `Parent category with ID ${parent_category} does not exist.`,
            });
        }
    }

    const productCategory = await ProductCategory.create({
        name,
        description,
        status,
        products,
        url_key,
        meta_title,
        meta_keywords,
        meta_description,
        parent_category: parent_category || null,
    });

    res.status(StatusCodes.CREATED).json({
        status: StatusCodes.CREATED,
        success: true,
        message: "Category created successfully",
        category: productCategory,
    });
});

// get all product category
const getAllProductCategory = catchAsyncErrors(async (req, res, next) => {
    const page = parseInt(req.query.page) || 1;  // Fixed cpont typo
    const count = parseInt(req.query.count) || 0;
    const limit = count > 0 ? count : 10; 
    const skip = (page - 1) * limit;

    const status = req.query.status === '1' ? 1 : req.query.status === '0' ? 0 : undefined;
    const includeInMenu = req.query.include_in_menu === '1' ? 1 : req.query.include_in_menu === '0' ? 0 : undefined;
    const searchQuery = req.query.searchText || '';

    const filterConditions = [];

    if (typeof status === 'number') {
        filterConditions.push({ status: status });
    }

    if (typeof includeInMenu === 'number') {
        filterConditions.push({ include_in_store_menu: includeInMenu });
    }

    if (searchQuery.trim() !== '') {
        filterConditions.push({ name: { $regex: searchQuery, $options: 'i' } });
    }

    let filter = {};
    if (filterConditions.length > 0) {
        filter = {
            $and: filterConditions,
        };
    }

    // Query the ProductCategory model and populate the parent_category field
    const allProductCategory = await ProductCategory.find(filter)
        .skip(skip)
        .limit(limit)
        .populate('parent_category', 'name'); // Populate parent_category field, only return the name

    const totalCategorysCount = await ProductCategory.countDocuments(filter);

    const totalPages = Math.ceil(totalCategorysCount / limit);

    res.status(StatusCodes.OK).json({
        data: allProductCategory,
        status: StatusCodes.OK,
        success: true,
        currentPage: page,
        totalPages: totalPages,
        countCategory: allProductCategory.length,
        totalCategorysCount,
    });
});

// update product category
const updateProductCategory = catchAsyncErrors(async (req, res, next) => {
    let category = await ProductCategory.findById(req.params.id)
    if (!category) {
        return next(new ErrorHander("Category not found", 404))
    }
    category = await ProductCategory.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
        useFindAndModify: false
    });
    res.status(StatusCodes.OK).json({
        status: StatusCodes.OK,
        success: true,
        data: category
    })
})

// add product in category and change
const addProductoncategory = catchAsyncErrors(async (req, res, next) => {
    const categoryId = req.params.categoryId;
    const { productIds } = req.body;

    const category = await ProductCategory.findById(categoryId);

    if (!category) {
        return next(new ErrorHander("Category not found", 404))
    }

    // Update each product's category and add to the category's products array
    for (const productId of productIds) {
        const product = await Product.findById(productId);
        if (product) {
            product.category = categoryId;
            await product.save();

            if (!category.products.includes(productId)) {
                category.products.push(productId);
            }
        }
    }

    await category.save();
    res.status(StatusCodes.OK).json({
        status: StatusCodes.OK,
        success: true,
        message: 'Products updated and added to category successfully'
    })
})

// remove product in category and change
const removeProductoncategory = catchAsyncErrors(async (req, res, next) => {
    const categoryId = req.params.categoryId;
    const { productIds } = req.body;

    const category = await ProductCategory.findById(categoryId);

    if (!category) {
        return next(new ErrorHander("Category not found", 404))
    }

    // Update each product's category and add to the category's products array
    for (const productId of productIds) {
        const product = await Product.findById(productId);
        if (product) {
            product.category = null; // Remove category reference
            await product.save();

            category.products = category.products.filter(p => p.toString() !== productId);
        }
    }

    await category.save();
    res.status(StatusCodes.OK).json({
        status: StatusCodes.OK,
        success: true,
        message: 'Products removed from category successfully'
    })
})

// get One category
const getOneProductCategory = catchAsyncErrors(async (req, res, next) => {
    let category = await ProductCategory.findById(req.params.id)
    if (!category) {
        return next(new ErrorHander("Category note found", 404))
    }
    res.status(StatusCodes.OK).json({
        status: StatusCodes.OK,
        success: true,
        data: category
    })
})

// delete meny category
const deleteProductCtegory = catchAsyncErrors(async (req, res, next) => {
    const categoryId = req.params.id;

    await ProductCategory.deleteMany({ _id: categoryId });

    res.status(StatusCodes.OK).json({
        status: StatusCodes.OK,
        success: true,
        message: "Categories deleted successfully"
    })
})

module.exports = {
    createProductCategory,
    getAllProductCategory,
    updateProductCategory,
    deleteProductCtegory,
    getOneProductCategory,
    addProductoncategory,
    removeProductoncategory
}