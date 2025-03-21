import fs from 'node:fs';

import express from 'express';
import { validateEmployee } from '../employee_validation.js';

const Router = express.Router();

Router.get('/', (req, res) => {
  try {
    const employees = fs.readFileSync('./database.json', 'utf-8');
    res.json(JSON.parse(employees));
  } catch {
    res.status(500).json({ error: 'Failed to read database' });
  }
});
Router.get('/:id', (req, res) => {
  try {
    const data = fs.readFileSync('./database.json', 'utf-8');
    const id = Number(req.params.id);
    const employees = JSON.parse(data);
    const targetEmployee = employees.find((employee) => employee.id === id);
    res.status(200).json(targetEmployee);
    if (!targetEmployee) {
      return res.status(404).json({ error: 'Invalid ID' });
    }
  } catch {
    res.status(500).json({ error: 'Failed get Employee by id' });
  }
});

Router.post('/', validateEmployee('POST'), (req, res) => {
  const employee = req.body;
  const data = fs.readFileSync('./database.json', 'utf-8');
  const employees = JSON.parse(data);
  employee.id = (employees.slice(-1)[0]?.id ?? 0) + 1;
  employees.push(employee);

  fs.writeFileSync('./database.json', JSON.stringify(employees, '', 2));
  res.status(200).json({ message: 'Employee has been added successfully' });
});
Router.delete('/:id', (req, res) => {
  try {
    const data = fs.readFileSync('./database.json', 'utf-8');
    const id = Number(req.params.id);
    const employees = JSON.parse(data);
    const newEmployees = employees.filter((employee) => employee.id !== id);
    fs.writeFileSync('./database.json', JSON.stringify(newEmployees, '', 2));
    res.status(200).json({ message: 'Data has been deleted Successfully' });
  } catch {
    res.status(500).json({ error: 'Failed get Employee by id' });
  }
});
Router.patch('/:id', validateEmployee('PATCH'), (req, res) => {
  try {
    const data = fs.readFileSync('./database.json', 'utf-8');
    const id = Number(req.params.id);
    const employeeUpdate = req.body;
    const employees = JSON.parse(data);
    const targetEmployeeIndex = employees.findIndex((employee) => employee.id === id);
    //object.assign
    const targetEmployee = { ...employees[targetEmployeeIndex], ...employeeUpdate };

    employees[targetEmployeeIndex] = targetEmployee;
    fs.writeFileSync('./database.json', JSON.stringify(employees, '', 2));

    res.status(200).json({ message: 'Data has been updated Successfully' });
  } catch {
    res.status(500).json({ error: 'Failed get Employee by id' });
  }
});
export default Router;
