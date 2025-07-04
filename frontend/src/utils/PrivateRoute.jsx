import { useContext } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import AuthContext from '../contexts/AuthContext';
import { CircularProgress, Box } from '@mui/material';

// PrivateRoute component with role-based access
const PrivateRoute = ({ allowedRoles }) => {
  const { isAuthenticated, role, loading } = useContext(AuthContext);
  const location = useLocation();

  // Show loading spinner while auth state is being checked
  if (loading) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh' 
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if user role is allowed
  const hasAllowedRole = allowedRoles.includes(role);
  
  if (!hasAllowedRole) {
    // Redirect to the appropriate dashboard based on role
    if (role === 'user') {
      return <Navigate to="/user/dashboard" replace />;
    } else if (role === 'caregiver') {
      return <Navigate to="/caregiver/dashboard" replace />;
    } else {
      return <Navigate to="/login" replace />;
    }
  }

  // If authenticated and has allowed role, render the protected component
  return <Outlet />;
};

export default PrivateRoute; 