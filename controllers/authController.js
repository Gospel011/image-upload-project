
const User = require('./../models/userModel');
const asyncHandler = require('./../utils/asyncHandler');
const AppError = require('./../utils/appError');


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

exports.validate = async (req, res, next) => {
  console.log('VALIDATE BODY', req.body);
  const { email, password } = req.body;

  if (!email || !password)
    return next(new AppError('please provide both the email and password'));

  const user = await User.findOne({ email, password });

  if (!user) return next(new AppError('username or password is incorrect'));

  req.user = user;
  next();
};

exports.updateProfile = async (req, res, next) => {
  // console.log('USER REQUESTING PROFILE UPDATE', req);
  console.log('UPDATE REQUEST FILE NAME', req.file.filename);

  let user = req.user;

  if (req.file) {
    user = await User.findByIdAndUpdate(
      { _id: req.user._id },
      { name: req.body.name, profilePicture: req.file.filename },
      { new: true }
    );
  } else {
    user = await User.findByIdAndUpdate(
      { _id: req.user._id },
      { name: req.body.name }
    );
  }

  res.status(200).json({
    status: 'success',
    newUser: user,
  });
};

exports.createUser = asyncHandler(async (req, res, next) => {
  const { name, email, password, confirmPassword } = req.body;

  const user = await User.create({ name, email, password, confirmPassword });

  console.log('REQUEST BODY', req.body);

  //   res.status(501).json({
  //     status: 'success',
  //     user,
  //   });
});
