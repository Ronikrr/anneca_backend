const Coupon = require("../models/couponModel");


// Create a new coupon
exports.createCoupon = async (req, res) => {
  try {
    const coupon = new Coupon(req.body);
    await coupon.save();
    res.status(201).json({
      success: true,
      data: coupon
    });
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ success: false, message: 'Coupon code already exists' });
    } else {
      res.status(400).json({ success: false, message: error.message });
    }
  }
};

// Get all coupons
exports.getAllCoupons = async (req, res) => {
   
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: coupons });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get a specific coupon by ID
exports.getCouponById = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Coupon not found' });
    }
    res.status(200).json({ success: true, data: coupon });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update a coupon
exports.updateCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Coupon not found' });
    }
    res.status(200).json({ success: true, data: coupon });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Delete a coupon
exports.deleteCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndDelete(req.params.id);
    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Coupon not found' });
    }
    res.status(200).json({ success: true, message: 'Coupon deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.applyCoupon = async (req, res) => {
  try {
    const { code, totalPrice } = req.body;

   
    const coupon = await Coupon.findOne({ code });

    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Invalid coupon code' });
    }

    
    if (new Date() > coupon.expiryDate) {
      return res.status(400).json({ success: false, message: 'Coupon has expired' });
    }

  
    if (!coupon.isActive) {
      return res.status(400).json({ success: false, message: 'Coupon is not active' });
    }

    
    if (coupon.usageCount >= coupon.usageLimit) {
      return res.status(400).json({ success: false, message: 'Coupon usage limit reached' });
    }

    
    let discountedPrice = totalPrice;
    if (coupon.discountType === 'percentage') {
      discountedPrice = totalPrice - (totalPrice * (coupon.discountValue / 100));
    } else if (coupon.discountType === 'fixed') {
      discountedPrice = totalPrice - coupon.discountValue;
    }

   
    discountedPrice = Math.max(0, discountedPrice);

    coupon.usageCount += 1;
    await coupon.save();

    
    res.status(200).json({
      success: true,
      discountedPrice,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
