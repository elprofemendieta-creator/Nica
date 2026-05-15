// ===================== CONFIGURACIÓN SUPABASE =====================
const SUPABASE_URL = 'https://tusubdominio.supabase.co';   // <-- REEMPLAZAR
const SUPABASE_ANON_KEY = 'tu_clave_anon';                // <-- REEMPLAZAR
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Variables globales
let map, markerCluster, currentLayers = {}, currentUser = null, currentUserId = null, isAdmin = false;
let allPlaces = [];
let etiquetasUnicas = new Set();

// Elementos DOM
const authScreen = document.getElementById('authScreen');
const appScreen = document.getElementById('appScreen');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const logoutBtn = document.getElementById('logoutBtn');
const userNickSpan = document.getElementById('userNick');
const darkModeToggle = document.getElementById('darkModeToggle');
const searchInput = document.getElementById('searchInput');
const placesList = document.getElementById('placesList');
const etiquetasFiltro = document.getElementById('etiquetasFiltro');
const adminPanel = document.getElementById('adminPanel');
const addPlaceBtn = document.getElementById('addPlaceBtn');
const verRankingBtn = document.getElementById('verRankingBtn');
const exportHistorialBtn = document.getElementById('exportHistorialBtn');
const sendNotificationBtn = document.getElementById('sendNotificationBtn');
const geolocationBtn = document.getElementById('geolocationBtn');
const forgotPasswordLink = document.getElementById('forgotPasswordLink');

// ===================== UTILIDADES =====================
function mostrarToast(mensaje, tipo = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${tipo}`;
    toast.innerHTML = `<i class="fas ${tipo === 'promocion' ? 'fa-bullhorn' : tipo === 'nuevo_lugar' ? 'fa-plus-circle' : 'fa-info-circle'}"></i> <span>${mensaje}</span>`;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 5000);
}

function initDarkMode() {
    const isDark = localStorage.getItem('darkMode') === 'true';
    if (isDark) document.body.classList.add('dark-mode');
    darkModeToggle.innerHTML = isDark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
    darkModeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        const dark = document.body.classList.contains('dark-mode');
        localStorage.setItem('darkMode', dark);
        darkModeToggle.innerHTML = dark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
    });
}

// ===================== MAPA =====================
function initMap() {
    map = L.map('map').setView([12.8654, -85.2072], 8);
    currentLayers.calles = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', { attribution: '&copy; OpenStreetMap' }).addTo(map);
    currentLayers.satelite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { attribution: 'Esri' });
    currentLayers.relieve = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', { attribution: 'OpenTopoMap' });
    
    markerCluster = L.markerClusterGroup();
    map.addLayer(markerCluster);
    
    document.querySelectorAll('.layer-btn[data-layer]').forEach(btn => {
        btn.addEventListener('click', () => {
            const layer = btn.dataset.layer;
            Object.keys(currentLayers).forEach(l => { if (map.hasLayer(currentLayers[l])) map.removeLayer(currentLayers[l]); });
            map.addLayer(currentLayers[layer]);
            document.querySelectorAll('.layer-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });
}

async function cargarLugares() {
    const { data, error } = await supabase.from('lugares').select('*');
    if (error) { console.error(error); return; }
    allPlaces = data;
    
    // Actualizar etiquetas únicas
    etiquetasUnicas.clear();
    allPlaces.forEach(p => { if (p.etiquetas) p.etiquetas.forEach(e => etiquetasUnicas.add(e)); });
    actualizarFiltrosEtiquetas();
    actualizarMarcadores();
    actualizarListaLugares();
}

function actualizarFiltrosEtiquetas() {
    etiquetasFiltro.innerHTML = '<div class="etiqueta-filtro active" data-filter="todos">Todos</div>';
    etiquetasUnicas.forEach(et => {
        const btn = document.createElement('div');
        btn.className = 'etiqueta-filtro';
        btn.textContent = et;
        btn.dataset.filter = et;
        btn.addEventListener('click', () => {
            document.querySelectorAll('.etiqueta-filtro').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            actualizarMarcadores();
            actualizarListaLugares();
        });
        etiquetasFiltro.appendChild(btn);
    });
}

async function actualizarMarcadores() {
    markerCluster.clearLayers();
    const searchTerm = searchInput.value.toLowerCase();
    const etiquetaActiva = document.querySelector('.etiqueta-filtro.active')?.dataset.filter || 'todos';
    
    let filtered = allPlaces.filter(p => {
        const matchSearch = p.nombre.toLowerCase().includes(searchTerm);
        const matchEtiqueta = etiquetaActiva === 'todos' || (p.etiquetas && p.etiquetas.includes(etiquetaActiva));
        return matchSearch && matchEtiqueta;
    });
    
    // Obtener promedios de votos
    for (let place of filtered) {
        const { data: votosData, error } = await supabase.from('votos').select('estrellas').eq('lugar_id', place.id);
        if (!error && votosData) {
            const total = votosData.length;
            const suma = votosData.reduce((acc, v) => acc + v.estrellas, 0);
            place.promedio = total ? suma / total : 0;
            place.total_votos = total;
        } else { place.promedio = 0; place.total_votos = 0; }
        
        // Obtener total de visitas (de la tabla lugares)
        // Ya viene en place.total_visitas
    }
    
    filtered.forEach(place => {
        const starsHtml = '★'.repeat(Math.round(place.promedio)) + '☆'.repeat(5 - Math.round(place.promedio));
        const popup = L.popup().setContent(`
            <div style="min-width:200px;">
                <b>${place.nombre}</b><br>
                ${place.imagen_miniatura ? `<img src="${place.imagen_miniatura}" style="width:100%; border-radius:8px; margin:5px 0;">` : ''}
                <div>⭐ ${place.promedio.toFixed(1)} (${place.total_votos} votos)</div>
                <div>👁️ ${place.total_visitas} visitas</div>
                <button onclick="visitarLugar(${place.id})" style="background:#F57C00; color:white; border:none; padding:5px 10px; border-radius:5px; margin:5px 0; cursor:pointer;">🔗 Visitar</button>
                <button onclick="verDetalleLugar(${place.id})" style="background:#2E7D32; color:white; border:none; padding:5px 10px; border-radius:5px; cursor:pointer;">💬 Ver más</button>
                ${isAdmin ? `<button onclick="eliminarLugar(${place.id})" style="background:#d32f2f; color:white; border:none; padding:5px 10px; border-radius:5px; margin-left:5px; cursor:pointer;">🗑️</button>` : ''}
            </div>
        `);
        const marker = L.marker([place.lat, place.lng]).bindPopup(popup);
        markerCluster.addLayer(marker);
    });
}

function actualizarListaLugares() {
    const searchTerm = searchInput.value.toLowerCase();
    const etiquetaActiva = document.querySelector('.etiqueta-filtro.active')?.dataset.filter || 'todos';
    let filtered = allPlaces.filter(p => p.nombre.toLowerCase().includes(searchTerm) && (etiquetaActiva === 'todos' || (p.etiquetas && p.etiquetas.includes(etiquetaActiva))));
    
    if (filtered.length === 0) { placesList.innerHTML = '<div style="text-align:center; padding:20px; color:#999;">No se encontraron lugares</div>'; return; }
    
    placesList.innerHTML = filtered.map(place => `
        <div class="place-card" onclick="centrarMapa(${place.lat}, ${place.lng})">
            <div class="place-card-header">
                ${place.imagen_miniatura ? `<img src="${place.imagen_miniatura}" alt="${place.nombre}">` : '<div style="width:60px; height:60px; background:#e0e0e0; border-radius:10px; display:flex; align-items:center; justify-content:center;"><i class="fas fa-map-marker-alt"></i></div>'}
                <div class="place-card-info">
                    <h4>${place.nombre}</h4>
                    <div class="place-stats"><span>⭐ ${(place.promedio || 0).toFixed(1)}</span><span>👁️ ${place.total_visitas || 0}</span></div>
                    <div class="place-etiquetas">${place.etiquetas ? place.etiquetas.map(e => `<span class="place-tag">${e}</span>`).join('') : ''}</div>
                </div>
            </div>
        </div>
    `).join('');
}

window.centrarMapa = (lat, lng) => map.setView([lat, lng], 15);

// ===================== VISITAS, VOTOS, COMENTARIOS =====================
window.visitarLugar = async (lugarId) => {
    // Actualizar contador en la tabla lugares
    const lugar = allPlaces.find(p => p.id === lugarId);
    if (lugar && lugar.url) {
        await supabase.rpc('incrementar_visitas', { lugar_id: lugarId }); // Necesitas crear función en SQL
        // Alternativa: fetch + update
        const { error } = await supabase.from('lugares').update({ total_visitas: (lugar.total_visitas || 0) + 1 }).eq('id', lugarId);
        if (!error) {
            await supabase.from('historial').insert([{ usuario_id: currentUserId, lugar_id: lugarId, accion: 'visita', detalle: `Visitó ${lugar.nombre}` }]);
            window.open(lugar.url, '_blank');
            cargarLugares();
        }
    } else mostrarToast('No hay enlace configurado', 'error');
};

async function verDetalleLugar(lugarId) {
    const lugar = allPlaces.find(p => p.id === lugarId);
    // Obtener voto actual del usuario
    const { data: votoActual } = await supabase.from('votos').select('estrellas').eq('usuario_id', currentUserId).eq('lugar_id', lugarId).single();
    // Obtener comentarios
    const { data: comentarios } = await supabase.from('comentarios').select('*, perfiles(nick)').eq('lugar_id', lugarId).order('created_at', { ascending: false });
    
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'flex';
    modal.innerHTML = `
        <div class="modal-content" style="max-width:600px;">
            <div class="modal-header"><h3>${lugar.nombre}</h3><button class="close-modal" onclick="this.closest('.modal').remove()">&times;</button></div>
            <div style="padding:20px;">
                ${lugar.imagen_miniatura ? `<img src="${lugar.imagen_miniatura}" style="width:100%; border-radius:10px; margin-bottom:15px;">` : ''}
                <div class="rating-section">
                    <label>Tu puntuación:</label>
                    <div class="stars-container" data-lugar="${lugar.id}">
                        ${[1,2,3,4,5].map(i => `<i class="fa${votoActual && votoActual.estrellas >= i ? 's' : 'r'} fa-star" data-score="${i}" style="cursor:pointer; font-size:24px; margin:0 3px;"></i>`).join('')}
                    </div>
                </div>
                <div style="margin:20px 0;"><a href="${lugar.url || '#'}" target="_blank" class="submit-btn" style="display:inline-block;">🔗 Visitar lugar</a></div>
                <div class="comentarios-section">
                    <h4>Comentarios</h4>
                    <div id="comentariosList-${lugar.id}">${comentarios?.map(c => `<div><strong>${c.perfiles.nick}</strong><small> ${new Date(c.created_at).toLocaleString()}</small><p>${c.texto}</p>${isAdmin ? `<button onclick="borrarComentario(${c.id}, ${lugar.id})">🗑️</button>` : ''}</div>`).join('') || '<div>No hay comentarios</div>'}</div>
                    <textarea id="nuevoComentario-${lugar.id}" placeholder="Escribe tu comentario..." rows="2" style="width:100%; margin:10px 0; padding:8px;"></textarea>
                    <button onclick="enviarComentario(${lugar.id})" class="submit-btn">Enviar</button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    
    // Manejar votación
    modal.querySelectorAll('.stars-container i').forEach(star => {
        star.addEventListener('click', async () => {
            const score = parseInt(star.dataset.score);
            const { error } = await supabase.from('votos').upsert({ usuario_id: currentUserId, lugar_id: lugar.id, estrellas: score }, { onConflict: 'usuario_id, lugar_id' });
            if (!error) {
                await supabase.from('historial').insert([{ usuario_id: currentUserId, lugar_id: lugar.id, accion: 'voto', detalle: `Puntuación ${score} estrellas` }]);
                mostrarToast('Voto registrado', 'success');
                modal.remove();
                verDetalleLugar(lugar.id);
                cargarLugares();
            }
        });
    });
}

window.enviarComentario = async (lugarId) => {
    const texto = document.getElementById(`nuevoComentario-${lugarId}`).value;
    if (!texto.trim()) return;
    const { error } = await supabase.from('comentarios').insert({ lugar_id: lugarId, usuario_id: currentUserId, texto });
    if (!error) {
        await supabase.from('historial').insert([{ usuario_id: currentUserId, lugar_id: lugarId, accion: 'comentario', detalle: texto }]);
        mostrarToast('Comentario enviado', 'success');
        const modal = document.querySelector('.modal');
        if (modal) modal.remove();
        verDetalleLugar(lugarId);
        cargarLugares();
    }
};

window.borrarComentario = async (comentarioId, lugarId) => {
    if (confirm('¿Borrar comentario?')) {
        await supabase.from('comentarios').delete().eq('id', comentarioId);
        const modal = document.querySelector('.modal');
        if (modal) modal.remove();
        verDetalleLugar(lugarId);
    }
};

window.eliminarLugar = async (lugarId) => {
    if (confirm('¿Eliminar lugar?')) {
        await supabase.from('lugares').delete().eq('id', lugarId);
        cargarLugares();
    }
};

// ===================== AUTENTICACIÓN =====================
async function verificarSesion() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
        currentUserId = session.user.id;
        const { data: perfil } = await supabase.from('perfiles').select('nick, es_admin').eq('id', currentUserId).single();
        currentUser = perfil?.nick;
        isAdmin = perfil?.es_admin || false;
        userNickSpan.textContent = currentUser;
        authScreen.classList.add('hidden');
        appScreen.classList.remove('hidden');
        if (isAdmin) adminPanel.classList.remove('hidden');
        initMap();
        cargarLugares();
        // Suscribirse a notificaciones en tiempo real
        suscribirNotificaciones();
        cargarNotificaciones();
    } else {
        authScreen.classList.remove('hidden');
        appScreen.classList.add('hidden');
    }
}

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) mostrarToast(error.message, 'error');
    else verificarSesion();
});

registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;
    const nombre = document.getElementById('regNombre').value;
    const nick = document.getElementById('regNick').value;
    const edad = document.getElementById('regEdad').value;
    const sexo = document.getElementById('regSexo').value;
    
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) { mostrarToast(error.message, 'error'); return; }
    // Crear perfil
    await supabase.from('perfiles').insert({ id: data.user.id, nombre_completo: nombre, nick, edad: edad || null, sexo: sexo || null });
    mostrarToast('Registro exitoso. Inicia sesión.', 'success');
    document.querySelector('.tab-btn[data-tab="login"]').click();
});

logoutBtn.addEventListener('click', async () => {
    await supabase.auth.signOut();
    location.reload();
});

forgotPasswordLink.addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('resetPasswordModal').style.display = 'flex';
});
document.getElementById('resetPasswordForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('resetEmail').value;
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) mostrarToast(error.message, 'error');
    else mostrarToast('Revisa tu correo para restablecer contraseña', 'success');
    document.getElementById('resetPasswordModal').style.display = 'none';
});

// ===================== ADMIN =====================
addPlaceBtn.addEventListener('click', () => {
    document.getElementById('modalTitle').textContent = 'Añadir Lugar';
    document.getElementById('lugarId').value = '';
    document.getElementById('lugarForm').reset();
    document.getElementById('lugarModal').style.display = 'flex';
});
document.getElementById('lugarForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('lugarId').value;
    const data = {
        nombre: document.getElementById('lugarNombre').value,
        lat: parseFloat(document.getElementById('lugarLat').value),
        lng: parseFloat(document.getElementById('lugarLng').value),
        url: document.getElementById('lugarUrl').value,
        imagen_miniatura: document.getElementById('lugarImagen').value,
        etiquetas: document.getElementById('lugarEtiquetas').value.split(',').map(e => e.trim()).filter(e => e)
    };
    if (id) await supabase.from('lugares').update(data).eq('id', id);
    else await supabase.from('lugares').insert([{ ...data, creado_por: currentUserId }]);
    document.getElementById('lugarModal').style.display = 'none';
    cargarLugares();
    mostrarToast(id ? 'Lugar actualizado' : 'Lugar añadido', 'success');
});

verRankingBtn.addEventListener('click', async () => {
    // Obtener ranking
    const { data: visitas } = await supabase.from('lugares').select('id, nombre, total_visitas').order('total_visitas', { ascending: false }).limit(10);
    const { data: votosRaw } = await supabase.from('votos').select('lugar_id, estrellas');
    const agrupado = {};
    votosRaw.forEach(v => { if (!agrupado[v.lugar_id]) agrupado[v.lugar_id] = { suma: 0, count: 0 }; agrupado[v.lugar_id].suma += v.estrellas; agrupado[v.lugar_id].count++; });
    const mejores = Object.entries(agrupado).map(([id, d]) => ({ id: parseInt(id), promedio: d.suma / d.count, total_votos: d.count })).sort((a,b) => b.promedio - a.promedio).slice(0,10);
    const lugaresMap = Object.fromEntries(allPlaces.map(p => [p.id, p.nombre]));
    const rankingPuntos = mejores.map(m => ({ nombre: lugaresMap[m.id], promedio: m.promedio.toFixed(1), votos: m.total_votos }));
    
    const modal = document.getElementById('rankingModal');
    const content = document.getElementById('rankingContent');
    const mostrar = (tipo) => {
        if (tipo === 'visitas') content.innerHTML = visitas.map((p,i) => `<div class="ranking-item"><span class="position">${i+1}°</span><span>${p.nombre}</span><span>👁️ ${p.total_visitas}</span></div>`).join('');
        else content.innerHTML = rankingPuntos.map((p,i) => `<div class="ranking-item"><span class="position">${i+1}°</span><span>${p.nombre}</span><span>⭐ ${p.promedio} (${p.votos})</span></div>`).join('');
    };
    mostrar('visitas');
    modal.style.display = 'flex';
    document.querySelectorAll('.rank-tab').forEach(tab => {
        tab.addEventListener('click', () => { document.querySelectorAll('.rank-tab').forEach(t=>t.classList.remove('active')); tab.classList.add('active'); mostrar(tab.dataset.rank); });
    });
});
document.getElementById('exportRankingBtn')?.addEventListener('click', async () => {
    const { data: visitas } = await supabase.from('lugares').select('nombre, total_visitas').order('total_visitas', { ascending: false });
    const ws = XLSX.utils.json_to_sheet(visitas);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Ranking');
    XLSX.writeFile(wb, 'ranking_lugares.xlsx');
});

exportHistorialBtn.addEventListener('click', async () => {
    const { data: historial } = await supabase.from('historial').select('*, perfiles(nick), lugares(nombre)').order('created_at', { ascending: false });
    const exportData = historial.map(h => ({ Fecha: h.created_at, Usuario: h.perfiles?.nick, Lugar: h.lugares?.nombre, Acción: h.accion, Detalle: h.detalle }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Historial');
    XLSX.writeFile(wb, 'historial_visitas.xlsx');
});

sendNotificationBtn.addEventListener('click', () => document.getElementById('notifModal').style.display = 'flex');
document.getElementById('notifForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const mensaje = document.getElementById('notifMensaje').value;
    const tipo = document.getElementById('notifTipo').value;
    await supabase.from('notificaciones').insert([{ mensaje, tipo, creada_por: currentUserId }]);
    document.getElementById('notifModal').style.display = 'none';
    mostrarToast('Notificación enviada', 'success');
});

// ===================== NOTIFICACIONES EN TIEMPO REAL =====================
function suscribirNotificaciones() {
    supabase.channel('notificaciones')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notificaciones' }, payload => {
            if (payload.new.creada_por !== currentUserId) {
                mostrarToast(payload.new.mensaje, payload.new.tipo);
                cargarNotificaciones();
            }
        })
        .subscribe();
}

async function cargarNotificaciones() {
    const { data } = await supabase.from('notificaciones').select('*').order('created_at', { ascending: false }).limit(20);
    const list = document.getElementById('notificationList');
    if (!list) return;
    list.innerHTML = data.map(n => `<div class="notification-item ${!n.leida_por?.includes(currentUserId) ? 'unread' : ''}" data-id="${n.id}"><div><strong>${n.tipo === 'promocion' ? '🎉' : 'ℹ️'}</strong> ${n.mensaje}</div><small>${new Date(n.created_at).toLocaleString()}</small></div>`).join('');
    document.querySelectorAll('.notification-item').forEach(item => {
        item.addEventListener('click', async () => {
            const id = item.dataset.id;
            const notif = data.find(n => n.id == id);
            if (notif && !notif.leida_por?.includes(currentUserId)) {
                const leidas = [...(notif.leida_por || []), currentUserId];
                await supabase.from('notificaciones').update({ leida_por: leidas }).eq('id', id);
                item.classList.remove('unread');
            }
        });
    });
}

// Geolocalización
geolocationBtn.addEventListener('click', () => {
    if (navigator.geolocation) navigator.geolocation.getCurrentPosition(pos => map.setView([pos.coords.latitude, pos.coords.longitude], 13), () => mostrarToast('Error de geolocalización', 'error'));
    else mostrarToast('No soportado', 'error');
});

// Cerrar modales
document.querySelectorAll('.close-modal').forEach(btn => btn.addEventListener('click', function() { this.closest('.modal').style.display = 'none'; }));

// Iniciar
initDarkMode();
verificarSesion();