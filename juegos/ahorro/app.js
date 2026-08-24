// ============================================================
//  CONFIGURACIÓN DE FIREBASE (TUS CREDENCIALES)
// ============================================================
const firebaseConfig = {
    apiKey: "AIzaSyA6jVICuE17KJcO34gE1brMxqWEfNd3Fy0",
    authDomain: "mapa-41b00.firebaseapp.com",
    projectId: "mapa-41b00",
    storageBucket: "mapa-41b00.firebasestorage.app",
    messagingSenderId: "535032835400",
    appId: "1:535032835400:web:68c079cbc3f419eafd177d"
};

// ============================================================
//  INICIALIZAR FIREBASE (con manejo de errores)
// ============================================================
let firebaseInicializado = false;
try {
    firebase.initializeApp(firebaseConfig);
    firebaseInicializado = true;
    console.log("✅ Firebase inicializado correctamente");
} catch (e) {
    console.warn("⚠️ Firebase no se pudo inicializar:", e.message);
}

const auth = firebaseInicializado ? firebase.auth() : null;
const db = firebaseInicializado ? firebase.firestore() : null;

// ============================================================
//  ESTADO GLOBAL
// ============================================================
let datos = {
    meta: 0,
    sueño: '',
    abonos: []
};
let userId = null;
let modoOffline = false;

// ============================================================
//  REFERENCIAS DOM (se cargan después de que el DOM esté listo)
// ============================================================
let btnIngresar, splash, app, cargando;

document.addEventListener('DOMContentLoaded', function() {
    // Asignar referencias
    btnIngresar = document.getElementById('btnIngresar');
    splash = document.getElementById('splash');
    app = document.getElementById('app');
    cargando = document.getElementById('cargando');

    // Asignar evento al botón
    if (btnIngresar) {
        btnIngresar.addEventListener('click', iniciarSesionAnonima);
        console.log("✅ Evento click asignado al botón");
    } else {
        console.error("❌ No se encontró el botón #btnIngresar");
    }

    // Si ya hay una sesión activa (por si recarga), la reutilizamos
    if (auth) {
        auth.onAuthStateChanged((user) => {
            if (user) {
                userId = user.uid;
                console.log("👤 Usuario ya autenticado:", userId);
                cargarDatosFirestore();
            }
        });
    }
});

// ============================================================
//  FUNCIÓN PRINCIPAL: INICIAR SESIÓN ANÓNIMA
// ============================================================
function iniciarSesionAnonima() {
    console.log("🔘 Botón presionado – iniciando sesión...");

    // Si Firebase no está disponible, pasar a modo offline inmediatamente
    if (!firebaseInicializado || !auth) {
        console.warn("⚠️ Firebase no disponible, usando localStorage");
        modoOffline = true;
        userId = 'local';
        cargarDatosLocal();
        return;
    }

    // Mostrar indicador de carga
    if (cargando) cargando.style.display = 'block';
    if (btnIngresar) btnIngresar.disabled = true;

    auth.signInAnonymously()
        .then((userCredential) => {
            userId = userCredential.user.uid;
            console.log("✅ Autenticación anónima exitosa, UID:", userId);
            if (cargando) cargando.style.display = 'none';
            if (btnIngresar) btnIngresar.disabled = false;
            cargarDatosFirestore();
        })
        .catch((error) => {
            console.error("❌ Error en auth anónima:", error);
            // Mostrar mensaje amigable
            let msg = "No se pudo conectar a Firebase. ";
            if (error.code === 'auth/operation-not-allowed') {
                msg += "Habilita la autenticación anónima en Firebase Console.";
            } else if (error.code === 'auth/network-request-failed') {
                msg += "Revisa tu conexión a internet.";
            } else {
                msg += "Error: " + error.message;
            }
            alert(msg + " Usando almacenamiento local como respaldo.");
            // Fallback a localStorage
            if (cargando) cargando.style.display = 'none';
            if (btnIngresar) btnIngresar.disabled = false;
            modoOffline = true;
            userId = 'local';
            cargarDatosLocal();
        });
}

// ============================================================
//  CARGAR DATOS DESDE FIRESTORE
// ============================================================
function cargarDatosFirestore() {
    if (!db || modoOffline) {
        cargarDatosLocal();
        return;
    }

    const docRef = db.collection('metas').doc(userId);
    docRef.get()
        .then((doc) => {
            if (doc.exists) {
                datos = doc.data();
                if (!datos.abonos) datos.abonos = [];
                if (!datos.meta) datos.meta = 0;
                if (!datos.sueño) datos.sueño = '';
                console.log("📥 Datos cargados desde Firestore:", datos);
            } else {
                // No hay datos, crear documento vacío
                datos = { meta: 0, sueño: '', abonos: [] };
                console.log("📄 Documento nuevo, creando estructura vacía");
            }
            entrarApp();
        })
        .catch((error) => {
            console.error("❌ Error cargando Firestore:", error);
            alert("No se pudo cargar desde Firebase. Usando almacenamiento local.");
            modoOffline = true;
            cargarDatosLocal();
        });
}

// ============================================================
//  CARGAR DATOS DESDE LOCALSTORAGE (FALLBACK)
// ============================================================
function cargarDatosLocal() {
    const local = JSON.parse(localStorage.getItem("metaPinolera")) || {
        meta: 0,
        sueño: '',
        abonos: []
    };
    datos = local;
    console.log("📥 Datos cargados desde localStorage:", datos);
    entrarApp();
}

// ============================================================
//  GUARDAR DATOS (Firestore o localStorage)
// ============================================================
function guardarDatos() {
    if (!modoOffline && db && userId) {
        const docRef = db.collection('metas').doc(userId);
        docRef.set(datos)
            .then(() => console.log("💾 Datos guardados en Firestore"))
            .catch((error) => {
                console.error("❌ Error guardando en Firestore:", error);
                // Fallback a localStorage
                localStorage.setItem("metaPinolera", JSON.stringify(datos));
            });
    } else {
        localStorage.setItem("metaPinolera", JSON.stringify(datos));
        console.log("💾 Datos guardados en localStorage");
    }
}

// ============================================================
//  ENTRAR A LA APP (ocultar splash y mostrar interfaz)
// ============================================================
function entrarApp() {
    if (splash) splash.classList.add('hidden');
    if (app) app.style.display = 'block';
    if (cargando) cargando.style.display = 'none';
    if (btnIngresar) btnIngresar.disabled = false;

    // Si es primera vez o meta=0, mostrar configuración
    if (datos.meta === 0) {
        abrirConfiguracion();
    } else {
        actualizarUI();
    }
}

// ============================================================
//  RESTO DE FUNCIONES (abonos, historial, UI, etc.)
//  ¡Todas iguales que antes!
// ============================================================
// ... (incluir aquí todas las funciones: actualizarUI, abrirAbono, guardarAbono, verHistorial, eliminarAbono, borrarTodo, cambiarMeta, cerrarModal, sonido, confeti, etc.)

// Para que no se repita todo el código, aquí van las funciones completas:

function actualizarUI() {
    const acumulado = datos.abonos.reduce((a, b) => a + b.monto, 0);
    let porcentajeVal = 0;
    if (datos.meta > 0) {
        porcentajeVal = (acumulado / datos.meta) * 100;
    }
    if (porcentajeVal > 100) porcentajeVal = 100;

    document.getElementById('metaTxt').textContent = 'C$' + datos.meta.toLocaleString();
    document.getElementById('acumuladoTxt').textContent = 'C$' + acumulado.toLocaleString();
    document.getElementById('faltanteTxt').textContent = 'C$' + Math.max(0, datos.meta - acumulado).toLocaleString();
    document.getElementById('porcentaje').textContent = porcentajeVal.toFixed(1) + '%';
    document.getElementById('liquido').style.height = porcentajeVal + '%';
    document.getElementById('sueñoMostrado').textContent = datos.sueño ? '✨ ' + datos.sueño : '✨ ¡Define tu sueño!';

    if (porcentajeVal >= 100) confeti();
}

function abrirAbono() {
    document.getElementById('fecha').value = new Date().toISOString().split('T')[0];
    document.getElementById('monto').value = '';
    document.getElementById('descripcion').value = '';
    document.getElementById('modalAbono').style.display = 'flex';
}

function guardarAbono() {
    const fecha = document.getElementById('fecha').value;
    const monto = parseFloat(document.getElementById('monto').value);
    const descripcion = document.getElementById('descripcion').value.trim();

    if (!fecha) { alert('Selecciona una fecha.'); return; }
    if (!monto || monto <= 0) { alert('Ingresa un monto válido.'); return; }

    datos.abonos.push({ fecha, monto, descripcion });
    guardarDatos();
    actualizarUI();

    const msgs = ["🚀 Excelente avance!", "🌟 Tu meta está más cerca.", "💎 Cada ahorro cuenta.", "🔥 Sigue así campeón.", "🏆 Vas por buen camino.", "💰 El éxito se construye paso a paso.", "🎯 No te detengas.", "✨ Hoy avanzaste un poco más."];
    document.getElementById('mensaje').textContent = msgs[Math.floor(Math.random() * msgs.length)];
    sonido();
    cerrarModal('modalAbono');
}

function abrirConfiguracion() {
    document.getElementById('inputSueño').value = datos.sueño || '';
    document.getElementById('inputMeta').value = '';
    document.getElementById('modalConfig').style.display = 'flex';
}

function guardarConfiguracion() {
    const sueño = document.getElementById('inputSueño').value.trim();
    const meta = parseFloat(document.getElementById('inputMeta').value);
    if (!sueño) { alert('Escribe tu sueño.'); return; }
    if (!meta || meta <= 0) { alert('Ingresa un monto de meta válido.'); return; }
    datos.sueño = sueño;
    datos.meta = meta;
    guardarDatos();
    actualizarUI();
    cerrarModal('modalConfig');
}

function verHistorial() {
    let html = `<table><thead><tr><th>Fecha</th><th>Abono</th><th>Descripción</th><th></th></tr></thead><tbody>`;
    if (datos.abonos.length === 0) {
        html += '<tr><td colspan="4">No hay abonos registrados.</td></tr>';
    } else {
        datos.abonos.forEach((a, i) => {
            html += `<tr><td>${a.fecha}</td><td>C$${a.monto}</td><td>${a.descripcion || ''}</td><td><button class="eliminar-abono" data-index="${i}">🗑️</button></td></tr>`;
        });
    }
    html += '</tbody></table>';
    document.getElementById('tablaHistorial').innerHTML = html;

    document.querySelectorAll('.eliminar-abono').forEach(btn => {
        btn.addEventListener('click', function() {
            const index = parseInt(this.dataset.index);
            if (confirm('¿Eliminar este abono?')) {
                datos.abonos.splice(index, 1);
                guardarDatos();
                actualizarUI();
                verHistorial();
            }
        });
    });

    document.getElementById('modalHistorial').style.display = 'flex';
}

function borrarTodo() {
    if (confirm('¿BORRAR TODOS LOS ABONOS?')) {
        datos.abonos = [];
        guardarDatos();
        actualizarUI();
        verHistorial();
    }
}

function cambiarMeta() {
    const nueva = prompt('Nueva Meta (C$):');
    if (nueva !== null && !isNaN(nueva) && parseFloat(nueva) > 0) {
        const nuevoSueño = prompt('Escribe tu nuevo sueño (opcional):');
        datos.meta = parseFloat(nueva);
        if (nuevoSueño !== null && nuevoSueño.trim() !== '') {
            datos.sueño = nuevoSueño.trim();
        }
        guardarDatos();
        actualizarUI();
    } else if (nueva !== null) {
        alert('Ingresa un número válido mayor a 0.');
    }
}

function cerrarModal(id) {
    document.getElementById(id).style.display = 'none';
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
//  EVENTOS DE LOS BOTONES (se asignan después de cargar el DOM)
// ============================================================
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('btnAbono').addEventListener('click', abrirAbono);
    document.getElementById('cerrarAbonoBtn').addEventListener('click', () => cerrarModal('modalAbono'));
    document.getElementById('guardarAbonoBtn').addEventListener('click', guardarAbono);

    document.getElementById('btnHistorial').addEventListener('click', verHistorial);
    document.getElementById('cerrarHistorialBtn').addEventListener('click', () => cerrarModal('modalHistorial'));
    document.getElementById('borrarTodoBtn').addEventListener('click', borrarTodo);

    document.getElementById('btnMeta').addEventListener('click', cambiarMeta);

    document.getElementById('guardarConfigBtn').addEventListener('click', guardarConfiguracion);
    document.getElementById('cerrarConfigBtn').addEventListener('click', () => cerrarModal('modalConfig'));

    // Cerrar modales al hacer clic fuera
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) this.style.display = 'none';
        });
    });
});
