'use strict';

const crypto = require('crypto');
const { listUsers } = require('./authService');

const notifications = [];

function createNotification({
    userId,
    organization,
    type,
    title,
    message,
    resourceType,
    resourceId
}) {
    if (!userId || !type || !title) {
        return null;
    }

    const notification = {
        id: `NTF-${crypto.randomUUID()}`,
        userId,
        organization: organization || null,
        type,
        title,
        message: message || null,
        resourceType: resourceType || null,
        resourceId: resourceId || null,
        read: false,
        createdAt: new Date().toISOString()
    };

    notifications.push(notification);
    return notification;
}

function notifyUsers(users, payload) {
    return users
        .filter(Boolean)
        .map((user) =>
            createNotification({
                userId: user.userId,
                organization: user.organization,
                ...payload
            })
        );
}

function notifyRoles(organization, roles, payload) {
    const users = listUsers().filter(
        (user) =>
            user.organization === organization &&
            roles.includes(user.role)
    );

    return notifyUsers(users, payload);
}

function getUnreadCountForUser(userId) {
    return notifications.filter(item => item.userId === userId && !item.read).length;
}

function getNotificationsForUser(userId) {
    return notifications
        .filter((item) => item.userId === userId)
        .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

function markNotificationRead(notificationId, userId) {
    const notification = notifications.find((item) => item.id === notificationId);

    if (!notification) {
        return null;
    }

    if (notification.userId !== userId) {
        const error = new Error('You cannot update this notification');
        error.statusCode = 403;
        error.errorCode = 'FORBIDDEN';
        throw error;
    }

    notification.read = true;
    notification.readAt = new Date().toISOString();
    return notification;
}

module.exports = {
    createNotification,
    notifyUsers,
    notifyRoles,
    getUnreadCountForUser,
    getNotificationsForUser,
    markNotificationRead
};
