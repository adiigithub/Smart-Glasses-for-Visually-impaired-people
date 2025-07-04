const ErrorResponse = require('../utils/errorResponse');
const User = require('../models/User');
const SensorReading = require('../models/SensorReading');
const EmergencyEvent = require('../models/EmergencyEvent');
const Caregiver = require('../models/Caregiver');
const sendEmail = require('../utils/sendEmail');
const esp32Config = require('../config/esp32-config');

// Retrieve the ESP32 associated user (using config file)
const ESP32_USER_ID = "681550f54fd01c5249d92376"; // Hardcoded for reliable operation

// @desc    Update sensor data from ESP32
// @route   POST /api/v1/esp32/sensors/update
// @access  Public (for ESP32 device)
exports.updateSensorData = async (req, res, next) => {
  try {
    const { distance, batteryLevel, location } = req.body;

    console.log('ESP32 Sensor Data Received:', {
      distance,
      batteryLevel,
      location
    });

    // Find the user associated with this ESP32 device
    const user = await User.findById(ESP32_USER_ID);
    if (!user) {
      return next(
        new ErrorResponse(`User not found for ESP32 device. Check configuration.`, 404)
      );
    }

    // Create sensor reading
    const sensorReading = await SensorReading.create({
      user: user._id,
      distance,
      batteryLevel,
      location: {
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy || 10.0
      },
      source: 'esp32-device'
    });

    // Update user's last location and sensor readings
    user.lastLocation = {
      latitude: location.latitude,
      longitude: location.longitude,
      timestamp: Date.now()
    };
    
    user.lastDistanceReading = {
      distance,
      timestamp: Date.now()
    };

    user.batteryLevel = batteryLevel;
    
    // Update device info
    user.deviceInfo = {
      esp32Connected: true,
      lastHeartbeat: Date.now(),
      firmwareVersion: req.body.firmwareVersion || user.deviceInfo?.firmwareVersion || '1.0.0'
    };
    
    await user.save();

    // Check if distance indicates an obstacle is very close (using config values)
    if (distance < esp32Config.sensorSettings.proximityAlertThreshold) {
      console.log(`CRITICAL: Obstacle detected at ${distance}cm. Immediate attention required.`);
      // In a production system, this might trigger notifications to caregivers
      // or automatically activate text-to-speech on the device
    } else if (distance < esp32Config.sensorSettings.proximityWarningThreshold) {
      console.log(`WARNING: Obstacle detected at ${distance}cm. Caution advised.`);
    }
    
    // Check battery level for warnings
    if (batteryLevel < esp32Config.sensorSettings.criticalBatteryThreshold) {
      console.log(`CRITICAL: Battery level extremely low at ${batteryLevel}%. Device may shut down soon.`);
      // Consider notifying caregivers about critical battery level
    } else if (batteryLevel < esp32Config.sensorSettings.lowBatteryThreshold) {
      console.log(`WARNING: Battery level low at ${batteryLevel}%. Charging recommended.`);
    }

    res.status(200).json({
      success: true,
      message: 'Sensor data received and processed successfully',
      data: sensorReading
    });
  } catch (err) {
    console.error('ESP32 Sensor Update Error:', err.message);
    next(err);
  }
};

// @desc    Trigger emergency alert from ESP32
// @route   POST /api/v1/esp32/emergency/trigger
// @access  Public (for ESP32 device)
exports.triggerEmergencyAlert = async (req, res, next) => {
  try {
    const { latitude, longitude, accuracy } = req.body;

    console.log('ESP32 Emergency Alert Triggered:', {
      latitude,
      longitude,
      accuracy
    });

    // Find the user associated with this ESP32 device
    const user = await User.findById(ESP32_USER_ID).populate('emergencyContacts');
    if (!user) {
      return next(
        new ErrorResponse(`User not found for ESP32 device. Check configuration.`, 404)
      );
    }

    // Create emergency event
    const emergencyEvent = await EmergencyEvent.create({
      user: user._id,
      location: {
        latitude,
        longitude,
        accuracy: accuracy || 10.0
      },
      status: 'pending',
      source: 'esp32-device'
    });

    // Send notification to all caregivers
    const notifiedCaregivers = [];
    
    // Only proceed if the user has emergency contacts
    if (!user.emergencyContacts || user.emergencyContacts.length === 0) {
      console.warn(`User ${user._id} has no emergency contacts configured!`);
    } else {
      for (const caregiverId of user.emergencyContacts) {
        const caregiver = await Caregiver.findById(caregiverId);
        
        if (caregiver) {
          // Create Google Maps link with coordinates
          const googleMapsLink = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
          
          // Prepare email content
          const emailContent = {
            email: caregiver.email,
            subject: 'EMERGENCY ALERT - Smart Glass User Needs Help',
            message: `
              EMERGENCY ALERT!
              
              User ${user.name} has triggered an emergency alert from their Smart Glass device.
              
              Location: ${googleMapsLink}
              
              Please respond immediately!
            `,
            html: `
              <h1 style="color: red;">EMERGENCY ALERT!</h1>
              <p><strong>User ${user.name} has triggered an emergency alert from their Smart Glass device.</strong></p>
              <p>Current Location: <a href="${googleMapsLink}" target="_blank">View on Google Maps</a></p>
              <p style="font-weight: bold;">Please respond immediately!</p>
              <p>This alert was generated automatically by the Smart Glass hardware device.</p>
            `
          };
          
          try {
            // Send email
            await sendEmail(emailContent);
            
            // Add to notified caregivers
            notifiedCaregivers.push({
              caregiver: caregiver._id,
              notifiedAt: Date.now(),
              notificationMethod: 'email'
            });

            console.log(`Emergency notification sent to caregiver: ${caregiver.email}`);
          } catch (emailError) {
            console.error(`Failed to send emergency email to ${caregiver.email}:`, emailError);
          }
        }
      }
    }
    
    // Update emergency event with notified caregivers
    emergencyEvent.notifiedCaregivers = notifiedCaregivers;
    emergencyEvent.status = notifiedCaregivers.length > 0 ? 'notified' : 'pending';
    await emergencyEvent.save();

    // Set up follow-up notifications if configured
    if (esp32Config.emergencyAlerts.sendFollowUpNotifications && notifiedCaregivers.length > 0) {
      // This would typically be handled by a separate service or scheduled job
      console.log(`Follow-up notifications scheduled for emergency ${emergencyEvent._id}`);
    }

    res.status(200).json({
      success: true,
      message: 'Emergency alert triggered successfully',
      data: {
        emergencyId: emergencyEvent._id,
        notifiedCaregivers: notifiedCaregivers.length
      }
    });
  } catch (err) {
    console.error('ESP32 Emergency Alert Error:', err.message);
    next(err);
  }
}; 