// backend/middleware/validation.js
const Joi = require('joi');

const validateInput = (schema) => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.body, {
            abortEarly: false,
            stripUnknown: true
        });

        if (error) {
            const errors = error.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message
            }));

            return res.status(400).json({
                error: 'Validation failed',
                details: errors
            });
        }

        req.validatedData = value;
        next();
    };
};

// Validation schemas
const schemas = {
    register: Joi.object({
        username: Joi.string()
            .alphanum()
            .min(3)
            .max(30)
            .required()
            .messages({
                'string.alphanum': 'Username must contain only letters and numbers',
                'string.min': 'Username must be at least 3 characters long',
                'string.max': 'Username must be less than 30 characters long'
            }),
        email: Joi.string()
            .email()
            .required()
            .messages({
                'string.email': 'Please provide a valid email address'
            }),
        password: Joi.string()
            .min(8)
            .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])'))
            .required()
            .messages({
                'string.min': 'Password must be at least 8 characters long',
                'string.pattern.base': 'Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character'
            })
    }),

    login: Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string().required()
    }),

    question: Joi.object({
        title: Joi.string()
            .min(1)
            .max(255)
            .required()
            .messages({
                'string.min': 'Title must not be empty',
                'string.max': 'Title must be less than 255 characters long'
            }),
        description: Joi.string()
            .min(1)
            .required()
            .messages({
                'string.min': 'Description must not be empty'
            }),
        tags: Joi.array()
            .items(Joi.string().min(1).max(50))
            .max(5)
            .required()
            .messages({
                'array.max': 'Maximum 5 tags allowed'
            })
    }),

    answer: Joi.object({
        content: Joi.string()
            .min(20)
            .required()
            .messages({
                'string.min': 'Answer must be at least 20 characters long'
            }),
        questionId: Joi.number().integer().positive().required()
    }),

    vote: Joi.object({
        voteType: Joi.number().valid(-1, 1).required()
    })
};

module.exports = {
    validateInput,
    schemas
};
