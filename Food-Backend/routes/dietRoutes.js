const express = require('express');
const router = express.Router();
const dietController = require('../controllers/dietController');

// Save the full 7-day plan
router.post('/save-weekly', dietController.saveWeeklyPlan);

// Get a specific day's plan
router.get('/day/:day/:userId', dietController.getDayPlan);

// Get the full 7-day plan
router.get('/weekly/:userId', dietController.getWeeklyPlan);

// Delete weekly plan
router.delete('/weekly/:userId', dietController.deleteWeeklyPlan);

// Seed progress for a user
router.post('/seed-progress', dietController.seedProgress);

// Get diet plan history
router.get('/history/:userId', dietController.getHistory);

module.exports = router;
