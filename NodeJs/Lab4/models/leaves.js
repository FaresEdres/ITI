import mongoose from 'mongoose';

const leavesSchema = new mongoose.Schema({
  empId: {type: Number, ref: 'Employee'},
  type: {type: String, enum: ['annual', 'casual', 'sick']},
  status: {type: String, enum: ['inprogress', 'cancelled', 'ended'], default: 'inprogress', required: true},
  empBulkId: {type: Number},
  duration: {type: Number, min: 1, required: true}

}, {timestamps: true});

const Leaves = mongoose.model('Leaves', leavesSchema);

export default Leaves;
