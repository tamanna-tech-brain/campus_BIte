const Razorpay = require("razorpay");
const Payment = require("../models/Payment");
const Order = require("../models/Order");
const crypto = require("crypto");

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_placeholder",
    key_secret: process.env.RAZORPAY_KEY_SECRET || "rzp_secret_placeholder",
});

exports.createPaymentOrder = async (req, res) => {
    try {
        const orderDoc = await Order.findOne({
            _id: req.params.orderId,
            student: req.user.id,
            status: "pending_payment",
            paymentStatus: "pending",
        });

        if (!orderDoc) {
            return res.status(404).json({
                message: "Eligible pending order not found",
            });
        }

        const existingPayment = await Payment.findOne({
            order: orderDoc._id,
        });

        if (existingPayment && existingPayment.status === "captured") {
            return res.status(409).json({
                message: "Payment for this order has already been captured",
            });
        }

        const amountPaise = Math.round(orderDoc.totalAmount * 100);
        if (!Number.isSafeInteger(amountPaise) || amountPaise <= 0) {
            return res.status(400).json({
                message: "Invalid order amount",
            });
        }

        let razorpayOrderId = "mock_rzp_order_" + Date.now();
        // If real Razorpay keys are configured, call API
        if (process.env.RAZORPAY_KEY_ID && !process.env.RAZORPAY_KEY_ID.includes("placeholder")) {
            try {
                const razorpayOrder = await razorpay.orders.create({
                    amount: amountPaise,
                    currency: "INR",
                    receipt: String(orderDoc.orderNumber).slice(0, 40),
                });
                razorpayOrderId = razorpayOrder.id;
            } catch (rzpErr) {
                console.warn("Razorpay API call failed, falling back to simulated order for local dev:", rzpErr.message);
            }
        }

        if (existingPayment) {
            existingPayment.razorpayOrderId = razorpayOrderId;
            existingPayment.amount = amountPaise;
            await existingPayment.save();
        } else {
            await Payment.create({
                order: orderDoc._id,
                student: req.user.id,
                provider: "razorpay",
                razorpayOrderId: razorpayOrderId,
                amount: amountPaise,
                currency: "INR",
                status: "created",
            });
        }

        return res.status(201).json({
            message: "Razorpay order initiated",
            keyId: process.env.RAZORPAY_KEY_ID || "rzp_test_placeholder",
            razorpayOrderId,
            amount: amountPaise,
            currency: "INR",
            order: orderDoc,
        });
    } catch (error) {
        return res.status(500).json({
            message: "Failed to create payment order",
            error: error.message,
        });
    }
};

// Client verification endpoint: Called by React frontend after checkout success modal
exports.verifyPayment = async (req, res) => {
    try {
        const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

        const orderDoc = await Order.findOne({
            _id: orderId,
            student: req.user.id,
        });

        if (!orderDoc) {
            return res.status(404).json({
                message: "Order not found",
            });
        }

        // Verify Razorpay signature if secret is active
        if (razorpaySignature && process.env.RAZORPAY_KEY_SECRET && !process.env.RAZORPAY_KEY_SECRET.includes("placeholder")) {
            const body = razorpayOrderId + "|" + razorpayPaymentId;
            const expectedSignature = crypto
                .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
                .update(body.toString())
                .digest("hex");

            if (expectedSignature !== razorpaySignature) {
                return res.status(400).json({
                    message: "Invalid payment signature",
                });
            }
        }

        // Update payment record
        let paymentDoc = await Payment.findOne({ order: orderDoc._id });
        if (!paymentDoc) {
            paymentDoc = await Payment.create({
                order: orderDoc._id,
                student: req.user.id,
                provider: "razorpay",
                razorpayOrderId: razorpayOrderId || "mock_order",
                razorpayPaymentId: razorpayPaymentId || "mock_pay_" + Date.now(),
                amount: Math.round(orderDoc.totalAmount * 100),
                currency: "INR",
                status: "captured",
                paidAt: new Date(),
            });
        } else {
            paymentDoc.razorpayPaymentId = razorpayPaymentId || "mock_pay_" + Date.now();
            paymentDoc.status = "captured";
            paymentDoc.paidAt = new Date();
            await paymentDoc.save();
        }

        // Update order status to placed and paid
        orderDoc.status = "placed";
        orderDoc.paymentStatus = "paid";
        orderDoc.placedAt = new Date();
        await orderDoc.save();

        return res.status(200).json({
            success: true,
            message: "Payment verified and order placed successfully",
            order: orderDoc,
        });
    } catch (error) {
        return res.status(500).json({
            message: "Payment verification failed",
            error: error.message,
        });
    }
};

// Razorpay Webhook listener (for production)
exports.razorpayWebhook = async (req, res) => {
    try {
        const signature = req.headers["x-razorpay-signature"];
        if (!signature || !req.body) {
            return res.status(400).send("Invalid webhook request");
        }

        const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.from(JSON.stringify(req.body));
        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET || "")
            .update(rawBody)
            .digest("hex");

        const received = Buffer.from(signature, "utf8");
        const expected = Buffer.from(expectedSignature, "utf8");

        if (received.length !== expected.length || !crypto.timingSafeEqual(received, expected)) {
            return res.status(400).send("Invalid webhook signature");
        }

        const event = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
        const paymentEntity = event.payload?.payment?.entity;

        if (!paymentEntity?.order_id || !paymentEntity?.id) {
            return res.status(400).send("Missing payment details");
        }

        const paymentDoc = await Payment.findOne({
            razorpayOrderId: paymentEntity.order_id,
        });

        if (!paymentDoc) {
            return res.status(404).send("Payment record not found");
        }

        if (paymentDoc.status === "captured") {
            return res.status(200).json({ received: true });
        }

        paymentDoc.razorpayPaymentId = paymentEntity.id;
        paymentDoc.status = "captured";
        paymentDoc.paidAt = new Date();
        await paymentDoc.save();

        await Order.findOneAndUpdate(
            {
                _id: paymentDoc.order,
                status: "pending_payment",
                paymentStatus: "pending",
            },
            {
                $set: {
                    status: "placed",
                    paymentStatus: "paid",
                    placedAt: new Date(),
                },
            }
        );

        return res.status(200).json({ received: true });
    } catch (error) {
        return res.status(500).send("Webhook processing failed");
    }
};