const multer = require('multer');
const sharp = require('sharp');
const cloudinary = require('./cloudinary');
const fs = require('fs');
const AppError = require('./appError')

const storage = multer.memoryStorage();

const fileFilter = function (req, file, cb) {
  const permittedExtentions = ['png', 'jpg', 'jpeg', 'mp4'];
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
    fileSize: 1 * 1024 * 1024,
    fields: 4,
    parts: 5,
  },
});

exports.uploadProfilePicture = upload.single('profilePicture');

exports.processImage = async (req, res, next) => {

  console.log('ORIGINAL REQ URL', req.originalUrl)

  if (!req.file) return next();

  // console.log(`DIRNAME ${__dirname}`)

  req.file.filename = `user-${Math.round(
    Math.random() * 1e9
  )}-${Date.now()}.jpeg`; //${req.file.mimetype.split('/')[1]}`;

  console.log('IMAGE BUFFER', req.file.buffer);

  const filePath = `users/profile-photo/${req.file.filename}`

  await sharp(req.file.buffer)
    .resize(500, 500)
    .jpeg({ quality: 100 })
    .toFormat('jpeg')
    .toFile(filePath);

  console.log('CLOUDINARY UPLOAD FILE', req.file);

  cloudinary.uploader.upload(
    `users/profile-photo/${req.file.filename}`,
    { use_filename: true },
    (err, result) => {
      if (err) {
        console.log('CLOUDINARY ERROR', err);
        return next(new AppError(`${err.message}`));
      }
      console.log('CLOUDINARY UPLOAD RESULT', result);

      // DELETE THE LOCALLY STORED FILE


      // Schedule the deletion after 10 seconds
      setTimeout(() => {
        fs.unlink(filePath, (err) => {
          if (err) {
            console.error(`Error deleting file: ${err}`);
          } else {
            console.log(`File ${filePath} deleted successfully.`);
          }
        });
      }, 1 * 1000); // 10 seconds in milliseconds

      req.file.filename = result.secure_url;
      next();
    }
  );
};
