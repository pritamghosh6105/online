const express = require('express');
const { body } = require('express-validator');
const { register, login, getMe, getAdmins, changeCredentials, addAdmin, deleteAdmin } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Validation rules
const registerValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('role')
    .optional()
    .isIn(['student', 'admin'])
    .withMessage('Role must be either student or admin')
];

const loginValidation = [
  body('email')
    .notEmpty()
    .withMessage('Email or Student ID is required'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

const changeCredentialsValidation = [
  body('oldAdminId')
    .isLength({ min: 11, max: 11 })
    .withMessage('Old Admin ID must be 11 digits'),
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newStudentId')
    .isLength({ min: 11, max: 11 })
    .withMessage('New Admin ID must be 11 digits'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters')
];

const addAdminValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('adminId')
    .isLength({ min: 11, max: 11 })
    .withMessage('Admin ID must be 11 digits'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters')
];

// Routes
router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.get('/me', protect, getMe);
router.get('/admins', protect, getAdmins);
router.put('/change-credentials', protect, changeCredentialsValidation, changeCredentials);
router.post('/add-admin', protect, addAdminValidation, addAdmin);
router.delete('/admins/:id', protect, deleteAdmin);

module.exports = router;