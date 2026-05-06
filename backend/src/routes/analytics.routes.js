'use strict';
const { Router } = require('express');
const ctrl = require('../controllers/analytics.controller');
const { protect } = require('../middleware/auth.middleware');

const router = Router();

router.use(protect);

router.get('/summary', ctrl.getSummary);
router.get('/trends', ctrl.getTrends);
router.get('/energy', ctrl.getEnergyUsage);

module.exports = router;
