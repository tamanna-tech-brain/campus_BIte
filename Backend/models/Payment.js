const mongoose = require("mongoose");
const paymentSchemas = new mongoose.Schema(
    {
        order : {
            type : mongoose.Schema.Types.ObjectId,
            ref :  "order",
            required : true,
            unique : true,
        },
        student : {
            type : mongoose.Schema.Types.ObjectId,
            ref : "User",
            required : true,
        },
        provider : {
            type : String,
            enum : ["razorpay"],
            default : "razorpay",
        },
        razorpayOrderId : {
            type : String,
            unique : true,
            sparse : true,
        },
        razorpayPaymentId : {
            type : String,
            unique : true,
            Sparse : true,
        },
        amount : {
            type : Number,
            required : true,
            min : 0,
        },
        currency : {
            type : String,
            enm : [
                "created",
                "authorized",
                "captured",
                "failed",
                "refunded",
            ],
            default : "created",
        },
        webhookEventId: {
      type: String,
    },

    paidAt: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Payment", paymentSchemas);