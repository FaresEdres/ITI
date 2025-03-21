module.exports = {
  throwErrorExpression,
  checkRequired,
  convertCliToObject,
  isDatabaseEmpty,
};
function throwErrorExpression(message) {
  throw new Error(message);
}
function checkRequired(employee) {
  let message = "";

  if (!employee.hasOwnProperty("name")) {
    //console.log(employee.name);
    message += "name,";
  }
  if (!employee.hasOwnProperty("salary")) message += "salary,";
  if (!employee.hasOwnProperty("email")) message += "email,";
  if (message) throw Error("Required: " + message.slice(0, -1));

  return employee;
}
function isDatabaseEmpty(employees) {
  if (employees.length == 0) {
    throwErrorExpression("Database is empty");
  }
}
function convertCliToObject(args) {
  const argRegex = new RegExp("^^--[^=]+=[^=]+$");
  const employee = {};
  //console.log(args);
  for (const arg of args) {
    if (argRegex.test(arg)) {
      argSplit = arg.split("=");
      property = argSplit[0].slice(2);
      value = argSplit[1];
      employee[property] = value;
    } else {
      throw new Error(
        "please write your command in this format '--optionName=value'"
      );
    }
  }
  return employee;
}
