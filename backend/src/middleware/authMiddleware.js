'use strict';

const { verifyToken } = require('../utils/auth');

function authenticate(req, res, next) {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({
                success: false,
                message: 'Authorization header is required'
            });
        }

        const parts = authHeader.split(' ');

        if (parts.length !== 2 || parts[0] !== 'Bearer') {
            return res.status(401).json({
                success: false,
                message: 'Invalid authorization format'
            });
        }

        const token = parts[1];

        const decoded = verifyToken(token);

        req.user = decoded;

        next();

    } catch (error) {
        console.error('JWT verification error:', error);

        return res.status(401).json({
            success: false,
            message: 'Invalid or expired token'
        });
    }
}

function authorize(...allowedRoles) {
    return (req, res, next) => {
        console.log('RBAC DEBUG:', {
            userId: req.user?.userId,
            role: req.user?.role,
            organization: req.user?.organization,
            allowedRoles
        });

        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to perform this action'
            });
        }

        next();
    };
}
function authorizeOrganization(organization, ...allowedRoles) {
    return (req, res, next) => {
        console.log('ORG RBAC DEBUG:', {
            userId: req.user?.userId,
            role: req.user?.role,
            organization: req.user?.organization,
            requiredOrganization: organization,
            allowedRoles
        });

        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        if (req.user.organization !== organization) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to access this organization resource'
            });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to perform this action'
            });
        }

        next();
    };
}

function authorizeOrganizationRoles(...requirements) {
    return (req, res, next) => {
        const allowed = requirements.some(
            requirement =>
                req.user?.organization === requirement.organization &&
                requirement.roles.includes(req.user.role)
        );

        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        if (!allowed) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to perform this action'
            });
        }

        next();
    };
}

module.exports = {
    authenticate,
    authorize,
    authorizeOrganization,
    authorizeOrganizationRoles
};