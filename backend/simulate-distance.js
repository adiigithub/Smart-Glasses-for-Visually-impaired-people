/**
 * Distance Sensor Simulator for Smart Blind Glasses
 * 
 * This script simulates an ultrasonic distance sensor sending readings in centimeters
 * to the backend API every 2 seconds.
 */

const axios = require('axios');
const dotenv = require('dotenv');

// Load env vars
dotenv.config({ path: './config/config.env' });

console.log('==== SMART BLIND GLASSES - DISTANCE SENSOR SIMULATOR ====');
console.log('Sending distance readings in centimeters every 2 seconds');

// Get the user ID from environment vars
const ESP32_USER_ID = process.env.ESP32_USER_ID || '681550f54fd01c5249d92376';

// Configuration
const INTERVAL_MS = 800; // 0.8 seconds - even faster updates
const API_URL = 'http://localhost:5000/api/v1/esp32/sensors/update';

// Pattern simulation - creates dramatic distance patterns 
// with large jumps that will be clearly visible
let distancePattern = [
  // Extremely close obstacles
  5, 5, 5, 10, 
  // Safe distance
  300, 300, 300, 
  // Close obstacle
  20, 20, 20,
  // Medium distance
  100, 100, 100,
  // Dramatic approach
  300, 200, 100, 50, 20, 10, 5,
  // Dramatic retreat
  5, 20, 50, 100, 200, 300
];

let patternIndex = 0;

// Function to simulate distance readings
function simulateDistance() {
  // Use pattern-based simulation with 20% randomness
  const baseDistance = distancePattern[patternIndex];
  patternIndex = (patternIndex + 1) % distancePattern.length;
  
  // Add some randomness (±20%)
  const randomFactor = 0.8 + (Math.random() * 0.4); // 0.8 to 1.2
  const distance = baseDistance * randomFactor;
  
  return Math.round(distance * 10) / 10; // Round to 1 decimal place
}

// Function to simulate battery level (slowly decreasing)
function simulateBatteryLevel() {
  if (!simulateBatteryLevel.level) {
    simulateBatteryLevel.level = 100;
  }
  
  // Decrease battery by 0.1% each time
  simulateBatteryLevel.level -= 0.1;
  
  // Battery can't go below 0%
  if (simulateBatteryLevel.level < 0) {
    simulateBatteryLevel.level = 0;
  }
  
  return Math.round(simulateBatteryLevel.level);
}

// Send simulated sensor data to backend
async function sendSensorData() {
  try {
    const distance = simulateDistance();
    const batteryLevel = simulateBatteryLevel();
    
    const payload = {
      distance: distance,
      batteryLevel: batteryLevel,
      location: {
        latitude: 19.0760,
        longitude: 72.8777,
        accuracy: 10.0
      }
    };
    
    console.log(`\n${new Date().toLocaleTimeString()} - Sending data:`);
    console.log(`Distance: ${distance.toFixed(1)} cm, Battery: ${batteryLevel}%`);
    
    const response = await axios.post(API_URL, payload);
    
    if (response.status === 200) {
      console.log('✅ Data sent successfully!');
      console.log(`Response: ${JSON.stringify(response.data.message)}`);
      
      // Log obstacle warnings based on distance
      if (distance < 30) {
        console.log(`⚠️ CRITICAL: Obstacle very close at ${distance.toFixed(1)} cm!`);
      } else if (distance < 60) {
        console.log(`⚠️ WARNING: Obstacle detected at ${distance.toFixed(1)} cm`);
      }
    }
  } catch (error) {
    console.error('❌ Error sending data:');
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error(error.response.data);
    } else {
      console.error(error.message);
    }
  }
}

// Set up interval to send data periodically
const intervalId = setInterval(sendSensorData, INTERVAL_MS);

// Also send data immediately when starting
sendSensorData();

// Handle termination
process.on('SIGINT', () => {
  clearInterval(intervalId);
  console.log('\nDistance sensor simulator stopped.');
  process.exit();
});

console.log('\nPress Ctrl+C to stop the simulator...'); 