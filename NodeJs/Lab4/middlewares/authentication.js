import process from 'node:process';
import jwt from 'jsonwebtoken';
import Employees from '../models/employees.js';

const authentication = async (req, res, next) => {
  if (!req.headers.authorization) {
    return res.status(401).json({error: 'Unauthorized user'});
  }
  try {
    const payload = jwt.verify(req.headers.authorization, process.env.JWT_SECRET);
    const user = await Employees.findById(payload.id).exec();
    if (!user) {
      return res.status(401).json({error: 'Unauthorized'});
    }
    req.user = user;
    next();
  } catch {
    return res.status(401).json({error: 'Unauthorized'});
  }
};

export default authentication;
