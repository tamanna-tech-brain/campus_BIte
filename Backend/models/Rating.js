const mongoose = require("mongoose");

const ratingSchema = new mongoose.Schema(
    {
        student: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        menuItem: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "MenuItem",
            required: true,
            index: true,
        },
        order: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Order",
            default: null,
        },
        rating: {
            type: Number,
            required: [true, "Rating is required"],
            min: [1, "Rating must be at least 1"],
            max: [5, "Rating cannot exceed 5"],
        },
        review: {
            type: String,
            trim: true,
            maxlength: [1000, "Review cannot exceed 1000 characters"],
            default: "",
        },
    },
    { timestamps: true }
);

// Prevent duplicate review per student per menuItem
ratingSchema.index({ student: 1, menuItem: 1 }, { unique: true });

// Static method to recalculate and update MenuItem average rating
ratingSchema.statics.calculateAverageRating = async function (menuItemId) {
    const MenuItem = mongoose.model("MenuItem");

    const stats = await this.aggregate([
        {
            $match: { menuItem: new mongoose.Types.ObjectId(menuItemId) },
        },
        {
            $group: {
                _id: "$menuItem",
                numReviews: { $sum: 1 },
                averageRating: { $avg: "$rating" },
            },
        },
    ]);

    if (stats.length > 0) {
        await MenuItem.findByIdAndUpdate(menuItemId, {
            averageRating: Math.round(stats[0].averageRating * 10) / 10,
            numReviews: stats[0].numReviews,
        });
    } else {
        await MenuItem.findByIdAndUpdate(menuItemId, {
            averageRating: 0,
            numReviews: 0,
        });
    }
};

ratingSchema.post("save", async function () {
    await this.constructor.calculateAverageRating(this.menuItem);
});

ratingSchema.post("findOneAndDelete", async function (doc) {
    if (doc) {
        await doc.constructor.calculateAverageRating(doc.menuItem);
    }
});

module.exports = mongoose.models.Rating || mongoose.model("Rating", ratingSchema);
