* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: 'Poppins', sans-serif;
    background: #F5F5F0;
    overflow-x: hidden;
}

.app-container {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
}

/* Header (sin cambios) */
.app-header {
    background: white;
    padding: 12px 25px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 15px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    z-index: 100;
}

.logo {
    display: flex;
    align-items: center;
    gap: 10px;
}

.logo i {
    font-size: 28px;
    color: #F57C00;
}

.logo h2 {
    color: #2E7D32;
    font-size: 20px;
}

.header-controls {
    display: flex;
    align-items: center;
    gap: 15px;
}

.icon-btn, .admin-login-btn {
    background: none;
    border: none;
    font-size: 20px;
    cursor: pointer;
    padding: 8px;
    border-radius: 50%;
    transition: all 0.3s;
    color: #666;
}

.icon-btn:hover, .admin-login-btn:hover {
    background: #f0f0f0;
    color: #F57C00;
}

.admin-login-btn {
    background: #2E7D32;
    color: white;
    border-radius: 30px;
    padding: 6px 15px;
    font-size: 14px;
}

.admin-panel-header {
    display: flex;
    align-items: center;
    gap: 10px;
    background: #FFF3E0;
    padding: 5px 15px;
    border-radius: 30px;
    color: #F57C00;
}

.hidden {
    display: none !important;
}

/* Layout principal */
.main-content {
    display: flex;
    flex-wrap: wrap;
    flex: 1;
}

.sidebar {
    width: 320px;
    background: white;
    padding: 20px;
    overflow-y: auto;
    box-shadow: 2px 0 10px rgba(0,0,0,0.05);
    height: calc(100vh - 70px);
}

.map-container {
    flex: 1;
    position: relative;
    height: calc(100vh - 70px);
    min-height: 400px;
}

#map {
    width: 100%;
    height: 100%;
    background: #e0e0e0; /* mientras carga, se ve gris */
}

/* RESPONSIVE PARA MÓVIL */
@media (max-width: 768px) {
    .sidebar {
        width: 100%;
        height: auto;
        max-height: 40vh;
        order: 2;
    }
    .map-container {
        height: 60vh;   /* usar altura relativa */
        min-height: 300px;
        order: 1;
    }
    /* Forzar altura explícita en el mapa para Leaflet */
    #map {
        height: 100% !important;
        width: 100% !important;
    }
    .main-content {
        flex-direction: column;
    }
}

/* Resto de estilos (categorías, place-card, modales, dark mode, etc.) */
/* ... mantener igual que antes ... */
