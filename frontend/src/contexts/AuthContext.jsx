import { createContext, useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { jwtDecode } from 'jwt-decode';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load user on initial render or token change
  useEffect(() => {
    const loadUser = async () => {
      if (token) {
        try {
          // Set token to axios headers
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          // Get user data
          const res = await api.get('/api/v1/auth/me');
          
          // Check if token is expired
          const decoded = jwtDecode(token);
          const currentTime = Date.now() / 1000;
          
          if (decoded.exp < currentTime) {
            logout();
            return;
          }
          
          setUser(res.data.data);
          setRole(decoded.role);
        } catch (err) {
          localStorage.removeItem('token');
          setToken(null);
          setUser(null);
          setRole(null);
          setError(err.response?.data?.error || 'Error loading user data');
        }
      }
      setLoading(false);
    };

    loadUser();
  }, [token]);

  // Register user
  const register = async (userData, userRole) => {
    setLoading(true);
    try {
      const res = await api.post(`/api/v1/auth/register/${userRole}`, userData);
      
      if (res.data.success) {
        localStorage.setItem('token', res.data.token);
        setToken(res.data.token);
        setRole(res.data.role);
        
        toast.success('Registration successful');
        return true;
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Error during registration');
      toast.error(err.response?.data?.error || 'Error during registration');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Login user
  const login = async (email, password, userRole) => {
    setLoading(true);
    try {
      const res = await api.post(`/api/v1/auth/login/${userRole}`, {
        email,
        password
      });
      
      if (res.data.success) {
        localStorage.setItem('token', res.data.token);
        setToken(res.data.token);
        setRole(res.data.role);
        
        toast.success('Login successful');
        return true;
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid credentials');
      toast.error(err.response?.data?.error || 'Invalid credentials');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Logout user
  const logout = async () => {
    try {
      await api.get('/api/v1/auth/logout');
    } catch (err) {
      console.error('Logout error', err);
    } finally {
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
      setRole(null);
      delete api.defaults.headers.common['Authorization'];
      toast.info('Logged out successfully');
    }
  };

  // Reset password request
  const forgotPassword = async (email, userRole) => {
    setLoading(true);
    try {
      const res = await api.post(`/api/v1/auth/forgotpassword/${userRole}`, { email });
      
      if (res.data.success) {
        toast.success('Password reset email sent');
        return true;
      }
      return false;
    } catch (err) {
      console.error('Password reset error:', err);
      const errorMessage = err.response?.data?.error || 'Error sending reset email';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err; // Re-throw the error so the component can handle it
    } finally {
      setLoading(false);
    }
  };

  // Reset password with OTP
  const resetPassword = async (password, otp, userRole) => {
    setLoading(true);
    try {
      const res = await api.put(`/api/v1/auth/resetpassword/${userRole}`, {
        otp,
        password
      });
      
      if (res.data.success) {
        toast.success('Password reset successful');
        return true;
      }
      return false;
    } catch (err) {
      console.error('Password reset error:', err);
      const errorMessage = err.response?.data?.error || 'Error resetting password';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        token,
        loading,
        error,
        register,
        login,
        logout,
        forgotPassword,
        resetPassword,
        isAuthenticated: !!user
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext; 