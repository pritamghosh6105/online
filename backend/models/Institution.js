const mongoose = require('mongoose');

const institutionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Institution name is required'],
    unique: true,
    trim: true
  },
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  adminEmail: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  plan: {
    type: String,
    enum: ['Free', 'Starter', 'Professional', 'Enterprise'],
    default: 'Free'
  },
  maxStudents: {
    type: Number,
    default: 100
  },
  maxExams: {
    type: Number,
    default: 20
  },
  status: {
    type: String,
    enum: ['Active', 'Pending', 'Suspended'],
    default: 'Active'
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year default
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Institution', institutionSchema);
