function longestWord(sentence){
const words=sentence.split(" ");
var maxLength=0;
var maxWord='';
words.forEach(word => {
    if(maxLength<word.length) {
        maxLength=word.length;
        maxWord=word;
    }
   
});
 return maxWord;
}

var sentence="Hello who aresdsadasasdsa youuuuu ??";
console.log(longestWord(sentence));   