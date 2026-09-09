'use strict';

require('dotenv').config();

const { connectToFabric } = require('./src/config/fabric');

const organizations = ['BEL', 'Auditor', 'Contractor'];

async function testGateway(organization) {
    let connection;

    try {
        console.log(`\n=== ${organization} Gateway ===`);

        connection = connectToFabric(organization);

        console.log('Gateway connection created.');

        const result = await connection.contract.evaluateTransaction(
            'GetAsset',
            'ASSET100'
        );

        console.log('SUCCESS: GetAsset completed.');
        console.log(result.toString());

        return true;
    } catch (error) {
        console.error(`FAILED: ${organization} Gateway`);
        console.error(error.message);
        return false;
    } finally {
        if (connection) {
            connection.gateway.close();
            connection.client.close();
        }
    }
}

async function main() {
    const results = {};

    for (const organization of organizations) {
        results[organization] = await testGateway(organization);
    }

    console.log('\n=== SUMMARY ===');

    for (const [organization, success] of Object.entries(results)) {
        console.log(
            `${organization}: ${success ? 'PASS ✅' : 'FAIL ❌'}`
        );
    }

    if (Object.values(results).some(success => !success)) {
        process.exitCode = 1;
    }
}

main();
