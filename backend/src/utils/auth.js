'use strict';

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
    console.warn('JWT_SECRET is not set. Set it in .env before production use.');
}

function generateToken(user) {
    return jwt.sign(
        {
            userId: user.userId,
            name: user.name,
            organization: user.organization,
            role: user.role
        },
        JWT_SECRET || 'chaincoder-development-secret',
        {
            expiresIn: '2h'
        }
    );
}

function verifyToken(token) {
    try {
        return jwt.verify(token, JWT_SECRET || 'chaincoder-development-secret');
    } catch (error) {
        console.error('JWT verification error:', error);
        throw new Error('Invalid or expired token');
    }
}
    


module.exports = {
    generateToken,
    verifyToken
};