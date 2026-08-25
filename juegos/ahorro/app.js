// ============================================================
//  APP META PINOLERA – SOLO LOCALSTORAGE
//  Sin Firebase, sin autenticación. Datos persistentes locales.
// ============================================================

// ============================================================
//  ESTADO GLOBAL
// ============================================================
let datos = {
    meta: 0,
    sueño: '',
    abonos: []
};

// ============================================================
//  REFERENCIAS DOM
// ============================================================
let splash, app, btnIngresar, cargando;
let sueñoMostrado, metaTxt, acumuladoTxt, faltanteTxt, liquido, porcentaje, mensaje;
let btnAbono, btnHistorial, btnMeta;
let modalAbono, modalHistorial, modalConfig;
let fechaInput, montoInput, descInput, inputSueño, inputMeta;
let guardarAbonoBtn, cerrarAbonoBtn, guardarConfigBtn, cerrarConfigBtn;
let cerrarHistorialBtn, borrarTodoBtn, tablaHistorial;

// ============================================================
//  INICIALIZACIÓN CUANDO EL DOM ESTÉ LISTO
// ============================================================
document.addEventListener('DOMContentLoaded', function() {
    // Asignar referencias
    splash = document.getElementById('splash');
    app = document.getElementById('app');
    btnIngresar = document.getElementById('btnIngresar');
    cargando = document.getElementById('cargando');

    sueñoMostrado = document.getElementById('sueñoMostrado');
    metaTxt = document.getElementById('metaTxt');
    acumuladoTxt = document.getElementById('acumuladoTxt');
    faltanteTxt = document.getElementById('faltanteTxt');
    liquido = document.getElementById('liquido');
    porcentaje = document.getElementById('porcentaje');
    mensaje = document.getElementById('mensaje');

    btnAbono = document.getElementById('btnAbono');
    btnHistorial = document.getElementById('btnHistorial');
    btnMeta = document.getElementById('btnMeta');

    modalAbono = document.getElementById('modalAbono');
    modalHistorial = document.getElementById('modalHistorial');
    modalConfig = document.getElementById('modalConfig');

    fechaInput = document.getElementById('fecha');
    montoInput = document.getElementById('monto');
    descInput = document.getElementById('descripcion');
    inputSueño = document.getElementById('inputSueño');
    inputMeta = document.getElementById('inputMeta');

    guardarAbonoBtn = document.getElementById('guardarAbonoBtn');
    cerrarAbonoBtn = document.getElementById('cerrarAbonoBtn');
    guardarConfigBtn = document.getElementById('guardarConfigBtn');
    cerrarConfigBtn = document.getElementById('cerrarConfigBtn');
    cerrarHistorialBtn = document.getElementById('cerrarHistorialBtn');
    borrarTodoBtn = document.getElementById('borrarTodoBtn');
    tablaHistorial = document.getElementById('tablaHistorial');

    // Cargar datos desde localStorage
    cargarDatosLocal();

    // Evento del botón "Comenzar mi aventura"
    if (btnIngresar) {
        btnIngresar.addEventListener('click', iniciarApp);
    }

    // Eventos de los botones principales
    if (btnAbono) btnAbono.addEventListener('click', abrirAbono);
    if (btnHistorial) btnHistorial.addEventListener('click', verHistorial);
    if (btnMeta) btnMeta.addEventListener('click', cambiarMeta);

    // Eventos de modales
    if (guardarAbonoBtn) guardarAbonoBtn.addEventListener('click', guardarAbono);
    if (cerrarAbonoBtn) cerrarAbonoBtn.addEventListener('click', () => cerrarModal('modalAbono'));

    if (guardarConfigBtn) guardarConfigBtn.addEventListener('click', guardarConfiguracion);
    if (cerrarConfigBtn) cerrarConfigBtn.addEventListener('click', () => cerrarModal('modalConfig'));

    if (cerrarHistorialBtn) cerrarHistorialBtn.addEventListener('click', () => cerrarModal('modalHistorial'));
    if (borrarTodoBtn) borrarTodoBtn.addEventListener('click', borrarTodo);

    // Cerrar modales al hacer clic fuera del contenido
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) this.style.display = 'none';
        });
    });

    // Si ya hay meta guardada, podemos entrar directamente (pero dejamos que el usuario decida con el splash)
    // Si no hay meta, mostramos splash.
    if (datos.meta && datos.meta > 0) {
        // Si hay meta, podríamos saltar el splash, pero mejor mantenemos el flujo de entrada
        // El usuario presiona "Comenzar" y entramos.
    }
});

// ============================================================
//  FUNCIÓN PARA INICIAR LA APP (desde splash)
// ============================================================
function iniciarApp() {
    // Ocultar splash y mostrar app
    if (splash) splash.classList.add('hidden');
    if (app) app.style.display = 'block';
    if (cargando) cargando.style.display = 'none';

    // Si no hay meta definida, mostrar configuración
    if (!datos.meta || datos.meta === 0) {
        abrirConfiguracion();
    } else {
        actualizarUI();
    }
}

// ============================================================
//  CARGA Y GUARDADO EN LOCALSTORAGE
// ============================================================
function cargarDatosLocal() {
    const local = JSON.parse(localStorage.getItem('metaPinolera'));
    if (local) {
        datos = local;
        // Asegurar que tenga las propiedades correctas
        if (!datos.abonos) datos.abonos = [];
        if (!datos.meta) datos.meta = 0;
        if (!datos.sueño) datos.sueño = '';
    } else {
        datos = { meta: 0, sueño: '', abonos: [] };
    }
}

function guardarDatosLocal() {
    localStorage.setItem('metaPinolera', JSON.stringify(datos));
}

// ============================================================
//  ACTUALIZAR INTERFAZ (termómetro, estadísticas, etc.)
// ============================================================
function actualizarUI() {
    const acumulado = datos.abonos.reduce((sum, a) => sum + a.monto, 0);
    let porcentajeVal = 0;
    if (datos.meta > 0) {
        porcentajeVal = (acumulado / datos.meta) * 100;
    }
    if (porcentajeVal > 100) porcentajeVal = 100;

    if (metaTxt) metaTxt.textContent = 'C$' + datos.meta.toLocaleString();
    if (acumuladoTxt) acumuladoTxt.textContent = 'C$' + acumulado.toLocaleString();
    if (faltanteTxt) faltanteTxt.textContent = 'C$' + Math.max(0, datos.meta - acumulado).toLocaleString();
    if (porcentaje) porcentaje.textContent = porcentajeVal.toFixed(1) + '%';
    if (liquido) liquido.style.height = porcentajeVal + '%';
    if (sueñoMostrado) sueñoMostrado.textContent = datos.sueño ? '✨ ' + datos.sueño : '✨ ¡Define tu sueño!';

    // Confeti si se alcanzó el 100%
    if (porcentajeVal >= 100) {
        confeti();
    }
}

// ============================================================
//  ABONO
// ============================================================
function abrirAbono() {
    if (fechaInput) fechaInput.value = new Date().toISOString().split('T')[0];
    if (montoInput) montoInput.value = '';
    if (descInput) descInput.value = '';
    if (modalAbono) modalAbono.style.display = 'flex';
}

function guardarAbono() {
    const fecha = fechaInput ? fechaInput.value : '';
    const monto = parseFloat(montoInput ? montoInput.value : '');
    const descripcion = descInput ? descInput.value.trim() : '';

    if (!fecha) {
        alert('Selecciona una fecha.');
        return;
    }
    if (!monto || monto <= 0) {
        alert('Ingresa un monto válido.');
        return;
    }

    datos.abonos.push({ fecha, monto, descripcion });
    guardarDatosLocal();
    actualizarUI();

    // Mensaje aleatorio
    const msgs = [
        "🚀 Excelente avance!",
        "🌟 Tu meta está más cerca.",
        "💎 Cada ahorro cuenta.",
        "🔥 Sigue así campeón.",
        "🏆 Vas por buen camino.",
        "💰 El éxito se construye paso a paso.",
        "🎯 No te detengas.",
        "✨ Hoy avanzaste un poco más."
    ];
    if (mensaje) mensaje.textContent = msgs[Math.floor(Math.random() * msgs.length)];

    sonido();
    cerrarModal('modalAbono');
}

// ============================================================
//  CONFIGURACIÓN INICIAL (meta + sueño)
// ============================================================
function abrirConfiguracion() {
    if (inputSueño) inputSueño.value = datos.sueño || '';
    if (inputMeta) inputMeta.value = '';
    if (modalConfig) modalConfig.style.display = 'flex';
}

function guardarConfiguracion() {
    const sueño = inputSueño ? inputSueño.value.trim() : '';
    const meta = parseFloat(inputMeta ? inputMeta.value : '');

    if (!sueño) {
        alert('Escribe tu sueño.');
        return;
    }
    if (!meta || meta <= 0) {
        alert('Ingresa un monto de meta válido.');
        return;
    }

    datos.sueño = sueño;
    datos.meta = meta;
    guardarDatosLocal();
    actualizarUI();
    cerrarModal('modalConfig');
}

// ============================================================
//  HISTORIAL
// ============================================================
function verHistorial() {
    let html = `
        <table>
            <thead>
                <tr><th>Fecha</th><th>Abono</th><th>Descripción</th><th></th></tr>
            </thead>
            <tbody>
    `;
    if (datos.abonos.length === 0) {
        html += '<tr><td colspan="4">No hay abonos registrados.</td></tr>';
    } else {
        datos.abonos.forEach((a, i) => {
            html += `
                <tr>
                    <td>${a.fecha}</td>
                    <td>C$${a.monto}</td>
                    <td>${a.descripcion || ''}</td>
                    <td><button class="eliminar-abono" data-index="${i}">🗑️</button></td>
                </tr>
            `;
        });
    }
    html += '</tbody></table>';
    if (tablaHistorial) tablaHistorial.innerHTML = html;

    // Asignar eventos a los botones eliminar
    document.querySelectorAll('.eliminar-abono').forEach(btn => {
        btn.addEventListener('click', function() {
            const index = parseInt(this.dataset.index);
            if (confirm('¿Eliminar este abono?')) {
                datos.abonos.splice(index, 1);
                guardarDatosLocal();
                actualizarUI();
                verHistorial(); // refrescar tabla
            }
        });
    });

    if (modalHistorial) modalHistorial.style.display = 'flex';
}

function borrarTodo() {
    if (confirm('¿BORRAR TODOS LOS ABONOS?')) {
        datos.abonos = [];
        guardarDatosLocal();
        actualizarUI();
        verHistorial();
    }
}

// ============================================================
//  CAMBIAR META (desde botón)
// ============================================================
function cambiarMeta() {
    const nueva = prompt('Nueva Meta (C$):');
    if (nueva !== null && !isNaN(nueva) && parseFloat(nueva) > 0) {
        const nuevoSueño = prompt('Escribe tu nuevo sueño (opcional):');
        datos.meta = parseFloat(nueva);
        if (nuevoSueño !== null && nuevoSueño.trim() !== '') {
            datos.sueño = nuevoSueño.trim();
        }
        guardarDatosLocal();
        actualizarUI();
    } else if (nueva !== null) {
        alert('Ingresa un número válido mayor a 0.');
    }
}

// ============================================================
//  UTILIDADES
// ============================================================
function cerrarModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.style.display = 'none';
}

function sonido() {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = 600;
        osc.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.15);
    } catch (e) {}
}

function confeti() {
    for (let i = 0; i < 60; i++) {
        const p = document.createElement('div');
        p.className = 'particula';
        p.style.left = Math.random() * 100 + 'vw';
        p.style.background = `hsl(${Math.random() * 360}, 100%, 50%)`;
        p.style.width = (Math.random() * 8 + 4) + 'px';
        p.style.height = p.style.width;
        p.style.animationDuration = (Math.random() * 2 + 2) + 's';
        document.body.appendChild(p);
        setTimeout(() => p.remove(), 3000);
    }
}

// ============================================================
//  FIN DEL CÓDIGO
// ============================================================
