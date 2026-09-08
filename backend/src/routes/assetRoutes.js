'use strict';

const express = require('express');

const {
    createAsset,
    fetchAsset,
    transferExistingAsset
} = require('../controllers/assetController');

const {
    authenticate,
    authorizeOrganization,
    authorizeOrganizationRoles
} = require('../middleware/authMiddleware');

const router = express.Router();

// BEL Admin/Manager can mint assets
router.post(
    '/',
    authenticate,
    authorizeOrganization('BEL', 'Admin', 'Manager'),
    createAsset
);

// Any authenticated user can view an asset
router.get('/:assetId', authenticate, fetchAsset);

// BEL Admin and Contractor users can transfer assets through their org gateway.
router.patch(
    '/:assetId/transfer',
    authenticate,
    authorizeOrganizationRoles(
        { organization: 'BEL', roles: ['Admin'] },
        { organization: 'Contractor', roles: ['Admin', 'User'] }
    ),
    transferExistingAsset
);

module.exports = router;