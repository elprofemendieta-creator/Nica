// ============================================================
// MEMORIA TURÍSTICA - Lógica del juego
// ============================================================

import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import {
    getFirestore,
    doc,
    getDoc,
    updateDoc,
    collection,
    addDoc,
    query,
    where,
    getDocs
} from "firebase/firestore";

// ============================================================
// 1. CONFIGURACIÓN DE FIREBASE
// ============================================================
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

// ============================================================
// 2. DATOS DEL JUEGO
// ============================================================
const lugares = [
    { id: 1, titulo: "Granada", descripcion: "Ciudad colonial famosa por su arquitectura histórica." },
    { id: 2, titulo: "Ometepe", descripcion: "Isla formada por dos volcanes en el Lago Cocibolca." },
    { id: 3, titulo: "Corn Island", descripcion: "Playas paradisíacas del Caribe nicaragüense." },
    { id: 4, titulo: "León", descripcion: "Ciudad cultural conocida por volcanes y arte." },
    { id: 5, titulo: "San Juan del Sur", descripcion: "Destino turístico famoso por sus playas y surf." },
    { id: 6, titulo: "Matagalpa", descripcion: "Región montañosa reconocida por su café y clima fresco." }
];

// ============================================================
// 3. VARIABLES DE ESTADO
// ============================================================
let cards = [];
let firstCard = null;
let secondCard = null;
let lockBoard = false;
let parejas = 0;
let gameCompleted = false;
let currentUser = null;

const board = document.getElementById("gameBoard");
const statusEl = document.getElementById("status");
const pairCountEl = document.getElementById("pairCount");
const totalPairsEl = document.getElementById("totalPairs");

totalPairsEl.textContent = lugares.length;

// ============================================================
// 4. CONSTRUIR MAZO DE CARTAS
// ============================================================
lugares.forEach(lugar => {
    cards.push({ id: lugar.id, text: lugar.titulo, esTitulo: true });
    cards.push({ id: lugar.id, text: lugar.descripcion, esTitulo: false });
});

// Barajar
cards.sort(() => Math.random() - 0.5);

// ============================================================
// 5. RENDERIZAR TABLERO
// ============================================================
cards.forEach(cardData => {
    const card = document.createElement("div");
    card.classList.add("card");
    card.dataset.id = cardData.id;

    const backClass = cardData.esTitulo ? "back titulo" : "back";

    card.innerHTML = `
        <div class="card-inner">
            <div class="front">❓</div>
            <div class="${backClass}">${cardData.text}</div>
        </div>
    `;

    card.addEventListener("click", () => flipCard(card));
    board.appendChild(card);
});

// ============================================================
// 6. LÓGICA DEL JUEGO
// ============================================================
function flipCard(card) {
    if (lockBoard) return;
    if (card === firstCard) return;
    if (card.classList.contains("flipped")) return;

    card.classList.add("flipped");

    if (!firstCard) {
        firstCard = card;
        return;
    }

    secondCard = card;
    checkMatch();
}

function checkMatch() {
    const isMatch = firstCard.dataset.id === secondCard.dataset.id;

    if (isMatch) {
        parejas++;
        pairCountEl.textContent = parejas;
        updateStatusMessage();

        if (parejas === lugares.length) {
            // Victoria
            statusEl.innerHTML = `
                <span class="victory">🎉 ¡Excelente! Encontraste todas las parejas turísticas.</span>
                <span class="pairs-counter">🏆 <span>${parejas}</span> / <span>${lugares.length}</span></span>
            `;
            if (currentUser && !gameCompleted) {
                awardPoints(10, "memoria_turistica_nicaragua");
            }
        }

        resetBoard();
    } else {
        lockBoard = true;
        setTimeout(() => {
            firstCard.classList.remove("flipped");
            secondCard.classList.remove("flipped");
            resetBoard();
        }, 1000);
    }
}

function resetBoard() {
    [firstCard, secondCard] = [null, null];
    lockBoard = false;
}

function updateStatusMessage() {
    const msg = statusEl.querySelector("span:first-child");
    if (msg && !statusEl.querySelector(".victory")) {
        const restante = lugares.length - parejas;
        msg.textContent = restante === 0
            ? "🎉 ¡Completaste todas!"
            : `🧩 Encuentra ${restante} pareja${restante > 1 ? 's' : ''} más`;
    }
}

// ============================================================
// 7. FUNCIÓN PARA OTORGAR PUNTOS (Firestore)
// ============================================================
async function awardPoints(pointsToAdd, gameId) {
    if (gameCompleted) return;
    if (!currentUser) {
        console.warn("Usuario no autenticado. Puntos no guardados.");
        return;
    }

    try {
        const usersRef = collection(db, "usuarios");
        const q = query(usersRef, where("uid", "==", currentUser.uid));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            console.error("Usuario no encontrado en Firestore");
            return;
        }

        const userDoc = querySnapshot.docs[0];
        const userDocRef = userDoc.ref;
        const currentPoints = userDoc.data().puntos || 0;

        const progressRef = collection(db, "progreso_juegos");
        const qProgress = query(
            progressRef,
            where("usuarioId", "==", currentUser.uid),
            where("juegoId", "==", gameId)
        );
        const progressSnap = await getDocs(qProgress);

        if (!progressSnap.empty) {
            alert("Ya recibiste los puntos por este juego anteriormente.");
            gameCompleted = true;
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

        gameCompleted = true;
        alert(`¡Felicidades! Has ganado ${pointsToAdd} puntos. Total: ${nuevosPuntos}`);
    } catch (error) {
        console.error("Error al guardar puntos:", error);
        alert("Ocurrió un error al guardar los puntos. Intenta de nuevo.");
    }
}

// ============================================================
// 8. AUTENTICACIÓN
// ============================================================
onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = user;
        console.log("Usuario autenticado:", user.email);
    } else {
        currentUser = null;
        console.log("Usuario no autenticado. Los puntos no se guardarán.");
    }
});

// ============================================================
// 9. EXPORTAR FUNCIONES (si es necesario)
// ============================================================
console.log("¡Juego de Memoria Turística cargado correctamente!");
