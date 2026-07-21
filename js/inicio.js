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
const passportList = document.getElementById('passportList');

// ===== TOAST =====
function showToast(msg, duration = 3000) {
  toast.textContent = msg;
  toast.style.display = 'block';
  setTimeout(() => { toast.style.display = 'none'; }, duration);
}

// ===== LOGIN / REGISTRO =====
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
            lugares_visitados: [],  // Array vacío para el pasaporte
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

// ===== ESTADO DE AUTENTICACIÓN =====
let currentUserUid = null;

auth.onAuthStateChanged(function(user) {
  console.log('onAuthStateChanged:', user ? user.uid : 'null');
  if (user) {
    currentUserUid = user.uid;
    authCard.style.display = 'none';
    menuSection.style.display = 'block';

    const userRef = db.collection('usuarios').doc(user.uid);
    userRef.get()
      .then((docSnap) => {
        if (docSnap.exists) {
          const data = docSnap.data();
          actualizarPerfil(data, user);
          // Cargar pasaporte
          actualizarPasaporte(data.lugares_visitados || []);
        } else {
          userRef.set({
            nombre: user.displayName || 'Usuario',
            email: user.email,
            puntos: 0,
            avatar: '',
            lugares_visitados: [],
            createdAt: new Date().toISOString()
          }).then(() => {
            userRef.get().then((newSnap) => {
              if (newSnap.exists) {
                const data = newSnap.data();
                actualizarPerfil(data, user);
                actualizarPasaporte(data.lugares_visitados || []);
              }
            });
          });
        }
      })
      .catch(err => console.error('Error al cargar usuario:', err));

    // Escuchar cambios en tiempo real en el documento del usuario
    userRef.onSnapshot((docSnap) => {
      if (docSnap.exists) {
        const data = docSnap.data();
        actualizarPerfil(data, user);
        updateUserStats(user.uid);
        actualizarPasaporte(data.lugares_visitados || []);
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
}
//== target de perfil modificada=== 
// Imágenes predeterminadas
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

function showToast(msg, isError = false, duration = 5000) {
  toastDiv.textContent = msg;
  toastDiv.style.display = 'block';
  toastDiv.style.background = isError ? 'rgba(220,53,69,0.95)' : 'rgba(0,0,0,0.85)';
  clearTimeout(toastDiv._timeout);
  toastDiv._timeout = setTimeout(() => toastDiv.style.display = 'none', duration);
}

// ===== COMPRESIÓN DE IMAGEN =====
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

// ===== SUBIR A IMGBB =====
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

// ===== GUARDAR EN FIRESTORE =====
async function guardarEnFirestore(user, extra = {}) {
  const ref = doc(db, 'usuarios', user.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      uid: user.uid,
      email: user.email,
      nombre: extra.nombre || user.displayName || user.email.split('@')[0],
      fotoURL: extra.fotoURL || user.photoURL || DEFAULT_AVATARS[0],
      puntos: 0,
      fechaRegistro: new Date()
    });
  }
}

// ===== CARGAR PERFIL =====
async function cargarPerfil(user) {
  if (!user) return;
  const ref = doc(db, 'usuarios', user.uid);
  const snap = await getDoc(ref);
  let nombre, fotoURL;
  if (snap.exists()) {
    const data = snap.data();
    nombre = data.nombre || user.displayName || user.email.split('@')[0];
    fotoURL = data.fotoURL || user.photoURL || FALLBACK;
  } else {
    nombre = user.displayName || user.email.split('@')[0];
    fotoURL = user.photoURL || FALLBACK;
    await guardarEnFirestore(user, { nombre, fotoURL });
  }
  userNameSpan.textContent = nombre;
  profileNameDisplay.textContent = nombre;
  profileAvatar.src = fotoURL;
  profileAvatar.onerror = () => profileAvatar.src = FALLBACK;
}

// ===== RENDER AVATARES PREDETERMINADOS =====
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

// ===== GUARDAR PERFIL =====
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
      const ref = doc(db, 'usuarios', user.uid);
      const snap = await getDoc(ref);
      fotoURL = snap.exists() ? snap.data().fotoURL : null;
    }

    if (nuevoNombre && nuevoNombre !== user.displayName) {
      await updateProfile(user, { displayName: nuevoNombre });
    }

    const ref = doc(db, 'usuarios', user.uid);
    const updates = {};
    if (nuevoNombre) updates.nombre = nuevoNombre;
    if (fotoURL) updates.fotoURL = fotoURL;
    await updateDoc(ref, updates);

    userNameSpan.textContent = nuevoNombre || user.displayName;
    profileNameDisplay.textContent = nuevoNombre || user.displayName;
    if (fotoURL) {
      profileAvatar.src = fotoURL;
      profileAvatar.onerror = () => profileAvatar.src = FALLBACK;
    }

    showToast('✅ Perfil actualizado correctamente');
    editModal.style.display = 'none';
  } catch (error) {
    console.error('Error al guardar perfil:', error);
    showToast('❌ ' + (error.message || 'Error al guardar'), true, 5000);
  } finally {
    isSaving = false;
    saveProfileBtn.disabled = false;
    saveProfileBtn.innerHTML = 'Guardar cambios';
  }
}

//== usuario end==
// ===== PASAPORTE DINÁMICO =====
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
    const text = document.createTextNode(' ' + lugar);
    li.appendChild(icon);
    li.appendChild(text);
    passportList.appendChild(li);
  });
}

// ===== ACTUALIZAR PUNTOS Y POSICIÓN =====
function updateUserStats(uid) {
  db.collection('usuarios').doc(uid).get()
    .then((docSnap) => {
      if (!docSnap.exists) return;
      const data = docSnap.data();
      const puntos = data.puntos || 0;
      userPointsDisplay.textContent = '⭐ ' + puntos + ' puntos';

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

// ===== REDIRECCIÓN DEL PERFIL A COMUNIDAD =====
if (profileTrigger) {
  profileTrigger.addEventListener('click', function(e) {
    // Si el clic fue en el botón de editar, no redirigir
    if (e.target.closest('.edit-btn')) return;
    window.location.href = 'comunidad.html';
  });
}

// ===== MODAL DE EDICIÓN (solo botón lápiz) =====
function openEditModal() {
  editProfileModal.style.display = 'flex';
  editNameInput.value = profileNameDisplay.textContent;
  modalProfileImage.src = profileAvatar.src;
  loadAvatarGrid();
}
function closeEditModal() {
  editProfileModal.style.display = 'none';
}

if (editProfileBtn) {
  editProfileBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    openEditModal();
  });
}
if (closeModalBtn) closeModalBtn.addEventListener('click', closeEditModal);
window.addEventListener('click', function(e) { if (e.target === editProfileModal) closeEditModal(); });

// ===== SUBIR FOTO =====
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

// ===== GUARDAR NOMBRE =====
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

// ===== AVATARES PREDETERMINADOS =====
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

// ===== BOTONES "JUGAR" =====
document.querySelectorAll('.btn-jugar').forEach(btn => {
  btn.addEventListener('click', function(e) {
    const game = this.dataset.game || 'default';
    // Opcional: mostrar un toast antes de navegar
    showToast('Abriendo juego: ' + game);
    // El enlace navegará normalmente porque no usamos preventDefault
  });
});

// ===== MENÚ INFERIOR - NAVEGACIÓN =====
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

console.log('Todos los eventos cargados correctamente');
