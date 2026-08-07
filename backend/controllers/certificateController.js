const Certificate = require('../models/Certificate');
const Submission = require('../models/Submission');
const Exam = require('../models/Exam');
const User = require('../models/User');

// Issue/Get Certificate for student exam submission
exports.getOrCreateCertificate = async (req, res) => {
  try {
    const { submissionId } = req.params;

    const submission = await Submission.findById(submissionId)
      .populate('student', 'name email institution studentId')
      .populate('exam', 'title subject totalMarks passingMarks');

    if (!submission) {
      return res.status(404).json({ success: false, message: 'Submission not found' });
    }

    const passingScore = submission.exam.passingMarks || 40;
    if (submission.percentage < passingScore) {
      return res.status(400).json({
        success: false,
        message: `Student score (${submission.percentage}%) is below passing threshold (${passingScore}%). Certificate not available.`
      });
    }

    // Check if certificate already generated
    let cert = await Certificate.findOne({
      student: submission.student._id,
      exam: submission.exam._id
    });

    if (!cert) {
      const verificationUrl = `${req.protocol}://${req.get('host')}/verify-certificate/`;
      cert = await Certificate.create({
        student: submission.student._id,
        studentName: submission.student.name,
        exam: submission.exam._id,
        examTitle: submission.exam.title,
        subject: submission.exam.subject,
        institution: submission.student.institution || 'Examin Academy',
        score: submission.totalScore,
        totalMarks: submission.totalMarks,
        percentage: submission.percentage,
        issueDate: submission.createdAt || new Date(),
        verificationUrl
      });

      // Attach certificate ID to submission
      submission.certificateId = cert.certificateId;
      await submission.save();
    }

    res.json({ success: true, certificate: cert });
  } catch (error) {
    console.error('Error generating certificate:', error);
    res.status(500).json({ success: false, message: 'Failed to process certificate' });
  }
};

// Public certificate verification by certificate ID
exports.verifyCertificate = async (req, res) => {
  try {
    const { certId } = req.params;
    const cert = await Certificate.findOne({ certificateId: certId.toUpperCase() });

    if (!cert) {
      return res.status(404).json({
        success: false,
        verified: false,
        message: 'Certificate ID not found or invalid'
      });
    }

    res.json({
      success: true,
      verified: true,
      certificate: cert
    });
  } catch (error) {
    console.error('Error verifying certificate:', error);
    res.status(500).json({ success: false, message: 'Certificate verification failed' });
  }
};
