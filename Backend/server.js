require("dotenv").config();

const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const paymentController = require("./controllers/Payment");

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for frontend cross-origin requests
app.use(
    cors({
        origin: true,
        credentials: true,
    })
);

// Razorpay webhook requires raw buffer BEFORE express.json()
app.post(
    "/api/payments/webhook",
    express.raw({ type: "application/json" }),
    paymentController.razorpayWebhook
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root health check endpoint
app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "CampusBite API is running smoothly",
        version: "1.0.0",
        timestamp: new Date().toISOString(),
    });
});

// API Routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/menu", require("./routes/menuRoutes"));
app.use("/api/cart", require("./routes/cartRoutes"));
app.use("/api/orders", require("./routes/orderRoutes"));
app.use("/api/payments", require("./routes/paymentRoutes"));
app.use("/api/complaints", require("./routes/complaintRoutes"));
app.use("/api/ratings", require("./routes/ratingRoutes"));

// 404 Not Found Handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Endpoint ${req.method} ${req.originalUrl} not found on this server`,
    });
});

// Centralized Error Handling Middleware (MUST BE AT THE END)
app.use(require("./middleware/ErrorMiddleware"));

const startServer = async () => {
    try {
        await connectDB();

        app.listen(PORT, () => {
            console.log(`CampusBite server running on port ${PORT}`);
        });
    } catch (error) {
        console.error("Server startup failed:", error.message);
        process.exit(1);
    }
};

startServer();
