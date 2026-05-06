'use strict';
const { Router } = require('express');
const ctrl       = require('../controllers/notification.controller');
const { protect }  = require('../middleware/auth.middleware');

const router = Router();

router.use(protect);

router.get('/',                    ctrl.getAll);
router.patch('/read-all',          ctrl.markAllRead);
router.patch('/:id/read',          ctrl.markRead);
router.delete('/',                 ctrl.deleteAll);
router.delete('/:id',              ctrl.deleteOne);

module.exports = router;
