/**
 * WeatherProviders.js
 * Adaptadores meteorológicos modulares para IntelliStar 2 XD:
 * - GoogleWeatherProvider (Google Maps Platform Weather API)
 * - OpenWeatherMapProvider (Compatible con One Call API 4.0 y fallback 2.5/3.0)
 * - TWCWeatherProvider (The Weather Channel API)
 * - OpenMeteoProvider (Proveedor libre y universal sin necesidad de API Key)
 */

window.WeatherProviders = {
  degToCompass(num) {
    if (num === null || num === undefined) return "VAR";
    const val = Math.floor((num / 22.5) + 0.5);
    const arr = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
    return arr[(val % 16)];
  },

  formatPressure(hpa, isMetric) {
    if (!hpa) return { formatted: isMetric ? "1013" : "29.92", trend: "" };
    if (isMetric) {
      return { formatted: Math.round(hpa).toString(), trend: "" };
    }
    const inHg = (hpa * 0.0295299830714).toFixed(2);
    return { formatted: inHg, trend: "" };
  },

  // =========================================================================
  // 1. GOOGLE WEATHER API PROVIDER (Google Maps Platform)
  // =========================================================================
  GoogleWeatherProvider: {
    name: "Google Weather API",

    mapConditionToIcon(type, isDay) {
      if (!type) return isDay ? 30 : 29;
      const t = type.toUpperCase();
      if (t.includes("CLEAR") || t.includes("SUNNY")) return isDay ? 32 : 31;
      if (t.includes("MOSTLY_CLEAR") || t.includes("MOSTLY_SUNNY")) return isDay ? 34 : 33;
      if (t.includes("PARTLY_CLOUDY")) return isDay ? 30 : 29;
      if (t.includes("MOSTLY_CLOUDY")) return isDay ? 28 : 27;
      if (t.includes("CLOUDY") || t.includes("OVERCAST")) return 26;
      if (t.includes("THUNDERSTORM") || t.includes("TSTM")) return isDay ? 38 : 47;
      if (t.includes("SEVERE_THUNDERSTORM")) return 3;
      if (t.includes("HEAVY_RAIN")) return 12;
      if (t.includes("RAIN") || t.includes("SHOWERS")) return 11;
      if (t.includes("DRIZZLE")) return 9;
      if (t.includes("FREEZING_RAIN")) return 10;
      if (t.includes("SLEET") || t.includes("ICE")) return 18;
      if (t.includes("BLIZZARD")) return 43;
      if (t.includes("HEAVY_SNOW")) return 42;
      if (t.includes("SNOW")) return 16;
      if (t.includes("FLURRIES")) return 13;
      if (t.includes("FOG")) return 20;
      if (t.includes("HAZE")) return 21;
      if (t.includes("SMOKE")) return 22;
      if (t.includes("WIND")) return 24;
      if (t.includes("TORNADO")) return 0;
      return isDay ? 30 : 29;
    },

    async fetch(lat, lon, units, apiKey) {
      if (!apiKey) {
        throw new Error("Se requiere una API Key de Google Maps Platform Weather.");
      }

      const isMetric = units === "m";
      const unitsParam = isMetric ? "METRIC" : "IMPERIAL";

      const currentUrl = `https://weather.googleapis.com/v1/currentConditions:lookup?key=${apiKey}&location.latitude=${lat}&location.longitude=${lon}&unitsSystem=${unitsParam}`;
      const currentRes = await fetch(currentUrl);
      if (!currentRes.ok) {
        throw new Error(`Google Weather API error (${currentRes.status}): ${await currentRes.text()}`);
      }
      const curData = await currentRes.json();

      const forecastUrl = `https://weather.googleapis.com/v1/forecast/days:lookup?key=${apiKey}&location.latitude=${lat}&location.longitude=${lon}&days=10&unitsSystem=${unitsParam}`;
      const forecastRes = await fetch(forecastUrl);
      let fcData = null;
      if (forecastRes.ok) {
        fcData = await forecastRes.json();
      }

      let alertData = null;
      try {
        const alertRes = await fetch(`https://weather.googleapis.com/v1/publicAlerts:lookup?key=${apiKey}&location.latitude=${lat}&location.longitude=${lon}`);
        if (alertRes.ok) alertData = await alertRes.json();
      } catch (e) {
        console.warn("No se pudieron obtener alertas de Google:", e);
      }

      const tempVal = Math.round(curData.temperature ? curData.temperature.degrees : 0);
      const isDaytime = curData.isDaytime !== undefined ? curData.isDaytime : true;
      const condType = curData.weatherCondition ? curData.weatherCondition.type : "PARTLY_CLOUDY";
      const condDesc = (curData.weatherCondition && curData.weatherCondition.description) 
        ? curData.weatherCondition.description.text 
        : condType.replace(/_/g, " ");

      const windCard = curData.wind && curData.wind.direction ? curData.wind.direction.cardinal : "CALM";
      const windSpd = curData.wind && curData.wind.speed ? Math.round(curData.wind.speed.value) : 0;
      const windUnit = isMetric ? "km/h" : "mph";
      const gustSpd = curData.wind && curData.wind.gust ? Math.round(curData.wind.gust.value) : null;

      currentTemperature = tempVal;
      currentCondition = condDesc;
      currentIcon = this.mapConditionToIcon(condType, isDaytime);
      windSpeed = `${windCard} ${windSpd} ${windUnit}`;
      gusts = gustSpd ? `${gustSpd} ${windUnit}` : "NONE";
      feelsLike = Math.round(curData.feelsLikeTemperature ? curData.feelsLikeTemperature.degrees : tempVal);
      visibility = curData.visibility ? Math.round(curData.visibility.distance ? curData.visibility.distance.value : 10) : 10;
      humidity = curData.relativeHumidity || 50;
      dewPoint = curData.dewPoint ? Math.round(curData.dewPoint.degrees) : tempVal - 5;

      const pressVal = curData.airPressure && curData.airPressure.meanSeaLevel ? curData.airPressure.meanSeaLevel.value : 1013.25;
      const pressObj = WeatherProviders.formatPressure(pressVal, isMetric);
      pressure = pressObj.formatted;
      pressureTrend = pressObj.trend || "▲";

      isDay = isDaytime;
      if (fcData && fcData.forecastDays) {
        const days = fcData.forecastDays;
        const d0 = days[0] || {};
        const d1 = days[1] || {};

        const day0Day = d0.daytimeForecast || {};
        const day0Night = d0.nighttimeForecast || {};
        const day1Day = d1.daytimeForecast || {};
        const day1Night = d1.nighttimeForecast || {};

        const periods = [
          {
            temp: day0Day.maxTemperature ? Math.round(day0Day.maxTemperature.degrees) : tempVal,
            icon: this.mapConditionToIcon(day0Day.weatherCondition ? day0Day.weatherCondition.type : condType, true),
            desc: (day0Day.weatherCondition && day0Day.weatherCondition.description) ? day0Day.weatherCondition.description.text : "Fair",
            pop: (day0Day.precipitation && day0Day.precipitation.probability) ? day0Day.precipitation.probability.percent : 0,
            narrative: `High near ${day0Day.maxTemperature ? Math.round(day0Day.maxTemperature.degrees) : tempVal}\u00B0. ${day0Day.weatherCondition ? day0Day.weatherCondition.description.text : condDesc}.`
          },
          {
            temp: day0Night.minTemperature ? Math.round(day0Night.minTemperature.degrees) : tempVal - 10,
            icon: this.mapConditionToIcon(day0Night.weatherCondition ? day0Night.weatherCondition.type : condType, false),
            desc: (day0Night.weatherCondition && day0Night.weatherCondition.description) ? day0Night.weatherCondition.description.text : "Clear",
            pop: (day0Night.precipitation && day0Night.precipitation.probability) ? day0Night.precipitation.probability.percent : 0,
            narrative: `Low overnight around ${day0Night.minTemperature ? Math.round(day0Night.minTemperature.degrees) : tempVal - 10}\u00B0. ${day0Night.weatherCondition ? day0Night.weatherCondition.description.text : "Mostly clear"}.`
          },
          {
            temp: day1Day.maxTemperature ? Math.round(day1Day.maxTemperature.degrees) : tempVal,
            icon: this.mapConditionToIcon(day1Day.weatherCondition ? day1Day.weatherCondition.type : "PARTLY_CLOUDY", true),
            desc: (day1Day.weatherCondition && day1Day.weatherCondition.description) ? day1Day.weatherCondition.description.text : "Partly Cloudy",
            pop: (day1Day.precipitation && day1Day.precipitation.probability) ? day1Day.precipitation.probability.percent : 0,
            narrative: `High tomorrow near ${day1Day.maxTemperature ? Math.round(day1Day.maxTemperature.degrees) : tempVal}\u00B0. ${(day1Day.weatherCondition && day1Day.weatherCondition.description) ? day1Day.weatherCondition.description.text : "Partly cloudy"}.`
          },
          {
            temp: day1Night.minTemperature ? Math.round(day1Night.minTemperature.degrees) : tempVal - 10,
            icon: this.mapConditionToIcon(day1Night.weatherCondition ? day1Night.weatherCondition.type : "PARTLY_CLOUDY", false),
            desc: (day1Night.weatherCondition && day1Night.weatherCondition.description) ? day1Night.weatherCondition.description.text : "Partly Cloudy",
            pop: (day1Night.precipitation && day1Night.precipitation.probability) ? day1Night.precipitation.probability.percent : 0,
            narrative: `Tomorrow night low near ${day1Night.minTemperature ? Math.round(day1Night.minTemperature.degrees) : tempVal - 10}\u00B0.`
          }
        ];

        for (let i = 0; i < 4; i++) {
          forecastTemp[i] = periods[i].temp;
          forecastIcon[i] = periods[i].icon;
          forecastNarrative[i] = periods[i].narrative;
          forecastPrecip[i] = `${periods[i].pop}% Chance<br/> of Precip`;
        }

        for (let i = 0; i < 7; i++) {
          const fc = days[i + 1] || days[days.length - 1] || {};
          const dayPart = fc.daytimeForecast || fc.nighttimeForecast || {};
          const nightPart = fc.nighttimeForecast || {};

          outlookHigh[i] = dayPart.maxTemperature ? Math.round(dayPart.maxTemperature.degrees) : "--";
          outlookLow[i] = nightPart.minTemperature ? Math.round(nightPart.minTemperature.degrees) : "--";

          const cText = dayPart.weatherCondition && dayPart.weatherCondition.description ? dayPart.weatherCondition.description.text : "Fair";
          outlookCondition[i] = cText.replace("Thunderstorm", "Thunder</br>storm").split(" ").join("<br/>");
          outlookIcon[i] = this.mapConditionToIcon(dayPart.weatherCondition ? dayPart.weatherCondition.type : "PARTLY_CLOUDY", true);
        }
      }

      alerts = [];
      if (alertData && alertData.alerts && alertData.alerts.length > 0) {
        for (let a of alertData.alerts) {
          const headline = a.headline || a.event || "Weather Advisory";
          alerts.push(headline.toUpperCase());
        }
      }
      alertsActive = alerts.length > 0;
    }
  },

  // =========================================================================
  // 2. OPENWEATHERMAP ONE CALL API 4.0 PROVIDER (Con fallback 2.5/3.0)
  // =========================================================================
  OpenWeatherMapProvider: {
    name: "OpenWeatherMap",

    mapOwmToIcon(code, isDay) {
      if (!code) return isDay ? 30 : 29;
      if (code >= 200 && code < 300) {
        if (code === 211 || code === 212) return 3;
        return isDay ? 38 : 47;
      }
      if (code >= 300 && code < 400) return 9;
      if (code >= 500 && code < 600) {
        if (code === 511) return 10;
        if (code === 502 || code === 503 || code === 504) return 12;
        if (code >= 520) return 40;
        return 11;
      }
      if (code >= 600 && code < 700) {
        if (code === 602) return 42;
        if (code === 611 || code === 612 || code === 613) return 18;
        if (code === 615 || code === 616) return 5;
        if (code >= 620) return 41;
        return 16;
      }
      if (code === 701 || code === 741) return 20;
      if (code === 711) return 22;
      if (code === 721) return 21;
      if (code === 771) return 23;
      if (code === 781) return 0;
      if (code === 800) return isDay ? 32 : 31;
      if (code === 801) return isDay ? 34 : 33;
      if (code === 802) return isDay ? 30 : 29;
      if (code === 803) return isDay ? 28 : 27;
      if (code === 804) return 26;

      return isDay ? 30 : 29;
    },

    async fetch(lat, lon, units, apiKey) {
      if (!apiKey) {
        throw new Error("Se requiere una API Key de OpenWeatherMap.");
      }

      const isMetric = units === "m";
      const owmUnits = isMetric ? "metric" : "imperial";
      const windUnit = isMetric ? "km/h" : "mph";

      // Intentar primero One Call API 4.0
      try {
        const cur4Url = `https://api.openweathermap.org/data/4.0/onecall/current?lat=${lat}&lon=${lon}&units=${owmUnits}&lang=en&appid=${apiKey}`;
        const cur4Res = await fetch(cur4Url);

        if (cur4Res.ok) {
          const cur4Data = await cur4Res.json();
          const rec = (cur4Data.data && cur4Data.data[0]) ? cur4Data.data[0] : cur4Data;

          // Obtener timeline diario (8 días)
          const tl4Url = `https://api.openweathermap.org/data/4.0/onecall/timeline/1day?lat=${lat}&lon=${lon}&cnt=8&units=${owmUnits}&lang=en&appid=${apiKey}`;
          const tl4Res = await fetch(tl4Url);
          let tl4Data = null;
          if (tl4Res.ok) {
            tl4Data = await tl4Res.json();
          }

          // Procesar con One Call 4.0
          const nowTs = rec.dt || Math.floor(Date.now() / 1000);
          const isDaytime = (rec.sunrise && rec.sunset)
            ? (nowTs >= rec.sunrise && nowTs < rec.sunset)
            : true;
          isDay = isDaytime;

          const wItem = (rec.weather && rec.weather[0]) ? rec.weather[0] : {};
          currentTemperature = Math.round(rec.temp || 0);
          currentCondition = wItem.main || "Clear";
          currentIcon = this.mapOwmToIcon(wItem.id, isDaytime);

          const rawWind = Math.round(rec.wind_speed || 0);
          const wCard = WeatherProviders.degToCompass(rec.wind_deg);
          const convertedWind = isMetric ? Math.round(rawWind * 3.6) : rawWind;
          windSpeed = `${wCard} ${convertedWind} ${windUnit}`;

          const rawGust = rec.wind_gust ? (isMetric ? Math.round(rec.wind_gust * 3.6) : Math.round(rec.wind_gust)) : null;
          gusts = rawGust ? `${rawGust} ${windUnit}` : "NONE";

          feelsLike = Math.round(rec.feels_like !== undefined ? rec.feels_like : currentTemperature);
          visibility = rec.visibility ? Math.round(isMetric ? rec.visibility / 1000 : rec.visibility / 1609.34) : 10;
          humidity = rec.humidity || 50;
          dewPoint = Math.round(rec.dew_point !== undefined ? rec.dew_point : (currentTemperature - ((100 - humidity) / 5)));

          const pressObj = WeatherProviders.formatPressure(rec.pressure, isMetric);
          pressure = pressObj.formatted;
          pressureTrend = "▲";

          // Procesar timeline 1day de One Call 4.0
          if (tl4Data && tl4Data.data && tl4Data.data.length > 0) {
            const daysList = tl4Data.data;
            const today = daysList[0] || {};
            const tom = daysList[1] || today;

            const tMax = Math.round(today.temp ? today.temp.max : currentTemperature);
            const tMin = Math.round(today.temp ? today.temp.min : currentTemperature - 10);
            const tomMax = Math.round(tom.temp ? tom.temp.max : currentTemperature);
            const tomMin = Math.round(tom.temp ? tom.temp.min : currentTemperature - 10);

            const tSummary = today.summary || (today.weather && today.weather[0] ? today.weather[0].description : "Clear");
            const tomSummary = tom.summary || (tom.weather && tom.weather[0] ? tom.weather[0].description : "Clear");

            const tPop = Math.round((today.pop || 0) * 100);
            const tomPop = Math.round((tom.pop || 0) * 100);

            forecastTemp[0] = tMax;
            forecastIcon[0] = this.mapOwmToIcon(today.weather && today.weather[0] ? today.weather[0].id : 800, true);
            forecastNarrative[0] = `Today: ${tSummary}. High near ${tMax}\u00B0.`;
            forecastPrecip[0] = `${tPop}% Chance<br/> of Precip`;

            forecastTemp[1] = tMin;
            forecastIcon[1] = this.mapOwmToIcon(today.weather && today.weather[0] ? today.weather[0].id : 800, false);
            forecastNarrative[1] = `Tonight: Low around ${tMin}\u00B0.`;
            forecastPrecip[1] = `${tPop}% Chance<br/> of Precip`;

            forecastTemp[2] = tomMax;
            forecastIcon[2] = this.mapOwmToIcon(tom.weather && tom.weather[0] ? tom.weather[0].id : 800, true);
            forecastNarrative[2] = `Tomorrow: ${tomSummary}. High near ${tomMax}\u00B0.`;
            forecastPrecip[2] = `${tomPop}% Chance<br/> of Precip`;

            forecastTemp[3] = tomMin;
            forecastIcon[3] = this.mapOwmToIcon(tom.weather && tom.weather[0] ? tom.weather[0].id : 800, false);
            forecastNarrative[3] = `Tomorrow Night: Low around ${tomMin}\u00B0.`;
            forecastPrecip[3] = `${tomPop}% Chance<br/> of Precip`;

            // Outlook 7 Días
            for (let i = 0; i < 7; i++) {
              const d = daysList[i + 1] || daysList[daysList.length - 1] || today;
              const dMax = Math.round(d.temp ? d.temp.max : currentTemperature);
              const dMin = Math.round(d.temp ? d.temp.min : currentTemperature - 10);
              const wObj = d.weather && d.weather[0] ? d.weather[0] : {};
              const desc = (wObj.main || "Clear").replace("Thunderstorm", "Thunder</br>storm");

              outlookHigh[i] = dMax;
              outlookLow[i] = dMin;
              outlookCondition[i] = desc;
              outlookIcon[i] = this.mapOwmToIcon(wObj.id || 800, true);
            }

            alerts = [];
            alertsActive = false;
            return;
          }
        }
      } catch (owm4Err) {
        console.warn("One Call 4.0 no disponible para esta clave, intentando fallback 2.5/3.0:", owm4Err);
      }

      // FALLBACK: OpenWeatherMap 2.5 (/weather y /forecast)
      const curUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=${owmUnits}&appid=${apiKey}`;
      const curRes = await fetch(curUrl);
      if (!curRes.ok) {
        throw new Error(`OpenWeatherMap error (${curRes.status}): ${await curRes.text()}`);
      }
      const curData = await curRes.json();

      const fcUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=${owmUnits}&appid=${apiKey}`;
      const fcRes = await fetch(fcUrl);
      if (!fcRes.ok) {
        throw new Error(`OpenWeatherMap Forecast error (${fcRes.status})`);
      }
      const fcData = await fcRes.json();

      const nowTs = curData.dt || Math.floor(Date.now() / 1000);
      const isDaytime = (curData.sys && curData.sys.sunrise && curData.sys.sunset)
        ? (nowTs >= curData.sys.sunrise && nowTs < curData.sys.sunset)
        : true;
      isDay = isDaytime;

      const wItem = (curData.weather && curData.weather[0]) ? curData.weather[0] : {};
      const main = curData.main || {};
      const wind = curData.wind || {};

      currentTemperature = Math.round(main.temp || 0);
      currentCondition = wItem.main || "Clear";
      currentIcon = this.mapOwmToIcon(wItem.id, isDaytime);

      const wSpeed = Math.round(wind.speed || 0);
      const wCard = WeatherProviders.degToCompass(wind.deg);
      const convertedWind = isMetric ? Math.round(wSpeed * 3.6) : wSpeed;
      windSpeed = `${wCard} ${convertedWind} ${windUnit}`;

      const gustVal = wind.gust ? (isMetric ? Math.round(wind.gust * 3.6) : Math.round(wind.gust)) : null;
      gusts = gustVal ? `${gustVal} ${windUnit}` : "NONE";

      feelsLike = Math.round(main.feels_like !== undefined ? main.feels_like : currentTemperature);
      visibility = curData.visibility ? Math.round(isMetric ? curData.visibility / 1000 : curData.visibility / 1609.34) : 10;
      humidity = main.humidity || 50;
      dewPoint = Math.round(currentTemperature - ((100 - humidity) / 5));

      const pressObj = WeatherProviders.formatPressure(main.pressure, isMetric);
      pressure = pressObj.formatted;
      pressureTrend = "▲";

      const dailyMap = {};
      if (fcData && fcData.list) {
        for (const item of fcData.list) {
          const dateStr = item.dt_txt.split(" ")[0];
          if (!dailyMap[dateStr]) {
            dailyMap[dateStr] = { temps: [], weatherCodes: [], descriptions: [], pops: [] };
          }
          dailyMap[dateStr].temps.push(item.main.temp);
          if (item.weather && item.weather[0]) {
            dailyMap[dateStr].weatherCodes.push(item.weather[0].id);
            dailyMap[dateStr].descriptions.push(item.weather[0].description);
          }
          if (item.pop !== undefined) dailyMap[dateStr].pops.push(item.pop);
        }
      }

      const dayKeys = Object.keys(dailyMap).sort();
      const todayGroup = dailyMap[dayKeys[0]] || { temps: [currentTemperature], weatherCodes: [800], descriptions: ["Clear"], pops: [0] };
      const tomGroup = dailyMap[dayKeys[1]] || todayGroup;

      const tMax = Math.round(Math.max(...todayGroup.temps));
      const tMin = Math.round(Math.min(...todayGroup.temps));
      const tomMax = Math.round(Math.max(...tomGroup.temps));
      const tomMin = Math.round(Math.min(...tomGroup.temps));

      const tDesc = todayGroup.descriptions[0] || "Fair";
      const tomDesc = tomGroup.descriptions[0] || "Fair";

      const tPop = Math.round(Math.max(...(todayGroup.pops.length ? todayGroup.pops : [0])) * 100);
      const tomPop = Math.round(Math.max(...(tomGroup.pops.length ? tomGroup.pops : [0])) * 100);

      forecastTemp[0] = tMax;
      forecastIcon[0] = this.mapOwmToIcon(todayGroup.weatherCodes[0], true);
      forecastNarrative[0] = `Today: ${tDesc.charAt(0).toUpperCase() + tDesc.slice(1)}. High of ${tMax}\u00B0.`;
      forecastPrecip[0] = `${tPop}% Chance<br/> of Precip`;

      forecastTemp[1] = tMin;
      forecastIcon[1] = this.mapOwmToIcon(todayGroup.weatherCodes[todayGroup.weatherCodes.length - 1], false);
      forecastNarrative[1] = `Tonight: Low around ${tMin}\u00B0.`;
      forecastPrecip[1] = `${tPop}% Chance<br/> of Precip`;

      forecastTemp[2] = tomMax;
      forecastIcon[2] = this.mapOwmToIcon(tomGroup.weatherCodes[0], true);
      forecastNarrative[2] = `Tomorrow: High near ${tomMax}\u00B0. ${tomDesc}.`;
      forecastPrecip[2] = `${tomPop}% Chance<br/> of Precip`;

      forecastTemp[3] = tomMin;
      forecastIcon[3] = this.mapOwmToIcon(tomGroup.weatherCodes[tomGroup.weatherCodes.length - 1], false);
      forecastNarrative[3] = `Tomorrow Night: Low around ${tomMin}\u00B0.`;
      forecastPrecip[3] = `${tomPop}% Chance<br/> of Precip`;

      for (let i = 0; i < 7; i++) {
        const dKey = dayKeys[i + 1] || dayKeys[dayKeys.length - 1];
        const grp = dailyMap[dKey] || todayGroup;
        const max = grp.temps && grp.temps.length ? Math.round(Math.max(...grp.temps)) : currentTemperature;
        const min = grp.temps && grp.temps.length ? Math.round(Math.min(...grp.temps)) : currentTemperature - 10;
        const code = grp.weatherCodes[0] || 800;
        const desc = (grp.descriptions[0] || "Clear").split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join("<br/>");

        outlookHigh[i] = max;
        outlookLow[i] = min;
        outlookCondition[i] = desc.replace("Thunderstorm", "Thunder</br>storm");
        outlookIcon[i] = this.mapOwmToIcon(code, true);
      }

      alerts = [];
      alertsActive = false;
    }
  },

  // =========================================================================
  // 3. THE WEATHER CHANNEL (TWC) PROVIDER (Clave activa verificada)
  // =========================================================================
  TWCWeatherProvider: {
    name: "The Weather Channel (TWC)",
    defaultKey: "71f92ea9dd2f4790b92ea9dd2f779061",

    async fetch(lat, lon, units, customKey) {
      const apiKey = customKey || this.defaultKey;
      const isMetric = units === "m";
      const unitCode = isMetric ? "m" : "e";
      const unitField = isMetric ? "metric" : "imperial";

      const curUrl = `https://api.weather.com/v1/geocode/${lat}/${lon}/observations/current.json?language=${CONFIG.language}&units=${unitCode}&apiKey=${apiKey}`;
      const curRes = await fetch(curUrl);
      if (!curRes.ok) {
        throw new Error(`TWC Observation error (${curRes.status})`);
      }
      const curData = await curRes.json();
      const obs = curData.observation || {};
      const unitData = obs[unitField] || {};

      currentTemperature = Math.round(unitData.temp || 0);
      currentCondition = obs.phrase_32char || "Fair";
      windSpeed = `${obs.wdir_cardinal || "CALM"} ${unitData.wspd || 0} ${isMetric ? "km/h" : "mph"}`;
      gusts = unitData.gust ? `${unitData.gust} ${isMetric ? "km/h" : "mph"}` : "NONE";
      feelsLike = Math.round(unitData.feels_like !== undefined ? unitData.feels_like : currentTemperature);
      visibility = Math.round(unitData.vis || 10);
      humidity = unitData.rh || 50;
      dewPoint = Math.round(unitData.dewpt || 0);

      const altimeter = unitData.altimeter ? unitData.altimeter.toPrecision(4) : "29.92";
      pressure = altimeter;
      const ptend = obs.ptend_code;
      pressureTrend = (ptend == 1 || ptend == 3) ? "▲" : ptend == 0 ? "" : "▼";
      currentIcon = obs.icon_code !== undefined ? obs.icon_code : 30;

      const fcUrl = `https://api.weather.com/v1/geocode/${lat}/${lon}/forecast/daily/10day.json?language=${CONFIG.language}&units=${unitCode}&apiKey=${apiKey}`;
      const fcRes = await fetch(fcUrl);
      if (!fcRes.ok) {
        throw new Error(`TWC Forecast error (${fcRes.status})`);
      }
      const fcData = await fcRes.json();
      const forecasts = fcData.forecasts || [];

      isDay = !!forecasts[0].day;
      const ns = [];
      ns.push(forecasts[0].day || forecasts[0].night);
      ns.push(forecasts[0].night || forecasts[0].day);
      ns.push(forecasts[1].day || forecasts[1].night);
      ns.push(forecasts[1].night || forecasts[1].day);

      for (let i = 0; i <= 3; i++) {
        const n = ns[i] || {};
        forecastTemp[i] = n.temp !== undefined ? n.temp : "--";
        forecastIcon[i] = n.icon_code !== undefined ? n.icon_code : 30;
        forecastNarrative[i] = (n.narrative || "").replace(/°/g, "\u00B0");
        const pType = n.precip_type ? (n.precip_type.charAt(0).toUpperCase() + n.precip_type.substr(1).toLowerCase()) : "Precip";
        forecastPrecip[i] = `${n.pop || 0}% Chance<br/> of ${pType}`;
      }

      for (let i = 0; i < 7; i++) {
        const fc = forecasts[i + 1] || forecasts[i];
        const p = fc.day || fc.night || {};
        outlookHigh[i] = fc.max_temp !== null && fc.max_temp !== undefined ? fc.max_temp : "--";
        outlookLow[i] = fc.min_temp !== null && fc.min_temp !== undefined ? fc.min_temp : "--";
        const phr = p.phrase_32char || "Fair";
        outlookCondition[i] = phr.replace("Thunderstorm", "Thunder</br>storm").split(" ").join("<br/>");
        outlookIcon[i] = p.icon_code !== undefined ? p.icon_code : 30;
      }

      alerts = [];
      try {
        const alRes = await fetch(`https://api.weather.com/v1/geocode/${lat}/${lon}/alerts.json?language=${CONFIG.language}&apiKey=${apiKey}`);
        if (alRes.ok) {
          const alData = await alRes.json();
          if (alData.alerts) {
            for (let a of alData.alerts) {
              if (a.event_desc) alerts.push(a.event_desc.toUpperCase());
            }
          }
        }
      } catch (e) {}
      alertsActive = alerts.length > 0;
    }
  },

  // =========================================================================
  // 4. OPEN-METEO PROVIDER (Gratuito, global y sin API key)
  // =========================================================================
  OpenMeteoProvider: {
    name: "Open-Meteo (Sin clave)",

    mapWmoToIcon(code, isDay) {
      if (code === undefined || code === null) return isDay ? 30 : 29;
      if (code === 0) return isDay ? 32 : 31;
      if (code === 1) return isDay ? 34 : 33;
      if (code === 2) return isDay ? 30 : 29;
      if (code === 3) return 26;
      if (code === 45 || code === 48) return 20;
      if (code >= 51 && code <= 55) return 9;
      if (code === 56 || code === 57) return 8;
      if (code === 61 || code === 63) return 11;
      if (code === 65) return 12;
      if (code === 66 || code === 67) return 10;
      if (code === 71 || code === 73) return 16;
      if (code === 75) return 42;
      if (code === 77) return 13;
      if (code === 80 || code === 81) return isDay ? 39 : 45;
      if (code === 82) return 40;
      if (code === 85 || code === 86) return isDay ? 41 : 46;
      if (code === 95) return isDay ? 38 : 47;
      if (code === 96 || code === 99) return 3;

      return isDay ? 30 : 29;
    },

    getWmoDescription(code) {
      const map = {
        0: "Clear Sky", 1: "Mainly Clear", 2: "Partly Cloudy", 3: "Overcast",
        45: "Fog", 48: "Depositing Rime Fog", 51: "Light Drizzle", 53: "Moderate Drizzle",
        55: "Dense Drizzle", 61: "Slight Rain", 63: "Moderate Rain", 65: "Heavy Rain",
        71: "Slight Snow", 73: "Moderate Snow", 75: "Heavy Snow", 77: "Snow Grains",
        80: "Rain Showers", 81: "Moderate Showers", 82: "Violent Showers",
        85: "Snow Showers", 86: "Heavy Snow Showers", 95: "Thunderstorm",
        96: "Thunderstorm With Hail", 99: "Heavy Hail Thunderstorm"
      };
      return map[code] || "Partly Cloudy";
    },

    async fetch(lat, lon, units) {
      const isMetric = units === "m";
      const tempUnit = isMetric ? "celsius" : "fahrenheit";
      const windUnit = isMetric ? "kmh" : "mph";

      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,surface_pressure,wind_speed_10m,wind_direction_10m,wind_gusts_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&forecast_days=10&temperature_unit=${tempUnit}&wind_speed_unit=${windUnit}&timezone=auto`;

      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Open-Meteo error (${res.status})`);
      }
      const data = await res.json();
      const cur = data.current || {};
      const daily = data.daily || {};

      const isDaytime = cur.is_day !== undefined ? !!cur.is_day : true;
      currentTemperature = Math.round(cur.temperature_2m || 0);
      currentCondition = this.getWmoDescription(cur.weather_code);
      currentIcon = this.mapWmoToIcon(cur.weather_code, isDaytime);

      const wCard = WeatherProviders.degToCompass(cur.wind_direction_10m);
      const wSpeed = Math.round(cur.wind_speed_10m || 0);
      const uLabel = isMetric ? "km/h" : "mph";
      windSpeed = `${wCard} ${wSpeed} ${uLabel}`;

      const gSpeed = cur.wind_gusts_10m ? Math.round(cur.wind_gusts_10m) : null;
      gusts = gSpeed ? `${gSpeed} ${uLabel}` : "NONE";

      feelsLike = Math.round(cur.apparent_temperature !== undefined ? cur.apparent_temperature : currentTemperature);
      humidity = Math.round(cur.relative_humidity_2m || 50);
      visibility = 10;
      dewPoint = Math.round(currentTemperature - ((100 - humidity) / 5));

      const pressObj = WeatherProviders.formatPressure(cur.surface_pressure, isMetric);
      pressure = pressObj.formatted;
      pressureTrend = "▲";

      isDay = isDaytime;

      const tMax = daily.temperature_2m_max ? Math.round(daily.temperature_2m_max[0]) : currentTemperature;
      const tMin = daily.temperature_2m_min ? Math.round(daily.temperature_2m_min[0]) : currentTemperature - 10;
      const tomMax = daily.temperature_2m_max ? Math.round(daily.temperature_2m_max[1]) : currentTemperature;
      const tomMin = daily.temperature_2m_min ? Math.round(daily.temperature_2m_min[1]) : currentTemperature - 10;

      const tPop = daily.precipitation_probability_max ? daily.precipitation_probability_max[0] : 0;
      const tomPop = daily.precipitation_probability_max ? daily.precipitation_probability_max[1] : 0;

      forecastTemp[0] = tMax;
      forecastIcon[0] = this.mapWmoToIcon(daily.weather_code ? daily.weather_code[0] : 1, true);
      forecastNarrative[0] = `Today: ${this.getWmoDescription(daily.weather_code ? daily.weather_code[0] : 1)}. High ${tMax}\u00B0.`;
      forecastPrecip[0] = `${tPop}% Chance<br/> of Precip`;

      forecastTemp[1] = tMin;
      forecastIcon[1] = this.mapWmoToIcon(daily.weather_code ? daily.weather_code[0] : 1, false);
      forecastNarrative[1] = `Tonight: Low ${tMin}\u00B0. Winds light.`;
      forecastPrecip[1] = `${tPop}% Chance<br/> of Precip`;

      forecastTemp[2] = tomMax;
      forecastIcon[2] = this.mapWmoToIcon(daily.weather_code ? daily.weather_code[1] : 1, true);
      forecastNarrative[2] = `Tomorrow: High ${tomMax}\u00B0. ${this.getWmoDescription(daily.weather_code ? daily.weather_code[1] : 1)}.`;
      forecastPrecip[2] = `${tomPop}% Chance<br/> of Precip`;

      forecastTemp[3] = tomMin;
      forecastIcon[3] = this.mapWmoToIcon(daily.weather_code ? daily.weather_code[1] : 1, false);
      forecastNarrative[3] = `Tomorrow Night: Low ${tomMin}\u00B0.`;
      forecastPrecip[3] = `${tomPop}% Chance<br/> of Precip`;

      for (let i = 0; i < 7; i++) {
        const code = (daily.weather_code && daily.weather_code[i + 1] !== undefined) ? daily.weather_code[i + 1] : 1;
        const max = (daily.temperature_2m_max && daily.temperature_2m_max[i + 1] !== undefined && !isNaN(daily.temperature_2m_max[i + 1])) ? Math.round(daily.temperature_2m_max[i + 1]) : "--";
        const min = (daily.temperature_2m_min && daily.temperature_2m_min[i + 1] !== undefined && !isNaN(daily.temperature_2m_min[i + 1])) ? Math.round(daily.temperature_2m_min[i + 1]) : "--";
        const desc = this.getWmoDescription(code).replace("Thunderstorm", "Thunder</br>storm").split(" ").join("<br/>");

        outlookHigh[i] = max;
        outlookLow[i] = min;
        outlookCondition[i] = desc;
        outlookIcon[i] = this.mapWmoToIcon(code, true);
      }

      alerts = [];
      alertsActive = false;
    }
  }
};
