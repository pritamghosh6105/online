const { validationResult } = require('express-validator');
const Exam = require('../models/Exam');
const Submission = require('../models/Submission');

// @desc    Create exam
// @route   POST /api/exams
// @access  Private (Admin only)
const createExam = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const examData = {
      ...req.body,
      createdBy: req.user.id
    };

    const exam = await Exam.create(examData);
    await exam.populate('createdBy', 'name email');

    res.status(201).json({
      success: true,
      message: 'Exam created successfully',
      exam
    });
  } catch (error) {
    console.error('Create exam error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating exam'
    });
  }
};

// @desc    Get all exams
// @route   GET /api/exams
// @access  Private
const getExams = async (req, res) => {
  try {
    const { page = 1, limit = 50, statsOnly = false } = req.query;
    let query = {};
    
    // If student, only show active exams (including upcoming and current)
    if (req.user.role === 'student') {
      const now = new Date();
      query = {
        isActive: true,
        endDate: { $gte: now } // Show exams that haven't ended yet
      };
    }

    // If only stats are needed (for admin dashboard), return count only
    if (statsOnly === 'true' && req.user.role === 'admin') {
      const count = await Exam.countDocuments(query);
      return res.json({
        success: true,
        count,
        statsOnly: true
      });
    }

    // Calculate pagination for admins
    const skip = req.user.role === 'admin' ? (parseInt(page) - 1) * parseInt(limit) : 0;
    const total = await Exam.countDocuments(query);

    let examQuery = Exam.find(query)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    // Apply pagination for admins
    if (req.user.role === 'admin') {
      examQuery = examQuery.skip(skip).limit(parseInt(limit));
    }

    const exams = await examQuery.lean();

    // For students, hide correct answers
    if (req.user.role === 'student') {
      const sanitizedExams = exams.map(exam => {
        const examObj = exam;
        examObj.questions = examObj.questions.map(q => ({
          _id: q._id,
          question: q.question,
          options: q.options.map(opt => ({ text: opt.text })),
          marks: q.marks
        }));
        return examObj;
      });
      
      return res.json({
        success: true,
        count: sanitizedExams.length,
        exams: sanitizedExams
      });
    }

    res.json({
      success: true,
      count: exams.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      exams
    });
  } catch (error) {
    console.error('Get exams error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching exams'
    });
  }
};

// @desc    Get single exam
// @route   GET /api/exams/:id
// @access  Private
const getExam = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id).populate('createdBy', 'name email');
    
    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found'
      });
    }

    // Check if student can access this exam
    if (req.user.role === 'student') {
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
        exam: exam._id
      });

      if (existingSubmission) {
        return res.status(403).json({
          success: false,
          message: 'You have already submitted this exam'
        });
      }

      // Hide correct answers for students
      const examObj = exam.toObject();
      examObj.questions = examObj.questions.map(q => ({
        _id: q._id,
        question: q.question,
        options: q.options.map(opt => ({ text: opt.text })),
        marks: q.marks
      }));
      
      return res.json({
        success: true,
        exam: examObj
      });
    }

    res.json({
      success: true,
      exam
    });
  } catch (error) {
    console.error('Get exam error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching exam'
    });
  }
};

// @desc    Update exam
// @route   PUT /api/exams/:id
// @access  Private (Admin only)
const updateExam = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const exam = await Exam.findById(req.params.id);
    
    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found'
      });
    }

    // Check if admin owns this exam
    if (exam.createdBy.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this exam'
      });
    }

    const updatedExam = await Exam.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('createdBy', 'name email');

    res.json({
      success: true,
      message: 'Exam updated successfully',
      exam: updatedExam
    });
  } catch (error) {
    console.error('Update exam error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating exam'
    });
  }
};

// @desc    Delete exam
// @route   DELETE /api/exams/:id
// @access  Private (Admin only)
const deleteExam = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    
    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found'
      });
    }

    // Ownership check removed: any admin can delete any exam

    await Exam.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Exam deleted successfully'
    });
  } catch (error) {
    console.error('Delete exam error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting exam'
    });
  }
};

module.exports = {
  createExam,
  getExams,
  getExam,
  updateExam,
  deleteExam
};