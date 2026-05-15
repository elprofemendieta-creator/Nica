// ========== SUPABASE CONFIG ==========
const SUPABASE_URL = 'https://seycydasqixlwtqxvjma.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNleWN5ZGFzcWl4bHd0cXh2am1hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4NTM5MzYsImV4cCI6MjA5NDQyOTkzNn0._E7ijnmlZFXpHKPswtcse2QCuMx-aviPxwROdtpTxvE';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ========== VARIABLES ==========
let map;
let markerCluster;
let currentLayers = {};
let allPlaces = [];
let isAdmin = false;
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

// ========== TOAST ==========
function mostrarToast(mensaje, tipo = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<i class="fas ${tipo === 'error' ? 'fa-exclamation-circle' : 'fa-check-circle'}"></i> ${mensaje}`;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// ========== MAPA ==========
function initMap() {
    console.log("Iniciando mapa...");
    const mapContainer = document.getElementById('map');
    if (!mapContainer) return;
    
    if (map) map.remove();
    
    map = L.map('map').setView([12.8654, -85.2072], 8);
    
    currentLayers.calles = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap'
    }).addTo(map);
    currentLayers.satelite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Esri'
    });
    currentLayers.relieve = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
        attribution: 'OpenTopoMap'
    });
    
    markerCluster = L.markerClusterGroup();
    map.addLayer(markerCluster);
    
    // Forzar redimensionamiento
    setTimeout(() => { if (map) map.invalidateSize(true); }, 200);
    window.addEventListener('resize', () => { if (map) map.invalidateSize(true); });
    
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
    
    map.on('click', (e) => {
        if (isAdmin) {
            abrirFormularioNuevo(e.latlng.lat, e.latlng.lng);
        } else {
            mostrarToast("Inicia sesión como admin para añadir lugares", "error");
        }
    });
    
    console.log("Mapa iniciado correctamente");
}

// ========== SUPABASE DATA ==========
async function cargarLugares() {
    console.log("Cargando lugares desde Supabase...");
    const { data, error } = await supabase.from('lugares').select('*');
    if (error) {
        console.error("Error Supabase:", error);
        mostrarToast("Error al cargar lugares: " + error.message, "error");
        return;
    }
    console.log("Datos recibidos:", data);
    allPlaces = data || [];
    if (allPlaces.length === 0) {
        console.log("No hay lugares, insertando ejemplos...");
        const ejemplos = [
            { nombre: "Granada", lat: 11.9294, lng: -85.9536, url: "https://es.wikipedia.org/wiki/Granada_(Nicaragua)", imagen: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Granada%2C_Nicaragua.jpg/300px-Granada%2C_Nicaragua.jpg", categoria: "ciudad" },
            { nombre: "León", lat: 12.4358, lng: -86.8781, url: "https://es.wikipedia.org/wiki/León_(Nicaragua)", imagen: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8b/Leon_Nicaragua.jpg/300px-Leon_Nicaragua.jpg", categoria: "ciudad" },
            { nombre: "Corn Island", lat: 12.1758, lng: -83.0615, url: "https://es.wikipedia.org/wiki/Islas_del_Maíz", imagen: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/Corn_Island.jpg/300px-Corn_Island.jpg", categoria: "playa" },
            { nombre: "Volcán Masaya", lat: 11.9844, lng: -86.1611, url: "https://es.wikipedia.org/wiki/Volcán_Masaya", imagen: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2b/Masaya_Volcano.jpg/300px-Masaya_Volcano.jpg", categoria: "volcán" },
            { nombre: "San Juan del Sur", lat: 11.2528, lng: -85.8683, url: "https://es.wikipedia.org/wiki/San_Juan_del_Sur", imagen: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/San_Juan_del_Sur.jpg/300px-San_Juan_del_Sur.jpg", categoria: "playa" }
        ];
        for (const ej of ejemplos) {
            await supabase.from('lugares').insert([ej]);
        }
        await cargarLugares(); // Recargar después de insertar
        return;
    }
    actualizarCategoriasUnicas();
    actualizarMarcadores();
    actualizarListaLugares();
}

async function guardarLugar(lugar) {
    if (lugar.id) {
        const { error } = await supabase.from('lugares').update({
            nombre: lugar.nombre,
            lat: lugar.lat,
            lng: lugar.lng,
            url: lugar.url,
            imagen: lugar.imagen,
            categoria: lugar.categoria
        }).eq('id', lugar.id);
        if (error) throw error;
    } else {
        const { error } = await supabase.from('lugares').insert([{
            nombre: lugar.nombre,
            lat: lugar.lat,
            lng: lugar.lng,
            url: lugar.url,
            imagen: lugar.imagen,
            categoria: lugar.categoria
        }]);
        if (error) throw error;
    }
    await cargarLugares();
}

async function eliminarLugarSupabase(id) {
    const { error } = await supabase.from('lugares').delete().eq('id', id);
    if (error) throw error;
    await cargarLugares();
}

// ========== UI ACTUALIZACIÓN ==========
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

function obtenerFiltroActual() {
    const active = document.querySelector('.categoria-filtro.active');
    return active ? active.dataset.cat : 'todos';
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
            ${isAdmin ? `<br><button onclick="editarLugar(${place.id})" style="margin-top:5px; background:#2E7D32; color:white; border:none; padding:3px 8px; border-radius:5px; cursor:pointer;">✏️ Editar</button>
            <button onclick="eliminarLugar(${place.id})" style="background:#d32f2f; color:white; border:none; padding:3px 8px; border-radius:5px; cursor:pointer;">🗑️ Eliminar</button>` : ''}
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
                    ${isAdmin ? `<div class="admin-actions"><button class="edit-btn" onclick="event.stopPropagation(); editarLugar(${place.id})"><i class="fas fa-edit"></i> Editar</button><button class="delete-btn" onclick="event.stopPropagation(); eliminarLugar(${place.id})"><i class="fas fa-trash"></i> Eliminar</button></div>` : ''}
                </div>
            </div>
        </div>
    `).join('');
}

window.centrarMapa = (lat, lng) => {
    if (map) map.setView([lat, lng], 14);
};

// ========== ADMIN ==========
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

// ========== CRUD ==========
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

window.editarLugar = (id) => {
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
        try {
            await eliminarLugarSupabase(id);
            mostrarToast("Lugar eliminado", "info");
        } catch (error) {
            mostrarToast("Error al eliminar", "error");
        }
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
    
    const lugar = { id: id || null, nombre, lat, lng, url, imagen, categoria };
    try {
        await guardarLugar(lugar);
        lugarModal.style.display = 'none';
        mostrarToast(id ? "Lugar actualizado" : "Lugar añadido", "success");
    } catch (error) {
        mostrarToast("Error al guardar", "error");
    }
});

addPlaceBtn.addEventListener('click', () => {
    if (map) {
        const center = map.getCenter();
        abrirFormularioNuevo(center.lat, center.lng);
    } else {
        abrirFormularioNuevo(12.8654, -85.2072);
    }
});

// Geolocalización
geolocationBtn.addEventListener('click', () => {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(pos => {
            if (map) map.setView([pos.coords.latitude, pos.coords.longitude], 13);
        }, () => mostrarToast("No se pudo obtener ubicación", "error"));
    } else {
        mostrarToast("Geolocalización no soportada", "error");
    }
});

// Modo oscuro
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

// ========== INICIO ==========
async function start() {
    initDarkMode();
    initMap();           // Mapa siempre se inicia primero
    await cargarLugares(); // Luego se cargan los datos y se dibujan
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
} else {
    start();
}
async function cargarLugares() {
  const { data, error } = await supabase
    .from('lugares')
    .select('*');

  if (error) {
    console.error('Error al cargar lugares:', error);
    return [];
  }
    async function guardarLugar({ nombre, lat, lng, url, imagen, categoria }) {
  const { data, error } = await supabase
    .from('lugares')
    .insert([{ nombre, lat, lng, url, imagen, categoria }])
    .select();  // .select() devuelve el registro recién creado

  if (error) {
    console.error('Error al guardar lugar:', error.message);
    alert('No se pudo guardar: ' + error.message);
    return null;
  }
  return data[0]; // el nuevo lugar con su id generado
}

async function actualizarLugar(id, cambios) {
  const { data, error } = await supabase
    .from('lugares')
    .update(cambios)
    .eq('id', id)
    .select();

  if (error) {
    console.error('Error al actualizar:', error);
    return null;
  }
  return data[0];
}
    async function eliminarLugar(id) {
  const { error } = await supabase
    .from('lugares')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error al eliminar:', error);
    return false;
  }
  return true;
}
    function suscribirseACambios() {
  const canal = supabase
    .channel('lugares-canal')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'lugares' },
      (payload) => {
        console.log('Cambio recibido:', payload);
        manejarCambioEnMapa(payload.eventType, payload.new, payload.old);
      }
    )
    .subscribe();
}

function manejarCambioEnMapa(evento, nuevo, viejo) {
  switch (evento) {
    case 'INSERT':
      agregarMarcadorAlMapa(nuevo);
      agregarALista(nuevo);
      break;
    case 'UPDATE':
      actualizarMarcadorYLista(nuevo);
      break;
    case 'DELETE':
      eliminarMarcadorYLista(viejo.id);
      break;
  }
}return data;
}
