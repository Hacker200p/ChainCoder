'use strict';

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { connectToFabric } = require('./config/fabric');

const assetRoutes = require('./routes/assetRoutes');
const identityRoutes = require('./routes/identityRoutes');
const accessRoutes = require('./routes/accessRoutes');
const authRoutes = require('./routes/authRoutes');
const auditorRoutes = require('./routes/auditorRoutes');



const app = express();


app.use(cors());
app.use(express.json());


app.use('/api/identities', identityRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/access', accessRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/auditor', auditorRoutes);

app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'ChainCoder backend is running'
    });
});

app.get('/api/blockchain/test', async (req, res) => {
    let connection;

    try {
        connection = connectToFabric();

        const result =
            await connection.contract.evaluateTransaction('test');

        const rawResult = Buffer.from(result).toString('utf8');

        console.log('RAW FABRIC RESULT:', rawResult);

        const blockchainResult =
            JSON.parse(rawResult);

        res.json({
            success: true,
            blockchain: blockchainResult
        });

    } catch (error) {
        console.error('Fabric error:', error);

        res.status(500).json({
            success: false,
            message: error.message
        });

    } finally {
        if (connection) {
            connection.gateway.close();
            connection.client.close();
        }
    }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`ChainCoder backend running on port ${PORT}`);
});