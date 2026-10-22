const mongoose = require("mongoose");
const cartSchemas = new mongoose.Schema(
    {
        student : {
            type : mongoose.Schema.Types.ObjectId,
            ref : "user",
            required : true,
            unique : true,
        },
        items : [
            {
                menuItem : {
                    type : mongoose.Schema.Types.ObjectId,
                    ref : "menuItem",
                    required : true,
                },
                Quantity : {
                    type : Number,
                    required : true,
                    min : 1,
                },
            },
        ],
    },
    {timeStamps : true}
);
module.exports = mongoose.model("cart", cartSchemas);