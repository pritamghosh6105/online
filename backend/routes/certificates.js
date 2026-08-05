const express = require('express');
const router = express.Router();
const { getOrCreateCertificate, verifyCertificate } = require('../controllers/certificateController');
const { protect } = require('../middleware/auth');

// Public certificate verification route
router.get('/verify/:certId', verifyCertificate);

// Protected certificate generation for student submission
router.get('/submission/:submissionId', protect, getOrCreateCertificate);

module.exports = router;
