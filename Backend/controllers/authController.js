const User = require("../models/User.js");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const generateToken = (user) => {
    return jwt.sign(
        {id : user._id, role: user.role},
        process.env.JWT_SECRET,
        { expiresIn: "7d"}
    );
};

exports.register = async (req, res) => {
   try{
    const { name, email, password } = req.body;
    if(!name || ! email || !password){
        return res.status(400).json({
            message: "Information is not provided",
        });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message: "Password must contain at least 8 characters",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await User.findOne({
        email: normalizedEmail,
    });
    
    if(existingUser) {
        return res.status(409).json({
            message : "user Already registered",
        });
    }
    const hashedPassword = await bcrypt.hash(password,12);

    const user = await User.create({
        name : name.trim(),
        email : normalizedEmail,
        password : hashedPassword,
        role : "student",
    });

    const token = generateToken(user);
    return res.status(201).json({
        message : "Registered successful",
        token,
        user : {
            id : user._id,
            name : user.name,
            email : user.email,
            role : user.role,
        },
    });
   } catch (error){
    if(error.code === 11000) {
        return res.status(409).json({
            message : "Email already registered",
        });
    }

        return res.status(500).json({
            message : "Registration failed",
        });
   };
}

exports.login = async (req, res) => {
    try {
        const {email, password} = req.body;

        if(!email, !password ) {
            return res.status(400).json({
                message : "Missing Email or password",
            });
        }

        const user = await User.findOne({
            email : email.trim().toLowerCase(),
        }).select("+password");

         if(!user || !user.isActive) {
            return res.status(401).json({
            message: "Invalid credentials",
        });
    }
    const isMatch = await bcrypt.compare(
        password,
        user.password
    );

    if(!isMatch) {
         return res.status(401).json({
        message: "Invalid credentials",
      });
    }

    const token = generateToken(user);
    return res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });

  } catch (error) {
    return res.status(500).json({
      message: "Login failed",
    });
  }
};

// exports.getUsers = async (req, res) => {
//     try{
//         const page = Math.max(1,Number(req.query.role)) {
//             const limit = Math.min(
//                 10,
//                 Math.max(1, Number(req.query.limit) || 20)
//             )
//             const filter = {};
//             if(["student", "staff","admin"].includes(req.query.role)){
//                 filter.role = req.query.role;
//             }

//         }
//     }
// }