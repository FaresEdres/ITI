const {
  throwErrorExpression,
  checkRequired,
  convertCliToObject,
} = require("./utils.js");
const fs = require("fs");
let id = 1;
module.exports = {
  addEmployee,
  checkRequired,
  convertCliToObject,
  deleteEmployee,
  editEmployee,
  getCheckedEmployee,
  getEmployeeByFilter,
  listEmployees,
};

function deleteEmployee(employeeDelete) {
  let employees = JSON.parse(fs.readFileSync("./database.json", "utf-8"));
  if (Object.entries(employeeDelete) > 1)
    throwErrorExpression("Only one Argument Expected");
  idTarget = employeeDelete?.id ?? throwErrorExpression("Please provide an id");
  employees = employees.filter((employee) => employee.id != idTarget);

  employees.splice(id, 1);
  fs.writeFileSync("./database.json", JSON.stringify(employees));
}

function editEmployee(employeeEdit) {
  idTarget = employeeEdit?.id ?? throwErrorExpression("Please provide an id");
  let employees = JSON.parse(fs.readFileSync("./database.json", "utf-8"));
  const employeeTarget = employees.filter(
    (employee) => employee.id == idTarget
  );

  for (const [property, value] of Object.entries(employeeEdit)) {
    employeeTarget[0][property] = value;
  }

  fs.writeFileSync("./database.json", JSON.stringify(employees));
}
function listEmployees() {
  let employees = JSON.parse(fs.readFileSync("./database.json", "utf-8"));
  let outputMessage = "";
  employees.forEach((employee) => {
    for (const [property, value] of Object.entries(employee)) {
      outputMessage += property + ":" + value + " ";
    }
    outputMessage += "\n";
  });
  console.log(outputMessage);
}
function getEmployeeByFilter(employeeFilter) {
  let employees = JSON.parse(fs.readFileSync("./database.json", "utf-8"));
  return employees.filter((employee) => {
    for ([property, value] of Object.entries(employeeFilter)) {
      if (employee[property] != employeeFilter[property]) {
        return false;
      }
    }
    return true;
  });
}

function getCheckedEmployee(args) {
  const employeeUnchecked = convertCliToObject(args);
  return checkRequired(employeeUnchecked);
}

function addEmployee(employee) {
  let employees = JSON.parse(fs.readFileSync("./database.json", "utf-8"));
  const nameRegex = new RegExp("^[a-zA-Z]+$");
  employee.id = (employees.slice(-1)[0]?.id ?? 0) + 1;
  console.log(employee.name.length);
  if (employee.name.length <= 2) {
    throw new Error("Name size should be greater than 2");
  }
  if (!nameRegex.test(employee.name)) {
    throw new Error("Name should be alphabets only");
  }
  employees = employees.concat(employee);
  fs.writeFileSync("./database.json", JSON.stringify(employees));
}
