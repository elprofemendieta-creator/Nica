import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut, sendPasswordResetEmail, updateProfile } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc, updateDoc } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyA6jVICuE17KJcO34gE1brMxqWEfNd3Fy0",
  authDomain: "mapa-41b00.firebaseapp.com",
  projectId: "mapa-41b00",
  storageBucket: "mapa-41b00.firebasestorage.app",
  messagingSenderId: "535032835400",
  appId: "1:535032835400:web:68c079cbc3f419eafd177d"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Elementos DOM
const authCard = document.getElementById('authCard');
const menuSection = document.getElementById('menuSection');
const userNameSpan = document.getElementById('userName');
const profileNameDisplay = document.getElementById('profileNameDisplay');
const profileAvatar = document.getElementById('profileAvatar');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const toastDiv = document.getElementById('toast');
const editModal = document.getElementById('editProfileModal');
const modalProfileImage = document.getElementById('modalProfileImage');
const editNameInput = document.getElementById('editNameInput');
const avatarGrid = document.getElementById('avatarGrid');
const uploadPhoto = document.getElementById('uploadPhoto');
const saveProfileBtn = document.getElementById('saveProfileBtn');

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

function showToast(msg, isError = false, duration = 3000) {
  toastDiv.textContent = msg;
  toastDiv.style.display = 'block';
  toastDiv.style.background = isError ? 'rgba(220,53,69,0.95)' : 'rgba(0,0,0,0.85)';
  clearTimeout(toastDiv._timeout);
  toastDiv._timeout = setTimeout(() => toastDiv.style.display = 'none', duration);
}

// Compresión de imagen
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

// Subir imagen a Storage (usa nombre fijo para sobrescribir)
async function uploadProfileImage(file, userId) {
  try {
    const compressed = await compressImage(file);
    const fileName = `profile_${userId}.jpg`; // nombre fijo
    const storageRef = ref(storage, `profile_images/${userId}/${fileName}`);
    const metadata = {
      contentType: 'image/jpeg',
      customMetadata: { uploadedBy: userId }
    };
    const snapshot = await uploadBytes(storageRef, compressed, metadata);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error) {
    console.error('Error al subir imagen:', error);
    throw new Error('No se pudo subir la imagen. Verifica tu conexión y permisos.');
  }
}

// Guardar/crear usuario en Firestore
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

// Cargar perfil en UI
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

// Renderizar avatares predeterminados
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

// Guardar perfil (nombre y foto)
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

    // Si es un archivo, subir a Storage
    if (nuevaFoto instanceof File) {
      showToast('📤 Subiendo imagen...', false, 5000);
      fotoURL = await uploadProfileImage(nuevaFoto, user.uid);
    } else if (typeof nuevaFoto === 'string' && nuevaFoto.startsWith('http')) {
      fotoURL = nuevaFoto; // avatar predeterminado
    } else {
      // Mantener la actual
      const ref = doc(db, 'usuarios', user.uid);
      const snap = await getDoc(ref);
      fotoURL = snap.exists() ? snap.data().fotoURL : null;
    }

    // Actualizar nombre en Auth
    if (nuevoNombre && nuevoNombre !== user.displayName) {
      await updateProfile(user, { displayName: nuevoNombre });
    }

    // Actualizar Firestore
    const ref = doc(db, 'usuarios', user.uid);
    const updates = {};
    if (nuevoNombre) updates.nombre = nuevoNombre;
    if (fotoURL) updates.fotoURL = fotoURL;
    await updateDoc(ref, updates);

    // Actualizar UI
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

// ------- Event Listeners -------

document.getElementById('doLoginBtn').onclick = async () => {
  const email = document.getElementById('loginEmail').value.trim();
  const pass = document.getElementById('loginPassword').value;
  if (!email || !pass) return showToast('Completa los campos', true);
  try {
    await signInWithEmailAndPassword(auth, email, pass);
    showToast('✅ Bienvenido');
  } catch {
    showToast('❌ Credenciales incorrectas', true);
  }
};

document.getElementById('doRegisterBtn').onclick = async () => {
  const name = document.getElementById('regName').value.trim();
  const email = document.getElementById('regEmail').value.trim();
  const pass = document.getElementById('regPassword').value;
  if (!name || !email || !pass) return showToast('Completa los campos', true);
  if (pass.length < 6) return showToast('Contraseña mínimo 6 caracteres', true);
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    await updateProfile(cred.user, { displayName: name });
    await guardarEnFirestore(cred.user, { nombre: name, fotoURL: DEFAULT_AVATARS[0] });
    showToast('✅ Registro exitoso');
  } catch (err) {
    showToast(err.message.includes('email') ? '❌ Correo ya registrado' : '❌ Error al registrar', true);
  }
};

document.getElementById('forgotPasswordLink').onclick = async () => {
  const email = prompt('Ingresa tu correo para restablecer contraseña:');
  if (email && email.includes('@')) {
    try {
      await sendPasswordResetEmail(auth, email);
      showToast('📨 Revisa tu correo (incluso SPAM)');
    } catch {
      showToast('❌ Correo no registrado o error', true);
    }
  }
};

document.getElementById('showRegisterBtn').onclick = () => {
  loginForm.style.display = 'none';
  registerForm.style.display = 'block';
};

document.getElementById('backToLoginBtn').onclick = () => {
  registerForm.style.display = 'none';
  loginForm.style.display = 'block';
};

document.getElementById('logoutBtn').onclick = async () => {
  await signOut(auth);
  showToast('👋 Sesión cerrada');
};

document.getElementById('editProfileBtn').onclick = async () => {
  const user = auth.currentUser;
  if (!user) return;
  const ref = doc(db, 'usuarios', user.uid);
  const snap = await getDoc(ref);
  const data = snap.exists() ? snap.data() : { nombre: user.displayName, fotoURL: user.photoURL };
  editNameInput.value = data.nombre || '';
  const fotoActual = data.fotoURL || FALLBACK;
  modalProfileImage.src = fotoActual;
  fotoTemporal = fotoActual;
  renderAvatars(fotoActual);
  uploadPhoto.value = '';
  editModal.style.display = 'flex';
};

document.getElementById('uploadPhotoIcon').onclick = () => uploadPhoto.click();

uploadPhoto.onchange = (e) => {
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
};

saveProfileBtn.onclick = async () => {
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
};

document.getElementById('closeModalBtn').onclick = () => {
  editModal.style.display = 'none';
};

window.onclick = (e) => {
  if (e.target === editModal) editModal.style.display = 'none';
};

document.getElementById('whatsappBtn').onclick = (e) => {
  e.preventDefault();
  const user = auth.currentUser;
  let msg = "¡Hola!%20Estoy%20explorando%20Nicaragua%20con%20Guía%20Pinolero";
  if (user?.displayName) msg = `Hola,%20soy%20${encodeURIComponent(user.displayName)}.%20${msg}`;
  window.open(`https://wa.me/50588170531?text=${msg}`, '_blank');
};

// Estado de autenticación
onAuthStateChanged(auth, (user) => {
  if (user) {
    authCard.style.display = 'none';
    menuSection.style.display = 'block';
    cargarPerfil(user);
  } else {
    authCard.style.display = 'block';
    menuSection.style.display = 'none';
    loginForm.style.display = 'block';
    registerForm.style.display = 'none';
    // Limpiar campos
    document.getElementById('loginEmail').value = '';
    document.getElementById('loginPassword').value = '';
    document.getElementById('regEmail').value = '';
    document.getElementById('regPassword').value = '';
    document.getElementById('regName').value = '';
  }
});
