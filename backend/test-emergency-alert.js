/**
 * Test Emergency Alert Functionality
 * 
 * This script tests sending an emergency alert using the same method as the UserDashboard.
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const axios = require('axios');

// Load env vars
dotenv.config({ path: './config/config.env' });

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI);

mongoose.connection.on('connected', async () => {
  console.log('MongoDB Connected: ' + mongoose.connection.host);
  
  try {
    // Get the user ID from config
    const ESP32_USER_ID = process.env.ESP32_USER_ID;
    
    if (!ESP32_USER_ID) {
      throw new Error('ESP32_USER_ID not found in environment variables');
    }
    
    console.log('Using user ID:', ESP32_USER_ID);
    
    // This is the API endpoint used by the UserDashboard
    const url = `http://localhost:5000/api/v1/sensors/emergency`;
    
    console.log('Sending test emergency alert to:', url);
    
    // Create payload with the same format as UserDashboard
    const payload = {
      userId: ESP32_USER_ID,
      latitude: 19.0760,
      longitude: 72.8777,
      source: 'test-script'
    };
    
    console.log('Payload:', payload);
    
    // Send the request
    const response = await axios.post(url, payload, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Response status:', response.status);
    console.log('Response data:', response.data);
    console.log('Emergency alert test complete!');
    console.log('Check your email to see if the alert was received.');
    
  } catch (err) {
    console.error('Error:', err.message);
    if (err.response) {
      console.error('Response status:', err.response.status);
      console.error('Response data:', err.response.data);
    }
  } finally {
    setTimeout(() => {
      mongoose.disconnect();
      console.log('Disconnected from MongoDB');
      process.exit(0);
    }, 3000);
  }
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
}); 