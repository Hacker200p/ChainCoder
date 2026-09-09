'use strict';

const crypto = require('crypto');
const { AppError } = require('../utils/errors');

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
        throw new AppError(
            'requesterId, organization, identityId, assetId and permission are required',
            400,
            'BAD_REQUEST'
        );
    }

    if (organization !== 'Contractor') {
        throw new AppError(
            'Only Contractor users can create access requests',
            403,
            'FORBIDDEN'
        );
    }

    const allowedPermissions = ['READ', 'WRITE'];

    if (!allowedPermissions.includes(permission)) {
        throw new AppError(
            'Invalid permission. Use READ or WRITE',
            400,
            'BAD_REQUEST'
        );
    }

    const existingRequest = requests.find(
        (request) =>
            request.requesterId === requesterId &&
            request.assetId === assetId &&
            request.permission === permission &&
            (request.status === 'PENDING' || request.status === 'BEL_APPROVED')
    );

    if (existingRequest) {
        throw new AppError(
            'A pending request already exists for this asset',
            409,
            'CONFLICT'
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

function getRequests(filters = {}) {
    return requests.filter((request) => {
        if (filters.status && request.status !== filters.status) {
            return false;
        }

        if (filters.requesterId && request.requesterId !== filters.requesterId) {
            return false;
        }

        return true;
    });
}

function getPendingRequests() {
    return getRequests({ status: 'PENDING' });
}

function getRequestById(requestId) {
    return requests.find(
        (request) => request.requestId === requestId
    );
}

function assertNotSelfAction(request, actorId, action) {
    if (request.requesterId === actorId) {
        throw new AppError(
            `You cannot ${action} your own access request`,
            403,
            'FORBIDDEN'
        );
    }
}

function approveRequest(requestId, approvedBy) {
    const request = requests.find(
        (item) => item.requestId === requestId
    );

    if (!request) {
        throw new AppError('Access request not found', 404, 'NOT_FOUND');
    }

    assertNotSelfAction(request, approvedBy, 'approve');

    if (request.status !== 'PENDING') {
        throw new AppError(
            `Request cannot be approved because its status is ${request.status}`,
            409,
            'CONFLICT'
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
        (item) => item.requestId === requestId
    );

    if (!request) {
        throw new AppError('Access request not found', 404, 'NOT_FOUND');
    }

    assertNotSelfAction(request, rejectedBy, 'reject');

    if (request.status !== 'PENDING') {
        throw new AppError(
            `Request cannot be rejected because its status is ${request.status}`,
            409,
            'CONFLICT'
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
        (item) => item.requestId === requestId
    );

    if (!request) {
        throw new AppError('Access request not found', 404, 'NOT_FOUND');
    }

    assertNotSelfAction(request, auditorId, 'approve');

    if (request.status !== 'BEL_APPROVED') {
        throw new AppError(
            `Request must be BEL_APPROVED before Auditor approval. Current status: ${request.status}`,
            409,
            'CONFLICT'
        );
    }

    request.status = 'ACTIVE';
    request.auditorApprovedBy = auditorId;
    request.auditorApprovedAt = new Date().toISOString();
    request.updatedAt = new Date().toISOString();

    return request;
}

function getRequestsByRequester(requesterId) {
    if (!requesterId) {
        return [];
    }

    return requests.filter(
        (request) => request.requesterId === requesterId
    );
}

module.exports = {
    createAccessRequest,
    getRequests,
    getPendingRequests,
    getRequestById,
    getRequestsByRequester,
    approveRequest,
    rejectRequest,
    auditorApproveRequest
};
