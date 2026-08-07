const express = require('express');
const router = express.Router();
const {
  getQuestions,
  createQuestion,
  importBulkQuestions,
  generateRandomQuestions,
  aiGenerateQuestions,
  deleteQuestion,
  bulkDeleteQuestions,
  publishQuestionBank
} = require('../controllers/questionBankController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/', getQuestions);
router.post('/', authorize('admin', 'superadmin'), createQuestion);
router.post('/import', authorize('admin', 'superadmin'), importBulkQuestions);
router.get('/random', authorize('admin', 'superadmin'), generateRandomQuestions);
router.post('/ai-generate', authorize('admin', 'superadmin'), aiGenerateQuestions);
router.post('/publish', authorize('admin', 'superadmin'), publishQuestionBank);
router.post('/bulk-delete', authorize('admin', 'superadmin'), bulkDeleteQuestions);
router.delete('/:id', authorize('admin', 'superadmin'), deleteQuestion);

module.exports = router;
