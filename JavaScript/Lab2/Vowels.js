var vowels = {
  a: 0,
  e: 0,
  i: 0,
  u: 0,
  o: 0,
};

function vowelsSearch(word) {
  wordLength = word.length;
  for (var i = 0; i < wordLength; i++) {
    if (Object.keys(vowels).includes(word.charAt(i).toLowerCase()))
      vowels[word.charAt(i).toLowerCase()]++;
  }
}
vowelsSearch("Ahmeesd");
console.log(vowels);
