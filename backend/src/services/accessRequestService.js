'use strict';

const crypto = require('crypto');

const requests = [];

function createAccessRequest({
    requesterId,
    requesterName,
    organization,
    identityId,
    assetId,
    permission,
    reason
}) {
    if (
        !requesterId ||
        !organization ||
        !identityId ||
        !assetId ||
        !permission
    ) {
        throw new Error(
            'requesterId, organization, identityId, assetId and permission are required'
        );
    }

    if (organization !== 'Contractor') {
        throw new Error(
            'Only Contractor users can create access requests'
        );
    }

    const allowedPermissions = ['READ', 'WRITE'];

    if (!allowedPermissions.includes(permission)) {
        throw new Error(
            'Invalid permission. Use READ or WRITE'
        );
    }

    const existingRequest = requests.find(
        request =>
            request.requesterId === requesterId &&
            request.assetId === assetId &&
            request.permission === permission &&
            request.status === 'PENDING'
    );

    if (existingRequest) {
        throw new Error(
            'A pending request already exists for this asset'
        );
    }

    const now = new Date().toISOString();
    const request = {
        requestId: `REQ-${crypto.randomUUID()}`,
        requesterId,
        requesterName: requesterName || null,
        organization,
        identityId,
        assetId,
        permission,
        reason: reason || null,
        status: 'PENDING',
        createdAt: now,
        updatedAt: now
    };

    requests.push(request);

    return request;
}

function getRequests() {
    return requests;
}

function getRequestById(requestId) {
    return requests.find(
        request => request.requestId === requestId
    );
}

function approveRequest(requestId, approvedBy) {
    const request = requests.find(
        item => item.requestId === requestId
    );

    if (!request) {
        throw new Error('Access request not found');
    }

    if (request.status !== 'PENDING') {
        throw new Error(
            `Request cannot be approved because its status is ${request.status}`
        );
    }

    request.status = 'BEL_APPROVED';
    request.approvedBy = approvedBy;
    request.approvedAt = new Date().toISOString();
    request.updatedAt = new Date().toISOString();

    return request;
}

function rejectRequest(requestId, rejectedBy, reason) {
    const request = requests.find(
        item => item.requestId === requestId
    );

    if (!request) {
        throw new Error('Access request not found');
    }

    if (request.status !== 'PENDING') {
        throw new Error(
            `Request cannot be rejected because its status is ${request.status}`
        );
    }

    request.status = 'REJECTED';
    request.rejectedBy = rejectedBy;
    request.rejectionReason = reason || null;
    request.rejectedAt = new Date().toISOString();
    request.updatedAt = new Date().toISOString();

    return request;
}

function auditorApproveRequest(requestId, auditorId) {
    const request = requests.find(
        item => item.requestId === requestId
    );

    if (!request) {
        throw new Error('Access request not found');
    }

    if (request.status !== 'BEL_APPROVED') {
        throw new Error(
            `Request must be BEL_APPROVED before Auditor approval. Current status: ${request.status}`
        );
    }

    request.status = 'APPROVED';
    request.auditorApprovedBy = auditorId;
    request.auditorApprovedAt = new Date().toISOString();
    request.updatedAt = new Date().toISOString();

    return request;
}

module.exports = {
    createAccessRequest,
    getRequests,
    getRequestById,
    approveRequest,
    rejectRequest,
    auditorApproveRequest
};
