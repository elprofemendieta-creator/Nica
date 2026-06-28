// ================================================================
//  🏆 PINOLERO MILLONARIO - LÓGICA
// ================================================================

// ===== BANCO DE PREGUNTAS (15 preguntas) =====
const QUESTION_BANK = [{
    question: '¿En qué departamento se encuentra la ciudad de Granada?',
    options: ['Managua', 'Granada', 'León', 'Masaya'],
    correct: 1,
    hint: 'Es el mismo nombre del departamento.',
    funFact: 'Granada fue fundada en 1524 y es una de las ciudades más antiguas de América.'
}, {
    question: '¿Cuál es el ave nacional de Nicaragua?',
    options: ['Quetzal', 'Guardabarranco', 'Loro', 'Colibrí'],
    correct: 1,
    hint: 'Su nombre significa "que barre el barranco".',
    funFact: 'El guardabarranco es conocido científicamente como Eumomota superciliosa.'
}, {
    question: '¿Qué significa el término "Pinolero"?',
    options: ['Persona que come pinol', 'Habitante de Nicaragua', 'Un baile tradicional', 'Un instrumento musical'],
    correct: 1,
    hint: 'Es un gentilicio muy usado por los nicaragüenses.',
    funFact: 'El pinol es una bebida hecha de maíz tostado y cacao.'
}, {
    question: '¿Quién escribió el poemario "Azul"?',
    options: ['Rubén Darío', 'Pablo Antonio Cuadra', 'Ernesto Cardenal', 'Salomón de la Selva'],
    correct: 0,
    hint: 'Es el poeta más famoso de Nicaragua.',
    funFact: 'Rubén Darío es considerado el padre del modernismo en la literatura en español.'
}, {
    question: '¿Qué volcán es conocido como "El Coloso de Nicaragua"?',
    options: ['Momotombo', 'Concepción', 'San Cristóbal', 'Telica'],
    correct: 2,
    hint: 'Es el volcán más alto de Nicaragua.',
    funFact: 'El San Cristóbal tiene 1,745 metros de altura y está activo.'
}, {
    question: '¿En qué año se firmó el Tratado de Paz y Amistad entre Nicaragua y Honduras?',
    options: ['1990', '1960', '2000', '1980'],
    correct: 0,
    hint: 'Fue en la década de los 90.',
    funFact: 'El tratado puso fin a la disputa territorial por el Golfo de Fonseca.'
}, {
    question: '¿Cuál es la comida típica que se come en las fiestas patronales de Managua?',
    options: ['Nacatamal', 'Gallo pinto', 'Vigorón', 'Quesillo'],
    correct: 2,
    hint: 'Lleva chicharrón, yuca y ensalada de repollo.',
    funFact: 'El vigorón es originario de Granada y se come con chicharrón y yuca.'
}, {
    question: '¿Qué departamento es conocido como "La Cuna del Folclore" en Nicaragua?',
    options: ['León', 'Granada', 'Masaya', 'Rivas'],
    correct: 2,
    hint: 'Es famoso por sus artesanías y tradiciones.',
    funFact: 'Masaya es conocida como la "Ciudad de las Flores".'
}, {
    question: '¿Cuántos volcanes activos hay en Nicaragua?',
    options: ['19', '12', '25', '7'],
    correct: 0,
    hint: 'Es un número mayor a 15.',
    funFact: 'Nicaragua tiene más de 50 volcanes en total, muchos de ellos submarinos.'
}, {
    question: '¿Quién es conocido como "El Héroe Nacional de Nicaragua"?',
    options: ['Augusto C. Sandino', 'José Santos Zelaya', 'Emiliano Chamorro', 'Pedro Joaquín Chamorro'],
    correct: 0,
    hint: 'Luchó contra la ocupación estadounidense.',
    funFact: 'Sandino es recordado por su lucha en Las Segovias.'
}, {
    question: '¿Cuál es el lago más grande de Nicaragua?',
    options: ['Lago de Managua', 'Lago de Nicaragua', 'Laguna de Apoyo', 'Lago de Apanás'],
    correct: 1,
    hint: 'También es conocido como Cocibolca.',
    funFact: 'El Lago de Nicaragua es el único lago de agua dulce que contiene tiburones.'
}, {
    question: '¿En qué ciudad se encuentra la Catedral de León, Patrimonio de la Humanidad?',
    options: ['León', 'Granada', 'Managua', 'Masaya'],
    correct: 0,
    hint: 'Es la ciudad universitaria por excelencia.',
    funFact: 'La Catedral de León es la más grande de Centroamérica.'
}, {
    question: '¿Qué baile tradicional es Patrimonio Inmaterial de la Humanidad?',
    options: ['Palo de Mayo', 'El Güegüense', 'La Gigantona', 'El Toro Huaco'],
    correct: 1,
    hint: 'Es una obra de teatro danzada de la época colonial.',
    funFact: 'El Güegüense fue declarado Patrimonio de la Humanidad por la UNESCO en 2005.'
}, {
    question: '¿En qué año se fundó la ciudad de Managua como capital?',
    options: ['1821', '1846', '1852', '1893'],
    correct: 2,
    hint: 'Fue a mediados del siglo XIX.',
    funFact: 'Managua fue elegida capital por su ubicación estratégica entre León y Granada.'
}, {
    question: '¿Qué plato típico se consume tradicionalmente en Semana Santa?',
    options: ['Gallo pinto', 'Sopa de pescado', 'Nacatamal', 'Quesillo'],
    correct: 1,
    hint: 'Es un plato a base de pescado y verduras.',
    funFact: 'La sopa de pescado es tradición en la costa caribeña durante Semana Santa.'
}];

// ===== PREMIOS (15 preguntas) =====
const PRIZES = [1000, 2000, 3000, 5000, 7000, 10000, 15000, 20000, 30000, 40000, 50000, 65000, 80000, 90000, 100000];

// ===== COSTOS =====
const FIFTY_COST = 1500;
const HINT_COST = 1000;  // ✅ NUEVO: costo de la pista

// ===== ESTADO DEL JUEGO =====
const state = {
    currentIndex: 0,
    prize: 0,
    hints: 3,
    fiftyUsed: false,
    gameOver: false,
    answered: false,
    currentQuestion: null,
    shuffledQuestions: [],
};

// ===== DOM =====
const questionText = document.getElementById('questionText');
const questionNumber = document.getElementById('questionNumber');
const optionEls = document.querySelectorAll('.option');
const currentPrizeDisplay = document.getElementById('currentPrizeDisplay');
const currentQuestionDisplay = document.getElementById('currentQuestionDisplay');
const totalQuestionsDisplay = document.getElementById('totalQuestionsDisplay');
const hintCountDisplay = document.getElementById('hintCountDisplay');
const progressFill = document.getElementById('progressFill');
const winnerCount = document.getElementById('winnerCount');
const hintText = document.getElementById('hintText');

const nextBtn = document.getElementById('nextBtn');
const resetBtn = document.getElementById('resetBtn');
const hintBtn = document.getElementById('hintBtn');
const fiftyBtn = document.getElementById('fiftyBtn');

const modalOverlay = document.getElementById('modalOverlay');
const modalIcon = document.getElementById('modalIcon');
const modalTitle = document.getElementById('modalTitle');
const modalSubtitle = document.getElementById('modalSubtitle');
const modalPrize = document.getElementById('modalPrize');
const modalDetails = document.getElementById('modalDetails');
const playAgainBtn = document.getElementById('playAgainBtn');

// ===== FUNCIÓN PARA MEZCLAR ARRAY =====
function shuffleArray(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

function formatCurrency(amount) {
    return 'C$ ' + amount.toLocaleString();
}

function updatePrizeDisplay(animate = false) {
    currentPrizeDisplay.textContent = formatCurrency(state.prize);
    if (animate) {
        currentPrizeDisplay.classList.remove('pulse');
        void currentPrizeDisplay.offsetWidth;
        currentPrizeDisplay.classList.add('pulse');
    }
}

function loadQuestion(index) {
    const q = state.shuffledQuestions[index];
    state.currentQuestion = q;
    state.answered = false;

    questionText.textContent = q.question;
    questionNumber.textContent = `PREGUNTA ${index + 1} DE ${state.shuffledQuestions.length}`;

    const letters = ['A', 'B', 'C', 'D'];
    optionEls.forEach((el, i) => {
        el.querySelector('.text').textContent = q.options[i] || '---';
        el.className = 'option';
        el.dataset.index = i;
        el.style.display = '';
        el.querySelector('.letter').textContent = letters[i];
    });

    currentQuestionDisplay.textContent = index + 1;
    totalQuestionsDisplay.textContent = state.shuffledQuestions.length;
    hintCountDisplay.textContent = state.hints;

    const progress = ((index) / state.shuffledQuestions.length) * 100;
    progressFill.style.width = `${progress}%`;

    nextBtn.disabled = true;
    optionEls.forEach(el => el.classList.remove('disabled'));
    state.fiftyUsed = false;
    fiftyBtn.disabled = false;
    fiftyBtn.innerHTML = '🎲 50/50 <span class="cost">C$1,500</span>';

    // ✅ Actualizar botón de pista con el costo
    hintBtn.innerHTML = '💡 Pista <span class="cost">C$1,000</span>';

    clearTimeout(window.hintTimeout);
    hintText.textContent = 'Selecciona una opción. ¡Suerte!';
}

function selectOption(index) {
    if (state.answered || state.gameOver) return;

    const q = state.currentQuestion;
    const isCorrect = (index === q.correct);

    optionEls.forEach(el => el.classList.add('disabled'));

    optionEls.forEach((el, i) => {
        if (i === q.correct) el.classList.add('correct');
        if (i === index && !isCorrect) el.classList.add('wrong');
    });

    if (isCorrect) {
        showHint(`✅ ¡Correcto! ${q.funFact}`);
        state.prize += PRIZES[state.currentIndex];
        updatePrizeDisplay(true);
    } else {
        showHint(`❌ Incorrecto. Respuesta: ${q.options[q.correct]}`);
        optionEls.forEach((el, i) => {
            if (i === q.correct) el.classList.add('correct');
        });
        state.gameOver = true;
        showFinalModal(false);
        return;
    }

    state.answered = true;
    nextBtn.disabled = false;

    if (state.currentIndex === state.shuffledQuestions.length - 1 && isCorrect) {
        showFinalModal(true);
    }
}

function goToNext() {
    if (state.gameOver) return;
    if (state.currentIndex < state.shuffledQuestions.length - 1) {
        state.currentIndex++;
        loadQuestion(state.currentIndex);
    } else {
        nextBtn.disabled = true;
    }
}

function showFinalModal(won) {
    modalOverlay.classList.add('show');
    if (won) {
        modalIcon.textContent = '🏆';
        modalTitle.textContent = '¡Felicidades!';
        modalSubtitle.textContent = 'Eres un Pinolero Millonario';
        modalPrize.textContent = formatCurrency(state.prize);
        modalDetails.textContent = `Respondiste todas las ${state.shuffledQuestions.length} preguntas. ¡Únete a los ${parseInt(winnerCount.textContent) + 1} ganadores!`;
        winnerCount.textContent = parseInt(winnerCount.textContent) + 1;
    } else {
        modalIcon.textContent = '😔';
        modalTitle.textContent = '¡Has perdido!';
        modalSubtitle.textContent = 'Inténtalo de nuevo';
        modalPrize.textContent = formatCurrency(state.prize);
        modalDetails.textContent = `Respondiste ${state.currentIndex} de ${state.shuffledQuestions.length} preguntas. ¡Sigue practicando!`;
    }
    state.gameOver = true;
}

// ===== 50/50 CON COSTO =====
function useFifty() {
    if (state.fiftyUsed || state.answered || state.gameOver) {
        showHint('⚠️ El 50/50 solo se puede usar una vez por pregunta.');
        return;
    }

    if (state.prize < FIFTY_COST) {
        showHint(`❌ No tienes suficiente dinero. Necesitas ${formatCurrency(FIFTY_COST)} para usar el 50/50.`);
        return;
    }

    state.prize -= FIFTY_COST;
    updatePrizeDisplay(true);

    const q = state.currentQuestion;
    const wrongIndices = [];
    for (let i = 0; i < q.options.length; i++) {
        if (i !== q.correct) wrongIndices.push(i);
    }
    const shuffled = wrongIndices.sort(() => Math.random() - 0.5);
    const toHide = shuffled.slice(0, 2);
    optionEls.forEach((el, i) => {
        if (toHide.includes(i)) el.style.display = 'none';
    });
    state.fiftyUsed = true;
    fiftyBtn.disabled = true;
    showHint(`🎲 50/50 aplicado. Te costó ${formatCurrency(FIFTY_COST)}. Dos opciones eliminadas.`);
}

// ===== PISTA CON COSTO =====
function useHint() {
    // ✅ Verificar si ya no quedan pistas
    if (state.hints <= 0) {
        showHint('❌ No te quedan pistas disponibles.');
        return;
    }

    if (state.gameOver || state.answered) {
        showHint('⚠️ No puedes usar una pista ahora.');
        return;
    }

    // ✅ Verificar si tiene suficiente dinero
    if (state.prize < HINT_COST) {
        showHint(`❌ No tienes suficiente dinero. Necesitas ${formatCurrency(HINT_COST)} para usar una pista.`);
        return;
    }

    // ✅ Cobrar el costo
    state.prize -= HINT_COST;
    updatePrizeDisplay(true);

    // ✅ Usar la pista
    state.hints--;
    hintCountDisplay.textContent = state.hints;
    showHint(`💡 Pista: ${state.currentQuestion.hint} (Te costó ${formatCurrency(HINT_COST)})`);
}

function showHint(msg) {
    hintText.textContent = msg;
    clearTimeout(window.hintTimeout);
    window.hintTimeout = setTimeout(() => {
        if (!state.gameOver && !state.answered) {
            hintText.textContent = 'Selecciona una opción. ¡Suerte!';
        }
    }, 6000);
}

function resetGame() {
    state.shuffledQuestions = shuffleArray(QUESTION_BANK);

    state.currentIndex = 0;
    state.prize = 0;
    state.hints = 3;
    state.fiftyUsed = false;
    state.gameOver = false;
    state.answered = false;

    hintCountDisplay.textContent = state.hints;
    totalQuestionsDisplay.textContent = state.shuffledQuestions.length;
    updatePrizeDisplay(false);
    modalOverlay.classList.remove('show');

    optionEls.forEach(el => {
        el.style.display = '';
        el.className = 'option';
    });

    fiftyBtn.disabled = false;
    fiftyBtn.innerHTML = '🎲 50/50 <span class="cost">C$1,500</span>';
    hintBtn.innerHTML = '💡 Pista <span class="cost">C$1,000</span>';
    nextBtn.disabled = true;
    loadQuestion(0);
    showHint('🔄 Juego reiniciado. ¡Buena suerte! Las preguntas están en orden aleatorio.');
}

// ===== EVENTOS =====
optionEls.forEach((el, index) => {
    el.addEventListener('click', () => selectOption(index));
});

nextBtn.addEventListener('click', goToNext);
resetBtn.addEventListener('click', resetGame);
hintBtn.addEventListener('click', useHint);
fiftyBtn.addEventListener('click', useFifty);
playAgainBtn.addEventListener('click', resetGame);

// ===== INICIAR =====
winnerCount.textContent = 125;
resetGame();

console.log('🏆 Pinolero Millonario - Versión mejorada');
console.log(`📚 Banco de ${QUESTION_BANK.length} preguntas`);
console.log(`🎲 50/50 cuesta ${formatCurrency(FIFTY_COST)}`);
console.log(`💡 Pista cuesta ${formatCurrency(HINT_COST)}`);