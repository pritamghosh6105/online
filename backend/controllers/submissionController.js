const { validationResult } = require('express-validator');
const Submission = require('../models/Submission');
const Exam = require('../models/Exam');
const User = require('../models/User');

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

    const { examId, answers, startTime, endTime, proctorLogs } = req.body;

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
    let correctCount = 0;
    let incorrectCount = 0;

    for (const answer of answers) {
      const question = exam.questions.id(answer.questionId);
      if (!question) continue;

      const selectedOption = question.options[answer.selectedOption];
      const isCorrect = selectedOption ? selectedOption.isCorrect : false;
      const marksObtained = isCorrect ? question.marks : 0;

      if (isCorrect) correctCount++;
      else incorrectCount++;

      totalScore += marksObtained;

      processedAnswers.push({
        questionId: answer.questionId,
        selectedOption: answer.selectedOption,
        isCorrect,
        marksObtained
      });
    }

    // Calculate time taken
    const startTimeDate = new Date(startTime || Date.now() - 30 * 60 * 1000);
    const endTimeDate = new Date(endTime || Date.now());
    const timeTaken = Math.max(1, Math.round((endTimeDate - startTimeDate) / (1000 * 60))); // in minutes

    // Calculate percentage
    const percentage = exam.totalMarks > 0 ? Math.round((totalScore / exam.totalMarks) * 100) : 0;

    // Calculate Rank among current submissions for this exam
    const higherScoringCount = await Submission.countDocuments({
      exam: examId,
      totalScore: { $gt: totalScore }
    });
    const studentRank = higherScoringCount + 1;

    // AI Performance Analysis Insights
    const strengths = [];
    const weaknesses = [];
    const recommendations = [];

    if (percentage >= 80) {
      strengths.push(`Mastery in ${exam.subject} concepts and problem solving`);
      strengths.push(`High accuracy (${correctCount} correct questions out of ${exam.questions.length})`);
      recommendations.push(`Maintain strong conceptual grasp and attempt advanced level subject practice`);
    } else if (percentage >= 50) {
      strengths.push(`Good baseline understanding of ${exam.subject}`);
      weaknesses.push(`Missed ${incorrectCount} questions due to option confusion or timing`);
      recommendations.push(`Review key topics in ${exam.subject} and practice timed mock tests`);
    } else {
      weaknesses.push(`Low score (${percentage}%) in ${exam.subject} fundamental questions`);
      weaknesses.push(`High error count (${incorrectCount} incorrect responses)`);
      recommendations.push(`Re-read primary study materials for ${exam.subject} before retaking exams`);
    }

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
      timeTaken,
      rank: studentRank,
      proctorLogs: {
        tabSwitches: proctorLogs?.tabSwitches || 0,
        copyPasteAttempts: proctorLogs?.copyPasteAttempts || 0,
        fullscreenViolations: proctorLogs?.fullscreenViolations || 0,
        multiMonitorDetected: Boolean(proctorLogs?.multiMonitorDetected),
        audioViolations: proctorLogs?.audioViolations || 0,
        devToolsAttempts: proctorLogs?.devToolsAttempts || 0,
        isTerminatedForCheating: Boolean(proctorLogs?.isTerminatedForCheating),
        faceVerified: proctorLogs?.faceVerified !== false
      },
      aiPerformanceSummary: {
        strengths,
        weaknesses,
        recommendations
      }
    });

    // Clear active exam session for student upon submission
    await User.findByIdAndUpdate(req.user.id, {
      'activeExamSession.isActive': false
    });

    await submission.populate([
      { path: 'student', select: 'name email institution' },
      { path: 'exam', select: 'title subject totalMarks passingMarks' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Exam submitted successfully',
      submission
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
    const { examId, page = 1, limit = 50, statsOnly = false } = req.query;
    let query = {};

    if (examId) {
      query.exam = examId;
    } else if (req.user.role === 'admin' && req.user.institution) {
      const adminExams = await Exam.find({
        $or: [
          { institution: req.user.institution },
          { createdBy: req.user.id }
        ]
      }).select('_id');
      const examIds = adminExams.map(e => e._id);
      query.exam = { $in: examIds };
    }

    // If only stats are needed, return count of valid non-orphaned submissions
    if (statsOnly === 'true') {
      const allSubs = await Submission.find(query)
        .select('student exam')
        .populate('student', '_id')
        .populate('exam', '_id')
        .lean();
      
      const validCount = allSubs.filter(sub => sub.student && sub.exam).length;
      return res.json({
        success: true,
        count: validCount,
        statsOnly: true
      });
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Submission.countDocuments(query);

    const submissions = await Submission.find(query)
      .populate('student', 'name email studentId institution')
      .populate({
        path: 'exam',
        select: 'title subject totalMarks createdBy institution',
        populate: {
          path: 'createdBy',
          select: 'name email adminId institution role'
        }
      })
      .select('-answers') // Exclude detailed answers to reduce payload
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Filter out submissions with missing student or exam (deleted references)
    const validSubmissions = submissions.filter(sub => sub.student && sub.exam);

    res.json({
      success: true,
      count: validSubmissions.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
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

// @desc    Get leaderboard for exam
// @route   GET /api/submissions/leaderboard/:examId
// @access  Private
const getExamLeaderboard = async (req, res) => {
  try {
    const { examId } = req.params;
    const submissions = await Submission.find({ exam: examId })
      .populate('student', 'name studentId institution')
      .populate('exam', 'title subject totalMarks')
      .sort({ totalScore: -1, timeTaken: 1 })
      .limit(10)
      .lean();

    const leaderboard = submissions.map((sub, index) => ({
      rank: index + 1,
      studentName: sub.student?.name || 'Anonymous Student',
      studentId: sub.student?.studentId || 'N/A',
      institution: sub.student?.institution || 'Examin Academy',
      score: sub.totalScore,
      totalMarks: sub.totalMarks,
      percentage: sub.percentage,
      timeTaken: sub.timeTaken
    }));

    res.json({ success: true, count: leaderboard.length, leaderboard });
  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch exam leaderboard' });
  }
};

module.exports = {
  submitExam,
  getMySubmissions,
  getAllSubmissions,
  getSubmission,
  deleteSubmission,
  getExamLeaderboard
};