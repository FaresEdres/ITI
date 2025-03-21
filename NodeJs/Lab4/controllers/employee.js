import process from 'node:process';
import jwt from 'jsonwebtoken';
import Employees from '../models/employees.js';

const create = async (data) => {
  try {
    if (data._id) throw new Error('ID is incremental; please do not enter an id');

    const lastEmp = await Employees.findOne().sort({_id: -1});
    if (!lastEmp) data._id = 0;
    else data._id = lastEmp._id + 1;
    const employee = await Employees.create(data);
    return employee;
  } catch (error) {
    console.error('Error in create:', error);
    throw error;
  }
};

const getAll = async () => {
  try {
    const employees = await Employees.find({}, {firstName: 1, dob: 1}).exec();
    const employeesWithAge = employees.map((employee) => {
      const dob = employee.dob;
      const age = dob
        ? Math.floor(
            (Date.now() - new Date(dob).getTime())
            / (1000 * 60 * 60 * 24 * 365.25)
          )
        : null;
      delete employee.dob;
      return Object.assign({}, employee.toObject(), {age});
    });
    return employeesWithAge;
  } catch (error) {
    console.error('Error in getAll:', error);
    throw error;
  }
};

const deleteEmployee = async (id) => {
  try {
    const employee = await Employees.findByIdAndDelete(id);
    return employee;
  } catch (error) {
    console.error('Error in deleteEmployee:', error);
    throw error;
  }
};

const updateById = async (id, data) => {
  try {
    const employee = await Employees.findByIdAndUpdate(id, data, {new: true});
    return employee;
  } catch (error) {
    console.error('Error in updateById:', error);
    throw error;
  }
};

const getLeavesByEmployeeId = async (id) => {
  try {
    const employee = await Employees.findById(id).populate('leaves').exec();
    return employee ? employee.leaves : null;
  } catch (error) {
    console.error('Error in getLeavesByEmployeeId:', error);
    throw error;
  }
};
const login = async (data) => {
  const user = await Employees.findOne({username: data.username}).exec();
  const isValidPassword = user.comparePasswords(data.password);
  if (!isValidPassword) {
    throw new Error('User name or password is not correct', 401);
  }
  const token = jwt.sign({id: user._id}, process.env.JWT_SECRET, {expiresIn: '1h'});
  return token;
};
export default {
  create,
  getAll,
  deleteEmployee,
  updateById,
  getLeavesByEmployeeId,
  login
};
