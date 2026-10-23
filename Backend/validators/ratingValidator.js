const Joi = require("joi");

const objectId = Joi.string().hex().length(24);

const createRatingSchema = Joi.object({
    menuItemId: objectId.required(),
    rating: Joi.number().strict().integer().min(1).max(5).required(),
    review: Joi.string().trim().max(1000).allow("").default(""),
    orderId: objectId.allow("").optional(),
}).unknown(false);

const updateRatingSchema = Joi.object({
    rating: Joi.number().strict().integer().min(1).max(5).optional(),
    review: Joi.string().trim().max(1000).allow("").optional(),
})
    .min(1)
    .unknown(false);

const ratingIdParamSchema = Joi.object({
    id: objectId.required(),
}).unknown(false);

const menuItemIdParamSchema = Joi.object({
    menuItemId: objectId.required(),
}).unknown(false);

module.exports = {
    createRatingSchema,
    updateRatingSchema,
    ratingIdParamSchema,
    menuItemIdParamSchema,
};
