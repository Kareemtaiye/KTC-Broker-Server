const jwt = require('jsonwebtoken');
const User = require('../models/User');
const catchAsync = require('../utilities/catchAync');
const AppError = require('../utilities/AppError');
const Email = require('../utilities/email');
const crypto = require('crypto');

const { JWT_SECRET_KEY, JWT_EXPIRES_IN, COOKIE_EXPIRES_IN, NODE_ENV } =
  process.env;

const generateToken = (user, status, res, message = undefined) => {
  const token = jwt.sign({ id: user._id }, JWT_SECRET_KEY, {
    expiresIn: JWT_EXPIRES_IN,
  });

  const cookieOptions = {
    expires: new Date(Date.now() + COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
    httpOnly: true,
  };

  if (NODE_ENV === 'production') {
    cookieOptions.secure = true;
  }
  //sends the jwt to the broswer cookie tab
  res.cookie('jwt', token, cookieOptions);
  //sends a response
  res.status(status).json({
    status,
    message,
    token,
    data: {
      user,
    },
  });
};

exports.signUp = catchAsync(async (req, res, next) => {
  const user = await User.create(req.body);

  //creating and sending token to emmail
  try {
    //returns the un-encoded token
    const verifyToken = user?.createVerifyEmailToken();
    const url = `${req.protocol}://${req.get('host')}/verify/${verifyToken}`;

    //sends the encoded token to theb mail
    await new Email(user, url).verifyEmail();
    await user.save({ validateBeforeSave: false });
  } catch (err) {
    console.log(err);
    return next(
      new AppError(
        'There was an erro sending the verification email, please try again later',
        500,
      ),
    );
  }
  res.status(201).json({
    status: 'success',
    message: 'User created',
    data: {
      user,
    },
  });
});

exports.verifyEmail = catchAsync(async (req, res, next) => {
  const token = req.params.token;

  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  const user = await User.findOne({
    verifyEmailToken: hashedToken,
    verifyEmailTokenExpiresIn: { $gt: Date.now() },
  });

  if (!user) {
    return next(
      new AppError(
        'Invalid or Expired Verification link, please request for another link if invalid or sign up again if verification link has expired',
        400,
      ),
    );
  }

  user.verified = true;
  user.verifyEmailToken = undefined;
  user.verifyEmailTokenExpiresIn = undefined;

  await user.save({ validateBeforeSave: false });

  generateToken(user, 200, res, 'Email verified Successfully');
});

exports.login = async (req, res, next) => {
  //getb the incoming data from the client
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError('Please provide your email and password', 400));
  }

  const user = await User.findOne({ email }).select('+password');
  console.log(user);
  //compare the incoming password with the saved password
  const checkPassword = await user?.comparePasswords(password, user.password);
  console.log(checkPassword);
  if (!user || !checkPassword) {
    return next(new AppError('Incorrect email or password'), 400);
  }

  if (!user.verified) {
    const daysRemaining = user.verifyEmailTokenExpiresIn - Date.now();
    return next(
      new AppError(
        `Account is unverified, please verify before the 10 days since creation to avoid deactivation/deletion: ${Math.round(daysRemaining / 86400000)} days remaining`,
        400,
      ),
    );
  }

  generateToken(user, 200, res);
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  const email = req.body.email;
  if (!email) {
    return next(new AppError('Please  provide an email address', 400));
  }

  const user = await User.findOne({ email });
  if (!user) {
    return next(new AppError('Failed to find the user with this email', 404));
  }
  try {
    const token = user?.createPasswordResetToken();
    const url = `${req.protocol}://${req.get('host')}/reset-password/${token}`;
    await new Email(user, url).resetPasswordMail();
    await user.save({ validateBeforeSave: false });
  } catch (err) {
    console.log('Sending error', err);
    return next(
      new AppError(
        'There was a problem sending the reset password link, please try again later',
        500,
      ),
    );
  }
  res.status(200).json({
    status: 'success',
    message: 'Link has been sent to mail',
  });
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  const { password, passwordConfirm } = req.body;
  if (!password || !passwordConfirm) {
    return next(
      new AppError('Please provide your password and confirm password', 400),
    );
  }
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  console.lo;

  const user2 = await User.findOne({
    passwordResetToken: hashedToken,
  });
  console.log(user2);
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetTokenExpiresIn: { $gt: Date.now() },
  });

  if (!user) {
    return next(new AppError('Token is Invalid or expired', 400));
  }

  //set the password in the database with the new password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetTokenExpiresIn = undefined;
  //save to update it
  await user.save({ validateBeforeSave: false });

  //generate new token to log in user
  generateToken(user, 200, res, 'Password reset successfully');
});
