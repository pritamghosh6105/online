const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  selectedOption: {
    type: Number,
    required: true,
    min: 0
  },
  isCorrect: {
    type: Boolean,
    required: true
  },
  marksObtained: {
    type: Number,
    required: true,
    min: 0
  }
}, {
  _id: false
});

const submissionSchema = new mongoose.Schema({
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
  answers: [answerSchema],
  totalScore: {
    type: Number,
    required: true,
    min: 0
  },
  totalMarks: {
    type: Number,
    required: true
  },
  percentage: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    required: true
  },
  timeTaken: {
    type: Number, // in minutes
    required: true
  },
  isSubmitted: {
    type: Boolean,
    default: true
  },
  proctorLogs: {
    tabSwitches: { type: Number, default: 0 },
    copyPasteAttempts: { type: Number, default: 0 },
    fullscreenViolations: { type: Number, default: 0 },
    multiMonitorDetected: { type: Boolean, default: false },
    audioViolations: { type: Number, default: 0 },
    devToolsAttempts: { type: Number, default: 0 },
    isTerminatedForCheating: { type: Boolean, default: false },
    faceVerified: { type: Boolean, default: true },
    suspiciousFlags: [{ timestamp: Date, reason: String }]
  },
  rank: {
    type: Number,
    default: null
  },
  aiPerformanceSummary: {
    strengths: [String],
    weaknesses: [String],
    recommendations: [String]
  }
}, {
  timestamps: true
});

// Ensure one submission per student per exam
submissionSchema.index({ student: 1, exam: 1 }, { unique: true });
submissionSchema.index({ student: 1, createdAt: -1 });
submissionSchema.index({ exam: 1, createdAt: -1 });
submissionSchema.index({ totalScore: -1 });

// Calculate percentage before saving
submissionSchema.pre('save', function(next) {
  if (this.totalMarks > 0) {
    this.percentage = Math.round((this.totalScore / this.totalMarks) * 100);
  } else {
    this.percentage = 0;
  }
  next();
});

module.exports = mongoose.model('Submission', submissionSchema);