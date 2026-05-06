'use strict';
const { Router } = require('express');
const ctrl       = require('../controllers/user.controller');
const { protect }  = require('../middleware/auth.middleware');

const router = Router();

router.use(protect);

router.get('/me',           ctrl.getProfile);
router.put('/me',           ctrl.updateProfile);
router.put('/me/password',  ctrl.changePassword);
router.delete('/me',        ctrl.deleteAccount);

module.exports = router;
