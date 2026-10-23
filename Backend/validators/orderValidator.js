const Joi = require("joi");

const objectId = Joi.string().hex().length(24);

const orderIdSchema = Joi.object({
    id: objectId.required(),
}).unknown(false);

const updateOrderStatusSchema = Joi.object({
    status: Joi.string()
        .valid("preparing", "ready", "collected")
        .required(),
}).unknown(false);

module.exports = {
    orderIdSchema,
    updateOrderStatusSchema,
};
