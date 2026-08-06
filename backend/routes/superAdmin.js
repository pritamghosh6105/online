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
router.use(authorize('superadmin', 'admin'));

router.get('/analytics', getPlatformAnalytics);
router.get('/audit-logs', getAuditLogs);
router.put('/institution-plan', updateInstitutionPlan);
router.get('/backup', exportSystemBackup);
router.get('/students', getStudents);
router.delete('/students/:id', deleteStudent);
router.post('/students/:id/resend-credentials', resendStudentCredentials);
router.delete('/institution/:name', deleteInstitution);

module.exports = router;
