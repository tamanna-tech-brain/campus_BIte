const express = require("express");
const router = express.Router();
const ratingController = require("../controllers/ratingController");
const validate = require("../middleware/Validate");
const { protect, authorize } = require("../middleware/authMiddleware");

const {
    createRatingSchema,
    ratingIdParamSchema,
    menuItemIdParamSchema,
} = require("../validators/ratingValidator");

// Public: Get ratings & statistics for a specific menu item
router.get(
    "/item/:menuItemId",
    validate(menuItemIdParamSchema, "params"),
    ratingController.getMenuItemRatings
);

// Protected routes (Student)
router.use(protect);

// Student submits or updates rating
router.post(
    "/",
    authorize("student"),
    validate(createRatingSchema, "body"),
    ratingController.createOrUpdateRating
);

// Student views all their submitted ratings
router.get(
    "/my",
    authorize("student"),
    ratingController.getMyRatings
);

// Student deletes a rating
router.delete(
    "/:id",
    authorize("student"),
    validate(ratingIdParamSchema, "params"),
    ratingController.deleteRating
);

module.exports = router;
