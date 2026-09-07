'use strict';

const { connectToFabric } = require('../config/fabric');


async function grantAccess(
    accessId,
    identityId,
    assetId,
    grantedTo,
    permission
) {
    let connection;

    try {
        connection = connectToFabric();

        const result = await connection.contract.submitTransaction(
            'GrantAccess',
            accessId,
            identityId,
            assetId,
            grantedTo,
            permission
        );

        const rawResult = Buffer.from(result).toString('utf8');

        console.log('GrantAccess result:', rawResult);

        return JSON.parse(rawResult);

    } finally {
        if (connection) {
            connection.gateway.close();
            connection.client.close();
        }
    }
}


async function checkAccess(identityId, assetId) {
    let connection;

    try {
        connection = connectToFabric();

        const result = await connection.contract.evaluateTransaction(
            'CheckAccess',
            identityId,
            assetId
        );

        const rawResult = Buffer.from(result).toString('utf8');

        console.log('CheckAccess result:', rawResult);

        return JSON.parse(rawResult);

    } finally {
        if (connection) {
            connection.gateway.close();
            connection.client.close();
        }
    }
}


async function revokeAccess(identityId, assetId) {
    let connection;

    try {
        connection = connectToFabric();

        const result = await connection.contract.submitTransaction(
            'RevokeAccess',
            identityId,
            assetId
        );

        const rawResult = Buffer.from(result).toString('utf8');

        console.log('RevokeAccess result:', rawResult);

        return JSON.parse(rawResult);

    } finally {
        if (connection) {
            connection.gateway.close();
            connection.client.close();
        }
    }
}


module.exports = {
    grantAccess,
    checkAccess,
    revokeAccess
};