'use strict';

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const { ALLOWED_MIME_TYPES } = require('../services/fileService');

const {
    createAsset,
    fetchAsset,
    transferExistingAsset,
    uploadAssetDocument,
    verifyAssetDocument,
    downloadAssetDocument,
    fetchAssetHistory
} = require('../controllers/assetController');

const {
    authenticate,
    authorizeOrganization,
    authorizeOrganizationRoles
} = require('../middleware/authMiddleware');

const router = express.Router();

const uploadDir = path.join(__dirname, '../../uploads');

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const extension = path.extname(file.originalname || '').toLowerCase();
        const safeExtension = ['.pdf', '.png', '.jpg', '.jpeg', '.txt', '.doc', '.docx'].includes(extension)
            ? extension
            : '';
        cb(null, `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${safeExtension}`);
    }
});

const upload = multer({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024
    },
    fileFilter: (req, file, cb) => {
        if (file.originalname && (file.originalname.includes('..') || file.originalname.includes('\0'))) {
            cb(new Error('Invalid file name'));
            return;
        }

        if (file.mimetype && !ALLOWED_MIME_TYPES.has(file.mimetype)) {
            cb(new Error('Unsupported file type'));
            return;
        }

        cb(null, true);
    }
});

router.post(
    '/',
    authenticate,
    authorizeOrganization('BEL', 'Admin', 'Manager'),
    createAsset
);

router.post(
    '/:assetId/upload',
    authenticate,
    authorizeOrganization('BEL', 'Admin', 'Manager'),
    (req, res, next) => {
        upload.single('document')(req, res, (error) => {
            if (!error) {
                next();
                return;
            }

            const message = error.message || 'Upload failed';
            const status = message.includes('File too large') ? 400 : 400;
            res.status(status).json({
                success: false,
                message,
                errorCode: 'BAD_REQUEST'
            });
        });
    },
    uploadAssetDocument
);

router.get(
    '/:assetId/verify',
    authenticate,
    verifyAssetDocument
);

router.get(
    '/:assetId/document',
    authenticate,
    downloadAssetDocument
);

router.get(
    '/:assetId/history',
    authenticate,
    fetchAssetHistory
);

router.get(
    '/:assetId',
    authenticate,
    fetchAsset
);

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
