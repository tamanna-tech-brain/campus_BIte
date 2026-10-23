const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const validate = require("../middleware/Validate");
const { protect } = require("../middleware/authMiddleware");
const {
    registerSchema,
    loginSchema,
} = require("../validators/authValidator");

router.post(
    "/register",
    validate(registerSchema),
    authController.register
);

router.post(
    "/login",
    validate(loginSchema),
    authController.login
);

router.get(
    "/me",
    protect,
    authController.getMe
);

module.exports = router;
