'use strict';

const express = require('express');

const {
    createAccess,
    checkExistingAccess,
    revokeExistingAccess
} = require('../controllers/accessController');

const {
    requestAccess,
    listAccessRequests,
    getAccessRequest,
    approveAccessRequest,
    rejectAccessRequest,
    auditorApproveAccessRequest
} = require('../controllers/accessRequestController');

const {
    authenticate,
    authorize,
    authorizeOrganization
} = require('../middleware/authMiddleware');

const router = express.Router();

// Contractor users can request access to assets.
router.post(
    '/request',
    authenticate,
    authorizeOrganization('Contractor', 'Admin', 'User'),
    requestAccess
);

// BEL Admin/Manager users can view the approval queue.
router.get(
    '/requests',
    authenticate,
    authorizeOrganization('BEL', 'Admin', 'Manager'),
    listAccessRequests
);

// Authenticated users can view a specific request.
router.get(
    '/requests/:requestId',
    authenticate,
    getAccessRequest
);

// BEL Admin/Manager users can approve or reject requests.
router.post(
    '/requests/:requestId/approve',
    authenticate,
    authorizeOrganization('BEL', 'Admin', 'Manager'),
    approveAccessRequest
);

router.post(
    '/requests/:requestId/reject',
    authenticate,
    authorizeOrganization('BEL', 'Admin', 'Manager'),
    rejectAccessRequest
);

// Auditor users can co-sign BEL-approved requests.
router.post(
    '/requests/:requestId/auditor-approve',
    authenticate,
    authorizeOrganization('Auditor', 'Auditor'),
    auditorApproveAccessRequest
);

// Grant access
router.post(
    '/',
    authenticate,
    authorizeOrganization('BEL', 'Admin', 'Manager'),
    createAccess
);

// Check access
router.get(
    '/:identityId/:assetId',
    authenticate,
    checkExistingAccess
);

// Revoke access
router.patch(
    '/:identityId/:assetId/revoke',
    authenticate,
    authorize('Admin', 'Manager'),
    revokeExistingAccess
);

module.exports = router;