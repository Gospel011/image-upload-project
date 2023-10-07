const express = require('express');

const authController = require('./../controllers/authController')
const multerHandler = require('./../utils/multerHandler')


const router = express.Router();


router.route('/profile').patch(multerHandler.uploadProfilePicture, multerHandler.processImage, authController.validate, authController.updateProfile).post(authController.createUser)

module.exports = router;