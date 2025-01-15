import {} from "./Handlers.js";
import { globals } from "./Init.js";
import { createHeartEmojis, setScreen } from "./View.js";
export { isAlpha, selectRandomWord };
function isAlpha(letter) {
  if (letter.length > 1) return 0;
  return letter >= "a" && letter <= "z";
}
function selectRandomWord(category) {
  if (!globals.categorySelected) {
    globals.warning.textContent = "";
    globals.wordInGame = [];
    globals.categorySelected = true;
    globals.lives = 6;
    createHeartEmojis();
    globals.randomWord = category[Math.floor(Math.random() * category.length)];

    for (var i = 0; i < globals.randomWord.length; i++) {
      globals.wordInGame.push("＿");
    }
    globals.guessWord.textContent = String(globals.wordInGame).replaceAll(
      ",",
      " "
    );
    setScreen("game-screen");
    globals.previousAttempts.textContent = globals.pastChoices;
  }
}
