const { body, validationResult } = require('express-validator');

// Validation middleware
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false,
      errors: errors.array() 
    });
  }
  next();
};

// Membership plan validation rules
const validateMembershipPlan = [
  body('name')
    .trim()
    .notEmpty().withMessage('Plan name is required')
    .isLength({ min: 3 }).withMessage('Plan name must be at least 3 characters long'),
  
  body('description')
    .trim()
    .notEmpty().withMessage('Description is required')
    .isLength({ min: 10 }).withMessage('Description must be at least 10 characters long'),
  
  body('price')
    .isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  
  body('duration')
    .isInt({ min: 1 }).withMessage('Duration must be at least 1 month'),
  
  body('features')
    .isArray().withMessage('Features must be an array')
    .optional(),
  
  body('isActive')
    .isBoolean().withMessage('isActive must be a boolean')
    .optional(),
  
  validate
];

module.exports = {
  validateMembershipPlan
}; 