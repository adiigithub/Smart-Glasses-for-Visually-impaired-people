const express = require('express');
const {
  submitSensorReading,
  getSensorReadings,
  triggerEmergency,
  resolveEmergency,
  getUserEmergencies
} = require('../controllers/sensors');

const { protect } = require('../middleware/auth');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(protect);

// Sensor routes
router.route('/readings')
  .post(submitSensorReading);

router.route('/readings/:userId')
  .get(getSensorReadings);

// Emergency routes
router.route('/emergency')
  .post(triggerEmergency);

router.route('/emergency/:id/resolve')
  .put(resolveEmergency);

router.route('/emergency/:userId')
  .get(getUserEmergencies);

module.exports = router; 