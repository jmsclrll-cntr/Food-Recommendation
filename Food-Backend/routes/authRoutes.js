// Food-Backend/routes/authRoutes.js
const express = require('express');
const router = express.Router();

// 1. Destructure the functions from the controller
const { register, login, googleLogin, sendOTP, deleteAccount } = require('../controllers/authController');

/**
 * @route   POST /api/auth/send-otp
 */
router.post('/send-otp', sendOTP);

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

/**
 * @route   POST /api/auth/delete
 */
router.post('/delete', deleteAccount);

/**
 * @route   PUT /api/auth/update/:uid
 */
router.put('/update/:uid', require('../controllers/authController').updateProfile);

/**
 * @route   GET /api/auth/profile/:uid
 */
router.get('/profile/:uid', require('../controllers/authController').getProfile);

module.exports = router;