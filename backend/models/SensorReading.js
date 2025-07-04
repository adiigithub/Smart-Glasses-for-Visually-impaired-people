const mongoose = require('mongoose');

const SensorReadingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  distance: {
    type: Number,
    required: true
  },
  batteryLevel: {
    type: Number,
    min: 0,
    max: 100,
    default: 100
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
  source: {
    type: String,
    enum: ['app', 'esp32-device', 'web'],
    default: 'app'
  }
});

// Index to optimize query performance
SensorReadingSchema.index({ user: 1, timestamp: -1 });

module.exports = mongoose.model('SensorReading', SensorReadingSchema); 