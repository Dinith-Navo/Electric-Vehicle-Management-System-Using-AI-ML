'use strict';
const { Router } = require('express');
const ctrl       = require('../controllers/telemetry.controller');
const { protect }  = require('../middleware/auth.middleware');

const router = Router();

router.use(protect);

router.get('/',         ctrl.getLatest);
router.get('/history',  ctrl.getHistory);
router.post('/',        ctrl.postTelemetry);

module.exports = router;
