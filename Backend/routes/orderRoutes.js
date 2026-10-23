const express = require("express");
const router = express.Router();
const orderController = require("../controllers/OrderController");
const validate = require("../middleware/Validate");
const { protect, authorize } = require("../middleware/authMiddleware");

const {
    orderIdSchema,
    updateOrderStatusSchema,
} = require("../validators/orderValidator");

router.use(protect);

// Student creates order from cart
router.post(
    "/checkout",
    authorize("student"),
    orderController.createOrder
);

// Student views their order history
router.get(
    "/my",
    authorize("student"),
    orderController.getMyOrders
);

// Staff / Admin kitchen queue
router.get(
    "/staff/queue",
    authorize("staff", "admin"),
    orderController.getStaffQueue
);

// View single order
router.get(
    "/:id",
    validate(orderIdSchema, "params"),
    orderController.getOrderById
);

// Staff / Admin update order preparation status
router.patch(
    "/:id/status",
    authorize("staff", "admin"),
    validate(orderIdSchema, "params"),
    validate(updateOrderStatusSchema),
    orderController.updateOrderStatus
);

// Cancel order
router.patch(
    "/:id/cancel",
    validate(orderIdSchema, "params"),
    orderController.cancelOrder
);

module.exports = router;
