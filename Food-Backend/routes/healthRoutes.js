const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/healthController');

// Dapat '/save' ito para mag-match sa axios call sa frontend
router.post('/save', ctrl.saveHealthProfile);
router.get('/:userId', ctrl.getHealthProfile);

module.exports = router;