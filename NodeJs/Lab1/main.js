const {
  getCheckedEmployee,
  addEmployee,
  checkRequired,
  convertCliToObject,
  deleteEmployee,
  editEmployee,
  getEmployeeByFilter,
  listEmployees,
} = require("./company.js");
const { isDatabaseEmpty } = require("./utils.js");
const fs = require("fs");
let employees = JSON.parse(fs.readFileSync("./database.json", "utf-8"));
const [, , command, ...args] = process.argv;
if (command === "add") {
  const employeeChecked = getCheckedEmployee(args);
  checkRequired(employeeChecked);
  addEmployee(employeeChecked);
} else if (command == "list") {
  isDatabaseEmpty(employees);
  if (args.length == 0) listEmployees();
  else {
    const employeeChecked = getCheckedEmployee(args);
    console.log(getEmployeeByFilter(employeeChecked));
  }
} else if (command == "edit") {
  isDatabaseEmpty(employees);
  const employeeUnchecked = convertCliToObject(args);
  editEmployee(employeeUnchecked);
} else if (command == "delete") {
  isDatabaseEmpty(employees);
  const employeeUnchecked = convertCliToObject(args);
  deleteEmployee(employeeUnchecked);
} else {
  throw new Error(
    "Available commands (sensitive-case):  add - list - edit - delete"
  );
}
