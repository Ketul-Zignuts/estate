import { body } from 'express-validator';

export const loginValidationRules = [
    body('email').isEmail().withMessage('Invalid email address'),
    body('password').notEmpty().withMessage('Password is required'),
];


export const registerValidationRules = [
    body('first_name').notEmpty().withMessage('First name is required'),
    body('last_name').notEmpty().withMessage('Last name is required'),
    body('email').isEmail().withMessage('Invalid email address'),
    body('password').notEmpty().withMessage('Password is required'),
    body('security_question').notEmpty().withMessage('Security question is required'),
    body('phone_number').notEmpty().withMessage('Phone number is required'),
    body('role').notEmpty().withMessage('Role is required'),

    // Conditionally check fields based on the 'role'
    body('agency_name')
      .if((value, { req }) => req.body.role === 'broker')  // Only validate if role is 'broker'
      .notEmpty().withMessage('Agency name is required for brokers'),

    body('commission_rate')
      .if((value, { req }) => req.body.role === 'broker')  // Only validate if role is 'broker'
      .notEmpty().withMessage('Commission rate is required for brokers')
      .isFloat({ min: 0 }).withMessage('Commission rate must be a positive number'),

    body('license_number')
      .if((value, { req }) => req.body.role === 'broker')  // Only validate if role is 'broker'
      .notEmpty().withMessage('License number is required for brokers')
  ];