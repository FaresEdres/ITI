Array.prototype.average = function () {
  var len = this.length;
  if (len < 1) return -1;
  var sum = 0;
  var average;
  for (let i = 0; i < len; i++) {
    if (isNaN(Number(this[i]))) return -2;
    sum += Number(this[i]);
  }
  average = sum / len;
  return average;
};

var arr = [1, 20, "3", "a", 5];
console.log(arr.average());
