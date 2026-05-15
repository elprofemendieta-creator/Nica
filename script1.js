// ========== CONFIGURACIÓN ==========
let map, markerCluster, currentLayers = {}, allPlaces = [], isAdmin = false;
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

// ========== LOCALSTORAGE ==========
function cargarDatos() {
    const data = localStorage.getItem('turismo_puntos');
    if (data) {
        allPlaces = JSON.parse(data);
    } else {
        allPlaces = [ /* datos iniciales igual que antes */ ];
        guardarDatos();
    }
    actualizarCategoriasUnicas();
    actualizarMarcadores();
    actualizarListaLugares();
}

function guardarDatos() { localStorage.setItem('turismo_puntos', JSON.stringify(allPlaces)); }

function mostrarToast(mensaje, tipo) { /* igual */ }

function actualizarCategoriasUnicas() { /* igual */ }
function obtenerFiltroActual() { /* igual */ }

// ========== INICIALIZACIÓN DEL MAPA ROBUSTA ==========
function initMap() {
    const mapContainer = document.getElementById('map');
    if (!mapContainer) return;
    
    // Si ya existe mapa, destrúyelo
    if (map) {
        map.remove();
        map = null;
    }
    
    // Forzar altura visible (importante en móvil)
    const container = document.querySelector('.map-container');
    if (container) {
        const height = window.innerHeight * 0.6;
        container.style.height = height + 'px';
        mapContainer.style.height = '100%';
    }
    
    // Crear mapa
    map = L.map('map').setView([12.8654, -85.2072], 8);
    
    // Capas
    currentLayers.calles = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap'
    }).addTo(map);
    
    currentLayers.satelite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Esri'
    });
    
    currentLayers.relieve = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
        attribution: 'OpenTopoMap'
    });
    
    // Cluster
    markerCluster = L.markerClusterGroup();
    map.addLayer(markerCluster);
    
    // Forzar redimensionamiento varias veces
    setTimeout(() => {
        if (map) map.invalidateSize(true);
    }, 100);
    setTimeout(() => {
        if (map) map.invalidateSize(true);
    }, 500);
    
    window.addEventListener('resize', () => {
        if (map) map.invalidateSize(true);
    });
    
    // Controles de capas
    document.querySelectorAll('.layer-btn[data-layer]').forEach(btn => {
        btn.removeEventListener('click', layerHandler);
        btn.addEventListener('click', layerHandler);
    });
    
    function layerHandler(e) {
        const layer = e.currentTarget.dataset.layer;
        Object.keys(currentLayers).forEach(l => {
            if (map.hasLayer(currentLayers[l])) map.removeLayer(currentLayers[l]);
        });
        map.addLayer(currentLayers[layer]);
        document.querySelectorAll('.layer-btn').forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
    }
    
    // Clic en mapa para añadir (solo admin)
    map.on('click', (e) => {
        if (isAdmin) {
            abrirFormularioNuevo(e.latlng.lat, e.latlng.lng);
        } else {
            mostrarToast("Inicia sesión como admin para añadir lugares", "error");
        }
    });
}
// se mantienen exactamente igual que en la versión anterior, solo hay que asegurar
// que dentro de ellas se verifique que map y markerCluster existen.

function actualizarMarcadores() {
    if (!markerCluster) return;
    markerCluster.clearLayers();
    // ... resto igual
}

// ... (todas las demás funciones idénticas)

// Inicialización principal
function init() {
    initDarkMode();
    // Esperar a que el DOM y los estilos estén listos
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(() => {
                initMap();
                cargarDatos();
            }, 50);
        });
    } else {
        setTimeout(() => {
            initMap();
            cargarDatos();
        }, 50);
    }
}

// Asegurar que el mapa se redibuja cuando la página termina de cargar completamente
window.addEventListener('load', () => {
    if (map) map.invalidateSize(true);
});

init();
