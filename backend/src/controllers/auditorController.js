'use strict';

const { getIdentity } = require('../services/fabricService');

async function fetchAuditorIdentity(req, res) {
    try {
        const { identityId } = req.params;

        if (!identityId) {
            return res.status(400).json({
                success: false,
                message: 'identityId is required'
            });
        }

        const identity = await getIdentity(identityId);

        return res.status(200).json({
            success: true,
            identity
        });

    } catch (error) {
        console.error('Auditor identity lookup error:', error);

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

module.exports = {
    fetchAuditorIdentity
};