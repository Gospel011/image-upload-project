const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const validator = require('validator')

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'please provide your first name'],
    minLength: [2, 'a name must be atleast two characters long'],
    trim: true,
  },
  lastName: {
    type: String,
    required: [true, 'please provide your last name'],
    minLength: [2, 'a name must be atleast two characters long'],
    trim: true,
  },
  email: {
    type: String,
    validate: [validator.isEmail, 'please provide a valid email'],
    required: [true, 'please provide an email'],
    unique: true,
  },
  profilePicture: {
    type: String,
    default: 'default.png'
  },
  password: {
    type: String,
    required: [true, 'the password field cannot be empty'],
    select: false,
    validate: {
      validator: function (value) {
        if (this.isNew || this.isModified('password')) {
          return value.length === 8;
        } else {
          return true;
        }
      },
      message: 'your password should be 8 characters long}',
    },
  },
  confirmPassword: {
    type: String,
    required: [true, 'the confirm password field cannot be empty'],
    validate: {
      validator: function (el) {
        if (
          this.isNew ||
          this.isModified('confirmPassword') ||
          this.isModified('password')
        ) {
          const validated = el === this.password;
          this.confirmPassword = undefined;
          
          return validated;
        } else {
          return true;
        }
      },
      message: "your password and confirmPassword fields don't match",
    },
    select: false,
  },
  phoneNumber: {
    type: String,
    required: [true, 'please provide a phone number'],
    minLength: [
      11,
      'a phone number should be between eleven to fourteen characters long',
    ],
    maxLength: [
      14,
      'a phone number should be between eleven to fourteen characters long',
    ],
    trim: true,
  },
  gender: {
    type: String,
    lowercase: true,
    enum: {
      values: ['male', 'female'],
      message: 'a user can only be male or female',
    },
    required: [true, 'please provide your gender'],
  },
  school: {
    type: String,
    required: [true, 'please provide your school'],
  },
  role: {
    type: String,
    enum: {
      values: ['user', 'landlord'],
      message: 'The only available roles are user and landlord',
    },
    default: 'user',
  },
  lookingForRoomate: {
    type: Boolean,
    enum: {
      values: [true, false],
      message:
        'the lookingForRoomate property can only either be true of false',
    },
    default: false,
  },
  lastChangedPassword: {
    type: Date,
    select: false,
  },
  otp: {
    type: String,
    select: false,
  },
  otpExpiryDate: {
    type: Date,
    select: false,
  },
});


userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();

  this.password = await bcrypt.hash(this.password, 12);
  this.confirmPassword = undefined;

  this.lastChangedPassword = Date.now() - 2 * 1000

  next();
});



userSchema.methods.changedPasswordAfterJwtIAT = function (jwtIAT) {
  return jwtIAT < this.lastChangedPassword.getTime() / 1000
}

userSchema.methods.checkPassword = async function (clientPassword) {
  

  return await bcrypt.compare(clientPassword, this.password)
}

const userModel = mongoose.model('User', userSchema);

module.exports = userModel;
