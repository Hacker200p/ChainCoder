'use strict';

const {
    registerIdentity,
    getIdentity,
    revokeIdentity
} = require('../services/fabricService');

async function createIdentity(req, res) {
    try {
        const { identityId, name, organization, role } = req.body;

        if (!identityId || !name || !organization || !role) {
            return res.status(400).json({
                success: false,
                message: 'identityId, name, organization and role are required'
            });
        }

        const identity = await registerIdentity(
            identityId,
            name,
            organization,
            role
        );

        res.status(201).json({
            success: true,
            message: 'Identity registered successfully',
            identity
        });

    } catch (error) {
        console.error('Create identity error:', error);

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

async function fetchIdentity(req, res) {
    try {
        const { identityId } = req.params;

        if (!identityId) {
            return res.status(400).json({
                success: false,
                message: 'identityId is required'
            });
        }

        const identity = await getIdentity(identityId);

        res.json({
            success: true,
            identity
        });

    } catch (error) {
        console.error('Get identity error:', error);

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
}
async function revokeExistingIdentity(req, res) {
    try {
        const { identityId } = req.params;

        if (!identityId) {
            return res.status(400).json({
                success: false,
                message: 'identityId is required'
            });
        }

        const identity = await revokeIdentity(identityId);

        res.json({
            success: true,
            message: 'Identity revoked successfully',
            identity
        });

    } catch (error) {
        console.error('Revoke identity error:', error);

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

module.exports = {
    createIdentity,
    fetchIdentity,
    revokeExistingIdentity
};