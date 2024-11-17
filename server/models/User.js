const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const UserSchema = new Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true, 
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true, 
    lowercase: true, 
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, 
  },
  firstName: {
    type: String,
    required: true,
    trim: true, 
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
  },
  age: {
    type: Number,
    required: true,
    min: 1, 
    max: 120, 
  },
  country: {
    type: String,
    required: true,
    trim: true,
  },
  gender: {
    type: String,
    required: true,
    trim: true,
    enum: ['Male', 'Female', 'Non-binary', 'Other'], 
  },
  password: {
    type: String,
    required: true,
    minLength: 8, 
  },
  twofactorEnabled:{
    type: Boolean,
    default: false,
  },
  twofactorKey:{
    type: String,
    default: null,
  }
});

module.exports = mongoose.model('User', UserSchema);