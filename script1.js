// ========== SCRIPT PRINCIPAL CON FIREBASE ==========
// Dependencias globales: window.db (Firestore) y window.auth (Auth) inyectados desde mapa.html

let map;
let markerCluster;
let currentLayers = {};
let allPlaces = [];
let isAdmin = false;
let editingId = null; // guarda el ID del documento Firestore (string)

// Admin password (misma que antes)
const ADMIN_PASSWORD = "Diriamba2026";

// Elementos DOM
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

// ========== FUNCIONES AUXILIARES ==========
function mostrarToast(mensaje, tipo = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<i class="fas ${tipo === 'error' ? 'fa-exclamation-circle' : 'fa-check-circle'}"></i> ${mensaje}`;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// ========== CARGA DE LUGARES DESDE FIRESTORE ==========
let unsubscribePlaces = null;

function iniciarSuscripcionLugares() {
    if (unsubscribePlaces) unsubscribePlaces();
    const q = window.db.collection ? window.db.collection('lugares') : window.db.collection('lugares');
    // Firestore v9 modular: usamos collection y onSnapshot
    // Como window.db es la instancia de Firestore, lo hacemos así:
    const collectionRef = window.db.collection ? window.db.collection('lugares') : (() => { throw new Error("Firestore no inicializado correctamente") })();
    // Pero mejor usar la sintaxis modular: como tenemos window.db, es el objeto Firestore, necesitamos las funciones importadas.
    // Para simplificar, usaremos la API de Firestore v9 compat (la que permite db.collection).
    // Como en mapa.html importamos modular, pero asignamos window.db = db (objeto Firestore). Ese objeto no tiene método .collection directamente.
    // Debemos usar las funciones exportadas: collection, getDocs, onSnapshot, etc.
    // Por tanto, en lugar de hacer window.db.collection, necesitamos acceder a las funciones desde el script de tipo module.
    // Pero nuestro script1.js es normal, no module. Solución: crear un bridge.
    // Para evitar complicaciones, reescribiré esta parte asumiendo que en mapa.html ya se expusieron las funciones necesarias.
    // Lo más limpio: en mapa.html, en el módulo, asignar también window.collectionRef = collection(db, 'lugares') y window.onSnapshot = onSnapshot, etc.
    // Dado que el usuario ya tiene el mapa.html que preparé, voy a modificar el mapa.html también para exponer esas funciones.
    // Pero para no retrasar, voy a suponer que en el mapa.html se hizo:
    // import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
    // y luego:
    // window.lugaresCol = collection(db, 'lugares');
    // window.firestoreAdd = addDoc;
    // window.firestoreUpdate = updateDoc;
    // window.firestoreDelete = deleteDoc;
    // window.firestoreDoc = doc;
    // window.firestoreOnSnapshot = onSnapshot;
    // Por claridad, voy a reescribir el mapa.html de nuevo incluyendo esas asignaciones. Pero como el usuario ya tiene el primer mapa.html, mejor le daré un script1.js que funcione con las APIs modulares importadas globalmente.
    // Voy a asumir que el usuario actualizará el mapa.html con la siguiente versión (le daré luego), o que usará este script1.js con un pequeño puente.
}

// Para evitar confusiones, voy a entregar un script1.js que funciona con la configuración ESTÁNDAR de Firebase v9 modular,
// suponiendo que en mapa.html se han expuesto las siguientes variables globales desde el módulo:
// window.db = db (instancia de Firestore)
// window.firestore = {
//   collection: (path) => collection(db, path),
//   onSnapshot: onSnapshot,
//   addDoc: addDoc,
//   updateDoc: updateDoc,
//   deleteDoc: deleteDoc,
//   doc: doc,
//   getDocs: getDocs
// }
// Esto es fácil de hacer en el mapa.html. Voy a modificar el mapa.html que entregué antes para incluir estas asignaciones.
// Como el usuario pidió primero el script1.js, se lo daré con la lógica que usa esas funciones globales.
// Le indicaré que debe actualizar el mapa.html con una pequeña adición (que también le proporcionaré).

console.log("Usando Firebase - script1.js cargado");

// Definimos un objeto global firebaseHelpers que se llenará desde el módulo
window.firebaseHelpers = window.firebaseHelpers || {};

function cargarLugaresFirestore() {
    if (!window.firebaseHelpers || !window.firebaseHelpers.onSnapshot || !window.firebaseHelpers.collection) {
        console.error("Firebase helpers no listos aún. Reintentando en 1s...");
        setTimeout(cargarLugaresFirestore, 1000);
        return;
    }
    const colRef = window.firebaseHelpers.collection('lugares');
    unsubscribePlaces = window.firebaseHelpers.onSnapshot(colRef, (snapshot) => {
        allPlaces = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        actualizarCategoriasUnicas();
        actualizarMarcadores();
        actualizarListaLugares();
        mostrarToast(`${allPlaces.length} lugares cargados desde la nube`, 'info');
    }, (error) => {
        console.error("Error en onSnapshot:", error);
        mostrarToast("Error al cargar lugares: " + error.message, 'error');
    });
}

// ========== GUARDAR EN FIRESTORE (CRUD) ==========
async function agregarLugarFirestore(lugarData) {
    try {
        const colRef = window.firebaseHelpers.collection('lugares');
        const docRef = await window.firebaseHelpers.addDoc(colRef, lugarData);
        mostrarToast("Lugar añadido correctamente", "success");
        return docRef.id;
    } catch (error) {
        console.error(error);
        mostrarToast("Error al guardar: " + error.message, "error");
        return null;
    }
}

async function actualizarLugarFirestore(id, lugarData) {
    try {
        const docRef = window.firebaseHelpers.doc(window.firebaseHelpers.collection('lugares'), id);
        await window.firebaseHelpers.updateDoc(docRef, lugarData);
        mostrarToast("Lugar actualizado", "success");
    } catch (error) {
        console.error(error);
        mostrarToast("Error al actualizar: " + error.message, "error");
    }
}

async function eliminarLugarFirestore(id) {
    try {
        const docRef = window.firebaseHelpers.doc(window.firebaseHelpers.collection('lugares'), id);
        await window.firebaseHelpers.deleteDoc(docRef);
        mostrarToast("Lugar eliminado", "info");
    } catch (error) {
        console.error(error);
        mostrarToast("Error al eliminar: " + error.message, "error");
    }
}

// ========== FUNCIONES DEL MAPA Y UI (similares al original, pero adaptadas a Firestore) ==========
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
    
    setTimeout(() => {
        if (map) map.invalidateSize(true);
    }, 200);
    
    window.addEventListener('resize', () => {
        if (map) map.invalidateSize(true);
    });
    
    // Controles de capas
    document.querySelectorAll('.layer-btn[data-layer]').forEach(btn => {
        btn.addEventListener('click', () => {
            const layer = btn.dataset.layer;
            Object.keys(currentLayers).forEach(l => { if (map.hasLayer(currentLayers[l])) map.removeLayer(currentLayers[l]); });
            map.addLayer(currentLayers[layer]);
            document.querySelectorAll('.layer-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });
    
    // Clic en mapa para añadir (solo admin)
    map.on('click', (e) => {
        if (isAdmin) {
            abrirFormularioNuevo(e.latlng.lat, e.latlng.lng);
        } else {
            mostrarToast("Inicia sesión como admin para añadir lugares", "error");
        }
    });
}

function actualizarMarcadores() {
    if (!markerCluster) return;
    markerCluster.clearLayers();
    const filtroCat = obtenerFiltroActual();
    const busqueda = searchInput.value.toLowerCase();
    
    let filtered = allPlaces.filter(p => {
        const matchCat = filtroCat === 'todos' || p.categoria === filtroCat;
        const matchSearch = p.nombre.toLowerCase().includes(busqueda);
        return matchCat && matchSearch;
    });
    
    filtered.forEach(place => {
        const popupContent = `
            <b>${place.nombre}</b><br>
            ${place.imagen ? `<img src="${place.imagen}" style="width:100%; border-radius:8px; margin:5px 0; max-width:200px;">` : ''}
            <a href="${place.url || '#'}" target="_blank" style="display:inline-block; margin-top:5px; background:#F57C00; color:white; padding:5px 10px; border-radius:5px; text-decoration:none;">🔗 Visitar</a>
            ${isAdmin ? `<br><button onclick="editarLugar('${place.id}')" style="margin-top:5px; background:#2E7D32; color:white; border:none; padding:3px 8px; border-radius:5px; cursor:pointer;">✏️ Editar</button>
            <button onclick="eliminarLugar('${place.id}')" style="background:#d32f2f; color:white; border:none; padding:3px 8px; border-radius:5px; cursor:pointer;">🗑️ Eliminar</button>` : ''}
        `;
        const marker = L.marker([place.lat, place.lng]).bindPopup(popupContent);
        markerCluster.addLayer(marker);
    });
}

function actualizarListaLugares() {
    const filtroCat = obtenerFiltroActual();
    const busqueda = searchInput.value.toLowerCase();
    let filtered = allPlaces.filter(p => {
        const matchCat = filtroCat === 'todos' || p.categoria === filtroCat;
        const matchSearch = p.nombre.toLowerCase().includes(busqueda);
        return matchCat && matchSearch;
    });
    
    if (filtered.length === 0) {
        placesList.innerHTML = '<div style="text-align:center; padding:20px; color:#999;">No hay lugares</div>';
        return;
    }
    
    placesList.innerHTML = filtered.map(place => `
        <div class="place-card" onclick="centrarMapa(${place.lat}, ${place.lng})">
            <div class="place-card-header">
                ${place.imagen ? `<img src="${place.imagen}" alt="${place.nombre}">` : '<div style="width:60px; height:60px; background:#e0e0e0; border-radius:10px; display:flex; align-items:center; justify-content:center;"><i class="fas fa-map-marker-alt"></i></div>'}
                <div class="place-info">
                    <h4>${place.nombre}</h4>
                    <div class="place-categoria">${place.categoria || 'sin categoría'}</div>
                    ${isAdmin ? `<div class="admin-actions"><button class="edit-btn" onclick="event.stopPropagation(); editarLugar('${place.id}')"><i class="fas fa-edit"></i> Editar</button><button class="delete-btn" onclick="event.stopPropagation(); eliminarLugar('${place.id}')"><i class="fas fa-trash"></i> Eliminar</button></div>` : ''}
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
    const categorias = [...new Set(allPlaces.map(p => p.categoria).filter(c => c))];
    categoriasFiltro.innerHTML = '<div class="categoria-filtro active" data-cat="todos">Todos</div>' +
        categorias.map(cat => `<div class="categoria-filtro" data-cat="${cat}">${cat}</div>`).join('');
    
    document.querySelectorAll('.categoria-filtro').forEach(el => {
        el.addEventListener('click', () => {
            document.querySelectorAll('.categoria-filtro').forEach(c => c.classList.remove('active'));
            el.classList.add('active');
            actualizarMarcadores();
            actualizarListaLugares();
        });
    });
}

window.centrarMapa = (lat, lng) => {
    if (map) map.setView([lat, lng], 14);
};

// ========== ADMIN (contraseña fija) ==========
function entrarModoAdmin() {
    isAdmin = true;
    adminLoginBtn.classList.add('hidden');
    adminPanelHeader.classList.remove('hidden');
    adminAddBtn.classList.remove('hidden');
    mostrarToast("Modo administrador activado", "success");
    actualizarMarcadores();
    actualizarListaLugares();
}

function salirModoAdmin() {
    isAdmin = false;
    adminLoginBtn.classList.remove('hidden');
    adminPanelHeader.classList.add('hidden');
    adminAddBtn.classList.add('hidden');
    mostrarToast("Modo administrador desactivado", "info");
    actualizarMarcadores();
    actualizarListaLugares();
}

adminLoginBtn.addEventListener('click', () => {
    adminModal.style.display = 'flex';
});

document.getElementById('adminLoginForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const pass = document.getElementById('adminPassword').value;
    if (pass === ADMIN_PASSWORD) {
        adminModal.style.display = 'none';
        entrarModoAdmin();
    } else {
        mostrarToast("Contraseña incorrecta", "error");
    }
    document.getElementById('adminPassword').value = '';
});

logoutAdminBtn.addEventListener('click', salirModoAdmin);

// ========== CRUD LUGARES (Firestore) ==========
function abrirFormularioNuevo(lat, lng) {
    modalTitle.innerText = 'Añadir Lugar';
    document.getElementById('lugarId').value = '';
    document.getElementById('lugarNombre').value = '';
    document.getElementById('lugarLat').value = lat.toFixed(6);
    document.getElementById('lugarLng').value = lng.toFixed(6);
    document.getElementById('lugarUrl').value = '';
    document.getElementById('lugarImagen').value = '';
    document.getElementById('lugarCategoria').value = '';
    lugarModal.style.display = 'flex';
}

window.editarLugar = async (id) => {
    const place = allPlaces.find(p => p.id === id);
    if (!place) return;
    modalTitle.innerText = 'Editar Lugar';
    document.getElementById('lugarId').value = place.id;
    document.getElementById('lugarNombre').value = place.nombre;
    document.getElementById('lugarLat').value = place.lat;
    document.getElementById('lugarLng').value = place.lng;
    document.getElementById('lugarUrl').value = place.url || '';
    document.getElementById('lugarImagen').value = place.imagen || '';
    document.getElementById('lugarCategoria').value = place.categoria || '';
    lugarModal.style.display = 'flex';
};

window.eliminarLugar = async (id) => {
    if (confirm('¿Eliminar este lugar permanentemente?')) {
        await eliminarLugarFirestore(id);
    }
};

lugarForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('lugarId').value;
    const nombre = document.getElementById('lugarNombre').value.trim();
    const lat = parseFloat(document.getElementById('lugarLat').value);
    const lng = parseFloat(document.getElementById('lugarLng').value);
    const url = document.getElementById('lugarUrl').value.trim();
    const imagen = document.getElementById('lugarImagen').value.trim();
    const categoria = document.getElementById('lugarCategoria').value.trim();
    
    if (!nombre || isNaN(lat) || isNaN(lng)) {
        mostrarToast("Nombre, latitud y longitud son obligatorios", "error");
        return;
    }
    
    const lugarData = { nombre, lat, lng, url, imagen, categoria };
    
    if (id) {
        await actualizarLugarFirestore(id, lugarData);
    } else {
        await agregarLugarFirestore(lugarData);
    }
    lugarModal.style.display = 'none';
});

addPlaceBtn.addEventListener('click', () => {
    if (map) {
        const center = map.getCenter();
        abrirFormularioNuevo(center.lat, center.lng);
    } else {
        abrirFormularioNuevo(12.8654, -85.2072);
    }
});

// ========== BÚSQUEDA Y GEOLOCALIZACIÓN ==========
searchInput.addEventListener('input', () => {
    actualizarMarcadores();
    actualizarListaLugares();
});

geolocationBtn.addEventListener('click', () => {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(pos => {
            if (map) map.setView([pos.coords.latitude, pos.coords.longitude], 13);
        }, () => mostrarToast("No se pudo obtener ubicación", "error"));
    } else {
        mostrarToast("Geolocalización no soportada", "error");
    }
});

// ========== MODO OSCURO (por ahora localStorage) ==========
function initDarkMode() {
    const isDark = localStorage.getItem('darkMode') === 'true';
    if (isDark) document.body.classList.add('dark-mode');
    darkModeBtn.innerHTML = isDark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
    darkModeBtn.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        const dark = document.body.classList.contains('dark-mode');
        localStorage.setItem('darkMode', dark);
        darkModeBtn.innerHTML = dark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
    });
}

// Cerrar modales
document.querySelectorAll('.close-modal').forEach(btn => {
    btn.addEventListener('click', function() {
        this.closest('.modal').style.display = 'none';
    });
});

// ========== INICIALIZACIÓN ==========
function init() {
    initDarkMode();
    // Esperar a que los helpers de Firebase estén listos (asignados en mapa.html)
    if (window.firebaseHelpers && window.firebaseHelpers.collection) {
        initMap();
        cargarLugaresFirestore();
    } else {
        mostrarToast("Esperando conexión con Firebase...", "info");
        const checkInterval = setInterval(() => {
            if (window.firebaseHelpers && window.firebaseHelpers.collection) {
                clearInterval(checkInterval);
                initMap();
                cargarLugaresFirestore();
            }
        }, 500);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (map) map.invalidateSize();
});

window.addEventListener('load', () => {
    if (map) map.invalidateSize(true);
});

function init() {
    initDarkMode();
    // Inicializar el mapa inmediatamente (sin esperar Firebase)
    initMap();
    
    // Luego intentar cargar lugares cuando Firebase esté listo
    if (window.firebaseHelpers && window.firebaseHelpers.collection) {
        cargarLugaresFirestore();
    } else {
        mostrarToast("Conectando con Firebase...", "info");
        const checkInterval = setInterval(() => {
            if (window.firebaseHelpers && window.firebaseHelpers.collection) {
                clearInterval(checkInterval);
                cargarLugaresFirestore();
            }
        }, 500);
    }
}

init();
