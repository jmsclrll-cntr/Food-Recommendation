// Food-Backend/routes/authRoutes.js
const express = require('express');
const router = express.Router();

// 1. Destructure the functions from the controller
const { register, login, googleLogin } = require('../controllers/authController');

/**
 * @route   POST /api/auth/register
 */
router.post('/register', register);

/**
 * @route   POST /api/auth/login
 */
router.post('/login', login);

/**
 * @route   POST /api/auth/google-login
 * @desc    MODIFIED: Added '-login' to match your Frontend request
 */
router.post('/google-login', googleLogin); // Changed from '/google' to '/google-login'

module.exports = router;