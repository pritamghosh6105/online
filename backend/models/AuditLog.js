const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  userName: {
    type: String,
    default: 'System'
  },
  userEmail: {
    type: String,
    default: ''
  },
  action: {
    type: String,
    required: true,
    index: true
  },
  details: {
    type: String,
    default: ''
  },
  ipAddress: {
    type: String,
    default: '127.0.0.1'
  },
  institution: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('AuditLog', auditLogSchema);
