const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [
      /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
      'Please provide a valid email'
    ]
  },
  studentId: {
    type: String,
    unique: true,
    sparse: true,
    index: true
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  role: {
    type: String,
    enum: ['student', 'admin', 'superadmin'],
    default: 'student'
  },
  institution: {
    type: String,
    trim: true,
    default: ''
  },
  isApproved: {
    type: Boolean,
    default: function() {
      return this.role !== 'admin'; // Students and superadmins are auto-approved; sub-admins require approval
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isTwoFactorEnabled: {
    type: Boolean,
    default: false
  },
  qrLoginKey: {
    type: String,
    default: ''
  },
  plan: {
    type: String,
    default: 'Free'
  },
  activeExamSession: {
    examId: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', default: null },
    sessionToken: { type: String, default: null },
    startTime: { type: Date, default: null },
    isActive: { type: Boolean, default: false }
  }
}, {
  timestamps: true
});

// Performance Indexes for User lookups and authorization
userSchema.index({ role: 1, institution: 1 });
userSchema.index({ email: 1, role: 1 });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Remove password from JSON output
userSchema.methods.toJSON = function() {
  const userObject = this.toObject();
  delete userObject.password;
  return userObject;
};

module.exports = mongoose.model('User', userSchema);