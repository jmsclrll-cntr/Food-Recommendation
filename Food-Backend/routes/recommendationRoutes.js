const express = require('express');
const router = express.Router();
const recCtrl = require('../controllers/recommendationController');

// Para sa live BMI category (GET)
router.get('/suggest', recCtrl.getSuggestion);

// PARA SA 7-DAY PLAN (POST) - Siguraduhin na nandito ito
router.post('/generate-plan', recCtrl.getWeeklySuggestion);

module.exports = router;