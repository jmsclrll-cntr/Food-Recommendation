const express = require('express');
const router = express.Router();
const recommendationController = require('../controllers/recommendationController');

router.get('/suggest', recommendationController.getSuggestion);
router.post('/generate-plan', recommendationController.getWeeklySuggestion);
router.get('/alternatives', recommendationController.getAlternatives);

module.exports = router;