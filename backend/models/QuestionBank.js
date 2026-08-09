const mongoose = require('mongoose');

const questionBankSchema = new mongoose.Schema({
  question: {
    type: String,
    required: [true, 'Question text is required'],
    trim: true
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true,
    index: true
  },
  subject: {
    type: String,
    required: [true, 'Subject is required'],
    trim: true
  },
  difficulty: {
    type: String,
    enum: ['Easy', 'Medium', 'Hard'],
    default: 'Medium',
    index: true
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
    default: 1,
    min: 1
  },
  explanation: {
    type: String,
    default: ''
  },
  institution: {
    type: String,
    default: ''
  },
  isPublished: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Performance Indexes for Question Bank queries
questionBankSchema.index({ category: 1, isPublished: 1 });
questionBankSchema.index({ createdBy: 1, createdAt: -1 });
questionBankSchema.index({ institution: 1, isPublished: 1 });

module.exports = mongoose.model('QuestionBank', questionBankSchema);
