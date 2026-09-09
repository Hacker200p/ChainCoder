'use strict';

const express = require('express');

const {
    listNotifications,
    getUnreadCount,
    markRead
} = require('../controllers/notificationController');

const { authenticate } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/unread-count', authenticate, getUnreadCount);
router.get('/', authenticate, listNotifications);
router.patch('/:id/read', authenticate, markRead);

module.exports = router;
