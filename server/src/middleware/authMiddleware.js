const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Organization = require('../models/Organization');
const OrganizationMember = require('../models/OrganizationMember');

const protect = async (req, res, next) => {
  let token;

  const authHeader = req.headers.authorization;

  // 1. Check if Authorization header exists and follows 'Bearer <token>' pattern
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1]?.trim();
  }

  // 2. Prevent 'jwt malformed' when localStorage has undefined or null string
  if (!token || token === 'undefined' || token === 'null' || token.split('.').length !== 3) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, token is missing or malformed',
    });
  }

  try {
    // 3. Verify JWT token
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

    // 4. Multi-tenant isolation: clients strictly locked to their org; agency admins can impersonate
    if (req.headers['x-organization-id']) {
      const requestedOrganizationId = req.headers['x-organization-id'];
      const isAgencyAdmin = user.role === 'admin' || user.role === 'super_admin' || user.role === 'agency_admin';

      if (isAgencyAdmin) {
        // Agency admin support impersonation permitted
        req.organizationId = requestedOrganizationId;
      } else if (String(requestedOrganizationId) !== String(user.organizationId)) {
        const membership = await OrganizationMember.findOne({
          organizationId: requestedOrganizationId,
          userId: user._id,
          status: 'active',
        }).select('_id');

        if (!membership) {
          return res.status(403).json({
            success: false,
            message: 'Cross-tenant access forbidden. You do not belong to this organization.',
          });
        }
        req.organizationId = requestedOrganizationId;
      }
    }

    next();
  } catch (error) {
    console.warn('[AuthMiddleware] Verification failed:', error.message);
    return res.status(401).json({
      success: false,
      message: error.name === 'TokenExpiredError' 
        ? 'Session expired. Please log in again.' 
        : 'Not authorized, token failed or invalid.',
    });
  }
};

module.exports = { protect };