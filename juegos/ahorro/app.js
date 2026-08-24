// ============================================================
//  CONFIGURACIÓN DE FIREBASE - ¡REEMPLAZA CON TUS DATOS!
// ============================================================
const firebaseConfig = {
  apiKey: "AIzaSyA6jVICuE17KJcO34gE1brMxqWEfNd3Fy0",
  authDomain: "mapa-41b00.firebaseapp.com",
  projectId: "mapa-41b00",
  storageBucket: "mapa-41b00.firebasestorage.app",
  messagingSenderId: "535032835400",
  appId: "1:535032835400:web:68c079cbc3f419eafd177d"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// ============================================================
//  ESTADO GLOBAL
// ============================================================
let datos = {
    meta: 0,
    sueño: '',
    abonos: []
};
let userId = null;
let datosCargados = false;
let primeraVez = false;

// ============================================================
//  REFERENCIAS DOM
// ============================================================
const splash = document.getElementById('splash');
const app = document.getElementById('app');
const btnIngresar = document.getElementById('btnIngresar');
const cargando = document.getElementById('cargando');

const sueñoMostrado = document.getElementById('sueñoMostrado');
const metaTxt = document.getElementById('metaTxt');
const acumuladoTxt = document.getElementById('acumuladoTxt');
const faltanteTxt = document.getElementById('faltanteTxt');
const liquido = document.getElementById('liquido');
const porcentaje = document.getElementById('porcentaje');
const mensaje = document.getElementById('mensaje');

const btnAbono = document.getElementById('btnAbono');
const btnHistorial = document.getElementById('btnHistorial');
const btnMeta = document.getElementById('btnMeta');

// Modales
const modalAbono = document.getElementById('modalAbono');
const modalHistorial = document.getElementById('modalHistorial');
const modalConfig = document.getElementById('modalConfig');

// Inputs
const fechaInput = document.getElementById('fecha');
const montoInput = document.getElementById('monto');
const descInput = document.getElementById('descripcion');
const inputSueño = document.getElementById('inputSueño');
const inputMeta = document.getElementById('inputMeta');

// Botones modales
const guardarAbonoBtn = document.getElementById('guardarAbonoBtn');
const cerrarAbonoBtn = document.getElementById('cerrarAbonoBtn');
const guardarConfigBtn = document.getElementById('guardarConfigBtn');
const cerrarConfigBtn = document.getElementById('cerrarConfigBtn');
const cerrarHistorialBtn = document.getElementById('cerrarHistorialBtn');
const borrarTodoBtn = document.getElementById('borrarTodoBtn');
const tablaHistorial = document.getElementById('tablaHistorial');

// ============================================================
//  AUTENTICACIÓN ANÓNIMA
// ============================================================
function iniciarSesionAnonima() {
    cargando.style.display = 'block';
    btnIngresar.disabled = true;

    auth.signInAnonymously()
        .then((userCredential) => {
            userId = userCredential.user.uid;
            cargando.style.display = 'none';
            btnIngresar.disabled = false;
            cargarDatosFirestore();
        })
        .catch((error) => {
            console.error("Error en auth anónima:", error);
            // Mostrar mensaje específico
            let msg = "No se pudo conectar con Firebase. ";
            if (error.code === 'auth/operation-not-allowed') {
                msg += "Habilita la autenticación anónima en Firebase Console.";
            } else if (error.code === 'auth/network-request-failed') {
                msg += "Revisa tu conexión a internet.";
            } else {
                msg += "Error: " + error.message;
            }
            alert(msg);
            // Fallback a localStorage
            cargando.style.display = 'none';
            btnIngresar.disabled = false;
            userId = 'local';
            cargarDatosLocal();
        });
}
        .catch((error) => {
            console.error("Error en auth anónima:", error);
            alert("No se pudo conectar con Firebase. Revisa tu configuración.");
            cargando.style.display = 'none';
            btnIngresar.disabled = false;
            // Fallback: usar localStorage
            userId = 'local';
            cargarDatosLocal();
        });
}

// ============================================================
//  FUNCIONES DE FIREBASE (CRUD)
// ============================================================
function cargarDatosFirestore() {
    if (!userId) return;
    const docRef = db.collection('metas').doc(userId);

    docRef.get()
        .then((doc) => {
            if (doc.exists) {
                datos = doc.data();
                // Asegurar que abonos sea array
                if (!datos.abonos) datos.abonos = [];
                if (!datos.meta) datos.meta = 0;
                if (!datos.sueño) datos.sueño = '';
            } else {
                // No hay datos, crear documento vacío
                datos = { meta: 0, sueño: '', abonos: [] };
                primeraVez = true;
            }
            datosCargados = true;
            // Ocultar splash y mostrar app
            splash.classList.add('hidden');
            app.style.display = 'block';
            // Si es primera vez o meta=0, mostrar configuración
            if (primeraVez || datos.meta === 0) {
                abrirConfiguracion();
            } else {
                actualizarUI();
            }
        })
        .catch((error) => {
            console.error("Error cargando datos:", error);
            // Fallback a localStorage
            cargarDatosLocal();
        });
}

function guardarDatosFirestore() {
    if (!userId || userId === 'local') {
        guardarDatosLocal();
        return;
    }
    const docRef = db.collection('metas').doc(userId);
    docRef.set(datos)
        .then(() => {
            // console.log("Datos guardados en Firestore");
        })
        .catch((error) => {
            console.error("Error guardando en Firestore:", error);
            guardarDatosLocal(); // fallback
        });
}

// ============================================================
//  FALLBACK LOCALSTORAGE
// ============================================================
function cargarDatosLocal() {
    const local = JSON.parse(localStorage.getItem("metaPinolera")) || {
        meta: 0,
        sueño: '',
        abonos: []
    };
    datos = local;
    datosCargados = true;
    splash.classList.add('hidden');
    app.style.display = 'block';
    if (datos.meta === 0) {
        abrirConfiguracion();
    } else {
        actualizarUI();
    }
}

function guardarDatosLocal() {
    localStorage.setItem("metaPinolera", JSON.stringify(datos));
}

// ============================================================
//  FUNCIONES PRINCIPALES (UI y lógica)
// ============================================================
function actualizarUI() {
    const acumulado = datos.abonos.reduce((a, b) => a + b.monto, 0);
    let porcentajeVal = 0;
    if (datos.meta > 0) {
        porcentajeVal = (acumulado / datos.meta) * 100;
    }
    if (porcentajeVal > 100) porcentajeVal = 100;

    metaTxt.textContent = 'C$' + datos.meta.toLocaleString();
    acumuladoTxt.textContent = 'C$' + acumulado.toLocaleString();
    faltanteTxt.textContent = 'C$' + Math.max(0, datos.meta - acumulado).toLocaleString();
    porcentaje.textContent = porcentajeVal.toFixed(1) + '%';
    liquido.style.height = porcentajeVal + '%';

    sueñoMostrado.textContent = datos.sueño ? '✨ ' + datos.sueño : '✨ ¡Define tu sueño!';

    if (porcentajeVal >= 100) {
        confeti();
    }
}

function guardarDatosYActualizar() {
    guardarDatosFirestore();
    actualizarUI();
}

// ============================================================
//  ABONO
// ============================================================
function abrirAbono() {
    fechaInput.value = new Date().toISOString().split('T')[0];
    montoInput.value = '';
    descInput.value = '';
    modalAbono.style.display = 'flex';
}

function guardarAbono() {
    const fecha = fechaInput.value;
    const monto = parseFloat(montoInput.value);
    const descripcion = descInput.value.trim();

    if (!fecha) {
        alert('Selecciona una fecha.');
        return;
    }
    if (!monto || monto <= 0) {
        alert('Ingresa un monto válido.');
        return;
    }

    datos.abonos.push({ fecha, monto, descripcion });
    guardarDatosYActualizar();

    const msgs = [
        "🚀 Excelente avance!", "🌟 Tu meta está más cerca.",
        "💎 Cada ahorro cuenta.", "🔥 Sigue así campeón.",
        "🏆 Vas por buen camino.", "💰 El éxito se construye paso a paso.",
        "🎯 No te detengas.", "✨ Hoy avanzaste un poco más."
    ];
    mensaje.textContent = msgs[Math.floor(Math.random() * msgs.length)];
    sonido();
    cerrarModal(modalAbono);
}

// ============================================================
//  CONFIGURACIÓN INICIAL
// ============================================================
function abrirConfiguracion() {
    inputSueño.value = datos.sueño || '';
    inputMeta.value = '';
    modalConfig.style.display = 'flex';
}

function guardarConfiguracion() {
    const sueño = inputSueño.value.trim();
    const meta = parseFloat(inputMeta.value);
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
    guardarDatosYActualizar();
    cerrarModal(modalConfig);
}

// ============================================================
//  HISTORIAL
// ============================================================
function verHistorial() {
    let html = `
        <table>
            <thead><tr><th>Fecha</th><th>Abono</th><th>Descripción</th><th></th></tr></thead>
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
    tablaHistorial.innerHTML = html;

    // Asignar eventos a los botones eliminar
    tablaHistorial.querySelectorAll('.eliminar-abono').forEach(btn => {
        btn.addEventListener('click', function() {
            const index = parseInt(this.dataset.index);
            eliminarAbono(index);
        });
    });

    modalHistorial.style.display = 'flex';
}

function eliminarAbono(index) {
    if (confirm('¿Eliminar este abono?')) {
        datos.abonos.splice(index, 1);
        guardarDatosYActualizar();
        verHistorial(); // refrescar tabla
    }
}

function borrarTodo() {
    if (confirm('¿BORRAR TODOS LOS ABONOS?')) {
        datos.abonos = [];
        guardarDatosYActualizar();
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
        guardarDatosYActualizar();
    } else if (nueva !== null) {
        alert('Ingresa un número válido mayor a 0.');
    }
}

// ============================================================
//  UTILIDADES
// ============================================================
function cerrarModal(modal) {
    modal.style.display = 'none';
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
//  EVENTOS
// ============================================================
btnIngresar.addEventListener('click', iniciarSesionAnonima);

btnAbono.addEventListener('click', abrirAbono);
cerrarAbonoBtn.addEventListener('click', () => cerrarModal(modalAbono));
guardarAbonoBtn.addEventListener('click', guardarAbono);

btnHistorial.addEventListener('click', verHistorial);
cerrarHistorialBtn.addEventListener('click', () => cerrarModal(modalHistorial));
borrarTodoBtn.addEventListener('click', borrarTodo);

btnMeta.addEventListener('click', cambiarMeta);

guardarConfigBtn.addEventListener('click', guardarConfiguracion);
cerrarConfigBtn.addEventListener('click', () => cerrarModal(modalConfig));

// Cerrar modales haciendo clic fuera del contenido
document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', function(e) {
        if (e.target === this) {
            this.style.display = 'none';
        }
    });
});

// ============================================================
//  INICIO
// ============================================================
// Si ya hay una sesión activa, la reutilizamos
auth.onAuthStateChanged((user) => {
    if (user) {
        userId = user.uid;
        cargando.style.display = 'none';
        btnIngresar.disabled = false;
        cargarDatosFirestore();
    }
});
