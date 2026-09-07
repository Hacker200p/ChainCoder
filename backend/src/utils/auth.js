'use strict';

const jwt = require('jsonwebtoken');

const JWT_SECRET =
    process.env.JWT_SECRET || 'chaincoder-development-secret';

function generateToken(user) {
    return jwt.sign(
        {
            userId: user.userId,
            name: user.name,
            organization: user.organization,
            role: user.role
        },
        JWT_SECRET,
        {
            expiresIn: '2h'
        }
    );
}

function verifyToken(token) {
    try{
        return jwt.verify(token, JWT_SECRET);

    }catch (error) {
        console.error('JWT verification error:', error);
    
        return res.status(401).json({
            success: false,
            message: 'Invalid or expired token',
            error: error.message
        });
    }
    
}

module.exports = {
    generateToken,
    verifyToken
};