const questions = [
  {
    category: "Geografia",
    question: "¿Cuál es la capital de Nicaragua?",
    answers: ["León", "Granada", "Managua", "Masaya"],
    correct: 2,
    detail: "Managua es la capital y una de las principales puertas de entrada para recorrer el país."
  },
  {
    category: "Naturaleza",
    question: "¿Qué lago nicaragüense contiene la Isla de Ometepe?",
    answers: ["Lago Xolotlán", "Lago Cocibolca", "Laguna de Apoyo", "Lago de Yojoa"],
    correct: 1,
    detail: "La Isla de Ometepe está en el Lago Cocibolca, también conocido como Lago de Nicaragua."
  },
  {
    category: "Gastronomia",
    question: "¿Cuál de estos platos es típico de Nicaragua?",
    answers: ["Gallo pinto", "Ceviche limeño", "Arepa reina pepiada", "Mole poblano"],
    correct: 0,
    detail: "El gallo pinto, hecho con arroz y frijoles, es parte esencial del desayuno nicaragüense."
  },
  {
    category: "Tradiciones",
    question: "¿En qué ciudad se celebra una famosa fiesta de Los Agüizotes?",
    answers: ["Estelí", "Bluefields", "Masaya", "San Juan del Sur"],
    correct: 2,
    detail: "Masaya es reconocida por Los Agüizotes, una celebración llena de mitos, disfraces y tradición popular."
  },
  {
    category: "Historia",
    question: "¿Qué ciudad nicaragüense es conocida como la Gran Sultana?",
    answers: ["Granada", "León", "Rivas", "Matagalpa"],
    correct: 0,
    detail: "Granada recibe el apodo de la Gran Sultana por su historia colonial y su arquitectura colorida."
  },
  {
    category: "Patrimonio",
    question: "¿Qué catedral nicaragüense es Patrimonio de la Humanidad por la UNESCO?",
    answers: ["Catedral de Managua", "Catedral de León", "Catedral de Granada", "Catedral de Matagalpa"],
    correct: 1,
    detail: "La Catedral de León fue inscrita por la UNESCO por su valor histórico, artístico y arquitectónico."
  },
  {
    category: "Musica",
    question: "¿Qué instrumento se asocia mucho con la música folclórica nicaragüense?",
    answers: ["Marimba", "Gaita", "Bandoneón", "Charango"],
    correct: 0,
    detail: "La marimba acompaña bailes, fiestas y expresiones tradicionales en varias regiones del país."
  },
  {
    category: "Turismo",
    question: "¿Qué destino es famoso por practicar sandboarding sobre ceniza volcánica?",
    answers: ["Volcán Mombacho", "Cerro Negro", "Volcán Concepción", "Cosigüina"],
    correct: 1,
    detail: "Cerro Negro, cerca de León, es uno de los sitios más populares para hacer volcano boarding."
  }
];

const scoreEl = document.querySelector("#score");
const questionCountEl = document.querySelector("#question-count");
const categoryEl = document.querySelector("#category");
const progressBarEl = document.querySelector("#progress-bar");
const questionEl = document.querySelector("#question");
const answersEl = document.querySelector("#answers");
const feedbackEl = document.querySelector("#feedback");
const nextBtn = document.querySelector("#next-btn");
const restartBtn = document.querySelector("#restart-btn");
const resultPanel = document.querySelector("#result-panel");
const resultTitle = document.querySelector("#result-title");
const resultMessage = document.querySelector("#result-message");
const playAgainBtn = document.querySelector("#play-again-btn");
const triviaPanel = document.querySelector(".trivia-panel");

let currentQuestion = 0;
let score = 0;
let answered = false;

function renderQuestion() {
  const item = questions[currentQuestion];
  answered = false;

  questionCountEl.textContent = `Pregunta ${currentQuestion + 1} de ${questions.length}`;
  categoryEl.textContent = item.category;
  questionEl.textContent = item.question;
  scoreEl.textContent = score;
  feedbackEl.textContent = "";
  nextBtn.disabled = true;
  progressBarEl.style.width = `${(currentQuestion / questions.length) * 100}%`;

  answersEl.innerHTML = "";

  item.answers.forEach((answer, index) => {
    const button = document.createElement("button");
    button.className = "answer-btn";
    button.type = "button";
    button.textContent = answer;
    button.addEventListener("click", () => selectAnswer(index));
    answersEl.appendChild(button);
  });
}

function selectAnswer(selectedIndex) {
  if (answered) return;

  const item = questions[currentQuestion];
  const buttons = document.querySelectorAll(".answer-btn");
  const isCorrect = selectedIndex === item.correct;

  answered = true;
  nextBtn.disabled = false;

  if (isCorrect) {
    score += 10;
    scoreEl.textContent = score;
    feedbackEl.innerHTML = `<strong>Correcto.</strong> ${item.detail}`;
  } else {
    feedbackEl.innerHTML = `<strong>Respuesta correcta: ${item.answers[item.correct]}.</strong> ${item.detail}`;
  }

  buttons.forEach((button, index) => {
    button.disabled = true;
    if (index === item.correct) button.classList.add("correct");
    if (index === selectedIndex && !isCorrect) button.classList.add("incorrect");
  });
}

function nextQuestion() {
  currentQuestion += 1;

  if (currentQuestion >= questions.length) {
    showResults();
    return;
  }

  renderQuestion();
}

function showResults() {
  const maxScore = questions.length * 10;
  const percentage = Math.round((score / maxScore) * 100);

  progressBarEl.style.width = "100%";
  triviaPanel.classList.add("hidden");
  resultPanel.classList.remove("hidden");

  if (percentage >= 80) {
    resultTitle.textContent = "¡Experto en Nicaragua!";
    resultMessage.textContent = `Lograste ${score} de ${maxScore} puntos. Ya puedes guiar a otros viajeros por cultura, sabores y destinos clave.`;
  } else if (percentage >= 50) {
    resultTitle.textContent = "¡Buen recorrido!";
    resultMessage.textContent = `Lograste ${score} de ${maxScore} puntos. Tienes buena base para seguir descubriendo Nicaragua.`;
  } else {
    resultTitle.textContent = "Hora de explorar más";
    resultMessage.textContent = `Lograste ${score} de ${maxScore} puntos. Cada respuesta es una pista para tu próximo viaje cultural.`;
  }
}

function restartGame() {
  currentQuestion = 0;
  score = 0;
  triviaPanel.classList.remove("hidden");
  resultPanel.classList.add("hidden");
  renderQuestion();
}

nextBtn.addEventListener("click", nextQuestion);
restartBtn.addEventListener("click", restartGame);
playAgainBtn.addEventListener("click", restartGame);

renderQuestion();