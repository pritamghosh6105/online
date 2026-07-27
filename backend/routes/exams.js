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
    .isLength({ min: 1, max: 200 })
    .withMessage('Title must be between 1 and 200 characters'),
  body('subject')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Subject must be between 1 and 100 characters'),
  body('duration')
    .isInt({ min: 1 })
    .withMessage('Duration must be at least 1 minute'),
  body('startDate')
    .notEmpty()
    .withMessage('Start date is required'),
  body('endDate')
    .notEmpty()
    .withMessage('End date is required'),
  body('questions')
    .isArray({ min: 1 })
    .withMessage('At least one question is required'),
  body('questions.*.question')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Question text is required'),
  body('questions.*.options')
    .isArray({ min: 2, max: 10 })
    .withMessage('Each question must have at least 2 options'),
  body('questions.*.marks')
    .optional()
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