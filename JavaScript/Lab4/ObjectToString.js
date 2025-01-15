Object.prototype.toString = function () {
  if (typeof this == "object") return "This is an object";
};
var obj = {};
var specialObj = {
  message: "This is a message",
  toString() {
    return this.message;
  },
};
console.log(String(obj));
console.log(String(specialObj));
