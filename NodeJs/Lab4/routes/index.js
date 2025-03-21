import express from 'express';

import EmployeesRouter from './employees.js';
import LeavesRouter from
  './leaves.js';
import ProfilesRouter from './profiles.js';

const router = express.Router();

router.use('/employees', EmployeesRouter);
router.use('/leaves', LeavesRouter);
router.use('/profiles', ProfilesRouter);

export default router;
