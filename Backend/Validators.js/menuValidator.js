
const Joi = require("joi");

exports.createMenuSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required(),

  description: Joi.string().trim().max(500).allow("").default(""),

  category: Joi.string().trim().min(2).max(50).required(),

  price: Joi.number().strict().positive().max(100000).required(),

  imageUrl: Joi.string().uri().allow("").default(""),

  totalStock: Joi.number().strict().integer().min(0).max(100000).required(),

  stockDate: Joi.string()
    .pattern(/^\d{4}-\d{2}-\d{2}$/)
    .custom((value, helpers) => {
      const date = new Date(`${value}T00:00:00Z`);

      if (
        Number.isNaN(date.getTime()) ||
        date.toISOString().slice(0, 10) !== value
      ) {
        return helpers.error("any.invalid");
      }

      return value;
    })
    .required(),
}).unknown(false);

exports.updateStockSchema = Joi.object({
  totalStock: Joi.number().strict().integer().min(0).max(100000).required(),
}).unknown(false);

exports.updateAvailabilitySchema = Joi.object({
  isAvailable: Joi.boolean().strict().required(),
}).unknown(false);
