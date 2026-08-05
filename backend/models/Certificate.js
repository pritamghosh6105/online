const mongoose = require('mongoose');
const crypto = require('crypto');

const certificateSchema = new mongoose.Schema({
  certificateId: {
    type: String,
    unique: true,
    required: true,
    index: true,
    default: () => 'CERT-' + crypto.randomBytes(4).toString('hex').toUpperCase()
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  studentName: {
    type: String,
    required: true
  },
  exam: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exam',
    required: true
  },
  examTitle: {
    type: String,
    required: true
  },
  subject: {
    type: String,
    required: true
  },
  institution: {
    type: String,
    default: 'Examin Academy'
  },
  score: {
    type: Number,
    required: true
  },
  totalMarks: {
    type: Number,
    required: true
  },
  percentage: {
    type: Number,
    required: true
  },
  issueDate: {
    type: Date,
    default: Date.now
  },
  verificationUrl: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Certificate', certificateSchema);
