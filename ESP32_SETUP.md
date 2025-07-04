# Smart Blind Glasses - ESP32 Setup Guide

This guide will help you set up the ESP32 device for your Smart Blind Glasses system.

## Hardware Requirements

- ESP32 development board (ESP32-WROOM-32 recommended)
- HC-SR04 Ultrasonic Distance Sensor
- NEO-6M GPS Module
- Emergency button (momentary switch)
- LED indicator
- Jumper wires
- Micro USB cable
- Power bank or battery (for portable use)

## Wiring Diagram

Connect the components to your ESP32 as follows:

### HC-SR04 Ultrasonic Sensor
- TRIG pin → GPIO 5
- ECHO pin → GPIO 18
- VCC → 5V
- GND → GND

### NEO-6M GPS Module
- TX pin → GPIO 16 (RX2)
- RX pin → GPIO 17 (TX2)
- VCC → 3.3V
- GND → GND

### Emergency Button
- One terminal → GPIO 4
- Other terminal → GND

### Status LED
- LED → GPIO 2 (built-in LED on most ESP32 boards)

## Software Setup

### 1. Install Required Software

Make sure you have the following software installed on your computer:

- [Arduino IDE](https://www.arduino.cc/en/software)
- ESP32 board support for Arduino IDE
- Required libraries:
  - WiFi
  - HTTPClient
  - HardwareSerial

### 2. Configure ESP32 in Arduino IDE

1. Open Arduino IDE
2. Go to File > Preferences
3. Add the following URL to the "Additional Boards Manager URLs" field:
   ```
   https://dl.espressif.com/dl/package_esp32_index.json
   ```
4. Go to Tools > Board > Boards Manager
5. Search for "ESP32" and install the ESP32 package

### 3. Configure the Firmware

1. Copy the ESP32 firmware code provided in the `esp32_firmware.ino` file
2. Create a new Arduino sketch and paste the code
3. Update the following configuration values:
   - WiFi SSID and password
   - API endpoint URL (should point to your server running the Smart Glass Monitor backend)

```arduino
// WiFi credentials - UPDATE THESE WITH YOUR ACTUAL NETWORK INFO
const char* ssid = "YOUR_WIFI_NAME";
const char* password = "YOUR_WIFI_PASSWORD";

// API endpoint - UPDATE WITH YOUR COMPUTER'S ACTUAL IP ADDRESS
const char* apiEndpoint = "http://YOUR_SERVER_IP:5000/api/v1/esp32";
```

### 4. Upload the Firmware

1. Connect your ESP32 to your computer via USB
2. Select the correct board and port in the Arduino IDE:
   - Tools > Board > ESP32 Dev Module
   - Tools > Port > Select the port where your ESP32 is connected
3. Click the Upload button

## Backend Configuration

After setting up the ESP32 hardware and uploading the firmware, you need to configure the backend server:

1. Log in to your application and create a user account for the person who will use the glasses
2. Copy the user ID from the database or user profile page
3. Update the `ESP32_USER_ID` in your backend server's `config.env` file:

```
ESP32_USER_ID=the_actual_user_id_here
```

## Testing the Setup

1. Power on the ESP32 device
2. The status LED should blink rapidly at startup and then stabilize once connected to WiFi
3. Check the Arduino Serial Monitor (115200 baud) to ensure the ESP32 connects to WiFi and can reach the API endpoint
4. In the Smart Glass Monitor web application, you should see:
   - The user's dashboard showing the device is connected
   - Battery level indicator
   - Distance readings from the ultrasonic sensor
   - Location updates from the GPS module

## Using the Emergency Button

1. Press the emergency button for at least half a second to trigger an emergency alert
2. The status LED will blink in an SOS pattern to indicate the alert was sent
3. Caregivers associated with the user will receive email notifications
4. The alert will appear on the caregiver dashboard

## Troubleshooting

### ESP32 not connecting to WiFi
- Verify WiFi credentials in the code
- Ensure the WiFi network is available and within range
- Check if the WiFi network requires additional authentication

### API connection failures
- Verify the API endpoint URL is correct with the proper IP address
- Ensure the backend server is running
- Check that the server firewall isn't blocking connections

### Sensor issues
- Ultrasonic sensor: Check wiring and connections
- GPS module: Make sure it has clear view of the sky for satellite reception
- Emergency button: Verify pull-up resistor functionality

## Battery Management

- The ESP32 firmware reports battery levels to the server
- Charging is recommended when the battery level drops below 20%
- Critical alerts are issued when battery level drops below 10%

## Advanced Configuration

For advanced configuration options, you can modify the `esp32-config.js` file in the backend server:

- Sensor thresholds
- Heartbeat intervals
- Emergency alert settings

## Support

If you encounter any issues or have questions about the setup, please contact our support team or refer to the documentation for more detailed information. 