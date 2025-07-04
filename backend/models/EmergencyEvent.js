const mongoose = require('mongoose');

const EmergencyEventSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  location: {
    latitude: {
      type: Number,
      required: true
    },
    longitude: {
      type: Number,
      required: true
    },
    accuracy: {
      type: Number,
      default: 10.0
    }
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['pending', 'notified', 'resolved'],
    default: 'pending'
  },
  source: {
    type: String,
    enum: ['app', 'esp32-device', 'web', 'caregiver'],
    default: 'app'
  },
  resolvedAt: {
    type: Date
  },
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Caregiver'
  },
  notifiedCaregivers: [{
    caregiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Caregiver'
    },
    notifiedAt: {
      type: Date
    },
    notificationMethod: {
      type: String,
      enum: ['email', 'push', 'sms'],
      default: 'email'
    }
  }]
});

// Index to optimize query performance
EmergencyEventSchema.index({ user: 1, timestamp: -1 });
EmergencyEventSchema.index({ status: 1 });

module.exports = mongoose.model('EmergencyEvent', EmergencyEventSchema); 