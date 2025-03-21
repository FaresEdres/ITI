import fs from 'node:fs';
import express from 'express';
import routes from './routes/employees.js';

const app = express();
app.use(express.static('public'));
app.set('view engine', 'pug');
app.set('views', 'views');

app.get('/', (req, res) => {
  let employees = fs.readFileSync('./database.json', 'utf-8');
  employees = JSON.parse(employees);

  res.render('employees', { employees });
});
app.use(express.json());
app.use(routes);

app.listen(3001, () =>
  console.log('Express Server running on 3001'));
