// ===== DATOS DEL JUEGO =====
const lugares = [
    {
        nombre: "Catedral de León",
        departamento: "León",
        imagen: "https://upload.wikimedia.org/wikipedia/commons/2/29/Catedral_Leon_Nicaragua.jpg",
        pista: "Tiene la catedral más grande de Centroamérica",
        region: "leon"
    },
    {
        nombre: "Isla de Ometepe",
        departamento: "Rivas",
        imagen: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/31/Ometepe.jpg/330px-Ometepe.jpg",
        pista: "Está formada por dos volcanes en un lago",
        region: "rivas"
    },
    {
        nombre: "Volcán Masaya",
        departamento: "Masaya",
        imagen: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/17/Cratervolcan.jpg/330px-Cratervolcan.jpg",
        pista: "Es conocido como 'La Boca del Infierno'",
        region: "masaya"
    },
    
    {
        nombre: "Corn Islands",
        departamento: "RAAS",
        imagen: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/CornIsland.JPG/250px-CornIsland.JPG",
        pista: "Islas caribeñas con aguas cristalinas",
        region: "raas"
    },
    {
        nombre: "Cañón de Somoto",
        departamento: "Madriz",
        imagen: "https://images.ctfassets.net/wka5p55uxbqr/7q7zDs3SLB8g8h1QnxWqcc/216faff814bf1489cff70d698cbee85e/canion-somoto.jpg?w=1920&q=90",
        pista: "Es un cañón formado por el río Coco",
        region: "madriz"
    },
    
];

// ===== MAPA DE DEPARTAMENTOS =====
const regionesMap = {
    leon: { nombre: 'León' },
    rivas: { nombre: 'Rivas' },
    madriz: { nombre: 'Madriz' },
    masaya: { nombre: 'Masaya' },
    raas: { nombre: 'RAAS' }
};

// ===== ESTADO DEL JUEGO =====
let currentPlace = null;
let currentRound = 0;
let score = 0;
let attempts = 3;
let gameOver = false;
let roundHistory = [];

// ===== ELEMENTOS DOM =====
const imageEl = document.getElementById('place-image');
const hintEl = document.getElementById('hint-text');
const scoreEl = document.getElementById('score-value');
const attemptsEl = document.getElementById('attempts-value');
const nextBtn = document.getElementById('next-round');
const resetBtn = document.getElementById('reset-game');
const feedbackEl = document.getElementById('click-feedback');
const resultModal = document.getElementById('result-modal');
const resultTitle = document.getElementById('result-title');
const resultMessage = document.getElementById('result-message');
const resultBtn = document.getElementById('result-button');
const deptButtons = document.querySelectorAll('.dept-btn');

// ===== DETECTAR DISPOSITIVO MÓVIL =====
function isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) 
           || window.innerWidth < 768;
}

// ===== INICIAR RONDA =====
function startRound() {
    if (gameOver || currentRound >= lugares.length) {
        finishGame();
        return;
    }

    currentPlace = lugares[currentRound];
    imageEl.src = currentPlace.imagen;
    imageEl.alt = `Foto de ${currentPlace.nombre}`;
    hintEl.textContent = currentPlace.pista;
    feedbackEl.textContent = 'Elige un departamento para adivinar';
    feedbackEl.style.color = '#1f5a77';
    
    // Resetear colores de los botones
    deptButtons.forEach(btn => {
        btn.classList.remove('correcto', 'incorrecto');
        btn.disabled = false;
    });

    // Ocultar modal
    resultModal.classList.add('hidden');
    
    // Resetear intentos
    attempts = 3;
    attemptsEl.textContent = attempts;
    
    // Deshabilitar botón siguiente hasta que adivine
    nextBtn.disabled = true;
}

// ===== MANEJAR CLICK EN BOTÓN =====
function handleDeptClick(regionKey, button) {
    if (!currentPlace || gameOver || nextBtn.disabled === false) return;
    if (attempts <= 0) return;

    const isCorrect = (regionKey === currentPlace.region);
    
    // Deshabilitar el botón clickeado
    button.disabled = true;
    
    if (isCorrect) {
        button.classList.add('correcto');
        score += 10 + (attempts * 2);
        scoreEl.textContent = score;
        feedbackEl.textContent = `✅ ¡Correcto! Era ${currentPlace.nombre}`;
        feedbackEl.style.color = '#2ecc71';
        roundHistory.push({ place: currentPlace.nombre, correct: true });
        
        // Vibración para móviles
        if (navigator.vibrate) navigator.vibrate([30, 50, 30]);
        
        // Deshabilitar todos los botones
        deptButtons.forEach(btn => btn.disabled = true);
        
        showResult(true);
        nextBtn.disabled = false;
    } else {
        button.classList.add('incorrecto');
        attempts--;
        attemptsEl.textContent = attempts;
        feedbackEl.textContent = `❌ No, ese es ${regionesMap[regionKey]?.nombre || 'otro departamento'}`;
        feedbackEl.style.color = '#e74c3c';
        
        // Vibración para móviles
        if (navigator.vibrate) navigator.vibrate(50);
        
        if (attempts === 0) {
            // Marcar el correcto
            deptButtons.forEach(btn => {
                if (btn.dataset.region === currentPlace.region) {
                    btn.classList.add('correcto');
                }
                btn.disabled = true;
            });
            feedbackEl.textContent = `😞 Era ${currentPlace.nombre} (${currentPlace.departamento})`;
            feedbackEl.style.color = '#e67e22';
            roundHistory.push({ place: currentPlace.nombre, correct: false });
            showResult(false);
            nextBtn.disabled = false;
        }
    }
}

// ===== MOSTRAR RESULTADO MODAL =====
function showResult(isCorrect) {
    if (gameOver || !currentPlace) return;
    
    resultTitle.textContent = isCorrect ? '🎉 ¡Correcto!' : '😅 ¡Fallaste!';
    resultTitle.className = isCorrect ? 'correcto' : 'incorrecto';
    resultMessage.textContent = isCorrect 
        ? `¡Eres un experto! Has identificado ${currentPlace.nombre}.` 
        : `La respuesta correcta era ${currentPlace.nombre}. ¡Sigue practicando!`;
    
    resultModal.classList.remove('hidden');
}

// ===== SIGUIENTE RONDA =====
function nextRound() {
    currentRound++;
    if (currentRound >= lugares.length) {
        finishGame();
    } else {
        startRound();
    }
}

// ===== FINALIZAR JUEGO =====
function finishGame() {
    gameOver = true;
    const total = lugares.length;
    const correctas = roundHistory.filter(r => r.correct).length;
    const porcentaje = Math.round((correctas / total) * 100);
    
    feedbackEl.textContent = `🏁 ¡Juego terminado! Acertaste ${correctas} de ${total} (${porcentaje}%)`;
    feedbackEl.style.color = '#0a3d5e';
    imageEl.src = '';
    hintEl.textContent = 'Juego completado';
    nextBtn.disabled = true;
    deptButtons.forEach(btn => btn.disabled = true);
    
    resultTitle.textContent = '🏁 ¡Fin del Juego!';
    resultTitle.className = '';
    resultMessage.innerHTML = `Acertaste <strong>${correctas}</strong> de ${total} lugares.<br>Puntuación final: <strong>${score}</strong> puntos.`;
    resultModal.classList.remove('hidden');
    resultBtn.textContent = '🔄 Jugar de Nuevo';
    resultBtn.onclick = resetGame;
}

// ===== REINICIAR JUEGO =====
function resetGame() {
    currentRound = 0;
    score = 0;
    attempts = 3;
    gameOver = false;
    roundHistory = [];
    scoreEl.textContent = '0';
    attemptsEl.textContent = '3';
    
    // Ocultar modal
    resultModal.classList.add('hidden');
    
    // Resetear botones
    deptButtons.forEach(btn => {
        btn.classList.remove('correcto', 'incorrecto');
        btn.disabled = false;
    });
    
    feedbackEl.textContent = 'Elige un departamento para adivinar';
    feedbackEl.style.color = '#1f5a77';
    
    // Resetear botón del modal
    resultBtn.textContent = 'Continuar';
    resultBtn.onclick = () => {
        resultModal.classList.add('hidden');
    };
    
    // Iniciar primera ronda
    startRound();
}

// ===== EVENT LISTENERS =====
// Botones de departamentos
deptButtons.forEach(btn => {
    btn.addEventListener('click', function() {
        handleDeptClick(this.dataset.region, this);
    });
    // Para móviles
    btn.addEventListener('touchstart', function(e) {
        // Prevenir doble ejecución
        if (!this.disabled) {
            handleDeptClick(this.dataset.region, this);
        }
    }, { passive: true });
});

nextBtn.addEventListener('click', function() {
    resultModal.classList.add('hidden');
    nextRound();
});

resetBtn.addEventListener('click', function() {
    resultModal.classList.add('hidden');
    resetGame();
});

resultBtn.addEventListener('click', function() {
    resultModal.classList.add('hidden');
    if (gameOver) {
        resetGame();
    }
});

// ===== INICIALIZAR JUEGO =====
document.addEventListener('DOMContentLoaded', function() {
    resetGame();
});
