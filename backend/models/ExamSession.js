const mongoose = require('mongoose');
const crypto = require('crypto');

const examSessionSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  exam: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exam',
    required: true
  },
  sessionToken: {
    type: String,
    required: true,
    unique: true,
    index: true,
    uppercase: true,
    trim: true
  },
  examCode: {
    type: String,
    required: true,
    trim: true,
    uppercase: true
  },
  startTime: {
    type: Date,
    default: Date.now
  },
  endTime: {
    type: Date,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  ipAddress: {
    type: String,
    default: '127.0.0.1'
  }
}, {
  timestamps: true
});

examSessionSchema.index({ student: 1, exam: 1, isActive: 1 });
examSessionSchema.index({ sessionToken: 1 });

// Helper static method to generate a secure session token
examSessionSchema.statics.generateSessionToken = function() {
  const randomHex = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `SESS-${randomHex}`;
};

module.exports = mongoose.model('ExamSession', examSessionSchema);
