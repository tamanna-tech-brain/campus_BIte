
const Joi = require("joi");

const objectId = Joi.string().hex().length(24);

exports.addToCartSchema = Joi.object({
  menuItemId: objectId.required(),

  quantity: Joi.number()
    .strict()
    .integer()
    .min(1)
    .max(50)
    .required(),
}).unknown(false);

exports.updateCartItemSchema = Joi.object({
  quantity: Joi.number()
    .strict()
    .integer()
    .min(1)
    .max(50)
    .required(),
}).unknown(false);

exports.menuItemIdParamSchema = Joi.object({
  menuItemId: objectId.required(),
}).unknown(false);