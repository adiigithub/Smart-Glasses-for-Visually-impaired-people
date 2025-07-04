/**
 * Setup Emergency Contacts for ESP32 User
 * 
 * This script adds an emergency contact to the user associated with the ESP32 device
 * so that when the emergency button is pressed, emails will be sent.
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Caregiver = require('./models/Caregiver');

// Load env vars
dotenv.config({ path: './config/config.env' });

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI);

mongoose.connection.on('connected', async () => {
  console.log('MongoDB Connected: ' + mongoose.connection.host);
  
  try {
    // Get the ESP32 user ID from config
    const ESP32_USER_ID = process.env.ESP32_USER_ID;
    
    console.log(`Setting up emergency contacts for ESP32 user ID: ${ESP32_USER_ID}`);
    
    // Find the user
    const user = await User.findById(ESP32_USER_ID);
    
    if (!user) {
      console.error('User not found! Check your ESP32_USER_ID in config.env');
      process.exit(1);
    }
    
    console.log(`Found user: ${user.name} (${user.email})`);
    
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
    
    // Add a real email contact that will actually receive emails
    console.log('\nDo you want to add a real email that will receive emergency alerts?');
    console.log('Enter an email address or press enter to skip:');
    
    process.stdin.once('data', async (data) => {
      const email = data.toString().trim();
      
      if (email && email.includes('@')) {
        let realCaregiver = await Caregiver.findOne({ email });
        
        if (!realCaregiver) {
          console.log(`Creating caregiver with email: ${email}`);
          realCaregiver = await Caregiver.create({
            name: 'Real Emergency Contact',
            email: email,
            phone: '0000000000',
            relationship: 'Emergency Contact',
            password: 'password123'
          });
          console.log('Real caregiver created.');
        }
        
        const hasRealCaregiver = user.emergencyContacts.some(
          contactId => contactId.toString() === realCaregiver._id.toString()
        );
        
        if (!hasRealCaregiver) {
          user.emergencyContacts.push(realCaregiver._id);
          await user.save();
          console.log('Real caregiver added to emergency contacts.');
        } else {
          console.log('Real caregiver already in emergency contacts.');
        }
      }
      
      console.log('\nEmergency contacts setup complete!');
      console.log(`User now has ${user.emergencyContacts.length} emergency contacts.`);
      console.log('The ESP32 emergency button should now send email alerts.');
      
      // Exit after setup is complete
      process.exit(0);
    });
    
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
}); 