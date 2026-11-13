const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const AANTAL_RONDES = 10;

let score = 0;
let ronde = 0;
let juisteLetter = "";

const kaartEl = document.getElementById("kaart");
const antwoordenEl = document.getElementById("antwoorden");
const feedbackEl = document.getElementById("feedback");
const scoreEl = document.getElementById("score");
const rondeEl = document.getElementById("ronde");
const opnieuwKnop = document.getElementById("opnieuw");

function kiesWillekeurigeLetter() {
  return LETTERS[Math.floor(Math.random() * LETTERS.length)];
}

function maakAntwoorden(juiste) {
  const set = new Set([juiste]);
  while (set.size < 4) {
    set.add(kiesWillekeurigeLetter());
  }
  return Array.from(set).sort(() => Math.random() - 0.5);
}

function startRonde() {
  ronde += 1;
  if (ronde > AANTAL_RONDES) {
    eindeSpel();
    return;
  }
  rondeEl.textContent = ronde;
  feedbackEl.textContent = "";
  feedbackEl.className = "feedback";

  juisteLetter = kiesWillekeurigeLetter();
  kaartEl.textContent = juisteLetter;

  antwoordenEl.innerHTML = "";
  for (const letter of maakAntwoorden(juisteLetter)) {
    const knop = document.createElement("button");
    knop.type = "button";
    knop.className = "antwoord";
    knop.textContent = letter;
    knop.addEventListener("click", () => controleerAntwoord(knop, letter));
    antwoordenEl.appendChild(knop);
  }
}

function controleerAntwoord(knop, gekozen) {
  if (gekozen === juisteLetter) {
    score += 10;
    scoreEl.textContent = score;
    knop.classList.add("goed");
    feedbackEl.textContent = "Goed zo! 🎉";
    feedbackEl.classList.add("goed");
  } else {
    knop.classList.add("fout");
    feedbackEl.textContent = `Helaas, het was ${juisteLetter}.`;
    feedbackEl.classList.add("fout");
  }
  Array.from(antwoordenEl.children).forEach((k) => {
    k.disabled = true;
    if (k.textContent === juisteLetter) {
      k.classList.add("goed");
    }
  });
  setTimeout(startRonde, 1200);
}

function eindeSpel() {
  kaartEl.textContent = "🦄";
  antwoordenEl.innerHTML = "";
  feedbackEl.textContent = `Einde! Je score is ${score} van de ${AANTAL_RONDES * 10}.`;
  feedbackEl.className = "feedback goed";
}

opnieuwKnop.addEventListener("click", () => {
  score = 0;
  ronde = 0;
  scoreEl.textContent = score;
  startRonde();
});

startRonde();
