const gameTitle = document.getElementById("gameTitle");

    gameContent.innerHTML = `
      <h3>Encuentra las parejas</h3>

      <div class="card-grid">
        <div class="memory-card">🌋</div>
        <div class="memory-card">🌊</div>
        <div class="memory-card">🌋</div>
        <div class="memory-card">🍽️</div>
        <div class="memory-card">🌊</div>
        <div class="memory-card">🏝️</div>
        <div class="memory-card">🍽️</div>
        <div class="memory-card">🏝️</div>
      </div>
    `;

  }

  else if(nombre === "Laberinto") {

    gameContent.innerHTML = `
      <h3>Encuentra el volcán 🌋</h3>

      <p>
        Usa las flechas del teclado para mover al explorador.
      </p>

      <canvas id="mazeCanvas" width="300" height="300" style="background:white; border-radius:15px; margin-top:20px;"></canvas>
    `;

    iniciarLaberinto();

  }

}

function respuestaTrivia(respuesta) {

  if(respuesta === "Vigorón") {
    alert("✅ Correcto");
  }

  else {
    alert("❌ Incorrecto");
  }

}

function girarRuleta() {

  const resultado = document.getElementById("resultadoRuleta");

  const lugar = lugaresRuleta
