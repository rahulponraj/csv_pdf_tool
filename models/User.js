// models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: String,
  mobileNumber: String,
  status: { type: String, default: 'pending' },
});

const User = mongoose.model('User', userSchema);

module.exports = User;
