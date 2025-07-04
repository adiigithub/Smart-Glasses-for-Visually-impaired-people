const ErrorResponse = require('../utils/errorResponse');
const Caregiver = require('../models/Caregiver');
const User = require('../models/User');

// @desc    Get all caregivers
// @route   GET /api/v1/caregivers
// @access  Private/Admin
exports.getCaregivers = async (req, res, next) => {
  try {
    const caregivers = await Caregiver.find();

    res.status(200).json({
      success: true,
      count: caregivers.length,
      data: caregivers
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single caregiver
// @route   GET /api/v1/caregivers/:id
// @access  Private
exports.getCaregiver = async (req, res, next) => {
  try {
    const caregiver = await Caregiver.findById(req.params.id);

    if (!caregiver) {
      return next(
        new ErrorResponse(`Caregiver not found with id of ${req.params.id}`, 404)
      );
    }

    res.status(200).json({
      success: true,
      data: caregiver
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update caregiver
// @route   PUT /api/v1/caregivers/:id
// @access  Private
exports.updateCaregiver = async (req, res, next) => {
  try {
    // If not the same caregiver
    if (req.role === 'caregiver' && req.user.id !== req.params.id) {
      return next(
        new ErrorResponse(`Not authorized to update this caregiver`, 401)
      );
    }

    // Prevent password update via this route
    if (req.body.password) {
      delete req.body.password;
    }

    const caregiver = await Caregiver.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!caregiver) {
      return next(
        new ErrorResponse(`Caregiver not found with id of ${req.params.id}`, 404)
      );
    }

    res.status(200).json({
      success: true,
      data: caregiver
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete caregiver
// @route   DELETE /api/v1/caregivers/:id
// @access  Private
exports.deleteCaregiver = async (req, res, next) => {
  try {
    // If not the same caregiver
    if (req.role === 'caregiver' && req.user.id !== req.params.id) {
      return next(
        new ErrorResponse(`Not authorized to delete this caregiver`, 401)
      );
    }

    const caregiver = await Caregiver.findById(req.params.id);

    if (!caregiver) {
      return next(
        new ErrorResponse(`Caregiver not found with id of ${req.params.id}`, 404)
      );
    }

    await caregiver.remove();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get users under care for a caregiver
// @route   GET /api/v1/caregivers/:id/users
// @access  Private
exports.getCaregiverUsers = async (req, res, next) => {
  try {
    const caregiver = await Caregiver.findById(req.params.id).populate('usersUnderCare');

    if (!caregiver) {
      return next(
        new ErrorResponse(`Caregiver not found with id of ${req.params.id}`, 404)
      );
    }

    // Check authorization
    if (req.role === 'caregiver' && req.user.id !== req.params.id) {
      return next(
        new ErrorResponse(`Not authorized to view this caregiver's users`, 401)
      );
    }

    res.status(200).json({
      success: true,
      count: caregiver.usersUnderCare.length,
      data: caregiver.usersUnderCare
    });
  } catch (err) {
    next(err);
  }
}; 