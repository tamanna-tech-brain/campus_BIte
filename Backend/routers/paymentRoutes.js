
const express = require("express");
const Joi = require("joi");
const router = express.Router();

const paymentController = require("../controllers/paymentController");
const validate = require("../middleware/validate");
const { protect, authorize } = require("../middleware/authMiddleware");

const orderIdSchema = Joi.object({
  orderId: Joi.string().hex().length(24).required(),
}).unknown(false);

router.post(
  "/create/:orderId",
  protect,
  authorize("student"),
  validate(orderIdSchema, "params"),
  paymentController.createPaymentOrder
);

module.exports = router;
