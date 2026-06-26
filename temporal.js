  // ---------- JUEGO GEOMETRY DASH LIGHT (Runner con saltos) ----------
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');

  // dimensiones fijas logicas 800x220
  const CANVAS_W = 800;
  const CANVAS_H = 220;
  canvas.width = CANVAS_W;
  canvas.height = CANVAS_H;

  // Jugador
  const PLAYER_WIDTH = 16;
  const PLAYER_HEIGHT = 16;
  const PLAYER_FIXED_X = 85;
  let playerY = CANVAS_H - 40 - PLAYER_HEIGHT;
  let playerVy = 0;
  let isOnGround = true;
  const GRAVITY = 0.7;
  const JUMP_POWER = -9.2;
  const GROUND_Y = CANVAS_H - 28;  // base del suelo visual

  // Obstáculos
  let obstacles = [];
  const OBSTACLE_W = 14;
  const OBSTACLE_H = 20;
  let frameCounter = 0;
  let spawnGap = 70; // frames entre spawns
  let gameSpeed = 4.2;
  let score = 0;
  let highScore = localStorage.getItem('nicaGeoDash') ? parseInt(localStorage.getItem('nicaGeoDash')) : 0;
  let gameOver = false;
  let animationId = null;
  
  // UI elements
  const scoreSpan = document.getElementById('scoreValue');
  const highScoreSpan = document.getElementById('highScoreValue');
  highScoreSpan.innerText = highScore;

  // Función para reiniciar el juego
  function restartGame() {
    gameOver = false;
    score = 0;
    updateScoreUI();
    obstacles = [];
    frameCounter = 0;
    playerY = GROUND_Y - PLAYER_HEIGHT;
    playerVy = 0;
    isOnGround = true;
    gameSpeed = 4.2;
  }

  function updateScoreUI() {
    scoreSpan.innerText = Math.floor(score);
    if (score > highScore) {
      highScore = Math.floor(score);
      highScoreSpan.innerText = highScore;
      localStorage.setItem('nicaGeoDash', highScore);
    }
  }

  // Lógica de salto
  function jump() {
    if (gameOver) return;
    // solo saltar si está en el suelo (margen pequeño)
    if (playerY + PLAYER_HEIGHT >= GROUND_Y - 1 && playerVy >= -0.5) {
      playerVy = JUMP_POWER;
      isOnGround = false;
    }
  }

  // Actualizar física y colisiones
  function updateGame() {
    if (gameOver) return;

    // 1. Física jugador
    playerVy += GRAVITY;
    playerY += playerVy;
    // colisión suelo
    if (playerY + PLAYER_HEIGHT >= GROUND_Y) {
      playerY = GROUND_Y - PLAYER_HEIGHT;
      playerVy = 0;
      isOnGround = true;
    }
    if (playerY < 0) {
      playerY = 0;
      if (playerVy < 0) playerVy = 0;
    }

    // 2. Spawn obstáculos
    if (frameCounter >= spawnGap) {
      frameCounter = 0;
      // dificultad dinámica: gap aleatorio entre 65 y 95 según score
      let newGap = Math.max(50, 75 - Math.floor(score / 400));
      spawnGap = Math.floor(Math.random() * 25) + newGap;
      obstacles.push({
        x: CANVAS_W,
        y: GROUND_Y - OBSTACLE_H,
        width: OBSTACLE_W,
        height: OBSTACLE_H
      });
    } else {
      frameCounter++;
    }

    // 3. Mover obstáculos & colisiones
    for (let i = 0; i < obstacles.length; i++) {
      obstacles[i].x -= gameSpeed;
      // Aumentar velocidad gradual con puntaje (máximo 8.5)
      if (!gameOver) gameSpeed = Math.min(8.2, 4.2 + Math.floor(score / 800));
    }
    // eliminar fuera de pantalla y sumar puntos al pasar (cuando x + ancho < playerX)
    obstacles = obstacles.filter(obs => {
      if (obs.x + obs.width < 0) return false;
      if (obs.x + obs.width < PLAYER_FIXED_X && !obs.counted) {
        // punto por obstáculo esquivado
        obs.counted = true;
        score += 10;
        updateScoreUI();
      }
      return true;
    });

    // Colisión AABB
    const playerRect = {
      x: PLAYER_FIXED_X,
      y: playerY,
      w: PLAYER_WIDTH,
      h: PLAYER_HEIGHT
    };
    for (let obs of obstacles) {
      const obsRect = {
        x: obs.x,
        y: obs.y,
        w: obs.width,
        h: obs.height
      };
      if (playerRect.x < obsRect.x + obsRect.w &&
          playerRect.x + playerRect.w > obsRect.x &&
          playerRect.y < obsRect.y + obsRect.h &&
          playerRect.y + playerRect.h > obsRect.y) {
        gameOver = true;
        break;
      }
    }

    // incremento de score por tiempo cada frame (para dar ritmo)
    if (!gameOver) {
      score += 0.2;
      updateScoreUI();
    }
  }

  // Dibujo completo con estilo Geometry Dash + Nicaragua
  function draw() {
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
    // Cielo degradado tropical
    const gradSky = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
    gradSky.addColorStop(0, "#1b3b2f");
    gradSky.addColorStop(0.7, "#4a2e1a");
    ctx.fillStyle = gradSky;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    
    // Suelo volcánico con textura
    ctx.fillStyle = "#754c24";
    ctx.fillRect(0, GROUND_Y, CANVAS_W, CANVAS_H - GROUND_Y + 5);
    ctx.fillStyle = "#b97f44";
    for(let i=0; i<12; i++) {
      ctx.fillRect(i*70, GROUND_Y-3, 30, 5);
    }
    ctx.fillStyle = "#e6a157";
    ctx.fillRect(0, GROUND_Y-2, CANVAS_W, 3);
    
    // Obstáculos (rocas / cactus volcánicos)
    for (let obs of obstacles) {
      ctx.shadowBlur = 0;
      ctx.fillStyle = "#f5561e";
      ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
      ctx.fillStyle = "#b3310c";
      ctx.fillRect(obs.x+3, obs.y-4, obs.width-6, 6);
      ctx.fillStyle = "#ff9f4a";
      ctx.fillRect(obs.x+5, obs.y+5, 4, 8);
    }
    
    // Jugador (personaje ágil tipo geometría)
    ctx.shadowBlur = 4;
    ctx.shadowColor = "gold";
    ctx.fillStyle = "#FFD966";
    ctx.fillRect(PLAYER_FIXED_X, playerY, PLAYER_WIDTH, PLAYER_HEIGHT);
    ctx.fillStyle = "#f09c2c";
    ctx.fillRect(PLAYER_FIXED_X+3, playerY+3, 4, 4);
    ctx.fillStyle = "#2c1c0c";
    ctx.fillRect(PLAYER_FIXED_X+10, playerY+8, 4, 6);
    ctx.fillStyle = "white";
    ctx.fillRect(PLAYER_FIXED_X+12, playerY+4, 2, 2);
    ctx.shadowBlur = 0;
    
    // efecto líneas velocidad
    if (!gameOver && gameSpeed > 5) {
      ctx.beginPath();
      for(let i=0;i<10;i++) {
        ctx.moveTo(CANVAS_W - (frameCounter*2 + i*30) % CANVAS_W, GROUND_Y-8);
        ctx.lineTo(CANVAS_W - (frameCounter*2 + i*30) % CANVAS_W + 15, GROUND_Y-15);
        ctx.strokeStyle = "#FFB34755";
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    }
    
    // Mensaje game over
    if (gameOver) {
      ctx.font = "bold 26px 'Segoe UI', system-ui";
      ctx.fillStyle = "#FFE484";
      ctx.shadowBlur = 0;
      ctx.fillText("🔥 GAME OVER 🔥", CANVAS_W/2-110, 70);
      ctx.font = "14px monospace";
      ctx.fillStyle = "#f7bd7a";
      ctx.fillText("Presiona 'REINICIAR' para seguir explorando", CANVAS_W/2-150, 110);
    }
    
    // score en canvas
    ctx.font = "bold 20monospace";
    ctx.fillStyle = "#FFF0b5";
    ctx.fillText(`SCORE: ${Math.floor(score)}`, CANVAS_W-110, 30);
  }
  
  // Game Loop
  function gameLoop() {
    if (!gameOver) {
      updateGame();
    }
    draw();
    animationId = requestAnimationFrame(gameLoop);
  }
  
  // eventos de salto (espacio, click canvas, botón)
  function handleJump(e) {
    // Prevenir si estamos escribiendo en chat
    if (document.activeElement && document.activeElement.id === 'chatInput') return;
    jump();
  }
  
  function initGameEvents() {
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        handleJump();
      }
    });
    canvas.addEventListener('click', (e) => {
      e.preventDefault();
      handleJump();
    });
    canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      handleJump();
    });
    document.getElementById('jumpBtn').addEventListener('click', () => jump());
    document.getElementById('restartGameBtn').addEventListener('click', () => {
      restartGame();
    });
  }
  
  // Inicializar juego
  restartGame();
  initGameEvents();
  gameLoop();
  
  // ---------- CHAT "ANTES DE CONSTRUIR" (Respuestas temáticas Nicaragua)----------
  const chatMessagesDiv = document.getElementById('chatMessages');
  const chatInput = document.getElementById('chatInput');
  const sendBtn = document.getElementById('sendChatBtn');
  
  // Respuestas inteligentes y divertidas
  function getBotResponse(userMessage) {
    const msg = userMessage.toLowerCase().trim();
    if (msg.includes('volcán') || msg.includes('volcan')) {
      return "🌋 ¡Nicaragua tiene más de 19 volcanes! El Cerro Negro es ideal para sandboard. Pronto tendremos tours virtuales. 🏂";
    } else if (msg.includes('lago') || msg.includes('lagos')) {
      return "💧 Lago Cocibolca (Nicaragua) es el más grande de Centroamérica. ¡Y tiene tiburones de agua dulce! Increíble 🦈";
    } else if (msg.includes('playa') || msg.includes('san juan')) {
      return "🏖️ San Juan del Sur es un paraíso para el surf. Estamos construyendo la guía de olas secretas 🌊🏄‍♂️";
    } else if (msg.includes('comida') || msg.includes('gallopinto')) {
      return "🍛 ¡El gallo pinto es el rey! Nacatamales, quesillo y vigorón. Pronto tendremos mapa gastronómico. 🫔";
    } else if (msg.includes('juego') || msg.includes('dash')) {
      return "🎮 El juego GeoDash Volcán Run te pone a saltar obstáculos. ¡Pulsa espacio o toca la pantalla! Lleva tu récord.";
    } else if (msg.includes('construcción') || msg.includes('sitio')) {
      return "🚧 Estamos en fase de construcción creativa. El chat es un adelanto interactivo. ¡Gracias por tu paciencia! 🦜";
    } else if (msg.includes('hola') || msg.includes('buenas')) {
      return "👋 ¡Hola! Bienvenido a Nicaragua en desarrollo. Pregúntame sobre naturaleza, cultura o tips de viaje.";
    } else {
      return "✨ ¡Excelente pregunta! Estamos puliendo los detalles. Mientras tanto, juega y mantén el espíritu aventurero. ¿Te gustan los volcanes o las playas?";
    }
  }
  
  function addMessage(sender, text, isUser = false) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${isUser ? 'user-msg' : 'bot-msg'}`;
    const bubble = document.createElement('div');
    bubble.className = 'bubble';
    bubble.innerText = text;
    msgDiv.appendChild(bubble);
    chatMessagesDiv.appendChild(msgDiv);
    chatMessagesDiv.scrollTop = chatMessagesDiv.scrollHeight;
  }
  
  function sendUserMessage() {
    const text = chatInput.value.trim();
    if (text === "") return;
    addMessage("Usuario", text, true);
    chatInput.value = "";
    // simular respuesta del bot después de breve pausa
    setTimeout(() => {
      const reply = getBotResponse(text);
      addMessage("Asistente", reply, false);
    }, 300);
  }
  
  sendBtn.addEventListener('click', sendUserMessage);
  chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      sendUserMessage();
    }
  });
  
  // mensaje extra de bienvenida personalizada
  setTimeout(() => {
    addMessage("Asistente", "🌿 ¡Recuerda! Nuestro juego se reinicia con el botón. Supera tu puntuación y celebra Nicaragua. 🇳🇮", false);
  }, 1800);
  
  // Para evitar que el salto se active mientras escribes en chat (ya se controla con activeElement)
  // partículas dinámicas extra (solo estético)
  for(let i=0;i<35;i++) {
    let particle = document.createElement('div');
    particle.classList.add('particle');
    let size = Math.random() * 5 + 2;
    particle.style.width = size+'px';
    particle.style.height = size+'px';
    particle.style.left = Math.random()*100+'%';
    particle.style.animationDuration = Math.random()*8+5+'s';
    particle.style.animationDelay = Math.random()*10+'s';
    document.querySelector('.bg-animation').appendChild(particle);
  }
