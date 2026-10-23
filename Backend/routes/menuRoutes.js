const express = require("express");
const router = express.Router();
const Joi = require("joi");
const menuController = require("../controllers/MenuItemController");
const validate = require("../middleware/Validate");
const { protect, authorize } = require("../middleware/authMiddleware");

const {
    createMenuSchema,
    updateStockSchema,
    updateAvailabilitySchema,
} = require("../validators/menuValidator");

const idParamSchema = Joi.object({
    id: Joi.string().hex().length(24).required(),
}).unknown(false);

// Public routes
router.get("/", menuController.getMenu);
router.get("/all", protect, authorize("staff", "admin"), menuController.getAllMenuItems);
router.get("/:id", validate(idParamSchema, "params"), menuController.getMenuItemById);

// Staff / Admin routes
router.post(
    "/",
    protect,
    authorize("staff", "admin"),
    validate(createMenuSchema),
    menuController.createMenuItem
);

router.patch(
    "/:id/stock",
    protect,
    authorize("staff", "admin"),
    validate(idParamSchema, "params"),
    validate(updateStockSchema),
    menuController.updateStock
);

router.patch(
    "/:id/availability",
    protect,
    authorize("staff", "admin"),
    validate(idParamSchema, "params"),
    validate(updateAvailabilitySchema),
    menuController.updateAvailability
);

router.delete(
    "/:id",
    protect,
    authorize("admin"),
    validate(idParamSchema, "params"),
    menuController.deleteMenuItem
);

module.exports = router;
