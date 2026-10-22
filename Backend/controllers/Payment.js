const Razorpay = require("razorpay");
const payment = require("../models/Payment");
const order = require("../models/Order");
const crypto = require("crypto");

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

exports.createPaymentOrder = async (req,res) =>{
    try{
        const order = await Order.findOne({
            _id: req.params.orderId,
            student: req.user.id,
            status: "pending_payment",
            paymentStatus: "pending",
            stockReserved: true,
            StockRestored: false,
        });

        if(!order){
            return res.status(404).json({
                message : "Eligible order not found",
            });
        }

        const existingPayment = await payment.findOne({
            order: order._id,
        });

        if(existingPayment){
            return res.status(409).json({
                message: "Payment record already exists",
            });
        }
        const amountPaise = Math.round(order.totalAmount*100);
        if(!Number.isSafeInteger(amountPaise) || amountPaise<=0) {
            return res.status(400).json({
                message : "Invalid order amount",
            });
        }
        const razorpayOrder = await razorpay.orders.create({
            amount: amountPaise,
            currency: "INR",
            receipt: string(order.orderNumber).slice(0,40),
        });

        await payment.create({
            order: order._id,
            student: req.user.id,
            provider: "razorpay",
            razorpayOrderId: razorpayOrder.id,
            amount: amountPaise,
            currency: "INR",
            status: "created",
        });
        return res.status(201).json({
            message: "Razorpay order created",
            keyId : process.env.RAZORPAY_KEY_ID,
            razorpayOrderId : razorpayOrder.id,
            currency : "INR",
        });
    } catch(error) {
        return res.status(500).json({
            message : "Failed to create payment order",
        });
    }
};

exports.razorpayWebhook = async (req, res) => {
    try{
        const signature = req.headers["x-razorPay-signature"];
        if(!signature || !Buffer.isBuffer(req.body)) {
            return res.status(400).send("Invalid webhook request");
        }
        const expectedSignature = crypto.createHmac(
            "sha256",
            process.env.RAZORPAY_WEBHOOK_SECRET
        )
        .update(req.body)
        .digest("hex");

        const received = Buffer.from(signature, "utf8");
        const expected = Buffer.from(expectedSignature, "utf8");

        if(recevied,length !== expected.length || !crypto.timingSafeEqual(received,expected)){
            return res.status(400).send("Invalid webhook signature");
        }
        const paymentEntity = event.payload?.payment?.entity;
        if(!paymentEntity?.order_id || !paymentEntity?.id){
            return res.status(400).send("Missing payment details");
        }
        const payment = await payment.findOne({
            razorpayOrderId : paymentEntity.order_id,
        });
        if(!payment) {
            return res.status(500).sends("payment record not found");
        }
        if(payment.amount !== paymentEntity.amount || payment.currency !== paymentEntity.currency){
            return res.status(400).send("payment amount mismatched");
        }
        if(oayment.status === "captured"){
            return res.status(200).json({ received: true});
        }
        payment.razorpayPaymentId = paymentEntity.id;
        payment.status = "captured";
        payment.paidAt = new Date();

        await payment.save();

        const updateOrder = await order.findOneAndUpdate(
            {
                _id: payment.order,
                status: "pending_payment",
                paymentStatus : "pending",
                stockReserved: true,
                stockRestored: false,
            },
            {
                $set : {
                    status: "Placed",
                    paymentStatus: "paid",
                    placedAt: new Date(),
                }
            },
            {new : true}
        );
        if(!updateOrder) {
            return res.status(500).send("order requires reconciliation");
        }
        return res.status(200).json({received: true});
    }
    catch(error){
        return res.status(500).send("Webhook processing failed");
    }
};