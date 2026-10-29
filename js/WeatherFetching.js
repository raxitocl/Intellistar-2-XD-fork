/**
 * WeatherFetching.js
 * Enrutador meteorológico y orquestador de datos para IntelliStar 2 XD.
 * Conecta el estado global con los adaptadores (Google Weather, OpenWeatherMap, TWC y Open-Meteo)
 * y provee tolerancia a fallos con cambio automático a respaldo gratuito.
 */

async function fetchCurrentWeather() {
  if (latitude === undefined || longitude === undefined || latitude === null || longitude === null) {
    alert("Coordenadas no válidas.");
    console.error("Latitude and longitude must be defined.");
    return;
  }

  const provider = CONFIG.provider || "google";
  let apiKey = "";

  if (provider === "google") {
    apiKey = localStorage.getItem("googleApiKey") || CONFIG.secrets.googleApiKey;
  } else if (provider === "openweathermap") {
    apiKey = localStorage.getItem("owmApiKey") || CONFIG.secrets.owmApiKey;
  } else if (provider === "twc") {
    apiKey = localStorage.getItem("twcAPIKey") || CONFIG.secrets.twcAPIKey;
  }

  console.log(`Consultando clima para [${cityName}] (${latitude}, ${longitude}) vía ${provider}...`);

  try {
    if (provider === "google") {
      if (!apiKey) {
        throw new Error("No has configurado una API Key para Google Weather en Opciones Avanzadas.");
      }
      await WeatherProviders.GoogleWeatherProvider.fetch(latitude, longitude, CONFIG.units, apiKey);
    } else if (provider === "openweathermap") {
      if (!apiKey) {
        throw new Error("No has configurado una API Key para OpenWeatherMap en Opciones Avanzadas.");
      }
      await WeatherProviders.OpenWeatherMapProvider.fetch(latitude, longitude, CONFIG.units, apiKey);
    } else if (provider === "twc") {
      await WeatherProviders.TWCWeatherProvider.fetch(latitude, longitude, CONFIG.units, apiKey);
    } else {
      // Proveedor libre por defecto
      await WeatherProviders.OpenMeteoProvider.fetch(latitude, longitude, CONFIG.units);
    }
  } catch (err) {
    console.warn(`Falla con el proveedor ${provider}:`, err);
    alert(`Aviso: ${err.message || 'Error en API'}. Usando Open-Meteo como respaldo...`);
    
    try {
      await WeatherProviders.OpenMeteoProvider.fetch(latitude, longitude, CONFIG.units);
    } catch (fallbackErr) {
      console.error("Error crítico: el proveedor de respaldo también falló:", fallbackErr);
      alert("Error al obtener información meteorológica.");
      return;
    }
  }

  fetchRadarImages();
}

function fetchRadarImages() {
  radarImage = new Image();
  radarImage.onerror = function () {
    getElement('radar-container').style.display = 'none';
  };
  
  // Para radar usamos imagen animada
  radarImage.src = `https://s.w-x.co/staticmaps/wu/wxtype/none/usa/animate.png`;
  radarImage.width = 1235;
  radarImage.height = 525;

  if (alertsActive) {
    zoomedRadarImage = new Image();
    zoomedRadarImage.onerror = function () {
      getElement('zoomed-radar-container').style.display = 'none';
    };
    zoomedRadarImage.src = `https://s.w-x.co/staticmaps/wu/wxtype/none/usa/animate.png`;
  }

  scheduleTimeline();
}
