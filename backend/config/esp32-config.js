/**
 * ESP32 Device Configuration
 * --------------------------
 * This file contains the configuration for the ESP32 devices
 * and can be modified based on your deployment needs.
 */

const config = {
  // Default value for ESP32_USER_ID if not set in environment variable
  // This should be updated to a real user ID from your database
  defaultUserId: process.env.ESP32_USER_ID || '60d0fe4f5311236168a109ca',
  
  // Sensor thresholds and alert settings
  sensorSettings: {
    // Distance threshold in cm to trigger proximity warning
    proximityWarningThreshold: 50,
    
    // Distance threshold in cm to trigger critical proximity alert
    proximityAlertThreshold: 30,
    
    // Battery level threshold for low battery warnings
    lowBatteryThreshold: 20,
    
    // Battery level threshold for critical battery alerts
    criticalBatteryThreshold: 10
  },
  
  // Settings for handling ESP32 device connectivity
  connectivity: {
    // Maximum time in milliseconds between heartbeats before device is considered disconnected
    heartbeatTimeout: 5 * 60 * 1000, // 5 minutes
    
    // How often device should send data when idle (in milliseconds)
    idleUpdateInterval: 30 * 1000, // 30 seconds
    
    // How often device should send data when active/moving (in milliseconds)
    activeUpdateInterval: 5 * 1000 // 5 seconds
  },
  
  // Emergency alert settings
  emergencyAlerts: {
    // Whether to automatically resolve emergency alerts after a certain time
    autoResolveEnabled: false,
    
    // Time in milliseconds after which emergencies are auto-resolved if enabled
    autoResolveTimeout: 60 * 60 * 1000, // 1 hour
    
    // Whether to send follow-up notifications for unresolved emergencies
    sendFollowUpNotifications: true,
    
    // Time in milliseconds between follow-up notifications
    followUpInterval: 15 * 60 * 1000 // 15 minutes
  }
};

module.exports = config; 