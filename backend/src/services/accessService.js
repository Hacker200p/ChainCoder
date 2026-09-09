'use strict';

const fabricService = require('./fabricService');

async function grantAccess(
    accessId,
    identityId,
    assetId,
    grantedTo,
    permission,
    organization = 'BEL'
) {
    return fabricService.grantAccess(
        organization,
        accessId,
        identityId,
        assetId,
        grantedTo,
        permission
    );
}

async function checkAccess(identityId, assetId, organization = 'BEL') {
    return fabricService.checkAccess(identityId, assetId, organization);
}

async function revokeAccess(identityId, assetId, organization = 'BEL') {
    return fabricService.revokeAccess(identityId, assetId, organization);
}

module.exports = {
    grantAccess,
    checkAccess,
    revokeAccess
};
