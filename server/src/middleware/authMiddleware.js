const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Organization = require('../models/Organization');
const OrganizationMember = require('../models/OrganizationMember');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'vedanco_super_secret_jwt_key_2026_prod_grade_token'
      );

      const user = await User.findById(decoded.id).select('-password');
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Not authorized, user not found',
        });
      }

      if (!user.isActive) {
        return res.status(403).json({
          success: false,
          message: 'Account is deactivated. Please contact support.',
        });
      }

      req.user = user;
      req.organizationId = user.organizationId;

      // Tenant switching is allowed only for the authenticated user's own organization
      // or an active organization membership.
      if (req.headers['x-organization-id']) {
        const requestedOrganizationId = req.headers['x-organization-id'];
        if (String(requestedOrganizationId) !== String(user.organizationId)) {
          const membership = await OrganizationMember.findOne({
            organizationId: requestedOrganizationId,
            userId: user._id,
            status: 'active',
          }).select('_id');
          if (!membership) {
            return res.status(403).json({
              success: false,
              message: 'You do not have access to this organization',
            });
          }
        }
        req.organizationId = requestedOrganizationId;
      }

      next();
    } catch (error) {
      console.error('[AuthMiddleware] Token verification failed:', error.message);
      return res.status(401).json({
        success: false,
        message: 'Not authorized, token failed or expired',
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, no token provided',
    });
  }
};

module.exports = { protect };
