const mongoose = require(mongoose);
const menuItemSchemas = new mongoose.Schema(
    {
        name : {
            type : String,
            required : true,
            trim : true,
        },
        description : {
            type : String,
            default : "",
        },
        category : {
            type : String,
            required : true,
            trim : true,
        },
        price : {
            type : number,
            required : true,
            min : 0,
        },
        imageUrl : {
            type : String,
            default : "",
        },
        totalStocks : {
            type : Number,
            required : true,
            min : 0,
            default : 0,
        },
        availableStocks : {
            type : Number,
            required : true,
            min : 0,
            default : "",
        },
        isAvailable : {
            type : Boolean,
            default : true,
        },
        updatedBy : {
            type : mongoose.Schema.Types.ObjectId,
            ref : "user",
        },
    },
    { timeStamps : true}
);
menuItemSchemas,index(
    {name : 1, stockDate : 1},
    {unique : true}
);
module.export = mongoose.model("menuItem", menuItemSchemas);