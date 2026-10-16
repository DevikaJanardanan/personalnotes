const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [50, 'Name must be at most 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // never returned by queries unless explicitly asked for
    },
    // Separate password for opening locked notes (bcrypt hash, optional)
    lockPassword: {
      type: String,
      select: false,
    },
  },
  { timestamps: true }
);

// Hash the password before saving (only when it was changed)
userSchema.pre('save', async function hashPassword() {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.setLockPassword = async function setLockPassword(plain) {
  this.lockPassword = await bcrypt.hash(plain, 10);
};

userSchema.methods.compareLockPassword = function compareLockPassword(candidate) {
  if (!this.lockPassword || typeof candidate !== 'string') return Promise.resolve(false);
  return bcrypt.compare(candidate, this.lockPassword);
};

// Shape of the user object sent to the client (no password, no __v)
userSchema.methods.toPublicJSON = function toPublicJSON() {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    hasLockPassword: Boolean(this.lockPassword),
    createdAt: this.createdAt,
  };
};

module.exports = mongoose.model('User', userSchema);
