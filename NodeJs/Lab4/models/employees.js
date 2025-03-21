import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import {profileSchema} from './profiles.js';

const employeeSchema = new mongoose.Schema({
  _id: Number,
  username: {
    type: String,
    minlength: 8,
    unique: true,
    required: true,
    validate: {
      validator(data) {
        return !data.includes(' ');
      },
      message: 'Username cannot contain spaces'
    },
    match: [/^[a-z]\w+$/i, 'Invalid username format']
  },
  firstName: {type: String, minlength: 3, maxlength: 15, uppercase: true, required: true},
  lastName: {type: String, minlength: 3, maxlength: 15, uppercase: true, required: true},
  dob: {type: Date, required: true},
  password: {type: String, minlength: 8, required: true},
  profile: profileSchema

}, {timestamps: true});
employeeSchema.pre('save', function (next) {
  this.password = bcrypt.hashSync(this.password, 10);
  next();
});

employeeSchema.set('toJSON', {
  transform: (doc, {__v, password, ...rest}) => rest
});

employeeSchema.methods.comparePasswords = function (password) {
  return bcrypt.compareSync(password, this.password);
};

const Employees = mongoose.model('Employee', employeeSchema);

export default Employees;
