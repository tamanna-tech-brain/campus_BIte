
const express = require("express");
const router = express.Router();

const menuController = require("../controllers/menuController");
const validate = require("../middleware/validate");

const {
  createMenuSchema,
  updateStockSchema,
  updateAvailabilitySchema,
} = require("../validators/menuValidator");

const { protect, authorize } = require("../middleware/authMiddleware");

router.get("/", menuController.getMenu);

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
  validate(require("joi").object({
    id: require("joi").string().hex().length(24).required(),
  }), "params"),
  validate(updateStockSchema),
  menuController.updateStock
);

router.patch(
  "/:id/availability",
  protect,
  authorize("staff", "admin"),
  validate(require("joi").object({
    id: require("joi").string().hex().length(24).required(),
  }), "params"),
  validate(updateAvailabilitySchema),
  menuController.updateAvailability
);

module.exports = router;
