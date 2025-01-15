function longestWord(sentence) {
  var words = sentence.split(" ");
  var maxLength = 0;
  var maxWord = "";
  words.forEach(function (word) {
    if (maxLength < word.length) {
      maxLength = word.length;
      maxWord = word;
    }
  });
  return maxWord;
}

var sentence = "what is the longest word here?";
console.log(longestWord(sentence));
