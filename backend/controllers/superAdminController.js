const User = require('../models/User');
const Exam = require('../models/Exam');
const Submission = require('../models/Submission');
const Institution = require('../models/Institution');
const AuditLog = require('../models/AuditLog');
const Schedule = require('../models/Schedule');
const QuestionBank = require('../models/QuestionBank');

// Platform-wide analytics
exports.getPlatformAnalytics = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalStudents = await User.countDocuments({ role: 'student' });
    const totalAdmins = await User.countDocuments({ role: 'admin' });
    const totalExams = await Exam.countDocuments();
    const totalSubmissions = await Submission.countDocuments();
    const pendingRequests = await Schedule.countDocuments({ status: 'pending' });

    // Calculate pass rate percentage
    const passedSubmissions = await Submission.countDocuments({ percentage: { $gte: 40 } });
    const passRate = totalSubmissions > 0 ? Math.round((passedSubmissions / totalSubmissions) * 100) : 100;

    // Institution breakdown
    const institutions = await User.distinct('institution', { institution: { $ne: '' } });

    res.json({
      success: true,
      analytics: {
        totalUsers,
        totalStudents,
        totalAdmins,
        totalInstitutions: institutions.length,
        totalExams,
        totalSubmissions,
        pendingRequests,
        passRate
      }
    });
  } catch (error) {
    console.error('Error getting platform analytics:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch platform analytics' });
  }
};

// System audit logs
exports.getAuditLogs = async (req, res) => {
  try {
    const logs = await AuditLog.find().sort({ createdAt: -1 }).limit(100);
    res.json({ success: true, count: logs.length, logs });
  } catch (error) {
    console.error('Error getting audit logs:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch audit logs' });
  }
};

// Manage Institution Subscription Plans
exports.updateInstitutionPlan = async (req, res) => {
  try {
    const { name, plan } = req.body;
    let inst = await Institution.findOne({ name });
    if (!inst) {
      const adminUser = await User.findOne({ institution: name, role: 'admin' });
      inst = await Institution.create({
        name,
        code: name.substring(0, 4).toUpperCase() + Math.floor(1000 + Math.random() * 9000),
        adminEmail: adminUser ? adminUser.email : 'admin@' + name.toLowerCase().replace(/\s+/g, '') + '.com',
        plan: plan || 'Starter'
      });
    } else {
      inst.plan = plan;
      await inst.save();
    }

    await AuditLog.create({
      user: req.user?._id,
      userName: req.user?.name,
      userEmail: req.user?.email,
      action: 'SUBSCRIPTION_PLAN_UPDATED',
      details: `Updated subscription plan for ${name} to "${plan}"`
    });

    res.json({ success: true, institution: inst });
  } catch (error) {
    console.error('Error updating institution plan:', error);
    res.status(500).json({ success: false, message: 'Failed to update plan' });
  }
};

// Get all registered students with studentId & institution
exports.getStudents = async (req, res) => {
  try {
    let filter = { role: 'student' };
    
    // Sub-admins filter by institution
    if (req.user && req.user.role === 'admin' && req.user.institution) {
      filter.institution = req.user.institution;
    }

    const students = await User.find(filter)
      .select('name email studentId institution isApproved isActive createdAt')
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      count: students.length,
      students: students.map(s => ({
        id: s._id,
        name: s.name,
        email: s.email,
        studentId: s.studentId || 'N/A',
        institution: s.institution || 'General',
        isApproved: s.isApproved,
        isActive: s.isActive,
        createdAt: s.createdAt
      }))
    });
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch student accounts' });
  }
};

// Delete a student account
exports.deleteStudent = async (req, res) => {
  try {
    const student = await User.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student account not found' });
    }

    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Student account deleted successfully' });
  } catch (error) {
    console.error('Error deleting student:', error);
    res.status(500).json({ success: false, message: 'Failed to delete student account' });
  }
};

// Resend credentials email to student
exports.resendStudentCredentials = async (req, res) => {
  try {
    const student = await User.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student account not found' });
    }

    const nodemailer = require('nodemailer');
    const tempPass = 'Student@' + (student.studentId ? student.studentId.slice(-4) : '1234');
    student.password = tempPass;
    await student.save();

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    await transporter.sendMail({
      from: `"Examin Platform" <${process.env.SMTP_USER}>`,
      replyTo: process.env.SMTP_USER,
      to: student.email,
      subject: `Your Examin Student Credentials - Student ID: ${student.studentId}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 25px; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
          <h2 style="color: #2563eb; margin-top: 0;">Welcome to Examin!</h2>
          <p style="font-size: 15px; color: #334155;">Dear <strong>${student.name}</strong>,</p>
          <p style="font-size: 15px; color: #334155;">Here are your official account credentials for logging into the platform:</p>
          <div style="background-color: #f1f5f9; padding: 18px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2563eb;">
            <p style="margin: 6px 0; font-size: 16px;"><strong>Student ID:</strong> <span style="color: #2563eb; font-weight: 800;">${student.studentId}</span></p>
            <p style="margin: 6px 0; font-size: 15px;"><strong>Password:</strong> ${tempPass}</p>
          </div>
          <p style="font-size: 14px; color: #64748b;">Use your 11-digit Student ID (<code>${student.studentId}</code>) to sign in.</p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          <p style="font-size: 12px; color: #94a3b8;">If you cannot find this email in your Inbox, please check your <strong>Spam / Junk</strong> folder or <strong>Promotions</strong> tab.</p>
        </div>
      `
    });

    res.json({
      success: true,
      message: `Credentials email dispatched to ${student.email} (Student ID: ${student.studentId}, Password: ${tempPass})`
    });
  } catch (error) {
    console.error('Error resending credentials email:', error);
    res.status(500).json({ success: false, message: 'Failed to resend credentials email' });
  }
};

// Delete an approved school / institution
exports.deleteInstitution = async (req, res) => {
  try {
    const institutionName = decodeURIComponent(req.params.name);
    const regex = new RegExp(`^${institutionName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');

    await Institution.deleteMany({ name: regex });
    await Schedule.deleteMany({ institution: regex });
    await User.deleteMany({ institution: regex, role: 'admin' });
    await Exam.deleteMany({ institution: regex });

    if (AuditLog) {
      await AuditLog.create({
        user: req.user?._id,
        userName: req.user?.name,
        userEmail: req.user?.email,
        action: 'INSTITUTION_DELETED',
        details: `Deleted approved institution: ${institutionName}`
      }).catch(() => {});
    }

    res.json({ success: true, message: `Approved school "${institutionName}" deleted successfully` });
  } catch (error) {
    console.error('Error deleting institution:', error);
    res.status(500).json({ success: false, message: 'Failed to delete approved school' });
  }
};

// Database JSON Export Backup
exports.exportSystemBackup = async (req, res) => {
  try {
    const users = await User.find({}, '-password');
    const exams = await Exam.find();
    const submissions = await Submission.find();
    const schedules = await Schedule.find();
    const questionBank = await QuestionBank.find();
    const auditLogs = await AuditLog.find();

    const backupData = {
      timestamp: new Date().toISOString(),
      version: '2.0.0',
      users,
      exams,
      submissions,
      schedules,
      questionBank,
      auditLogs
    };

    res.json({ success: true, backup: backupData });
  } catch (error) {
    console.error('Error exporting backup:', error);
    res.status(500).json({ success: false, message: 'Failed to export system backup' });
  }
};
