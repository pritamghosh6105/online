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
