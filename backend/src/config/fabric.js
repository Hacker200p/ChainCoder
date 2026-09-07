'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const grpc = require('@grpc/grpc-js');
const { connect, signers } = require('@hyperledger/fabric-gateway');

const CHANNEL_NAME = process.env.FABRIC_CHANNEL || 'sihchannel';
const CHAINCODE_NAME = process.env.FABRIC_CHAINCODE || 'sih-contract';

const MSP_ID = process.env.BEL_MSP_ID || 'BELMSP';

const PEER_ENDPOINT =
    process.env.BEL_PEER_ENDPOINT ||
    'peer0.bel.sih26125.local:7051';

const MSP_PATH = path.resolve(
    process.env.BEL_MSP_PATH || './fabric/bel/msp'
);

const TLS_CA_PATH = path.resolve(
    process.env.BEL_TLS_CA_PATH || './fabric/bel/tls-ca.pem'
);

function createGrpcClient() {
    const tlsRootCert = fs.readFileSync(TLS_CA_PATH);

    const credentials = grpc.credentials.createSsl(tlsRootCert);

    return new grpc.Client(
        PEER_ENDPOINT,
        credentials,
        {
            'grpc.ssl_target_name_override': 'peer0.bel.sih26125.local'
        }
    );
}

function createIdentity() {
    const certificatePath = path.join(
        MSP_PATH,
        'signcerts',
        'cert.pem'
    );

    const certificate = fs.readFileSync(certificatePath);

    return {
        mspId: MSP_ID,
        credentials: certificate
    };
}

function createSigner() {
    const keystorePath = path.join(
        MSP_PATH,
        'keystore'
    );

    const files = fs.readdirSync(keystorePath);

    const keyFile = files.find(
        file => file.endsWith('_sk')
    );

    if (!keyFile) {
        throw new Error('BEL private key not found');
    }

    const privateKeyPem = fs.readFileSync(
        path.join(keystorePath, keyFile)
    );

    const privateKey = crypto.createPrivateKey(
        privateKeyPem
    );

    return signers.newPrivateKeySigner(privateKey);
}

function connectToFabric() {
    const client = createGrpcClient();

    const gateway = connect({
        client,
        identity: createIdentity(),
        signer: createSigner()
    });

    const network = gateway.getNetwork(CHANNEL_NAME);

    const contract = network.getContract(CHAINCODE_NAME);

    return {
        client,
        gateway,
        network,
        contract
    };
}

module.exports = {
    connectToFabric
};