'use strict';

const {
    mintAsset,
    getAsset,
    transferAsset
} = require('../services/assetService');


async function createAsset(req, res) {
    try {
        const {
            assetId,
            name,
            assetType,
            owner,
            documentHash,
            documentCID
        } = req.body;

        if (
            !assetId ||
            !name ||
            !assetType ||
            !owner ||
            !documentHash ||
            !documentCID
        ) {
            return res.status(400).json({
                success: false,
                message: 'assetId, name, assetType, owner, documentHash and documentCID are required'
            });
        }

        const asset = await mintAsset(
            assetId,
            name,
            assetType,
            owner,
            documentHash,
            documentCID
        );

        res.status(201).json({
            success: true,
            message: 'Asset minted successfully',
            asset
        });

    } catch (error) {
        console.error('Create asset error:', error);
        console.error('Fabric details:', error.details);
        console.error('Fabric cause:', error.cause);
    
        res.status(500).json({
            success: false,
            message: error.message,
            details: error.details || null,
            cause: error.cause ? error.cause.message : null
        });
    
    }
}


async function fetchAsset(req, res) {
    try {
        const { assetId } = req.params;

        if (!assetId) {
            return res.status(400).json({
                success: false,
                message: 'assetId is required'
            });
        }

        const asset = await getAsset(assetId);

        res.json({
            success: true,
            asset
        });

    } catch (error) {
        console.error('Get asset error:', error);

        if (error.details) {
            console.error('Fabric details:', error.details);
        }

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
}


async function transferExistingAsset(req, res) {
    try {
        const { assetId } = req.params;
        const { newOwner } = req.body;

        if (!assetId) {
            return res.status(400).json({
                success: false,
                message: 'assetId is required'
            });
        }

        if (!newOwner) {
            return res.status(400).json({
                success: false,
                message: 'newOwner is required'
            });
        }

        const asset = await transferAsset(
            assetId,
            newOwner,
            req.user.organization
        );

        res.json({
            success: true,
            message: 'Asset transferred successfully',
            asset
        });

    } catch (error) {
        console.error('Transfer asset error:', error);

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
}


module.exports = {
    createAsset,
    fetchAsset,
    transferExistingAsset
};