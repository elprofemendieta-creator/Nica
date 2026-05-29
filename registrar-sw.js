// registrar-sw.js - Registra el Service Worker
(function() {
    // Verificar si el navegador soporta Service Workers
    if ('serviceWorker' in navigator) {
        // Esperar a que la página cargue completamente
        window.addEventListener('load', function() {
            navigator.serviceWorker.register('/sw.js')
                .then(function(registration) {
                    console.log('✅ Service Worker registrado exitosamente');
                    console.log('📡 Alcance:', registration.scope);
                    
                    // Verificar si hay actualizaciones
                    registration.addEventListener('updatefound', function() {
                        const newWorker = registration.installing;
                        console.log('🔄 Nueva versión del Service Worker encontrada');
                        
                        newWorker.addEventListener('statechange', function() {
                            if (newWorker.state === 'activated') {
                                console.log('✅ Nueva versión activada');
                                window.location.reload();
                            }
                        });
                    });
                })
                .catch(function(error) {
                    console.log('❌ Error al registrar Service Worker:', error);
                });
        });
        
        // Escuchar mensajes del Service Worker
        navigator.serviceWorker.addEventListener('message', function(event) {
            console.log('Mensaje del Service Worker:', event.data);
        });
    } else {
        console.warn('⚠️ Tu navegador no soporta Service Workers');
        // Fallback: mostrar widget tradicional
        cargarWidgetTradicional();
    }
    
    // Fallback para navegadores antiguos
    function cargarWidgetTradicional() {
        var widgetHTML = `
            <div id="google_translate_fallback" style="position: fixed; bottom: 20px; right: 20px; z-index: 9999; background: white; padding: 10px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                <div id="google_translate_element"></div>
            </div>
            <script src="//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"><\/script>
            <script>
                function googleTranslateElementInit() {
                    new google.translate.TranslateElement({pageLanguage: 'es'}, 'google_translate_element');
                }
            <\/script>
        `;
        document.body.insertAdjacentHTML('beforeend', widgetHTML);
    }
})();
