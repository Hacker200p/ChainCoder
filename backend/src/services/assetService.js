'use strict';

const fabricService = require('./fabricService');

async function mintAsset(
    organization,
    assetId,
    name,
    assetType,
    owner,
    documentHash,
    documentCID
) {
    return fabricService.mintAsset(
        organization,
        assetId,
        name,
        assetType,
        owner,
        documentHash,
        documentCID
    );
}

async function getAsset(assetId, organization = 'BEL') {
    return fabricService.getAsset(assetId, organization);
}

async function transferAsset(assetId, newOwner, organization = 'BEL') {
    return fabricService.transferAsset(assetId, newOwner, organization);
}

async function updateAssetDocument(assetId, documentHash, documentCID, organization = 'BEL') {
    return fabricService.updateAssetDocument(
        assetId,
        documentHash,
        documentCID,
        organization
    );
}

async function getAssetHistory(assetId, organization = 'BEL') {
    return fabricService.getAssetHistory(assetId, organization);
}

module.exports = {
    mintAsset,
    getAsset,
    transferAsset,
    updateAssetDocument,
    getAssetHistory
};
