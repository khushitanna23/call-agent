const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Organization = require('../models/Organization');
const OrganizationMember = require('../models/OrganizationMember');
const Agent = require('../models/Agent');

// Helper to generate JWT token
const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET || 'vedanco_super_secret_jwt_key_2026_prod_grade_token',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// @desc    Register a new user & create initial organization
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, companyName } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, and password',
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email already exists',
      });
    }

    // 1. Create Organization
    const orgName = companyName || `${name}'s Company`;
    const slug = orgName.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Math.floor(Math.random() * 1000);

    const organization = await Organization.create({
      name: orgName,
      slug,
      ownerId: null, // Temporary, will link right after user creation
      plan: 'growth',
      minutesAllowance: 1000,
      minutesUsed: 0,
      phoneNumbers: [
        {
          number: '+1 (800) 555-' + Math.floor(1000 + Math.random() * 9000),
          label: 'Primary Inbound Line',
          provider: 'demo',
          isActive: true,
        },
      ],
    });

    // 2. Create User
    const user = await User.create({
      name,
      email,
      password,
      organizationId: organization._id,
      role: 'user',
    });

    // Link owner to Organization
    organization.ownerId = user._id;
    await organization.save();

    // 3. Create OrganizationMember
    await OrganizationMember.create({
      organizationId: organization._id,
      userId: user._id,
      role: 'owner',
      status: 'active',
    });

    // 4. Create default AI Receptionist for the user
    await Agent.create({
      organizationId: organization._id,
      name: 'Sarah',
      type: 'receptionist',
      industry: 'Technology',
      voice: {
        gender: 'Female',
        style: 'Friendly',
        voiceId: '21m00Tcm4TlvDq8ikWAM',
      },
      phoneNumber: organization.phoneNumbers[0]?.number || '+1 (800) 555-0199',
      status: 'ONLINE',
      greetingMessage: `Hello! Thank you for calling ${orgName}. My name is Sarah, your AI Receptionist. How can I assist you today?`,
    });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'Account registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        organizationId: user.organizationId,
      },
      organization: {
        id: organization._id,
        name: organization.name,
        plan: organization.plan,
        minutesAllowance: organization.minutesAllowance,
        minutesUsed: organization.minutesUsed,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    user.lastLoginAt = new Date();
    await user.save();

    const organization = await Organization.findById(user.organizationId);
    const token = generateToken(user._id);

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        organizationId: user.organizationId,
      },
      organization: organization
        ? {
            id: organization._id,
            name: organization.name,
            plan: organization.plan,
            minutesAllowance: organization.minutesAllowance,
            minutesUsed: organization.minutesUsed,
          }
        : null,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current logged in user & organization
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    const organization = await Organization.findById(req.organizationId);

    res.json({
      success: true,
      user,
      organization,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
exports.updateProfile = async (req, res, next) => {
  try {
    const { name, companyName, timezone } = req.body;
    const user = await User.findById(req.user.id);

    if (name) user.name = name;
    await user.save();

    if (companyName || timezone) {
      const org = await Organization.findById(req.organizationId);
      if (org) {
        if (companyName) org.name = companyName;
        if (timezone) org.settings.timezone = timezone;
        await org.save();
      }
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user password
// @route   PUT /api/auth/password
// @access  Private
exports.updatePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id).select('+password');

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    next(error);
  }
};
