
const Joi = require("joi");

const objectId = Joi.string().hex().length(24);

exports.orderIdParamSchema = Joi.object({
  id: objectId.required(),
}).unknown(false);
