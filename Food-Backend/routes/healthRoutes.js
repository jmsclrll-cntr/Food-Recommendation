const express = require('express');
const router = express.Router();
const healthController = require('../controllers/healthController');

// Route to save/update data
router.post('/save-profile', healthController.saveHealthProfile);

// Route to get existing data for a specific user
router.get('/profile/:userId', healthController.getHealthProfile);

module.exports = router;