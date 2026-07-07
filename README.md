# Código Pinolero - Guía Pinolera

¡Bienvenidos al repositorio oficial! Esta plataforma fue desarrollada como nuestra solución para el mercado turístico de Nicaragua donde no es una aplicación estática como la mayoría de guías turistica sino una aplicación llena de dinamismo, aprendizaje e interactividad. 

Nuestra propuesta de valor se resume en una frase: "Explora Nicaragua jugando"

El enfoque principal es ofrecer una herramienta robusta, segura y fácil de usar, atacando directamente la problemática identificada en nuestra investigación.

---

##  Arquitectura y Estructura del Proyecto

Para que el sistema sea fácil de mantener y escalar, organizamos el código de manera modular. Separamos las responsabilidades para que el backend (lógica y datos) y el frontend (interfaz de usuario) trabajen de forma independiente y fluida.

La estructura general del código está distribuida así:
* css: Donde se la apariencia de las paginas principales
*departamentos: Almacena todos los html, css y js de los lugares principales de nicaragua ubicados en el mapa.
*js: guarda la configuracion de las paginas principales para su funcionamiento, ella incluye el uso o la conexión con la base de datos.
*Juegos: Aloja los juegos y sus configuraciones correspondientes y estilos a usar en cada una de las paginas.
*visitas: basado en el alojamiento de las paginas relacionadas a los lugares que estan configurados en las visitas virtuales asi como sus directorio para el almacenamiento de las imagenes que hacen posible esta función

---

## 🔌 Dependencias del Sistema

Para levantar este proyecto de forma óptima, nos apoyamos en herramientas modernas que garantizan rendimiento y estabilidad. Asegúrate de tener instalado **Node.js** en tu equipo antes de iniciar.

### Tecnologías Principales:
**Frontend / Interfaz:** Vanilla JavaScript / HTML5 / CSS3 (Estructura responsiva y adaptable).
**Base de Datos y Backend:** Supabase (Manejo de datos en tiempo real y autenticación).
**Alojamiento / Hosting:** Netlify (Despliegue continuo en producción).

---

## 🔑 Variables de Entorno 

El sistema requiere conectarse de forma segura a los servicios externos. Para evitar exponer credenciales en el repositorio, creamos un archivo local llamado `.env` en la raíz del proyecto con la siguiente estructura:

``env

    const firebaseConfig = {
      apiKey: " El api de firebase
      authDomain: "El dominio que se crea
      projectId:  la identidad del proyecto
      storageBucket: 
      messagingSenderId:
      appId: "
    };
