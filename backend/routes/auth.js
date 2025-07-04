const express = require('express');
const {
  registerUser,
  registerCaregiver,
  loginUser,
  loginCaregiver,
  getMe,
  forgotPassword,
  resetPassword,
  logout
} = require('../controllers/auth');

const { protect } = require('../middleware/auth');

const router = express.Router();

// User routes
router.post('/register/user', registerUser);
router.post('/login/user', loginUser);

// Caregiver routes
router.post('/register/caregiver', registerCaregiver);
router.post('/login/caregiver', loginCaregiver);

// Shared routes
router.get('/me', protect, getMe);
router.get('/logout', logout);
router.post('/forgotpassword/:role', forgotPassword);
router.put('/resetpassword/:role', resetPassword);

module.exports = router; 