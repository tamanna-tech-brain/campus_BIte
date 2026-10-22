
const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
    {
        orderNumber: {
            type: String,
            required: true,
            unique: true,
        },

        student: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },

        items: [
            {
                menuItem: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "MenuItem",
                    required: true,
                },
                name: {
                    type: String,
                    required: true,
                },
                price: {
                    type: Number,
                    required: true,
                    min: 0,
                },
                quantity: {
                    type: Number,
                    required: true,
                    min: 1,
                },
                subtotal: {
                    type: Number,
                    required: true,
                    min: 0,
                },
            },
        ],

        totalAmount: {
            type: Number,
            required: true,
            min: 0,
        },

        status: {
            type: String,
            enum: [
                "pending_payment",
                "placed",
                "preparing",
                "ready",
                "collected",
                "cancelled",
                "payment_failed",
            ],
            default: "pending_payment",
            index: true,
        },

        paymentStatus: {
            type: String,
            enum: ["pending", "paid", "failed", "refunded"],
            default: "pending",
        },

        stockRestored: {
            type: Boolean,
            default: false,
        },

        paymentExpiresAt: Date,
        placedAt: Date,
        preparingAt: Date,
        readyAt: Date,
        collectedAt: Date,

        staffAssigned: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
    },
    { timestamps: true }
);

orderSchema.index({ student: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: 1 });

module.exports = mongoose.model("Order", orderSchema);
