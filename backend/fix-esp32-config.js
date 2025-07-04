/**
 * Fix ESP32 Configuration
 * 
 * This script fixes common issues with ESP32 device configuration:
 * 1. Makes sure the ESP32_USER_ID is set to a valid user in the database
 * 2. Creates emergency contacts for the user
 * 3. Tests the emergency alert functionality
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const User = require('./models/User');
const Caregiver = require('./models/Caregiver');
const { triggerEmergencyAlert } = require('./controllers/esp32');

// Load env vars
dotenv.config({ path: './config/config.env' });

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI);

mongoose.connection.on('connected', async () => {
  console.log('MongoDB Connected: ' + mongoose.connection.host);
  
  try {
    console.log('\n===== STEP 1: CHECKING USER CONFIGURATION =====');
    
    // Find the active user (in this case, Aditya)
    const user = await User.findOne({ email: 'adityatripathi18115@gmail.com' });
    
    if (!user) {
      console.error('User not found! Please check your database.');
      process.exit(1);
    }
    
    console.log(`Found user: ${user.name} (${user.email})`);
    console.log(`User ID: ${user._id}`);
    
    // Check if ESP32_USER_ID matches the user ID
    const configEnvPath = path.join(__dirname, 'config', 'config.env');
    let configFile = fs.readFileSync(configEnvPath, 'utf8');
    
    const ESP32_USER_ID = process.env.ESP32_USER_ID;
    console.log(`Current ESP32_USER_ID in config.env: ${ESP32_USER_ID}`);
    
    if (ESP32_USER_ID !== user._id.toString()) {
      console.log('ESP32_USER_ID does not match the user ID. Updating...');
      
      // Update the config file
      configFile = configFile.replace(
        /ESP32_USER_ID=.*/,
        `ESP32_USER_ID=${user._id.toString()}`
      );
      
      fs.writeFileSync(configEnvPath, configFile);
      
      console.log('config.env updated with correct user ID.');
      console.log('Please restart your server for changes to take effect.');
      
      // Update process.env for this script session
      process.env.ESP32_USER_ID = user._id.toString();
    } else {
      console.log('ESP32_USER_ID matches the user ID. No changes needed.');
    }
    
    console.log('\n===== STEP 2: CHECKING EMERGENCY CONTACTS =====');
    
    // Create a caregiver for testing if none exists
    let caregiver = await Caregiver.findOne({ email: 'emergency@example.com' });
    
    if (!caregiver) {
      console.log('Creating a test caregiver...');
      caregiver = await Caregiver.create({
        name: 'Emergency Contact',
        email: 'emergency@example.com',
        phone: '1234567890',
        relationship: 'Tester',
        password: 'password123'
      });
      console.log('Test caregiver created.');
    } else {
      console.log('Found existing test caregiver.');
    }
    
    // Add the caregiver to user's emergency contacts if not already there
    if (!user.emergencyContacts) {
      user.emergencyContacts = [];
    }
    
    // Check if caregiver is already in emergency contacts
    const hasCaregiver = user.emergencyContacts.some(
      contactId => contactId.toString() === caregiver._id.toString()
    );
    
    if (!hasCaregiver) {
      console.log('Adding caregiver to emergency contacts...');
      user.emergencyContacts.push(caregiver._id);
      await user.save();
      console.log('Caregiver added to emergency contacts.');
    } else {
      console.log('Caregiver already in emergency contacts.');
    }
    
    // Create a real caregiver with the same email as the user
    let realCaregiver = await Caregiver.findOne({ email: user.email });
    
    if (!realCaregiver) {
      console.log(`Creating a caregiver with user's email (${user.email})...`);
      realCaregiver = await Caregiver.create({
        name: 'Self Contact',
        email: user.email,
        phone: '0000000000',
        relationship: 'Self',
        password: 'password123'
      });
      console.log('Self caregiver created.');
    } else {
      console.log('Found existing caregiver with user\'s email.');
    }
    
    const hasRealCaregiver = user.emergencyContacts.some(
      contactId => contactId.toString() === realCaregiver._id.toString()
    );
    
    if (!hasRealCaregiver) {
      user.emergencyContacts.push(realCaregiver._id);
      await user.save();
      console.log('Self caregiver added to emergency contacts.');
    } else {
      console.log('Self caregiver already in emergency contacts.');
    }
    
    console.log(`User now has ${user.emergencyContacts.length} emergency contacts.`);
    
    console.log('\n===== STEP 3: TESTING EMERGENCY ALERT =====');
    console.log('Sending test emergency alert...');
    
    // Create mock request and response objects to test
    const req = {
      body: {
        latitude: 19.0760,
        longitude: 72.8777,
        accuracy: 10.0
      }
    };
    
    const res = {
      status: (code) => {
        console.log(`Response status: ${code}`);
        return res;
      },
      json: (data) => {
        console.log('Response data:', data);
      }
    };
    
    // Call the emergency alert function directly
    await triggerEmergencyAlert(req, res, (err) => {
      if (err) {
        console.error('Error in emergency alert:', err);
      }
    });
    
    console.log('\n===== CONFIGURATION COMPLETE =====');
    console.log('1. ESP32_USER_ID is correctly set in config.env');
    console.log('2. User has emergency contacts configured');
    console.log('3. Emergency alert system has been tested');
    console.log('\nYour ESP32 emergency button should now work correctly!');
    console.log('Upload the updated firmware to your ESP32 device.');
    
    // Exit after setup is complete
    setTimeout(() => {
      mongoose.disconnect();
      process.exit(0);
    }, 3000);
    
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
}); 