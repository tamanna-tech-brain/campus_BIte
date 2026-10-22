const mongoose = require("mongoose");
const userSchema = new mongoose.Schema(
    {
        name : {
            type : String,
            required : true,
            trim : true,
        },
        email: {
            type : String,
            required : true,
            unique : true,
            lowercase : true,
            trim: true,
        },
        password : {
            type : String,
            required : true,
            select : false,
        },
        role : {
            type : String,
            enum : ["student", "staff", "admin"],
            default : student,
            required : true,
        },
        isActive : {
            type : Boolean,
            default : true,
        },
    },
    {timeStamp : true}
);
module.export = mongoose.model("User", userSchema);