'use strict';

const {
    grantAccess,
    checkAccess,
    revokeAccess
} = require('../services/accessService');
const { recordFromRequest, accessResourceId, getAuditLogs } = require('../services/auditLogService');
const { createNotification } = require('../services/notificationService');
const { canCheckAccessRecord, assertSafeId } = require('../services/authorizationService');
const { handleControllerError, sendError, sendSuccess } = require('../utils/errors');

async function createAccess(req, res) {
    try {
        const {
            accessId,
            identityId,
            assetId,
            grantedTo,
            permission
        } = req.body;

        if (
            !accessId ||
            !identityId ||
            !assetId ||
            !grantedTo ||
            !permission
        ) {
            return sendError(
                res,
                400,
                'accessId, identityId, assetId, grantedTo and permission are required',
                'BAD_REQUEST'
            );
        }

        assertSafeId(identityId, 'identityId');
        assertSafeId(assetId, 'assetId');

        const access = await grantAccess(
            accessId,
            identityId,
            assetId,
            grantedTo,
            permission,
            'BEL'
        );

        recordFromRequest(req, {
            action: 'ACCESS_GRANTED',
            resourceType: 'access',
            resourceId: accessResourceId(identityId, assetId),
            success: true
        });

        createNotification({
            userId: grantedTo,
            type: 'ACCESS_GRANTED',
            title: 'Access granted',
            message: `Access to ${assetId} was granted`,
            resourceType: 'access',
            resourceId: assetId
        });

        return sendSuccess(res, {
            message: 'Access granted successfully',
            access
        }, 201);
    } catch (error) {
        console.error('Grant access error:', error);
        recordFromRequest(req, {
            action: 'ACCESS_GRANTED',
            resourceType: 'access',
            resourceId: req.body?.assetId,
            success: false,
            message: error.message
        });
        return handleControllerError(res, error, 'Unable to grant access');
    }
}

async function checkExistingAccess(req, res) {
    try {
        const {
            identityId,
            assetId
        } = req.params;

        if (!identityId || !assetId) {
            return sendError(res, 400, 'identityId and assetId are required', 'BAD_REQUEST');
        }

        if (!canCheckAccessRecord(req.user, identityId)) {
            return sendError(res, 403, 'Access denied', 'FORBIDDEN');
        }

        const access = await checkAccess(
            identityId,
            assetId,
            req.user.organization === 'Contractor' ? 'Contractor' : 'BEL'
        );

        return sendSuccess(res, { access });
    } catch (error) {
        console.error('Check access error:', error);
        return handleControllerError(res, error, 'Unable to check access');
    }
}

async function revokeExistingAccess(req, res) {
    try {
        const {
            identityId,
            assetId
        } = req.params;

        if (!identityId || !assetId) {
            return sendError(res, 400, 'identityId and assetId are required', 'BAD_REQUEST');
        }

        const access = await revokeAccess(identityId, assetId, 'BEL');

        recordFromRequest(req, {
            action: 'ACCESS_REVOKED',
            resourceType: 'access',
            resourceId: accessResourceId(identityId, assetId),
            success: true
        });

        createNotification({
            userId: access.grantedTo || identityId,
            type: 'ACCESS_REVOKED',
            title: 'Access revoked',
            message: `Access to ${assetId} was revoked`,
            resourceType: 'access',
            resourceId: assetId
        });

        return sendSuccess(res, {
            message: 'Access revoked successfully',
            access
        });
    } catch (error) {
        console.error('Revoke access error:', error);
        recordFromRequest(req, {
            action: 'ACCESS_REVOKED',
            resourceType: 'access',
            resourceId: req.params.assetId,
            success: false,
            message: error.message
        });
        return handleControllerError(res, error, 'Unable to revoke access');
    }
}

async function listAccessHistory(req, res) {
    try {
        const history = getAuditLogs({ resourceType: 'access' });
        return sendSuccess(res, { history });
    } catch (error) {
        console.error('Access history error:', error);
        return handleControllerError(res, error, 'Unable to fetch access history');
    }
}

module.exports = {
    createAccess,
    checkExistingAccess,
    revokeExistingAccess,
    listAccessHistory
};
