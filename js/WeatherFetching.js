/**
 * WeatherFetching.js
 * Enrutador meteorológico y orquestador de datos para IntelliStar 2 XD.
 * Conecta el estado global con los adaptadores (Google Weather, OpenWeatherMap, TWC y Open-Meteo)
 * y provee tolerancia a fallos con cambio automático a respaldo gratuito.
 */

async function fetchCurrentWeather() {
  if (latitude === undefined || longitude === undefined || latitude === null || longitude === null || isNaN(latitude) || isNaN(longitude)) {
    console.warn("Coordenadas geográficas no válidas detectadas. Asignando Santiago de Chile como respaldo incondicional.");
    latitude = -33.4489;
    longitude = -70.6693;
    cityName = cityName || "SANTIAGO";
    countryName = countryName || "Chile";
    stateName = stateName || "Región Metropolitana";
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
    if (window.showApiToast) {
      window.showApiToast(`Aviso: ${err.message || 'Error en API'}. Conmutando a Open-Meteo como respaldo...`, 'warning');
    }
    
    try {
      await WeatherProviders.OpenMeteoProvider.fetch(latitude, longitude, CONFIG.units);
    } catch (fallbackErr) {
      console.error("Error crítico: el proveedor de respaldo también falló:", fallbackErr);
      if (window.showApiToast) {
        window.showApiToast("Conexión limitada: cargando pronóstico local de contingencia...", "warning");
      }
      // Asegurar valores válidos para que la presentación broadcast no se detenga jamás
      currentTemperature = (currentTemperature !== undefined && currentTemperature !== null && !isNaN(currentTemperature)) ? currentTemperature : 22;
      currentCondition = currentCondition || "Fair";
      currentIcon = (currentIcon !== undefined && currentIcon !== null) ? currentIcon : 30;
      windSpeed = windSpeed || "CALM 5 km/h";
      gusts = gusts || "NONE";
      feelsLike = (feelsLike !== undefined && feelsLike !== null && !isNaN(feelsLike)) ? feelsLike : currentTemperature;
      humidity = humidity || 50;
      visibility = visibility || 10;
      dewPoint = dewPoint || 12;
      pressure = pressure || "29.92";
      pressureTrend = pressureTrend || "▲";

      for (let i = 0; i < 4; i++) {
        if (forecastTemp[i] === undefined || forecastTemp[i] === "--") forecastTemp[i] = currentTemperature;
        if (forecastIcon[i] === undefined) forecastIcon[i] = 30;
        if (!forecastNarrative[i]) forecastNarrative[i] = "Fair and mild conditions.";
        if (!forecastPrecip[i]) forecastPrecip[i] = "0% Chance<br/> of Precip";
      }
      for (let i = 0; i < 7; i++) {
        if (outlookHigh[i] === undefined || outlookHigh[i] === "--") outlookHigh[i] = currentTemperature + 2;
        if (outlookLow[i] === undefined || outlookLow[i] === "--") outlookLow[i] = currentTemperature - 5;
        if (!outlookCondition[i]) outlookCondition[i] = "Fair";
        if (outlookIcon[i] === undefined) outlookIcon[i] = 30;
      }
      // Reintentar en segundo plano sin interrumpir la emisión activa
      setTimeout(fetchCurrentWeather, 30000);
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
