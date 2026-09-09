'use strict';

const express = require('express');

const {
    loginUser,
    enrollNewUser
} = require('../controllers/authController');

const { authenticate } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/login', loginUser);
router.post('/enroll', authenticate, enrollNewUser);

module.exports = router;
