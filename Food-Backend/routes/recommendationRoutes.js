const express = require('express');
const router = express.Router();
const recController = require('../controllers/recommendationController');

router.post('/predict', recController.getDietRecommendation);

module.exports = router;    