'use strict';

const express = require('express');
const auditorRoutes = require('./auditorRoutes');

const router = express.Router();

router.use('/', auditorRoutes);

module.exports = router;
