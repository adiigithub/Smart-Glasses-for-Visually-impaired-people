/**
 * Test ESP32 Emergency Alert
 * 
 * This script tests the ESP32 emergency alert endpoint directly,
 * simulating what happens when the physical button is pressed.
 */

const axios = require('axios');

console.log('Testing ESP32 emergency alert endpoint...');

// This is the endpoint used by the ESP32 device
const url = 'http://localhost:5000/api/v1/esp32/emergency/trigger';

// Create payload matching what the ESP32 sends
const payload = {
  latitude: 19.0760,
  longitude: 72.8777,
  accuracy: 10.0
};

console.log('Sending request to:', url);
console.log('With payload:', payload);

axios.post(url, payload)
  .then(response => {
    console.log('✅ SUCCESS! Response status:', response.status);
    console.log('Response data:', response.data);
    console.log('\nCheck your email to see if the alert was received.');
  })
  .catch(error => {
    console.error('❌ ERROR!');
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    } else {
      console.error('Error message:', error.message);
    }
  }); 