function isPalindrome(str) {
  var word = String(str);
  /*Validation*/
  if (str.length < 2) return 0;
  /*Palindrome Check*/
  var end = word.length - 1;
  var start = 0;

  for (; start < end; start++, end--) {
    if (word.charAt(start) != word.charAt(end)) {
      return 0;
    }
  }
  return 1;
}
/*isPalindrome Test*/
var text = 424;
isPalindrome(text) ? console.log("Palindrome") : console.log("Not Palindrome");
