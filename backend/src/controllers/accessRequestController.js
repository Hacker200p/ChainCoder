'use strict';

const {
    createAccessRequest,
    getRequests,
    getRequestById,
    approveRequest,
    rejectRequest,
    auditorApproveRequest
} = require('../services/accessRequestService');

async function requestAccess(req, res) {
    try {
        const {
            identityId,
            assetId,
            permission,
            reason
        } = req.body;

        if (!identityId || !assetId || !permission) {
            return res.status(400).json({
                success: false,
                message: 'identityId, assetId and permission are required'
            });
        }

        const request = createAccessRequest({
            requesterId: req.user.userId,
            requesterName: req.user.name,
            organization: req.user.organization,
            identityId,
            assetId,
            permission,
            reason
        });

        return res.status(201).json({
            success: true,
            message: 'Access request submitted successfully',
            request
        });

    } catch (error) {
        console.error('Access request error:', error);

        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
}

async function listAccessRequests(req, res) {
    try {
        const requests = getRequests();

        return res.status(200).json({
            success: true,
            requests
        });

    } catch (error) {
        console.error('List access requests error:', error);

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

async function getAccessRequest(req, res) {
    try {
        const { requestId } = req.params;

        const request = getRequestById(requestId);

        if (!request) {
            return res.status(404).json({
                success: false,
                message: 'Access request not found'
            });
        }

        return res.status(200).json({
            success: true,
            request
        });

    } catch (error) {
        console.error('Get access request error:', error);

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

async function approveAccessRequest(req, res) {
    try {
        const { requestId } = req.params;

        const request = approveRequest(
            requestId,
            req.user.userId
        );

        return res.status(200).json({
            success: true,
            message: 'Access request approved by BEL',
            request
        });

    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
}

async function rejectAccessRequest(req, res) {
    try {
        const { requestId } = req.params;
        const { reason } = req.body;

        const request = rejectRequest(
            requestId,
            req.user.userId,
            reason
        );

        return res.status(200).json({
            success: true,
            message: 'Access request rejected',
            request
        });

    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
}

async function auditorApproveAccessRequest(req, res) {
    try {
        const { requestId } = req.params;

        const request = auditorApproveRequest(
            requestId,
            req.user.userId
        );

        return res.status(200).json({
            success: true,
            message: 'Access request approved by Auditor',
            request
        });

    } catch (error) {
        console.error('Auditor approval error:', error);

        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
}

module.exports = {
    requestAccess,
    listAccessRequests,
    getAccessRequest,
    approveAccessRequest,
    rejectAccessRequest,
    auditorApproveAccessRequest
};
