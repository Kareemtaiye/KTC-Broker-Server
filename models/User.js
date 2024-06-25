const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Please must provide your username'],
      true: true,
      minLength: [8, 'Username must be atleast 8 characters'],
      maxLength: [25, 'Username must not be more than 25 characters'],
    },
    email: {
      type: String,
      unique: true,
      required: [true, 'Please provide an email'],
      lowercase: true,
      validate: [validator.isEmail, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minLength: [8, 'Password character must be atleast 8'],
      select: false,
    },
    photo: {
      type: String,
      // default
    },
    passwordConfirm: {
      type: String,
      required: [true, 'Please confirm your password'],
      validate: {
        validator: function (val) {
          return val === this.password;
        },
        message: 'Passwword and confirm password are not not the same',
      },
    },
    first_name: {
      type: String,
      require: [true, 'Please provide a firstname'],
      trim: true,
    },
    last_name: {
      type: String,
      require: [true, 'Please provide a lastname'],
      trim: true,
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    active: {
      type: Boolean,
      default: false,
    },
    verified: {
      type: Boolean,
      default: false,
    },
    role: {
      type: String,
      default: 'user',
    },
    phone_number: Number,
    country: String,
    city: String,
    zip_code: String,
    address: String,
    verifyEmailToken: String,
    verifyEmailTokenExpiresIn: Date,
    passwordResetToken: String,
    passwordResetTokenExpiresIn: Date,
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined;
});

userSchema.methods.comparePasswords = async function (
  userPassword,
  underlyingPassword,
) {
  const result = await bcrypt.compare(userPassword, underlyingPassword);
  return result;
};

userSchema.methods.createVerifyEmailToken = function () {
  const token = crypto.randomBytes(32).toString('hex');
  this.verifyEmailToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');

  this.verifyEmailTokenExpiresIn = Date.now() + 10 * 24 * 60 * 60 * 1000;
  return token;
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.passwordResetTokenExpiresIn = Date.now() + 10 * 60 * 1000;

  return resetToken;
};
const User = mongoose.model('User', userSchema);

module.exports = User;
