const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a name'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Please provide an email or username'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: function () {
        return !this.googleId && !this.passwordHash;
      },
      select: false,
    },
    passwordHash: {
      type: String,
      select: false,
    },
    googleId: {
      type: String,
      default: null,
      sparse: true,
    },
    role: {
      type: String,
      enum: ['super_admin', 'client_user', 'admin', 'client', 'user'],
      default: 'client_user',
    },
    orgId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      index: true,
    },
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      index: true,
    },
    avatar: {
      type: String,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLoginAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

// Encrypt password using bcrypt before saving and sync orgId/passwordHash
UserSchema.pre('save', async function (next) {
  if (this.orgId && !this.organizationId) {
    this.organizationId = this.orgId;
  } else if (this.organizationId && !this.orgId) {
    this.orgId = this.organizationId;
  }

  const plainPass = this.password || this.passwordHash;
  if ((this.isModified('password') || this.isModified('passwordHash')) && plainPass && !plainPass.startsWith('$2')) {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(plainPass, salt);
    this.password = hash;
    this.passwordHash = hash;
  }
  next();
});

// Compare user password
UserSchema.methods.matchPassword = async function (enteredPassword) {
  const hash = this.password || this.passwordHash;
  if (!hash) return false;
  return await bcrypt.compare(enteredPassword, hash);
};

module.exports = mongoose.model('User', UserSchema);
