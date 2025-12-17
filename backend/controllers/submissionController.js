const { validationResult } = require('express-validator');
const Submission = require('../models/Submission');
const Exam = require('../models/Exam');

// @desc    Submit exam
// @route   POST /api/submissions
// @access  Private (Student only)
const submitExam = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { examId, answers, startTime, endTime } = req.body;

    // Check if exam exists
    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found'
      });
    }

    // Check if exam is currently active
    const now = new Date();
    if (!exam.isActive || now < exam.startDate || now > exam.endDate) {
      return res.status(403).json({
        success: false,
        message: 'Exam is not currently available'
      });
    }

    // Check if student has already submitted
    const existingSubmission = await Submission.findOne({
      student: req.user.id,
      exam: examId
    });

    if (existingSubmission) {
      return res.status(403).json({
        success: false,
        message: 'You have already submitted this exam'
      });
    }

    // Calculate scores
    let totalScore = 0;
    const processedAnswers = [];

    for (const answer of answers) {
      const question = exam.questions.id(answer.questionId);
      if (!question) continue;

      const selectedOption = question.options[answer.selectedOption];
      const isCorrect = selectedOption ? selectedOption.isCorrect : false;
      const marksObtained = isCorrect ? question.marks : 0;

      totalScore += marksObtained;

      processedAnswers.push({
        questionId: answer.questionId,
        selectedOption: answer.selectedOption,
        isCorrect,
        marksObtained
      });
    }

    // Calculate time taken
    const startTimeDate = new Date(startTime);
    const endTimeDate = new Date(endTime);
    const timeTaken = Math.round((endTimeDate - startTimeDate) / (1000 * 60)); // in minutes

    // Calculate percentage
    const percentage = exam.totalMarks > 0 ? Math.round((totalScore / exam.totalMarks) * 100) : 0;

    // Create submission
    const submission = await Submission.create({
      student: req.user.id,
      exam: examId,
      answers: processedAnswers,
      totalScore,
      totalMarks: exam.totalMarks,
      percentage,
      startTime: startTimeDate,
      endTime: endTimeDate,
      timeTaken
    });

    await submission.populate([
      { path: 'student', select: 'name email' },
      { path: 'exam', select: 'title subject totalMarks' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Exam submitted successfully',
      submission: {
        id: submission._id,
        totalScore: submission.totalScore,
        totalMarks: submission.totalMarks,
        percentage: submission.percentage,
        timeTaken: submission.timeTaken,
        submittedAt: submission.createdAt
      }
    });
  } catch (error) {
    console.error('Submit exam error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while submitting exam'
    });
  }
};

// @desc    Get student's submissions
// @route   GET /api/submissions/my
// @access  Private (Student only)
const getMySubmissions = async (req, res) => {
  try {
    const submissions = await Submission.find({ student: req.user.id })
      .populate('exam', 'title subject totalMarks duration')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: submissions.length,
      submissions
    });
  } catch (error) {
    console.error('Get my submissions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching submissions'
    });
  }
};

// @desc    Get all submissions (Admin)
// @route   GET /api/submissions
// @access  Private (Admin only)
const getAllSubmissions = async (req, res) => {
  try {
    const { examId } = req.query;
    let query = {};

    if (examId) {
      query.exam = examId;
    }

    const submissions = await Submission.find(query)
      .populate('student', 'name email')
      .populate('exam', 'title subject totalMarks duration')
      .sort({ createdAt: -1 })
      .lean();

    // Filter out submissions with missing student or exam (deleted references)
    const validSubmissions = submissions.filter(sub => sub.student && sub.exam);

    res.json({
      success: true,
      count: validSubmissions.length,
      submissions: validSubmissions
    });
  } catch (error) {
    console.error('Get all submissions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching submissions'
    });
  }
};

// @desc    Get single submission details
// @route   GET /api/submissions/:id
// @access  Private
const getSubmission = async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.id)
      .populate('student', 'name email')
      .populate('exam');

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Submission not found'
      });
    }

    // Check authorization
    if (req.user.role === 'student' && submission.student._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this submission'
      });
    }

    res.json({
      success: true,
      submission
    });
  } catch (error) {
    console.error('Get submission error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching submission'
    });
  }
};

// @desc    Delete submission
// @route   DELETE /api/submissions/:id
// @access  Private (Admin only)
const deleteSubmission = async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.id);

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Submission not found'
      });
    }

    await Submission.findByIdAndDelete(req.params.id);

    console.log(`✅ Submission deleted: ${req.params.id}`);

    res.json({
      success: true,
      message: 'Submission deleted successfully'
    });
  } catch (error) {
    console.error('Delete submission error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting submission'
    });
  }
};

module.exports = {
  submitExam,
  getMySubmissions,
  getAllSubmissions,
  getSubmission,
  deleteSubmission
};