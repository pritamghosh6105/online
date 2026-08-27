const express = require('express');
const router = express.Router();
const {
  getPlatformAnalytics,
  getAuditLogs,
  updateInstitutionPlan,
  exportSystemBackup,
  getStudents,
  deleteStudent,
  deleteInstitution,
  resendStudentCredentials
} = require('../controllers/superAdminController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

// Student management accessible by admin and superadmin
router.get('/students', authorize('superadmin', 'admin'), getStudents);
router.delete('/students/:id', authorize('superadmin', 'admin'), deleteStudent);
router.post('/students/:id/resend-credentials', authorize('superadmin', 'admin'), resendStudentCredentials);

// SuperAdmin exclusive routes
router.get('/analytics', authorize('superadmin'), getPlatformAnalytics);
router.get('/audit-logs', authorize('superadmin'), getAuditLogs);
router.put('/institution-plan', authorize('superadmin'), updateInstitutionPlan);
router.get('/backup', authorize('superadmin'), exportSystemBackup);
router.delete('/institution/:name', authorize('superadmin', 'admin'), deleteInstitution);

module.exports = router;
