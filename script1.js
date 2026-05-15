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
    if (!mapContainer) {
        console.error("No se encontró el elemento #map");
        return;
    }
    // Si ya existe un mapa, destrúyelo para recrearlo limpio
    if (map) {
        map.remove();
        map = null;
    }
    
    // Verificar que el contenedor tiene dimensiones visibles
    const rect = mapContainer.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) {
        console.warn("El contenedor del mapa aún no tiene tamaño, reintentando...");
        setTimeout(initMap, 100);
        return;
    }
    
    // Crear mapa
    map = L.map('map').setView([12.8654, -85.2072], 8);
    
    // Capas
    currentLayers.calles = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', { attribution: '&copy; OpenStreetMap' }).addTo(map);
    currentLayers.satelite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { attribution: 'Esri' });
    currentLayers.relieve = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', { attribution: 'OpenTopoMap' });
    
    markerCluster = L.markerClusterGroup();
    map.addLayer(markerCluster);
    
    // Forzar redimensionamiento después de que el DOM esté completamente estable
    setTimeout(() => {
        if (map) map.invalidateSize(true);
    }, 200);
    
    // Escuchar cambios de orientación y redimensiones
    window.addEventListener('resize', () => { if (map) map.invalidateSize(true); });
    
    // También cuando el sidebar se abre/cierra (en móvil al desplegar la lista)
    // No es necesario, pero por si acaso
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
        const observer = new ResizeObserver(() => { if (map) map.invalidateSize(true); });
        observer.observe(sidebar);
    }
    
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
    
    // Clic en mapa (solo admin)
    map.on('click', (e) => {
        if (isAdmin) abrirFormularioNuevo(e.latlng.lat, e.latlng.lng);
        else mostrarToast("Inicia sesión como admin para añadir lugares", "error");
    });
}

// El resto de funciones (actualizarMarcadores, actualizarListaLugares, admin, CRUD, etc.)
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
    // Pequeño retardo para garantizar que el DOM esté listo y el contenedor visible
    setTimeout(() => {
        initMap();
        cargarDatos();
    }, 50);
}

// Asegurar que el mapa se redibuja cuando la página termina de cargar completamente
window.addEventListener('load', () => {
    if (map) map.invalidateSize(true);
});

init();
