'use strict';

const { connectToFabric } = require('../config/fabric');

async function mintAsset(
    assetId,
    name,
    assetType,
    owner,
    documentHash,
    documentCID
) {
    let connection;

    try {
        connection = connectToFabric();

        const result = await connection.contract.submitTransaction(
            'MintAsset',
            assetId,
            name,
            assetType,
            owner,
            documentHash,
            documentCID
        );

        const rawResult = Buffer.from(result).toString('utf8');

        console.log('MintAsset result:', rawResult);

        return JSON.parse(rawResult);

    } finally {
        if (connection) {
            connection.gateway.close();
            connection.client.close();
        }
    }
}

async function getAsset(assetId) {
    let connection;

    try {
        connection = connectToFabric();

        const result = await connection.contract.evaluateTransaction(
            'GetAsset',
            assetId
        );

        const rawResult = Buffer.from(result).toString('utf8');

        console.log('GetAsset result:', rawResult);

        return JSON.parse(rawResult);

    } finally {
        if (connection) {
            connection.gateway.close();
            connection.client.close();
        }
    }
}

async function transferAsset(assetId, newOwner) {
    let connection;

    try {
        connection = connectToFabric();

        const result = await connection.contract.submitTransaction(
            'TransferAsset',
            assetId,
            newOwner
        );

        const rawResult = Buffer.from(result).toString('utf8');

        console.log('TransferAsset result:', rawResult);

        return JSON.parse(rawResult);

    } finally {
        if (connection) {
            connection.gateway.close();
            connection.client.close();
        }
    }
}

module.exports = {
    mintAsset,
    getAsset,
    transferAsset
};