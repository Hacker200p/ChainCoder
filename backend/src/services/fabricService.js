'use strict';

const { connectToFabric } = require('../config/fabric');

async function registerIdentity(identityId, name, organization, role) {
    let connection;

    try {
        connection = connectToFabric();

        const result = await connection.contract.submitTransaction(
            'RegisterIdentity',
            identityId,
            name,
            organization,
            role
        );

        const rawResult = Buffer.from(result).toString('utf8');

        console.log('RegisterIdentity result:', rawResult);

        return JSON.parse(rawResult);

    } finally {
        if (connection) {
            connection.gateway.close();
            connection.client.close();
        }
    }
}

async function getIdentity(identityId) {
    let connection;

    try {
        connection = connectToFabric();

        const result = await connection.contract.evaluateTransaction(
            'GetIdentity',
            identityId
        );

        const rawResult = Buffer.from(result).toString('utf8');

        console.log('GetIdentity result:', rawResult);

        return JSON.parse(rawResult);

    } finally {
        if (connection) {
            connection.gateway.close();
            connection.client.close();
        }
    }
}


async function revokeIdentity(identityId) {
    let connection;

    try {
        connection = connectToFabric();

        const result = await connection.contract.submitTransaction(
            'RevokeIdentity',
            identityId
        );

        const rawResult = Buffer.from(result).toString('utf8');

        console.log('RevokeIdentity result:', rawResult);

        return JSON.parse(rawResult);

    } finally {
        if (connection) {
            connection.gateway.close();
            connection.client.close();
        }
    }
}
async function grantAccess(identityId, assetId, permission) {
    let connection;

    try {
        connection = connectToFabric();

        const result = await connection.contract.submitTransaction(
            'GrantAccess',
            identityId,
            assetId,
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

module.exports = {
    registerIdentity,
    getIdentity,
    revokeIdentity,
    grantAccess
};