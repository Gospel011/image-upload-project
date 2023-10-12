const User = require('./../models/userModel');
const asyncHandler = require('./../utils/asyncHandler');
const AppError = require('./../utils/appError');
const cloudinary = require('./../utils/cloudinary');
const jwt = require('jsonwebtoken');

const {promisify} = require('util');

// const storage = multer.diskStorage({
//     destination: function (req, file, cb) {
//         cb(null, './users/profile-photos');
//     },
//     filename: function (req, file, cb) {
//         console.log("FILE SIZE", file)
//         const customFilename = `user-${Math.round(Math.random() * 1E9)}-${Date.now()}.${file.mimetype.split('/')[1]}`
//         cb(null, customFilename)
//     }
// })

const signJwt = (id) => {
  return token = jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRY_DATE,
  });

}

exports.validate = async (req, res, next) => {
  // check if there is an authorization field in the header
  const authorization = req.headers.authorization;

  console.log('HEADERS', req.headers)

  if (!authorization)
    return next(
      new AppError(
        'Please signin and provide an access token to access this resource'
      )
    );
  // get token from the authorization field
  const token = authorization.split(' ')[1];
  console.log({token});
  if(!token) return next(new AppError('Please provide an log in and provide an access token'))
  // verify that the token has not been tampered with
  const payload = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  console.log({payload});
  if (!payload) return next(new AppError('This token is either invalid or has expired', 400));

  // get the user whose id is in the token payload
  const user = await User.findOne({_id: payload.id});
  console.log({user});

  if (!user) return next(new AppError('This user does not exist', 400));
  // ensure that the user has not changed his password after the jwt has been issued

  const changedPasswordAfterJwtIAT = user.changedPasswordAfterJwtIAT(payload.iat)

  console.log( "changedPasswordAfterJwtIAT", changedPasswordAfterJwtIAT)

  req.user = user;
  next();
};

exports.updateProfile = async (req, res, next) => {
  // console.log('USER REQUESTING PROFILE UPDATE', req);
  if (req.file) console.log('UPDATE REQUEST FILE NAME', req.file.filename);

  let user = req.user;
  let previousPublicId;
  if (user.profilePicture != 'default.png') {
    previousPublicId = user.profilePicture
      .split('/')
      .slice(-1)[0]
      .split('.')[0];
    console.log('PREVIOUS PUBLIC ID', previousPublicId);
  }

  if (req.file) {
    user = await User.findByIdAndUpdate(
      { _id: req.user._id },
      { name: req.body.name, profilePicture: req.file.filename },
      { new: true }
    );

    if (previousPublicId)
      await cloudinary.uploader.destroy(previousPublicId).then((result) => {
        console.log({ result });
      });
  } else {
    user = await User.findByIdAndUpdate(
      { _id: req.user._id },
      { name: req.body.name },
      { new: true }
    );
  }

  res.status(200).json({
    status: 'success',
    newUser: user,
  });
};

exports.signUp = asyncHandler(async (req, res, next) => {
  const { name, email, password, confirmPassword } = req.body;

  console.log('REQUEST BODY =', req.body);

  const user = await User.create({ name, email, password, confirmPassword });


  res.status(201).json({
    status: 'success',
    message: 'user created successfully'
  });
});

exports.signIn = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  if(!email || !password) return next(new AppError('Please provide both an email and a password', 400));

  const user = await User.findOne({ email });

  if (!user) return next(new AppError('Email or password is incorrect', 400))

  const correctPassword = await user.checkPassword(password)
  console.log('CORRECT PASSWORD?', correctPassword)

  if (!correctPassword) return next(new AppError('Email or password is incorrect', 400))



  res.status(201).json({
    status: 'success',
    token: signJwt(user._id)
  });
});
