// ================================================================
// Configuración Firebase (Compat)
// ================================================================
const firebaseConfig = {
  apiKey: "AIzaSyA6jVICuE17KJcO34gE1brMxqWEfNd3Fy0",
  authDomain: "mapa-41b00.firebaseapp.com",
  projectId: "mapa-41b00",
  storageBucket: "mapa-41b00.firebasestorage.app",
  messagingSenderId: "535032835400",
  appId: "1:535032835400:web:68c079cbc3f419eafd177d"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

console.log('Firebase inicializado (Compat)');

// ===== REFERENCIAS DOM =====
const authCard = document.getElementById('authCard');
const menuSection = document.getElementById('menuSection');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const loginEmail = document.getElementById('loginEmail');
const loginPassword = document.getElementById('loginPassword');
const doLoginBtn = document.getElementById('doLoginBtn');
const showRegisterBtn = document.getElementById('showRegisterBtn');
const backToLoginBtn = document.getElementById('backToLoginBtn');
const regName = document.getElementById('regName');
const regEmail = document.getElementById('regEmail');
const regPassword = document.getElementById('regPassword');
const doRegisterBtn = document.getElementById('doRegisterBtn');
const forgotPasswordLink = document.getElementById('forgotPasswordLink');
const logoutBtn = document.getElementById('logoutBtn');
const profileTrigger = document.getElementById('profileTrigger');
const editProfileBtn = document.getElementById('editProfileBtn');
const profileAvatar = document.getElementById('profileAvatar');
const profileNameDisplay = document.getElementById('profileNameDisplay');
const userPointsDisplay = document.getElementById('userPointsDisplay');
const positionBadge = document.getElementById('positionBadge');
const editProfileModal = document.getElementById('editProfileModal');
const modalProfileImage = document.getElementById('modalProfileImage');
const uploadPhotoIcon = document.getElementById('uploadPhotoIcon');
const uploadPhotoInput = document.getElementById('uploadPhoto');
const editNameInput = document.getElementById('editNameInput');
const saveProfileBtn = document.getElementById('saveProfileBtn');
const closeModalBtn = document.getElementById('closeModalBtn');
const avatarGrid = document.getElementById('avatarGrid');
const toast = document.getElementById('toast');
const whatsappBtn = document.getElementById('whatsappBtn');
const searchInput = document.getElementById('searchInput');
const searchResults = document.getElementById('searchResults');

// ===== TOAST =====
function showToast(msg, duration = 3000) {
  toast.textContent = msg;
  toast.style.display = 'block';
  setTimeout(() => { toast.style.display = 'none'; }, duration);
}

// ===== EVENTOS LOGIN / REGISTRO =====
doLoginBtn.addEventListener('click', function() {
  const email = loginEmail.value.trim();
  const pass = loginPassword.value.trim();
  if (!email || !pass) {
    showToast('Completa todos los campos.');
    return;
  }
  auth.signInWithEmailAndPassword(email, pass)
    .then(() => showToast('¡Bienvenido de vuelta!'))
    .catch(error => showToast('Error: ' + error.message));
});

showRegisterBtn.addEventListener('click', function() {
  loginForm.style.display = 'none';
  registerForm.style.display = 'block';
});

backToLoginBtn.addEventListener('click', function() {
  registerForm.style.display = 'none';
  loginForm.style.display = 'block';
});

doRegisterBtn.addEventListener('click', function() {
  const name = regName.value.trim();
  const email = regEmail.value.trim();
  const pass = regPassword.value.trim();
  if (!name || !email || !pass) {
    showToast('Completa todos los campos.');
    return;
  }
  if (pass.length < 6) {
    showToast('La contraseña debe tener al menos 6 caracteres.');
    return;
  }
  auth.createUserWithEmailAndPassword(email, pass)
    .then((cred) => {
      return cred.user.updateProfile({ displayName: name })
        .then(() => {
          return db.collection('usuarios').doc(cred.user.uid).set({
            nombre: name,
            email: email,
            puntos: 0,
            avatar: '',
            createdAt: new Date().toISOString()
          });
        });
    })
    .then(() => showToast('¡Cuenta creada exitosamente!'))
    .catch(error => showToast('Error: ' + error.message));
});

forgotPasswordLink.addEventListener('click', function(e) {
  e.preventDefault();
  const email = loginEmail.value.trim();
  if (!email) {
    showToast('Ingresa tu correo para restablecer.');
    return;
  }
  auth.sendPasswordResetEmail(email)
    .then(() => showToast('Revisa tu correo para restablecer la contraseña.'))
    .catch(error => showToast('Error: ' + error.message));
});

// ===== ESTADO DE AUTENTICACIÓN (con actualización en tiempo real) =====
let currentUserUid = null;

auth.onAuthStateChanged(function(user) {
  console.log('onAuthStateChanged:', user ? user.uid : 'null');
  if (user) {
    currentUserUid = user.uid;
    authCard.style.display = 'none';
    menuSection.style.display = 'block';

    // Cargar datos del usuario y escuchar cambios
    const userRef = db.collection('usuarios').doc(user.uid);
    userRef.get()
      .then((docSnap) => {
        if (docSnap.exists) {
          const data = docSnap.data();
          actualizarPerfil(data, user);
        } else {
          // Crear documento
          userRef.set({
            nombre: user.displayName || 'Usuario',
            email: user.email,
            puntos: 0,
            avatar: '',
            createdAt: new Date().toISOString()
          }).then(() => {
            // Recargar después de crear
            userRef.get().then((newSnap) => {
              if (newSnap.exists) actualizarPerfil(newSnap.data(), user);
            });
          });
        }
      })
      .catch(err => console.error('Error al cargar usuario:', err));

    // Escuchar cambios en tiempo real
    userRef.onSnapshot((docSnap) => {
      if (docSnap.exists) {
        const data = docSnap.data();
        actualizarPerfil(data, user);
        // Actualizar puntos y posición
        updateUserStats(user.uid);
      }
    });

  } else {
    currentUserUid = null;
    authCard.style.display = 'block';
    menuSection.style.display = 'none';
    loginForm.style.display = 'block';
    registerForm.style.display = 'none';
  }
});

// Función para actualizar la UI del perfil
function actualizarPerfil(data, user) {
  const nombre = data.nombre || user.displayName || 'Usuario';
  profileNameDisplay.textContent = nombre;
  if (data.avatar) {
    profileAvatar.src = data.avatar;
    modalProfileImage.src = data.avatar;
  } else {
    const avatarUrl = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(nombre) + '&background=a4c737&color=fff&size=128';
    profileAvatar.src = avatarUrl;
    modalProfileImage.src = avatarUrl;
  }
  // Los puntos se actualizan en updateUserStats
}

// ===== ACTUALIZAR PUNTOS Y POSICIÓN =====
function updateUserStats(uid) {
  db.collection('usuarios').doc(uid).get()
    .then((docSnap) => {
      if (!docSnap.exists) return;
      const data = docSnap.data();
      const puntos = data.puntos || 0;
      userPointsDisplay.textContent = '⭐ ' + puntos + ' puntos';

      // Calcular posición global
      return db.collection('usuarios').orderBy('puntos', 'desc').get()
        .then((querySnap) => {
          let posicion = 0;
          let total = 0;
          querySnap.forEach((doc) => {
            total++;
            if (doc.id === uid) posicion = total;
          });
          if (posicion > 0) {
            let medal = '';
            if (posicion === 1) medal = '👑 ';
            else if (posicion === 2) medal = '🥈 ';
            else if (posicion === 3) medal = '🥉 ';
            positionBadge.textContent = medal + 'Posición #' + posicion + ' de ' + total;
          } else {
            positionBadge.textContent = '📈 Sin posición aún';
          }
        });
    })
    .catch(err => console.error('Error en updateUserStats:', err));
}

// ===== CERRAR SESIÓN =====
if (logoutBtn) {
  logoutBtn.addEventListener('click', function() {
    auth.signOut().then(() => showToast('Sesión cerrada'));
  });
}

// ===== MODAL PERFIL =====
function openEditModal() {
  editProfileModal.style.display = 'flex';
  editNameInput.value = profileNameDisplay.textContent;
  modalProfileImage.src = profileAvatar.src;
  loadAvatarGrid();
}
function closeEditModal() {
  editProfileModal.style.display = 'none';
}

if (profileTrigger) profileTrigger.addEventListener('click', openEditModal);
if (editProfileBtn) editProfileBtn.addEventListener('click', function(e) { e.stopPropagation(); openEditModal(); });
if (closeModalBtn) closeModalBtn.addEventListener('click', closeEditModal);
window.addEventListener('click', function(e) { if (e.target === editProfileModal) closeEditModal(); });

// Subir foto
if (uploadPhotoIcon) {
  uploadPhotoIcon.addEventListener('click', function() {
    uploadPhotoInput.click();
  });
}
if (uploadPhotoInput) {
  uploadPhotoInput.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(ev) {
      const dataUrl = ev.target.result;
      modalProfileImage.src = dataUrl;
      const storageRef = storage.ref('avatars/' + auth.currentUser.uid);
      storageRef.putString(dataUrl, 'data_url')
        .then(() => storageRef.getDownloadURL())
        .then((url) => {
          return db.collection('usuarios').doc(auth.currentUser.uid).update({ avatar: url });
        })
        .then(() => {
          profileAvatar.src = modalProfileImage.src;
          showToast('Foto actualizada');
        })
        .catch(err => showToast('Error: ' + err.message));
    };
    reader.readAsDataURL(file);
  });
}

// Guardar nombre
if (saveProfileBtn) {
  saveProfileBtn.addEventListener('click', function() {
    const newName = editNameInput.value.trim();
    if (!newName) { showToast('El nombre no puede estar vacío.'); return; }
    const user = auth.currentUser;
    user.updateProfile({ displayName: newName })
      .then(() => db.collection('usuarios').doc(user.uid).update({ nombre: newName }))
      .then(() => {
        profileNameDisplay.textContent = newName;
        showToast('Perfil actualizado');
        closeEditModal();
      })
      .catch(err => showToast('Error: ' + err.message));
  });
}

// Cargar avatares predeterminados
function loadAvatarGrid() {
  const avatars = [
    'https://ui-avatars.com/api/?name=A&background=a4c737&color=fff&size=128',
    'https://ui-avatars.com/api/?name=B&background=a287be&color=fff&size=128',
    'https://ui-avatars.com/api/?name=C&background=f5b342&color=fff&size=128',
    'https://ui-avatars.com/api/?name=D&background=4facfe&color=fff&size=128',
    'https://ui-avatars.com/api/?name=E&background=f5576c&color=fff&size=128'
  ];
  avatarGrid.innerHTML = '';
  avatars.forEach((url) => {
    const img = document.createElement('img');
    img.src = url;
    img.className = 'avatar-pred';
    if (profileAvatar.src === url) img.classList.add('selected');
    img.addEventListener('click', function() {
      db.collection('usuarios').doc(auth.currentUser.uid).update({ avatar: url })
        .then(() => {
          profileAvatar.src = url;
          modalProfileImage.src = url;
          document.querySelectorAll('.avatar-pred').forEach(el => el.classList.remove('selected'));
          img.classList.add('selected');
          showToast('Avatar cambiado');
        })
        .catch(err => showToast('Error: ' + err.message));
    });
    avatarGrid.appendChild(img);
  });
}

// ===== WHATSAPP =====
if (whatsappBtn) {
  whatsappBtn.addEventListener('click', function(e) {
    e.preventDefault();
    window.open('https://wa.me/505XXXXXXXX?text=Hola%20Guía%20Pinolero', '_blank');
  });
}

// ===== BUSCADOR =====
// Datos de búsqueda: juegos y destinos
const searchData = [
  // Juegos
  { type: 'juego', name: 'Gran Mapa Misterioso', icon: '🎮', ref: 'mapa' },
  { type: 'juego', name: 'Pinolero Millonario', icon: '💰', ref: 'millonario' },
  { type: 'juego', name: 'Stop Pinolero', icon: '🛑', ref: 'stop' },
  { type: 'juego', name: 'Memoria Pinolera', icon: '🧠', ref: 'memoria' },
  { type: 'juego', name: 'Laberinto Turístico', icon: '🌀', ref: 'laberinto' },
  // Destinos
  { type: 'destino', name: 'Volcán Masaya', icon: '🌋', ref: 'masaya' },
  { type: 'destino', name: 'Laguna de Apoyo', icon: '🏞️', ref: 'apoyo' },
  { type: 'destino', name: 'Granada', icon: '🏛️', ref: 'granada' },
  { type: 'destino', name: 'Orm', icon: '🏝️', ref: 'orm' }
];

searchInput.addEventListener('input', function() {
  const query = this.value.trim().toLowerCase();
  if (query.length === 0) {
    searchResults.classList.remove('show');
    return;
  }

  const results = searchData.filter(item =>
    item.name.toLowerCase().includes(query)
  );

  if (results.length === 0) {
    searchResults.innerHTML = `<div class="search-result-item" style="color:rgba(255,255,255,0.4);">No se encontraron resultados</div>`;
    searchResults.classList.add('show');
    return;
  }

  let html = '';
  results.forEach(item => {
    html += `
      <div class="search-result-item" data-ref="${item.ref}" data-type="${item.type}">
        <span class="icon">${item.icon}</span>
        <span class="text">${item.name}</span>
        <span class="category">${item.type}</span>
      </div>
    `;
  });
  searchResults.innerHTML = html;
  searchResults.classList.add('show');

  // Evento de clic en cada resultado
  document.querySelectorAll('.search-result-item').forEach(el => {
    el.addEventListener('click', function() {
      const ref = this.dataset.ref;
      const type = this.dataset.type;
      showToast(`Abriendo ${type}: ${ref}`);
      // Aquí podrías redirigir o ejecutar una acción
      searchResults.classList.remove('show');
      searchInput.value = '';
    });
  });
});

// Ocultar resultados al hacer clic fuera
document.addEventListener('click', function(e) {
  if (!e.target.closest('.search-bar')) {
    searchResults.classList.remove('show');
  }
});

// ===== BOTONES "JUGAR" =====
document.querySelectorAll('.btn-jugar').forEach(btn => {
  btn.addEventListener('click', function(e) {
    e.preventDefault();
    const game = this.dataset.game || 'default';
    showToast('Abriendo juego: ' + game);
    // Redirigir o abrir modal según corresponda
    // Ejemplo: window.location.href = 'juego-' + game + '.html';
  });
});

// ===== MENÚ INFERIOR - NAVEGACIÓN =====
document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', function(e) {
    e.preventDefault();
    const url = this.dataset.url;
    if (url && url !== '#') {
      // Redirigir a la URL
      window.location.href = url;
    } else {
      // Si es "Inicio", simplemente mostrar toast o recargar
      showToast('Página de inicio');
    }
    // Marcar como activo
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    this.classList.add('active');
    // Si es el mapa, no se marca como active porque es especial, pero lo dejamos
    if (this.classList.contains('nav-map')) {
      // Opcional: resaltar el mapa
    }
  });
});

console.log('Todos los eventos cargados correctamente');
