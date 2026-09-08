'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const grpc = require('@grpc/grpc-js');
const { connect, signers } = require('@hyperledger/fabric-gateway');

const CHANNEL_NAME = process.env.FABRIC_CHANNEL || 'sihchannel';
const CHAINCODE_NAME = process.env.FABRIC_CHAINCODE || 'sih-contract';

const profiles = {
    BEL: {
        mspId: process.env.BEL_MSP_ID || 'BELMSP',
        peerEndpoint: process.env.BEL_PEER_ENDPOINT || 'peer0.bel.sih26125.local:7051',
        serverName: process.env.BEL_TLS_SERVER_NAME || 'peer0.bel.sih26125.local',
        mspPath: process.env.BEL_MSP_PATH || './fabric/bel/msp',
        tlsCaPath: process.env.BEL_TLS_CA_PATH || './fabric/bel/tls-ca.pem'
    },
    Contractor: {
        mspId: process.env.CONTRACTOR_MSP_ID || 'ContractorMSP',
        peerEndpoint: process.env.CONTRACTOR_PEER_ENDPOINT || 'localhost:9051',
        serverName: process.env.CONTRACTOR_TLS_SERVER_NAME || 'peer0.contractor.sih26125.local',
        mspPath: process.env.CONTRACTOR_MSP_PATH || '../blockchain/sih-network/organizations/peerOrganizations/contractor.sih26125.local/users/contractoradmin/msp',
        tlsCaPath: process.env.CONTRACTOR_TLS_CA_PATH || '../blockchain/sih-network/organizations/peerOrganizations/contractor.sih26125.local/peers/peer0.contractor.sih26125.local/tls/tlscacerts/tls-localhost-9054.pem'
    }
};

function getProfile(organization = 'BEL') {
    const profile = profiles[organization];

    if (!profile) {
        throw new Error(`Unsupported Fabric organization: ${organization}`);
    }

    return {
        ...profile,
        mspPath: path.resolve(profile.mspPath),
        tlsCaPath: path.resolve(profile.tlsCaPath)
    };
}

function createGrpcClient(profile) {
    const tlsRootCert = fs.readFileSync(profile.tlsCaPath);

    const credentials = grpc.credentials.createSsl(tlsRootCert);

    return new grpc.Client(
        profile.peerEndpoint,
        credentials,
        {
            'grpc.ssl_target_name_override': profile.serverName
        }
    );
}

function createIdentity(profile) {
    const certificatePath = path.join(
        profile.mspPath,
        'signcerts',
        'cert.pem'
    );

    const certificate = fs.readFileSync(certificatePath);

    return {
        mspId: profile.mspId,
        credentials: certificate
    };
}

function createSigner(profile) {
    const keystorePath = path.join(
        profile.mspPath,
        'keystore'
    );

    const files = fs.readdirSync(keystorePath);

    const keyFile = files.find(
        file => file.endsWith('_sk')
    );

    if (!keyFile) {
        throw new Error(`${profile.mspId} private key not found`);
    }

    const privateKeyPem = fs.readFileSync(
        path.join(keystorePath, keyFile)
    );

    const privateKey = crypto.createPrivateKey(
        privateKeyPem
    );

    return signers.newPrivateKeySigner(privateKey);
}

function connectToFabric(organization = 'BEL') {
    const profile = getProfile(organization);
    const client = createGrpcClient(profile);

    const gateway = connect({
        client,
        identity: createIdentity(profile),
        signer: createSigner(profile)
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