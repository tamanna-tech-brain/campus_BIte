const Rating = require("../models/Rating");
const MenuItem = require("../models/MenuItem");
const Order = require("../models/Order");

// Student: Submit or update rating for a menu item
exports.createOrUpdateRating = async (req, res) => {
    try {
        const { menuItemId, rating, review, orderId } = req.body;

        if (!menuItemId || !rating) {
            return res.status(400).json({
                message: "Menu item ID and rating (1-5) are required",
            });
        }

        const menuItem = await MenuItem.findById(menuItemId);
        if (!menuItem) {
            return res.status(404).json({
                message: "Menu item not found",
            });
        }

        // Optional verification: check if student has ordered this item
        let verifiedOrder = null;
        if (orderId) {
            verifiedOrder = await Order.findOne({
                _id: orderId,
                student: req.user.id,
                status: "collected",
                "items.menuItem": menuItemId,
            });
        }

        // Check if student already rated this dish
        let ratingDoc = await Rating.findOne({
            student: req.user.id,
            menuItem: menuItemId,
        });

        if (ratingDoc) {
            // Update existing review
            ratingDoc.rating = rating;
            if (review !== undefined) ratingDoc.review = review.trim();
            if (verifiedOrder) ratingDoc.order = verifiedOrder._id;
            await ratingDoc.save();

            return res.status(200).json({
                message: "Rating updated successfully",
                rating: ratingDoc,
            });
        }

        // Create new rating
        ratingDoc = await Rating.create({
            student: req.user.id,
            menuItem: menuItemId,
            order: verifiedOrder ? verifiedOrder._id : null,
            rating,
            review: review ? review.trim() : "",
        });

        return res.status(201).json({
            message: "Rating submitted successfully",
            rating: ratingDoc,
        });
    } catch (error) {
        return res.status(500).json({
            message: "Failed to submit rating",
            error: error.message,
        });
    }
};

// Public: Get all ratings and review stats for a specific menu item
exports.getMenuItemRatings = async (req, res) => {
    try {
        const { menuItemId } = req.params;
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));

        const [ratings, total, stats] = await Promise.all([
            Rating.find({ menuItem: menuItemId })
                .populate("student", "name")
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit),

            Rating.countDocuments({ menuItem: menuItemId }),

            Rating.aggregate([
                { $match: { menuItem: new (require("mongoose").Types.ObjectId)(menuItemId) } },
                {
                    $group: {
                        _id: "$rating",
                        count: { $sum: 1 },
                    },
                },
            ]),
        ]);

        // Build breakdown for stars 1 to 5
        const starBreakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        stats.forEach((s) => {
            if (starBreakdown[s._id] !== undefined) {
                starBreakdown[s._id] = s.count;
            }
        });

        const menuItem = await MenuItem.findById(menuItemId).select("name averageRating numReviews");

        return res.status(200).json({
            menuItem,
            total,
            page,
            totalPages: Math.ceil(total / limit),
            starBreakdown,
            ratings,
        });
    } catch (error) {
        return res.status(500).json({
            message: "Failed to fetch ratings for menu item",
            error: error.message,
        });
    }
};

// Student: Get all ratings submitted by the current user
exports.getMyRatings = async (req, res) => {
    try {
        const ratings = await Rating.find({ student: req.user.id })
            .populate("menuItem", "name imageUrl category price averageRating")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            count: ratings.length,
            ratings,
        });
    } catch (error) {
        return res.status(500).json({
            message: "Failed to fetch your ratings",
            error: error.message,
        });
    }
};

// Student: Delete their rating
exports.deleteRating = async (req, res) => {
    try {
        const rating = await Rating.findOneAndDelete({
            _id: req.params.id,
            student: req.user.id,
        });

        if (!rating) {
            return res.status(404).json({
                message: "Rating not found or unauthorized",
            });
        }

        return res.status(200).json({
            message: "Rating deleted successfully",
        });
    } catch (error) {
        return res.status(500).json({
            message: "Failed to delete rating",
            error: error.message,
        });
    }
};
