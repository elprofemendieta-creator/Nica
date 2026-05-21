// ========== SCRIPT PRINCIPAL CON MAPA + AUTENTICACIÓN + GPS ==========
let map;
let markerCluster;
let currentLayers = {};
let allPlaces = [];
let isAdmin = false;
let currentUser = null;
let userPoints = 0;
let gpsActive = false;
let watchId = null;
let userDocId = null;

const ADMIN_PASSWORD = "Diriamba2026";

// DOM elements
const darkModeBtn = document.getElementById('darkModeBtn');
const adminLoginBtn = document.getElementById('adminLoginBtn');
const adminPanelHeader = document.getElementById('adminPanelHeader');
const logoutAdminBtn = document.getElementById('logoutAdminBtn');
const adminModal = document.getElementById('adminModal');
const lugarModal = document.getElementById('lugarModal');
const searchInput = document.getElementById('searchInput');
const categoriasFiltro = document.getElementById('categoriasFiltro');
const placesList = document.getElementById('placesList');
const adminAddBtn = document.getElementById('adminAddBtn');
const addPlaceBtn = document.getElementById('addPlaceBtn');
const lugarForm = document.getElementById('lugarForm');
const modalTitle = document.getElementById('modalTitle');
const geolocationBtn = document.getElementById('geolocationBtn');
const userBtn = document.getElementById('userBtn');
const userModal = document.getElementById('userModal');
const profileModal = document.getElementById('profileModal');
const gpsBtn = document.getElementById('gpsBtn');
const userPointsSpan = document.getElementById('pointsValue');
const userPointsDiv = document.getElementById('userPoints');

function mostrarToast(mensaje, tipo = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<i class="fas ${tipo === 'error' ? 'fa-exclamation-circle' : 'fa-check-circle'}"></i> ${mensaje}`;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// ========== FIRESTORE: LUGARES ==========
let unsubscribePlaces = null;
function cargarLugaresFirestore() {
    if (!window.firebaseHelpers || !window.firebaseHelpers.onSnapshot) {
        setTimeout(cargarLugaresFirestore, 500);
        return;
    }
    const colRef = window.firebaseHelpers.collection('lugares');
    unsubscribePlaces = window.firebaseHelpers.onSnapshot(colRef, (snapshot) => {
        allPlaces = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        actualizarCategoriasUnicas();
        actualizarMarcadores();
        actualizarListaLugares();
        if (allPlaces.length === 0) mostrarToast("No hay lugares aún. Agrega uno como admin.", "info");
    }, (error) => mostrarToast("Error Firestore: " + error.message, "error"));
}

async function agregarLugarFirestore(lugarData) {
    try {
        const colRef = window.firebaseHelpers.collection('lugares');
        await window.firebaseHelpers.addDoc(colRef, lugarData);
        mostrarToast("Lugar añadido", "success");
    } catch (error) { mostrarToast("Error: " + error.message, "error"); }
}
async function actualizarLugarFirestore(id, lugarData) {
    try {
        const docRef = window.firebaseHelpers.doc(window.firebaseHelpers.collection('lugares'), id);
        await window.firebaseHelpers.updateDoc(docRef, lugarData);
        mostrarToast("Lugar actualizado", "success");
    } catch (error) { mostrarToast("Error: " + error.message, "error"); }
}
async function eliminarLugarFirestore(id) {
    try {
        const docRef = window.firebaseHelpers.doc(window.firebaseHelpers.collection('lugares'), id);
        await window.firebaseHelpers.deleteDoc(docRef);
        mostrarToast("Lugar eliminado", "info");
    } catch (error) { mostrarToast("Error: " + error.message, "error"); }
}

// ========== MAPA ==========
function initMap() {
    const mapContainer = document.getElementById('map');
    if (!mapContainer) return;
    if (map) map.remove();
    map = L.map('map').setView([12.8654, -85.2072], 8);
    
    currentLayers.calles = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', { attribution: '&copy; OpenStreetMap' }).addTo(map);
    currentLayers.satelite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { attribution: 'Esri' });
    currentLayers.relieve = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', { attribution: 'OpenTopoMap' });
    
    markerCluster = L.markerClusterGroup();
    map.addLayer(markerCluster);
    
    setTimeout(() => map.invalidateSize(true), 200);
    window.addEventListener('resize', () => map && map.invalidateSize(true));
    
    document.querySelectorAll('.layer-btn[data-layer]').forEach(btn => {
        btn.addEventListener('click', () => {
            const layer = btn.dataset.layer;
            Object.keys(currentLayers).forEach(l => map.removeLayer(currentLayers[l]));
            map.addLayer(currentLayers[layer]);
            document.querySelectorAll('.layer-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });
    
    map.on('click', (e) => {
        if (isAdmin) abrirFormularioNuevo(e.latlng.lat, e.latlng.lng);
        else mostrarToast("Solo admin puede añadir", "error");
    });
}

function actualizarMarcadores() {
    if (!markerCluster) return;
    markerCluster.clearLayers();
    const filtroCat = obtenerFiltroActual();
    const busqueda = searchInput.value.toLowerCase();
    const filtered = allPlaces.filter(p => (filtroCat === 'todos' || p.categoria === filtroCat) && p.nombre.toLowerCase().includes(busqueda));
    filtered.forEach(place => {
        const popupContent = `
            <b>${place.nombre}</b><br>
            ${place.imagen ? `<img src="${place.imagen}" style="width:100%; border-radius:8px; max-width:200px;">` : ''}
            <a href="${place.url || '#'}" target="_blank" style="display:block; background:#F57C00; color:white; padding:5px; border-radius:5px; text-align:center;">🔗 Visitar</a>
            ${isAdmin ? `<br><button onclick="editarLugar('${place.id}')">✏️ Editar</button> <button onclick="eliminarLugar('${place.id}')">🗑️ Eliminar</button>` : ''}
        `;
        const marker = L.marker([place.lat, place.lng]).bindPopup(popupContent);
        markerCluster.addLayer(marker);
    });
}

function actualizarListaLugares() {
    const filtroCat = obtenerFiltroActual();
    const busqueda = searchInput.value.toLowerCase();
    let filtered = allPlaces.filter(p => (filtroCat === 'todos' || p.categoria === filtroCat) && p.nombre.toLowerCase().includes(busqueda));
    if (!filtered.length) {
        placesList.innerHTML = '<div style="padding:20px; text-align:center;">No hay lugares</div>';
        return;
    }
    placesList.innerHTML = filtered.map(place => `
        <div class="place-card" onclick="centrarMapa(${place.lat}, ${place.lng})">
            <div class="place-card-header">
                ${place.imagen ? `<img src="${place.imagen}">` : '<div style="width:60px;background:#e0e0e0; border-radius:10px; display:flex; align-items:center; justify-content:center;"><i class="fas fa-map-marker-alt"></i></div>'}
                <div class="place-info">
                    <h4>${place.nombre}</h4>
                    <div class="place-categoria">${place.categoria || 'sin categoría'}</div>
                    ${isAdmin ? `<div class="admin-actions"><button class="edit-btn" onclick="event.stopPropagation(); editarLugar('${place.id}')">Editar</button><button class="delete-btn" onclick="event.stopPropagation(); eliminarLugar('${place.id}')">Eliminar</button></div>` : ''}
                </div>
            </div>
        </div>
    `).join('');
}

function obtenerFiltroActual() {
    const active = document.querySelector('.categoria-filtro.active');
    return active ? active.dataset.cat : 'todos';
}

function actualizarCategoriasUnicas() {
    const cats = [...new Set(allPlaces.map(p => p.categoria).filter(c => c))];
    categoriasFiltro.innerHTML = '<div class="categoria-filtro active" data-cat="todos">Todos</div>' + cats.map(c => `<div class="categoria-filtro" data-cat="${c}">${c}</div>`).join('');
    document.querySelectorAll('.categoria-filtro').forEach(el => el.addEventListener('click', function() {
        document.querySelectorAll('.categoria-filtro').forEach(c => c.classList.remove('active'));
        this.classList.add('active');
        actualizarMarcadores();
        actualizarListaLugares();
    }));
}

window.centrarMapa = (lat, lng) => map && map.setView([lat, lng], 14);

// ========== ADMIN LOCAL ==========
function entrarModoAdmin() { isAdmin = true; adminLoginBtn.classList.add('hidden'); adminPanelHeader.classList.remove('hidden'); adminAddBtn.classList.remove('hidden'); mostrarToast("Modo Admin activado", "success"); actualizarMarcadores(); actualizarListaLugares(); }
function salirModoAdmin() { isAdmin = false; adminLoginBtn.classList.remove('hidden'); adminPanelHeader.classList.add('hidden'); adminAddBtn.classList.add('hidden'); mostrarToast("Modo Admin desactivado", "info"); actualizarMarcadores(); actualizarListaLugares(); }
adminLoginBtn.onclick = () => adminModal.style.display = 'flex';
document.getElementById('adminLoginForm').addEventListener('submit', (e) => { e.preventDefault(); if (document.getElementById('adminPassword').value === ADMIN_PASSWORD) { adminModal.style.display = 'none'; entrarModoAdmin(); } else mostrarToast("Contraseña incorrecta", "error"); document.getElementById('adminPassword').value = ''; });
logoutAdminBtn.onclick = salirModoAdmin;

function abrirFormularioNuevo(lat, lng) { modalTitle.innerText = 'Añadir Lugar'; document.getElementById('lugarId').value = ''; document.getElementById('lugarNombre').value = ''; document.getElementById('lugarLat').value = lat.toFixed(6); document.getElementById('lugarLng').value = lng.toFixed(6); document.getElementById('lugarUrl').value = ''; document.getElementById('lugarImagen').value = ''; document.getElementById('lugarCategoria').value = ''; lugarModal.style.display = 'flex'; }
window.editarLugar = (id) => { const p = allPlaces.find(p => p.id === id); if (!p) return; modalTitle.innerText = 'Editar Lugar'; document.getElementById('lugarId').value = p.id; document.getElementById('lugarNombre').value = p.nombre; document.getElementById('lugarLat').value = p.lat; document.getElementById('lugarLng').value = p.lng; document.getElementById('lugarUrl').value = p.url || ''; document.getElementById('lugarImagen').value = p.imagen || ''; document.getElementById('lugarCategoria').value = p.categoria || ''; lugarModal.style.display = 'flex'; };
window.eliminarLugar = (id) => { if (confirm('¿Eliminar?')) eliminarLugarFirestore(id); };
lugarForm.addEventListener('submit', async (e) => { e.preventDefault(); const id = document.getElementById('lugarId').value; const nombre = document.getElementById('lugarNombre').value.trim(); const lat = parseFloat(document.getElementById('lugarLat').value); const lng = parseFloat(document.getElementById('lugarLng').value); const url = document.getElementById('lugarUrl').value.trim(); const imagen = document.getElementById('lugarImagen').value.trim(); const categoria = document.getElementById('lugarCategoria').value.trim(); if (!nombre || isNaN(lat) || isNaN(lng)) { mostrarToast("Nombre, latitud y longitud requeridos", "error"); return; } const data = { nombre, lat, lng, url, imagen, categoria }; if (id) await actualizarLugarFirestore(id, data); else await agregarLugarFirestore(data); lugarModal.style.display = 'none'; });
addPlaceBtn.onclick = () => { if (map) abrirFormularioNuevo(map.getCenter().lat, map.getCenter().lng); else abrirFormularioNuevo(12.8654, -85.2072); };

searchInput.addEventListener('input', () => { actualizarMarcadores(); actualizarListaLugares(); });
geolocationBtn.onclick = () => { if (navigator.geolocation) navigator.geolocation.getCurrentPosition(pos => map.setView([pos.coords.latitude, pos.coords.longitude], 13), () => mostrarToast("Error ubicación", "error")); else mostrarToast("No soportado", "error"); };

// ========== AUTENTICACIÓN Y PUNTOS ==========
function actualizarUIUsuario() {
    if (currentUser) {
        userPointsDiv.style.display = 'flex';
        gpsBtn.style.display = 'flex';
        userBtn.innerHTML = `<i class="fas fa-user-check"></i>`;
        cargarPuntosUsuario();
    } else {
        userPointsDiv.style.display = 'none';
        gpsBtn.style.display = 'none';
        userBtn.innerHTML = `<i class="fas fa-user-circle"></i>`;
        if (gpsActive) toggleGPS();
    }
}

async function cargarPuntosUsuario() {
    if (!currentUser) return;
    const q = window.firebaseHelpers.query(
        window.firebaseHelpers.collection('usuarios'),
        window.firebaseHelpers.where('uid', '==', currentUser.uid)
    );
    const snap = await window.firebaseHelpers.getDocs(q);
    if (!snap.empty) {
        const doc = snap.docs[0];
        userDocId = doc.id;
        userPoints = doc.data().puntos || 0;
        userPointsSpan.innerText = userPoints;
    } else {
        const col = window.firebaseHelpers.collection('usuarios');
        const newDoc = await window.firebaseHelpers.addDoc(col, {
            uid: currentUser.uid,
            email: currentUser.email,
            nombre: currentUser.displayName || currentUser.email,
            fotoURL: currentUser.photoURL || '',
            puntos: 0,
            fechaRegistro: new Date(),
            tema: localStorage.getItem('darkMode') === 'true' ? 'oscuro' : 'claro',
            sonidosActivos: true
        });
        userDocId = newDoc.id;
        userPoints = 0;
        userPointsSpan.innerText = '0';
    }
}

async function sumarPuntos(cantidad, motivo, lugarId = null) {
    if (!currentUser) return;
    const nuevoTotal = userPoints + cantidad;
    const userRef = window.firebaseHelpers.doc(window.firebaseHelpers.collection('usuarios'), userDocId);
    await window.firebaseHelpers.updateDoc(userRef, { puntos: nuevoTotal });
    userPoints = nuevoTotal;
    userPointsSpan.innerText = userPoints;
}

function toggleGPS() {
    if (!currentUser) {
        mostrarToast("Inicia sesión para activar GPS", "error");
        return;
    }
    if (gpsActive) {
        if (watchId) navigator.geolocation.clearWatch(watchId);
        gpsActive = false;
        gpsBtn.classList.remove('active');
        mostrarToast("GPS desactivado", "info");
    } else {
        if (!navigator.geolocation) {
            mostrarToast("Geolocalización no soportada", "error");
            return;
        }
        navigator.geolocation.getCurrentPosition(
            () => {
                gpsActive = true;
                gpsBtn.classList.add('active');
                mostrarToast("GPS activado. Acércate a lugares para ganar puntos.", "success");
                watchId = navigator.geolocation.watchPosition(procesarUbicacion, errorGPS, { enableHighAccuracy: true, maximumAge: 10000, timeout: 15000 });
            },
            () => mostrarToast("Permiso de ubicación denegado", "error")
        );
    }
}

function errorGPS(err) {
    console.error(err);
    mostrarToast("Error de GPS: " + err.message, "error");
}

let ultimaRecompensaPorLugar = {};

async function procesarUbicacion(position) {
    if (!currentUser) return;
    const lat = position.coords.latitude;
    const lng = position.coords.longitude;
    for (let place of allPlaces) {
        const distancia = calcularDistancia(lat, lng, place.lat, place.lng);
        if (distancia <= 50) {
            const ahora = Date.now();
            if (ultimaRecompensaPorLugar[place.id] && (ahora - ultimaRecompensaPorLugar[place.id]) < 60000) continue;
            const visitasRef = window.firebaseHelpers.collection('visitas');
            const qVisit = window.firebaseHelpers.query(
                visitasRef,
                window.firebaseHelpers.where('usuarioId', '==', currentUser.uid),
                window.firebaseHelpers.where('lugarId', '==', place.id)
            );
            const snap = await window.firebaseHelpers.getDocs(qVisit);
            const esPrimeraVez = snap.empty;
            const puntosGanados = esPrimeraVez ? 10 : 2;
            await window.firebaseHelpers.addDoc(visitasRef, {
                usuarioId: currentUser.uid,
                lugarId: place.id,
                fecha: new Date(),
                puntos: puntosGanados,
                tipo: esPrimeraVez ? 'primera' : 'repetida'
            });
            await sumarPuntos(puntosGanados, `Visita a ${place.nombre}`, place.id);
            ultimaRecompensaPorLugar[place.id] = ahora;
            mostrarToast(`¡${place.nombre}! +${puntosGanados} puntos`, "success");
            if (localStorage.getItem('sonidos') !== 'false') {
                new Audio('https://www.soundjay.com/misc/sounds/bell-ringing-05.mp3').play().catch(e=>console.log);
            }
        }
    }
}

function calcularDistancia(lat1, lon1, lat2, lon2) {
    const R = 6371e3;
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;
    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

function mostrarModalUsuario() {
    if (currentUser) {
        document.getElementById('profileBody').innerHTML = `
            <div style="text-align:center;">
                <img src="${currentUser.photoURL || 'https://via.placeholder.com/80'}" style="width:80px; border-radius:50%;">
                <h4>${currentUser.displayName || currentUser.email}</h4>
                <p>Puntos: ${userPoints}</p>
                <hr>
                <label><input type="checkbox" id="sonidosCheck" ${localStorage.getItem('sonidos') !== 'false' ? 'checked' : ''}> Activar sonidos</label><br>
                <button id="cerrarSesionBtn" class="submit-btn" style="background:#d32f2f;">Cerrar Sesión</button>
                <button id="eliminarCuentaBtn" class="submit-btn" style="background:#666;">Eliminar Cuenta</button>
            </div>
        `;
        document.getElementById('sonidosCheck').addEventListener('change', (e) => localStorage.setItem('sonidos', e.target.checked));
        document.getElementById('cerrarSesionBtn').onclick = async () => { await window.auth.signOut(); location.reload(); };
        document.getElementById('eliminarCuentaBtn').onclick = eliminarCuenta;
        profileModal.style.display = 'flex';
    } else {
        document.getElementById('userModalBody').innerHTML = `
            <div style="padding:20px;">
                <button id="googleLoginBtn" class="submit-btn" style="background:#4285F4;">Iniciar con Google</button>
                <hr>
                <input type="email" id="loginEmail" placeholder="Email" style="width:100%; margin-bottom:10px;">
                <input type="password" id="loginPassword" placeholder="Contraseña" style="width:100%; margin-bottom:10px;">
                <button id="emailLoginBtn" class="submit-btn">Iniciar Sesión</button>
                <button id="emailRegistroBtn" class="submit-btn" style="background:#2E7D32;">Registrarse</button>
            </div>
        `;
        document.getElementById('googleLoginBtn').onclick = () => signInWithPopup(window.auth, provider).then(() => location.reload());
        document.getElementById('emailLoginBtn').onclick = () => {
            const email = document.getElementById('loginEmail').value;
            const pass = document.getElementById('loginPassword').value;
            signInWithEmailAndPassword(window.auth, email, pass).then(() => location.reload());
        };
        document.getElementById('emailRegistroBtn').onclick = () => {
            const email = document.getElementById('loginEmail').value;
            const pass = document.getElementById('loginPassword').value;
            createUserWithEmailAndPassword(window.auth, email, pass).then(() => location.reload());
        };
        userModal.style.display = 'flex';
    }
}

async function eliminarCuenta() {
    if (confirm("¿Eliminar permanentemente tu cuenta y todos tus datos?")) {
        const uid = currentUser.uid;
        const colecciones = ['usuarios', 'visitas', 'comentarios', 'amigos', 'progreso_juegos'];
        for (let col of colecciones) {
            const q = window.firebaseHelpers.query(window.firebaseHelpers.collection(col), window.firebaseHelpers.where('usuarioId', '==', uid));
            const snap = await window.firebaseHelpers.getDocs(q);
            snap.forEach(async (docSnap) => { await window.firebaseHelpers.deleteDoc(docSnap.ref); });
        }
        await currentUser.delete();
        await window.auth.signOut();
        location.reload();
    }
}

// ========== MODO OSCURO ==========
function initDarkMode() {
    const isDark = localStorage.getItem('darkMode') === 'true';
    if (isDark) document.body.classList.add('dark-mode');
    darkModeBtn.innerHTML = isDark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
    darkModeBtn.onclick = () => {
        document.body.classList.toggle('dark-mode');
        const dark = document.body.classList.contains('dark-mode');
        localStorage.setItem('darkMode', dark);
        darkModeBtn.innerHTML = dark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
    };
}

// Cerrar modales
document.querySelectorAll('.close-modal').forEach(btn => btn.onclick = function() { this.closest('.modal').style.display = 'none'; });

// ========== INICIALIZACIÓN ==========
window.onAuthStateChanged = (user) => {
    currentUser = user;
    actualizarUIUsuario();
    if (user) cargarPuntosUsuario();
};

gpsBtn.onclick = toggleGPS;
userBtn.onclick = mostrarModalUsuario;

function init() {
    initDarkMode();
    initMap();
    if (window.firebaseHelpers && window.firebaseHelpers.collection) cargarLugaresFirestore();
    else setTimeout(() => cargarLugaresFirestore(), 1000);
}

document.addEventListener('DOMContentLoaded', () => { if (map) map.invalidateSize(); });
window.addEventListener('load', () => { if (map) map.invalidateSize(true); });
init();
