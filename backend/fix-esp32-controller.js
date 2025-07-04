/**
 * Fix ESP32 Controller Code 
 * 
 * This script modifies the ESP32 controller to directly use the correct user ID
 * instead of relying on environment variables or config files.
 */

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

// Load env vars
dotenv.config({ path: './config/config.env' });

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI);

mongoose.connection.on('connected', async () => {
  console.log('MongoDB Connected: ' + mongoose.connection.host);
  
  try {
    // Find the user based on email
    const user = await User.findOne({ email: 'adityatripathi18115@gmail.com' });
    
    if (!user) {
      console.error('User not found! Cannot fix controller.');
      process.exit(1);
    }
    
    console.log(`Found user: ${user.name} (${user.email})`);
    console.log(`User ID: ${user._id}`);
    
    // Path to the ESP32 controller file
    const controllerPath = path.join(__dirname, 'controllers', 'esp32.js');
    
    if (!fs.existsSync(controllerPath)) {
      console.error('ESP32 controller file not found!');
      process.exit(1);
    }
    
    // Read the file
    let content = fs.readFileSync(controllerPath, 'utf8');
    
    console.log('Modifying ESP32 controller...');
    
    // Backup the original file
    const backupPath = controllerPath + '.backup';
    fs.writeFileSync(backupPath, content);
    console.log(`Original file backed up to: ${backupPath}`);
    
    // Replace the ESP32_USER_ID line with hardcoded user ID
    const originalLine = 'const ESP32_USER_ID = process.env.ESP32_USER_ID || esp32Config.defaultUserId;';
    const newLine = `const ESP32_USER_ID = "${user._id}"; // Hardcoded for reliable operation`;
    
    if (content.includes(originalLine)) {
      content = content.replace(originalLine, newLine);
      console.log('Successfully replaced ESP32_USER_ID line with hardcoded value.');
    } else {
      console.log('Original line not found. Looking for alternative pattern...');
      
      // Try to find a line that defines ESP32_USER_ID
      const regex = /const ESP32_USER_ID =.*/;
      
      if (regex.test(content)) {
        content = content.replace(regex, newLine);
        console.log('Found and replaced ESP32_USER_ID using regex pattern.');
      } else {
        console.error('Could not find ESP32_USER_ID line in the controller file!');
        process.exit(1);
      }
    }
    
    // Write the changes back to the file
    fs.writeFileSync(controllerPath, content);
    console.log('ESP32 controller updated successfully!');
    console.log('The emergency button should now work correctly.');
    console.log('Please restart the server to apply the changes.');
    
    // Exit
    mongoose.disconnect();
    process.exit(0);
    
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});
