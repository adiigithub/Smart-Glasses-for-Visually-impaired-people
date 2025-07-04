const ErrorResponse = require('../utils/errorResponse');
const User = require('../models/User');
const Caregiver = require('../models/Caregiver');
const SensorReading = require('../models/SensorReading');
const EmergencyEvent = require('../models/EmergencyEvent');
const sendEmail = require('../utils/sendEmail');

// @desc    Submit sensor readings (distance + GPS)
// @route   POST /api/v1/sensors/readings
// @access  Private
exports.submitSensorReading = async (req, res, next) => {
  try {
    const { userId, distance, latitude, longitude, batteryLevel } = req.body;

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return next(new ErrorResponse(`User not found with id of ${userId}`, 404));
    }

    // Create sensor reading
    const sensorReading = await SensorReading.create({
      user: userId,
      distance,
      batteryLevel: batteryLevel || 100,
      location: {
        latitude,
        longitude
      },
      source: 'app'
    });

    // Update user's last location and distance reading
    user.lastLocation = {
      latitude,
      longitude,
      timestamp: Date.now()
    };
    
    user.lastDistanceReading = {
      distance,
      timestamp: Date.now()
    };
    
    // Update battery level if provided
    if (batteryLevel) {
      user.batteryLevel = batteryLevel;
    }
    
    // Update device info
    user.deviceInfo = {
      ...user.deviceInfo,
      esp32Connected: true,
      lastHeartbeat: Date.now()
    };
    
    await user.save();

    res.status(201).json({
      success: true,
      data: sensorReading
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get sensor readings for a user
// @route   GET /api/v1/sensors/readings/:userId
// @access  Private
exports.getSensorReadings = async (req, res, next) => {
  try {
    const { userId } = req.params;
    
    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return next(new ErrorResponse(`User not found with id of ${userId}`, 404));
    }

    // Check authorization
    if (req.role === 'user' && req.user.id !== userId) {
      return next(
        new ErrorResponse(`Not authorized to view this user's sensor readings`, 401)
      );
    }

    // If caregiver, check if user is under their care
    if (req.role === 'caregiver') {
      const caregiver = await Caregiver.findById(req.user.id);
      const isUserUnderCare = caregiver.usersUnderCare.some(
        id => id.toString() === userId
      );

      if (!isUserUnderCare) {
        return next(
          new ErrorResponse(`Not authorized to view this user's sensor readings`, 401)
        );
      }
    }

    // Get sensor readings
    const readings = await SensorReading.find({ user: userId })
      .sort('-timestamp')
      .limit(req.query.limit ? parseInt(req.query.limit) : 100);

    res.status(200).json({
      success: true,
      count: readings.length,
      data: readings
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Trigger emergency alert
// @route   POST /api/v1/sensors/emergency
// @access  Private
exports.triggerEmergency = async (req, res, next) => {
  try {
    const { userId, latitude, longitude } = req.body;

    // Find the user
    const user = await User.findById(userId).populate('emergencyContacts');
    if (!user) {
      return next(new ErrorResponse(`User not found with id of ${userId}`, 404));
    }

    // Create emergency event
    const emergencyEvent = await EmergencyEvent.create({
      user: userId,
      location: {
        latitude,
        longitude
      },
      status: 'pending'
    });

    // Send email to all caregivers
    const notifiedCaregivers = [];
    
    for (const caregiverId of user.emergencyContacts) {
      const caregiver = await Caregiver.findById(caregiverId);
      
      if (caregiver) {
        // Create Google Maps link with coordinates
        const googleMapsLink = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
        
        // Prepare email content
        const emailContent = {
          email: caregiver.email,
          subject: 'EMERGENCY ALERT - Smart Blind Glasses User Needs Help',
          message: `
            EMERGENCY ALERT!
            
            User ${user.name} has triggered an emergency alert.
            
            Location: ${googleMapsLink}
            
            Please respond immediately!
          `,
          html: `
            <h1 style="color: red;">EMERGENCY ALERT!</h1>
            <p><strong>User ${user.name} has triggered an emergency alert.</strong></p>
            <p>Current Location: <a href="${googleMapsLink}" target="_blank">View on Google Maps</a></p>
            <p style="font-weight: bold;">Please respond immediately!</p>
          `
        };
        
        // Send email
        await sendEmail(emailContent);
        
        // Add to notified caregivers
        notifiedCaregivers.push({
          caregiver: caregiver._id,
          notifiedAt: Date.now(),
          notificationMethod: 'email'
        });
      }
    }
    
    // Update emergency event with notified caregivers
    emergencyEvent.notifiedCaregivers = notifiedCaregivers;
    emergencyEvent.status = 'notified';
    await emergencyEvent.save();

    res.status(200).json({
      success: true,
      data: emergencyEvent
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Resolve emergency alert
// @route   PUT /api/v1/sensors/emergency/:id/resolve
// @access  Private
exports.resolveEmergency = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Find emergency event
    const emergencyEvent = await EmergencyEvent.findById(id);
    if (!emergencyEvent) {
      return next(new ErrorResponse(`Emergency event not found with id of ${id}`, 404));
    }
    
    // Check if caregiver is authorized
    if (req.role === 'caregiver') {
      const isNotified = emergencyEvent.notifiedCaregivers.some(
        notify => notify.caregiver.toString() === req.user.id
      );
      
      if (!isNotified) {
        return next(
          new ErrorResponse(`Not authorized to resolve this emergency`, 401)
        );
      }
    }
    
    // Update emergency event
    emergencyEvent.status = 'resolved';
    emergencyEvent.resolvedAt = Date.now();
    emergencyEvent.resolvedBy = req.role === 'caregiver' ? req.user.id : null;
    await emergencyEvent.save();
    
    res.status(200).json({
      success: true,
      data: emergencyEvent
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all emergency events for a user
// @route   GET /api/v1/sensors/emergency/:userId
// @access  Private
exports.getUserEmergencies = async (req, res, next) => {
  try {
    const { userId } = req.params;
    
    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return next(new ErrorResponse(`User not found with id of ${userId}`, 404));
    }
    
    // Check authorization
    if (req.role === 'user' && req.user.id !== userId) {
      return next(
        new ErrorResponse(`Not authorized to view this user's emergencies`, 401)
      );
    }
    
    // If caregiver, check if user is under their care
    if (req.role === 'caregiver') {
      const caregiver = await Caregiver.findById(req.user.id);
      const isUserUnderCare = caregiver.usersUnderCare.some(
        id => id.toString() === userId
      );
      
      if (!isUserUnderCare) {
        return next(
          new ErrorResponse(`Not authorized to view this user's emergencies`, 401)
        );
      }
    }
    
    // Get emergencies
    const emergencies = await EmergencyEvent.find({ user: userId })
      .sort('-timestamp')
      .populate('resolvedBy', 'name email');
    
    res.status(200).json({
      success: true,
      count: emergencies.length,
      data: emergencies
    });
  } catch (err) {
    next(err);
  }
}; 