// sw.js - Service Worker para inyectar el traductor automáticamente
const CACHE_NAME = 'guia-pinolero-v1';

// HTML del widget traductor que se inyectará
const TRADUCTOR_WIDGET = `
    <!-- Widget de Google Translate -->
    <div id="google_translate_widget" style="position: fixed; bottom: 20px; right: 20px; z-index: 9999; background: white; padding: 10px 15px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.2); font-family: Arial, sans-serif;">
        <div style="display: flex; align-items: center; gap: 10px;">
            <span style="font-size: 20px;">🌐</span>
            <div id="google_translate_element"></div>
        </div>
    </div>
    
    <style>
        /* Estilos para el traductor */
        .goog-te-combo {
            padding: 6px 12px;
            border-radius: 6px;
            border: 1px solid #ddd;
            background: white;
            cursor: pointer;
            font-size: 13px;
        }
        
        .goog-te-gadget {
            font-family: Arial, sans-serif;
        }
        
        /* Ocultar el banner de Google */
        .goog-te-banner-frame {
            display: none !important;
        }
        
        body {
            top: 0px !important;
        }
        
        /* Animación de entrada */
        @keyframes slideInRight {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        #google_translate_widget {
            animation: slideInRight 0.5s ease-out;
        }
        
        /* Hover effect */
        #google_translate_widget:hover {
            transform: scale(1.02);
            transition: transform 0.3s ease;
        }
    </style>
    
    <!-- Script de inicialización -->
    <script type="text/javascript">
        // Función que inicializa Google Translate
        function googleTranslateElementInit() {
            new google.translate.TranslateElement({
                pageLanguage: 'es',
                includedLanguages: 'en,fr,de,pt,it,ja,zh-CN,ru,ko',
                layout: google.translate.TranslateElement.InlineLayout.SIMPLE,
                autoDisplay: false
            }, 'google_translate_element');
        }
        
        // Cargar el script de Google Translate si no existe
        if (!document.querySelector('script[src*="translate.google.com"]')) {
            var script = document.createElement('script');
            script.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
            script.async = true;
            document.head.appendChild(script);
        }
        
        // Guardar preferencia de idioma en localStorage
        function guardarIdiomaPreferido() {
            setTimeout(function() {
                var select = document.querySelector('.goog-te-combo');
                if (select && select.value) {
                    localStorage.setItem('idiomaPreferido', select.value);
                }
            }, 1000);
        }
        
        // Cargar idioma preferido si existe
        function cargarIdiomaPreferido() {
            var idiomaGuardado = localStorage.getItem('idiomaPreferido');
            if (idiomaGuardado) {
                setTimeout(function() {
                    var select = document.querySelector('.goog-te-combo');
                    if (select && select.value !== idiomaGuardado) {
                        select.value = idiomaGuardado;
                        select.dispatchEvent(new Event('change'));
                    }
                }, 1500);
            }
        }
        
        // Observar cambios de idioma
        document.addEventListener('change', function(e) {
            if (e.target && e.target.className === 'goog-te-combo') {
                localStorage.setItem('idiomaPreferido', e.target.value);
            }
        });
        
        // Ejecutar cuando cargue la página
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', cargarIdiomaPreferido);
        } else {
            cargarIdiomaPreferido();
        }
        
        console.log('🌐 Widget traductor cargado automáticamente');
    </script>
`;

// Interceptar todas las peticiones HTML
self.addEventListener('fetch', event => {
    // Solo procesar peticiones de tipo navigation (páginas HTML)
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request).then(response => {
                // Obtener el HTML original
                return response.text().then(html => {
                    // Verificar si ya tiene el widget (evitar duplicados)
                    if (html.includes('google_translate_widget')) {
                        return new Response(html, {
                            headers: { 'Content-Type': 'text/html' }
                        });
                    }
                    
                    // Inyectar el widget antes de </body>
                    const modifiedHtml = html.replace('</body>', TRADUCTOR_WIDGET + '</body>');
                    
                    return new Response(modifiedHtml, {
                        status: response.status,
                        statusText: response.statusText,
                        headers: response.headers
                    });
                });
            }).catch(error => {
                console.error('Error al cargar la página:', error);
                return new Response('Error al cargar la página', { status: 500 });
            })
        );
    }
});

// Instalar el Service Worker
self.addEventListener('install', event => {
    console.log('✅ Service Worker instalado - Widget traductor activado');
    self.skipWaiting(); // Activar inmediatamente
});

// Activar el Service Worker
self.addEventListener('activate', event => {
    console.log('🚀 Service Worker activado - Todas las páginas tendrán traductor');
    event.waitUntil(clients.claim()); // Tomar control inmediato
});
