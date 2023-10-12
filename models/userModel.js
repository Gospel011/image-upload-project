const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'please provide your name'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'please provide your email'],
    unique: [true, 'this user already exists'],
    trim: true,
  },
  password: {
    type: String,
    required: [true, 'please provide a password to secure your account'],
    validate: {
      validator: function (value) {
        return value.length === 8
      },
      message: 'your password must only be 8 characters long'
    },
  },
  confirmPassword: {
    type: String,
    required: [true, 'please confirm your password'],
    validate: {
        validator: function(value) {
            return value === this.password
        },
        message: 'your password and confirm password fields dont\'t match'
    }
  },
  lastChangedPassword: Date,
  profilePicture: {
    type: String,
    default: 'default.png',
  },
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();

  this.password = await bcrypt.hash(this.password, 12);
  this.confirmPassword = undefined;

  this.lastChangedPassword = Date.now() - 2 * 1000

  next();
})

userSchema.methods.changedPasswordAfterJwtIAT = function (jwtIAT) {
  return jwtIAT < this.lastChangedPassword.getTime() / 1000
}

userSchema.methods.checkPassword = async function (clientPassword) {
  // console.log({});

  return await bcrypt.compare(clientPassword, this.password)
}

const userModel = mongoose.model('User', userSchema);

module.exports = userModel;
