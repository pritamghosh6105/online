const express = require('express');
const router = express.Router();
const {
  getPlatformAnalytics,
  getAuditLogs,
  updateInstitutionPlan,
  exportSystemBackup
} = require('../controllers/superAdminController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.use(authorize('superadmin'));

router.get('/analytics', getPlatformAnalytics);
router.get('/audit-logs', getAuditLogs);
router.put('/institution-plan', updateInstitutionPlan);
router.get('/backup', exportSystemBackup);

module.exports = router;
