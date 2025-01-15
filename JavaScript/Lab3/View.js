import { globals } from "./Init.js";
export { startAgain, createHeartEmojis, gameReset, setScreen };

function startAgain() {
  if (!globals.categorySelected && globals.reset == true) {
    globals.currTime = 30;
    globals.timer.textContent = globals.currTime;
    globals.reset = false;
    globals.lives = 6;
    globals.categorySelected = false;
    createHeartEmojis();
    setScreen("category");
    globals.pastChoices = [];
  }
}
function createHeartEmojis() {
  globals.iconContainer.innerHTML = "";
  for (var i = 0; i < globals.lives; i++) {
    const iconElement = document.createElement("i");
    iconElement.className = "fa-solid fa-heart";

    globals.iconContainer.appendChild(iconElement);
  }
}
function gameReset() {
  globals.reset = true;
  globals.categorySelected = false;
}

function setScreen(choice) {
  globals.categorySelection.style.display = "none";
  globals.gameScreen.style.display = "none";
  globals.congratsScreen.style.display = "none";
  globals.lostScreen.style.display = "none";
  switch (choice) {
    case "game-screen":
      globals.gameScreen.style.display = "block";

      break;
    case "category":
      globals.categorySelection.style.display = "block";

      break;
    case "lost":
      globals.lostScreen.style.display = "block";
      globals.correctWord.textContent = globals.randomWord;

      break;
    case "congrats":
      globals.congratsScreen.style.display = "block";

      break;
    default:
      break;
  }
}
