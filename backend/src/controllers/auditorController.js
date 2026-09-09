'use strict';

const { getIdentity } = require('../services/fabricService');
const { getAsset, getAssetHistory } = require('../services/assetService');
const { checkAccess } = require('../services/accessService');
const { getRequests } = require('../services/accessRequestService');
const {
    getAuditLogs,
    getKnownIdentityIds,
    getKnownAssetIds,
    getKnownAccessKeys,
    toCsv
} = require('../services/auditLogService');
const { handleControllerError, sendSuccess } = require('../utils/errors');

function stripSensitive(record) {
    if (!record || typeof record !== 'object') {
        return record;
    }

    const clone = { ...record };
    delete clone.password;
    delete clone.passwordHash;
    delete clone.privateKey;
    delete clone.token;
    delete clone.kyc;
    return clone;
}

async function fetchAuditorIdentity(req, res) {
    try {
        const { identityId } = req.params;

        if (!identityId) {
            return res.status(400).json({
                success: false,
                message: 'identityId is required',
                errorCode: 'BAD_REQUEST'
            });
        }

        const identity = await getIdentity(identityId);
        return sendSuccess(res, { identity: stripSensitive(identity) });
    } catch (error) {
        console.error('Auditor identity lookup error:', error);
        return handleControllerError(res, error, 'Unable to fetch identity');
    }
}

async function listAuditIdentities(req, res) {
    try {
        const ids = getKnownIdentityIds();
        const identities = [];

        for (const identityId of ids) {
            try {
                identities.push(stripSensitive(await getIdentity(identityId)));
            } catch (error) {
                identities.push({
                    identityId,
                    error: 'Unable to load from Fabric'
                });
            }
        }

        return sendSuccess(res, {
            identities,
            events: getAuditLogs({ resourceType: 'identity' })
        });
    } catch (error) {
        return handleControllerError(res, error, 'Unable to list identities');
    }
}

async function listAuditAccess(req, res) {
    try {
        const keys = getKnownAccessKeys();
        const access = [];

        for (const item of keys) {
            try {
                access.push(await checkAccess(item.identityId, item.assetId));
            } catch (error) {
                access.push({
                    identityId: item.identityId,
                    assetId: item.assetId,
                    error: 'Unable to load from Fabric'
                });
            }
        }

        return sendSuccess(res, {
            access,
            events: getAuditLogs({ resourceType: 'access' })
        });
    } catch (error) {
        return handleControllerError(res, error, 'Unable to list access records');
    }
}

async function listAuditAssets(req, res) {
    try {
        const ids = getKnownAssetIds();
        const assets = [];

        for (const assetId of ids) {
            try {
                const asset = await getAsset(assetId, 'BEL');
                assets.push({
                    assetId: asset.assetId,
                    name: asset.name,
                    assetType: asset.assetType,
                    status: asset.status,
                    owner: asset.owner,
                    documentHash: asset.documentHash,
                    documentCID: asset.documentCID,
                    createdAt: asset.createdAt,
                    updatedAt: asset.updatedAt
                });
            } catch (error) {
                assets.push({
                    assetId,
                    error: 'Unable to load from Fabric'
                });
            }
        }

        return sendSuccess(res, {
            assets,
            events: getAuditLogs({ resourceType: 'asset' })
        });
    } catch (error) {
        return handleControllerError(res, error, 'Unable to list assets');
    }
}

async function listAuditAccessRequests(req, res) {
    try {
        const requests = getRequests();
        return sendSuccess(res, {
            requests,
            events: getAuditLogs({ resourceType: 'accessRequest' })
        });
    } catch (error) {
        return handleControllerError(res, error, 'Unable to list access requests');
    }
}

async function listAuditTransactions(req, res) {
    try {
        return sendSuccess(res, {
            transactions: getAuditLogs()
        });
    } catch (error) {
        return handleControllerError(res, error, 'Unable to list transactions');
    }
}

async function exportAuditLog(req, res) {
    try {
        const logs = getAuditLogs();
        const csv = toCsv(logs);

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="chaincoder-audit.csv"');
        return res.status(200).send(csv);
    } catch (error) {
        return handleControllerError(res, error, 'Unable to export audit log');
    }
}

async function fetchAuditorAssetHistory(req, res) {
    try {
        const { assetId } = req.params;
        const history = await getAssetHistory(assetId, 'BEL');
        return sendSuccess(res, { assetId, history });
    } catch (error) {
        return handleControllerError(res, error, 'Unable to fetch asset history');
    }
}

module.exports = {
    fetchAuditorIdentity,
    listAuditIdentities,
    listAuditAccess,
    listAuditAssets,
    listAuditAccessRequests,
    listAuditTransactions,
    exportAuditLog,
    fetchAuditorAssetHistory
};
