const Joi = require("joi");

const registerSchema = Joi.object({
    name: Joi.string().trim().min(2).max(60).required(),
    email: Joi.string().trim().lowercase().email().max(254).required(),
    password: Joi.string().min(8).max(72).required(),
    role: Joi.string().valid("student", "staff", "admin").optional(),
}).unknown(false);

const loginSchema = Joi.object({
    email: Joi.string().trim().lowercase().email().max(254).required(),
    password: Joi.string().min(1).max(72).required(),
}).unknown(false);

module.exports = {
    registerSchema,
    loginSchema,
};
