let map;

function initMap() {
    map = L.map('map').setView([12.8654, -85.2072], 8);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap'
    }).addTo(map);
    
    // Ajuste para móvil
    setTimeout(() => map.invalidateSize(true), 200);
    window.addEventListener('resize', () => map.invalidateSize(true));
}

document.addEventListener('DOMContentLoaded', initMap);
