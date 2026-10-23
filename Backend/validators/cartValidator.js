const Joi = require("joi");

const objectId = Joi.string().hex().length(24);

const addToCartSchema = Joi.object({
    menuItemId: objectId.required(),
    quantity: Joi.number().strict().integer().min(1).max(50).required(),
}).unknown(false);

const updateCartItemSchema = Joi.object({
    quantity: Joi.number().strict().integer().min(1).max(50).required(),
}).unknown(false);

const menuItemIdParamSchema = Joi.object({
    menuItemId: objectId.required(),
}).unknown(false);

module.exports = {
    addToCartSchema,
    updateCartItemSchema,
    menuItemIdParamSchema,
};
