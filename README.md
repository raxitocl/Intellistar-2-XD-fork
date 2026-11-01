# IntelliStar 2 XD Emulator (Fork Modernizado)

Aplicación web y de escritorio que emula la presentación gráfica y sonora del segmento "Local on the 8s" transmitido por **The Weather Channel** utilizando las unidades [IntelliStar 2 XD](https://en.wikipedia.org/wiki/IntelliStar2) (estilo gráfico 2019+).

## ¡Puedes verlo en acción aca! -> https://raxitocl.github.io/Intellistar-2-XD-fork/

---

## 📝 Registro de Actualizaciones (Changelog)

### [Cambios / Nuevas funciones / Changelog]

- **Estabilización de Runtime, Blindaje de Servidor y Correcciones de Auditoría:**
  - **Servidor HTTP Local Robusto (`server.js`):** Protección con `try...catch` en `decodeURIComponent` frente a ataques o caídas por caracteres corruptos (código 400), verificación física previa de archivos en streams para evitar excepciones `ENOENT` en directorios sin `index.html` (código 403), sanitización contra XSS en páginas de error 404, soporte formal para fuentes tipográficas `.otf` en `MIME_TYPES`, y manejo controlado de puertos en escucha.
  - **Deduplicación de Atajos en Electron (`electron-main.js` y `Config.js`):** Supresión de la doble ejecución de `toggleSettings()` al presionar `F2` o `Ctrl+,` en Electron mediante canalización exclusiva por IPC y retorno de función de desuscripción de eventos en `preload.js`.
  - **Scripts de Windows `.bat`:** Inclusión de `cd /d "%~dp0"` en `iniciar-servidor.bat` e `iniciar-webapp.bat` para ejecución fiable desde cualquier acceso directo o ubicación en Windows 10 LTSC, con apertura coordinada del navegador tras el inicio del servidor.
  - **Restauración Tipográfica y Saneamiento de Assets:** Restitución de la auténtica fuente delgada `fonts/akkopro-thin.otf` (201 KB, firma OTTO) eliminando la copia duplicada y depurando archivos residuales o corruptos en `fonts/` y `assets/music/` (`1.wav`, `storm.wav`, `bgs/empty`).
  - **Normalización DOM y Cascada CSS:** Corrección de la clase dimensional `forecast-left` en `index.html:380`, asignación de `class="radar-container"` para contención de mapas, elevación de `z-index: 40` en `#amazing-container` y `#updated-container` para visibilidad garantizada al cierre, y ajuste de altura a 525px en `.almanac-content-container`.
  - **Corrección Física de Punto de Rocío y Resiliencia Meteorológica:** Bifurcación correcta de la fórmula de punto de rocío en `WeatherProviders.js` para Celsius (`/ 5`) vs. Fahrenheit (`* 0.36`), protección total ante arreglos vacíos en TWC y reintento automático cada 30 segundos ante cortes de conexión en `WeatherFetching.js`.
  - **Gestión de Memoria y Ciclo de Vida 24/7:** Reutilización limpia y destrucción previa de objetos `Audio` en `preLoadMusic()`, reactivación garantizada del carrusel `NationalTicker` tras el cierre de mapas de radar, destrucción estricta de instancias Leaflet en segundo plano (`activeZoomedRadarMap`), e inclusión de `almanac-page` en `resetVisualState()` para evitar solapamientos visuales en bucle continuo.
  - **Prevención de Recolección de Basura en Locución TTS:** Retención en memoria de la instancia `SpeechSynthesisUtterance` en `window._activeUtterance` para impedir que el motor V8 de Chromium/Electron destruya la voz a mitad de frase.

- **Nueva Pantalla de Almanaque Astronómico (`almanac-page` - 15 Segundos):**
  - Incorporación de la diapositiva oficial de almanaque situada entre el pronóstico extendido (`7day-page`) y la cabecera (`headend-id-page`), con duración de 15 segundos y representada en la línea de tiempo por el icono de calendario oficial `assets/timeline/calendar.svg`.
  - Estética 100% auténtica broadcast con celdas rectangulares planas `.shaded-page-content` (`rgba(0, 0, 0, 0.25)`), fondo opaco `#1a2634` (eliminando transparencias residuales con la diapositiva previa de 7 días), sin bordes redondeados modernos y sin badges artificiales de cápsula.
  - Bloque superior solar plano: amanecer y atardecer para hoy y mañana (Open-Meteo/TWC con respaldo solar NOAA de alta precisión) con tipografía televisiva nítida; y bloque inferior con franja horizontal de 4 celdas de fases lunares idénticas a las columnas de `.outlook-day` de 7 días (Luna Nueva, Cuarto Creciente, Luna Llena y Cuarto Menguante) con iconos vectoriales Meteocons Astronomical y fechas en texto plano calculadas mediante el algoritmo astronómico de Jean Meeus.
  - Locución vocal TTS concisa al ingreso (_"A continuación, el almanaque astronómico local para hoy y mañana"_ / _"Here is your local astronomical almanac"_), manteniendo el resto de los 15 segundos con la música ambiental de fondo.
  - Desacoplamiento estricto de transiciones: ocultamiento forzado de `7day-page` al entrar a `almanac-page` y retirada de `headend-id-page` y `almanac-page` antes de `showEnding()`, impidiendo cualquier superposición con `#ItsAmazingOutThere`.

- **Personalización del Logotipo del Proveedor en Pantalla de Cabecera:**
  - Nueva sección en el panel de configuración con selector de archivo de imagen local `.png` con fondo transparente y conversión automática a Base64 en `localStorage` (`customProviderLogo`).
  - Campo alternativo para URL directa, botón de restablecimiento inmediato y cuadro de vista previa en tiempo real con fondo cuadriculado de transparencia.
  - Tip informativo de diseño integrado: formato PNG transparente, resolución recomendada de **280×80 px a 350×120 px** (proporción 3:1 o 4:1) para nitidez óptima.
  - Renderizado automático y nítido en `#headend-id-page` mediante `#headend-provider-logo`.

- **Radar Dual Esri Libre por Defecto + Respaldo CARTO con Clave API:**
  - Mapa base predeterminado 100% público y libre de cuotas: **Esri World Dark Gray Base**, eliminando cualquier solicitud o bloqueo de claves API en el radar.
  - Respaldo oficial para CARTO: campo configurable `CARTO API Key` en Opciones Avanzadas; utiliza el parámetro oficial `?key=` (con respaldo `&api_key=`) eliminando de forma definitiva la marca de agua "API KEY REQUIRED", con conmutación tolerante a Esri en caso de fallo en los mosaicos (`tileerror`).
  - Capa Doppler en vivo de RainViewer combinada con capa superior de referencias y fronteras geográficas **Esri World Dark Gray Reference** (`zIndex: 20`).

- **Restauración Geométrica y Eliminación de Solapamiento de Pantallas:**
  - Corrección de la deformación causada por la inyección inline de `display: flex` en `executePage()`; ahora las pantallas recuperan su `display` CSS nativo (`display: block` para `current-page`, `today-page`, `radar-page` y `7day-page`; `display: flex; flex-direction: column;` para `almanac-page` y `headend-id-page`).
  - La barra de título de cada pantalla vuelve a ocupar el 100% del ancho superior de la tarjeta (`1235px`), eliminando su desplazamiento a una columna lateral.
  - Rebalanceo semántico del dial y los datos del clima en `#current-page`: sustitución de `<div style="width: 300px;">` por `.cc-dial-wrapper` de 480px, `#cc-dial` de 440px y `#cc-container` de 700px.
  - Margen de seguridad limpio de 66px a 75px entre el dial de temperatura y las métricas meteorológicas (`VISIBILITY`, `WIND`, `HUMIDITY`, etc.), asegurando cero colisiones y una fidelidad visual broadcast 1:1.

- **Barra Superior Acoplada (Top InfoBar sin Reloj y Desaparición al Cierre):**
  - Reubicación de `#infobar-container` en `top: 130px; height: 95px; width: 1235px; left: 150px; z-index: 50;` acoplándose con precisión matemática sobre el marco de contenido principal (`top: 225px`).
  - Despliegue de logotipos oficiales (The Weather Channel y Local on the 8s) y nombre de la ciudad activa.
  - Ocultamiento permanente del reloj digital superior (`#infobar-time-container { display: none !important; }`) para evitar duplicación con el reloj del Lower Third.
  - Desaparición animada al cierre (`#infobar-container.hidden { top: -110px; opacity: 0; }`) coordinada con la pantalla final `#ItsAmazingOutThere`.

- **Audio Broadcast Secuencial y Recarga Limpia de Configuración:**
  - Secuencia estricta de pistas de audio: arranque de la fanfarria instrumental `jingle.wav` y transición encadenada a la música de fondo al concluir el jingle (`jingle.onended`), evitando cualquier superposición sonora al desbloquear la autoreproducción con un clic.
  - Desbloqueador de audio inteligente: si la directiva de autoplay bloquea el audio, el primer gesto del usuario solo desbloquea el jingle pendiente; la música de fondo no iniciará hasta que este concluya.
  - Método de guardado de configuración **"Aplicar y Actualizar"**: persistencia instantánea de todos los parámetros en `localStorage` seguida de recarga completa (`window.location.reload()`), garantizando arranque limpio sin timers o estados residuales en memoria.
  - Línea de tiempo inferior protegida con `flex-wrap: nowrap; width: 5000px;`, garantizando la visualización nítida y continua de los títulos e iconos de Almanaque (`calendar.svg`) y Headend ID (`8logo.svg`).
  - Supresión de parpadeo de pantallas inactivas: las pantallas de alerta no emitidas permanecen en `display: none` y coordenadas nativas (`top: 101%; left: 0px`), evitando que vuelen por la pantalla durante el reinicio en bucle.
  - Extensión de la duración de `headend-id-page` a 9.5 segundos con frase concisa para garantizar que el locutor concluya el 100% de su mensaje antes de la salida.

- **Restauración Auténtica de Pantalla de Inicio (Intro + Crawl Sincrónico):**
  - Solución definitiva al bloqueo que causaba una pantalla vacía en el arranque; ahora `#content-container` se expande de inmediato (`top: 225px; height: 590px`).
  - Despliegue instantáneo del saludo _"HELLO [CIUDAD]"_ junto al logotipo oficial _"Local on the 8s"_ y el cintillo inferior `#crawler-container` deslizando texto desde el segundo 0.
  - Sintonización de la duración de la intro a 6.5 segundos para acompañar el jingle musical oficial y la locución vocal TTS en español.
  - Transición limpia a las 6.5s hacia la diapositiva _Now_ con ocultamiento ordenado de `#greeting-page`.
- **Carrusel Meteorológico de Ciudades en el Ticker Inferior (10s):**
  - Activación inmediata y autónoma de la rotación cada 10 segundos en la barra inferior Lower Third.
  - Consulta multi-coordenada por lotes (Open-Meteo) para las principales ciudades del país correspondiente a la ubicación elegida (ej. Arica, Iquique, Antofagasta, Calama, etc.).
  - Soporte de día/noche con `is_day` para iconografía animada de Meteocons e indicador de viento/rango de temperatura en vivo.

- **Nueva Iconografía Animada Meteocons (Variante Fill):**
  - Actualización completa de los 48 estados meteorológicos por los iconos vectoriales libres de `basmilius/meteocons` en formato SVG animado (SMIL nativo).
  - Descarte de animaciones CSS externas artificiales, aprovechando el movimiento vectorial nativo autónomo de cada icono.
- **Ticker Meteorológico Nacional y Regional Rotativo (10s):**
  - Carrusel automático de 10 segundos en el Lower Third que cicla consecutivamente entre las principales ciudades del país seleccionado (Chile, EE.UU., Argentina, España, México, etc.).
  - Consulta en lote multi-coordenada instantánea vía Open-Meteo sin consumo de cuota ni requisitos de claves API.
- **Logotipo Oficial Corporativo de The Weather Channel:**
  - Integración del logotipo cuadrado oficial en el Lower Third escalado estrictamente a 63px.
- **Corrección de Arranque y Despliegue de Diapositivas:**
  - Solución al bloqueo de pantalla en blanco permitiendo la entrada fluida de `current-page` y proveedor `twc`/`openmeteo` de fábrica sin alertas de claves faltantes.
- **Barra Inferior Lower Third Auténtica:**
  - Banda superior con ticker / crawl secundario independiente y configurable.
  - Bloque inferior con logotipo oficial de _The Weather Channel_, reloj digital en tiempo real (`HH:mm`), mini cápsula climática con icono y rango térmico, y métricas de viento.
- **Rediseño Fiel de Pantalla de Identificación (Headend ID):**
  - Réplica exacta de la cabecera institucional oficial con logotipo "Local on the 8s" e `INTELLISTAR 2 XD`.
  - Caja central estilo broadcast con operador configurable (`Spectrum`, `HD channel 211`), ciudad, ID meteorológico y fecha/hora formateada.
  - Emblema oficial `2i XD` con resplandor radial azul.
- **Audio Ducking Dinámico:**
  - Atenuación automática de la música de fondo al 18% durante la narración vocal del TTS para máxima inteligibilidad vocal, retornando al 45% al terminar.
- **Optimización de Animaciones e Interpolación:**
  - Transición fluida del contador de presión atmosférica en 1.2 segundos mediante interpolación temporal matemática.
- **Radar Doppler Global:**
  - Adaptación de capas Leaflet con `maxNativeZoom: 6` para visualización fluida sin errores de límites de zoom en RainViewer API fuera de EE.UU.

### [Versión 2.0.0] - Modernización Integral y WebApp

- **Soporte de WebApp de Escritorio con Electron:** Modos ventana, sin bordes y pantalla completa (`F11`), con panel de configuración on-demand (`Ctrl+,` / `F2`).
- **Servidor Web Local en Node.js:** Ejecución en red local mediante `npm start` con cero dependencias.
- **Compatibilidad con OpenWeatherMap One Call API 4.0 y Google Maps Platform Weather API.**
- **Buscador Geográfico Global con Sanitización Inteligente:** Soporte de códigos IATA/ICAO de aeropuertos, ciudades del mundo y corrección de prefijos provinciales.
- **Dial Circular Dinámico de Temperatura:** Gradientes condicionales automáticos (azul < 5°C, naranja 6-29°C, rojo >= 30°C) y tipografía Roboto Light.
- **Sistema de Locución TTS Multilingüe:** Narración automática con detección de idioma del sistema y plantillas configurables.

## 🌟 Nuevas Características y Mejoras Implementadas

- **WebApp de Escritorio Nativa (Electron):**
  - Ejecutable autónomo sin necesidad de abrir un navegador web externo.
  - **Arranque Directo:** Inicia de inmediato la transmisión en vivo sin pantallas de bloqueo iniciales.
  - **Panel de Configuración On-Demand:** Accesible en cualquier momento mediante atajos de teclado (`Ctrl+,` o `F2`) o haciendo clic en el engranaje ⚙️.
  - **Recarga en Caliente (Hot Reload):** Permite cambiar ciudades, proveedores, velocidad de cintillo y unidades de medida al vuelo, aplicando los cambios al instante sin reiniciar la app.
  - **Selector de Modo de Pantalla:** Alterna dinámicamente entre **Modo Ventana** (1280x720 / 16:9), **Ventana Sin Bordes (Borderless)** y **Pantalla Completa (Kiosk / Broadcast)**.

- **Servidor HTTP Local en Node.js (`server.js`):**
  - Servidor web de alto rendimiento y cero dependencias para montar el proyecto localmente o compartirlo en la red local (para smart TVs, pantallas secundarias o dispositivos móviles).
  - Soporte completo de tipos MIME, compresión, streaming de audio (HTTP Range) y cabeceras CORS.

- **Lanzadores Rápidos para Windows (.bat):**
  - `iniciar-webapp.bat`: Ejecuta directamente la aplicación Electron con doble clic.
  - `iniciar-servidor.bat`: Inicia el servidor Node.js y abre automáticamente el navegador en `http://localhost:8080`.

- **Buscador Universal de Lugares (Soporte Global):**
  - Ya no está limitado a códigos postales de Estados Unidos.
  - **Aeropuertos:** Búsqueda inmediata por código IATA (ej. `SCL`, `EZE`, `MAD`, `JFK`, `LAX`) o ICAO (`SCEL`, `SAEZ`, `LEMD`, `KJFK`).
  - **Localidades y Países:** Soporta cualquier ciudad del mundo (`Santiago, Chile`, `Madrid, España`, `Tokyo, Japan`, `Buenos Aires, Argentina`). Sanitización automática de prefijos administrativos (elimina "Provincia de", "Región de", etc.).
  - **Direcciones exactas y códigos postales:** Geocodificación precisa de calles y códigos postales internacionales (`Av. Providencia 1234`, `10001`, `75001`).
  - Sugerencias de autocompletado en tiempo real con selección interactiva.

- **Múltiples Sistemas Meteorológicos:**
  - **Google Weather API (Google Maps Platform):** Pronóstico de alta precisión y condiciones globales impulsadas por Google Maps Platform.
  - **OpenWeatherMap One Call API 4.0:** Soporte completo de la versión modular más reciente de OpenWeatherMap (`/current` y `/timeline/1day`), con respaldo automático a versiones 3.0 / 2.5.
  - **The Weather Channel (TWC - Nativo):** Conexión con clave de API activa verificada para reproducir la experiencia original.
  - **Open-Meteo (Libre y Sin Clave):** Proveedor mundial y respaldo automático ante fallos de cuota o claves no configuradas.

- **Dial Circular Auténtico de Temperatura IntelliStar 2 XD:**
  - Arco de progreso circular dinámico SVG que se llena proporcionalmente al nivel de temperatura.
  - Umbrales de color exactos según emisión oficial:
    - **Azul (`#4dabf7`):** Temperaturas inferiores a 5 °C.
    - **Naranja con gradiente (`#ffd43b` a `#f76707`):** Temperaturas templadas entre 6 °C y 29 °C.
    - **Rojo (`#e03131`):** Temperaturas cálidas superiores o iguales a 30 °C.
  - Tipografía **Roboto Light** (`font-weight: 300`) fiel al sistema de emisión.

- **Radar Doppler Global:**
  - Cobertura de radar en tiempo real para cualquier región del planeta mediante Leaflet y la API de RainViewer sobre mapa base oscuro estilo The Weather Channel (CartoDB Dark Matter).
  - Zoom automático regional y animaciones suaves.

- **Sistema de Locución Vocal Automatizada (TTS Narration):**
  - Motor de síntesis de voz mediante Web Speech API emulando al locutor oficial de "Local on the 8s".
  - Detección automática del idioma del sistema y navegador (`es` / `en`).
  - Plantillas narrativas personalizables y dinámicas con sustitución de variables para cada segmento de la emisión.

- **Pantalla de Identificación de Cabecera (Headend ID Screen):**
  - Despliega la ciudad, provincia/estado y país, estación DMA ID, proveedor meteorológico activo, fecha y hora del sistema, con el emblema de IntelliStar 2 XD.
  - Ubicada por defecto al final de la secuencia (configurable para reproducirse al inicio o desactivarse).

- **Banner Publicitario Lateral Clásico ("Local on the 8s"):**
  - Presente en el lateral derecho de la pantalla simulando las inserciones de cableoperadores locales ("Brought To You By Local on the 8s").

- **Condiciones Actuales Completas:**
  - Corrección del texto y animación del valor de **Sensación Térmica (Feels Like)**.
  - Contador numérico animado de **Presión Atmosférica** con indicador de tendencia (▲ / ▼).

- **Fondos Dinámicos de Pantalla:**
  - Consulta en tiempo real de fotografías de la ciudad elegida mediante la API pública de Wikipedia Commons.
  - Respaldo automático con imágenes atmosféricas HD de alta definición según condición meteorológica y hora del día.

- **Ajuste de Velocidad del Cintillo (Crawl):**
  - Selector de velocidad: Lento (80 px/s), Normal (120 px/s - recomendado) y Rápido (180 px/s).

- **Micro-Animaciones para Iconos Meteorológicos:**
  - Iconos con efectos sutiles de flotación, rotación solar y pulsación luminosa.

- **Corrección de Ciclo y Estabilidad de Pantalla:**
  - Solución integral al bug de pantalla negra y desaparición de la barra superior en revisiones sucesivas (con o sin loop).
  - Eliminación de caracteres corruptos (`19Â°`) gracias al orden canónico de `UTF-8` y codificación Unicode `\u00B0`.

---

## 🚀 Modos de Ejecución

### Opción 1: Aplicación de Escritorio (Electron WebApp - Recomendada)

No requiere abrir ningún navegador externo:

- **Doble clic en:** `iniciar-webapp.bat`
- **O por terminal:**
  ```cmd
  npm run app
  ```

#### Atajos de Teclado en la WebApp:

| Tecla                  | Acción                                              |
| :--------------------- | :-------------------------------------------------- |
| `Ctrl+,` o `F2`        | **Abrir / Cerrar Panel de Configuración On-Demand** |
| `F11`                  | **Alternar Pantalla Completa (Kiosk / Broadcast)**  |
| `Esc`                  | **Salir de pantalla completa a modo ventana**       |
| `F5` o `Ctrl+R`        | **Recargar emulador**                               |
| `F12` o `Ctrl+Shift+I` | **Abrir Consola de Desarrollador (DevTools)**       |

---

### Opción 2: Servidor Web Local Node.js

Ideal para visualizar en navegador web o transmitir a otros dispositivos en tu red local:

- **Doble clic en:** `iniciar-servidor.bat`
- **O por terminal:**
  ```cmd
  npm start
  ```
- Accede desde tu navegador en: `http://localhost:8080` (o la IP local mostrada en consola).

---

## 🛡️ Motor de Resiliencia y Arranque Broadcast Infalible

Para emular la robustez ininterrumpida de una unidad de cabecera por cable IntelliStar 2 XD de The Weather Channel (emisión 24/7 sin bloqueos):

1. **Autocorrección de Perfiles Geográficos:** Si `localStorage` contiene un objeto de ubicación vacío o con coordenadas numéricas no válidas (`NaN`, `null`, `undefined`), `CONFIG.boot()` conmuta de inmediato a las coordenadas de contingencia (Santiago de Chile) garantizando el arranque.
2. **Timeouts en Red con `AbortController`:** Todas las consultas a APIs meteorológicas (`WeatherProviders.fetchWithTimeout`) implementan un tiempo límite de 7 segundos. Si un servicio se demora o se cuelga, la solicitud se cancela y conmuta automáticamente al proveedor secundario.
3. **Pronóstico Local de Contingencia:** En caso de corte total de Internet o caída simultánea de proveedores primarios y de respaldo, se genera un pronóstico seguro de contingencia para que la presentación inicie la intro y el carrusel de inmediato sin quedarse congelada en la pantalla de reposo.
4. **Blindaje de Módulos:** Cada llamada de preparación en `setInformation()` está protegida individualmente con bloques `try / catch` para que cualquier discrepancia en un subcomponente no impida la ejecución de la animación.
5. **Arranque Dual `DOMContentLoaded` + `load`:** El ciclo de vida de la aplicación no depende del retardo de recursos externos CDN, iniciando en cuanto la estructura DOM está lista.
