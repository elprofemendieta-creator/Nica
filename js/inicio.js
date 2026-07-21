// ================================================================
// CONFIGURACIÓN FIREBASE (COMPAT)
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

console.log('🔥 Firebase inicializado (Compat)');

// ================================================================
// CONSTANTES Y VARIABLES GLOBALES
// ================================================================
const DEFAULT_AVATARS = [
  "https://imgur.com/CFcEYQZ.jpg",
  "https://imgur.com/rf8HVpD.jpg",
  "https://imgur.com/LmBBFaT.jpg",
  "https://us.123rf.com/450wm/yupiramos/yupiramos2009/yupiramos200902259/154588033-avatar-de-un-dise%C3%B1o-de-mujer-de-moda-ni%C3%B1a-persona-humana-humana-y-tema-de-belleza-ilustraci%C3%B3n.jpg?ver=6",
  "https://randomuser.me/api/portraits/lego/1.jpg",
  "https://randomuser.me/api/portraits/lego/2.jpg",
  "https://cdni.iconscout.com/illustration/free/thumb/free-chica-negro-illustration-svg-download-png-1415695.png",
  "https://img.magnific.com/vector-gratis/ilustracion-empresaria_53876-5857.jpg?semt=ais_hybrid&w=740&q=80"
];
const FALLBACK = "https://cdn-icons-png.flaticon.com/512/3135/3135715.png";

let fotoTemporal = null;
let isSaving = false;

// ================================================================
// REFERENCIAS DOM
// ================================================================
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
const uploadPhoto = document.getElementById('uploadPhoto');
const editNameInput = document.getElementById('editNameInput');
const saveProfileBtn = document.getElementById('saveProfileBtn');
const closeModalBtn = document.getElementById('closeModalBtn');
const avatarGrid = document.getElementById('avatarGrid');
const toastDiv = document.getElementById('toast');
const passportList = document.getElementById('passportList');

// ================================================================
// FUNCIONES AUXILIARES (TOAST, COMPRESIÓN, SUBIDA)
// ================================================================
function showToast(msg, isError = false, duration = 5000) {
  toastDiv.textContent = msg;
  toastDiv.style.display = 'block';
  toastDiv.style.background = isError ? 'rgba(220,53,69,0.95)' : 'rgba(0,0,0,0.85)';
  clearTimeout(toastDiv._timeout);
  toastDiv._timeout = setTimeout(() => toastDiv.style.display = 'none', duration);
}

function compressImage(file) {
  return new Promise((resolve, reject) => {
    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (e) => {
        const img = new Image();
        img.src = e.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const MAX_SIZE = 600;
          if (width > MAX_SIZE || height > MAX_SIZE) {
            if (width > height) {
              height = height * (MAX_SIZE / width);
              width = MAX_SIZE;
            } else {
              width = width * (MAX_SIZE / height);
              height = MAX_SIZE;
            }
          }
          canvas.width = Math.round(width);
          canvas.height = Math.round(height);
          const ctx = canvas.getContext('2d');
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob((blob) => {
            if (blob) {
              const compressedFile = new File(
                [blob],
                file.name.replace(/\.[^.]+$/, '.jpg'),
                { type: 'image/jpeg', lastModified: Date.now() }
              );
              resolve(compressedFile);
            } else {
              reject(new Error('Error al comprimir la imagen'));
            }
          }, 'image/jpeg', 0.8);
        };
        img.onerror = () => reject(new Error('Error al cargar la imagen'));
      };
      reader.onerror = () => reject(new Error('Error al leer el archivo'));
    } catch (error) {
      reject(error);
    }
  });
}

async function uploadToImgBB(file) {
  const reader = new FileReader();
  const dataUrl = await new Promise((resolve, reject) => {
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
  const base64 = dataUrl.split(',')[1];

  const formData = new FormData();
  formData.append('key', '241be8181060d6203088a57a14c355fa');
  formData.append('image', base64);

  const response = await fetch('https://api.imgbb.com/1/upload', {
    method: 'POST',
    body: formData,
  });
  if (!response.ok) {
    throw new Error('Error al subir a ImgBB (código ' + response.status + ')');
  }
  const json = await response.json();
  if (!json.success) {
    throw new Error(json.error?.message || 'Error desconocido en ImgBB');
  }
  return json.data.url;
}

// ================================================================
// FUNCIONES DE PERFIL
// ================================================================
async function guardarEnFirestore(user, extra = {}) {
  const ref = db.collection('usuarios').doc(user.uid);
  const snap = await ref.get();
  if (!snap.exists) {
    await ref.set({
      uid: user.uid,
      email: user.email,
      nombre: extra.nombre || user.displayName || user.email.split('@')[0],
      fotoURL: extra.fotoURL || user.photoURL || DEFAULT_AVATARS[0],
      puntos: 0,
      lugares_visitados: [],
      fechaRegistro: new Date()
    });
  }
}

async function cargarPerfil(user) {
  if (!user) return;
  const ref = db.collection('usuarios').doc(user.uid);
  const snap = await ref.get();
  let nombre, fotoURL;
  if (snap.exists) {
    const data = snap.data();
    nombre = data.nombre || user.displayName || user.email.split('@')[0];
    fotoURL = data.fotoURL || user.photoURL || FALLBACK;
  } else {
    nombre = user.displayName || user.email.split('@')[0];
    fotoURL = user.photoURL || FALLBACK;
    await guardarEnFirestore(user, { nombre, fotoURL });
  }
  // Actualizar UI
  profileNameDisplay.textContent = nombre;
  profileAvatar.src = fotoURL;
  profileAvatar.onerror = () => profileAvatar.src = FALLBACK;
  // También actualizar puntos y posición
  await updateUserStats(user.uid);
}

function renderAvatars(selected) {
  avatarGrid.innerHTML = '';
  DEFAULT_AVATARS.forEach(url => {
    const img = document.createElement('img');
    img.src = url;
    img.className = 'avatar-pred';
    if (selected === url) img.classList.add('selected');
    img.onclick = () => {
      document.querySelectorAll('.avatar-pred').forEach(a => a.classList.remove('selected'));
      img.classList.add('selected');
      fotoTemporal = url;
      modalProfileImage.src = url;
      uploadPhoto.value = '';
    };
    avatarGrid.appendChild(img);
  });
}

async function guardarPerfil(nuevoNombre, nuevaFoto) {
  const user = auth.currentUser;
  if (!user) {
    showToast('❌ Usuario no autenticado', true);
    return;
  }
  if (isSaving) return;
  isSaving = true;
  saveProfileBtn.disabled = true;
  saveProfileBtn.innerHTML = '<span class="loading-spinner"></span> Guardando...';

  try {
    let fotoURL = null;

    if (nuevaFoto instanceof File) {
      showToast('📤 Subiendo imagen a ImgBB...', false, 5000);
      const compressed = await compressImage(nuevaFoto);
      fotoURL = await uploadToImgBB(compressed);
    } else if (typeof nuevaFoto === 'string' && nuevaFoto.startsWith('http')) {
      fotoURL = nuevaFoto;
    } else {
      const ref = db.collection('usuarios').doc(user.uid);
      const snap = await ref.get();
      fotoURL = snap.exists ? snap.data().fotoURL : null;
    }

    if (nuevoNombre && nuevoNombre !== user.displayName) {
      await user.updateProfile({ displayName: nuevoNombre });
    }

    const ref = db.collection('usuarios').doc(user.uid);
    const updates = {};
    if (nuevoNombre) updates.nombre = nuevoNombre;
    if (fotoURL) updates.fotoURL = fotoURL;
    await ref.update(updates);

    // Actualizar UI
    profileNameDisplay.textContent = nuevoNombre || user.displayName;
    if (fotoURL) {
      profileAvatar.src = fotoURL;
      profileAvatar.onerror = () => profileAvatar.src = FALLBACK;
    }

    showToast('✅ Perfil actualizado correctamente');
    editProfileModal.style.display = 'none';
  } catch (error) {
    console.error('Error al guardar perfil:', error);
    showToast('❌ ' + (error.message || 'Error al guardar'), true, 5000);
  } finally {
    isSaving = false;
    saveProfileBtn.disabled = false;
    saveProfileBtn.innerHTML = 'Guardar cambios';
  }
}

// ================================================================
// ACTUALIZAR PUNTOS Y POSICIÓN
// ================================================================
async function updateUserStats(uid) {
  try {
    const docSnap = await db.collection('usuarios').doc(uid).get();
    if (!docSnap.exists) return;
    const data = docSnap.data();
    const puntos = data.puntos || 0;
    userPointsDisplay.textContent = '⭐ ' + puntos + ' puntos';

    const querySnap = await db.collection('usuarios').orderBy('puntos', 'desc').get();
    let posicion = 0, total = 0;
    querySnap.forEach(doc => {
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
  } catch (error) {
    console.error('Error en updateUserStats:', error);
  }
}

// ================================================================
// PASAPORTE (LUGARES VISITADOS) - DINÁMICO
// ================================================================
function actualizarPasaporte(lugares) {
  passportList.innerHTML = '';
  if (!lugares || lugares.length === 0) {
    const li = document.createElement('li');
    li.className = 'passport-empty';
    li.textContent = 'No has visitado ningún lugar aún.';
    passportList.appendChild(li);
    return;
  }
  lugares.forEach(lugar => {
    const li = document.createElement('li');
    const icon = document.createElement('i');
    icon.className = 'fas fa-check-circle';
    icon.style.color = '#a4c737';
    li.appendChild(icon);
    li.appendChild(document.createTextNode(' ' + lugar));
    passportList.appendChild(li);
  });
}

// ================================================================
// EVENTOS DE LOGIN / REGISTRO / RECUPERACIÓN
// ================================================================
doLoginBtn.addEventListener('click', () => {
  const email = loginEmail.value.trim();
  const pass = loginPassword.value.trim();
  if (!email || !pass) {
    showToast('Completa todos los campos.', true);
    return;
  }
  auth.signInWithEmailAndPassword(email, pass)
    .then(() => showToast('¡Bienvenido de vuelta!'))
    .catch(error => showToast('Error: ' + error.message, true));
});

showRegisterBtn.addEventListener('click', () => {
  loginForm.style.display = 'none';
  registerForm.style.display = 'block';
});

backToLoginBtn.addEventListener('click', () => {
  registerForm.style.display = 'none';
  loginForm.style.display = 'block';
});

doRegisterBtn.addEventListener('click', () => {
  const name = regName.value.trim();
  const email = regEmail.value.trim();
  const pass = regPassword.value.trim();
  if (!name || !email || !pass) {
    showToast('Completa todos los campos.', true);
    return;
  }
  if (pass.length < 6) {
    showToast('La contraseña debe tener al menos 6 caracteres.', true);
    return;
  }
  auth.createUserWithEmailAndPassword(email, pass)
    .then(cred => {
      return cred.user.updateProfile({ displayName: name })
        .then(() => {
          return db.collection('usuarios').doc(cred.user.uid).set({
            uid: cred.user.uid,
            email: email,
            nombre: name,
            fotoURL: DEFAULT_AVATARS[0],
            puntos: 0,
            lugares_visitados: [],
            fechaRegistro: new Date()
          });
        });
    })
    .then(() => showToast('¡Cuenta creada exitosamente!'))
    .catch(error => showToast('Error: ' + error.message, true));
});

forgotPasswordLink.addEventListener('click', (e) => {
  e.preventDefault();
  const email = loginEmail.value.trim();
  if (!email) {
    showToast('Ingresa tu correo para restablecer.', true);
    return;
  }
  auth.sendPasswordResetEmail(email)
    .then(() => showToast('Revisa tu correo para restablecer la contraseña.'))
    .catch(error => showToast('Error: ' + error.message, true));
});

// ================================================================
// ESTADO DE AUTENTICACIÓN
// ================================================================
auth.onAuthStateChanged(async (user) => {
  console.log('onAuthStateChanged:', user ? user.uid : 'null');
  if (user) {
    authCard.style.display = 'none';
    menuSection.style.display = 'block';

    // Cargar perfil (incluye puntos y posición)
    await cargarPerfil(user);

    // Escuchar cambios en tiempo real en el documento del usuario
    const userRef = db.collection('usuarios').doc(user.uid);
    userRef.onSnapshot((docSnap) => {
      if (docSnap.exists) {
        const data = docSnap.data();
        // Actualizar nombre y foto si cambian
        const nombre = data.nombre || user.displayName || user.email.split('@')[0];
        profileNameDisplay.textContent = nombre;
        if (data.fotoURL) {
          profileAvatar.src = data.fotoURL;
          profileAvatar.onerror = () => profileAvatar.src = FALLBACK;
        }
        // Actualizar puntos y posición
        updateUserStats(user.uid);
        // Actualizar pasaporte
        actualizarPasaporte(data.lugares_visitados || []);
      }
    });
  } else {
    authCard.style.display = 'block';
    menuSection.style.display = 'none';
    loginForm.style.display = 'block';
    registerForm.style.display = 'none';
    // Limpiar campos
    loginEmail.value = '';
    loginPassword.value = '';
    regEmail.value = '';
    regPassword.value = '';
    regName.value = '';
  }
});

// ================================================================
// CERRAR SESIÓN
// ================================================================
logoutBtn.addEventListener('click', () => {
  auth.signOut().then(() => showToast('Sesión cerrada'));
});

// ================================================================
// REDIRECCIÓN DEL PERFIL A COMUNIDAD
// ================================================================
profileTrigger.addEventListener('click', (e) => {
  if (e.target.closest('.edit-btn')) return;
  window.location.href = 'comunidad.html';
});

// ================================================================
// MODAL DE EDICIÓN DE PERFIL
// ================================================================
function openEditModal() {
  editProfileModal.style.display = 'flex';
  editNameInput.value = profileNameDisplay.textContent;
  modalProfileImage.src = profileAvatar.src;
  fotoTemporal = null; // Resetear foto temporal
  // Cargar avatares predeterminados
  renderAvatars(profileAvatar.src);
}
function closeEditModal() {
  editProfileModal.style.display = 'none';
}

editProfileBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  openEditModal();
});

closeModalBtn.addEventListener('click', closeEditModal);
window.addEventListener('click', (e) => {
  if (e.target === editProfileModal) closeEditModal();
});

// ===== SUBIR FOTO (desde el modal) =====
uploadPhotoIcon.addEventListener('click', () => uploadPhoto.click());

uploadPhoto.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'image/gif'];
  if (!validTypes.includes(file.type)) {
    showToast('❌ Formato no soportado. Usa JPG, PNG o WEBP', true);
    uploadPhoto.value = '';
    return;
  }
  if (file.size > 5 * 1024 * 1024) {
    showToast('❌ La imagen es muy grande. Máximo 5MB', true);
    uploadPhoto.value = '';
    return;
  }
  const reader = new FileReader();
  reader.onload = (ev) => {
    modalProfileImage.src = ev.target.result;
    document.querySelectorAll('.avatar-pred').forEach(a => a.classList.remove('selected'));
    fotoTemporal = file;
    showToast('📷 Foto seleccionada, guarda los cambios');
  };
  reader.readAsDataURL(file);
});

// ===== GUARDAR PERFIL (desde modal) =====
saveProfileBtn.addEventListener('click', async () => {
  const nuevoNombre = editNameInput.value.trim();
  if (!nuevoNombre) {
    showToast('❌ El nombre no puede estar vacío', true);
    return;
  }
  if (!fotoTemporal) {
    showToast('❌ Selecciona una foto de perfil', true);
    return;
  }
  await guardarPerfil(nuevoNombre, fotoTemporal);
});

// ================================================================
// BOTONES "JUGAR" (NAVEGACIÓN REAL)
// ================================================================
document.querySelectorAll('.btn-jugar').forEach(btn => {
  btn.addEventListener('click', function(e) {
    const game = this.dataset.game || 'default';
    showToast('Abriendo juego: ' + game);
    // No usamos preventDefault, el enlace navega normalmente
  });
});

// ================================================================
// MENÚ INFERIOR - NAVEGACIÓN
// ================================================================
document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', function(e) {
    e.preventDefault();
    const url = this.dataset.url;
    if (url && url !== '#') {
      window.location.href = url;
    } else {
      showToast('Página de inicio');
    }
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    this.classList.add('active');
  });
});

// ================================================================
// WHATSAPP (flotante)
// ================================================================
document.getElementById('whatsappBtn')?.addEventListener('click', (e) => {
  e.preventDefault();
  const user = auth.currentUser;
  let msg = "¡Hola!%20Estoy%20explorando%20Nicaragua%20con%20Guía%20Pinolero";
  if (user?.displayName) msg = `Hola,%20soy%20${encodeURIComponent(user.displayName)}.%20${msg}`;
  window.open(`https://wa.me/50588170531?text=${msg}`, '_blank');
});

console.log('✅ Todos los eventos cargados correctamente');
