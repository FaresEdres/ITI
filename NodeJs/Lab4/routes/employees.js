import express from 'express';
import EmployeesController from '../controllers/employee.js';
import authentication from '../middlewares/authentication.js';
import {asyncWrapper} from '../utils.js';

const router = express.Router();

class CustomError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

router.post('/login', async (req, res, next) => {
  const [err, data] = await asyncWrapper(EmployeesController.login(req.body));

  if (!err) return res.json({token: data});

  next(err);
});

router.use(authentication);

router.post('/', authentication, async (req, res, next) => {
  const id = req.params.id;
  if (req.user.id !== id) {
    return res.status(403).json({error: 'Not authorized'});
  }
  const [err, data] = await asyncWrapper(EmployeesController.create(req.body));
  if (err) {
    return next(new CustomError(err.message, 422));
  }
  res.json(data);
});

router.get('/', async (req, res) => {
  const employees = await EmployeesController.getAll();
  res.json(employees);
});

router.delete('/:id', async (req, res) => {
  const id = req.params.id;
  if (req.user.id !== id) {
    return res.status(403).json({error: 'Not authorized'});
  }
  try {
    const employee = await EmployeesController.deleteEmployee(id);
    if (!employee) {
      return res.status(404).json({message: `${id} is not found`});
    }
    res.json(employee);
  } catch {
    res.status(500).json({message: 'Error in employee deletion'});
  }
});

router.patch('/:id', authentication, async (req, res) => {
  const id = req.params.id;
  const data = req.body;

  if (req.user.id !== id) {
    return res.status(403).json({error: 'Not authorized'});
  }

  try {
    const employee = await EmployeesController.updateById(id, data);
    if (!employee) {
      return res.status(404).json({message: `${id} not found.`});
    }
    res.json(employee);
  } catch {
    res.status(500).json({message: 'Employee update failed'});
  }
});

router.get('/:id/leaves', async (req, res) => {
  const id = req.params.id;

  if (req.user.id !== id) {
    return res.status(403).json({error: 'Not authorized'});
  }

  const leaves = await EmployeesController.getLeavesByEmployeeId(id);
  if (!leaves) {
    return res.status(404).json({message: `Employee with id ${id} is not found`});
  }
  res.json(leaves);
});

export default router;
