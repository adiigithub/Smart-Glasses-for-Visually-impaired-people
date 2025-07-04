/**
 * Smart Blind Glasses - ESP32 Firmware
 * 
 * Hardware connections:
 * - HC-SR04 Ultrasonic Sensor: TRIG to GPIO 5, ECHO to GPIO 18
 * - NEO-6M GPS Module: TX to GPIO 16, RX to GPIO 17
 * - Emergency Button: Connected to GPIO 4 and GND
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <HardwareSerial.h>

// ======= CONFIGURATION - EDIT THESE VALUES =======

// WiFi credentials - UPDATE THESE WITH YOUR ACTUAL NETWORK INFO
const char* ssid = "Aditya's_Spot";       // PUT YOUR ACTUAL WIFI NAME HERE
const char* password = "12345678"; // PUT YOUR ACTUAL WIFI PASSWORD HERE

// API endpoint - UPDATE WITH YOUR COMPUTER'S ACTUAL IP ADDRESS
// Run 'ipconfig' on Windows or 'ifconfig' on Mac/Linux to find your IP
const char* apiEndpoint = "http://192.168.1.6:5000/api/v1/esp32";  // CORRECTED ENDPOINT FOR ESP32 DEVICE

// ======= DEBUG MODE =======
const bool DEBUG_MODE = true;  // Set to true for detailed diagnostics

// ======= PIN DEFINITIONS =======
const int TRIG_PIN = 5;    // Ultrasonic Sensor - Trigger
const int ECHO_PIN = 18;   // Ultrasonic Sensor - Echo
const int BUTTON_PIN = 4;  // Emergency Button
const int STATUS_LED = 2;  // Built-in LED

// GPS Serial
HardwareSerial GPSSerial(1); // UART1 for GPS
const int GPS_RX_PIN = 16;   // GPS TX connects to this pin
const int GPS_TX_PIN = 17;   // GPS RX connects to this pin
const int GPS_BAUD_RATE = 9600;

// Variables
float distance = 0.0;
float latitude = 0.0;
float longitude = 0.0;
bool gpsFixed = false;
bool buttonPressed = false;
unsigned long lastButtonPressTime = 0;
const int debounceTime = 500; // milliseconds
unsigned long lastDataSendTime = 0;
const int dataSendInterval = 5000; // milliseconds

// Connection diagnostics
int apiCallSuccess = 0;
int apiCallFailure = 0;
int wifiReconnectAttempts = 0;

// GPS data buffer
String gpsBuffer = "";
bool receiving = false;

void setup() {
  Serial.begin(115200);
  Serial.println("\n\n==== SMART BLIND GLASSES ESP32 FIRMWARE ====");
  Serial.println("Version: 1.0 - With Connection Diagnostics");
  
  // Initialize pins
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  pinMode(BUTTON_PIN, INPUT_PULLUP);
  pinMode(STATUS_LED, OUTPUT);

  // Test emergency button
  Serial.println("\n==== TESTING EMERGENCY BUTTON ====");
  Serial.print("Reading button pin (should be HIGH): ");
  int buttonState = digitalRead(BUTTON_PIN);
  Serial.println(buttonState);
  Serial.println("Please press the button now to test...");
  delay(2000); // Wait 2 seconds for user to press button
  Serial.print("Reading button pin (should be LOW if pressed): ");
  buttonState = digitalRead(BUTTON_PIN);
  Serial.println(buttonState);
  Serial.println("==== BUTTON TEST COMPLETE ====\n");

  // Initialize GPS Serial
  GPSSerial.begin(GPS_BAUD_RATE, SERIAL_8N1, GPS_RX_PIN, GPS_TX_PIN);
  Serial.println("GPS module initialized");

  // LED indication - we're starting up
  for (int i = 0; i < 3; i++) {
    digitalWrite(STATUS_LED, HIGH);
    delay(100);
    digitalWrite(STATUS_LED, LOW);
    delay(100);
  }

  // Connect to WiFi
  connectToWifi();
}

void loop() {
  // Check WiFi connection
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi disconnected. Reconnecting...");
    connectToWifi();
  }

  // First check emergency button with highest priority
  checkEmergencyButton();
  
  // If button was pressed, send emergency alert immediately
  if (buttonPressed) {
    Serial.println("Emergency button flag is set! Sending alert...");
    sendEmergencyAlert();
    buttonPressed = false; // Reset flag
    
    // Wait a bit to avoid multiple alerts
    delay(1000);
    return; // Skip the rest of the loop after sending emergency
  }

  // Read ultrasonic sensor
  distance = readUltrasonicDistance();

  // Read GPS data
  readGPSData();

  // Send data periodically
  if (millis() - lastDataSendTime > dataSendInterval) {
    sendSensorData();
    lastDataSendTime = millis();
    
    // Print diagnostics every 30 seconds (approximately)
    static int counter = 0;
    if (++counter % 6 == 0) {
      printDiagnostics();
    }
  }

  // Obstacle warning
  if (distance < 50) {
    Serial.println("WARNING: Obstacle very close!");
    digitalWrite(STATUS_LED, !digitalRead(STATUS_LED)); // Blink LED
    delay(100);
  } else {
    delay(200);
  }
}

// Connect to WiFi with retries
void connectToWifi() {
  WiFi.disconnect();
  delay(1000);
  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi: ");
  Serial.println(ssid);
  
  int wifiAttempts = 0;
  while (WiFi.status() != WL_CONNECTED && wifiAttempts < 20) {
    delay(500);
    Serial.print(".");
    wifiAttempts++;
    digitalWrite(STATUS_LED, !digitalRead(STATUS_LED)); // Blink LED
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    wifiReconnectAttempts++;
    Serial.println("\nWiFi connected!");
    Serial.print("IP address: ");
    Serial.println(WiFi.localIP());
    Serial.print("Signal strength (RSSI): ");
    Serial.println(WiFi.RSSI());
    digitalWrite(STATUS_LED, HIGH); // LED on
    
    // Test API connection
    testAPIConnection();
  } else {
    Serial.println("\nWiFi connection failed!");
    Serial.println("Please check your WiFi credentials and network availability.");
    digitalWrite(STATUS_LED, LOW); // LED off
  }
}

// Test API connection
void testAPIConnection() {
  Serial.println("\n==== TESTING API CONNECTION ====");
  Serial.print("API Endpoint: ");
  Serial.println(apiEndpoint);
  
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("Cannot test API: WiFi not connected!");
    return;
  }
  
  // Print detailed network information
  Serial.println("Network Information:");
  Serial.print("- ESP32 IP: ");
  Serial.println(WiFi.localIP());
  Serial.print("- Gateway IP: ");
  Serial.println(WiFi.gatewayIP());
  Serial.print("- DNS IP: ");
  Serial.println(WiFi.dnsIP());
  Serial.print("- Subnet Mask: ");
  Serial.println(WiFi.subnetMask());
  Serial.print("- MAC Address: ");
  Serial.println(WiFi.macAddress());
  
  HTTPClient http;
  String url = String(apiEndpoint) + "/sensors/update";
  Serial.print("Testing connection to: ");
  Serial.println(url);
  
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  http.setTimeout(10000); // 10 second timeout
  
  // Simple test payload
  String payload = "{\"distance\":100,\"batteryLevel\":75,\"testMode\":true}";
  
  Serial.println("Sending test request...");
  int httpResponseCode = http.POST(payload);
  
  if (httpResponseCode > 0) {
    String response = http.getString();
    Serial.println("✅ API CONNECTION SUCCESSFUL!");
    Serial.print("Response code: ");
    Serial.println(httpResponseCode);
    Serial.print("Response: ");
    Serial.println(response);
    
    // Blink LED rapidly to indicate success
    for (int i = 0; i < 5; i++) {
      digitalWrite(STATUS_LED, HIGH);
      delay(100);
      digitalWrite(STATUS_LED, LOW);
      delay(100);
    }
  } else {
    Serial.println("❌ API CONNECTION FAILED!");
    Serial.print("Error code: ");
    Serial.println(httpResponseCode);
    Serial.print("Error details: ");
    Serial.println(http.errorToString(httpResponseCode));
    Serial.println("Possible reasons:");
    Serial.println("1. Backend server is not running");
    Serial.println("2. IP address in apiEndpoint is incorrect");
    Serial.println("3. Port is blocked by firewall");
    Serial.println("4. Network doesn't allow device-to-device communication");
    
    // Try a simple connectivity test to google.com
    Serial.println("\nTrying alternative connection test to google.com...");
    http.begin("http://www.google.com");
    int googleResponse = http.GET();
    if (googleResponse > 0) {
      Serial.println("✅ Internet connection works! Issue is specific to the backend server.");
    } else {
      Serial.println("❌ Internet connection also failed. General connectivity issue.");
    }
    
    // Blink LED pattern to indicate failure
    for (int i = 0; i < 3; i++) {
      digitalWrite(STATUS_LED, HIGH);
      delay(500);
      digitalWrite(STATUS_LED, LOW);
      delay(500);
    }
  }
  
  http.end();
  Serial.println("==== API TEST COMPLETE ====\n");
}

// Read distance from ultrasonic sensor
float readUltrasonicDistance() {
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);
  long duration = pulseIn(ECHO_PIN, HIGH, 30000); // 30ms timeout
  
  if (duration == 0) {
    if (DEBUG_MODE) {
      Serial.println("Ultrasonic sensor timeout - check wiring");
    }
    return 400.0; // Return 400cm (max range) if no echo detected
  }
  
  float dist = (duration * 0.0343) / 2;
  if (DEBUG_MODE) {
    Serial.print("Distance: ");
    Serial.print(dist);
    Serial.println(" cm");
  }
  return dist;
}

// Read and parse GPS data
void readGPSData() {
  while (GPSSerial.available()) {
    char c = GPSSerial.read();
    if (c == '$') {
      gpsBuffer = "";
      receiving = true;
    }
    if (receiving) {
      gpsBuffer += c;
      if (c == '\n') {
        receiving = false;
        if (gpsBuffer.startsWith("$GPRMC")) {
          parseGPRMC(gpsBuffer);
        }
      }
    }
  }
}

// Parse GPRMC sentence
void parseGPRMC(String sentence) {
  String parts[12];
  int i = 0;
  while (sentence.indexOf(',') != -1 && i < 12) {
    int index = sentence.indexOf(',');
    parts[i++] = sentence.substring(0, index);
    sentence = sentence.substring(index + 1);
  }
  String valid = parts[2];
  String lat = parts[3];
  String latDir = parts[4];
  String lon = parts[5];
  String lonDir = parts[6];
  if (valid != "A") {
    gpsFixed = false;
    return;
  }
  latitude = convertToDecimal(lat, latDir);
  longitude = convertToDecimal(lon, lonDir);
  gpsFixed = true;
  
  if (DEBUG_MODE) {
    Serial.print("GPS Location: ");
    Serial.print(latitude, 6);
    Serial.print(", ");
    Serial.println(longitude, 6);
  }
}

// Convert NMEA to decimal degrees
float convertToDecimal(String value, String direction) {
  if (value == "") return 0.0;
  float raw = value.toFloat();
  int deg = int(raw / 100);
  float min = raw - (deg * 100);
  float decimal = deg + (min / 60.0);
  if (direction == "S" || direction == "W") decimal *= -1;
  return decimal;
}

// Check emergency button
void checkEmergencyButton() {
  // Read the current button state
  int buttonState = digitalRead(BUTTON_PIN);
  
  // Debug - print button state every 10 cycles (to avoid flooding the serial)
  static int counter = 0;
  if (++counter % 10 == 0) {
    Serial.print("Button state: ");
    Serial.println(buttonState == LOW ? "PRESSED" : "Released");
  }
  
  // If button is pressed (LOW when using INPUT_PULLUP)
  if (buttonState == LOW) {
    if (millis() - lastButtonPressTime > debounceTime) {
      Serial.println("\n=====================================");
      Serial.println("EMERGENCY BUTTON PRESSED!");
      Serial.println("Time: " + String(millis() / 1000) + " seconds since boot");
      Serial.println("=====================================\n");
      
      // Set flag to trigger emergency alert
      buttonPressed = true;
      
      // Blink LED rapidly to indicate button press
      for (int i = 0; i < 5; i++) {
        digitalWrite(STATUS_LED, !digitalRead(STATUS_LED));
        delay(100);
      }
      
      // Update the last press time
      lastButtonPressTime = millis();
    }
  }
}

// Send sensor data to server
void sendSensorData() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi not connected. Cannot send data.");
    return;
  }
  
  // Take a fresh distance reading right before sending
  float currentDistance = readUltrasonicDistance();
  
  HTTPClient http;
  String url = String(apiEndpoint) + "/sensors/update";
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  http.setTimeout(5000); // 5 second timeout
  
  Serial.println("\n====== SENDING SENSOR DATA ======");
  Serial.print("URL: ");
  Serial.println(url);
  Serial.print("Current Distance Reading: ");
  Serial.print(currentDistance);
  Serial.println(" cm");
  Serial.print("Battery: ");
  Serial.println(getBatteryLevel());
  
  String payload = "{";
  payload += "\"distance\":" + String(currentDistance) + ",";
  payload += "\"batteryLevel\":" + String(getBatteryLevel());
  
  // Always include location data
  payload += ",\"location\":{";
  if (gpsFixed) {
    // Use actual GPS data when we have a fix
    payload += "\"latitude\":" + String(latitude, 6) + ",";
    payload += "\"longitude\":" + String(longitude, 6) + ",";
    payload += "\"accuracy\":" + String(10.0, 1);
    Serial.println("Using actual GPS location data");
  } else {
    // Use your local coordinates as fallback (update these to your location)
    payload += "\"latitude\":" + String(19.0760, 6) + ",";
    payload += "\"longitude\":" + String(72.8777, 6) + ",";
    payload += "\"accuracy\":1000"; // Low accuracy for fallback
    
    Serial.println("Using fallback location coordinates");
  }
  payload += "}";
  
  payload += "}";
  
  Serial.print("Sending sensor data payload: ");
  Serial.println(payload);
  
  int httpResponseCode = http.POST(payload);
  
  if (httpResponseCode > 0) {
    String response = http.getString();
    Serial.println("✅ Data sent successfully!");
    Serial.print("Response code: ");
    Serial.println(httpResponseCode);
    Serial.print("Response: ");
    Serial.println(response);
    apiCallSuccess++;
    
    // Store the distance value that was just sent for comparison later
    distance = currentDistance;
    
    digitalWrite(STATUS_LED, HIGH);
  } else {
    Serial.println("❌ Error sending data!");
    Serial.print("Error code: ");
    Serial.println(httpResponseCode);
    Serial.print("Error message: ");
    Serial.println(http.errorToString(httpResponseCode));
    apiCallFailure++;
    digitalWrite(STATUS_LED, LOW);
  }
  
  http.end();
  Serial.println("====== SENSOR DATA SEND COMPLETE ======\n");
}

// Send emergency alert to server
void sendEmergencyAlert() {
  Serial.println("\n======= SENDING EMERGENCY ALERT =======");
  
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi not connected. Cannot send emergency alert.");
    return;
  }
  
  Serial.print("WiFi Connected. IP address: ");
  Serial.println(WiFi.localIP());
  
  HTTPClient http;
  // Use the ESP32-specific endpoint which doesn't require authentication
  String url = String(apiEndpoint) + "/emergency/trigger";
  Serial.print("Emergency endpoint URL: ");
  Serial.println(url);
  
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  http.setTimeout(10000); // 10 second timeout for emergency alerts
  
  // Include location data (real or sample)
  String payload = "{";
  if (gpsFixed) {
    payload += "\"latitude\":" + String(latitude, 6) + ",";
    payload += "\"longitude\":" + String(longitude, 6) + ",";
  } else {
    // Update with your local coordinates as fallback
    payload += "\"latitude\":19.0760,";
    payload += "\"longitude\":72.8777,";
  }
  payload += "\"accuracy\":10.0";  
  payload += "}";
  
  Serial.print("Emergency payload: ");
  Serial.println(payload);
  
  Serial.println("Sending emergency alert...");
  int httpResponseCode = http.POST(payload);
  
  if (httpResponseCode > 0) {
    String response = http.getString();
    Serial.println("✅ EMERGENCY ALERT SENT SUCCESSFULLY!");
    Serial.print("Response code: ");
    Serial.println(httpResponseCode);
    
    // Visual indicator - Blink LED pattern (SOS: ... --- ...)
    for (int i = 0; i < 3; i++) { // Short blinks (S)
      digitalWrite(STATUS_LED, HIGH);
      delay(200);
      digitalWrite(STATUS_LED, LOW);
      delay(200);
    }
    delay(300);
    for (int i = 0; i < 3; i++) { // Long blinks (O)
      digitalWrite(STATUS_LED, HIGH);
      delay(600);
      digitalWrite(STATUS_LED, LOW);
      delay(200);
    }
    delay(300);
    for (int i = 0; i < 3; i++) { // Short blinks (S)
      digitalWrite(STATUS_LED, HIGH);
      delay(200);
      digitalWrite(STATUS_LED, LOW);
      delay(200);
    }
    
    apiCallSuccess++;
  } else {
    Serial.println("❌ FAILED TO SEND EMERGENCY ALERT!");
    Serial.print("Error code: ");
    Serial.println(httpResponseCode);
    Serial.print("Error message: ");
    Serial.println(http.errorToString(httpResponseCode));
    
    // Trying direct API with a GET request to test connectivity
    Serial.println("Testing API connection with GET request...");
    http.begin(apiEndpoint);
    int testCode = http.GET();
    Serial.print("Test response code: ");
    Serial.println(testCode);
    
    apiCallFailure++;
  }
  
  http.end();
  Serial.println("========================================\n");
}

// Simulate battery level
int getBatteryLevel() {
  return random(30, 100);
}

// Print diagnostic information
void printDiagnostics() {
  Serial.println("\n====== DIAGNOSTICS ======");
  Serial.print("WiFi SSID: ");
  Serial.println(ssid);
  Serial.print("WiFi Status: ");
  Serial.println(WiFi.status() == WL_CONNECTED ? "Connected" : "Disconnected");
  Serial.print("IP Address: ");
  Serial.println(WiFi.localIP());
  Serial.print("Signal Strength (RSSI): ");
  Serial.println(WiFi.RSSI());
  Serial.print("API Endpoint: ");
  Serial.println(apiEndpoint);
  Serial.print("API Success/Failure: ");
  Serial.print(apiCallSuccess);
  Serial.print("/");
  Serial.println(apiCallFailure);
  
  Serial.print("Distance Sensor: ");
  if (distance > 0 && distance < 400) {
    Serial.println("Working");
  } else {
    Serial.println("Check connections");
  }
  
  Serial.print("GPS Status: ");
  Serial.println(gpsFixed ? "Fix acquired" : "No fix");
  if (gpsFixed) {
    Serial.print("Location: ");
    Serial.print(latitude, 6);
    Serial.print(", ");
    Serial.println(longitude, 6);
  }
  
  Serial.print("Uptime: ");
  Serial.print(millis() / 1000);
  Serial.println(" seconds");
  Serial.println("========================\n");
} 