'use strict';

const crypto = require('crypto');

const logs = [];
const identityIds = new Set();
const assetIds = new Set();
const accessKeys = new Set();

function rememberResource({ resourceType, resourceId }) {
    if (!resourceType || !resourceId) {
        return;
    }

    if (resourceType === 'identity') {
        identityIds.add(resourceId);
    }

    if (resourceType === 'asset') {
        assetIds.add(resourceId);
    }

    if (resourceType === 'access') {
        accessKeys.add(resourceId);
    }
}

function recordAuditLog({
    userId,
    organization,
    role,
    action,
    resourceType,
    resourceId,
    success,
    transactionId,
    ipAddress,
    message
}) {
    const entry = {
        id: `AUD-${crypto.randomUUID()}`,
        userId: userId || null,
        organization: organization || null,
        role: role || null,
        action,
        resourceType: resourceType || null,
        resourceId: resourceId || null,
        success: Boolean(success),
        transactionId: transactionId || null,
        ipAddress: ipAddress || null,
        message: message || null,
        timestamp: new Date().toISOString()
    };

    logs.push(entry);
    rememberResource(entry);
    return entry;
}

function recordFromRequest(req, details) {
    return recordAuditLog({
        userId: req.user?.userId,
        organization: req.user?.organization,
        role: req.user?.role,
        ipAddress: req.ip || req.headers['x-forwarded-for'] || req.socket?.remoteAddress || null,
        ...details
    });
}

function getAuditLogs(filters = {}) {
    return logs.filter((entry) => {
        if (filters.action && entry.action !== filters.action) {
            return false;
        }

        if (filters.resourceType && entry.resourceType !== filters.resourceType) {
            return false;
        }

        if (filters.organization && entry.organization !== filters.organization) {
            return false;
        }

        return true;
    });
}

function getKnownIdentityIds() {
    return Array.from(identityIds);
}

function getKnownAssetIds() {
    return Array.from(assetIds);
}

function getKnownAccessKeys() {
    return Array.from(accessKeys).map((key) => {
        const [identityId, assetId] = key.split('::');
        return { identityId, assetId, key };
    });
}

function accessResourceId(identityId, assetId) {
    return `${identityId}::${assetId}`;
}

function toCsv(entries) {
    const header = [
        'id',
        'timestamp',
        'userId',
        'organization',
        'role',
        'action',
        'resourceType',
        'resourceId',
        'success',
        'transactionId'
    ];

    const rows = entries.map((entry) =>
        header
            .map((field) => {
                const value = entry[field] == null ? '' : String(entry[field]);
                return `"${value.replace(/"/g, '""')}"`;
            })
            .join(',')
    );

    return [header.join(','), ...rows].join('\n');
}

module.exports = {
    recordAuditLog,
    recordFromRequest,
    getAuditLogs,
    getKnownIdentityIds,
    getKnownAssetIds,
    getKnownAccessKeys,
    accessResourceId,
    toCsv
};
