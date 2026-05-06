'use strict';
const { Router } = require('express');
const { body }   = require('express-validator');
const ctrl       = require('../controllers/vehicle.controller');
const { protect }  = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');

const router = Router();

router.use(protect); // All vehicle routes require auth

router.get('/',  ctrl.getVehicles);
router.get('/:id', ctrl.getVehicle);

router.post(
  '/',
  [
    body('make').trim().notEmpty().withMessage('Make is required'),
    body('model').trim().notEmpty().withMessage('Model is required'),
    body('year').isInt({ min: 2000 }).withMessage('Valid year required'),
  ],
  validate,
  ctrl.createVehicle
);

router.put('/:id', ctrl.updateVehicle);
router.delete('/:id', ctrl.deleteVehicle);

module.exports = router;
