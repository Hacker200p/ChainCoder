'use strict';

require('dotenv').config();

const { connectToFabric } = require('./src/config/fabric');

async function main() {
    let connection;

    try {
        console.log('Connecting to Contractor Gateway...');

        connection = connectToFabric('Contractor');

        console.log('Gateway connection created.');
        console.log('Submitting test read transaction...');

        const result = await connection.contract.evaluateTransaction(
            'GetAsset',
            'ASSET300'
        );

        console.log('SUCCESS: Contractor Gateway can communicate with Fabric.');
        console.log('Asset result:');
        console.log(Buffer.from(result).toString('utf8'));

    } catch (error) {
        console.error('CONTRACTOR GATEWAY TEST FAILED');
        console.error(error);
        process.exitCode = 1;

    } finally {
        if (connection) {
            connection.gateway.close();
            connection.client.close();
        }
    }
}

main();
