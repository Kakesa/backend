const mongoose = require('mongoose');

const helpRequestSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  type: {
    type: String,
    required: true,
    enum: ['complaint', 'feature', 'bug', 'question']
  },
  subject: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    required: true,
    enum: ['pending', 'in-progress', 'resolved'],
    default: 'pending'
  },
  userType: {
    type: String,
    required: true,
    enum: ['admin', 'teacher', 'student', 'parent']
  },
  userName: {
    type: String,
    required: true,
    trim: true
  },
  userEmail: {
    type: String,
    required: true,
    trim: true
  },
  userId: {
    type: String,
    required: true
  },
  schoolId: {
    type: String,
    required: true
  },
  response: {
    type: String,
    trim: true
  },
  adminResponse: {
    type: String,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index pour optimiser les requêtes
helpRequestSchema.index({ schoolId: 1, status: 1, type: 1, userType: 1, createdAt: -1 });

module.exports = mongoose.model('HelpRequest', helpRequestSchema);
