'use strict';

const express = require('express');

const {
    createAsset,
    fetchAsset,
    transferExistingAsset
} = require('../controllers/assetController');

const {
    authenticate,
    authorizeOrganization
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

// BEL Admin/Manager can transfer assets
router.patch(
    '/:assetId/transfer',
    authenticate,
    authorizeOrganization('BEL', 'Admin', 'Manager'),
    transferExistingAsset
);

module.exports = router;