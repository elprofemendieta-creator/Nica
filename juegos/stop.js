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
    startRound: new Audio("https://www.epidemicsound.com/es/sound-effects/tracks/c964d0a3-9514-4270-959e-e08a11ebe30b.mp3"),
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

// Autenticación automática
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
            const avatar = ["🌽", "🦜", "🌋", "🏝️", "🎭", "🇳🇮"][Math.floor(Math.random() * 6)];
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
        // Asegurar valores mínimos para evitar undefined
        currentUserData.nombre = currentUserData.nombre || "Pinolero";
        currentUserData.avatar = currentUserData.avatar || "🎭";
        currentUserData.puntosGlobales = currentUserData.puntosGlobales || 0;
        currentUserData.victorias = currentUserData.victorias || 0;
        currentUserData.partidasJugadas = currentUserData.partidasJugadas || 0;
        currentUserData.nivel = currentUserData.nivel || "Novato Pinolero";
        currentUserData.experiencia = currentUserData.experiencia || 0;

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
    document.getElementById('userLevel').innerText = currentUserData.nivel;
    document.getElementById('userPoints').innerText = currentUserData.puntosGlobales;
    document.getElementById('userWins').innerText = currentUserData.victorias;
    const header = document.getElementById('userHeader');
    if (header) {
        header.innerHTML = `<div class="avatar">${currentUserData.avatar}</div>
                            <div><strong>${currentUserData.nombre}</strong><br>⭐ ${currentUserData.puntosGlobales} pts</div>
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

// Crear sala (valores asegurados)
document.getElementById('confirmCreateRoom').addEventListener('click', async () => {
    if (!currentUserData) return alert("Debes iniciar sesión primero.");
    const roomName = document.getElementById('roomName').value.trim() || "Sala Pinolera";
    const maxPlayers = parseInt(document.getElementById('maxPlayers').value) || 4;
    const roundTime = parseInt(document.getElementById('roundTime').value) || 60;
    const numRounds = parseInt(document.getElementById('numRounds').value) || 3;
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
    try {
        await db.collection("rooms").doc(roomId).set({
            roomId: roomId,
            roomName: roomName,
            host: currentUserData.uid,
            maxPlayers: maxPlayers,
            roundTime: roundTime,
            numRounds: numRounds,
            categories: categories,
            players: [{
                uid: currentUserData.uid,
                nombre: currentUserData.nombre || "Jugador",
                avatar: currentUserData.avatar || "🎭",
                total: 0
            }],
            state: "waiting",
            currentRound: 0,
            currentLetter: null,
            stopTriggered: false
        });
        await db.collection("rooms").doc(roomId).collection("messages").add({
            sender: "Sistema",
            text: `${currentUserData.nombre} creó la sala`,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        closeModals();
        alert(`✅ Sala creada. Código: ${roomId}`);
        loadRoomView(roomId);
        playSound("correct");
    } catch (error) {
        console.error(error);
        alert("Error al crear sala: " + error.message);
    }
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
            nombre: currentUserData.nombre || "Jugador",
            avatar: currentUserData.avatar || "🎭",
            total: 0
        })
    });
    await roomRef.collection("messages").add({
        sender: "Sistema",
        text: `${currentUserData.nombre} se unió`,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });
    loadRoomView(code);
    playSound("correct");
}

document.getElementById('confirmJoinRoom').addEventListener('click', async () => {
    const code = document.getElementById('roomCodeInput').value.trim().toUpperCase();
    await joinRoomWithCode(code);
    closeModals();
});

// Vista de sala
async function loadRoomView(roomId) {
    if (currentRoomUnsub) currentRoomUnsub();
    const roomRef = db.collection("rooms").doc(roomId);
    currentRoomUnsub = roomRef.onSnapshot(async (roomSnap) => {
        if (!roomSnap.exists) { alert("Sala eliminada"); loadMainMenu(); return; }
        const room = roomSnap.data();
        const isHost = room.host === currentUserData.uid;
        const playersList = room.players || [];
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
                sender: currentUserData.nombre || "Anónimo",
                text: msg,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
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

function validateWord(word, letter) {
    if (!word) return false;
    const normalized = word.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    return normalized.startsWith(letter.toLowerCase());
}

async function autoSaveAnswer(roomId, category, value, round) {
    if (!currentUserData) return;
    const answersRef = db.collection("rooms").doc(roomId).collection("answers").doc(currentUserData.uid);
    const docSnap = await answersRef.get();
    let currentAnswers = {};
    if (docSnap.exists && docSnap.data().round === round) {
        currentAnswers = docSnap.data().answers;
    }
    currentAnswers[category] = value;
    await answersRef.set({ uid: currentUserData.uid, answers: currentAnswers, round: round });
}

async function renderGameInterface(roomId, room) {
    const categories = room.categories;
    const letter = room.currentLetter;
    let formHtml = `<div class="card"><h2>🎲 Ronda ${room.currentRound}/${room.numRounds} | Letra: ${letter}</h2>
                 <div id="timerDisplay" style="font-size:2.5rem; font-weight:bold; text-align:center">⏱️ --</div>
                 <button id="stopBtnGlobal" class="btn btn-stop">🛑 STOP</button>
                 <div class="category-grid" id="catsGrid"></div></div>
                 <div id="roundResults"></div>`;
    document.getElementById('dynamicView').innerHTML = formHtml;

    const container = document.getElementById('catsGrid');
    const answersDoc = await db.collection("rooms").doc(roomId).collection("answers").doc(currentUserData.uid).get();
    let savedAnswers = {};
    if (answersDoc.exists && answersDoc.data().round === room.currentRound) savedAnswers = answersDoc.data().answers;

    for (let cat of categories) {
        const savedVal = savedAnswers[cat] || "";
        const icon = savedVal ? (validateWord(savedVal, letter) ? "✅" : "❌") : "⚪";
        const catDiv = document.createElement('div');
        catDiv.className = 'cat-input';
        catDiv.innerHTML = `<label>${cat}</label>
                            <div class="input-wrapper">
                                <input type="text" class="answer-input" data-cat="${cat}" value="${escapeHtml(savedVal)}" placeholder="Palabra con ${letter}...">
                                <span class="validation-icon">${icon}</span>
                            </div>`;
        container.appendChild(catDiv);
        const input = catDiv.querySelector('.answer-input');
        const iconSpan = catDiv.querySelector('.validation-icon');
        input.addEventListener('input', async (e) => {
            const word = e.target.value.trim();
            if (!word) {
                iconSpan.textContent = "⚪";
            } else {
                const valid = validateWord(word, letter);
                iconSpan.textContent = valid ? "✅" : "❌";
                if (valid) playSound("correct");
            }
            await autoSaveAnswer(roomId, cat, word, room.currentRound);
        });
    }

    let timeLeft = room.roundTime;
    const timerElem = document.getElementById('timerDisplay');
    if (currentTimer) clearInterval(currentTimer);
    currentTimer = setInterval(async () => {
        if (timeLeft <= 0) {
            clearInterval(currentTimer);
            await finishRound(roomId);
        } else {
            timerElem.innerText = `⏱️ ${timeLeft} segundos`;
            timeLeft--;
        }
    }, 1000);

    document.getElementById('stopBtnGlobal')?.addEventListener('click', async () => {
        const roomSnap = await db.collection("rooms").doc(roomId).get();
        if (roomSnap.data().stopTriggered) return;
        await db.collection("rooms").doc(roomId).update({ stopTriggered: true });
        await db.collection("rooms").doc(roomId).collection("messages").add({
            sender: "Sistema", text: `${currentUserData.nombre} presionó STOP! ⏰ 10 segundos restantes`, timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        playSound("stop");
        const stopOverlay = document.createElement('div');
        stopOverlay.className = 'stop-overlay';
        stopOverlay.innerHTML = `<div>¡STOP! ⏰</div><div class="count">10</div>`;
        document.body.appendChild(stopOverlay);
        let counter = 10;
        const countdown = setInterval(() => {
            counter--;
            if (counter >= 0) stopOverlay.querySelector('.count').innerText = counter;
            else clearInterval(countdown);
        }, 1000);
        setTimeout(() => { stopOverlay.remove(); clearInterval(countdown); }, 10000);
        setTimeout(() => finishRound(roomId), 10000);
    });
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[m]);
}

async function finishRound(roomId) {
    clearInterval(currentTimer);
    const overlay = document.querySelector('.stop-overlay');
    if (overlay) overlay.remove();

    const roomRef = db.collection("rooms").doc(roomId);
    const roomSnap = await roomRef.get();
    const room = roomSnap.data();
    if (!room) return;

    const answersSnap = await db.collection(`rooms/${roomId}/answers`).get();
    const allAnswers = {};
    answersSnap.forEach(docu => { allAnswers[docu.id] = docu.data(); });

    const categoriesList = room.categories;
    const playersList = room.players;

    let votingHtml = `<div class="card"><h3>📋 Validar respuestas - Ronda ${room.currentRound}</h3>`;
    for (let cat of categoriesList) {
        votingHtml += `<h4>📌 ${cat}</h4><table class="answers-table">`;
        votingHtml += `<tr><th>Jugador</th><th>Respuesta</th><th>Votación</th></tr>`;
        for (let player of playersList) {
            const answerObj = allAnswers[player.uid];
            const word = answerObj && answerObj.round === room.currentRound ? (answerObj.answers[cat] || "") : "";
            const votesRef = db.collection("rooms").doc(roomId).collection("votes");
            const qVotes = await votesRef.where("round", "==", room.currentRound)
                .where("category", "==", cat).where("playerUid", "==", player.uid).get();
            let incorrectCount = 0;
            qVotes.forEach(v => { if (v.data().vote === false) incorrectCount++; });
            const isInvalid = incorrectCount > (playersList.length / 2);
            votingHtml += `<tr>
                 <td>${player.nombre}</td>
                 <td>${word || "(vacío)"}</td>
                 <td class="vote-group">
                     <button class="vote-btn vote-correct" data-cat="${cat}" data-player="${player.uid}" data-vote="true">✅ Correcta</button>
                     <button class="vote-btn vote-incorrect" data-cat="${cat}" data-player="${player.uid}" data-vote="false">❌ Incorrecta</button>
                     ${isInvalid ? '<span style="margin-left:8px;">🚫 Anulada</span>' : ''}
                 </td>
             </tr>`;
        }
        votingHtml += `</table>`;
    }
    votingHtml += `<button id="finalizeVotingBtn" class="btn btn-primary">✅ Finalizar ronda</button></div>`;
    document.getElementById('dynamicView').innerHTML = votingHtml;

    document.querySelectorAll('.vote-correct, .vote-incorrect').forEach(btn => {
        btn.addEventListener('click', async () => {
            const category = btn.dataset.cat;
            const playerUid = btn.dataset.player;
            const voteValue = btn.dataset.vote === 'true';
            const voteId = `${room.currentRound}_${category}_${playerUid}_${currentUserData.uid}`;
            await db.collection("rooms").doc(roomId).collection("votes").doc(voteId).set({
                round: room.currentRound, category, playerUid, voter: currentUserData.uid,
                vote: voteValue, timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });
            finishRound(roomId);
        });
    });

    document.getElementById('finalizeVotingBtn')?.addEventListener('click', async () => {
        const allVotesSnap = await db.collection("rooms").doc(roomId).collection("votes").get();
        const invalidMap = new Map();
        allVotesSnap.forEach(vote => {
            const v = vote.data();
            if (v.round === room.currentRound) {
                const key = `${v.category}_${v.playerUid}`;
                if (!invalidMap.has(key)) invalidMap.set(key, []);
                invalidMap.get(key).push(v.vote === false);
            }
        });
        const invalidSet = new Set();
        for (let [key, votes] of invalidMap.entries()) {
            const incorrectCount = votes.filter(v => v === true).length;
            if (incorrectCount > (playersList.length / 2)) invalidSet.add(key);
        }

        const scores = {};
        playersList.forEach(p => scores[p.uid] = 0);
        for (let cat of categoriesList) {
            const wordMap = new Map();
            for (let player of playersList) {
                const key = `${cat}_${player.uid}`;
                if (invalidSet.has(key)) continue;
                const answerObj = allAnswers[player.uid];
                const word = answerObj && answerObj.round === room.currentRound ? (answerObj.answers[cat] || "").trim().toLowerCase() : "";
                if (word && word !== "") {
                    if (!wordMap.has(word)) wordMap.set(word, []);
                    wordMap.get(word).push(player.uid);
                }
            }
            for (let [word, uids] of wordMap.entries()) {
                let points = (uids.length === 1) ? 2 : 1;
                uids.forEach(uid => scores[uid] += points);
            }
        }

        let maxScore = 0, winnerUid = null;
        for (let [uid, pts] of Object.entries(scores)) {
            if (pts > maxScore) { maxScore = pts; winnerUid = uid; }
        }

        const newPlayers = room.players.map(p => ({
            ...p,
            total: p.total + (scores[p.uid] || 0) + ((p.uid === winnerUid) ? 5 : 0)
        }));

        await roomRef.update({ players: newPlayers, stopTriggered: false });
        await roomRef.collection("messages").add({
            sender: "Sistema",
            text: `📊 Ronda ${room.currentRound}: ${winnerUid === currentUserData.uid ? "¡Ganaste! +5" : "Finalizada"}`,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });

        if (room.currentRound >= room.numRounds) {
            finalizeGame(roomId);
        } else {
            const newLetter = String.fromCharCode(65 + Math.floor(Math.random() * 26));
            await roomRef.update({
                currentRound: firebase.firestore.FieldValue.increment(1),
                currentLetter: newLetter,
                roundStart: firebase.firestore.FieldValue.serverTimestamp(),
                stopTriggered: false
            });
            await roomRef.collection("messages").add({
                sender: "Sistema", text: `🔄 Nueva Ronda ${room.currentRound + 1} - Letra: ${newLetter}`, timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });
            playSound("startRound");
            const updatedRoom = (await roomRef.get()).data();
            renderGameInterface(roomId, updatedRoom);
        }
    });
}

async function finalizeGame(roomId) {
    const roomRef = db.collection("rooms").doc(roomId);
    const snap = await roomRef.get();
    const room = snap.data();
    const sorted = [...room.players].sort((a, b) => b.total - a.total);
    const winner = sorted[0];

    for (let player of room.players) {
        const userRef = db.collection("usuarios").doc(player.uid);
        const userSnap = await userRef.get();
        if (userSnap.exists) {
            const data = userSnap.data();
            await userRef.update({
                partidasJugadas: (data.partidasJugadas || 0) + 1,
                puntosGlobales: (data.puntosGlobales || 0) + player.total,
                victorias: (player.uid === winner.uid) ? (data.victorias || 0) + 1 : (data.victorias || 0)
            });
        }
    }

    await roomRef.collection("messages").add({
        sender: "Sistema", text: `🏆 ¡FIN! Ganador: ${winner.nombre} (${winner.total} pts)`, timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });
    playSound("gameEnd");
    document.getElementById('dynamicView').innerHTML = `<div class="card"><h2>🏁 Partida finalizada</h2>
        <p>🥇 ${sorted[0]?.nombre} - ${sorted[0]?.total} pts</p>
        <p>🥈 ${sorted[1]?.nombre} - ${sorted[1]?.total} pts</p>
        <p>🥉 ${sorted[2]?.nombre} - ${sorted[2]?.total} pts</p>
        <button class="btn" onclick="location.reload()">Volver al inicio</button></div>`;
    await roomRef.update({ state: "finished" });
}

// Ranking, amigos, perfil, config
document.getElementById('rankingBtn').addEventListener('click', async () => {
    const q = db.collection("usuarios").orderBy("puntosGlobales", "desc").limit(20);
    const snap = await q.get();
    let rankHtml = `<div class="card"><h2>🏆 Ranking Global</h2><ol>`;
    snap.forEach(docu => { let d = docu.data(); rankHtml += `<li><strong>${d.nombre}</strong> - ${d.puntosGlobales || 0} pts - ${d.nivel}</li>`; });
    rankHtml += `</ol></div>`;
    document.getElementById('dynamicView').innerHTML = rankHtml;
});

document.getElementById('friendsBtn').addEventListener('click', async () => {
    const q = db.collection("amigos").where("usuario", "==", currentUserData.uid).where("estado", "==", "aceptado");
    const snap = await q.get();
    let html = `<div class="card"><h2>👥 Mis Amigos</h2><input id="searchFriend" placeholder="Buscar por nombre..."><button id="searchBtn" class="btn">🔍 Buscar</button><ul id="friendList">`;
    snap.forEach(d => html += `<li>👤 ${d.data().amigoNombre || d.data().amigo}</li>`);
    html += `</ul></div>`;
    document.getElementById('dynamicView').innerHTML = html;
    document.getElementById('searchBtn').addEventListener('click', async () => {
        const search = document.getElementById('searchFriend').value;
        const res = await db.collection("usuarios").orderBy("nombre").startAt(search).endAt(search + "\uf8ff").limit(5).get();
        let list = '<h4>Resultados</h4>';
        res.forEach(u => {
            if (u.id !== currentUserData.uid) list += `<div>${u.data().nombre} <button class="sendRequestBtn" data-uid="${u.id}">➕ Agregar</button></div>`;
        });
        document.getElementById('friendList').innerHTML = list;
        document.querySelectorAll('.sendRequestBtn').forEach(btn => btn.addEventListener('click', async () => {
            const friendId = btn.dataset.uid;
            const friendDoc = await db.collection("usuarios").doc(friendId).get();
            await db.collection("amigos").add({
                usuario: currentUserData.uid, amigo: friendId, estado: "pendiente",
                amigoNombre: friendDoc.data().nombre, timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });
            alert("Solicitud enviada");
        }));
    });
});

document.getElementById('profileBtn').addEventListener('click', () => {
    const u = currentUserData;
    document.getElementById('dynamicView').innerHTML = `<div class="card"><h2>👤 Mi Perfil</h2>
        <p>🎭 Avatar: ${u.avatar}</p><p>📛 Nombre: ${u.nombre}</p>
        <p>🏅 Nivel: ${u.nivel}</p><p>⭐ Experiencia: ${u.experiencia || 0}</p>
        <p>💰 Puntos: ${u.puntosGlobales}</p><p>🎮 Partidas: ${u.partidasJugadas}</p>
        <p>🏆 Victorias: ${u.victorias}</p>
        <button id="toggleDark" class="btn">🌙 Modo Oscuro</button>
        <button id="shareProfile" class="btn">🔗 Compartir perfil</button></div>`;
    document.getElementById('toggleDark')?.addEventListener('click', () => {
        document.body.classList.toggle('dark');
        localStorage.setItem('darkMode', document.body.classList.contains('dark'));
    });
    document.getElementById('shareProfile')?.addEventListener('click', () => {
        alert(`Comparte: ${window.location.origin}/u/${currentUserData.uid}`);
    });
    if (localStorage.getItem('darkMode') === 'true') document.body.classList.add('dark');
});

document.getElementById('settingsBtn').addEventListener('click', () => {
    const soundEnabled = localStorage.getItem('soundEnabled') !== 'false';
    document.getElementById('dynamicView').innerHTML = `<div class="card"><h2>⚙️ Configuración</h2>
        <label><input type="checkbox" id="soundToggle" ${soundEnabled ? 'checked' : ''}> 🔊 Activar sonidos</label><br>
        <button id="saveSettings" class="btn">Guardar</button></div>`;
    document.getElementById('saveSettings').addEventListener('click', () => {
        const enabled = document.getElementById('soundToggle').checked;
        localStorage.setItem('soundEnabled', enabled);
        alert("Preferencias guardadas");
    });
});

if (localStorage.getItem('darkMode') === 'true') document.body.classList.add('dark');
window.loadRoomView = loadRoomView;
