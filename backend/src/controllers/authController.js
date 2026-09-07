'use strict';

const { login } = require('../services/authService');

async function loginUser(req, res) {
    try {
        const { userId, password } = req.body;

        if (!userId || !password) {
            return res.status(400).json({
                success: false,
                message: 'userId and password are required'
            });
        }

        const result = await login(userId, password);

        res.json({
            success: true,
            message: 'Login successful',
            ...result
        });

    } catch (error) {
        console.error('Login error:', error);

        res.status(401).json({
            success: false,
            message: error.message
        });
    }
}

module.exports = {
    loginUser
};