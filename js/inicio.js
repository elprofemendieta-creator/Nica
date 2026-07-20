// ================================================================
// app.js - Lógica de autenticación, perfil y estadísticas
// (Mantiene todas las funciones originales sin cambios)
// ================================================================

import { initializeApp, getApp, getApps } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
  signOut
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  getDocs,
  query,
  orderBy,
  onSnapshot
} from 'firebase/firestore';
import { getStorage, ref, uploadString, getDownloadURL } from 'firebase/storage';

// ===== CONFIGURACIÓN DE FIREBASE =====
const firebaseConfig = {
  apiKey: "AIzaSyA6jVICuE17KJcO34gE1brMxqWEfNd3Fy0",
  authDomain: "mapa-41b00.firebaseapp.com",
  projectId: "mapa-41b00",
  storageBucket: "mapa-41b00.firebasestorage.app",
  messagingSenderId: "535032835400",
  appId: "1:535032835400:web:68c079cbc3f419eafd177d"
};

let app;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

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
const userNameSpan = document.getElementById('userName');
const userPointsDisplay = document.getElementById('userPointsDisplay');
const positionBadge = document.getElementById('positionBadge');

// Modal
const editProfileModal = document.getElementById('editProfileModal');
const modalProfileImage = document.getElementById('modalProfileImage');
const uploadPhotoIcon = document.getElementById('uploadPhotoIcon');
const uploadPhotoInput = document.getElementById('uploadPhoto');
const editNameInput = document.getElementById('editNameInput');
const saveProfileBtn = document.getElementById('saveProfileBtn');
const closeModalBtn = document.getElementById('closeModalBtn');
const avatarGrid = document.getElementById('avatarGrid');

// Toast
const toast = document.getElementById('toast');

// ===== FUNCIONES AUXILIARES =====
function showToast(msg, duration = 3000) {
  toast.textContent = msg;
  toast.style.display = 'block';
  setTimeout(() => { toast.style.display = 'none'; }, duration);
}

// ===== AUTENTICACIÓN =====

// Login
doLoginBtn.addEventListener('click', async () => {
  const email = loginEmail.value.trim();
  const pass = loginPassword.value.trim();
  if (!email || !pass) {
    showToast('Por favor, completa todos los campos.');
    return;
  }
  try {
    await signInWithEmailAndPassword(auth, email, pass);
    showToast('¡Bienvenido de vuelta!');
  } catch (error) {
    showToast('Error: ' + error.message);
  }
});

// Registro
doRegisterBtn.addEventListener('click', async () => {
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
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    // Actualizar nombre en Firebase Auth
    await updateProfile(cred.user, { displayName: name });
    // Guardar en Firestore
    await setDoc(doc(db, 'usuarios', cred.user.uid), {
      nombre: name,
      email: email,
      puntos: 0,
      avatar: '',
      createdAt: new Date().toISOString()
    });
    showToast('¡Cuenta creada exitosamente!');
  } catch (error) {
    showToast('Error: ' + error.message);
  }
});

// Mostrar formulario de registro
showRegisterBtn.addEventListener('click', () => {
  loginForm.style.display = 'none';
  registerForm.style.display = 'block';
});

backToLoginBtn.addEventListener('click', () => {
  registerForm.style.display = 'none';
  loginForm.style.display = 'block';
});

// Recuperar contraseña
forgotPasswordLink.addEventListener('click', async (e) => {
  e.preventDefault();
  const email = loginEmail.value.trim();
  if (!email) {
    showToast('Ingresa tu correo para restablecer la contraseña.');
    return;
  }
  try {
    await sendPasswordResetEmail(auth, email);
    showToast('Correo de restablecimiento enviado. Revisa tu bandeja.');
  } catch (error) {
    showToast('Error: ' + error.message);
  }
});

// ===== ESTADO DE AUTENTICACIÓN =====
onAuthStateChanged(auth, async (user) => {
  if (user) {
    authCard.style.display = 'none';
    menuSection.style.display = 'block';

    // Cargar datos del usuario
    const userRef = doc(db, 'usuarios', user.uid);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      const data = snap.data();
      const nombre = data.nombre || user.displayName || 'Usuario';
      profileNameDisplay.textContent = nombre;
      if (userNameSpan) userNameSpan.textContent = nombre;
      if (data.avatar) {
        profileAvatar.src = data.avatar;
        modalProfileImage.src = data.avatar;
      } else {
        profileAvatar.src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(nombre) + '&background=a4c737&color=fff&size=128';
        modalProfileImage.src = profileAvatar.src;
      }
      // Actualizar puntos y posición
      await updateUserStats(user.uid);
      // Escuchar cambios en tiempo real
      onSnapshot(userRef, (docSnap) => {
        if (docSnap.exists()) {
          const newData = docSnap.data();
          const puntos = newData.puntos || 0;
          userPointsDisplay.textContent = `⭐ ${puntos} puntos`;
          // Recalcular posición
          updateUserStats(user.uid);
        }
      });
    } else {
      // Crear documento si no existe
      await setDoc(userRef, {
        nombre: user.displayName || 'Usuario',
        email: user.email,
        puntos: 0,
        avatar: '',
        createdAt: new Date().toISOString()
      });
      profileNameDisplay.textContent = user.displayName || 'Usuario';
      if (userNameSpan) userNameSpan.textContent = user.displayName || 'Usuario';
    }

    // Cargar insignias (ejemplo)
    loadBadges(user.uid);

    // Cargar destinos (estáticos)
    // (opcional)
  } else {
    authCard.style.display = 'block';
    menuSection.style.display = 'none';
    // Limpiar formularios
    loginForm.style.display = 'block';
    registerForm.style.display = 'none';
  }
});

// ===== ACTUALIZAR ESTADÍSTICAS (puntos y posición) =====
async function updateUserStats(uid) {
  try {
    const userRef = doc(db, 'usuarios', uid);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) return;
    const userData = userSnap.data();
    const puntos = userData.puntos || 0;
    userPointsDisplay.textContent = `⭐ ${puntos} puntos`;

    const q = query(collection(db, 'usuarios'), orderBy('puntos', 'desc'));
    const querySnap = await getDocs(q);
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
      positionBadge.textContent = `${medal}Posición #${posicion} de ${total}`;
    } else {
      positionBadge.textContent = '📈 Sin posición aún';
    }
  } catch (error) {
    console.error('Error en updateUserStats:', error);
  }
}

// ===== CERRAR SESIÓN =====
logoutBtn.addEventListener('click', async () => {
  try {
    await signOut(auth);
    showToast('Sesión cerrada');
  } catch (error) {
    showToast('Error al cerrar sesión: ' + error.message);
  }
});

// ===== MODAL DE EDICIÓN DE PERFIL =====
function openEditModal() {
  editProfileModal.style.display = 'flex';
  // Cargar datos actuales
  const nombre = profileNameDisplay.textContent;
  editNameInput.value = nombre;
  const imgSrc = profileAvatar.src;
  modalProfileImage.src = imgSrc;
  // Cargar avatares predeterminados
  loadAvatarGrid();
}

function closeEditModal() {
  editProfileModal.style.display = 'none';
}

profileTrigger.addEventListener('click', openEditModal);
editProfileBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  openEditModal();
});

closeModalBtn.addEventListener('click', closeEditModal);
window.addEventListener('click', (e) => {
  if (e.target === editProfileModal) closeEditModal();
});

// Subir foto
uploadPhotoIcon.addEventListener('click', () => {
  uploadPhotoInput.click();
});

uploadPhotoInput.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUrl = ev.target.result;
      modalProfileImage.src = dataUrl;
      // Subir a Firebase Storage
      const storageRef = ref(storage, `avatars/${auth.currentUser.uid}`);
      await uploadString(storageRef, dataUrl, 'data_url');
      const url = await getDownloadURL(storageRef);
      // Actualizar en Firestore
      await updateDoc(doc(db, 'usuarios', auth.currentUser.uid), { avatar: url });
      // Actualizar vista
      profileAvatar.src = url;
      modalProfileImage.src = url;
      showToast('Foto actualizada');
    };
    reader.readAsDataURL(file);
  } catch (error) {
    showToast('Error al subir foto: ' + error.message);
  }
});

// Guardar cambios de perfil (nombre)
saveProfileBtn.addEventListener('click', async () => {
  const newName = editNameInput.value.trim();
  if (!newName) {
    showToast('El nombre no puede estar vacío.');
    return;
  }
  try {
    const user = auth.currentUser;
    // Actualizar en Auth
    await updateProfile(user, { displayName: newName });
    // Actualizar en Firestore
    await updateDoc(doc(db, 'usuarios', user.uid), { nombre: newName });
    // Actualizar UI
    profileNameDisplay.textContent = newName;
    if (userNameSpan) userNameSpan.textContent = newName;
    showToast('Perfil actualizado');
    closeEditModal();
  } catch (error) {
    showToast('Error: ' + error.message);
  }
});

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
    img.addEventListener('click', async () => {
      try {
        // Actualizar en Firestore
        await updateDoc(doc(db, 'usuarios', auth.currentUser.uid), { avatar: url });
        profileAvatar.src = url;
        modalProfileImage.src = url;
        document.querySelectorAll('.avatar-pred').forEach(el => el.classList.remove('selected'));
        img.classList.add('selected');
        showToast('Avatar cambiado');
      } catch (error) {
        showToast('Error: ' + error.message);
      }
    });
    avatarGrid.appendChild(img);
  });
}

// ===== CARGAR INSIGNIAS (ejemplo) =====
async function loadBadges(uid) {
  // Puedes obtener las insignias reales desde Firestore si las guardas
  // Aquí dejamos las estáticas que se muestran en el diseño.
  // El HTML ya tiene la lista fija, pero podrías actualizarla dinámicamente.
  // Por ahora no hacemos nada.
}

// ===== WHATSAPP (solo enlace) =====
document.getElementById('whatsappBtn').addEventListener('click', (e) => {
  e.preventDefault();
  // Reemplazar con número real
  window.open('https://wa.me/505XXXXXXXX?text=Hola%20Guía%20Pinolero', '_blank');
});

// ===== INSTALACIÓN PWA =====
let deferredPrompt;
const installBtn = document.getElementById('installBtn');

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  installBtn.style.display = 'flex';
});

installBtn.addEventListener('click', async () => {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    const result = await deferredPrompt.userChoice;
    if (result.outcome === 'accepted') {
      console.log('Usuario aceptó la instalación');
    } else {
      console.log('Usuario rechazó la instalación');
    }
    deferredPrompt = null;
    installBtn.style.display = 'none';
  }
});

window.addEventListener('appinstalled', () => {
  installBtn.style.display = 'none';
});

// ===== CARRUSEL (se mantiene oculto, pero su lógica puede estar en inicio.js) =====
// No se modifica nada, el carrusel sigue en el DOM pero oculto.
