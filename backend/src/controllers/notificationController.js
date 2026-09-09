'use strict';

const {
    getNotificationsForUser,
    getUnreadCountForUser,
    markNotificationRead
} = require('../services/notificationService');
const { handleControllerError, sendError, sendSuccess } = require('../utils/errors');

async function getUnreadCount(req, res) {
    try {
        const count = getUnreadCountForUser(req.user.userId);
        return sendSuccess(res, { unreadCount: count });
    } catch (error) {
        return handleControllerError(res, error, 'Unable to get unread notification count');
    }
}

async function listNotifications(req, res) {
    try {
        const notifications = getNotificationsForUser(req.user.userId);
        return sendSuccess(res, { notifications });
    } catch (error) {
        return handleControllerError(res, error, 'Unable to list notifications');
    }
}

async function markRead(req, res) {
    try {
        const notification = markNotificationRead(req.params.id, req.user.userId);

        if (!notification) {
            return sendError(res, 404, 'Notification not found', 'NOT_FOUND');
        }

        return sendSuccess(res, {
            message: 'Notification marked as read',
            notification
        });
    } catch (error) {
        if (error.statusCode === 403) {
            return sendError(res, 403, error.message, 'FORBIDDEN');
        }

        return handleControllerError(res, error, 'Unable to update notification');
    }
}

module.exports = {
    getUnreadCount,
    listNotifications,
    markRead
};
