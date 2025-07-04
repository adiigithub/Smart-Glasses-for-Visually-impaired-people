import { useState, useEffect, useContext, useRef } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Paper,
  Card,
  CardContent,
  Button,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Alert,
  Tabs,
  Tab,
  Badge,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
} from '@mui/material';
import {
  Person,
  AccessibilityNew,
  LocationOn,
  Notifications,
  Warning,
  Check,
  Add,
  Search,
  PersonAdd,
} from '@mui/icons-material';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import AuthContext from '../../contexts/AuthContext';
import { getCaregiverUsers, searchUserByEmail, addUserToCaregiver } from '../../services/userService';
import {
  getUserEmergencies,
  getSensorReadings,
  resolveEmergency,
} from '../../services/sensorService';
import L from 'leaflet';

// Fix for Leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

// Custom emergency marker icon
const emergencyIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const CaregiverDashboard = () => {
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [sensorData, setSensorData] = useState([]);
  const [emergencies, setEmergencies] = useState([]);
  const [activeEmergencies, setActiveEmergencies] = useState([]);
  const [tabValue, setTabValue] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  const mapRef = useRef(null);
  
  // Add user dialog state
  const [addUserDialogOpen, setAddUserDialogOpen] = useState(false);
  const [searchEmail, setSearchEmail] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [connecting, setConnecting] = useState(false);

  // Fetch caregiver's users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        if (user?._id) {
          const response = await getCaregiverUsers(user._id);
          if (response.success) {
            setUsers(response.data);
            if (response.data.length > 0) {
              setSelectedUser(response.data[0]);
            }
          }
        }
      } catch (err) {
        setError('Failed to fetch users. Please try again.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [user]);

  // Fetch selected user's sensor data and emergencies
  useEffect(() => {
    const fetchUserData = async () => {
      if (selectedUser?._id) {
        try {
          setRefreshing(true);
          
          // Fetch sensor readings
          const sensorResponse = await getSensorReadings(selectedUser._id);
          if (sensorResponse.success) {
            setSensorData(sensorResponse.data);
          }
          
          // Fetch emergency events
          const emergencyResponse = await getUserEmergencies(selectedUser._id);
          if (emergencyResponse.success) {
            setEmergencies(emergencyResponse.data);
            
            // Filter active emergencies (status !== 'resolved')
            const active = emergencyResponse.data.filter(
              (emergency) => emergency.status !== 'resolved'
            );
            setActiveEmergencies(active);
          }
        } catch (err) {
          console.error('Error fetching user data:', err);
        } finally {
          setRefreshing(false);
        }
      }
    };

    fetchUserData();
    
    // Set up polling for real-time updates (every 30 seconds)
    const interval = setInterval(fetchUserData, 30000);
    
    return () => clearInterval(interval);
  }, [selectedUser]);

  // Center map on selected user's location
  useEffect(() => {
    if (mapRef.current && sensorData.length > 0) {
      const latestReading = sensorData[0];
      const location = [
        latestReading.location.latitude,
        latestReading.location.longitude,
      ];
      mapRef.current.setView(location, 13);
    }
  }, [sensorData, mapRef.current]);

  // Handle user selection
  const handleUserSelect = (user) => {
    setSelectedUser(user);
  };

  // Handle emergency resolution
  const handleResolveEmergency = async (emergencyId) => {
    try {
      const response = await resolveEmergency(emergencyId);
      if (response.success) {
        // Update emergencies list
        setEmergencies((prev) =>
          prev.map((e) =>
            e._id === emergencyId ? { ...e, status: 'resolved', resolvedBy: user } : e
          )
        );
        
        // Update active emergencies
        setActiveEmergencies((prev) => prev.filter((e) => e._id !== emergencyId));
        
        // Show success message
        setSuccessMessage('Emergency marked as resolved successfully');
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    } catch (err) {
      setError('Failed to resolve emergency. Please try again.');
      console.error(err);
    }
  };

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Get latest user location
  const getUserLocation = () => {
    if (sensorData.length > 0) {
      const latest = sensorData[0];
      return [latest.location.latitude, latest.location.longitude];
    }
    return [0, 0]; // Default location
  };

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  // Handle search for users by email
  const handleSearchUsers = async () => {
    if (!searchEmail.trim()) return;
    
    try {
      setSearching(true);
      setSearchPerformed(true);
      const response = await searchUserByEmail(searchEmail);
      if (response.success) {
        // Filter out users that are already connected
        const connectedUserIds = users.map(u => u._id);
        const filteredResults = response.data.filter(u => !connectedUserIds.includes(u._id));
        setSearchResults(filteredResults);
      }
    } catch (err) {
      console.error('Error searching users:', err);
      setError('Failed to search users. Please try again.');
    } finally {
      setSearching(false);
    }
  };

  // Handle add user to caregiver
  const handleAddUser = async (userId) => {
    try {
      setConnecting(true);
      const response = await addUserToCaregiver(userId, user._id);
      if (response.success) {
        // Refresh the user list
        const updatedResponse = await getCaregiverUsers(user._id);
        if (updatedResponse.success) {
          setUsers(updatedResponse.data);
        }
        
        // Update search results to remove the added user
        setSearchResults(prev => prev.filter(u => u._id !== userId));
        
        // Show success message
        setSuccessMessage('User added successfully');
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    } catch (err) {
      console.error('Error adding user:', err);
      setError('Failed to add user. Please try again.');
    } finally {
      setConnecting(false);
    }
  };

  // Open/close the add user dialog
  const handleOpenAddUserDialog = () => {
    setAddUserDialogOpen(true);
    setSearchEmail('');
    setSearchResults([]);
    setSearchPerformed(false);
  };

  const handleCloseAddUserDialog = () => {
    setAddUserDialogOpen(false);
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
        Caregiver Dashboard
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {successMessage && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {successMessage}
        </Alert>
      )}

      {/* Emergency Alerts Section */}
      {activeEmergencies.length > 0 && (
        <Paper sx={{ p: 2, mb: 3, bgcolor: '#fff8f8', borderLeft: '4px solid #f44336' }}>
          <Typography variant="h6" color="error" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
            <Warning sx={{ mr: 1 }} /> Active Emergency Alerts
          </Typography>
          <Grid container spacing={2}>
            {activeEmergencies.map((emergency) => {
              // Find the user this emergency belongs to
              const emergencyUser = users.find(u => u._id === emergency.user);
              if (!emergencyUser) return null;
              
              return (
                <Grid item xs={12} sm={6} md={4} key={emergency._id}>
                  <Card variant="outlined" sx={{ bgcolor: '#ffebee', borderColor: '#ffcdd2' }}>
                    <CardContent>
                      <Typography variant="subtitle1" color="error" gutterBottom>
                        <Warning fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                        Emergency Alert
                      </Typography>
                      <Typography variant="body2" gutterBottom>
                        <strong>User:</strong> {emergencyUser.name}
                      </Typography>
                      <Typography variant="body2" gutterBottom>
                        <strong>Time:</strong> {formatTimestamp(emergency.timestamp)}
                      </Typography>
                      <Box sx={{ mt: 1, display: 'flex', justifyContent: 'space-between' }}>
                        <Button
                          size="small"
                          variant="outlined"
                          color="primary"
                          onClick={() => {
                            setSelectedUser(emergencyUser);
                            setTabValue(0); // Switch to map tab
                          }}
                        >
                          View Location
                        </Button>
                        <Button
                          size="small"
                          variant="contained"
                          color="primary"
                          onClick={() => handleResolveEmergency(emergency._id)}
                        >
                          Resolve
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        </Paper>
      )}

      <Grid container spacing={3}>
        {/* Users List */}
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                My Users
              </Typography>
              <Button 
                variant="contained" 
                size="small" 
                startIcon={<PersonAdd />}
                onClick={handleOpenAddUserDialog}
              >
                Add User
              </Button>
            </Box>
            
            {users.length === 0 ? (
              <Alert severity="info" sx={{ mt: 2 }}>
                You don't have any users yet. Click 'Add User' to connect with a user.
              </Alert>
            ) : (
              <List>
                {users.map((u) => (
                  <ListItem
                    button
                    key={u._id}
                    selected={selectedUser?._id === u._id}
                    onClick={() => handleUserSelect(u)}
                    sx={{
                      borderRadius: 1,
                      mb: 1,
                      bgcolor:
                        selectedUser?._id === u._id ? 'action.selected' : 'background.paper',
                    }}
                  >
                    <ListItemAvatar>
                      <Badge
                        color="error"
                        badgeContent={
                          activeEmergencies.filter((e) => e.user === u._id).length
                        }
                        overlap="circular"
                      >
                        <Avatar>
                          <Person />
                        </Avatar>
                      </Badge>
                    </ListItemAvatar>
                    <ListItemText
                      primary={u.name}
                      secondary={u.email}
                      primaryTypographyProps={{
                        fontWeight: selectedUser?._id === u._id ? 'bold' : 'normal',
                      }}
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </Paper>
        </Grid>

        {/* User Details and Map */}
        <Grid item xs={12} md={9}>
          {selectedUser ? (
            <>
              <Paper sx={{ p: 2, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  {selectedUser.name}'s Information
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body1">
                      <strong>Email:</strong> {selectedUser.email}
                    </Typography>
                    <Typography variant="body1">
                      <strong>Phone:</strong> {selectedUser.phone}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body1">
                      <strong>Status:</strong>{' '}
                      {activeEmergencies.filter((e) => e.user === selectedUser._id)
                        .length > 0 ? (
                        <Box component="span" sx={{ color: 'error.main' }}>
                          <Warning fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                          Emergency
                        </Box>
                      ) : (
                        <Box component="span" sx={{ color: 'success.main' }}>
                          <Check fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                          Normal
                        </Box>
                      )}
                    </Typography>
                    <Typography variant="body1">
                      <strong>Last Update:</strong>{' '}
                      {sensorData.length > 0
                        ? formatTimestamp(sensorData[0].timestamp)
                        : 'No data'}
                    </Typography>
                  </Grid>
                </Grid>
                <Box sx={{ mt: 2 }}>
                  <Button
                    variant="outlined"
                    color="primary"
                    disabled={refreshing}
                    onClick={() => {
                      setRefreshing(true);
                      // Re-fetch data for this user
                      getSensorReadings(selectedUser._id)
                        .then((response) => {
                          if (response.success) {
                            setSensorData(response.data);
                          }
                        })
                        .catch((err) => console.error(err))
                        .finally(() => setRefreshing(false));
                    }}
                    startIcon={refreshing ? <CircularProgress size={20} /> : null}
                  >
                    {refreshing ? 'Refreshing...' : 'Refresh Data'}
                  </Button>
                </Box>
              </Paper>

              <Paper sx={{ mb: 3 }}>
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                  <Tabs
                    value={tabValue}
                    onChange={handleTabChange}
                    aria-label="user data tabs"
                  >
                    <Tab 
                      label="Location Map" 
                      icon={<LocationOn />} 
                      iconPosition="start" 
                    />
                    <Tab 
                      label={
                        <Badge 
                          color="error" 
                          badgeContent={activeEmergencies.filter(e => e.user === selectedUser._id).length}
                        >
                          Emergencies
                        </Badge>
                      } 
                      icon={<Notifications />} 
                      iconPosition="start" 
                    />
                  </Tabs>
                </Box>

                {/* Map Tab */}
                <Box role="tabpanel" hidden={tabValue !== 0} sx={{ p: 2 }}>
                  {tabValue === 0 && (
                    <>
                      {sensorData.length > 0 ? (
                        <Box sx={{ height: '400px', width: '100%' }}>
                          <MapContainer
                            center={getUserLocation()}
                            zoom={13}
                            style={{ height: '100%', width: '100%' }}
                            whenCreated={(map) => {
                              mapRef.current = map;
                            }}
                          >
                            <TileLayer
                              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            />
                            {/* Latest location marker */}
                            <Marker position={getUserLocation()}>
                              <Popup>
                                <strong>{selectedUser.name}</strong>
                                <br />
                                Last updated: {formatTimestamp(sensorData[0].timestamp)}
                                <br />
                                Distance reading: {sensorData[0].distance.toFixed(2)}m
                              </Popup>
                            </Marker>

                            {/* Emergency markers */}
                            {activeEmergencies
                              .filter((e) => e.user === selectedUser._id)
                              .map((emergency) => (
                                <Marker
                                  key={emergency._id}
                                  position={[
                                    emergency.location.latitude,
                                    emergency.location.longitude,
                                  ]}
                                  icon={emergencyIcon}
                                >
                                  <Popup>
                                    <Box sx={{ p: 1 }}>
                                      <Typography variant="subtitle1" color="error">
                                        <Warning
                                          fontSize="small"
                                          sx={{ verticalAlign: 'middle', mr: 0.5 }}
                                        />
                                        Emergency Alert
                                      </Typography>
                                      <Divider sx={{ my: 1 }} />
                                      <Typography variant="body2">
                                        <strong>Time:</strong>{' '}
                                        {formatTimestamp(emergency.timestamp)}
                                      </Typography>
                                      <Typography variant="body2">
                                        <strong>Status:</strong> {emergency.status}
                                      </Typography>
                                      <Button
                                        variant="contained"
                                        color="primary"
                                        size="small"
                                        sx={{ mt: 1 }}
                                        onClick={() =>
                                          handleResolveEmergency(emergency._id)
                                        }
                                      >
                                        Mark as Resolved
                                      </Button>
                                    </Box>
                                  </Popup>
                                </Marker>
                              ))}
                          </MapContainer>
                        </Box>
                      ) : (
                        <Box sx={{ p: 3, textAlign: 'center' }}>
                          <Typography variant="body1" color="text.secondary">
                            No location data available for this user.
                          </Typography>
                        </Box>
                      )}
                    </>
                  )}
                </Box>

                {/* Emergencies Tab */}
                <Box role="tabpanel" hidden={tabValue !== 1} sx={{ p: 2 }}>
                  {tabValue === 1 && (
                    <Box>
                      <Typography variant="subtitle1" gutterBottom>
                        Emergency History
                      </Typography>
                      {emergencies.length > 0 ? (
                        <Grid container spacing={2}>
                          {emergencies
                            .filter((e) => e.user === selectedUser._id)
                            .map((emergency) => (
                              <Grid item xs={12} key={emergency._id}>
                                <Card
                                  variant="outlined"
                                  sx={{
                                    borderColor:
                                      emergency.status === 'resolved'
                                        ? 'success.light'
                                        : 'error.light',
                                  }}
                                >
                                  <CardContent>
                                    <Grid container spacing={2}>
                                      <Grid item xs={12} sm={6}>
                                        <Typography
                                          variant="subtitle1"
                                          color={
                                            emergency.status === 'resolved'
                                              ? 'success.main'
                                              : 'error.main'
                                          }
                                          gutterBottom
                                        >
                                          {emergency.status === 'resolved' ? (
                                            <Check
                                              fontSize="small"
                                              sx={{ verticalAlign: 'middle', mr: 0.5 }}
                                            />
                                          ) : (
                                            <Warning
                                              fontSize="small"
                                              sx={{ verticalAlign: 'middle', mr: 0.5 }}
                                            />
                                          )}
                                          {emergency.status === 'resolved'
                                            ? 'Resolved Emergency'
                                            : 'Active Emergency'}
                                        </Typography>
                                        <Typography variant="body2">
                                          <strong>Time:</strong>{' '}
                                          {formatTimestamp(emergency.timestamp)}
                                        </Typography>
                                        <Typography variant="body2">
                                          <strong>Location:</strong>{' '}
                                          {emergency.location.latitude.toFixed(6)},{' '}
                                          {emergency.location.longitude.toFixed(6)}
                                        </Typography>
                                      </Grid>
                                      <Grid item xs={12} sm={6}>
                                        <Typography variant="body2">
                                          <strong>Status:</strong> {emergency.status}
                                        </Typography>
                                        {emergency.status === 'resolved' ? (
                                          <>
                                            <Typography variant="body2">
                                              <strong>Resolved by:</strong>{' '}
                                              {emergency.resolvedBy
                                                ? emergency.resolvedBy.name
                                                : 'N/A'}
                                            </Typography>
                                            <Typography variant="body2">
                                              <strong>Resolved at:</strong>{' '}
                                              {emergency.resolvedAt
                                                ? formatTimestamp(emergency.resolvedAt)
                                                : 'N/A'}
                                            </Typography>
                                          </>
                                        ) : (
                                          <Button
                                            variant="contained"
                                            color="primary"
                                            size="small"
                                            sx={{ mt: 1 }}
                                            onClick={() =>
                                              handleResolveEmergency(emergency._id)
                                            }
                                          >
                                            Mark as Resolved
                                          </Button>
                                        )}
                                      </Grid>
                                    </Grid>
                                  </CardContent>
                                </Card>
                              </Grid>
                            ))}
                        </Grid>
                      ) : (
                        <Box sx={{ p: 3, textAlign: 'center' }}>
                          <Typography variant="body1" color="text.secondary">
                            No emergency events for this user.
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  )}
                </Box>
              </Paper>
            </>
          ) : (
            <Paper sx={{ p: 4, textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
              <Typography variant="h6" gutterBottom>
                No User Selected
              </Typography>
              {users.length > 0 ? (
                <Typography variant="body1">
                  Select a user from the list to view their details and location.
                </Typography>
              ) : (
                <>
                  <Typography variant="body1" gutterBottom>
                    You don't have any users to monitor yet.
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<PersonAdd />}
                    onClick={handleOpenAddUserDialog}
                    sx={{ mt: 2 }}
                  >
                    Add a User
                  </Button>
                </>
              )}
            </Paper>
          )}
        </Grid>
      </Grid>

      {/* Add User Dialog */}
      <Dialog open={addUserDialogOpen} onClose={handleCloseAddUserDialog} fullWidth maxWidth="sm">
        <DialogTitle>Add User to Monitor</DialogTitle>
        <DialogContent>
          <Typography variant="body2" paragraph>
            Search for a user by their email address to add them to your monitoring list.
          </Typography>
          
          <Box sx={{ display: 'flex', mb: 3, mt: 1 }}>
            <TextField
              fullWidth
              label="User Email"
              variant="outlined"
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
              sx={{ mr: 1 }}
              disabled={searching}
            />
            <Button
              variant="contained"
              startIcon={<Search />}
              onClick={handleSearchUsers}
              disabled={searching || !searchEmail.trim()}
            >
              {searching ? <CircularProgress size={24} /> : 'Search'}
            </Button>
          </Box>
          
          {searchPerformed && (
            <>
              {searchResults.length > 0 ? (
                <>
                  <Typography variant="subtitle2" gutterBottom>
                    Search Results:
                  </Typography>
                  <List>
                    {searchResults.map((result) => (
                      <ListItem key={result._id} divider>
                        <ListItemAvatar>
                          <Avatar>
                            <Person />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={result.name}
                          secondary={result.email}
                        />
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<Add />}
                          onClick={() => handleAddUser(result._id)}
                          disabled={connecting}
                        >
                          Add
                        </Button>
                      </ListItem>
                    ))}
                  </List>
                </>
              ) : (
                <Alert severity="info">
                  No users found with this email address. Please try another email.
                </Alert>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAddUserDialog}>Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default CaregiverDashboard; 