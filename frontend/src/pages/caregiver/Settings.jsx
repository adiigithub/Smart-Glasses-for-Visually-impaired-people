import { useState, useContext } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Button,
  TextField,
  Alert,
  CircularProgress,
  Switch,
  FormControlLabel,
  FormGroup,
  Slider,
  Select,
  MenuItem,
  InputLabel,
  FormControl
} from '@mui/material';
import {
  Security,
  Notifications,
  Map,
  Language,
  Visibility,
  Save,
  Lock
} from '@mui/icons-material';
import AuthContext from '../../contexts/AuthContext';
import api from '../../services/api';

const CaregiverSettings = () => {
  const { user } = useContext(AuthContext);
  const [activeSection, setActiveSection] = useState('security');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  
  // Security settings
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  // Map settings
  const [mapSettings, setMapSettings] = useState({
    defaultZoom: 13,
    mapType: 'street',
    autoCenter: true
  });
  
  // Notification settings
  const [notificationSettings, setNotificationSettings] = useState({
    emailAlerts: true,
    pushAlerts: false,
    soundAlerts: true,
    emergencyOnly: false
  });
  
  // System settings
  const [systemSettings, setSystemSettings] = useState({
    language: 'en',
    theme: 'light',
    autoRefresh: true,
    refreshInterval: 30
  });

  // Handle password form changes
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle map settings changes
  const handleMapSettingChange = (setting, value) => {
    setMapSettings(prev => ({
      ...prev,
      [setting]: value
    }));
  };
  
  // Handle notification settings changes
  const handleNotificationSettingChange = (e) => {
    const { name, checked } = e.target;
    setNotificationSettings(prev => ({
      ...prev,
      [name]: checked
    }));
  };
  
  // Handle system settings changes
  const handleSystemSettingChange = (setting, value) => {
    setSystemSettings(prev => ({
      ...prev,
      [setting]: value
    }));
  };

  // Change password
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    
    // Validate passwords
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('New passwords do not match');
      return;
    }
    
    if (passwordForm.newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    
    try {
      setLoading(true);
      // This is a mock endpoint - you would need to implement this on your backend
      const response = await api.put('/api/v1/auth/change-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      
      if (response.data.success) {
        setSuccess(true);
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Error changing password:', err);
      setError(err.response?.data?.error || 'Failed to change password. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Save settings
  const handleSaveSettings = () => {
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
    // In a real implementation, you would save the settings to the backend
    console.log('Map settings:', mapSettings);
    console.log('Notification settings:', notificationSettings);
    console.log('System settings:', systemSettings);
  };

  // Render different settings sections
  const renderSettingsSection = () => {
    switch (activeSection) {
      case 'security':
        return (
          <Box component="form" onSubmit={handleChangePassword}>
            <Typography variant="h6" gutterBottom>
              Change Password
            </Typography>
            <Divider sx={{ mb: 3 }} />
            
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Current Password"
                  name="currentPassword"
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={handlePasswordChange}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="New Password"
                  name="newPassword"
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={handlePasswordChange}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Confirm New Password"
                  name="confirmPassword"
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={handlePasswordChange}
                  required
                />
              </Grid>
            </Grid>
            
            <Box sx={{ mt: 3 }}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                startIcon={<Lock />}
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} /> : 'Change Password'}
              </Button>
            </Box>
          </Box>
        );
        
      case 'map':
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Map Settings
            </Typography>
            <Divider sx={{ mb: 3 }} />
            
            <Box sx={{ mb: 4 }}>
              <Typography id="zoom-slider" gutterBottom>
                Default Zoom Level: {mapSettings.defaultZoom}
              </Typography>
              <Slider
                value={mapSettings.defaultZoom}
                onChange={(_, value) => handleMapSettingChange('defaultZoom', value)}
                min={5}
                max={18}
                step={1}
                aria-labelledby="zoom-slider"
                marks={[
                  { value: 5, label: 'Far' },
                  { value: 10, label: 'City' },
                  { value: 15, label: 'Street' },
                  { value: 18, label: 'Close' },
                ]}
              />
            </Box>
            
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel id="map-type-label">Map Type</InputLabel>
              <Select
                labelId="map-type-label"
                value={mapSettings.mapType}
                label="Map Type"
                onChange={(e) => handleMapSettingChange('mapType', e.target.value)}
              >
                <MenuItem value="street">Street Map</MenuItem>
                <MenuItem value="satellite">Satellite</MenuItem>
                <MenuItem value="hybrid">Hybrid</MenuItem>
              </Select>
            </FormControl>
            
            <FormControlLabel
              control={
                <Switch
                  checked={mapSettings.autoCenter}
                  onChange={(e) => handleMapSettingChange('autoCenter', e.target.checked)}
                  name="autoCenter"
                  color="primary"
                />
              }
              label="Auto-center map on active emergency alerts"
            />
            
            <Box sx={{ mt: 3 }}>
              <Button
                variant="contained"
                color="primary"
                startIcon={<Save />}
                onClick={handleSaveSettings}
              >
                Save Map Settings
              </Button>
            </Box>
          </Box>
        );
        
      case 'notifications':
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Notification Settings
            </Typography>
            <Divider sx={{ mb: 3 }} />
            
            <FormGroup>
              <FormControlLabel
                control={
                  <Switch
                    checked={notificationSettings.emailAlerts}
                    onChange={handleNotificationSettingChange}
                    name="emailAlerts"
                    color="primary"
                  />
                }
                label="Email Alerts"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={notificationSettings.pushAlerts}
                    onChange={handleNotificationSettingChange}
                    name="pushAlerts"
                    color="primary"
                  />
                }
                label="Push Notifications"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={notificationSettings.soundAlerts}
                    onChange={handleNotificationSettingChange}
                    name="soundAlerts"
                    color="primary"
                  />
                }
                label="Sound Alerts"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={notificationSettings.emergencyOnly}
                    onChange={handleNotificationSettingChange}
                    name="emergencyOnly"
                    color="primary"
                  />
                }
                label="Emergency Alerts Only (No regular updates)"
              />
            </FormGroup>
            
            <Box sx={{ mt: 3 }}>
              <Button
                variant="contained"
                color="primary"
                startIcon={<Save />}
                onClick={handleSaveSettings}
              >
                Save Notification Settings
              </Button>
            </Box>
          </Box>
        );
        
      case 'system':
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              System Settings
            </Typography>
            <Divider sx={{ mb: 3 }} />
            
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel id="language-label">Language</InputLabel>
              <Select
                labelId="language-label"
                value={systemSettings.language}
                label="Language"
                onChange={(e) => handleSystemSettingChange('language', e.target.value)}
              >
                <MenuItem value="en">English</MenuItem>
                <MenuItem value="es">Spanish</MenuItem>
                <MenuItem value="fr">French</MenuItem>
                <MenuItem value="de">German</MenuItem>
              </Select>
            </FormControl>
            
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel id="theme-label">Theme</InputLabel>
              <Select
                labelId="theme-label"
                value={systemSettings.theme}
                label="Theme"
                onChange={(e) => handleSystemSettingChange('theme', e.target.value)}
              >
                <MenuItem value="light">Light</MenuItem>
                <MenuItem value="dark">Dark</MenuItem>
                <MenuItem value="system">System Default</MenuItem>
              </Select>
            </FormControl>
            
            <FormControlLabel
              control={
                <Switch
                  checked={systemSettings.autoRefresh}
                  onChange={(e) => handleSystemSettingChange('autoRefresh', e.target.checked)}
                  name="autoRefresh"
                  color="primary"
                />
              }
              label="Auto-refresh data"
            />
            
            {systemSettings.autoRefresh && (
              <Box sx={{ mt: 2, mb: 3 }}>
                <Typography id="refresh-slider" gutterBottom>
                  Refresh Interval: {systemSettings.refreshInterval} seconds
                </Typography>
                <Slider
                  value={systemSettings.refreshInterval}
                  onChange={(_, value) => handleSystemSettingChange('refreshInterval', value)}
                  min={5}
                  max={60}
                  step={5}
                  aria-labelledby="refresh-slider"
                  marks={[
                    { value: 5, label: '5s' },
                    { value: 30, label: '30s' },
                    { value: 60, label: '60s' },
                  ]}
                />
              </Box>
            )}
            
            <Box sx={{ mt: 3 }}>
              <Button
                variant="contained"
                color="primary"
                startIcon={<Save />}
                onClick={handleSaveSettings}
              >
                Save System Settings
              </Button>
            </Box>
          </Box>
        );
        
      default:
        return null;
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Settings
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Settings saved successfully!
        </Alert>
      )}
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2 }}>
            <List component="nav" aria-label="settings categories">
              <ListItem
                button
                selected={activeSection === 'security'}
                onClick={() => setActiveSection('security')}
              >
                <ListItemIcon>
                  <Security />
                </ListItemIcon>
                <ListItemText primary="Security" />
              </ListItem>
              
              <ListItem
                button
                selected={activeSection === 'map'}
                onClick={() => setActiveSection('map')}
              >
                <ListItemIcon>
                  <Map />
                </ListItemIcon>
                <ListItemText primary="Map Settings" />
              </ListItem>
              
              <ListItem
                button
                selected={activeSection === 'notifications'}
                onClick={() => setActiveSection('notifications')}
              >
                <ListItemIcon>
                  <Notifications />
                </ListItemIcon>
                <ListItemText primary="Notifications" />
              </ListItem>
              
              <ListItem
                button
                selected={activeSection === 'system'}
                onClick={() => setActiveSection('system')}
              >
                <ListItemIcon>
                  <Language />
                </ListItemIcon>
                <ListItemText primary="System" />
              </ListItem>
            </List>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={9}>
          <Paper sx={{ p: 3 }}>
            {renderSettingsSection()}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default CaregiverSettings; 