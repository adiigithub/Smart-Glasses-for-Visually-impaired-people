const express = require('express');
const {
  updateSensorData,
  triggerEmergencyAlert
} = require('../controllers/esp32');

const router = express.Router();

// ESP32 routes - no authentication required for hardware devices
router.route('/sensors/update')
  .post(updateSensorData);

router.route('/emergency/trigger')
  .post(triggerEmergencyAlert);

module.exports = router; 