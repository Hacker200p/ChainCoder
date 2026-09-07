'use strict';

const bcrypt = require('bcryptjs');
const { generateToken } = require('../utils/auth');

// Temporary development users.
// We will move these to a database later.
const users = [
    {
        userId: 'BEL001',
        name: 'BEL Admin',
        organization: 'BEL',
        role: 'Admin',
        passwordHash: bcrypt.hashSync('BelAdmin@123', 10)
    },
    {
        userId: 'BEL002',
        name: 'BEL Manager',
        organization: 'BEL',
        role: 'Manager',
        passwordHash: bcrypt.hashSync('BelManager@123', 10)
    },
    {
        userId: 'BEL003',
        name: 'BEL Employee',
        organization: 'BEL',
        role: 'Employee',
        passwordHash: bcrypt.hashSync('BelEmployee@123', 10)
    },
    {
        userId: 'AUD001',
        name: 'Auditor',
        organization: 'Auditor',
        role: 'Auditor',
        passwordHash: bcrypt.hashSync('Auditor@123', 10)
    },
    {
        userId: 'CON001',
        name: 'Contractor Admin',
        organization: 'Contractor',
        role: 'Admin',
        passwordHash: bcrypt.hashSync('ContractorAdmin@123', 10)
    },
    {
        userId: 'CON002',
        name: 'Contractor User',
        organization: 'Contractor',
        role: 'User',
        passwordHash: bcrypt.hashSync('Contractor@123', 10)
    }
];

async function login(userId, password) {
    const user = users.find(
        item => item.userId === userId
    );

    if (!user) {
        throw new Error('Invalid user ID or password');
    }

    const passwordValid = await bcrypt.compare(
        password,
        user.passwordHash
    );

    if (!passwordValid) {
        throw new Error('Invalid user ID or password');
    }

    const token = generateToken({
        userId: user.userId,
        name: user.name,
        organization: user.organization,
        role: user.role
    });

    return {
        user: {
            userId: user.userId,
            name: user.name,
            organization: user.organization,
            role: user.role
        },
        token
    };
}

module.exports = {
    login
};