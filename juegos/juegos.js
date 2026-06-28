// ================================================================
//  🎠 CARRUSEL DE JUEGOS - GUÍA PINOLERO (VERSIÓN CORREGIDA)
// ================================================================

document.addEventListener('DOMContentLoaded', function() {
  const track = document.querySelector('.carousel-track');
  const slides = document.querySelectorAll('.carousel-slide');
  const prevBtn = document.querySelector('.prev-btn');
  const nextBtn = document.querySelector('.next-btn');
  const dots = document.querySelectorAll('.indicator-dot');
  const playArea = document.querySelector('.play-area');
  const gameTitle = document.getElementById('gameTitle');
  const gameContent = document.getElementById('gameContent');

  // ===== VALIDAR QUE EXISTAN LOS ELEMENTOS =====
  if (!track) {
    console.error('❌ No se encontró el carrusel');
    return;
  }

  console.log(`✅ Encontradas ${slides.length} tarjetas`);

  let currentIndex = 0;
  let slidesPerView = getSlidesPerView();
  const totalSlides = slides.length;

  // ===== FUNCIÓN PARA CALCULAR CUÁNTAS TARJETAS SE VEN =====
  function getSlidesPerView() {
    if (window.innerWidth < 600) return 1;
    if (window.innerWidth < 900) return 2;
    return 3;
  }

  // ===== FUNCIÓN PARA ACTUALIZAR EL CARRUSEL (CORREGIDA) =====
  function updateCarousel() {
    if (totalSlides === 0) return;

    // ✅ Usar getBoundingClientRect para obtener el ancho REAL
    const firstSlide = slides[0];
    if (!firstSlide) return;
    
    const rect = firstSlide.getBoundingClientRect();
    const slideWidth = rect.width;
    const gap = 20; // Mismo gap que en CSS
    const offset = currentIndex * (slideWidth + gap);

    console.log(`📐 Ancho de tarjeta: ${slideWidth}px, offset: ${offset}px`);

    track.style.transition = 'transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
    track.style.transform = `translateX(-${offset}px)`;

    // Actualizar indicadores
    dots.forEach((dot, index) => {
      dot.classList.toggle('active', index === currentIndex);
    });

    // Mostrar/ocultar botones
    if (prevBtn) prevBtn.style.display = currentIndex === 0 ? 'none' : 'flex';
    if (nextBtn) {
      const maxIndex = Math.max(0, totalSlides - slidesPerView);
      nextBtn.style.display = currentIndex >= maxIndex ? 'none' : 'flex';
    }
  }

  // ===== SIGUIENTE =====
  function nextSlide() {
    console.log('➡️ Siguiente');
    const maxIndex = Math.max(0, totalSlides - slidesPerView);
    if (currentIndex < maxIndex) {
      currentIndex++;
      updateCarousel();
    } else {
      console.log('⚠️ Ya estás en la última tarjeta');
    }
  }

  // ===== ANTERIOR =====
  function prevSlide() {
    console.log('⬅️ Anterior');
    if (currentIndex > 0) {
      currentIndex--;
      updateCarousel();
    } else {
      console.log('⚠️ Ya estás en la primera tarjeta');
    }
  }

  // ===== IR A UN SLIDE ESPECÍFICO (por indicador) =====
  function goToSlide(index) {
    console.log(`🎯 Ir a la tarjeta ${index}`);
    const maxIndex = Math.max(0, totalSlides - slidesPerView);
    if (index >= 0 && index <= maxIndex) {
      currentIndex = index;
      updateCarousel();
    }
  }

  // ===== ASIGNAR EVENTOS A LOS BOTONES =====
  if (prevBtn) {
    prevBtn.addEventListener('click', function(e) {
      e.preventDefault();
      prevSlide();
    });
    console.log('✅ Botón "Anterior" asignado');
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', function(e) {
      e.preventDefault();
      nextSlide();
    });
    console.log('✅ Botón "Siguiente" asignado');
  }

  // ===== ASIGNAR EVENTOS A LOS INDICADORES =====
  dots.forEach((dot, index) => {
    dot.addEventListener('click', function(e) {
      e.preventDefault();
      goToSlide(index);
    });
  });

  // ===== RECALCULAR AL CAMBIAR EL TAMAÑO DE LA VENTANA =====
  let resizeTimeout;
  window.addEventListener('resize', function() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      const newSlidesPerView = getSlidesPerView();
      if (newSlidesPerView !== slidesPerView) {
        slidesPerView = newSlidesPerView;
        const maxIndex = Math.max(0, totalSlides - slidesPerView);
        if (currentIndex > maxIndex) {
          currentIndex = maxIndex;
        }
        updateCarousel();
        console.log(`🔄 Vista cambiada a: ${slidesPerView} tarjetas`);
      }
    }, 250);
  });

  // ===== INICIALIZAR =====
  setTimeout(() => {
    slidesPerView = getSlidesPerView();
    updateCarousel();
    console.log(`🎠 Carrusel inicializado: ${totalSlides} tarjetas, ${slidesPerView} por vista`);
  }, 300);

  // ================================================================
  //  🎯 CARGA DE JUEGOS AL HACER CLIC
  // ================================================================

  // ===== FUNCIÓN PARA CARGAR JUEGO =====
  function cargarJuego(nombre, icono, descripcion, url) {
    if (gameTitle) {
      gameTitle.textContent = `🎯 ${nombre}`;
    }

    if (gameContent) {
      // Limpiar contenido anterior
      gameContent.innerHTML = '';

      const nombreLower = nombre.toLowerCase();

      // ===== PINOLERO MILLONARIO =====
      if (nombreLower.includes('pinoleromillonario') || nombreLower.includes('pinolero millonario') || nombreLower.includes(
          'millonario')) {
        gameContent.innerHTML = `
          <div style="padding: 1.5rem;">
            <div style="font-size: 4rem; margin-bottom: 1rem;">🏆</div>
            <h3 style="font-family: 'Fredoka', sans-serif; font-size: 1.5rem; color: #028090;">Pinolero Millonario</h3>
            <p style="color: #64748b; margin: 0.5rem 0 1.5rem;">${descripcion}</p>
            <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; margin: 1rem 0;">
              <span style="background: #fef9e8; padding: 0.5rem 1rem; border-radius: 12px; border: 2px solid #ffd700;">💰</span>
              <span style="background: #fef9e8; padding: 0.5rem 1rem; border-radius: 12px; border: 2px solid #ffd700;">🎯</span>
              <span style="background: #fef9e8; padding: 0.5rem 1rem; border-radius: 12px; border: 2px solid #ffd700;">🏅</span>
            </div>
            <a href="${url}" class="btn" style="display: inline-block; text-decoration: none; color: white; padding: 0.8rem 2.5rem; border-radius: 50px; background: linear-gradient(135deg, #ffd700, #f0a500); font-weight: 600; transition: all 0.3s; box-shadow: 0 4px 15px rgba(255,215,0,0.4); margin-top: 1rem;">
              🚀 Jugar Ahora
            </a>
          </div>
        `;
      }
      // ===== MAPA MISTERIOSO =====
      else if (nombreLower.includes('mapa misterioso') || nombreLower.includes('mapamisterioso')) {
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
      // ===== STOPINOLERO =====
      else if (nombreLower.includes('stopinolero')) {
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
      // ===== MEMORIA =====
      else if (nombreLower.includes('memoria') || nombreLower.includes('pareja')) {
        gameContent.innerHTML = `
          <div style="padding: 1.5rem;">
            <div style="font-size: 4rem; margin-bottom: 1rem;">🃏</div>
            <h3 style="font-family: 'Fredoka', sans-serif; font-size: 1.5rem; color: #028090;">Memoria de Cartas</h3>
            <p style="color: #64748b; margin: 0.5rem 0 1.5rem;">${descripcion}</p>
            <a href="${url}" class="btn" style="display: inline-block; text-decoration: none; color: white; padding: 0.8rem 2.5rem; border-radius: 50px; background: linear-gradient(135deg, #00a896, #028090); font-weight: 600; transition: all 0.3s; box-shadow: 0 4px 15px rgba(0,168,150,0.3); margin-top: 1rem;">
              🚀 Jugar Ahora
            </a>
          </div>
        `;
      }
      // ===== ORDENA PALABRA =====
      else if (nombreLower.includes('ordena') || nombreLower.includes('palabra')) {
        gameContent.innerHTML = `
          <div style="padding: 1.5rem;">
            <div style="font-size: 4rem; margin-bottom: 1rem;">🔤</div>
            <h3 style="font-family: 'Fredoka', sans-serif; font-size: 1.5rem; color: #028090;">Ordena la Palabra</h3>
            <p style="color: #64748b; margin: 0.5rem 0 1.5rem;">${descripcion}</p>
            <a href="${url}" class="btn" style="display: inline-block; text-decoration: none; color: white; padding: 0.8rem 2.5rem; border-radius: 50px; background: linear-gradient(135deg, #00a896, #028090); font-weight: 600; transition: all 0.3s; box-shadow: 0 4px 15px rgba(0,168,150,0.3); margin-top: 1rem;">
              🚀 Jugar Ahora
            </a>
          </div>
        `;
      }
      // ===== LABERINTO =====
      else if (nombreLower.includes('laberinto')) {
        gameContent.innerHTML = `
          <div style="padding: 1.5rem;">
            <div style="font-size: 4rem; margin-bottom: 1rem;">🌋</div>
            <h3 style="font-family: 'Fredoka', sans-serif; font-size: 1.5rem; color: #028090;">Laberinto</h3>
            <p style="color: #64748b; margin: 0.5rem 0 1.5rem;">${descripcion}</p>
            <a href="${url}" class="btn" style="display: inline-block; text-decoration: none; color: white; padding: 0.8rem 2.5rem; border-radius: 50px; background: linear-gradient(135deg, #00a896, #028090); font-weight: 600; transition: all 0.3s; box-shadow: 0 4px 15px rgba(0,168,150,0.3); margin-top: 1rem;">
              🚀 Jugar Ahora
            </a>
          </div>
        `;
      }
      // ===== VARIOS / SOPA =====
      else if (nombreLower.includes('varios') || nombreLower.includes('sopa')) {
        gameContent.innerHTML = `
          <div style="padding: 1.5rem;">
            <div style="font-size: 4rem; margin-bottom: 1rem;">🧩</div>
            <h3 style="font-family: 'Fredoka', sans-serif; font-size: 1.5rem; color: #028090;">Varios - Sopa de Letras</h3>
            <p style="color: #64748b; margin: 0.5rem 0 1.5rem;">${descripcion}</p>
            <a href="${url}" class="btn" style="display: inline-block; text-decoration: none; color: white; padding: 0.8rem 2.5rem; border-radius: 50px; background: linear-gradient(135deg, #00a896, #028090); font-weight: 600; transition: all 0.3s; box-shadow: 0 4px 15px rgba(0,168,150,0.3); margin-top: 1rem;">
              🚀 Jugar Ahora
            </a>
          </div>
        `;
      }
      // ===== FALLBACK =====
      else {
        gameContent.innerHTML = `
          <div style="padding: 1.5rem; text-align: center;">
            <div style="font-size: 4rem; margin-bottom: 1rem;">🎮</div>
            <h3 style="font-family: 'Fredoka', sans-serif; font-size: 1.5rem; color: #028090;">${nombre}</h3>
            <p style="color: #64748b; margin: 0.5rem 0 1.5rem;">${descripcion}</p>
            <a href="${url}" class="btn" style="display: inline-block; text-decoration: none; color: white; padding: 0.8rem 2.5rem; border-radius: 50px; background: linear-gradient(135deg, #00a896, #028090); font-weight: 600; transition: all 0.3s; box-shadow: 0 4px 15px rgba(0,168,150,0.3); margin-top: 1rem;">
              🚀 Jugar Ahora
            </a>
          </div>
        `;
      }
    }
  }

  // ===== ASIGNAR EVENTO DE CLIC A LAS TARJETAS =====
  slides.forEach((slide) => {
    slide.addEventListener('click', function() {
      const url = this.dataset.url;
      const nombre = this.querySelector('h3')?.textContent || 'Juego';
      const icono = this.querySelector('.slide-icon')?.textContent || '🎮';
      const descripcion = this.querySelector('p')?.textContent || 'Diviértete aprendiendo sobre Nicaragua';

      // Redirigir si es un enlace externo
      if (url && url.endsWith('.html')) {
        // Si es Pinolero Millonario, redirige
        if (nombre.toLowerCase().includes('millonario')) {
          window.location.href = url;
          return;
        }
        // Si no, carga en el área de juego
        cargarJuego(nombre, icono, descripcion, url);
      } else {
        cargarJuego(nombre, icono, descripcion, url);
      }
    });
  });

  console.log('✅ Guía Pinolero - Juegos cargados correctamente');
});