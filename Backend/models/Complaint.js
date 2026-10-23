const mongoose = require("mongoose");
const crypto = require("crypto");

const attachmentSchema = new mongoose.Schema(
    {
        url: {
            type: String,
            required: true,
        },
        publicId: {
            type: String,
            required: true,
        },
        resourceType: {
            type: String,
            enum: ["image", "video"],
            required: true,
        },
        format: String,
        bytes: Number,
    },
    { _id: false }
);

const statusHistorySchema = new mongoose.Schema(
    {
        status: {
            type: String,
            enum: ["open", "in_review", "resolved", "rejected"],
            required: true,
        },
        changedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        note: {
            type: String,
            trim: true,
            maxlength: 1000,
            default: "",
        },
        changedAt: {
            type: Date,
            default: Date.now,
        },
    },
    { _id: false }
);

const complaintSchema = new mongoose.Schema(
    {
        complaintNumber: {
            type: String,
            unique: true,
            required: true,
            default: () =>
                "CB-" + crypto.randomBytes(5).toString("hex").toUpperCase(),
        },

        student: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },

        order: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Order",
            default: null,
        },

        category: {
            type: String,
            enum: [
                "wrong_order",
                "missing_item",
                "food_quality",
                "hygiene",
                "payment",
                "staff_behavior",
                "other",
            ],
            required: true,
        },

        description: {
            type: String,
            required: true,
            trim: true,
            minlength: 10,
            maxlength: 2000,
        },

        attachments: {
            type: [attachmentSchema],
            default: [],
        },

        status: {
            type: String,
            enum: ["open", "in_review", "resolved", "rejected"],
            default: "open",
            index: true,
        },

        assignedTo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },

        resolutionNote: {
            type: String,
            trim: true,
            maxlength: 1000,
            default: "",
        },

        statusHistory: {
            type: [statusHistorySchema],
            default: [],
        },

        resolvedAt: {
            type: Date,
            default: null,
        },
    },
    { timestamps: true }
);

complaintSchema.index({ student: 1, createdAt: -1 });
complaintSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.models.Complaint || mongoose.model("Complaint", complaintSchema);
