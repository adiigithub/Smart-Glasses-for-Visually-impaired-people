const express = require('express');
const {
  getCaregivers,
  getCaregiver,
  updateCaregiver,
  deleteCaregiver,
  getCaregiverUsers
} = require('../controllers/caregivers');

const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(protect);

// Caregiver CRUD routes
router.route('/')
  .get(getCaregivers);

router.route('/:id')
  .get(getCaregiver)
  .put(updateCaregiver)
  .delete(deleteCaregiver);

// User relationship routes
router.route('/:id/users')
  .get(getCaregiverUsers);

module.exports = router; 