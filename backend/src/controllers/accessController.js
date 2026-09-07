'use strict';

const {
    grantAccess,
    checkAccess,
    revokeAccess
} = require('../services/accessService');


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
            return res.status(400).json({
                success: false,
                message: 'accessId, identityId, assetId, grantedTo and permission are required'
            });
        }

        const access = await grantAccess(
            accessId,
            identityId,
            assetId,
            grantedTo,
            permission
        );

        res.status(201).json({
            success: true,
            message: 'Access granted successfully',
            access
        });

    } catch (error) {
        console.error('Grant access error:', error);

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
}


async function checkExistingAccess(req, res) {
    try {
        const {
            identityId,
            assetId
        } = req.params;

        if (!identityId || !assetId) {
            return res.status(400).json({
                success: false,
                message: 'identityId and assetId are required'
            });
        }

        const access = await checkAccess(
            identityId,
            assetId
        );

        res.json({
            success: true,
            access
        });

    } catch (error) {
        console.error('Check access error:', error);

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
}


async function revokeExistingAccess(req, res) {
    try {
        const {
            identityId,
            assetId
        } = req.params;

        if (!identityId || !assetId) {
            return res.status(400).json({
                success: false,
                message: 'identityId and assetId are required'
            });
        }

        const access = await revokeAccess(
            identityId,
            assetId
        );

        res.json({
            success: true,
            message: 'Access revoked successfully',
            access
        });

    } catch (error) {
        console.error('Revoke access error:', error);

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
}


module.exports = {
    createAccess,
    checkExistingAccess,
    revokeExistingAccess
};