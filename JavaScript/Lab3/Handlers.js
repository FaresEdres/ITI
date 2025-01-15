import { selectRandomWord, isAlpha } from "./Hangman.js";
import { globals } from "./Init.js";
import { startAgain, gameReset, setScreen } from "./View.js";
globals.hintButton.addEventListener("click", function () {
  if (globals.hasHint) {
    globals.givenHint.textContent = globals.hint[globals.randomWord];
    globals.lives--;
    globals.iconContainer.lastElementChild.remove();
    globals.hasHint = false;
  } else {
    globals.givenHint.textContent =
      "Try using that thing called 'logic'—it's not rocket science.";
  }
});
globals.selectAnimal.addEventListener("click", function (e) {
  selectRandomWord(globals.category.Animal);
});
globals.selectTechnology.addEventListener("click", function (e) {
  selectRandomWord(globals.category.Technology);
});
document.addEventListener("keydown", function (e) {
  var letter = e.key.toLowerCase();
  if (isAlpha(letter) && globals.categorySelected) {
    if (globals.pastChoices.includes(letter)) {
      globals.warning.textContent = "Don't waste my time";
    } else {
      globals.warning.textContent = "";
      globals.currTime = 30;
      globals.timer.textContent = globals.currTime;
      globals.pastChoices.push(letter);
      globals.previousAttempts.textContent = globals.pastChoices;
      for (var i = 0; i < globals.randomWord.length; i++) {
        if (globals.randomWord[i] == letter) {
          globals.wordInGame[i] = letter;
          globals.guessWord.textContent = String(globals.wordInGame).replaceAll(
            ",",
            " "
          );
          globals.found = true;
        }
      }
      if (globals.found == false && globals.categorySelected) {
        globals.lives--;
        globals.iconContainer.lastElementChild.remove();
        if (globals.lives == 0) {
          setScreen("lost");

          gameReset();

          setTimeout(startAgain, 5000);
        }
      }
      if (!globals.wordInGame.includes("＿")) {
        setScreen("congrats");

        gameReset();

        setTimeout(startAgain, 5000);
      }
      globals.found = false;
    }
  } else {
    globals.warning.textContent =
      "Trying non-alphabets won't feed the children";
  }
});
setInterval(function () {
  if (globals.currTime > 0 && globals.categorySelected) {
    globals.timer.textContent = --globals.currTime;
  } else if (globals.currTime == 0) {
    setScreen("lost");
    gameReset();

    setTimeout(startAgain, 5000);
  }
}, 1000);
