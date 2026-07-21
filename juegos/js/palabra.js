// ============================================================
// LABERINTO EXTREMO NICARAGUA - Lógica del juego
// ============================================================

import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, getDoc, updateDoc, collection, addDoc, query, where, getDocs } from "firebase/firestore";

// Configuración de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyA6jVICuE17KJcO34gE1brMxqWEfNd3Fy0",
    authDomain: "mapa-41b00.firebaseapp.com",
    projectId: "mapa-41b00",
    storageBucket: "mapa-41b00.firebasestorage.app",
    messagingSenderId: "535032835400",
    appId: "1:535032835400:web:68c079cbc3f419eafd177d",
    measurementId: "G-7R3DSH7PPN"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Elementos del DOM
const storyBox = document.getElementById("storyBox");
const gameContainer = document.getElementById("gameContainer");
const startBtn = document.getElementById("startGameBtn");
const authWarning = document.getElementById("authWarning");
const notification = document.getElementById("notification");
const canvas = document.getElementById("mazeCanvas");
const ctx = canvas.getContext("2d");
const levelText = document.getElementById("levelText");
const missionText = document.getElementById("missionText");

// Variables del juego
const tileSize = 35;
let currentLevel = 0;
let player = { x: 1, y: 1 };
let collected = [];
let gameCompletedFlag = false;
let currentUser = null;

// Mapa base
const baseMap = [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0,0,0,2,1],
    [1,0,1,0,1,0,1,1,1,0,1,0,1,1,1,1,1,0,1,1],
    [1,0,1,0,0,0,1,0,1,0,0,0,1,0,0,0,1,0,0,1],
    [1,0,1,1,1,0,1,0,1,1,1,1,1,0,1,0,1,1,0,1],
    [1,0,0,0,1,0,1,0,0,0,0,0,1,0,1,0,0,0,0,1],
    [1,1,1,0,1,0,1,1,1,1,1,0,1,0,1,1,1,1,0,1],
    [1,0,0,0,1,0,0,0,0,0,1,0,1,0,0,0,0,1,0,1],
    [1,0,1,1,1,1,1,1,1,0,1,0,1,1,1,1,0,1,0,1],
    [1,0,0,0,0,0,0,0,1,0,1,0,0,0,0,1,0,0,0,1],
    [1,1,1,1,1,1,1,0,1,0,1,1,1,1,0,1,1,1,0,1],
    [1,0,0,0,0,0,1,0,1,0,0,0,0,1,0,0,0,1,0,1],
    [1,0,1,1,1,0,1,0,1,1,1,1,0,1,1,1,0,1,0,1],
    [1,0,0,0,1,0,0,0,0,0,0,1,0,0,0,1,0,0,0,1],
    [1,1,1,0,1,1,1,1,1,1,0,1,1,1,0,1,1,1,0,1],
    [1,0,0,0,0,0,0,0,0,1,0,0,0,1,0,0,0,1,0,1],
    [1,0,1,1,1,1,1,1,0,1,1,1,0,1,1,1,0,1,0,1],
    [1,0,0,0,0,0,0,1,0,0,0,1,0,0,0,0,0,1,0,1],
    [1,1,1,1,1,1,0,1,1,1,0,1,1,1,1,1,0,0,0,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
];

// Datos turísticos
const touristData = [
    [
        { x: 3, y: 5, text: "🏛 Granada: ciudad colonial llena de historia." },
        { x: 10, y: 15, text: "🌊 San Juan del Sur: playas ideales para surf." },
        { x: 17, y: 3, text: "🌋 Ometepe: isla volcánica única en el mundo." }
    ],
    [
        { x: 5, y: 9, text: "☕ Matagalpa: café y clima fresco." },
        { x: 13, y: 13, text: "🏝 Corn Island: paraíso caribeño." },
        { x: 16, y: 17, text: "🎨 León: arte y cultura nicaragüense." }
    ],
    [
        { x: 7, y: 1, text: "🌲 Jinotega: montañas y naturaleza." },
        { x: 2, y: 17, text: "🌋 Masaya: famoso por su volcán activo." },
        { x: 18, y: 9, text: "🌴 Bluefields: cultura caribeña." }
    ],
    [
        { x: 8, y: 7, text: "🏞 Estelí: paisajes impresionantes." },
        { x: 14, y: 5, text: "🌊 Laguna de Apoyo: reserva natural." },
        { x: 4, y: 13, text: "⛪ Catedral de León: patrimonio histórico." }
    ],
    [
        { x: 6, y: 18, text: "🏝 Little Corn Island: playas paradisíacas." },
        { x: 15, y: 1, text: "🌋 Cerro Negro: volcán para sandboarding." },
        { x: 11, y: 11, text: "🌄 Cañón de Somoto: aventura natural." }
    ]
];

// ====================== FUNCIONES ======================

function showNotification(text, isError = false) {
    notification.innerHTML = text;
    notification.classList.add("show");
    if (isError) {
        notification.classList.add("error");
    } else {
        notification.classList.remove("error");
    }
    setTimeout(() => {
        notification.classList.remove("show");
    }, 3500);
}

async function awardPoints(pointsToAdd, gameId) {
    if (gameCompletedFlag) return;
    if (!currentUser) {
        showNotification("⚠️ No hay usuario autenticado. No se pueden guardar puntos.", true);
        return;
    }

    try {
        const usersRef = collection(db, "usuarios");
        const q = query(usersRef, where("uid", "==", currentUser.uid));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            console.error("Usuario no encontrado en Firestore");
            showNotification("❌ Error: No se encontró tu perfil de puntos.", true);
            return;
        }

        const userDoc = querySnapshot.docs[0];
        const userDocRef = userDoc.ref;
        const currentPoints = userDoc.data().puntos || 0;

        const progressRef = collection(db, "progreso_juegos");
        const qProgress = query(progressRef, where("usuarioId", "==", currentUser.uid), where("juegoId", "==", gameId));
        const progressSnap = await getDocs(qProgress);

        if (!progressSnap.empty) {
            showNotification("ℹ️ Ya recibiste los puntos por completar este juego anteriormente.", false);
            return;
        }

        const nuevosPuntos = currentPoints + pointsToAdd;
        await updateDoc(userDocRef, { puntos: nuevosPuntos });

        await addDoc(progressRef, {
            usuarioId: currentUser.uid,
            juegoId: gameId,
            puntosObtenidos: pointsToAdd,
            completado: true,
            fecha: new Date()
        });

        gameCompletedFlag = true;
        showNotification(`🎉 ¡FELICIDADES! Completaste toda la aventura. Ganaste ${pointsToAdd} puntos. Total: ${nuevosPuntos} puntos.`, false);
    } catch (error) {
        console.error("Error al guardar puntos:", error);
        showNotification("Error al guardar puntos. Intenta de nuevo más tarde.", true);
    }
}

function updateMission() {
    missionText.innerText = `Puntos encontrados: ${collected.length}/3`;
}

function drawMaze() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let y = 0; y < 20; y++) {
        for (let x = 0; x < 20; x++) {
            if (baseMap[y][x] === 1) {
                ctx.fillStyle = "#2a2560";
                ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
            } else {
                ctx.fillStyle = "#fbfbfb";
                ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
            }
            if (baseMap[y][x] === 2) {
                ctx.fillStyle = "#a4c737";
                ctx.beginPath();
                ctx.arc(x * tileSize + 17, y * tileSize + 17, 10, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowColor = "rgba(164, 199, 55, 0.5)";
                ctx.shadowBlur = 15;
                ctx.fill();
                ctx.shadowBlur = 0;
            }
        }
    }

    // Dibujar puntos turísticos
    touristData[currentLevel].forEach((point, index) => {
        if (!collected.includes(index)) {
            ctx.fillStyle = "#a287be";
            ctx.beginPath();
            ctx.arc(point.x * tileSize + 17, point.y * tileSize + 17, 8, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowColor = "rgba(162, 135, 190, 0.5)";
            ctx.shadowBlur = 12;
            ctx.fill();
            ctx.shadowBlur = 0;
        }
    });

    // Dibujar jugador
    ctx.fillStyle = "#00b4d8";
    ctx.shadowColor = "rgba(0, 180, 216, 0.5)";
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(player.x * tileSize + 17, player.y * tileSize + 17, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
}

function checkTouristPoints() {
    touristData[currentLevel].forEach((point, index) => {
        if (point.x === player.x && point.y === player.y && !collected.includes(index)) {
            collected.push(index);
            updateMission();
            showNotification(point.text, false);
        }
    });
}

function loadLevel() {
    player = { x: 1, y: 1 };
    collected = [];
    levelText.innerText = `Nivel ${currentLevel + 1}`;
    updateMission();
    drawMaze();
}

function movePlayer(dx, dy) {
    const newX = player.x + dx;
    const newY = player.y + dy;

    if (baseMap[newY][newX] === 1) return;

    player.x = newX;
    player.y = newY;

    checkTouristPoints();

    if (baseMap[newY][newX] === 2) {
        if (collected.length < 3) {
            showNotification("❌ Debes encontrar los 3 puntos turísticos antes de salir.", true);
        } else {
            if (currentLevel < 4) {
                showNotification(`🎉 Nivel ${currentLevel + 1} completado. ¡Siguiente nivel!`, false);
                currentLevel++;
                setTimeout(() => {
                    loadLevel();
                }, 1500);
            } else {
                showNotification("🏆 ¡Completaste toda la aventura turística de Nicaragua!", false);
                if (!gameCompletedFlag) {
                    awardPoints(50, "laberinto_nicaragua");
                }
                return;
            }
        }
    }
    drawMaze();
}

function startGame() {
    if (!currentUser) {
        authWarning.innerText = "⚠️ Debes iniciar sesión para jugar y ganar puntos. Ve a la página principal y regístrate.";
        authWarning.style.color = "#ffdd00";
        showNotification("🔐 Inicia sesión para guardar tu progreso y ganar puntos.", true);
        return;
    }
    authWarning.innerText = "✅ Sesión iniciada. ¡Puedes jugar y ganar puntos!";
    authWarning.style.color = "#aaffaa";
    storyBox.style.display = "none";
    gameContainer.style.display = "block";
    currentLevel = 0;
    gameCompletedFlag = false;
    loadLevel();
}

// ====================== EVENTOS ======================

onAuthStateChanged(auth, (user) => {
    currentUser = user;
    if (user) {
        authWarning.innerText = "✅ Sesión iniciada. ¡Puedes jugar y ganar puntos!";
        authWarning.style.color = "#aaffaa";
    } else {
        authWarning.innerText = "🔓 No has iniciado sesión. Inicia sesión para guardar tus puntos al completar el juego.";
        authWarning.style.color = "#ffdd00";
    }
});

startBtn.addEventListener("click", startGame);

window.addEventListener("keydown", (e) => {
    if (gameContainer.style.display !== "block") return;
    if (e.key === "ArrowUp") movePlayer(0, -1);
    if (e.key === "ArrowDown") movePlayer(0, 1);
    if (e.key === "ArrowLeft") movePlayer(-1, 0);
    if (e.key === "ArrowRight") movePlayer(1, 0);
    e.preventDefault();
});

document.getElementById("btnUp").addEventListener("click", () => movePlayer(0, -1));
document.getElementById("btnDown").addEventListener("click", () => movePlayer(0, 1));
document.getElementById("btnLeft").addEventListener("click", () => movePlayer(-1, 0));
document.getElementById("btnRight").addEventListener("click", () => movePlayer(1, 0));
