'use strict';

const express = require('express');

const {
    createAccess,
    checkExistingAccess,
    revokeExistingAccess,
    listAccessHistory
} = require('../controllers/accessController');

const {
    requestAccess,
    listAccessRequests,
    listPendingAccessRequests,
    listMyAccessRequests,
    getAccessRequest,
    approveAccessRequest,
    rejectAccessRequest,
    auditorApproveAccessRequest
} = require('../controllers/accessRequestController');

const {
    authenticate,
    authorizeOrganization
} = require('../middleware/authMiddleware');

const router = express.Router();

router.post(
    '/request',
    authenticate,
    authorizeOrganization('Contractor', 'Admin', 'User'),
    requestAccess
);

router.post(
    '/requests',
    authenticate,
    authorizeOrganization('Contractor', 'Admin', 'User'),
    requestAccess
);

router.get(
    '/requests/my',
    authenticate,
    authorizeOrganization('Contractor', 'Admin', 'User'),
    listMyAccessRequests
);

router.get(
    '/requests/pending',
    authenticate,
    authorizeOrganization('BEL', 'Admin', 'Manager'),
    listPendingAccessRequests
);

router.get(
    '/requests',
    authenticate,
    authorizeOrganization('BEL', 'Admin', 'Manager'),
    listAccessRequests
);

router.get(
    '/requests/:requestId',
    authenticate,
    getAccessRequest
);

router.post(
    '/requests/:requestId/approve',
    authenticate,
    authorizeOrganization('BEL', 'Admin', 'Manager'),
    approveAccessRequest
);

router.patch(
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

router.patch(
    '/requests/:requestId/reject',
    authenticate,
    authorizeOrganization('BEL', 'Admin', 'Manager'),
    rejectAccessRequest
);

router.post(
    '/requests/:requestId/auditor-approve',
    authenticate,
    authorizeOrganization('Auditor', 'Auditor'),
    auditorApproveAccessRequest
);

router.get(
    '/history',
    authenticate,
    authorizeOrganization('BEL', 'Admin', 'Manager'),
    listAccessHistory
);

router.post(
    '/',
    authenticate,
    authorizeOrganization('BEL', 'Admin', 'Manager'),
    createAccess
);

router.get(
    '/:identityId/:assetId',
    authenticate,
    checkExistingAccess
);

router.patch(
    '/:identityId/:assetId/revoke',
    authenticate,
    authorizeOrganization('BEL', 'Admin', 'Manager'),
    revokeExistingAccess
);

module.exports = router;
