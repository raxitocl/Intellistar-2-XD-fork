/**
 * NationalTicker.js
 * Módulo de Ticker Meteorológico Regional y Nacional para IntelliStar 2 XD.
 * Rota cada 10 segundos entre las principales ciudades del país correspondiente
 * a la ubicación seleccionada por el usuario, mostrando datos en vivo vía Open-Meteo
 * e iconos oficiales animados Meteocons Fill.
 */

(function () {
  const REGIONAL_CATALOGS = {
    CL: [
      { name: "ARICA", lat: -18.4783, lon: -70.3126 },
      { name: "IQUIQUE", lat: -20.2208, lon: -70.1431 },
      { name: "ANTOFAGASTA", lat: -23.6500, lon: -70.4000 },
      { name: "CALAMA", lat: -22.4544, lon: -68.9294 },
      { name: "COPIAPÓ", lat: -27.3668, lon: -70.3314 },
      { name: "LA SERENA", lat: -29.9027, lon: -71.2519 },
      { name: "VALPARAÍSO", lat: -33.0472, lon: -71.6127 },
      { name: "SANTIAGO", lat: -33.4489, lon: -70.6693 },
      { name: "RANCAGUA", lat: -34.1708, lon: -70.7444 },
      { name: "TALCA", lat: -35.4264, lon: -71.6554 },
      { name: "CONCEPCIÓN", lat: -36.8270, lon: -73.0503 },
      { name: "TEMUCO", lat: -38.7359, lon: -72.5904 },
      { name: "VALDIVIA", lat: -39.8142, lon: -73.2459 },
      { name: "PUERTO MONTT", lat: -41.4693, lon: -72.9424 },
      { name: "COYHAIQUE", lat: -45.5752, lon: -72.0662 },
      { name: "PUNTA ARENAS", lat: -53.1638, lon: -70.9171 }
    ],
    US: [
      { name: "NEW YORK", lat: 40.7128, lon: -74.0060 },
      { name: "LOS ANGELES", lat: 34.0522, lon: -118.2437 },
      { name: "CHICAGO", lat: 41.8781, lon: -87.6298 },
      { name: "HOUSTON", lat: 29.7604, lon: -95.3698 },
      { name: "PHOENIX", lat: 33.4484, lon: -112.0740 },
      { name: "PHILADELPHIA", lat: 39.9526, lon: -75.1652 },
      { name: "SAN ANTONIO", lat: 29.4241, lon: -98.4936 },
      { name: "SAN DIEGO", lat: 32.7157, lon: -117.1611 },
      { name: "DALLAS", lat: 32.7767, lon: -96.7970 },
      { name: "MIAMI", lat: 25.7617, lon: -80.1918 },
      { name: "ATLANTA", lat: 33.7490, lon: -84.3880 },
      { name: "SEATTLE", lat: 47.6062, lon: -122.3321 },
      { name: "DENVER", lat: 39.7392, lon: -104.9903 },
      { name: "BOSTON", lat: 42.3601, lon: -71.0589 }
    ],
    AR: [
      { name: "BUENOS AIRES", lat: -34.6037, lon: -58.3816 },
      { name: "CÓRDOBA", lat: -31.4201, lon: -64.1888 },
      { name: "ROSARIO", lat: -32.9468, lon: -60.6393 },
      { name: "MENDOZA", lat: -32.8895, lon: -68.8458 },
      { name: "LA PLATA", lat: -34.9205, lon: -57.9536 },
      { name: "MAR DEL PLATA", lat: -38.0055, lon: -57.5560 },
      { name: "SALTA", lat: -24.7821, lon: -65.4232 },
      { name: "SANTA FE", lat: -31.6333, lon: -60.7000 },
      { name: "BARILOCHE", lat: -41.1335, lon: -71.3103 }
    ],
    ES: [
      { name: "MADRID", lat: 40.4168, lon: -3.7038 },
      { name: "BARCELONA", lat: 41.3851, lon: 2.1734 },
      { name: "VALENCIA", lat: 39.4699, lon: -0.3763 },
      { name: "SEVILLA", lat: 37.3891, lon: -5.9845 },
      { name: "ZARAGOZA", lat: 41.6488, lon: -0.8891 },
      { name: "MÁLAGA", lat: 36.7213, lon: -4.4214 },
      { name: "BILBAO", lat: 43.2630, lon: -2.9350 },
      { name: "ALICANTE", lat: 38.3452, lon: -0.4810 }
    ],
    MX: [
      { name: "CIUDAD DE MÉXICO", lat: 19.4326, lon: -99.1332 },
      { name: "GUADALAJARA", lat: 20.6597, lon: -103.3496 },
      { name: "MONTERREY", lat: 25.6866, lon: -100.3161 },
      { name: "PUEBLA", lat: 19.0414, lon: -98.2063 },
      { name: "TIJUANA", lat: 32.5149, lon: -117.0382 },
      { name: "MÉRIDA", lat: 20.9674, lon: -89.5926 },
      { name: "CANCÚN", lat: 21.1619, lon: -86.8515 }
    ],
    PE: [
      { name: "LIMA", lat: -12.0464, lon: -77.0428 },
      { name: "AREQUIPA", lat: -16.4090, lon: -71.5375 },
      { name: "TRUJILLO", lat: -8.1091, lon: -79.0270 },
      { name: "CUSCO", lat: -13.5319, lon: -71.9675 },
      { name: "IQUITOS", lat: -3.7491, lon: -73.2538 }
    ],
    CO: [
      { name: "BOGOTÁ", lat: 4.7110, lon: -74.0721 },
      { name: "MEDELLÍN", lat: 6.2442, lon: -75.5812 },
      { name: "CALI", lat: 3.4516, lon: -76.5320 },
      { name: "BARRANQUILLA", lat: 10.9685, lon: -74.7813 },
      { name: "CARTAGENA", lat: 10.3910, lon: -75.4794 }
    ],
    GLOBAL: [
      { name: "LONDON", lat: 51.5074, lon: -0.1278 },
      { name: "PARIS", lat: 48.8566, lon: 2.3522 },
      { name: "TOKYO", lat: 35.6762, lon: 139.6503 },
      { name: "SYDNEY", lat: -33.8688, lon: 151.2093 },
      { name: "RIO DE JANEIRO", lat: -22.9068, lon: -43.1729 },
      { name: "TORONTO", lat: 43.6532, lon: -79.3832 }
    ]
  };

  const NationalTicker = {
    citiesData: [],
    currentIndex: 0,
    intervalId: null,
    isFetching: false,
    activeCountryCode: null,

    getCountryCode() {
      if (window.CONFIG && window.CONFIG.countryCode) {
        const cc = String(window.CONFIG.countryCode).toUpperCase();
        if (REGIONAL_CATALOGS[cc]) return cc;
      }
      if (window.countryName) {
        const cLow = String(window.countryName).toLowerCase();
        if (cLow.includes('chile')) return 'CL';
        if (cLow.includes('argentina')) return 'AR';
        if (cLow.includes('españa') || cLow.includes('spain')) return 'ES';
        if (cLow.includes('méxico') || cLow.includes('mexico')) return 'MX';
        if (cLow.includes('perú') || cLow.includes('peru')) return 'PE';
        if (cLow.includes('colombia')) return 'CO';
        if (cLow.includes('united states') || cLow.includes('estados unidos') || cLow.includes('usa')) return 'US';
      }
      return 'GLOBAL';
    },

    async init() {
      this.stop();
      const country = this.getCountryCode();
      this.activeCountryCode = country;
      const catalog = REGIONAL_CATALOGS[country] || REGIONAL_CATALOGS.GLOBAL;

      await this.fetchCitiesWeather(catalog);
      if (this.citiesData.length > 0) {
        this.renderCity(this.citiesData[0]);
        this.currentIndex = 0;
        this.startRotation();
      }
    },

    async fetchCitiesWeather(catalog) {
      if (!catalog || catalog.length === 0) return;
      this.isFetching = true;

      const lats = catalog.map(c => c.lat.toFixed(4)).join(',');
      const lons = catalog.map(c => c.lon.toFixed(4)).join(',');
      const isMetric = (window.CONFIG && window.CONFIG.units === 'e') ? false : true;
      const unitParam = isMetric ? '&wind_speed_unit=kmh' : '&temperature_unit=fahrenheit&wind_speed_unit=mph';

      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lats}&longitude=${lons}&current=temperature_2m,is_day,weather_code,wind_speed_10m,wind_direction_10m&daily=temperature_2m_max,temperature_2m_min&timezone=auto${unitParam}`;

      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Open-Meteo batch HTTP ${res.status}`);
        const data = await res.json();
        const results = Array.isArray(data) ? data : [data];

        this.citiesData = catalog.map((city, idx) => {
          const item = results[idx] || {};
          const cur = item.current || {};
          const daily = item.daily || {};

          const curTemp = cur.temperature_2m !== undefined ? Math.round(cur.temperature_2m) : '--';
          const high = (daily.temperature_2m_max && daily.temperature_2m_max[0] !== undefined)
            ? Math.round(daily.temperature_2m_max[0])
            : curTemp;
          const low = (daily.temperature_2m_min && daily.temperature_2m_min[0] !== undefined)
            ? Math.round(daily.temperature_2m_min[0])
            : '--';

          const wCode = cur.weather_code !== undefined ? cur.weather_code : 1;
          const isDaytime = cur.is_day !== undefined ? !!cur.is_day : true;
          
          let iconCode = 30;
          if (window.WeatherProviders && window.WeatherProviders.OpenMeteoProvider) {
            iconCode = WeatherProviders.OpenMeteoProvider.mapWmoToIcon(wCode, isDaytime);
          }

          let windText = '--';
          if (cur.wind_speed_10m !== undefined) {
            const card = (window.WeatherProviders && WeatherProviders.degToCompass)
              ? WeatherProviders.degToCompass(cur.wind_direction_10m)
              : '';
            const spd = Math.round(cur.wind_speed_10m);
            const unit = isMetric ? 'km/h' : 'mph';
            windText = `${spd} ${unit}${card ? ' ' + card : ''}`;
          }

          return {
            name: city.name,
            high: high,
            low: low,
            iconCode: iconCode,
            windText: windText
          };
        });
      } catch (err) {
        console.warn("NationalTicker batch fetch fallback:", err);
      } finally {
        this.isFetching = false;
      }
    },

    startRotation() {
      this.stop();
      if (this.citiesData.length <= 1) return;

      // Rotación cada 10 segundos con micro-animación CSS de elevación y fundido
      this.intervalId = setInterval(() => {
        this.nextCity();
      }, 10000);
    },

    nextCity() {
      if (this.citiesData.length === 0) return;
      this.currentIndex = (this.currentIndex + 1) % this.citiesData.length;
      const nextData = this.citiesData[this.currentIndex];

      const weatherEl = document.getElementById('lower-third-weather');
      const windEl = document.getElementById('lower-third-wind');

      if (weatherEl) weatherEl.classList.add('ticker-swapping');
      if (windEl) windEl.classList.add('ticker-swapping');

      setTimeout(() => {
        this.renderCity(nextData);
        if (weatherEl) weatherEl.classList.remove('ticker-swapping');
        if (windEl) windEl.classList.remove('ticker-swapping');
      }, 350);
    },

    renderCity(data) {
      if (!data) return;

      const cityNameEl = document.getElementById('lt-city-name');
      if (cityNameEl) cityNameEl.innerText = data.name;

      const iconEl = document.getElementById('lt-weather-icon');
      if (iconEl) {
        iconEl.innerHTML = `<img src="assets/icons/conditions/${data.iconCode}.svg" style="width: 34px; height: 34px; vertical-align: middle;" alt="Icon" />`;
      }

      const tempRangeEl = document.getElementById('lt-temp-range');
      if (tempRangeEl) {
        tempRangeEl.innerText = `${data.high}° / ${data.low}°`;
      }

      const windValEl = document.getElementById('lt-wind-val');
      if (windValEl) {
        windValEl.innerText = data.windText;
      }
    },

    stop() {
      if (this.intervalId) {
        clearInterval(this.intervalId);
        this.intervalId = null;
      }
    }
  };

  window.NationalTicker = NationalTicker;
})();

