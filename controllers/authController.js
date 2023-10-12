const User = require('./../models/userModel');
const asyncHandler = require('./../utils/asyncHandler');
const AppError = require('./../utils/appError');
const cloudinary = require('./../utils/cloudinary');
const jwt = require('jsonwebtoken');

const { promisify } = require('util');

const signJwt = (id) => {
  return (token = jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRY_DATE,
  }));
};

exports.validate = async (req, res, next) => {
  // check if there is an authorization field in the header
  const authorization = req.headers.authorization;

  if (!authorization)
    return next(
      new AppError(
        'Please signin and provide an access token to access this resource'
      )
    );
  // get token from the authorization field
  const token = authorization.split(' ')[1];

  if (!token)
    return next(
      new AppError('Please provide an log in and provide an access token')
    );
  // verify that the token has not been tampered with
  const payload = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  if (!payload)
    return next(
      new AppError('This token is either invalid or has expired', 400)
    );

  // get the user whose id is in the token payload
  const user = await User.findOne({ _id: payload.id }).select('+lastChangedPassword');

  if (!user) return next(new AppError('This user does not exist', 400));
  // ensure that the user has not changed his password after the jwt has been issued

  const changedPasswordAfterJwtIAT = user.changedPasswordAfterJwtIAT(
    payload.iat
  );

  req.user = user;
  next();
};

exports.updateProfile = async (req, res, next) => {
const user = await User.findOne({ _id: req.user._id }).select('+password');
  // let user = req.user;
  let previousPublicId;
  if (user.profilePicture != 'default.png') {
    previousPublicId = user.profilePicture
      .split('/')
      .slice(-1)[0]
      .split('.')[0];
  }

  // if (req.file) {
  //   user = await User.findByIdAndUpdate(
  //     { _id: req.user._id },
  //     { name: req.body.name, profilePicture: req.file.filename },
  //     { new: true }
  //   );

  //   if (previousPublicId)
  //     await cloudinary.uploader.destroy(previousPublicId).then((result) => {});
  // } else {
  //   user = await User.findByIdAndUpdate(
  //     { _id: req.user._id },
  //     { name: req.body.name },
  //     { new: true }
  //   );
  // }

  // res.status(200).json({
  //   status: 'success',
  //   newUser: user,
  // });

  /////////////////////////////////////////////////////////////
  // Get update fields from the request body
  const {
    firstName,
    lastName,
    email,
    gender,
    school,
    phoneNumber,
    currentPassword,
    newPassword,
    newConfirmPassword,
  } = req.body;

  // TODO -- Refactor this into it's own function


  if (currentPassword) {
    // Verify the current password
    const correctPassword = await req.user.checkPassword(
      currentPassword,
      user.password
    );
    if (!correctPassword)
      return next(new AppError('Your current password is incorrect', 400));

    user.firstName = firstName || user.firstName;
    user.lastName = lastName || user.lastName;
    user.email = email || user.email;
    user.gender = gender || user.gender;
    user.school = school || user.school;
    user.phoneNumber = phoneNumber || user.phoneNumber;
    user.password = newPassword;
    user.confirmPassword = newConfirmPassword;

    if (req.file) {
      user.profilePicture = req.body.profilePicture || user.profilePicture;

      if (previousPublicId)
        await cloudinary.uploader
          .destroy(previousPublicId)
          .then((result) => {});
    }

    await user.save();
  } else {
    user.firstName = firstName || user.firstName;
    user.lastName = lastName || user.lastName;
    user.email = email || user.email;
    user.gender = gender || user.gender;
    user.school = school || user.school;
    user.phoneNumber = phoneNumber || user.phoneNumber;

    if (req.file)
      user.profilePicture = req.file.filename || user.profilePicture;

    await user.save();
  }

  res.status(200).json({
    status: 'success',
    message: 'user profile updated successfully',
    user,
  });

  ////////////////////////////////////////////////////////////////////
};

exports.signUp = asyncHandler(async (req, res, next) => {
  const {
    firstName,
    lastName,
    email,
    gender,
    school,
    phoneNumber,
    password,
    confirmPassword,
  } = req.body;

  const newUser = await User.create({
    firstName,
    lastName,
    email,
    gender,
    school,
    phoneNumber,
    password,
    confirmPassword,
  });

  console.log({ newUser });

  newUser.password = undefined;
  newUser.lastChangedPassword = undefined;
  res.status(201).json({
    status: 'success',
    message: 'user created successfully',
    user: newUser,
  });
});

exports.signIn = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password)
    return next(
      new AppError('Please provide both an email and a password', 400)
    );

  const user = await User.findOne({ email }).select('+password');

  if (!user) return next(new AppError('Email or password is incorrect', 400));


  console.log({email, password, user})

  const correctPassword = await user.checkPassword(password);

  if (!correctPassword)
    return next(new AppError('Email or password is incorrect', 400));

  res.status(201).json({
    status: 'success',
    token: signJwt(user._id),
  });
});
