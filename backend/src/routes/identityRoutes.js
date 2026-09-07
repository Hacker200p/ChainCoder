'use strict';

const express = require('express');

const {
    createIdentity,
    fetchIdentity,
    revokeExistingIdentity
} = require('../controllers/identityController');

const {
    authenticate,
    authorize
} = require('../middleware/authMiddleware');

const router = express.Router();

router.post(
    '/',
    authenticate,
    authorize('Admin', 'Manager'),
    createIdentity
);

router.get(
    '/:identityId',
    authenticate,
    fetchIdentity
);

router.patch(
    '/:identityId/revoke',
    authenticate,
    authorize('Admin', 'Manager'),
    revokeExistingIdentity
);

module.exports = router;