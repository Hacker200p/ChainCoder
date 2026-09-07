'use strict';

const express = require('express');

const {
    fetchAuditorIdentity
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

module.exports = router;