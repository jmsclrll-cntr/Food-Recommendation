// Food-Backend/routes/authRoutes.js
const express = require('express');
const router = express.Router();

// 1. ADD 'updateUser' to the destructured controller imports
const { register, login, googleLogin, updateUser } = require('../controllers/authController');

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
 */
router.post('/google-login', googleLogin);

/**
 * @route   PUT /api/auth/update/:id
 * @desc    NEW: Update user biometrics and profile details
 */
router.put('/update/:id', updateUser); // <--- ADD THIS LINE

module.exports = router;