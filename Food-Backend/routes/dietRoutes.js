const express = require('express');
const router = express.Router();
const dietController = require('../controllers/dietController');

// Save the full 7-day plan
router.post('/save-weekly', dietController.saveWeeklyPlan);

// Get a specific day's plan
router.get('/day/:day/:userId', dietController.getDayPlan);

// Get the full 7-day plan
router.get('/weekly/:userId', dietController.getWeeklyPlan);

module.exports = router;
