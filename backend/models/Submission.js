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
  }
}, {
  timestamps: true
});

// Ensure one submission per student per exam
submissionSchema.index({ student: 1, exam: 1 }, { unique: true });

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