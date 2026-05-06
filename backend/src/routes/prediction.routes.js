'use strict';
const { Router } = require('express');
const ctrl       = require('../controllers/prediction.controller');
const { protect }  = require('../middleware/auth.middleware');

const router = Router();

router.use(protect);

router.post('/',       ctrl.runPrediction);
router.post('/train',  ctrl.trainModel);
router.get('/',        ctrl.getHistory);
router.get('/latest',  ctrl.getLatest);

module.exports = router;
