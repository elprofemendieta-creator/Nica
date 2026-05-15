// =============================================
// 1. CONFIGURACIÓN DE SUPABASE
// =============================================
const SUPABASE_URL = 'https://seycydasqixlwtqxvjma.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNleWN5ZGFzcWl4bHd0cXh2am1hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4NTM5MzYsImV4cCI6MjA5NDQyOTkzNn0._E7ijnmlZFXpHKPswtcse2QCuMx-aviPxwROdtpTxvE';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// =============================================
// 2. VARIABLES GLOBALES
// =============================================
let mapa;
let lugares = [];           // Array de objetos completos de la BD
let marcadores = {};       // id -> marker de Leaflet
let modoAdmin = false;     // Control de sesión admin local
let capaMarcadores;        // Cluster de marcadores (si usas MarkerCluster)

// =============================================
// 3. INICIALIZACIÓN DEL MAPA (con solución al mapa blanco)
// =============================================
function inicializarMapa() {
  // Leaflet espera que el contenedor tenga altura definida en CSS
  mapa = L.map('mapa', {
    center: [12.8654, -85.2072],
    zoom: 7,
    zoomControl: true
  });

  // Capas base
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap'
  }).addTo(mapa);

  // Cluster opcional (si cargaste el plugin). Si no, comenta o usa un LayerGroup simple.
  if (typeof L.markerClusterGroup === 'function') {
    capaMarcadores = L.markerClusterGroup();
    mapa.addLayer(capaMarcadores);
  } else {
    capaMarcadores = L.layerGroup().addTo(mapa);
  }

  // Forzar redimensión al cargar y en resize (soluciona pantalla blanca en móviles)
  window.addEventListener('load', () => {
    mapa.invalidateSize();
  });
  window.addEventListener('resize', () => {
    mapa.invalidateSize();
  });
  // Si usas pestañas o el mapa se oculta inicialmente, invalida también al mostrarlo
  // (aquí puedes añadir un MutationObserver si fuera necesario)
}

// =============================================
// 4. CARGA DE LUGARES DESDE SUPABASE
// =============================================
async function cargarLugares() {
  const { data, error } = await supabase
    .from('lugares')
    .select('*')
    .order('id', { ascending: true });

  if (error) {
    console.error('Error al cargar lugares:', error.message);
    alert('No se pudieron cargar los lugares. Revisa la consola.');
    return;
  }

  lugares = data;
  limpiarMarcadores();
  data.forEach(lugar => agregarMarcador(lugar));
  actualizarListaLugares();
}

// =============================================
// 5. GESTIÓN DE MARCADORES
// =============================================
function agregarMarcador(lugar) {
  const marker = L.marker([lugar.lat, lugar.lng])
    .bindPopup(`
      <b>${lugar.nombre}</b><br>
      ${lugar.categoria ? 'Categoría: ' + lugar.categoria + '<br>' : ''}
      ${lugar.url ? `<a href="${lugar.url}" target="_blank">Más info</a><br>` : ''}
      ${lugar.imagen ? `<img src="${lugar.imagen}" width="100" style="display:block; margin-top:5px;">` : ''}
      ${modoAdmin ? `
        <hr>
        <button onclick="editarLugar(${lugar.id})" class="btn-admin-popup">Editar</button>
        <button onclick="eliminarLugar(${lugar.id})" class="btn-admin-popup">Eliminar</button>
      ` : ''}
    `);

  marker.lugarId = lugar.id;
  capaMarcadores.addLayer(marker);
  marcadores[lugar.id] = marker;
}

function limpiarMarcadores() {
  capaMarcadores.clearLayers();
  marcadores = {};
}

// =============================================
// 6. LISTA LATERAL Y BÚSQUEDA / FILTROS
// =============================================
function actualizarListaLugares(filtroTexto = '', filtroCategoria = '') {
  const contenedor = document.getElementById('lista-lugares');
  if (!contenedor) return;

  const texto = filtroTexto.toLowerCase();
  const lugaresFiltrados = lugares.filter(l => {
    const coincideNombre = l.nombre.toLowerCase().includes(texto);
    const coincideCat = !filtroCategoria || l.categoria === filtroCategoria;
    return coincideNombre && coincideCat;
  });

  contenedor.innerHTML = lugaresFiltrados.length === 0
    ? '<p>No se encontraron lugares.</p>'
    : lugaresFiltrados.map(l => `
      <div class="lugar-item" data-id="${l.id}">
        <strong>${l.nombre}</strong>
        ${l.categoria ? `<span class="cat"> (${l.categoria})</span>` : ''}
        ${l.url ? `<a href="${l.url}" target="_blank" class="url-link">🔗</a>` : ''}
        ${modoAdmin ? `
          <button onclick="editarLugar(${l.id})" class="btn-editar-lista">✏️</button>
          <button onclick="eliminarLugar(${l.id})" class="btn-eliminar-lista">🗑️</button>
        ` : ''}
      </div>
    `).join('');

  // Evento para centrar el mapa al hacer clic en un elemento de la lista
  document.querySelectorAll('.lugar-item').forEach(item => {
    item.addEventListener('click', (e) => {
      if (e.target.tagName === 'BUTTON' || e.target.tagName === 'A') return;
      const id = parseInt(item.dataset.id);
      const lugar = lugares.find(l => l.id === id);
      if (lugar && marcadores[id]) {
        mapa.setView([lugar.lat, lugar.lng], 15);
        marcadores[id].openPopup();
      }
    });
  });
}

// Eventos de búsqueda y filtro (deben existir en tu HTML)
document.getElementById('busqueda')?.addEventListener('input', (e) => {
  const cat = document.getElementById('filtro-categoria')?.value || '';
  actualizarListaLugares(e.target.value, cat);
});

document.getElementById('filtro-categoria')?.addEventListener('change', (e) => {
  const texto = document.getElementById('busqueda')?.value || '';
  actualizarListaLugares(texto, e.target.value);
});

// =============================================
// 7. SINCRONIZACIÓN EN TIEMPO REAL (Realtime)
// =============================================
function suscribirseACambios() {
  const canal = supabase
    .channel('lugares-canal')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'lugares' },
      (payload) => {
        console.log('Cambio en tiempo real:', payload);
        switch (payload.eventType) {
          case 'INSERT':
            lugares.push(payload.new);
            agregarMarcador(payload.new);
            actualizarListaLugares(
              document.getElementById('busqueda')?.value || '',
              document.getElementById('filtro-categoria')?.value || ''
            );
            break;
          case 'UPDATE':
            const idxUpd = lugares.findIndex(l => l.id === payload.new.id);
            if (idxUpd !== -1) {
              lugares[idxUpd] = payload.new;
              // Reemplazar marcador
              if (marcadores[payload.new.id]) {
                capaMarcadores.removeLayer(marcadores[payload.new.id]);
                delete marcadores[payload.new.id];
              }
              agregarMarcador(payload.new);
              actualizarListaLugares();
            }
            break;
          case 'DELETE':
            lugares = lugares.filter(l => l.id !== payload.old.id);
            if (marcadores[payload.old.id]) {
              capaMarcadores.removeLayer(marcadores[payload.old.id]);
              delete marcadores[payload.old.id];
            }
            actualizarListaLugares();
            break;
        }
      }
    )
    .subscribe();
}

// =============================================
// 8. ADMIN: LOGIN LOCAL
// =============================================
const PASSWORD_ADMIN = 'Diriamba2026';

document.getElementById('btn-admin')?.addEventListener('click', () => {
  const pass = prompt('Contraseña de administrador:');
  if (pass === PASSWORD_ADMIN) {
    modoAdmin = true;
    alert('Modo administrador activado.');
    // Reactivar mapa para que escuche clics
    mapa.on('click', alHacerClicEnMapa);
    // Refrescar lista y marcadores para mostrar botones de admin
    actualizarListaLugares(
      document.getElementById('busqueda')?.value || '',
      document.getElementById('filtro-categoria')?.value || ''
    );
    // Actualizar popups existentes (recargar todos los popups con nuevos botones)
    Object.values(marcadores).forEach(m => m.closePopup());
    // También podrías volver a bindear todos los popups, pero para simplificar:
    // La próxima vez que abras un popup se generará con los botones de admin.
  } else {
    alert('Contraseña incorrecta.');
  }
});

// =============================================
// 9. CREACIÓN DE NUEVO LUGAR (CLIC EN MAPA + MODAL)
// =============================================
function alHacerClicEnMapa(e) {
  if (!modoAdmin) return;

  const { lat, lng } = e.latlng;
  // Crear modal dinámico
  const modal = document.createElement('div');
  modal.className = 'modal-formulario';
  modal.innerHTML = `
    <div class="modal-contenido">
      <h3>Nuevo lugar</h3>
      <label>Nombre *</label>
      <input id="input-nombre" type="text" required>
      <label>Categoría</label>
      <select id="input-categoria">
        <option value="">Selecciona...</option>
        <option value="playa">Playa</option>
        <option value="volcan">Volcán</option>
        <option value="ciudad">Ciudad</option>
        <option value="naturaleza">Naturaleza</option>
        <option value="cultural">Cultural</option>
        <option value="otro">Otro</option>
      </select>
      <label>URL (más info)</label>
      <input id="input-url" type="url">
      <label>URL de imagen</label>
      <input id="input-imagen" type="url">
      <div class="modal-botones">
        <button id="btn-cancelar">Cancelar</button>
        <button id="btn-guardar">Guardar</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  // Cerrar modal
  document.getElementById('btn-cancelar').onclick = () => {
    document.body.removeChild(modal);
  };
  modal.addEventListener('click', (ev) => {
    if (ev.target === modal) document.body.removeChild(modal);
  });

  // Guardar
  document.getElementById('btn-guardar').onclick = async () => {
    const nombre = document.getElementById('input-nombre').value.trim();
    if (!nombre) {
      alert('El nombre es obligatorio.');
      return;
    }
    const nuevoLugar = {
      nombre,
      lat,
      lng,
      categoria: document.getElementById('input-categoria').value || null,
      url: document.getElementById('input-url').value || null,
      imagen: document.getElementById('input-imagen').value || null
    };

    // Insertar en Supabase
    const { data, error } = await supabase
      .from('lugares')
      .insert([nuevoLugar])
      .select();

    if (error) {
      console.error('Error al guardar:', error.message);
      alert('Error al guardar: ' + error.message);
      return;
    }

    // Éxito: la suscripción Realtime se encargará de añadirlo al mapa y lista.
    document.body.removeChild(modal);
    // Opcional: si quieres respuesta inmediata sin esperar al realtime:
    // const lugarCreado = data[0];
    // lugares.push(lugarCreado);
    // agregarMarcador(lugarCreado);
    // actualizarListaLugares();
  };
}

// =============================================
// 10. EDITAR Y ELIMINAR LUGARES
// =============================================
async function editarLugar(id) {
  if (!modoAdmin) return;
  const lugar = lugares.find(l => l.id === id);
  if (!lugar) return;

  // Modal similar al de creación pero con datos cargados
  const modal = document.createElement('div');
  modal.className = 'modal-formulario';
  modal.innerHTML = `
    <div class="modal-contenido">
      <h3>Editar lugar</h3>
      <label>Nombre *</label>
      <input id="edit-nombre" type="text" value="${lugar.nombre}" required>
      <label>Categoría</label>
      <select id="edit-categoria">
        <option value="">Selecciona...</option>
        <option value="playa" ${lugar.categoria === 'playa' ? 'selected' : ''}>Playa</option>
        <option value="volcan" ${lugar.categoria === 'volcan' ? 'selected' : ''}>Volcán</option>
        <option value="ciudad" ${lugar.categoria === 'ciudad' ? 'selected' : ''}>Ciudad</option>
        <option value="naturaleza" ${lugar.categoria === 'naturaleza' ? 'selected' : ''}>Naturaleza</option>
        <option value="cultural" ${lugar.categoria === 'cultural' ? 'selected' : ''}>Cultural</option>
        <option value="otro" ${lugar.categoria === 'otro' ? 'selected' : ''}>Otro</option>
      </select>
      <label>URL</label>
      <input id="edit-url" type="url" value="${lugar.url || ''}">
      <label>URL imagen</label>
      <input id="edit-imagen" type="url" value="${lugar.imagen || ''}">
      <div class="modal-botones">
        <button id="btn-cancelar-editar">Cancelar</button>
        <button id="btn-actualizar">Actualizar</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  document.getElementById('btn-cancelar-editar').onclick = () => document.body.removeChild(modal);
  modal.addEventListener('click', (ev) => {
    if (ev.target === modal) document.body.removeChild(modal);
  });

  document.getElementById('btn-actualizar').onclick = async () => {
    const cambios = {
      nombre: document.getElementById('edit-nombre').value.trim(),
      categoria: document.getElementById('edit-categoria').value || null,
      url: document.getElementById('edit-url').value || null,
      imagen: document.getElementById('edit-imagen').value || null
    };

    const { error } = await supabase
      .from('lugares')
      .update(cambios)
      .eq('id', id);

    if (error) {
      alert('Error al actualizar: ' + error.message);
      return;
    }
    document.body.removeChild(modal);
  };
}

async function eliminarLugar(id) {
  if (!modoAdmin) return;
  if (!confirm('¿Seguro que deseas eliminar este lugar?')) return;

  const { error } = await supabase
    .from('lugares')
    .delete()
    .eq('id', id);

  if (error) {
    alert('Error al eliminar: ' + error.message);
  }
}

// =============================================
// 11. MODO OSCURO (persistente)
// =============================================
function iniciarModoOscuro() {
  const toggle = document.getElementById('modo-oscuro');
  if (!toggle) return;

  // Recuperar preferencia guardada
  if (localStorage.getItem('modo-oscuro') === 'true') {
    document.body.classList.add('oscuro');
  }

  toggle.addEventListener('click', () => {
    document.body.classList.toggle('oscuro');
    localStorage.setItem('modo-oscuro', document.body.classList.contains('oscuro'));
  });
}

// =============================================
// 12. ARRANQUE DE LA APLICACIÓN
// =============================================
async function iniciarApp() {
  inicializarMapa();
  iniciarModoOscuro();

  // Cargar lugares iniciales
  await cargarLugares();

  // Suscribirse a cambios en tiempo real
  suscribirseACambios();

  // Nota: el clic en el mapa para añadir solo se activa cuando admin inicia sesión
  // Esto se hace en el evento del botón admin.
}

// Esperar a que el DOM esté listo
document.addEventListener('DOMContentLoaded', iniciarApp);
