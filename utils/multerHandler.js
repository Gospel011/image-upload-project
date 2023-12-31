const multer = require('multer');
const sharp = require('sharp');
const cloudinary = require('./cloudinary');
const fs = require('fs');
const AppError = require('./appError');
const User = require('./../models/userModel');

const storage = multer.memoryStorage();

const fileFilter = function (req, file, cb) {
  const permittedExtentions = ['png', 'jpg', 'jpeg', 'mp4', 'octet-stream'];
  const ext = file.mimetype.split('/')[1];
  console.log('EXTENSION', ext);

  if (permittedExtentions.includes(ext)) cb(null, true);
  else cb(new AppError(`.${ext} files are not allowed`));
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    files: 1,
    fileSize: 10 * 1024 * 1024,
    fields: 6,
    //parts: 7,
  },
});

exports.uploadProfilePicture = upload.single('profilePicture');

const uploadImageFromBuffer = async (req, cb) => {
  cloudinary.uploader
    .upload_stream(
      {
        resource_type: 'image',
        public_id: `user-${req.user._id}-${Math.round(
          Math.random() * 1e9
        )}-${Date.now()}`,
      },
      (error, result) => {
        cb(error, result);
      }
    )
    .end(req.file.buffer);
};

exports.processImage = async (req, res, next) => {
  console.log('ORIGINAL REQ URL', req.originalUrl);

  if (!req.file) return next();

  console.log('IMAGE BUFFER', req.file.buffer);

  await sharp(req.file.buffer)
    .resize(500, 500)
    .jpeg({ quality: 100 })
    .toFormat('jpeg');

  console.log('CLOUDINARY UPLOAD FILE', req.file);

  uploadImageFromBuffer(req, (error, result) => {
    if (error) {
      console.error(error);
      return next(new AppError('Failed to upload image'));
    } else {
      console.log(result);
      console.log('SECURE URL FROM UPLOAD STREAM', result.secure_url);
      req.file.filename = result.secure_url;
      next();
    }
  });
};
