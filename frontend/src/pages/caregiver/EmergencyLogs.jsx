import { useState, useEffect, useContext } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Tooltip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  InputAdornment
} from '@mui/material';
import {
  Search,
  Refresh,
  Visibility,
  Check,
  Warning,
  LocationOn,
  CheckCircle
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../../contexts/AuthContext';
import { getCaregiverUsers } from '../../services/userService';
import { getUserEmergencies, resolveEmergency } from '../../services/sensorService';

const EmergencyLogs = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  
  const [users, setUsers] = useState([]);
  const [emergencies, setEmergencies] = useState([]);
  const [filteredEmergencies, setFilteredEmergencies] = useState([]);
  
  // Filters
  const [filters, setFilters] = useState({
    status: 'all',
    userId: 'all',
    search: '',
    startDate: '',
    endDate: ''
  });
  
  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Load users and emergency logs
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch users
        const usersResponse = await getCaregiverUsers(user._id);
        if (usersResponse.success) {
          setUsers(usersResponse.data);
          
          // Fetch emergencies for all users
          const allEmergencies = [];
          
          for (const userData of usersResponse.data) {
            const emergencyResponse = await getUserEmergencies(userData._id);
            if (emergencyResponse.success) {
              // Add user info to each emergency
              const emergenciesWithUser = emergencyResponse.data.map(emergency => ({
                ...emergency,
                userName: userData.name,
                userEmail: userData.email
              }));
              
              allEmergencies.push(...emergenciesWithUser);
            }
          }
          
          // Sort by timestamp (newest first)
          allEmergencies.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
          
          setEmergencies(allEmergencies);
          setFilteredEmergencies(allEmergencies);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load emergency logs. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [user._id]);
  
  // Apply filters
  useEffect(() => {
    let result = [...emergencies];
    
    // Filter by status
    if (filters.status !== 'all') {
      result = result.filter(emergency => emergency.status === filters.status);
    }
    
    // Filter by user
    if (filters.userId !== 'all') {
      result = result.filter(emergency => emergency.user === filters.userId);
    }
    
    // Filter by search (user name or location)
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(emergency => 
        emergency.userName.toLowerCase().includes(searchLower) ||
        emergency.userEmail.toLowerCase().includes(searchLower)
      );
    }
    
    // Filter by date range
    if (filters.startDate) {
      const startDate = new Date(filters.startDate);
      result = result.filter(emergency => new Date(emergency.timestamp) >= startDate);
    }
    
    if (filters.endDate) {
      const endDate = new Date(filters.endDate);
      endDate.setHours(23, 59, 59, 999); // End of day
      result = result.filter(emergency => new Date(emergency.timestamp) <= endDate);
    }
    
    setFilteredEmergencies(result);
    setPage(0); // Reset to first page when filters change
  }, [filters, emergencies]);
  
  // Handle filter changes
  const handleFilterChange = (name, value) => {
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Refresh data
  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      setError(null);
      
      // Fetch emergencies for all users
      const allEmergencies = [];
      
      for (const userData of users) {
        const emergencyResponse = await getUserEmergencies(userData._id);
        if (emergencyResponse.success) {
          // Add user info to each emergency
          const emergenciesWithUser = emergencyResponse.data.map(emergency => ({
            ...emergency,
            userName: userData.name,
            userEmail: userData.email
          }));
          
          allEmergencies.push(...emergenciesWithUser);
        }
      }
      
      // Sort by timestamp (newest first)
      allEmergencies.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      
      setEmergencies(allEmergencies);
      
      setSuccessMessage('Emergency logs refreshed successfully');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Error refreshing data:', err);
      setError('Failed to refresh emergency logs. Please try again.');
    } finally {
      setRefreshing(false);
    }
  };
  
  // Handle resolving an emergency
  const handleResolveEmergency = async (emergencyId) => {
    try {
      const response = await resolveEmergency(emergencyId);
      
      if (response.success) {
        // Update emergencies list
        setEmergencies(prev => 
          prev.map(e => e._id === emergencyId 
            ? { ...e, status: 'resolved', resolvedBy: user, resolvedAt: new Date() } 
            : e
          )
        );
        
        setSuccessMessage('Emergency marked as resolved successfully');
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    } catch (err) {
      console.error('Error resolving emergency:', err);
      setError('Failed to resolve emergency. Please try again.');
    }
  };
  
  // View user location
  const handleViewUserLocation = (userId) => {
    navigate('/caregiver/dashboard', { state: { selectedUserId: userId } });
  };
  
  // Handle pagination
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };
  
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  // Format timestamp
  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };
  
  // Get status chip color
  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'notified':
        return 'error';
      case 'resolved':
        return 'success';
      default:
        return 'default';
    }
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
        Emergency Logs
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
      
      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel id="status-filter-label">Status</InputLabel>
              <Select
                labelId="status-filter-label"
                value={filters.status}
                label="Status"
                onChange={(e) => handleFilterChange('status', e.target.value)}
              >
                <MenuItem value="all">All Statuses</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="notified">Active (Notified)</MenuItem>
                <MenuItem value="resolved">Resolved</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel id="user-filter-label">User</InputLabel>
              <Select
                labelId="user-filter-label"
                value={filters.userId}
                label="User"
                onChange={(e) => handleFilterChange('userId', e.target.value)}
              >
                <MenuItem value="all">All Users</MenuItem>
                {users.map(user => (
                  <MenuItem key={user._id} value={user._id}>
                    {user.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              size="small"
              label="Search User"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="contained"
                color="primary"
                startIcon={<Refresh />}
                onClick={handleRefresh}
                disabled={refreshing}
              >
                {refreshing ? <CircularProgress size={24} /> : 'Refresh'}
              </Button>
            </Box>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              size="small"
              label="Start Date"
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              size="small"
              label="End Date"
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
        </Grid>
      </Paper>
      
      {/* Emergency Logs Table */}
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer sx={{ maxHeight: 'calc(100vh - 300px)' }}>
          <Table stickyHeader aria-label="emergency logs table">
            <TableHead>
              <TableRow>
                <TableCell>Time</TableCell>
                <TableCell>User</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Resolved By</TableCell>
                <TableCell>Resolved At</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredEmergencies.length > 0 ? (
                filteredEmergencies
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((emergency) => (
                    <TableRow
                      key={emergency._id}
                      hover
                      sx={{
                        backgroundColor: emergency.status !== 'resolved' ? 'rgba(255, 235, 238, 0.5)' : 'inherit',
                        '&:last-child td, &:last-child th': { border: 0 }
                      }}
                    >
                      <TableCell>{formatTimestamp(emergency.timestamp)}</TableCell>
                      <TableCell>
                        <Typography variant="body2">{emergency.userName}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {emergency.userEmail}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={emergency.status.charAt(0).toUpperCase() + emergency.status.slice(1)}
                          color={getStatusColor(emergency.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {emergency.resolvedBy ? (
                          emergency.resolvedBy.name
                        ) : (
                          <Typography variant="caption" color="text.secondary">
                            -
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {emergency.resolvedAt ? (
                          formatTimestamp(emergency.resolvedAt)
                        ) : (
                          <Typography variant="caption" color="text.secondary">
                            -
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="View Location">
                          <IconButton
                            color="primary"
                            size="small"
                            onClick={() => handleViewUserLocation(emergency.user)}
                          >
                            <LocationOn />
                          </IconButton>
                        </Tooltip>
                        
                        {emergency.status !== 'resolved' && (
                          <Tooltip title="Mark as Resolved">
                            <IconButton
                              color="success"
                              size="small"
                              onClick={() => handleResolveEmergency(emergency._id)}
                            >
                              <CheckCircle />
                            </IconButton>
                          </Tooltip>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <Typography variant="body2" sx={{ py: 2 }}>
                      No emergency logs found with the current filters.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={filteredEmergencies.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>
    </Container>
  );
};

export default EmergencyLogs; 