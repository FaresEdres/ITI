function vowels(word, ch) {
  wordLength = word.length;
  var count = 0;
  for (var i = 0; i < wordLength; i++) {
    if (word[i] == ch) count++;
  }
  return count;
}
console.log(vowels("Ahmeesd", "h"));
