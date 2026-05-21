// script1.js - Versión Firebase con corrección de mapa
let map;
let markerCluster;
let currentLayers = {};
let allPlaces = [];
let isAdmin = false;
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

function mostrarToast(mensaje, tipo = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<i class="fas ${tipo === 'error' ? 'fa-exclamation-circle' : 'fa-check-circle'}"></i> ${mensaje}`;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// Firestore: suscripción en tiempo real
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

// MAPA
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
        const popupContent = `<b>${place.nombre}</b><br>${place.imagen ? `<img src="${place.imagen}" style="width:100%; border-radius:8px; max-width:200px;">` : ''}<a href="${place.url || '#'}" target="_blank" style="display:block; background:#F57C00; color:white; padding:5px; border-radius:5px; text-align:center;">🔗 Visitar</a>${isAdmin ? `<br><button onclick="editarLugar('${place.id}')">✏️ Editar</button> <button onclick="eliminarLugar('${place.id}')">🗑️ Eliminar</button>` : ''}`;
        markerCluster.addLayer(L.marker([place.lat, place.lng]).bindPopup(popupContent));
    });
}

function actualizarListaLugares() { /* similar al original */ 
    const filtroCat = obtenerFiltroActual();
    const busqueda = searchInput.value.toLowerCase();
    let filtered = allPlaces.filter(p => (filtroCat === 'todos' || p.categoria === filtroCat) && p.nombre.toLowerCase().includes(busqueda));
    if (!filtered.length) { placesList.innerHTML = '<div style="padding:20px; text-align:center;">No hay lugares</div>'; return; }
    placesList.innerHTML = filtered.map(place => `<div class="place-card" onclick="centrarMapa(${place.lat}, ${place.lng})"><div class="place-card-header">${place.imagen ? `<img src="${place.imagen}">` : '<div style="width:60px;background:#e0e0e0; border-radius:10px; display:flex; align-items:center; justify-content:center;"><i class="fas fa-map-marker-alt"></i></div>'}<div class="place-info"><h4>${place.nombre}</h4><div class="place-categoria">${place.categoria || 'sin categoría'}</div>${isAdmin ? `<div class="admin-actions"><button class="edit-btn" onclick="event.stopPropagation(); editarLugar('${place.id}')">Editar</button><button class="delete-btn" onclick="event.stopPropagation(); eliminarLugar('${place.id}')">Eliminar</button></div>` : ''}</div></div></div>`).join('');
}
function obtenerFiltroActual() { const a = document.querySelector('.categoria-filtro.active'); return a ? a.dataset.cat : 'todos'; }
function actualizarCategoriasUnicas() {
    const cats = [...new Set(allPlaces.map(p => p.categoria).filter(c => c))];
    categoriasFiltro.innerHTML = '<div class="categoria-filtro active" data-cat="todos">Todos</div>' + cats.map(c => `<div class="categoria-filtro" data-cat="${c}">${c}</div>`).join('');
    document.querySelectorAll('.categoria-filtro').forEach(el => el.addEventListener('click', function() { document.querySelectorAll('.categoria-filtro').forEach(c => c.classList.remove('active')); this.classList.add('active'); actualizarMarcadores(); actualizarListaLugares(); }));
}
window.centrarMapa = (lat, lng) => map && map.setView([lat, lng], 14);

// Admin
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
function initDarkMode() { const isDark = localStorage.getItem('darkMode') === 'true'; if (isDark) document.body.classList.add('dark-mode'); darkModeBtn.innerHTML = isDark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>'; darkModeBtn.onclick = () => { document.body.classList.toggle('dark-mode'); const dark = document.body.classList.contains('dark-mode'); localStorage.setItem('darkMode', dark); darkModeBtn.innerHTML = dark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>'; }; }
document.querySelectorAll('.close-modal').forEach(btn => btn.onclick = function() { this.closest('.modal').style.display = 'none'; });
function init() { initDarkMode(); initMap(); if (window.firebaseHelpers && window.firebaseHelpers.collection) cargarLugaresFirestore(); else setTimeout(() => { if (window.firebaseHelpers) cargarLugaresFirestore(); else mostrarToast("Error: Firebase no inicializado", "error"); }, 1000); }
document.addEventListener('DOMContentLoaded', () => map && map.invalidateSize());
window.addEventListener('load', () => map && map.invalidateSize(true));
init();
