// ============================================
// ===== CARRUSEL PREMIUM - JUEGOS =====
// ============================================

document.addEventListener('DOMContentLoaded', () => {
  // Seleccionar elementos del carrusel
  const track = document.querySelector('.carousel-track');
  const slides = Array.from(document.querySelectorAll('.carousel-slide'));
  const prevBtn = document.querySelector('.prev-btn');
  const nextBtn = document.querySelector('.next-btn');
  const dots = Array.from(document.querySelectorAll('.indicator-dot'));
  const wrapper = document.querySelector('.carousel-track-wrapper');
  const gameTitle = document.getElementById('gameTitle');
  const gameContent = document.getElementById('gameContent');
  
  let currentIndex = 0;
  let autoPlayInterval;
  let isTransitioning = false;
  let slideWidth = 0;

  // Solo ejecutar si existe el carrusel
  if (!track || slides.length === 0) return;

  // Función para calcular el ancho real
  function getSlideWidth() {
    if (wrapper) {
      return wrapper.getBoundingClientRect().width;
    }
    return slides[0]?.getBoundingClientRect().width || 0;
  }

  // Función para actualizar el carrusel
  function updateCarousel(index, animate = true) {
    if (isTransitioning) return;
    isTransitioning = true;

    if (index < 0) index = slides.length - 1;
    if (index >= slides.length) index = 0;
    
    slideWidth = getSlideWidth();
    
    if (slideWidth === 0) {
      isTransitioning = false;
      return;
    }
    
    if (!animate) {
      track.style.transition = 'none';
    } else {
      track.style.transition = 'transform 0.7s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
    }
    
    track.style.transform = `translateX(-${index * slideWidth}px)`;
    
    dots.forEach((dot, i) => {
      dot.classList.toggle('active', i === index);
    });
    
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
    
    if (!animate) {
      track.offsetHeight;
      track.style.transition = 'transform 0.7s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
    }

    setTimeout(() => {
      isTransitioning = false;
    }, 800);
  }

  // ===== NAVEGACIÓN =====
  function goToNext() {
    if (!isTransitioning) {
      updateCarousel(currentIndex + 1);
      resetAutoPlay();
    }
  }

  function goToPrev() {
    if (!isTransitioning) {
      updateCarousel(currentIndex - 1);
      resetAutoPlay();
    }
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      goToNext();
    });
  }

  if (prevBtn) {
    prevBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      goToPrev();
    });
  }

  dots.forEach((dot, index) => {
    dot.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!isTransitioning && index !== currentIndex) {
        updateCarousel(index);
        resetAutoPlay();
      }
    });
  });

  // ===== CLICK EN SLIDES - CARGAR JUEGO =====
  slides.forEach((slide) => {
    slide.addEventListener('click', (e) => {
      if (e.target.closest('.carousel-nav-btn')) return;
      if (e.target.closest('.indicator-dot')) return;
      
      const url = slide.dataset.url;
      const icon = slide.querySelector('.slide-icon')?.textContent || '🎮';
      const title = slide.querySelector('h3')?.textContent || 'Juego';
      const description = slide.querySelector('p')?.textContent || 'Disfruta de este juego turístico';
      
      // Cargar el juego correspondiente
      cargarJuego(title, icon, description, url);
      
      // Efecto de click
      slide.style.transform = 'scale(0.95)';
      slide.style.transition = 'transform 0.2s ease';
      setTimeout(() => {
        slide.style.transform = '';
      }, 200);
    });
  });

  // ===== FUNCIÓN PARA CARGAR JUEGOS =====
  function cargarJuego(nombre, icono, descripcion, url) {
    if (gameTitle) {
      gameTitle.textContent = `🎯 ${nombre}`;
    }

    // Limpiar contenido anterior
    gameContent.innerHTML = '';

    // Identificar qué juego cargar según el nombre
    const nombreLower = nombre.toLowerCase();

    if (nombreLower.includes('mapa misterioso') || nombreLower.includes('mapamisterioso')) {
      // Juego: El Gran Mapa Misterioso
      gameContent.innerHTML = `
        <div style="padding: 1.5rem;">
          <div style="font-size: 4rem; margin-bottom: 1rem;">🗺️</div>
          <h3 style="font-family: 'Fredoka', sans-serif; font-size: 1.5rem; color: #028090;">El Gran Mapa Misterioso</h3>
          <p style="color: #64748b; margin: 0.5rem 0 1.5rem;">${descripcion}</p>
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.5rem; max-width: 300px; margin: 1rem auto;">
            <div style="background: #e8f8f5; padding: 1rem; border-radius: 12px; font-size: 2rem;">🌋</div>
            <div style="background: #e8f8f5; padding: 1rem; border-radius: 12px; font-size: 2rem;">🌊</div>
            <div style="background: #e8f8f5; padding: 1rem; border-radius: 12px; font-size: 2rem;">🏝️</div>
            <div style="background: #e8f8f5; padding: 1rem; border-radius: 12px; font-size: 2rem;">🦎</div>
            <div style="background: #e8f8f5; padding: 1rem; border-radius: 12px; font-size: 2rem;">🌴</div>
            <div style="background: #e8f8f5; padding: 1rem; border-radius: 12px; font-size: 2rem;">🌽</div>
          </div>
          <a href="${url}" class="btn" style="display: inline-block; text-decoration: none; color: white; padding: 0.8rem 2.5rem; border-radius: 50px; background: linear-gradient(135deg, #00a896, #028090); font-weight: 600; transition: all 0.3s; box-shadow: 0 4px 15px rgba(0,168,150,0.3); margin-top: 1rem;">
            🚀 Jugar Ahora
          </a>
        </div>
      `;
    } 
    else if (nombreLower.includes('stopinolero')) {
      // Juego: Stopinolero
      gameContent.innerHTML = `
        <div style="padding: 1.5rem;">
          <div style="font-size: 4rem; margin-bottom: 1rem;">🛑</div>
          <h3 style="font-family: 'Fredoka', sans-serif; font-size: 1.5rem; color: #028090;">Stopinolero</h3>
          <p style="color: #64748b; margin: 0.5rem 0 1.5rem;">${descripcion}</p>
          <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; margin: 1rem 0;">
            <span style="background: #f0fdfa; padding: 0.5rem 1rem; border-radius: 12px;">🇳🇮</span>
            <span style="background: #f0fdfa; padding: 0.5rem 1rem; border-radius: 12px;">🏛️</span>
            <span style="background: #f0fdfa; padding: 0.5rem 1rem; border-radius: 12px;">🌋</span>
          </div>
          <a href="${url}" class="btn" style="display: inline-block; text-decoration: none; color: white; padding: 0.8rem 2.5rem; border-radius: 50px; background: linear-gradient(135deg, #00a896, #028090); font-weight: 600; transition: all 0.3s; box-shadow: 0 4px 15px rgba(0,168,150,0.3); margin-top: 1rem;">
            🚀 Jugar Ahora
          </a>
        </div>
      `;
    }
    else if (nombreLower.includes('memoria') || nombreLower.includes('pareja')) {
      // Juego: Memoria de Cartas
      gameContent.innerHTML = `
        <div style="padding: 1.5rem;">
          <div style="font-size: 4rem; margin-bottom: 1rem;">🃏</div>
          <h3 style="font-family: 'Fredoka', sans-serif; font-size: 1.5rem; color: #028090;">Memoria de Cartas</h3>
          <p style="color: #64748b; margin: 0.5rem 0 1.5rem;">${descripcion}</p>
          <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.5rem; max-width: 300px; margin: 1rem auto;">
            <div style="background: #e8f8f5; padding: 0.8rem; border-radius: 12px; font-size: 1.5rem; text-align: center;">🌋</div>
            <div style="background: #e8f8f5; padding: 0.8rem; border-radius: 12px; font-size: 1.5rem; text-align: center;">🌊</div>
            <div style="background: #e8f8f5; padding: 0.8rem; border-radius: 12px; font-size: 1.5rem; text-align: center;">🌋</div>
            <div style="background: #e8f8f5; padding: 0.8rem; border-radius: 12px; font-size: 1.5rem; text-align: center;">🏝️</div>
            <div style="background: #e8f8f5; padding: 0.8rem; border-radius: 12px; font-size: 1.5rem; text-align: center;">🌊</div>
            <div style="background: #e8f8f5; padding: 0.8rem; border-radius: 12px; font-size: 1.5rem; text-align: center;">🍽️</div>
            <div style="background: #e8f8f5; padding: 0.8rem; border-radius: 12px; font-size: 1.5rem; text-align: center;">🏝️</div>
            <div style="background: #e8f8f5; padding: 0.8rem; border-radius: 12px; font-size: 1.5rem; text-align: center;">🍽️</div>
          </div>
          <a href="${url}" class="btn" style="display: inline-block; text-decoration: none; color: white; padding: 0.8rem 2.5rem; border-radius: 50px; background: linear-gradient(135deg, #00a896, #028090); font-weight: 600; transition: all 0.3s; box-shadow: 0 4px 15px rgba(0,168,150,0.3); margin-top: 1rem;">
            🚀 Jugar Ahora
          </a>
        </div>
      `;
    }
    else if (nombreLower.includes('ordena') || nombreLower.includes('palabra')) {
      // Juego: Ordena la Palabra
      gameContent.innerHTML = `
        <div style="padding: 1.5rem;">
          <div style="font-size: 4rem; margin-bottom: 1rem;">🔤</div>
          <h3 style="font-family: 'Fredoka', sans-serif; font-size: 1.5rem; color: #028090;">Ordena la Palabra</h3>
          <p style="color: #64748b; margin: 0.5rem 0 1.5rem;">${descripcion}</p>
          <div style="display: flex; gap: 0.5rem; justify-content: center; flex-wrap: wrap; margin: 1rem 0;">
            <span style="background: #f0fdfa; padding: 0.5rem 1rem; border-radius: 8px; font-weight: 600;">N</span>
            <span style="background: #f0fdfa; padding: 0.5rem 1rem; border-radius: 8px; font-weight: 600;">I</span>
            <span style="background: #f0fdfa; padding: 0.5rem 1rem; border-radius: 8px; font-weight: 600;">C</span>
            <span style="background: #f0fdfa; padding: 0.5rem 1rem; border-radius: 8px; font-weight: 600;">A</span>
            <span style="background: #f0fdfa; padding: 0.5rem 1rem; border-radius: 8px; font-weight: 600;">R</span>
            <span style="background: #f0fdfa; padding: 0.5rem 1rem; border-radius: 8px; font-weight: 600;">A</span>
            <span style="background: #f0fdfa; padding: 0.5rem 1rem; border-radius: 8px; font-weight: 600;">G</span>
            <span style="background: #f0fdfa; padding: 0.5rem 1rem; border-radius: 8px; font-weight: 600;">U</span>
            <span style="background: #f0fdfa; padding: 0.5rem 1rem; border-radius: 8px; font-weight: 600;">A</span>
          </div>
          <a href="${url}" class="btn" style="display: inline-block; text-decoration: none; color: white; padding: 0.8rem 2.5rem; border-radius: 50px; background: linear-gradient(135deg, #00a896, #028090); font-weight: 600; transition: all 0.3s; box-shadow: 0 4px 15px rgba(0,168,150,0.3); margin-top: 1rem;">
            🚀 Jugar Ahora
          </a>
        </div>
      `;
    }
    else if (nombreLower.includes('laberinto')) {
      // Juego: Laberinto
      gameContent.innerHTML = `
        <div style="padding: 1.5rem;">
          <div style="font-size: 4rem; margin-bottom: 1rem;">🌋</div>
          <h3 style="font-family: 'Fredoka', sans-serif; font-size: 1.5rem; color: #028090;">Laberinto</h3>
          <p style="color: #64748b; margin: 0.5rem 0 1.5rem;">${descripcion}</p>
          <p style="color: #64748b; font-size: 0.9rem;">Usa las flechas del teclado para mover al explorador</p>
          <canvas id="mazeCanvas" width="300" height="300" style="background:white; border-radius:15px; margin-top:20px; max-width: 100%; height: auto;"></canvas>
          <div style="margin-top: 1rem;">
            <a href="${url}" class="btn" style="display: inline-block; text-decoration: none; color: white; padding: 0.8rem 2.5rem; border-radius: 50px; background: linear-gradient(135deg, #00a896, #028090); font-weight: 600; transition: all 0.3s; box-shadow: 0 4px 15px rgba(0,168,150,0.3);">
              🚀 Jugar Ahora
            </a>
          </div>
        </div>
      `;
      
      // Iniciar laberinto si existe la función
      if (typeof iniciarLaberinto === 'function') {
        setTimeout(iniciarLaberinto, 100);
      }
    }
    else if (nombreLower.includes('varios') || nombreLower.includes('sopa')) {
      // Juego: Varios / Sopa de Letras
      gameContent.innerHTML = `
        <div style="padding: 1.5rem;">
          <div style="font-size: 4rem; margin-bottom: 1rem;">🧩</div>
          <h3 style="font-family: 'Fredoka', sans-serif; font-size: 1.5rem; color: #028090;">Varios - Sopa de Letras</h3>
          <p style="color: #64748b; margin: 0.5rem 0 1.5rem;">${descripcion}</p>
          <div style="display: grid; grid-template-columns: repeat(6, 1fr); gap: 0.3rem; max-width: 300px; margin: 1rem auto;">
            <span style="background: #f0fdfa; padding: 0.4rem; border-radius: 4px; text-align: center; font-weight: 600;">N</span>
            <span style="background: #f0fdfa; padding: 0.4rem; border-radius: 4px; text-align: center; font-weight: 600;">I</span>
            <span style="background: #f0fdfa; padding: 0.4rem; border-radius: 4px; text-align: center; font-weight: 600;">C</span>
            <span style="background: #f0fdfa; padding: 0.4rem; border-radius: 4px; text-align: center; font-weight: 600;">A</span>
            <span style="background: #f0fdfa; padding: 0.4rem; border-radius: 4px; text-align: center; font-weight: 600;">R</span>
            <span style="background: #f0fdfa; padding: 0.4rem; border-radius: 4px; text-align: center; font-weight: 600;">A</span>
            <span style="background: #f0fdfa; padding: 0.4rem; border-radius: 4px; text-align: center; font-weight: 600;">G</span>
            <span style="background: #f0fdfa; padding: 0.4rem; border-radius: 4px; text-align: center; font-weight: 600;">U</span>
            <span style="background: #f0fdfa; padding: 0.4rem; border-radius: 4px; text-align: center; font-weight: 600;">A</span>
            <span style="background: #f0fdfa; padding: 0.4rem; border-radius: 4px; text-align: center; font-weight: 600;">🌋</span>
            <span style="background: #f0fdfa; padding: 0.4rem; border-radius: 4px; text-align: center; font-weight: 600;">🌊</span>
            <span style="background: #f0fdfa; padding: 0.4rem; border-radius: 4px; text-align: center; font-weight: 600;">🏝️</span>
          </div>
          <a href="${url}" class="btn" style="display: inline-block; text-decoration: none; color: white; padding: 0.8rem 2.5rem; border-radius: 50px; background: linear-gradient(135deg, #00a896, #028090); font-weight: 600; transition: all 0.3s; box-shadow: 0 4px 15px rgba(0,168,150,0.3); margin-top: 1rem;">
            🚀 Jugar Ahora
          </a>
        </div>
      `;
    }
    else {
      // Juego genérico
      gameContent.innerHTML = `
        <div style="padding: 1.5rem;">
          <div style="font-size: 4rem; margin-bottom: 1rem;">${icono}</div>
          <h3 style="font-family: 'Fredoka', sans-serif; font-size: 1.5rem; color: #028090;">${nombre}</h3>
          <p style="color: #64748b; margin: 0.5rem 0 1.5rem;">${descripcion}</p>
          <a href="${url}" class="btn" style="display: inline-block; text-decoration: none; color: white; padding: 0.8rem 2.5rem; border-radius: 50px; background: linear-gradient(135deg, #00a896, #028090); font-weight: 600; transition: all 0.3s; box-shadow: 0 4px 15px rgba(0,168,150,0.3);">
            🚀 Jugar Ahora
          </a>
        </div>
      `;
    }
  }

  // ===== AUTOPLAY =====
  function startAutoPlay() {
    if (autoPlayInterval) clearInterval(autoPlayInterval);
    autoPlayInterval = setInterval(() => {
      if (!isTransitioning) {
        goToNext();
      }
    }, 5000);
  }

  function resetAutoPlay() {
    clearInterval(autoPlayInterval);
    startAutoPlay();
  }

  const carouselWrapper = document.querySelector('.carousel-premium-wrapper');
  if (carouselWrapper) {
    carouselWrapper.addEventListener('mouseenter', () => {
      clearInterval(autoPlayInterval);
    });
    carouselWrapper.addEventListener('mouseleave', () => {
      startAutoPlay();
    });
  }

  // ===== RESPONSIVE =====
  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      if (!isTransitioning) {
        slideWidth = getSlideWidth();
        if (slideWidth > 0) {
          track.style.transition = 'none';
          track.style.transform = `translateX(-${currentIndex * slideWidth}px)`;
          track.offsetHeight;
          track.style.transition = 'transform 0.7s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
        }
      }
    }, 200);
  });

  // ===== TECLADO =====
  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      goToNext();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      goToPrev();
    }
  });

  // ===== TOUCH =====
  let touchStartX = 0;
  let touchEndX = 0;
  let isSwiping = false;

  if (wrapper) {
    wrapper.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
      isSwiping = true;
    }, { passive: true });

    wrapper.addEventListener('touchmove', (e) => {
      if (isSwiping) {
        e.preventDefault();
      }
    }, { passive: false });

    wrapper.addEventListener('touchend', (e) => {
      if (!isSwiping) return;
      touchEndX = e.changedTouches[0].screenX;
      const diff = touchStartX - touchEndX;
      
      if (Math.abs(diff) > 50) {
        if (diff > 0 && !isTransitioning) {
          goToNext();
        } else if (diff < 0 && !isTransitioning) {
          goToPrev();
        }
      }
      isSwiping = false;
    }, { passive: true });
  }

  // ===== INICIALIZAR =====
  function initializeCarousel() {
    setTimeout(() => {
      slideWidth = getSlideWidth();
      if (slideWidth > 0) {
        updateCarousel(0, false);
        setTimeout(startAutoPlay, 1500);
      } else {
        setTimeout(initializeCarousel, 300);
      }
    }, 100);
  }

  setTimeout(initializeCarousel, 600);

  // ===== WHATSAPP =====
  const whatsappBtn = document.getElementById('whatsappBtn');
  if (whatsappBtn) {
    whatsappBtn.addEventListener('click', (e) => {
      e.preventDefault();
      window.open('https://wa.me/50588170531?text=¡Hola!%20Estoy%20explorando%20los%20juegos%20de%20Guía%20Pinolero%20🎮', '_blank');
    });
  }

  console.log('🎠 Carrusel de Juegos inicializado correctamente');
});

// ============================================
// ===== FUNCIONES DE JUEGOS EXISTENTES =====
// ============================================

// ===== VARIABLES GLOBALES PARA JUEGOS =====
const lugaresRuleta = [
  "🌋 Volcán Masaya",
  "🌊 Lago de Nicaragua",
  "🏝️ Isla de Ometepe",
  "🦎 Mombacho",
  "🌴 San Juan del Sur",
  "🌽 Maíz",
  "🏛️ Granada",
  "⛪ León",
  "🌋 Cerro Negro",
  "🏄 Playa Maderas"
];

// ===== FUNCIÓN LABERINTO =====
function iniciarLaberinto() {
  const canvas = document.getElementById('mazeCanvas');
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  const maze = [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 1, 0, 0, 0, 0, 1],
    [1, 0, 1, 0, 1, 0, 1, 1, 0, 1],
    [1, 0, 1, 0, 0, 0, 0, 1, 0, 1],
    [1, 0, 1, 1, 1, 1, 0, 1, 0, 1],
    [1, 0, 0, 0, 0, 1, 0, 0, 0, 1],
    [1, 1, 1, 1, 0, 1, 1, 1, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 1, 0, 1],
    [1, 0, 1, 1, 1, 1, 0, 0, 0, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
  ];
  
  let playerX = 1;
  let playerY = 1;
  const goalX = 8;
  const goalY = 8;
  const cellSize = canvas.width / maze.length;
  
  function drawMaze() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Dibujar laberinto
    for (let row = 0; row < maze.length; row++) {
      for (let col = 0; col < maze[row].length; col++) {
        if (maze[row][col] === 1) {
          ctx.fillStyle = '#2d3748';
          ctx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize);
        } else {
          ctx.fillStyle = '#f7fafc';
          ctx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize);
        }
      }
    }
    
    // Dibujar meta
    ctx.fillStyle = '#48bb78';
    ctx.beginPath();
    ctx.arc(goalX * cellSize + cellSize/2, goalY * cellSize + cellSize/2, cellSize/3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#22543d';
    ctx.font = `${cellSize/2}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🏆', goalX * cellSize + cellSize/2, goalY * cellSize + cellSize/2);
    
    // Dibujar jugador
    ctx.fillStyle = '#f56565';
    ctx.beginPath();
    ctx.arc(playerX * cellSize + cellSize/2, playerY * cellSize + cellSize/2, cellSize/3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#c53030';
    ctx.font = `${cellSize/2}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🦎', playerX * cellSize + cellSize/2, playerY * cellSize + cellSize/2);
  }
  
  function movePlayer(dx, dy) {
    const newX = playerX + dx;
    const newY = playerY + dy;
    
    if (maze[newY] && maze[newY][newX] === 0) {
      playerX = newX;
      playerY = newY;
      drawMaze();
      
      if (playerX === goalX && playerY === goalY) {
        alert('🎉 ¡Ganaste! Has encontrado el volcán 🌋');
        // Reiniciar posición
        playerX = 1;
        playerY = 1;
        drawMaze();
      }
    }
  }
  
  // Eventos de teclado
  const handleKeyDown = (e) => {
    switch(e.key) {
      case 'ArrowUp': e.preventDefault(); movePlayer(0, -1); break;
      case 'ArrowDown': e.preventDefault(); movePlayer(0, 1); break;
      case 'ArrowLeft': e.preventDefault(); movePlayer(-1, 0); break;
      case 'ArrowRight': e.preventDefault(); movePlayer(1, 0); break;
    }
  };
  
  // Remover event listener anterior si existe
  document.removeEventListener('keydown', handleKeyDown);
  document.addEventListener('keydown', handleKeyDown);
  
  drawMaze();
}

// ===== FUNCIÓN RULETA =====
function girarRuleta() {
  const resultado = document.getElementById('resultadoRuleta');
  if (!resultado) return;
  
  const randomIndex = Math.floor(Math.random() * lugaresRuleta.length);
  resultado.textContent = `🎉 ¡Has ganado: ${lugaresRuleta[randomIndex]}! 🎉`;
  resultado.style.color = '#00a896';
  resultado.style.fontWeight = 'bold';
  resultado.style.fontSize = '1.2rem';
}

// ===== JUEGO DE MEMORIA =====
let memoryCards = [];
let flippedCards = [];
let matchedPairs = 0;

function iniciarMemoria() {
  const grid = document.querySelector('.card-grid');
  if (!grid) return;
  
  const emojis = ['🌋', '🌊', '🏝️', '🍽️', '🦎', '🌴'];
  const cards = [...emojis, ...emojis];
  
  // Barajar
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  
  memoryCards = cards;
  flippedCards = [];
  matchedPairs = 0;
  
  grid.innerHTML = '';
  cards.forEach((emoji, index) => {
    const card = document.createElement('div');
    card.className = 'memory-card';
    card.dataset.index = index;
    card.dataset.emoji = emoji;
    card.textContent = '❓';
    card.style.fontSize = '2rem';
    card.style.cursor = 'pointer';
    card.style.transition = 'all 0.3s';
    card.addEventListener('click', () => voltearCarta(card));
    grid.appendChild(card);
  });
}

function voltearCarta(card) {
  if (flippedCards.length >= 2) return;
  if (card.textContent !== '❓') return;
  if (flippedCards.includes(card)) return;
  
  card.textContent = card.dataset.emoji;
  card.style.transform = 'rotateY(180deg)';
  flippedCards.push(card);
  
  if (flippedCards.length === 2) {
    setTimeout(() => {
      const card1 = flippedCards[0];
      const card2 = flippedCards[1];
      
      if (card1.dataset.emoji === card2.dataset.emoji) {
        card1.style.background = '#48bb78';
        card2.style.background = '#48bb78';
        matchedPairs++;
        
        if (matchedPairs === 6) {
          setTimeout(() => {
            alert('🎉 ¡Felicidades! Has encontrado todas las parejas');
          }, 300);
        }
      } else {
        card1.textContent = '❓';
        card2.textContent = '❓';
        card1.style.transform = '';
        card2.style.transform = '';
      }
      
      flippedCards = [];
    }, 800);
  }
}

// ===== INICIALIZAR JUEGOS ESPECÍFICOS =====
document.addEventListener('DOMContentLoaded', () => {
  // Si hay un grid de memoria en la página, iniciar el juego
  if (document.querySelector('.card-grid')) {
    iniciarMemoria();
  }
  
  // Si hay un botón de ruleta, agregar evento
  const ruletaBtn = document.getElementById('ruletaBtn');
  if (ruletaBtn) {
    ruletaBtn.addEventListener('click', girarRuleta);
  }
  
  // Iniciar laberinto si existe el canvas
  if (document.getElementById('mazeCanvas')) {
    setTimeout(iniciarLaberinto, 100);
  }
});

// Exportar funciones para uso en otros scripts
window.iniciarLaberinto = iniciarLaberinto;
window.girarRuleta = girarRuleta;
window.iniciarMemoria = iniciarMemoria;
