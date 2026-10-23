const mongoose = require("mongoose");

const menuItemSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            default: "",
            trim: true,
        },
        category: {
            type: String,
            required: true,
            trim: true,
        },
        price: {
            type: Number,
            required: true,
            min: 0,
        },
        imageUrl: {
            type: String,
            default: "",
            trim: true,
        },
        totalStock: {
            type: Number,
            required: true,
            min: 0,
            default: 0,
        },
        availableStock: {
            type: Number,
            required: true,
            min: 0,
            default: 0,
        },
        stockDate: {
            type: String,
            default: () => new Date().toISOString().slice(0, 10),
        },
        isAvailable: {
            type: Boolean,
            default: true,
        },
        averageRating: {
            type: Number,
            default: 0,
            min: 0,
            max: 5,
        },
        numReviews: {
            type: Number,
            default: 0,
            min: 0,
        },
        updatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
    },
    { timestamps: true }
);

menuItemSchema.index({ category: 1, isAvailable: 1 });
menuItemSchema.index({ name: 1 });

module.exports = mongoose.models.MenuItem || mongoose.model("MenuItem", menuItemSchema);