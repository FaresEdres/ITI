function sumOfDigits(num) {
  if (String(num) === num) {
    console.log("Insert numerical values only");
    return -1;
  }
  numString = String(num);
  console.log(numString);
  numLength = numString.length;
  var sum = 0;
  for (var i = 0; i < numLength; i++) {
    sum += Number(numString[i]);
  }
  return sum;
}

console.log(sumOfDigits("abc"));
