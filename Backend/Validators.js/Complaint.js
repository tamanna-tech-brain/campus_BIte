
const Joi = require("joi");

const objectId = Joi.string().hex().length(24);

const createComplaintSchema = Joi.object({
    category: Joi.string()
        .valid(
            "wrong_order",
            "missing_item",
            "food_quality",
            "hygiene",
            "payment",
            "staff_behavior",
            "other"
        )
        .required(),

    description: Joi.string()
        .trim()
        .min(10)
        .max(2000)
        .required(),

    orderId: objectId.allow("").optional(),
}).unknown(false);

const complaintIdSchema = Joi.object({
    id: objectId.required(),
}).unknown(false);

const updateComplaintStatusSchema = Joi.object({
    status: Joi.string()
        .valid("in_review", "resolved", "rejected")
        .required(),

    resolutionNote: Joi.string()
        .trim()
        .max(1000)
        .allow("")
        .default(""),
}).unknown(false);

const complaintQuerySchema = Joi.object({
    status: Joi.string()
        .valid("open", "in_review", "resolved", "rejected")
        .optional(),

    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(50).default(10),
}).unknown(false);

module.exports = {
    createComplaintSchema,
    complaintIdSchema,
    updateComplaintStatusSchema,
    complaintQuerySchema,
};
