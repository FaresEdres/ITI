import express from 'express';
import employeesRouter from './employees';

const Router = express.Router();
Router.use('/employees', employeesRouter);
export default Router;
