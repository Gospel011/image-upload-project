const express = require('express');

const authController = require('./../controllers/authController');
const multerHandler = require('./../utils/multerHandler');

const router = express.Router();

router
  .route('/profile')
  .patch(
    authController.validate,
    multerHandler.uploadProfilePicture,
    multerHandler.processImage,
    authController.updateProfile
  )
router.post('/signup', authController.signUp);
router.post('/login', authController.signIn);

module.exports = router;
