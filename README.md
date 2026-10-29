# IntelliStar 2 XD Emulator (Fork Modernizado)

Aplicación web y de escritorio que emula la presentación gráfica y sonora del segmento "Local on the 8s" transmitido por **The Weather Channel** utilizando las unidades [IntelliStar 2 XD](https://en.wikipedia.org/wiki/IntelliStar2) (estilo gráfico 2019+).

## ¡Puedes verlo en acción aca! -> https://raxitocl.github.io/Intellistar-2-XD-fork/

---

## 📝 Registro de Actualizaciones (Changelog)

### [Próxima Versión / En Desarrollo - Broadcast Edition]

- **Restauración Auténtica de Pantalla de Inicio (Intro + Crawl Sincrónico):**
  - Solución definitiva al bloqueo que causaba una pantalla vacía en el arranque; ahora `#content-container` se expande de inmediato (`top: 225px; height: 590px`).
  - Despliegue instantáneo del saludo *"HELLO [CIUDAD]"* junto al logotipo oficial *"Local on the 8s"* y el cintillo inferior `#crawler-container` deslizando texto desde el segundo 0.
  - Sintonización de la duración de la intro a 6.5 segundos para acompañar el jingle musical oficial y la locución vocal TTS en español.
  - Transición limpia a las 6.5s hacia la diapositiva *Now* con ocultamiento ordenado de `#greeting-page`.
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
