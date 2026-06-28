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
  else if (nombreLower.includes('pinoleromillonario') || nombreLower.includes('pinolero millonario') || nombreLower.includes('millonario')) {
    // Juego: Pinolero Millonario
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
}