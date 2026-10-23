const Joi = require("joi");

const createMenuSchema = Joi.object({
    name: Joi.string().trim().min(2).max(100).required(),
    description: Joi.string().trim().max(500).allow("").default(""),
    category: Joi.string().trim().min(2).max(50).required(),
    price: Joi.number().strict().positive().max(100000).required(),
    imageUrl: Joi.string().uri().allow("").default(""),
    totalStock: Joi.number().strict().integer().min(0).max(100000).required(),
    stockDate: Joi.string()
        .pattern(/^\d{4}-\d{2}-\d{2}$/)
        .default(() => new Date().toISOString().slice(0, 10)),
}).unknown(false);

const updateStockSchema = Joi.object({
    totalStock: Joi.number().strict().integer().min(0).max(100000).required(),
}).unknown(false);

const updateAvailabilitySchema = Joi.object({
    isAvailable: Joi.boolean().strict().required(),
}).unknown(false);

module.exports = {
    createMenuSchema,
    updateStockSchema,
    updateAvailabilitySchema,
};
