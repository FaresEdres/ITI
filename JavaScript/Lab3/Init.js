export { globals };
const globals = {
  pastChoices: [],
  wordInGame: [],
  lives: 6,
  found: false,
  congratsScreen: document.getElementById("congrats"),
  lostScreen: document.getElementById("lost"),
  gameScreen: document.getElementById("game-screen"),
  correctWord: document.getElementById("correct-word"),
  previousAttempts: document.getElementById("previous-attempts"),
  guessWord: document.getElementById("guessWord"),
  userInput: document.getElementById("userInput"),

  currTime: 30,
  timer: document.getElementById("time"),

  warning: document.getElementById("warning"),
  selectAnimal: document.getElementById("Animal"),
  selectTechnology: document.getElementById("Technology"),
  categorySelection: document.getElementById("category"),
  categorySelected: false,

  iconContainer: document.getElementById("lives"),
  givenHint: document.getElementById("given-hint"),
  hintButton: document.getElementById("hint"),
  reset: false,
  hasHint: true,
  randomWord: "",
  category: {
    Animal: ["elephant", "lion", "deer", "zebra", "kangaroo"],
    Technology: ["mobile", "internet", "laptop"],
  },

  hint: {
    elephant: "Big. Has a trunk. Shocking, right?",
    lion: "Oh look, the 'king.' So original.",
    deer: "Jumps. Antlers. Don't overthink it.",
    zebra: "A horse, but with fashion. So unique.",
    kangaroo: "Bouncy animal with a pouch. Wild, huh?",
    mobile: "It's a phone... but it's smarter than you.",
    internet: "Where you waste time. You know it.",
    laptop: "A computer you can carry. Shocking, right?",
  },
};
