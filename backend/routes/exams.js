const express = require('express');
const { body } = require('express-validator');
const {
  createExam,
  getExams,
  getExam,
  updateExam,
  deleteExam
} = require('../controllers/examController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Validation rules
const examValidation = [
  body('title')
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Title must be between 3 and 100 characters'),
  body('subject')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Subject must be between 2 and 50 characters'),
  body('duration')
    .isInt({ min: 1 })
    .withMessage('Duration must be at least 1 minute'),
  body('startDate')
    .isISO8601()
    .withMessage('Start date must be a valid date'),
  body('endDate')
    .isISO8601()
    .withMessage('End date must be a valid date'),
  body('questions')
    .isArray({ min: 1 })
    .withMessage('At least one question is required'),
  body('questions.*.question')
    .trim()
    .isLength({ min: 5 })
    .withMessage('Question must be at least 5 characters long'),
  body('questions.*.options')
    .isArray({ min: 2, max: 6 })
    .withMessage('Each question must have between 2 and 6 options'),
  body('questions.*.marks')
    .isInt({ min: 1 })
    .withMessage('Marks must be at least 1')
];

// Routes
router.route('/')
  .get(protect, getExams)
  .post(protect, authorize('admin'), examValidation, createExam);

router.route('/:id')
  .get(protect, getExam)
  .put(protect, authorize('admin'), examValidation, updateExam)
  .delete(protect, authorize('admin'), deleteExam);

module.exports = router;