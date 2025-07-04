const ErrorResponse = require('../utils/errorResponse');
const User = require('../models/User');
const Caregiver = require('../models/Caregiver');

// @desc    Get all users
// @route   GET /api/v1/users
// @access  Private/Admin
exports.getUsers = async (req, res, next) => {
  try {
    const users = await User.find();

    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single user
// @route   GET /api/v1/users/:id
// @access  Private/Admin
exports.getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return next(
        new ErrorResponse(`User not found with id of ${req.params.id}`, 404)
      );
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update user
// @route   PUT /api/v1/users/:id
// @access  Private
exports.updateUser = async (req, res, next) => {
  try {
    // If not the same user
    if (req.role === 'user' && req.user.id !== req.params.id) {
      return next(
        new ErrorResponse(`Not authorized to update this user`, 401)
      );
    }

    // Prevent password update via this route
    if (req.body.password) {
      delete req.body.password;
    }

    const user = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!user) {
      return next(
        new ErrorResponse(`User not found with id of ${req.params.id}`, 404)
      );
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete user
// @route   DELETE /api/v1/users/:id
// @access  Private
exports.deleteUser = async (req, res, next) => {
  try {
    // If not the same user
    if (req.role === 'user' && req.user.id !== req.params.id) {
      return next(
        new ErrorResponse(`Not authorized to delete this user`, 401)
      );
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return next(
        new ErrorResponse(`User not found with id of ${req.params.id}`, 404)
      );
    }

    await user.remove();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Add caregiver to user
// @route   PUT /api/v1/users/:id/caregivers/:caregiverId
// @access  Private
exports.addCaregiver = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    const caregiver = await Caregiver.findById(req.params.caregiverId);

    if (!user) {
      return next(
        new ErrorResponse(`User not found with id of ${req.params.id}`, 404)
      );
    }

    if (!caregiver) {
      return next(
        new ErrorResponse(`Caregiver not found with id of ${req.params.caregiverId}`, 404)
      );
    }

    // Check authorization
    if (req.role === 'user' && req.user.id !== req.params.id) {
      return next(
        new ErrorResponse(`Not authorized to update this user's caregivers`, 401)
      );
    }

    if (req.role === 'caregiver' && req.user.id !== req.params.caregiverId) {
      return next(
        new ErrorResponse(`Not authorized to add yourself to this user`, 401)
      );
    }

    // Check if caregiver is already assigned to user
    if (user.emergencyContacts.includes(caregiver._id)) {
      return next(
        new ErrorResponse(`Caregiver is already assigned to this user`, 400)
      );
    }

    // Add caregiver to user
    user.emergencyContacts.push(caregiver._id);
    await user.save();

    // Add user to caregiver
    caregiver.usersUnderCare.push(user._id);
    await caregiver.save();

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Remove caregiver from user
// @route   DELETE /api/v1/users/:id/caregivers/:caregiverId
// @access  Private
exports.removeCaregiver = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    const caregiver = await Caregiver.findById(req.params.caregiverId);

    if (!user) {
      return next(
        new ErrorResponse(`User not found with id of ${req.params.id}`, 404)
      );
    }

    if (!caregiver) {
      return next(
        new ErrorResponse(`Caregiver not found with id of ${req.params.caregiverId}`, 404)
      );
    }

    // Check authorization
    if (req.role === 'user' && req.user.id !== req.params.id) {
      return next(
        new ErrorResponse(`Not authorized to update this user's caregivers`, 401)
      );
    }

    if (req.role === 'caregiver' && req.user.id !== req.params.caregiverId) {
      return next(
        new ErrorResponse(`Not authorized to remove yourself from this user`, 401)
      );
    }

    // Check if caregiver is assigned to user
    if (!user.emergencyContacts.includes(caregiver._id)) {
      return next(
        new ErrorResponse(`Caregiver is not assigned to this user`, 400)
      );
    }

    // Remove caregiver from user
    user.emergencyContacts = user.emergencyContacts.filter(
      id => id.toString() !== caregiver._id.toString()
    );
    await user.save();

    // Remove user from caregiver
    caregiver.usersUnderCare = caregiver.usersUnderCare.filter(
      id => id.toString() !== user._id.toString()
    );
    await caregiver.save();

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get caregivers for a user
// @route   GET /api/v1/users/:id/caregivers
// @access  Private
exports.getUserCaregivers = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).populate('emergencyContacts');

    if (!user) {
      return next(
        new ErrorResponse(`User not found with id of ${req.params.id}`, 404)
      );
    }

    // Check authorization
    if (req.role === 'user' && req.user.id !== req.params.id) {
      return next(
        new ErrorResponse(`Not authorized to view this user's caregivers`, 401)
      );
    }

    res.status(200).json({
      success: true,
      count: user.emergencyContacts.length,
      data: user.emergencyContacts
    });
  } catch (err) {
    next(err);
  }
}; 