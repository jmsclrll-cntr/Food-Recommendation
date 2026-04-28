const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/healthController');

router.post('/save', ctrl.saveHealthProfile);
router.get('/:userId', ctrl.getHealthProfile);

// FIXED: Added 'ctrl.' prefix to avoid "updateHealthData is not defined"
router.put("/update/:userId", ctrl.updateHealthData); 

module.exports = router;