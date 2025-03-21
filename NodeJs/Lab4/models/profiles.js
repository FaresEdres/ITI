import mongoose from 'mongoose';

const profileSchema = new mongoose.Schema({
  title: {type: String, required: true},
  description: {type: String, required: true},
  yearOfExperience: {type: Number, default: 0},
  department: {type: String, required: true},
  phone: {type: String, required: true},
  email: {type: String, match: [/^[\w|.\-]*@\w*\.[\w|.]*/, 'Invalid email format'], required: true}
});

export {profileSchema};
