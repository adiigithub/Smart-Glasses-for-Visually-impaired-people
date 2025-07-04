import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Contexts
import { AuthProvider } from './contexts/AuthContext';

// Components
import Navbar from './components/Navbar';
import PrivateRoute from './utils/PrivateRoute';

// Pages
import Home from './pages/Home';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';

// User Pages
import UserDashboard from './pages/user/Dashboard';

// Caregiver Pages
import CaregiverDashboard from './pages/caregiver/Dashboard';
import CaregiverProfile from './pages/caregiver/Profile';
import CaregiverSettings from './pages/caregiver/Settings';
import EmergencyLogs from './pages/caregiver/EmergencyLogs';

// Create a theme instance
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#f50057',
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ToastContainer position="top-right" autoClose={3000} />
      <AuthProvider>
        <Router>
          <Navbar />
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:role" element={<ResetPassword />} />

            {/* Protected User Routes */}
            <Route element={<PrivateRoute allowedRoles={['user']} />}>
              <Route path="/user/dashboard" element={<UserDashboard />} />
            </Route>

            {/* Protected Caregiver Routes */}
            <Route element={<PrivateRoute allowedRoles={['caregiver']} />}>
              <Route path="/caregiver/dashboard" element={<CaregiverDashboard />} />
              <Route path="/caregiver/users" element={<CaregiverDashboard />} />
              <Route path="/caregiver/profile" element={<CaregiverProfile />} />
              <Route path="/caregiver/settings" element={<CaregiverSettings />} />
              <Route path="/caregiver/emergency-logs" element={<EmergencyLogs />} />
            </Route>
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
