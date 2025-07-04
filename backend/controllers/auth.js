const crypto = require('crypto');
const ErrorResponse = require('../utils/errorResponse');
const sendEmail = require('../utils/sendEmail');
const User = require('../models/User');
const Caregiver = require('../models/Caregiver');

// @desc    Register user
// @route   POST /api/v1/auth/register/user
// @access  Public
exports.registerUser = async (req, res, next) => {
  try {
    const { name, email, password, phone } = req.body;

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      phone
    });

    sendTokenResponse(user, 200, res, 'user');
  } catch (err) {
    next(err);
  }
};

// @desc    Register caregiver
// @route   POST /api/v1/auth/register/caregiver
// @access  Public
exports.registerCaregiver = async (req, res, next) => {
  try {
    const { name, email, password, phone } = req.body;

    // Create caregiver
    const caregiver = await Caregiver.create({
      name,
      email,
      password,
      phone
    });

    sendTokenResponse(caregiver, 200, res, 'caregiver');
  } catch (err) {
    next(err);
  }
};

// @desc    Login user
// @route   POST /api/v1/auth/login/user
// @access  Public
exports.loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate email & password
    if (!email || !password) {
      return next(new ErrorResponse('Please provide an email and password', 400));
    }

    // Check for user
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return next(new ErrorResponse('Invalid credentials', 401));
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return next(new ErrorResponse('Invalid credentials', 401));
    }

    sendTokenResponse(user, 200, res, 'user');
  } catch (err) {
    next(err);
  }
};

// @desc    Login caregiver
// @route   POST /api/v1/auth/login/caregiver
// @access  Public
exports.loginCaregiver = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate email & password
    if (!email || !password) {
      return next(new ErrorResponse('Please provide an email and password', 400));
    }

    // Check for caregiver
    const caregiver = await Caregiver.findOne({ email }).select('+password');

    if (!caregiver) {
      return next(new ErrorResponse('Invalid credentials', 401));
    }

    // Check if password matches
    const isMatch = await caregiver.matchPassword(password);

    if (!isMatch) {
      return next(new ErrorResponse('Invalid credentials', 401));
    }

    sendTokenResponse(caregiver, 200, res, 'caregiver');
  } catch (err) {
    next(err);
  }
};

// @desc    Get current logged in user
// @route   GET /api/v1/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      data: req.user
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Forgot password
// @route   POST /api/v1/auth/forgotpassword/:role
// @access  Public
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const { role } = req.params;

    if (role !== 'user' && role !== 'caregiver') {
      return next(new ErrorResponse('Invalid role specified', 400));
    }

    let user;
    
    if (role === 'user') {
      user = await User.findOne({ email });
    } else {
      user = await Caregiver.findOne({ email });
    }

    if (!user) {
      return next(new ErrorResponse('There is no user with that email', 404));
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    console.log(`Generated OTP: ${otp}`); // For development testing, remove in production

    // Hash OTP before saving to database
    const hashedOTP = crypto
      .createHash('sha256')
      .update(otp)
      .digest('hex');

    // Save the hashed OTP as the reset token
    user.resetPasswordToken = hashedOTP;
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes

    await user.save({ validateBeforeSave: false });

    // Message content
    const message = `You are receiving this email because you requested a password reset. Your OTP code is: ${otp}. This code is valid for 10 minutes.`;

    try {
      await sendEmail({
        email: user.email,
        subject: 'Password Reset OTP',
        message,
        html: `
          <h2>Password Reset Request</h2>
          <p>You are receiving this email because you requested a password reset.</p>
          <p>Your OTP code is:</p>
          <h1 style="font-size: 36px; letter-spacing: 4px; background-color: #f4f4f4; padding: 10px; text-align: center; font-family: monospace;">${otp}</h1>
          <p>This code is valid for 10 minutes.</p>
          <p>If you didn't request this, please ignore this email.</p>
        `
      });

      res.status(200).json({ success: true, data: 'OTP sent to email' });
    } catch (err) {
      console.log(err);
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;

      await user.save({ validateBeforeSave: false });

      return next(new ErrorResponse('Email could not be sent', 500));
    }
  } catch (err) {
    next(err);
  }
};

// @desc    Reset password with OTP
// @route   PUT /api/v1/auth/resetpassword/:role
// @access  Public
exports.resetPassword = async (req, res, next) => {
  try {
    const { otp, password } = req.body;
    const { role } = req.params;

    if (!otp || !password) {
      return next(new ErrorResponse('Please provide both OTP and new password', 400));
    }

    if (role !== 'user' && role !== 'caregiver') {
      return next(new ErrorResponse('Invalid role specified', 400));
    }

    // Hash the provided OTP for comparison
    const hashedOTP = crypto
      .createHash('sha256')
      .update(otp)
      .digest('hex');

    let user;
    
    if (role === 'user') {
      user = await User.findOne({
        resetPasswordToken: hashedOTP,
        resetPasswordExpire: { $gt: Date.now() }
      });
    } else {
      user = await Caregiver.findOne({
        resetPasswordToken: hashedOTP,
        resetPasswordExpire: { $gt: Date.now() }
      });
    }

    if (!user) {
      return next(new ErrorResponse('Invalid or expired OTP', 400));
    }

    // Set new password
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    sendTokenResponse(user, 200, res, role);
  } catch (err) {
    next(err);
  }
};

// @desc    Log user out / clear cookie
// @route   GET /api/v1/auth/logout
// @access  Private
exports.logout = async (req, res, next) => {
  try {
    res.cookie('token', 'none', {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true
    });

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
};

// Get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res, role) => {
  // Create token
  const token = user.getSignedJwtToken();

  const options = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
    ),
    httpOnly: true
  };

  if (process.env.NODE_ENV === 'production') {
    options.secure = true;
  }

  res
    .status(statusCode)
    .cookie('token', token, options)
    .json({
      success: true,
      token,
      role
    });
}; 