const express = require('express');
const router = express.Router();
const recCtrl = require('../controllers/recommendationController');

router.get('/suggest', recCtrl.getSuggestion);

module.exports = router;