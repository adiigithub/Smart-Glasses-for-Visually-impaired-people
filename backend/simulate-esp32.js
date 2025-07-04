/**
 * ESP32 Simulator Script
 * This script simulates an ESP32 device sending data to your backend
 * Run it with: node simulate-esp32.js
 */

const axios = require('axios');
const dotenv = require('dotenv');

// Load env vars
dotenv.config({ path: './config/config.env' });

// Set up the simulation parameters
const API_URL = 'http://localhost:5000/api/v1/esp32/sensors/update';
const INTERVAL_MS = 2000; // Send data every 2 seconds
const ESP32_USER_ID = process.env.ESP32_USER_ID || '681550f54fd01c5249d92376';

console.log('ESP32 Simulator starting...');
console.log(`Using user ID: ${ESP32_USER_ID}`);
console.log(`Sending data to: ${API_URL}`);
console.log(`Data interval: ${INTERVAL_MS}ms`);

// Function to simulate distance readings
function simulateDistance() {
  // Simulate a random distance between 10cm and 300cm
  // Occasionally (10% chance) simulate a very close object (0-30cm)
  const isClose = Math.random() < 0.1;
  
  if (isClose) {
    return Math.random() * 30;
  } else {
    return 30 + Math.random() * 270;
  }
}

// Function to simulate battery level
function simulateBatteryLevel() {
  // Slowly decrease battery level over time, starting from 100%
  if (!simulateBatteryLevel.level) {
    simulateBatteryLevel.level = 100;
  }
  
  // Decrease by 0.1-0.5% each time
  simulateBatteryLevel.level -= Math.random() * 0.4 + 0.1;
  
  // Ensure it doesn't go below 10%
  if (simulateBatteryLevel.level < 10) {
    simulateBatteryLevel.level = 10;
  }
  
  return Math.round(simulateBatteryLevel.level);
}

// Function to simulate location
function simulateLocation() {
  // Simulate location around Mumbai, India (or adjust to your location)
  const latitude = 19.0760 + (Math.random() - 0.5) * 0.01;
  const longitude = 72.8777 + (Math.random() - 0.5) * 0.01;
  
  return {
    latitude,
    longitude,
    accuracy: 10.0
  };
}

// Function to send emergency alert
async function sendEmergencyAlert() {
  try {
    const location = simulateLocation();
    
    const payload = {
      latitude: location.latitude,
      longitude: location.longitude,
      accuracy: 10.0
    };
    
    console.log('⚠️ EMERGENCY ALERT TRIGGERED!');
    console.log('Sending emergency payload:', payload);
    
    const EMERGENCY_URL = 'http://localhost:5000/api/v1/esp32/emergency/trigger';
    
    const response = await axios.post(EMERGENCY_URL, payload, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.status === 200) {
      console.log('✅ EMERGENCY ALERT SENT SUCCESSFULLY!');
      console.log('Response:', response.data);
    }
  } catch (error) {
    console.error('❌ Error sending emergency alert:');
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error(error.response.data);
    } else if (error.request) {
      console.error('No response received from server');
    } else {
      console.error(error.message);
    }
  }
}

// Function to send simulated data to the API
async function sendSimulatedData() {
  try {
    const distance = simulateDistance();
    const batteryLevel = simulateBatteryLevel();
    const location = simulateLocation();
    
    const payload = {
      distance,
      batteryLevel,
      location
    };
    
    console.log(`Sending: Distance: ${distance.toFixed(2)}cm, Battery: ${batteryLevel}%`);
    
    const response = await axios.post(API_URL, payload, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.status === 200) {
      console.log('✅ Data sent successfully!');
    }
  } catch (error) {
    console.error('❌ Error sending data:');
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error(error.response.data);
    } else if (error.request) {
      console.error('No response received from server');
    } else {
      console.error(error.message);
    }
  }
}

// Set up interval to send data periodically
const intervalId = setInterval(sendSimulatedData, INTERVAL_MS);

// Also send data immediately when starting
sendSimulatedData();

// Setup command-line interface for emergency button
console.log('\n==== COMMAND INTERFACE ====');
console.log('Press [e] + [Enter] to trigger an emergency alert (simulates button press)');
console.log('Press [Ctrl+C] to exit');

process.stdin.setEncoding('utf8');
process.stdin.on('data', async (data) => {
  const input = data.trim().toLowerCase();
  
  if (input === 'e') {
    console.log('\n🚨 EMERGENCY BUTTON PRESSED! 🚨');
    await sendEmergencyAlert();
  }
});

// Handle termination
process.on('SIGINT', () => {
  clearInterval(intervalId);
  console.log('ESP32 Simulator stopped.');
  process.exit();
});

console.log('Press Ctrl+C to stop the simulator...'); 