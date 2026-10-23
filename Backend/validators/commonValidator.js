const Joi = require("joi");

const objectId = Joi.string().hex().length(24);

const orderIdParamSchema = Joi.object({
    id: objectId.required(),
}).unknown(false);

module.exports = {
    objectId,
    orderIdParamSchema,
};
