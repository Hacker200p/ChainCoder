'use strict';

const express = require('express');

const {
    fetchAuditorIdentity,
    listAuditIdentities,
    listAuditAccess,
    listAuditAssets,
    listAuditAccessRequests,
    listAuditTransactions,
    exportAuditLog,
    fetchAuditorAssetHistory
} = require('../controllers/auditorController');

const {
    authenticate,
    authorizeOrganization
} = require('../middleware/authMiddleware');

const router = express.Router();

router.get(
    '/identities/:identityId',
    authenticate,
    authorizeOrganization('Auditor', 'Auditor'),
    fetchAuditorIdentity
);

router.get(
    '/identities',
    authenticate,
    authorizeOrganization('Auditor', 'Auditor'),
    listAuditIdentities
);

router.get(
    '/access',
    authenticate,
    authorizeOrganization('Auditor', 'Auditor'),
    listAuditAccess
);

router.get(
    '/assets/:assetId/history',
    authenticate,
    authorizeOrganization('Auditor', 'Auditor'),
    fetchAuditorAssetHistory
);

router.get(
    '/assets',
    authenticate,
    authorizeOrganization('Auditor', 'Auditor'),
    listAuditAssets
);

router.get(
    '/access-requests',
    authenticate,
    authorizeOrganization('Auditor', 'Auditor'),
    listAuditAccessRequests
);

router.get(
    '/transactions',
    authenticate,
    authorizeOrganization('Auditor', 'Auditor'),
    listAuditTransactions
);

router.get(
    '/export',
    authenticate,
    authorizeOrganization('Auditor', 'Auditor'),
    exportAuditLog
);

module.exports = router;
