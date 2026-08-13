const express = require('express');
const { body } = require('express-validator');
const {
  submitExam,
  getMySubmissions,
  getAllSubmissions,
  getSubmission,
  deleteSubmission,
  getExamLeaderboard
} = require('../controllers/submissionController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Validation rules
const submissionValidation = [
  body('examId')
    .isMongoId()
    .withMessage('Valid exam ID is required'),
  body('answers')
    .isArray()
    .withMessage('Answers array is required'),
  body('answers.*.questionId')
    .isMongoId()
    .withMessage('Valid question ID is required'),
  body('answers.*.selectedOption')
    .isInt({ min: 0 })
    .withMessage('Selected option must be a valid index'),
  body('startTime')
    .isISO8601()
    .withMessage('Valid start time is required'),
  body('endTime')
    .isISO8601()
    .withMessage('Valid end time is required')
];

// Routes
router.post('/', protect, authorize('student', 'admin', 'superadmin'), submissionValidation, submitExam);
router.get('/my', protect, authorize('student'), getMySubmissions);
router.get('/leaderboard/:examId', protect, getExamLeaderboard);
router.get('/', protect, authorize('admin', 'superadmin'), getAllSubmissions);
router.get('/:id', protect, getSubmission);
router.delete('/:id', protect, authorize('admin', 'superadmin'), deleteSubmission);

module.exports = router;