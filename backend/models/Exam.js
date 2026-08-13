const mongoose = require('mongoose');
const crypto = require('crypto');

const questionSchema = new mongoose.Schema({
  question: {
    type: String,
    required: [true, 'Question text is required'],
    trim: true
  },
  options: [{
    text: {
      type: String,
      required: true,
      trim: true
    },
    isCorrect: {
      type: Boolean,
      default: false
    }
  }],
  marks: {
    type: Number,
    required: [true, 'Marks are required'],
    min: [1, 'Marks must be at least 1'],
    default: 1
  }
}, {
  _id: true
});

const examSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Exam title is required'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  subject: {
    type: String,
    required: [true, 'Subject is required'],
    trim: true,
    maxlength: [50, 'Subject cannot be more than 50 characters']
  },
  category: {
    type: String,
    default: 'General',
    trim: true
  },
  duration: {
    type: Number,
    required: [true, 'Duration is required'],
    min: [1, 'Duration must be at least 1 minute']
  },
  totalMarks: {
    type: Number,
    default: 0
  },
  passingMarks: {
    type: Number,
    default: 40
  },
  questions: [questionSchema],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  institution: {
    type: String,
    trim: true,
    default: ''
  },
  status: {
    type: String,
    enum: ['Draft', 'Published'],
    default: 'Published'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  proctoring: {
    enableFaceVerify: { type: Boolean, default: true },
    enableTabDetection: { type: Boolean, default: true },
    enableCopyPasteBlock: { type: Boolean, default: true },
    maxTabSwitchesAllowed: { type: Number, default: 3 }
  },
  examCode: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
    uppercase: true
  },
  startDate: {
    type: Date,
    required: [true, 'Start date is required']
  },
  endDate: {
    type: Date,
    required: [true, 'End date is required']
  }
}, {
  timestamps: true
});

// Performance Indexes for fast dashboard and listing lookups
examSchema.index({ institution: 1, isActive: 1, status: 1 });
examSchema.index({ createdBy: 1, createdAt: -1 });
examSchema.index({ startDate: 1, endDate: 1 });
examSchema.index({ examCode: 1 });

// Calculate total marks & auto-generate cryptographically secure examCode before saving
examSchema.pre('save', function (next) {
  if (Array.isArray(this.questions)) {
    this.totalMarks = this.questions.reduce((total, question) => total + (question.marks || 1), 0);
  }
  if (!this.examCode) {
    const randomHex = crypto.randomBytes(3).toString('hex').toUpperCase();
    this.examCode = `EXAM-${randomHex}`;
  }
  next();
});

// Virtual for checking if exam is currently active
examSchema.virtual('isCurrentlyActive').get(function () {
  const now = new Date();
  return this.isActive && this.status === 'Published' && now >= this.startDate && now <= this.endDate;
});

module.exports = mongoose.model('Exam', examSchema);