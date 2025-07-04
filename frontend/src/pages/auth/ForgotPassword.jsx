import { useState, useContext } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Avatar,
  Button,
  TextField,
  Link,
  Grid,
  Box,
  Typography,
  Container,
  Paper,
  Alert,
  CircularProgress,
  ToggleButtonGroup,
  ToggleButton
} from '@mui/material';
import { LockOutlined as LockOutlinedIcon, AccessibilityNew, Favorite } from '@mui/icons-material';
import AuthContext from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const ForgotPassword = () => {
  const { forgotPassword, loading } = useContext(AuthContext);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: '',
    userRole: 'user' // Default role
  });

  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(false);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });

    // Clear error on field change
    if (errors[name]) {
      setErrors({ ...errors, [name]: null });
    }
  };

  // Handle role change
  const handleRoleChange = (e, newRole) => {
    if (newRole !== null) {
      setFormData({ ...formData, userRole: newRole });
    }
  };

  // Form validation
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      try {
        const result = await forgotPassword(formData.email, formData.userRole);
        if (result) {
          setSuccess(true);
        }
      } catch (error) {
        console.error('Forgot password error:', error);
        setErrors({
          ...errors,
          form: `Error sending reset email: ${error.response?.data?.error || error.message || 'Server error'}`
        });
      }
    }
  };

  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          marginTop: 8,
          marginBottom: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper elevation={6} sx={{ p: 4, width: '100%' }}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <Avatar sx={{ m: 1, bgcolor: 'primary.main' }}>
              <LockOutlinedIcon />
            </Avatar>
            <Typography component="h1" variant="h5">
              Reset Password
            </Typography>
            {success ? (
              <Box sx={{ mt: 3, width: '100%' }}>
                <Alert severity="success">
                  An OTP has been sent to your email address. Please check your inbox.
                </Alert>
                <Box sx={{ mt: 3, textAlign: 'center' }}>
                  <Button
                    variant="contained"
                    onClick={() => navigate(`/reset-password/${formData.userRole}`)}
                  >
                    Continue to Reset Password
                  </Button>
                  <Box mt={2}>
                    <Link component={RouterLink} to="/login" variant="body2">
                      Back to Login
                    </Link>
                  </Box>
                </Box>
              </Box>
            ) : (
              <>
                <Typography variant="body2" sx={{ mt: 2, mb: 2, textAlign: 'center' }}>
                  Enter your email address and we'll send you a link to reset your password.
                </Typography>
                
                <Box sx={{ mt: 1, width: '100%', textAlign: 'center' }}>
                  <ToggleButtonGroup
                    color="primary"
                    value={formData.userRole}
                    exclusive
                    onChange={handleRoleChange}
                    aria-label="user role"
                    sx={{ mb: 2 }}
                  >
                    <ToggleButton value="user" aria-label="user">
                      <AccessibilityNew sx={{ mr: 1 }} />
                      User
                    </ToggleButton>
                    <ToggleButton value="caregiver" aria-label="caregiver">
                      <Favorite sx={{ mr: 1 }} />
                      Caregiver
                    </ToggleButton>
                  </ToggleButtonGroup>
                </Box>
                
                <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1, width: '100%' }}>
                  {errors.form && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                      {errors.form}
                    </Alert>
                  )}
                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    id="email"
                    label="Email Address"
                    name="email"
                    autoComplete="email"
                    autoFocus
                    value={formData.email}
                    onChange={handleChange}
                    error={!!errors.email}
                    helperText={errors.email}
                  />
                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    sx={{ mt: 3, mb: 2 }}
                    disabled={loading}
                  >
                    {loading ? <CircularProgress size={24} /> : 'Send Reset Link'}
                  </Button>
                  <Grid container>
                    <Grid item xs>
                      <Link component={RouterLink} to="/login" variant="body2">
                        Back to login
                      </Link>
                    </Grid>
                    <Grid item>
                      <Link component={RouterLink} to="/register" variant="body2">
                        {"Don't have an account? Sign Up"}
                      </Link>
                    </Grid>
                  </Grid>
                </Box>
              </>
            )}
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default ForgotPassword; 