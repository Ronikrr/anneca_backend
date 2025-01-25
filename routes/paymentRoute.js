const express = require('express');
const router = express.Router();
const razorpayController = require('../controller/paymentController');
const { authenticateUser } = require('../middleware/auth');

router.post('/create-order',authenticateUser, razorpayController.createOrder);
router.post('/verify-payment',authenticateUser, razorpayController.verifyPayment);

module.exports = router;
