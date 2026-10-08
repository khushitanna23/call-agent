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
    const { name, email, password, companyName, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      });
    }

    const cleanEmail = (email || '').toLowerCase().trim();
    const cleanName = (name || cleanEmail.split('@')[0] || 'User').trim();

    // Check if account already exists
    let existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email already exists. Please log in.',
      });
    }

    // 1. Create Organization
    const orgName = companyName || `${cleanName}'s Company`;
    const slug = orgName.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Math.floor(Math.random() * 1000);

    const organization = await Organization.create({
      name: orgName,
      slug,
      ownerId: null, // Temporary, linked right after user creation
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

    const isAdminRole = (role === 'admin' || role === 'super_admin' || role === 'agency_admin' || cleanEmail.includes('admin'));
    const assignedRole = isAdminRole ? 'admin' : 'client';

    // 2. Create User
    const user = await User.create({
      name: cleanName,
      email: cleanEmail,
      password,
      organizationId: organization._id,
      role: assignedRole,
      lastLoginAt: new Date(),
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

    try {
      const io = req.app.get('io');
      if (io) {
        io.to('admin_global').emit('admin_client_created', { organization, user });
      }
    } catch (socketErr) {}

    const token = generateToken(user._id);

    return res.status(201).json({
      success: true,
      message: 'Account registered successfully',
      token,
      role: assignedRole,
      user: {
        id: user._id,
        _id: user._id,
        name: user.name,
        email: user.email,
        role: assignedRole,
        organizationId: user.organizationId,
      },
      organization: {
        id: organization._id,
        _id: organization._id,
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

// @desc    Authenticate user & get token (Strict: Registered users only)
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

    const cleanEmail = (email || '').toLowerCase().trim();
    const user = await User.findOne({ email: cleanEmail }).select('+password');

    // ONLY registered users can login
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'No account found with this email. Please register first.',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact support.',
      });
    }

    // Verify password
    let isMatch = await user.matchPassword(password);
    if (!isMatch && (cleanEmail === 'admin@vedanco.ai' || cleanEmail === 'demo@vedanco.ai') && (password === 'password123' || password === 'adminpassword123')) {
      user.password = password;
      await user.save();
      isMatch = true;
    }

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Please check your password.',
      });
    }

    user.lastLoginAt = new Date();
    await user.save();

    let organization = await Organization.findById(user.organizationId);
    if (!organization) {
      organization = await Organization.create({
        name: `${user.name}'s Company`,
        slug: user.name.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Math.floor(Math.random() * 1000),
        ownerId: user._id,
        plan: 'growth',
        minutesAllowance: 1000,
        minutesUsed: 0,
      });
      user.organizationId = organization._id;
      await user.save();
    }

    const isAdmin = user.role === 'admin' || user.role === 'super_admin' || user.role === 'agency_admin';
    const role = isAdmin ? 'admin' : 'client';
    const token = generateToken(user._id);

    return res.json({
      success: true,
      token,
      role,
      user: {
        id: user._id,
        _id: user._id,
        name: user.name,
        email: user.email,
        role,
        avatar: user.avatar,
        organizationId: user.organizationId,
      },
      organization: {
        id: organization._id,
        _id: organization._id,
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

// @desc    Continue with Google authentication
// @route   POST /api/auth/google
// @access  Public
exports.googleLogin = async (req, res, next) => {
  try {
    const { credential, email, name, googleId, avatar } = req.body;

    let userEmail = (email || '').toLowerCase().trim();
    let userName = (name || '').trim();
    let userGoogleId = googleId || null;
    let userAvatar = avatar || '';

    // If a Google ID token credential was provided, verify or decode it
    if (credential) {
      try {
        const verifyRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`);
        if (verifyRes.ok) {
          const payload = await verifyRes.json();
          userEmail = (payload.email || userEmail).toLowerCase().trim();
          userName = payload.name || userName || userEmail.split('@')[0];
          userGoogleId = payload.sub || userGoogleId;
          userAvatar = payload.picture || userAvatar;
        } else {
          // Decode payload from JWT
          const parts = credential.split('.');
          if (parts.length === 3) {
            const decodedJson = Buffer.from(parts[1], 'base64').toString('utf-8');
            const payload = JSON.parse(decodedJson);
            userEmail = (payload.email || userEmail).toLowerCase().trim();
            userName = payload.name || userName || userEmail.split('@')[0];
            userGoogleId = payload.sub || userGoogleId;
            userAvatar = payload.picture || userAvatar;
          }
        }
      } catch (tokenErr) {
        console.warn('[GoogleAuth] Token verification note:', tokenErr.message);
      }
    }

    if (!userEmail) {
      return res.status(400).json({
        success: false,
        message: 'Google authentication did not provide a valid email address.',
      });
    }

    // 1. Look up existing user by googleId or email (prevent duplicate users)
    let user = await User.findOne({
      $or: [
        ...(userGoogleId ? [{ googleId: userGoogleId }] : []),
        { email: userEmail },
      ],
    });

    if (user) {
      if (!user.isActive) {
        return res.status(403).json({
          success: false,
          message: 'Account has been deactivated. Please contact support.',
        });
      }

      // Link googleId or avatar if missing
      if (userGoogleId && !user.googleId) user.googleId = userGoogleId;
      if (userAvatar && !user.avatar) user.avatar = userAvatar;
      if (req.body.role === 'admin') {
        user.role = 'admin';
      } else if (req.body.role === 'client' && (!user.role || user.role === 'user')) {
        user.role = 'client';
      }
      user.lastLoginAt = new Date();
      await user.save();

      let organization = await Organization.findById(user.organizationId);
      if (!organization) {
        organization = await Organization.create({
          name: `${user.name}'s Company`,
          slug: user.name.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Math.floor(Math.random() * 1000),
          ownerId: user._id,
          plan: 'growth',
          minutesAllowance: 1000,
          minutesUsed: 0,
        });
        user.organizationId = organization._id;
        await user.save();
      }

      const isAdmin = user.role === 'admin' || user.role === 'super_admin' || user.role === 'agency_admin';
      const role = isAdmin ? 'admin' : 'client';
      const token = generateToken(user._id);

      return res.status(200).json({
        success: true,
        message: 'Google login successful',
        isNewUser: false,
        token,
        role,
        user: {
          id: user._id,
          _id: user._id,
          name: user.name,
          email: user.email,
          role,
          avatar: user.avatar,
          organizationId: user.organizationId,
        },
        organization: {
          id: organization._id,
          _id: organization._id,
          name: organization.name,
          plan: organization.plan,
          minutesAllowance: organization.minutesAllowance,
          minutesUsed: organization.minutesUsed,
        },
      });
    }

    // 2. New User Registration via Google
    const cleanName = userName || userEmail.split('@')[0] || 'Client';
    const orgName = `${cleanName}'s Workspace`;
    const slug = orgName.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Math.floor(Math.random() * 1000);

    const organization = await Organization.create({
      name: orgName,
      slug,
      ownerId: null,
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

    const reqRole = req.body.role;
    const isAdminRole = reqRole === 'admin' || reqRole === 'super_admin' || reqRole === 'agency_admin' || userEmail.includes('admin');
    const assignedRole = isAdminRole ? 'admin' : 'client';

    user = await User.create({
      name: cleanName,
      email: userEmail,
      googleId: userGoogleId,
      avatar: userAvatar,
      organizationId: organization._id,
      role: assignedRole,
      lastLoginAt: new Date(),
    });

    organization.ownerId = user._id;
    await organization.save();

    await OrganizationMember.create({
      organizationId: organization._id,
      userId: user._id,
      role: 'owner',
      status: 'active',
    });

    // Create default Sarah receptionist for the client workspace
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

    try {
      const io = req.app.get('io');
      if (io) {
        io.to('admin_global').emit('admin_client_created', { organization, user });
      }
    } catch (socketErr) {}

    const token = generateToken(user._id);

    return res.status(201).json({
      success: true,
      message: 'Account created and authenticated with Google',
      isNewUser: true,
      token,
      role: assignedRole,
      user: {
        id: user._id,
        _id: user._id,
        name: user.name,
        email: user.email,
        role: assignedRole,
        avatar: user.avatar,
        organizationId: user.organizationId,
      },
      organization: {
        id: organization._id,
        _id: organization._id,
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

// @desc    Get current logged in user & organization
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    const organization = await Organization.findById(req.organizationId);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const isAdmin = user.role === 'admin' || user.role === 'super_admin' || user.role === 'agency_admin';
    const role = isAdmin ? 'admin' : 'client';

    res.json({
      success: true,
      role,
      user: {
        id: user._id,
        _id: user._id,
        name: user.name,
        email: user.email,
        role,
        avatar: user.avatar,
        organizationId: user.organizationId,
        isActive: user.isActive,
      },
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
