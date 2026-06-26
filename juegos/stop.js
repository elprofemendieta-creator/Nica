const firebaseConfig = {
    apiKey: "AIzaSyA6jVICuE17KJcO34gE1brMxqWEfNd3Fy0",
    authDomain: "mapa-41b00.firebaseapp.com",
    projectId: "mapa-41b00",
    storageBucket: "mapa-41b00.firebasestorage.app",
    messagingSenderId: "535032835400",
    appId: "1:535032835400:web:68c079cbc3f419eafd177d"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

let currentUserData = null;
let currentRoomUnsub = null;
let currentTimer = null;

const sounds = {
    startRound: new Audio("https://www.soundjay.com/misc/sounds/bell-ringing-05.mp3"),
    stop: new Audio("https://www.soundjay.com/misc/sounds/alarm-clock-short-01.mp3"),
    correct: new Audio("https://www.soundjay.com/misc/sounds/button-press-01.mp3"),
    gameEnd: new Audio("https://www.soundjay.com/misc/sounds/applause-01.mp3"),
    tick: new Audio("https://www.soundjay.com/misc/sounds/metronome-tick-01.mp3")
};
Object.values(sounds).forEach(s => s.load());

function playSound(name) {
    if (localStorage.getItem('soundEnabled') !== 'false') {
        sounds[name].currentTime = 0;
        sounds[name].play().catch(e => console.log("Audio error", e));
    }
}

const authScreen = document.getElementById('authScreen');
const mainPanel = document.getElementById('mainPanel');
const continueBtn = document.getElementById('continueBtn');
const urlParams = new URLSearchParams(window.location.search);
const roomCodeFromUrl = urlParams.get('room');

// Autenticación
async function iniciarSesionAutomatica() {
    try {
        let user = auth.currentUser;
        if (!user) {
            const userCred = await auth.signInAnonymously();
            user = userCred.user;
        }
        const userRef = db.collection("usuarios").doc(user.uid);
        const snap = await userRef.get();
        if (!snap.exists) {
            const randomName = "Pinolero" + Math.floor(Math.random() * 1000);
            const avatarOptions = ["🌽", "🦜", "🌋", "🏝️", "🎭", "🇳🇮"];
            const avatar = avatarOptions[Math.floor(Math.random() * avatarOptions.length)];
            await userRef.set({
                uid: user.uid,
                nombre: randomName,
                avatar: avatar,
                nivel: "Novato Pinolero",
                experiencia: 0,
                puntosGlobales: 0,
                victorias: 0,
                partidasJugadas: 0,
                mejorPuntuacion: 0,
                isGuest: true
            });
            currentUserData = { uid: user.uid, nombre: randomName, avatar, nivel: "Novato Pinolero", puntosGlobales: 0, victorias: 0, partidasJugadas: 0 };
        } else {
            const data = snap.data();
            currentUserData = { uid: user.uid, ...data };
        }
        updateUserUI();
        mostrarPanelPrincipal();
        if (roomCodeFromUrl) setTimeout(() => joinRoomWithCode(roomCodeFromUrl), 1000);
    } catch (error) {
        console.error(error);
        alert("Error al conectar con la Guía Pinolera.\n" + error.message);
    }
}

continueBtn.addEventListener('click', async () => {
    continueBtn.disabled = true;
    continueBtn.textContent = 'Conectando...';
    await iniciarSesionAutomatica();
    continueBtn.disabled = false;
    continueBtn.textContent = '🎮 Continuar';
});

function updateUserUI() {
    if (!currentUserData) return;
    document.getElementById('userLevel').innerText = currentUserData.nivel || "Novato Pinolero";
    document.getElementById('userPoints').innerText = currentUserData.puntosGlobales || 0;
    document.getElementById('userWins').innerText = currentUserData.victorias || 0;
    const header = document.getElementById('userHeader');
    if (header) {
        header.innerHTML = `<div class="avatar">${currentUserData.avatar || '🇳🇮'}</div>
                            <div><strong>${currentUserData.nombre}</strong><br>⭐ ${currentUserData.puntosGlobales || 0} pts</div>
                            <button id="logoutBtn" class="btn">🚪 Salir</button>`;
        document.getElementById('logoutBtn')?.addEventListener('click', () => {
            auth.signOut();
            window.location.href = window.location.pathname;
        });
    }
}

function mostrarPanelPrincipal() {
    authScreen.style.display = 'none';
    mainPanel.style.display = 'block';
    loadMainMenu();
}

function loadMainMenu() {
    if (currentRoomUnsub) currentRoomUnsub();
    document.getElementById('dynamicView').innerHTML = `<div class="card">
        <h2>🎮 ¡Bienvenido a Stop Pinolero!</h2>
        <p>🇳🇮 Demuestra tu conocimiento. Crea una sala personalizada o únete con código.</p>
        <div style="text-align:center"><img src="https://cdn-icons-png.flaticon.com/512/1999/1999625.png" width="80"></div>
    </div>`;
}

// Modales
function openModal(id) { document.getElementById(id).style.display = 'flex'; }
function closeModals() { document.querySelectorAll('.modal').forEach(m => m.style.display = 'none'); }
document.querySelectorAll('.closeModal').forEach(btn => btn.addEventListener('click', closeModals));

document.getElementById('createRoomBtn').addEventListener('click', () => openModal('createRoomModal'));
document.getElementById('joinRoomBtn').addEventListener('click', () => openModal('joinRoomModal'));

function setupCustomCategories() {
    const container = document.getElementById('customCategoriesContainer');
    if (!container) return;
    container.innerHTML = '';
    for (let i = 1; i <= 5; i++) {
        const div = document.createElement('div');
        div.className = 'cat-input';
        div.innerHTML = `<label>🔖 Categoría ${i}</label><input type="text" id="cat${i}" placeholder="Ej: Volcán, Comida típica...">`;
        container.appendChild(div);
    }
}

document.getElementById('catStyleSelect').addEventListener('change', (e) => {
    if (e.target.value === 'custom') {
        document.getElementById('customCategoriesSection').style.display = 'block';
        setupCustomCategories();
    } else {
        document.getElementById('customCategoriesSection').style.display = 'none';
    }
});

// Crear sala (sin compartir)
document.getElementById('confirmCreateRoom').addEventListener('click', async () => {
    if (!currentUserData) return;
    const roomName = document.getElementById('roomName').value.trim() || "Sala Pinolera";
    const maxPlayers = parseInt(document.getElementById('maxPlayers').value);
    const roundTime = parseInt(document.getElementById('roundTime').value);
    const numRounds = parseInt(document.getElementById('numRounds').value);
    const catStyle = document.getElementById('catStyleSelect').value;

    let categories = [];
    if (catStyle === 'custom') {
        for (let i = 1; i <= 5; i++) {
            const val = document.getElementById(`cat${i}`)?.value.trim();
            if (val) categories.push(val);
        }
        if (categories.length === 0) categories = ["Categoría 1", "Categoría 2", "Categoría 3", "Categoría 4", "Categoría 5"];
    } else {
        categories = ["Nombre", "Apellidos", "Animal", "Color", "Ciudad/Lugar", "Cosa", "Fruta/Comida"];
    }

    const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    await db.collection("rooms").doc(roomId).set({
        roomId, roomName, host: currentUserData.uid, maxPlayers, roundTime, numRounds,
        categories: categories,
        players: [{ uid: currentUserData.uid, nombre: currentUserData.nombre, avatar: currentUserData.avatar, total: 0 }],
        state: "waiting", currentRound: 0, currentLetter: null, stopTriggered: false
    });
    await db.collection("rooms").doc(roomId).collection("messages").add({
        sender: "Sistema", text: `${currentUserData.nombre} creó la sala`, timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });

    closeModals();
    alert(`✅ Sala creada\nCódigo: ${roomId}`);
    loadRoomView(roomId);
    playSound("correct");
});

// Unirse a sala
async function joinRoomWithCode(code) {
    const roomRef = db.collection("rooms").doc(code);
    const snap = await roomRef.get();
    if (!snap.exists) { alert("Sala no encontrada"); return; }
    const room = snap.data();
    if (room.players.some(p => p.uid === currentUserData.uid)) { loadRoomView(code); return; }
    if (room.players.length >= room.maxPlayers) { alert("Sala llena"); return; }
    await roomRef.update({
        players: firebase.firestore.FieldValue.arrayUnion({
            uid: currentUserData.uid,
            nombre: currentUserData.nombre,
            avatar: currentUserData.avatar,
            total: 0
        })
    });
    await roomRef.collection("messages").add({
        sender: "Sistema", text: `${currentUserData.nombre} se unió`, timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });
    loadRoomView(code);
    playSound("correct");
}

document.getElementById('confirmJoinRoom').addEventListener('click', async () => {
    const code = document.getElementById('roomCodeInput').value.trim().toUpperCase();
    await joinRoomWithCode(code);
    closeModals();
});

// Vista de sala (sin botones de compartir)
async function loadRoomView(roomId) {
    if (currentRoomUnsub) currentRoomUnsub();
    const roomRef = db.collection("rooms").doc(roomId);
    currentRoomUnsub = roomRef.onSnapshot(async (roomSnap) => {
        if (!roomSnap.exists) { alert("Sala eliminada"); loadMainMenu(); return; }
        const room = roomSnap.data();
        const isHost = room.host === currentUserData.uid;
        const playersList = room.players;
        let html = `<div class="card">
            <h2>🏠 ${room.roomName} <span style="font-size:1rem; background:#eee; padding:4px 12px; border-radius:20px;">Código: ${roomId}</span></h2>
            <div class="grid-2">
                <div>
                    <h3>👥 Jugadores (${playersList.length}/${room.maxPlayers})</h3>
                    <ul>${playersList.map(p => `<li>${p.avatar || '🎭'} ${p.nombre} - ${p.total} pts</li>`).join('')}</ul>
                    ${isHost && room.state === 'waiting' ? '<button id="startGameBtn" class="btn btn-success">🚀 Iniciar Partida</button>' : '<p>⏳ Esperando al anfitrión...</p>'}
                </div>
                <div>
                    <h3>💬 Chat</h3>
                    <div id="chatMessages" class="chat-box"></div>
                    <input id="chatInput" placeholder="Escribe un mensaje..."><button id="sendChat" class="btn">Enviar</button>
                </div>
            </div>
        </div>`;
        document.getElementById('dynamicView').innerHTML = html;

        db.collection("rooms").doc(roomId).collection("messages").orderBy("timestamp", "asc").onSnapshot(snap => {
            const chatDiv = document.getElementById('chatMessages');
            if (chatDiv) chatDiv.innerHTML = snap.docs.map(d => `<div><b>${d.data().sender}</b>: ${d.data().text}</div>`).join('');
        });
        document.getElementById('sendChat')?.addEventListener('click', async () => {
            const msg = document.getElementById('chatInput').value;
            if (msg) await db.collection("rooms").doc(roomId).collection("messages").add({
                sender: currentUserData.nombre, text: msg, timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });
            document.getElementById('chatInput').value = '';
        });

        if (isHost && room.state === 'waiting') {
            document.getElementById('startGameBtn')?.addEventListener('click', async () => {
                const letter = String.fromCharCode(65 + Math.floor(Math.random() * 26));
                await roomRef.update({
                    state: "playing", currentRound: 1, currentLetter: letter,
                    roundStart: firebase.firestore.FieldValue.serverTimestamp(), stopTriggered: false
                });
                await roomRef.collection("messages").add({
                    sender: "Sistema", text: `🎲 ¡Ronda 1! Letra: ${letter}`, timestamp: firebase.firestore.FieldValue.serverTimestamp()
                });
                playSound("startRound");
                renderGameInterface(roomId, { ...room, currentRound: 1, currentLetter: letter });
            });
        }
        if (room.state === "playing") await renderGameInterface(roomId, room);
    });
}

// El resto del código (juego, validación, rondas, ranking, amigos, perfil, config) se mantiene exactamente igual a la versión anterior.
// ... (todo el código desde validateWord hasta el final permanece sin cambios)
