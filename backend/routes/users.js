const express = require('express');
const {
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  addCaregiver,
  removeCaregiver,
  getUserCaregivers
} = require('../controllers/users');

const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(protect);

// User CRUD routes
router.route('/')
  .get(getUsers);

router.route('/:id')
  .get(getUser)
  .put(updateUser)
  .delete(deleteUser);

// Caregiver relationship routes
router.route('/:id/caregivers')
  .get(getUserCaregivers);

router.route('/:id/caregivers/:caregiverId')
  .put(addCaregiver)
  .delete(removeCaregiver);

module.exports = router; 