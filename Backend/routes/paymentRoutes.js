const express = require("express");
const Joi = require("joi");
const router = express.Router();
const paymentController = require("../controllers/Payment");
const validate = require("../middleware/Validate");
const { protect, authorize } = require("../middleware/authMiddleware");

const orderIdParamSchema = Joi.object({
    orderId: Joi.string().hex().length(24).required(),
}).unknown(false);

const verifyPaymentSchema = Joi.object({
    orderId: Joi.string().hex().length(24).required(),
    razorpayOrderId: Joi.string().allow("").optional(),
    razorpayPaymentId: Joi.string().allow("").optional(),
    razorpaySignature: Joi.string().allow("").optional(),
}).unknown(false);

// Create payment order
router.post(
    "/create/:orderId",
    protect,
    authorize("student"),
    validate(orderIdParamSchema, "params"),
    paymentController.createPaymentOrder
);

// Verify client-side Razorpay payment
router.post(
    "/verify",
    protect,
    authorize("student"),
    validate(verifyPaymentSchema, "body"),
    paymentController.verifyPayment
);

module.exports = router;
