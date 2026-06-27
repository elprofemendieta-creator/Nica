import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut, sendPasswordResetEmail, updateProfile } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc, updateDoc } from "firebase/firestore";
// Ya NO importamos firebase/storage

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

// Elementos DOM (igual que antes)
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

// Imágenes predeterminadas (puedes mantener las mismas)
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

// ===== COMPRESIÓN DE IMAGEN (igual que antes) =====
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
  // Convertir el archivo a base64
  const reader = new FileReader();
  const dataUrl = await new Promise((resolve, reject) => {
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
  const base64 = dataUrl.split(',')[1]; // extraer solo la parte base64

  const formData = new FormData();
  formData.append('key', '241be8181060d6203088a57a14c355fa'); // Tu API key
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
  return json.data.url; // URL pública de la imagen
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

// ===== GUARDAR PERFIL (NOMBRE + FOTO) =====
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

    // Si es un archivo, subir a ImgBB
    if (nuevaFoto instanceof File) {
      showToast('📤 Subiendo imagen a ImgBB...', false, 5000);
      // Comprimir antes de subir
      const compressed = await compressImage(nuevaFoto);
      fotoURL = await uploadToImgBB(compressed);
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

// ===== EVENT LISTENERS (igual que antes) =====
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
    document.getElementById('loginEmail').value = '';
    document.getElementById('loginPassword').value = '';
    document.getElementById('regEmail').value = '';
    document.getElementById('regPassword').value = '';
    document.getElementById('regName').value = '';
  }
});

// ============================================
// ===== CARRUSEL PREMIUM =====
// ============================================

// Esperar a que el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', () => {
  // Seleccionar elementos del carrusel
  const track = document.querySelector('.carousel-track');
  const slides = Array.from(document.querySelectorAll('.carousel-slide'));
  const prevBtn = document.querySelector('.prev-btn');
  const nextBtn = document.querySelector('.next-btn');
  const dots = Array.from(document.querySelectorAll('.indicator-dot'));
  let currentIndex = 0;
  let autoPlayInterval;
  let isTransitioning = false;

  // Solo ejecutar si existe el carrusel
  if (!track || slides.length === 0) return;

  // Función para actualizar el carrusel
  function updateCarousel(index, animate = true) {
    if (isTransitioning) return;
    isTransitioning = true;

    // Asegurar que el índice esté dentro de los límites
    if (index < 0) index = slides.length - 1;
    if (index >= slides.length) index = 0;
    
    const slideWidth = slides[0].getBoundingClientRect().width;
    
    // Aplicar transición
    if (!animate) {
      track.style.transition = 'none';
    } else {
      track.style.transition = 'transform 0.7s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
    }
    
    track.style.transform = `translateX(-${index * slideWidth}px)`;
    
    // Actualizar dots
    dots.forEach((dot, i) => {
      dot.classList.toggle('active', i === index);
    });
    
    // Efecto en slides no activos
    slides.forEach((slide, i) => {
      if (i === index) {
        slide.style.opacity = '1';
        slide.style.transform = 'scale(1)';
        slide.style.filter = 'brightness(1)';
      } else {
        slide.style.opacity = '0.7';
        slide.style.transform = 'scale(0.95)';
        slide.style.filter = 'brightness(0.8)';
      }
    });
    
    currentIndex = index;
    
    // Forzar reflow para animación
    if (!animate) {
      track.offsetHeight;
      track.style.transition = 'transform 0.7s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
    }

    // Liberar el bloqueo después de la animación
    setTimeout(() => {
      isTransitioning = false;
    }, 800);
  }

  // Navegación - Siguiente
  if (nextBtn) {
    nextBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!isTransitioning) {
        updateCarousel(currentIndex + 1);
        resetAutoPlay();
      }
    });
  }

  // Navegación - Anterior
  if (prevBtn) {
    prevBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!isTransitioning) {
        updateCarousel(currentIndex - 1);
        resetAutoPlay();
      }
    });
  }

  // Click en dots (indicadores)
  dots.forEach((dot, index) => {
    dot.addEventListener('click', () => {
      if (!isTransitioning && index !== currentIndex) {
        updateCarousel(index);
        resetAutoPlay();
      }
    });
  });

  // Click en slides (navegación a las URL)
  slides.forEach((slide) => {
    slide.addEventListener('click', () => {
      const url = slide.dataset.url;
      if (url) {
        // Efecto de click
        slide.style.transform = 'scale(0.95)';
        slide.style.transition = 'transform 0.2s ease';
        setTimeout(() => {
          slide.style.transform = '';
          window.location.href = url;
        }, 250);
      }
    });
  });

  // ===== AUTOPLAY =====
  function startAutoPlay() {
    if (autoPlayInterval) clearInterval(autoPlayInterval);
    autoPlayInterval = setInterval(() => {
      if (!isTransitioning) {
        updateCarousel(currentIndex + 1);
      }
    }, 5000);
  }

  function resetAutoPlay() {
    clearInterval(autoPlayInterval);
    startAutoPlay();
  }

  // Pausar autoplay al hacer hover en el carrusel
  const carouselWrapper = document.querySelector('.carousel-premium-wrapper');
  if (carouselWrapper) {
    carouselWrapper.addEventListener('mouseenter', () => {
      clearInterval(autoPlayInterval);
    });
    carouselWrapper.addEventListener('mouseleave', () => {
      startAutoPlay();
    });
  }

  // ===== RESPONSIVE - Redimensionar =====
  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      if (!isTransitioning) {
        updateCarousel(currentIndex, false);
      }
    }, 150);
  });

  // ===== NAVEGACIÓN POR TECLADO =====
  document.addEventListener('keydown', (e) => {
    // Solo si el carrusel está visible
    const menuSection = document.getElementById('menuSection');
    if (menuSection && menuSection.style.display !== 'none') {
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (nextBtn && !isTransitioning) nextBtn.click();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (prevBtn && !isTransitioning) prevBtn.click();
      }
    }
  });

  // ===== SOPORTE PARA TOUCH (deslizar en móviles) =====
  let touchStartX = 0;
  let touchEndX = 0;
  let isSwiping = false;

  const trackWrapper = document.querySelector('.carousel-track-wrapper');
  if (trackWrapper) {
    trackWrapper.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
      isSwiping = true;
    }, { passive: true });

    trackWrapper.addEventListener('touchmove', (e) => {
      // Prevenir scroll mientras se desliza el carrusel
      if (isSwiping) {
        e.preventDefault();
      }
    }, { passive: false });

    trackWrapper.addEventListener('touchend', (e) => {
      if (!isSwiping) return;
      touchEndX = e.changedTouches[0].screenX;
      const diff = touchStartX - touchEndX;
      
      // Si el deslizamiento es significativo (> 50px)
      if (Math.abs(diff) > 50) {
        if (diff > 0 && !isTransitioning) {
          // Deslizar a la izquierda -> siguiente
          updateCarousel(currentIndex + 1);
          resetAutoPlay();
        } else if (diff < 0 && !isTransitioning) {
          // Deslizar a la derecha -> anterior
          updateCarousel(currentIndex - 1);
          resetAutoPlay();
        }
      }
      isSwiping = false;
    }, { passive: true });
  }

  // ===== INICIALIZAR =====
  // Esperar a que el menú esté visible para inicializar
  function initializeCarousel() {
    if (document.getElementById('menuSection').style.display !== 'none') {
      updateCarousel(0, false);
      setTimeout(startAutoPlay, 1500);
    } else {
      // Si el menú no está visible, esperar a que lo esté
      const observer = new MutationObserver(() => {
        const menuSection = document.getElementById('menuSection');
        if (menuSection && menuSection.style.display !== 'none') {
          updateCarousel(0, false);
          setTimeout(startAutoPlay, 1500);
          observer.disconnect();
        }
      });
      observer.observe(document.getElementById('menuSection'), { 
        attributes: true, 
        attributeFilter: ['style'] 
      });
    }
  }

  // Inicializar después de un pequeño retraso
  setTimeout(initializeCarousel, 500);

  // ===== EFECTO DE PARTÍCULAS (Fondo animado) =====
  let particlesCreated = false;

  function createParticles() {
    if (particlesCreated) return;
    particlesCreated = true;

    const container = document.createElement('div');
    container.className = 'particles-container';
    container.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 0;
      overflow: hidden;
    `;
    document.body.prepend(container);

    // Crear partículas
    for (let i = 0; i < 40; i++) {
      const particle = document.createElement('div');
      const size = Math.random() * 4 + 2;
      const duration = Math.random() * 15 + 10;
      const delay = Math.random() * 10;
      const opacity = Math.random() * 0.3 + 0.1;
      
      particle.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        background: radial-gradient(circle, rgba(255,255,255,0.6), transparent);
        border-radius: 50%;
        left: ${Math.random() * 100}%;
        animation: floatParticle ${duration}s linear infinite;
        animation-delay: ${delay}s;
        opacity: ${opacity};
      `;
      container.appendChild(particle);
    }

    // Agregar keyframes para partículas si no existen
    if (!document.getElementById('particle-styles')) {
      const style = document.createElement('style');
      style.id = 'particle-styles';
      style.textContent = `
        @keyframes floatParticle {
          0% { 
            transform: translateY(100vh) rotate(0deg) scale(1);
            opacity: 0;
          }
          10% { 
            opacity: 1;
          }
          90% { 
            opacity: 1;
          }
          100% { 
            transform: translateY(-10vh) rotate(720deg) scale(0.5);
            opacity: 0;
          }
        }
      `;
      document.head.appendChild(style);
    }
  }

  // Crear partículas cuando el menú se hace visible
  const menuSectionForParticles = document.getElementById('menuSection');
  if (menuSectionForParticles) {
    // Si el menú ya está visible, crear partículas inmediatamente
    if (menuSectionForParticles.style.display !== 'none') {
      createParticles();
    } else {
      // Observar cambios en el display
      const observer = new MutationObserver(() => {
        if (menuSectionForParticles.style.display !== 'none') {
          createParticles();
          observer.disconnect();
        }
      });
      observer.observe(menuSectionForParticles, { 
        attributes: true, 
        attributeFilter: ['style'] 
      });
    }
  }

  // ===== EFECTO DE PARALLAX EN EL TÍTULO =====
  const welcomeTitle = document.querySelector('.welcome-title');
  if (welcomeTitle) {
    document.addEventListener('mousemove', (e) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 15;
      const y = (e.clientY / window.innerHeight - 0.5) * 15;
      welcomeTitle.style.transform = `translate(${x}px, ${y}px)`;
    });
  }

  console.log('🎠 Carrusel Premium inicializado correctamente');
});