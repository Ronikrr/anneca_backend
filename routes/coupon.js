const express = require('express');
const { createCoupon, getAllCoupons, getCouponById, updateCoupon, deleteCoupon, applyCoupon } = require('../controller/couponController');
const router = express.Router();


// Coupon routes
router.post('/', createCoupon);
router.get('/', getAllCoupons);
router.get('/:id', getCouponById);
router.put('/:id', updateCoupon);
router.delete('/:id', deleteCoupon);

router.post('/apply', applyCoupon);

module.exports = router;
