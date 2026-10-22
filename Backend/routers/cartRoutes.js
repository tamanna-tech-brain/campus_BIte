
const express = require("express");
const router = express.Router();

const cartController = require("../controllers/cartController");
const validate = require("../middleware/validate");
const { protect, authorize } = require("../middleware/authMiddleware");

const {
  addToCartSchema,
  updateCartItemSchema,
  menuItemIdParamSchema,
} = require("../validators/cartValidator");

router.use(protect, authorize("student"));

router.get("/", cartController.getCart);

router.post(
  "/add",
  validate(addToCartSchema),
  cartController.addToCart
);

router.patch(
  "/:menuItemId",
  validate(menuItemIdParamSchema, "params"),
  validate(updateCartItemSchema),
  cartController.updateCartItem
);

router.delete(
  "/:menuItemId",
  validate(menuItemIdParamSchema, "params"),
  cartController.removeCartItem
);

module.exports = router;
