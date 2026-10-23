const Order = require("../models/Order");
const Cart = require("../models/Cart");
const MenuItem = require("../models/MenuItem");
const crypto = require("crypto");

// Student: Create order from cart (Checkout)
exports.createOrder = async (req, res) => {
    try {
        const cart = await Cart.findOne({ student: req.user.id }).populate("items.menuItem");

        if (!cart || !cart.items || cart.items.length === 0) {
            return res.status(400).json({
                message: "Your cart is empty. Add items before checking out.",
            });
        }

        const orderItems = [];
        let totalAmount = 0;

        // Verify availability and stock for each item
        for (const cartItem of cart.items) {
            const item = cartItem.menuItem;
            if (!item || !item.isAvailable) {
                return res.status(400).json({
                    message: `Item "${item ? item.name : "Unknown"}" is no longer available`,
                });
            }

            if (item.availableStock < cartItem.quantity) {
                return res.status(400).json({
                    message: `Insufficient stock for "${item.name}". Only ${item.availableStock} available`,
                });
            }

            const subtotal = item.price * cartItem.quantity;
            totalAmount += subtotal;

            orderItems.push({
                menuItem: item._id,
                name: item.name,
                price: item.price,
                quantity: cartItem.quantity,
                subtotal,
            });
        }

        // Atomically decrement stock
        for (const orderItem of orderItems) {
            await MenuItem.findByIdAndUpdate(orderItem.menuItem, {
                $inc: { availableStock: -orderItem.quantity },
            });
        }

        const orderNumber = "CB-" + Date.now().toString().slice(-6) + "-" + crypto.randomBytes(2).toString("hex").toUpperCase();

        const order = await Order.create({
            orderNumber,
            student: req.user.id,
            items: orderItems,
            totalAmount,
            status: "pending_payment",
            paymentStatus: "pending",
            stockReserved: true,
            stockRestored: false,
            paymentExpiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 mins to complete payment
        });

        // Clear cart after creating order
        cart.items = [];
        await cart.save();

        return res.status(201).json({
            message: "Order placed successfully. Please proceed to payment.",
            order,
        });
    } catch (error) {
        return res.status(500).json({
            message: "Failed to create order",
            error: error.message,
        });
    }
};

// Student: Get all my orders
exports.getMyOrders = async (req, res) => {
    try {
        const orders = await Order.find({
            student: req.user.id,
        })
            .populate("items.menuItem", "name imageUrl category")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            count: orders.length,
            orders,
        });
    } catch (error) {
        return res.status(500).json({
            message: "Failed to fetch orders",
            error: error.message,
        });
    }
};

// Student / Staff / Admin: Get single order details
exports.getOrderById = async (req, res) => {
    try {
        const filter = { _id: req.params.id };

        if (req.user.role === "student") {
            filter.student = req.user.id;
        }

        const order = await Order.findOne(filter)
            .populate("student", "name email")
            .populate("staffAssigned", "name")
            .populate("items.menuItem", "name imageUrl category");

        if (!order) {
            return res.status(404).json({
                message: "Order not found",
            });
        }

        return res.status(200).json({ order });
    } catch (error) {
        return res.status(500).json({
            message: "Failed to fetch order",
            error: error.message,
        });
    }
};

// Staff / Admin: Active kitchen order queue
exports.getStaffQueue = async (req, res) => {
    try {
        const orders = await Order.find({
            status: { $in: ["placed", "preparing", "ready"] },
            paymentStatus: "paid",
        })
            .populate("student", "name email")
            .populate("staffAssigned", "name")
            .sort({ createdAt: 1 });

        return res.status(200).json({
            count: orders.length,
            orders,
        });
    } catch (error) {
        return res.status(500).json({
            message: "Failed to fetch order queue",
            error: error.message,
        });
    }
};

// Staff / Admin: Update order preparation status
exports.updateOrderStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const allowedTransitions = {
            placed: ["preparing"],
            preparing: ["ready"],
            ready: ["collected"],
        };

        if (!allowedTransitions[status] && status !== "preparing" && status !== "ready" && status !== "collected") {
            return res.status(400).json({
                message: "Invalid target status",
            });
        }

        const order = await Order.findOne({
            _id: req.params.id,
            paymentStatus: "paid",
        });

        if (!order) {
            return res.status(404).json({
                message: "Eligible paid order not found",
            });
        }

        const validNextSteps = allowedTransitions[order.status] || [];
        if (!validNextSteps.includes(status)) {
            return res.status(400).json({
                message: `Cannot transition order status from "${order.status}" to "${status}"`,
            });
        }

        const timestampField = {
            preparing: "preparingAt",
            ready: "readyAt",
            collected: "collectedAt",
        }[status];

        const updateData = {
            status,
            staffAssigned: req.user.id,
        };

        if (timestampField) {
            updateData[timestampField] = new Date();
        }

        const updatedOrder = await Order.findOneAndUpdate(
            {
                _id: order._id,
                status: order.status,
            },
            {
                $set: updateData,
            },
            { new: true, runValidators: true }
        );

        if (!updatedOrder) {
            return res.status(409).json({
                message: "Order was updated concurrently; please refresh and retry",
            });
        }

        return res.status(200).json({
            message: "Order status updated successfully",
            order: updatedOrder,
        });
    } catch (error) {
        return res.status(500).json({
            message: "Failed to update order status",
            error: error.message,
        });
    }
};

// Student or Admin: Cancel order and restore stock
exports.cancelOrder = async (req, res) => {
    try {
        const filter = { _id: req.params.id };
        if (req.user.role === "student") {
            filter.student = req.user.id;
        }

        const order = await Order.findOne(filter);
        if (!order) {
            return res.status(404).json({
                message: "Order not found",
            });
        }

        if (["preparing", "ready", "collected"].includes(order.status)) {
            return res.status(400).json({
                message: "Order cannot be cancelled as preparation has already started",
            });
        }

        if (order.status === "cancelled") {
            return res.status(400).json({
                message: "Order is already cancelled",
            });
        }

        // Restore stock if reserved and not yet restored
        if (order.stockReserved && !order.stockRestored) {
            for (const item of order.items) {
                await MenuItem.findByIdAndUpdate(item.menuItem, {
                    $inc: { availableStock: item.quantity },
                });
            }
            order.stockRestored = true;
        }

        order.status = "cancelled";
        await order.save();

        return res.status(200).json({
            message: "Order cancelled successfully",
            order,
        });
    } catch (error) {
        return res.status(500).json({
            message: "Failed to cancel order",
            error: error.message,
        });
    }
};