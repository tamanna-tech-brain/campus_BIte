
const express = require("express");
const Joi = require("joi");
const router = express.Router();

const orderController = require("../controllers/orderController");
const validate = require("../middleware/validate");
const { protect, authorize } = require("../middleware/authMiddleware");

const orderIdSchema = Joi.object({
  id: Joi.string().hex().length(24).required(),
}).unknown(false);

router.use(protect);

router.get(
  "/my",
  authorize("student"),
  orderController.getMyOrders
);

router.get(
  "/staff/queue",
  authorize("staff", "admin"),
  orderController.getStaffQueue
);

router.get(
  "/:id",
  validate(orderIdSchema, "params"),
  orderController.getOrderById
);

router.patch(
  "/:id/status",
  authorize("staff", "admin"),
  validate(orderIdSchema, "params"),
  orderController.updateOrderStatus
);

module.exports = router;
