
require("dotenv").config();

const express = require("express");
const connectDB = require("./config/db");
const paymentController = require("./controllers/Payment");

const app = express();
const PORT = process.env.PORT || 5000;

app.post(
    "/api/payments/webhook",
    express.raw({ type: "application/json" }),
    paymentController.razorpayWebhook
);

app.use(express.json());

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/menu", require("./routes/menuRoutes"));
app.use("/api/cart", require("./routes/cartRoutes"));
app.use("/api/orders", require("./routes/orderRoutes"));
app.use("/api/payments", require("./routers/paymentRoutes"));

app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "CampusBite API is running"
    });
});

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
