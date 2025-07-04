import { useState, useEffect, useContext } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Paper,
  Button,
  CircularProgress,
  Alert,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Card,
  CardContent,
  Divider,
  LinearProgress,
  Chip,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  Warning as WarningIcon,
  Notifications as NotificationsIcon,
  MyLocation as MyLocationIcon,
  LocationOn as LocationOnIcon,
  Visibility as VisibilityIcon,
  BatteryFull as BatteryFullIcon,
  BatteryAlert as BatteryAlertIcon,
  SignalCellular4Bar as SignalIcon,
  SignalCellularOff as SignalOffIcon,
  DeviceHub as DeviceHubIcon,
  VolumeUp as VolumeUpIcon,
  VolumeOff as VolumeOffIcon,
} from '@mui/icons-material';
import AuthContext from '../../contexts/AuthContext';
import {
  submitSensorReading,
  triggerEmergency,
  getSensorReadings,
  generateSimulatedData,
  speakObstacleAlert,
  speakBatteryAlert,
  speakEmergencyAlert,
} from '../../services/sensorService';

const UserDashboard = () => {
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sensorData, setSensorData] = useState({
    distance: 0,
    latitude: 0,
    longitude: 0,
    batteryLevel: 100,
    lastUpdated: null,
  });
  const [emergencyDialogOpen, setEmergencyDialogOpen] = useState(false);
  const [emergencyStatus, setEmergencyStatus] = useState({
    triggered: false,
    sending: false,
    success: false,
    error: null,
  });
  const [simulationActive, setSimulationActive] = useState(false);
  const [simulationInterval, setSimulationIntervalId] = useState(null);
  const [sensorHistory, setSensorHistory] = useState([]);
  const [deviceStatus, setDeviceStatus] = useState({
    connected: false,
    lastHeartbeat: null,
    firmwareVersion: '1.0.0'
  });
  const [textToSpeechEnabled, setTextToSpeechEnabled] = useState(true);
  const [lastSpokenDistance, setLastSpokenDistance] = useState(null);
  const [lastSpokenBattery, setLastSpokenBattery] = useState(null);

  // Check if browser supports speech synthesis
  const speechSupported = 'speechSynthesis' in window;

  // Fetch initial sensor data
  useEffect(() => {
    const fetchSensorData = async () => {
      try {
        if (user?._id) {
          const response = await getSensorReadings(user._id, 10);
          if (response.success && response.data.length > 0) {
            const latestReading = response.data[0];
            setSensorData({
              distance: latestReading.distance / 100, // Convert cm to meters
              latitude: latestReading.location.latitude,
              longitude: latestReading.location.longitude,
              batteryLevel: latestReading.batteryLevel || 100,
              lastUpdated: new Date(latestReading.timestamp),
            });
            setSensorHistory(response.data);
            
            // If we have a reading within the last 5 minutes, assume device is connected
            const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
            const isConnected = new Date(latestReading.timestamp) > fiveMinutesAgo;
            
            setDeviceStatus({
              connected: isConnected,
              lastHeartbeat: new Date(latestReading.timestamp),
              firmwareVersion: user.deviceInfo?.firmwareVersion || '1.0.0'
            });
          }
        }
      } catch (err) {
        setError('Failed to fetch sensor data. Please try again.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchSensorData();
    
    // Set up polling interval to refresh data every 2 seconds
    const pollingInterval = setInterval(fetchSensorData, 2000);
    
    // Clean up interval on component unmount
    return () => clearInterval(pollingInterval);
  }, [user]);

  // Handle emergency button click
  const handleEmergencyClick = () => {
    setEmergencyDialogOpen(true);
  };

  // Toggle text-to-speech
  const handleToggleTextToSpeech = () => {
    setTextToSpeechEnabled(!textToSpeechEnabled);
    
    // If turning on, announce it's enabled
    if (!textToSpeechEnabled && speechSupported) {
      const speech = new SpeechSynthesisUtterance("Text to speech enabled");
      window.speechSynthesis.speak(speech);
    } else if (speechSupported) {
      // Cancel any ongoing speech when turning off
      window.speechSynthesis.cancel();
    }
  };

  // Confirm emergency alert
  const confirmEmergency = async () => {
    setEmergencyStatus({
      triggered: true,
      sending: true,
      success: false,
      error: null,
    });
    setEmergencyDialogOpen(false);

    // Speak emergency alert if text-to-speech is enabled
    if (textToSpeechEnabled && speechSupported) {
      speakEmergencyAlert();
    }

    try {
      await triggerEmergency(
        user._id,
        sensorData.latitude,
        sensorData.longitude
      );
      setEmergencyStatus({
        triggered: true,
        sending: false,
        success: true,
        error: null,
      });

      // Auto-reset emergency status after 10 seconds
      setTimeout(() => {
        setEmergencyStatus({
          triggered: false,
          sending: false,
          success: false,
          error: null,
        });
      }, 10000);
    } catch (err) {
      setEmergencyStatus({
        triggered: true,
        sending: false,
        success: false,
        error: 'Failed to send emergency alert. Please try again.',
      });
    }
  };

  // Cancel emergency alert
  const cancelEmergency = () => {
    setEmergencyDialogOpen(false);
  };

  // Process sensor data and determine if speech is needed
  const processSensorData = (data) => {
    // Speak obstacle alerts
    if (textToSpeechEnabled && speechSupported) {
      // Only speak if the distance has changed significantly (10cm) or priority has changed
      const significantDistanceChange = 
        lastSpokenDistance === null || 
        Math.abs(data.distance - lastSpokenDistance) > 0.1;
      
      const wasDangerous = lastSpokenDistance !== null && lastSpokenDistance < 1;
      const isDangerous = data.distance < 1;
      
      // Speak in these cases:
      // 1. Distance changed significantly
      // 2. Newly dangerous (wasn't < 1m before, now is)
      // 3. No longer dangerous (was < 1m before, now isn't)
      if (significantDistanceChange || wasDangerous !== isDangerous) {
        speakObstacleAlert(data.distance);
        setLastSpokenDistance(data.distance);
      }
      
      // Check battery level for significant changes
      const significantBatteryChange = 
        lastSpokenBattery === null || 
        Math.abs(data.batteryLevel - lastSpokenBattery) >= 10;
      
      // Only announce battery when it drops into critical or warning levels
      if (significantBatteryChange && data.batteryLevel <= 20) {
        speakBatteryAlert(data.batteryLevel);
        setLastSpokenBattery(data.batteryLevel);
      }
    }
    
    return data;
  };

  // Start/Stop simulation of sensor data
  const toggleSimulation = () => {
    if (simulationActive) {
      // Stop simulation
      clearInterval(simulationInterval);
      setSimulationIntervalId(null);
      setSimulationActive(false);
      setDeviceStatus({
        ...deviceStatus,
        connected: false
      });
      
      // Clear speech when stopping
      if (speechSupported) {
        window.speechSynthesis.cancel();
      }
    } else {
      // Start simulation
      const interval = setInterval(async () => {
        try {
          // Generate random sensor data
          const data = generateSimulatedData(user._id);
          
          // Add battery level to simulated data
          data.batteryLevel = Math.max(1, Math.min(100, sensorData.batteryLevel + Math.floor(Math.random() * 5) - 2));
          
          // Process data for speech before submitting
          processSensorData(data);
          
          // Submit to API
          await submitSensorReading(
            data.userId,
            data.distance,
            data.latitude,
            data.longitude,
            data.batteryLevel
          );
          
          // Update local state
          setSensorData({
            distance: data.distance,
            latitude: data.latitude,
            longitude: data.longitude,
            batteryLevel: data.batteryLevel,
            lastUpdated: new Date(),
          });
          
          // Update device status
          setDeviceStatus({
            connected: true,
            lastHeartbeat: new Date(),
            firmwareVersion: '1.0.0'
          });
          
          // Add to history
          setSensorHistory((prev) => [
            {
              distance: data.distance,
              batteryLevel: data.batteryLevel,
              location: {
                latitude: data.latitude,
                longitude: data.longitude,
              },
              timestamp: new Date(),
              user: user._id,
            },
            ...prev.slice(0, 9), // Keep only the 10 most recent readings
          ]);
        } catch (err) {
          console.error('Simulation error:', err);
        }
      }, 2000); // Update every 2 seconds
      
      setSimulationIntervalId(interval);
      setSimulationActive(true);
      
      // Initial announcement when starting simulation
      if (textToSpeechEnabled && speechSupported) {
        const speech = new SpeechSynthesisUtterance("Smart glass simulation activated");
        window.speechSynthesis.speak(speech);
      }
    }
  };

  // Manually speak current distance (for testing)
  const speakCurrentDistance = () => {
    if (speechSupported && textToSpeechEnabled) {
      speakObstacleAlert(sensorData.distance);
    }
  };

  // Cleanup simulation interval on component unmount
  useEffect(() => {
    return () => {
      if (simulationInterval) {
        clearInterval(simulationInterval);
      }
      
      // Cancel any speech when unmounting
      if (speechSupported) {
        window.speechSynthesis.cancel();
      }
    };
  }, [simulationInterval]);

  // Format coordinates to be more readable
  const formatCoordinate = (coord) => {
    return coord.toFixed(6);
  };

  // Calculate distance warning level
  const getDistanceWarningLevel = (distance) => {
    if (distance < 0.5) return 'error';
    if (distance < 1) return 'warning';
    return 'success';
  };

  // Get battery color based on level
  const getBatteryColor = (level) => {
    if (level < 20) return 'error';
    if (level < 40) return 'warning';
    return 'success';
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        User Dashboard
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {emergencyStatus.triggered && (
        <Alert
          severity={emergencyStatus.success ? 'success' : 'error'}
          sx={{ mb: 2 }}
        >
          {emergencyStatus.sending
            ? 'Sending emergency alert...'
            : emergencyStatus.success
            ? 'Emergency alert sent successfully! Your caregivers have been notified.'
            : emergencyStatus.error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Emergency Button */}
        <Grid item xs={12}>
          <Paper
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              backgroundColor: '#f8d7da',
              borderColor: '#f5c6cb',
            }}
          >
            <Typography variant="h6" gutterBottom>
              Emergency Alert
            </Typography>
            <Button
              variant="contained"
              color="error"
              size="large"
              startIcon={<WarningIcon />}
              onClick={handleEmergencyClick}
              sx={{ py: 2, px: 4 }}
            >
              SEND EMERGENCY ALERT
            </Button>
            <Typography variant="caption" sx={{ mt: 1 }}>
              Press this button in case of emergency to alert all your caregivers
            </Typography>
          </Paper>
        </Grid>

        {/* Text-to-Speech Controls */}
        <Grid item xs={12}>
          <Paper
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography variant="h6" sx={{ mr: 2 }}>
                Voice Announcements
              </Typography>
              {textToSpeechEnabled ? (
                <VolumeUpIcon color="primary" />
              ) : (
                <VolumeOffIcon color="disabled" />
              )}
            </Box>
            
            <Box>
              <FormControlLabel
                control={
                  <Switch
                    checked={textToSpeechEnabled}
                    onChange={handleToggleTextToSpeech}
                    color="primary"
                    disabled={!speechSupported}
                  />
                }
                label={textToSpeechEnabled ? "Enabled" : "Disabled"}
              />
              
              {!speechSupported && (
                <Typography variant="caption" color="error" sx={{ display: 'block' }}>
                  Text-to-speech is not supported in your browser
                </Typography>
              )}
            </Box>
            
            {textToSpeechEnabled && speechSupported && (
              <Button 
                variant="outlined" 
                onClick={speakCurrentDistance}
                startIcon={<VolumeUpIcon />}
              >
                Test Voice
              </Button>
            )}
          </Paper>
        </Grid>

        {/* Device Status */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" gutterBottom>
              <DeviceHubIcon sx={{ mr: 1, verticalAlign: 'top' }} />
              Smart Glass Device Status
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Typography variant="body1" sx={{ mr: 1 }}>
                Connection Status:
              </Typography>
              <Chip 
                icon={deviceStatus.connected ? <SignalIcon /> : <SignalOffIcon />}
                label={deviceStatus.connected ? "Connected" : "Disconnected"} 
                color={deviceStatus.connected ? "success" : "error"}
                size="small"
              />
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" gutterBottom>
                Battery Level: {sensorData.batteryLevel}%
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                {sensorData.batteryLevel < 20 ? <BatteryAlertIcon color="error" /> : <BatteryFullIcon color="success" />}
                <LinearProgress 
                  variant="determinate" 
                  value={sensorData.batteryLevel} 
                  color={getBatteryColor(sensorData.batteryLevel)}
                  sx={{ mx: 1, flexGrow: 1, height: 10, borderRadius: 5 }}
                />
              </Box>
              {sensorData.batteryLevel < 20 && (
                <Typography variant="caption" color="error">
                  Warning: Battery level is low. Please charge the device soon.
                </Typography>
              )}
            </Box>

            <Divider sx={{ my: 1 }} />
            
            <Typography variant="body2">
              Firmware Version: {deviceStatus.firmwareVersion}
            </Typography>
            
            <Typography variant="body2">
              Last Activity: {deviceStatus.lastHeartbeat ? deviceStatus.lastHeartbeat.toLocaleString() : 'Never'}
            </Typography>
          </Paper>
        </Grid>

        {/* Current Sensor Data */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" gutterBottom>
              Current Sensor Data
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Alert
                  severity={getDistanceWarningLevel(sensorData.distance)}
                  icon={<VisibilityIcon />}
                >
                  <Typography variant="body1">
                    <strong>Distance:</strong> {sensorData.distance.toFixed(2)} meters
                  </Typography>
                  {sensorData.distance < 1 && (
                    <Typography variant="caption">
                      {sensorData.distance < 0.5
                        ? 'Warning! Very close obstacle detected!'
                        : 'Caution! Obstacle ahead'}
                    </Typography>
                  )}
                </Alert>
              </Grid>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                  <LocationOnIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="body1">
                    <strong>Location:</strong> {formatCoordinate(sensorData.latitude)},{' '}
                    {formatCoordinate(sensorData.longitude)}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
                <Typography variant="caption" color="text.secondary">
                  Last updated:{' '}
                  {sensorData.lastUpdated
                    ? sensorData.lastUpdated.toLocaleString()
                    : 'Never'}
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Simulation Controls */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" gutterBottom>
              Simulation Controls
            </Typography>
            <Typography variant="body2" paragraph>
              This simulates receiving data from the ESP32 sensor. In a real-world scenario,
              the Smart Glass device would be sending this data automatically.
            </Typography>
            <Button
              variant="contained"
              color={simulationActive ? 'secondary' : 'primary'}
              onClick={toggleSimulation}
              sx={{ mt: 2, alignSelf: 'flex-start' }}
            >
              {simulationActive ? 'Stop Simulation' : 'Start Simulation'}
            </Button>
            {simulationActive && (
              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  Simulation is active. New data is being generated every 2 seconds.
                </Typography>
                {sensorData.distance < 1 && (
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    {textToSpeechEnabled ? "Voice alerts are enabled" : "Voice alerts are disabled"} for obstacles less than 1 meter away.
                  </Typography>
                )}
                {sensorData.batteryLevel < 20 && (
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    {textToSpeechEnabled ? "Voice alerts are enabled" : "Voice alerts are disabled"} for low battery levels.
                  </Typography>
                )}
              </Alert>
            )}
          </Paper>
        </Grid>

        {/* Sensor History */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Sensor Reading History
            </Typography>
            {sensorHistory.length > 0 ? (
              <Grid container spacing={2}>
                {sensorHistory.map((reading, index) => (
                  <Grid item xs={12} sm={6} md={4} key={index}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography
                          color="textSecondary"
                          gutterBottom
                          variant="caption"
                        >
                          {new Date(reading.timestamp).toLocaleString()}
                        </Typography>
                        <Typography variant="body2" component="div" gutterBottom>
                          <strong>Distance:</strong> {reading.distance.toFixed(2)} cm
                        </Typography>
                        <Typography variant="body2" gutterBottom>
                          <strong>Location:</strong>{' '}
                          {formatCoordinate(reading.location.latitude)},{' '}
                          {formatCoordinate(reading.location.longitude)}
                        </Typography>
                        {reading.batteryLevel && (
                          <Typography variant="body2">
                            <strong>Battery:</strong> {reading.batteryLevel}%
                          </Typography>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No sensor reading history available. Start the simulation to generate data.
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Emergency Confirmation Dialog */}
      <Dialog
        open={emergencyDialogOpen}
        onClose={cancelEmergency}
        aria-labelledby="emergency-dialog-title"
        aria-describedby="emergency-dialog-description"
      >
        <DialogTitle id="emergency-dialog-title" sx={{ color: 'error.main' }}>
          <WarningIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Confirm Emergency Alert
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="emergency-dialog-description">
            Are you sure you want to send an emergency alert to all your caregivers?
            This will share your current location with them.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={cancelEmergency} color="primary">
            Cancel
          </Button>
          <Button
            onClick={confirmEmergency}
            color="error"
            variant="contained"
            autoFocus
          >
            Confirm Emergency
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default UserDashboard; 