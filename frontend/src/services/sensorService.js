import api from './api';

// Get sensor readings for a user
export const getSensorReadings = async (userId, limit = 100) => {
  try {
    const response = await api.get(`/api/v1/sensors/readings/${userId}?limit=${limit}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Submit sensor reading (simulated data from ESP32)
export const submitSensorReading = async (userId, distance, latitude, longitude, batteryLevel = 100) => {
  try {
    const response = await api.post('/api/v1/sensors/readings', {
      userId,
      distance,
      latitude,
      longitude,
      batteryLevel
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Trigger emergency alert
export const triggerEmergency = async (userId, latitude, longitude) => {
  try {
    // Trigger emergency text-to-speech announcement
    speakEmergencyAlert();
    
    const response = await api.post('/api/v1/sensors/emergency', {
      userId,
      latitude,
      longitude
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Resolve emergency alert
export const resolveEmergency = async (emergencyId) => {
  try {
    const response = await api.put(`/api/v1/sensors/emergency/${emergencyId}/resolve`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get emergency history for a user
export const getUserEmergencies = async (userId) => {
  try {
    const response = await api.get(`/api/v1/sensors/emergency/${userId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Generate simulated sensor data for testing
export const generateSimulatedData = (userId) => {
  // Generate random distance between 0.1 and 5 meters
  const distance = Math.random() * 4.9 + 0.1;
  
  // Generate random location near a base location
  // Default to somewhere in the world (can be adjusted to your location)
  const baseLatitude = 40.7128; // New York City latitude
  const baseLongitude = -74.0060; // New York City longitude
  
  // Add small random offset (about 100-500 meters)
  const latOffset = (Math.random() - 0.5) * 0.01;
  const lngOffset = (Math.random() - 0.5) * 0.01;
  
  const latitude = baseLatitude + latOffset;
  const longitude = baseLongitude + lngOffset;
  
  // Generate random battery level (usually between 20-100%)
  // For simulation purposes, we're more likely to generate higher levels
  const batteryLevel = Math.floor(Math.random() * 30) + 70;
  
  return {
    userId,
    distance,
    latitude,
    longitude,
    batteryLevel
  };
};

// Text-to-speech functions

// Speak obstacle detection announcement
export const speakObstacleAlert = (distance) => {
  if (!window.speechSynthesis) return;
  
  // Stop any ongoing speech
  window.speechSynthesis.cancel();
  
  let message;
  if (distance < 0.5) {
    message = `Warning! Obstacle very close at ${distance.toFixed(1)} meters. Stop immediately.`;
  } else if (distance < 1) {
    message = `Caution! Obstacle detected at ${distance.toFixed(1)} meters ahead.`;
  } else if (distance < 2) {
    message = `Obstacle at ${distance.toFixed(1)} meters ahead.`;
  }
  
  if (message) {
    const speech = new SpeechSynthesisUtterance(message);
    speech.rate = 1.1; // Slightly faster than normal
    speech.pitch = 1.1; // Slightly higher pitch for alerts
    speech.volume = 1.0; // Maximum volume
    window.speechSynthesis.speak(speech);
  }
};

// Speak battery level announcement
export const speakBatteryAlert = (batteryLevel) => {
  if (!window.speechSynthesis) return;
  
  if (batteryLevel <= 10) {
    const speech = new SpeechSynthesisUtterance(
      `Critical battery alert. Only ${batteryLevel} percent remaining. Please charge immediately.`
    );
    speech.rate = 1.0;
    speech.volume = 1.0;
    window.speechSynthesis.speak(speech);
  } else if (batteryLevel <= 20) {
    const speech = new SpeechSynthesisUtterance(
      `Low battery. ${batteryLevel} percent remaining. Please charge soon.`
    );
    speech.rate = 1.0;
    speech.volume = 1.0;
    window.speechSynthesis.speak(speech);
  }
};

// Speak emergency alert announcement
export const speakEmergencyAlert = () => {
  if (!window.speechSynthesis) return;
  
  // Stop any ongoing speech
  window.speechSynthesis.cancel();
  
  const speech = new SpeechSynthesisUtterance(
    "Emergency alert activated. Contacting caregivers now."
  );
  speech.rate = 1.0;
  speech.volume = 1.0;
  window.speechSynthesis.speak(speech);
}; 