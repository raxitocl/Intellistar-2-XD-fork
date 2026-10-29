/**
 * InformationSetting.js
 * Configuración visual y poblado de elementos DOM para IntelliStar 2 XD.
 */

function setGreetingPage(){
  var rawCity = cityName || (CONFIG.selectedLocation ? (CONFIG.selectedLocation.city || CONFIG.selectedLocation.name) : "");
  var cleanCity = (typeof LocationSearch !== 'undefined' && LocationSearch.sanitizeCityName)
    ? LocationSearch.sanitizeCityName(rawCity)
    : rawCity.replace(/^(Provincia de|Regi[oó]n de|Comuna de|County of)\s+/i, "").replace(/,\s*$/, "").trim();

  getElement("hello-location-text").innerHTML = cleanCity ? cleanCity + "," : "";
  getElement("infobar-location-text").innerHTML = cleanCity;
  getElement("greeting-text").innerHTML = CONFIG.greeting || "This is your weather";
  getElement("crawl-text").innerHTML = CONFIG.crawl || "";
}

function setHeadendIdPage(){
  var locEl = getElement("id-location-val");
  var stateEl = getElement("id-state-val");
  var stationEl = getElement("id-station-val");
  var providerEl = getElement("id-provider-val");
  var timeEl = getElement("id-time-val");

  // Nuevos elementos auténticos IntelliStar 2 XD (Imagen 2)
  var hLocEl = getElement("headend-loc-text");
  var hIdEl = getElement("headend-id-text");
  var hProvEl = getElement("headend-provider-text");
  var hChanEl = getElement("headend-channel-text");
  var hTimeEl = getElement("headend-time-text");

  var rawCity = cityName || (CONFIG.selectedLocation ? (CONFIG.selectedLocation.city || CONFIG.selectedLocation.name) : "");
  var cleanCity = (typeof LocationSearch !== 'undefined' && LocationSearch.sanitizeCityName)
    ? LocationSearch.sanitizeCityName(rawCity)
    : rawCity.replace(/^(Provincia de|Regi[oó]n de|Comuna de|County of)\s+/i, "").replace(/,\s*$/, "").trim();

  var cName = countryName || (CONFIG.selectedLocation && CONFIG.selectedLocation.countryName) || (CONFIG.countryCode || "");
  var sName = stateName || (CONFIG.selectedLocation && CONFIG.selectedLocation.state) || (CONFIG.selectedLocation && CONFIG.selectedLocation.countryCode) || "";
  
  var fullLocationStr = cleanCity + (sName && sName !== "--" ? ", " + sName : (cName ? ", " + cName : ""));

  if (locEl) locEl.innerHTML = fullLocationStr;
  if (stateEl) stateEl.innerHTML = sName || "--";
  if (hLocEl) hLocEl.innerText = fullLocationStr;

  var stId = stationId || (CONFIG.selectedLocation && CONFIG.selectedLocation.stationId) || "";
  if (stationEl) stationEl.innerHTML = stId || "--";
  if (hIdEl) hIdEl.innerText = "Local weather ID: " + (stId || "n/a");

  var provMap = {
    "google": "Google Maps Platform Weather API",
    "openweathermap": "OpenWeatherMap One Call 4.0",
    "twc": "The Weather Channel (TWC Direct)",
    "openmeteo": "Open-Meteo High-Resolution (Free)"
  };
  var provStr = provMap[CONFIG.provider] || (CONFIG.provider ? CONFIG.provider.toUpperCase() : "The Weather Channel");
  if (providerEl) providerEl.innerHTML = provStr;

  // Cable operator & Channel
  var cableName = (CONFIG && CONFIG.cableProvider) ? CONFIG.cableProvider : "Spectrum";
  var cableChan = (CONFIG && CONFIG.cableChannel) ? CONFIG.cableChannel : "HD channel 211";
  if (hProvEl) hProvEl.innerHTML = cableName + ' <span class="headend-arrow">▶</span>';
  if (hChanEl) hChanEl.innerText = cableChan;

  // Formatear fecha y hora auténtica de emisión
  var now = new Date();
  var daysEn = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  var monthsEn = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  var dayName = daysEn[now.getDay()];
  var monthName = monthsEn[now.getMonth()];
  var dayNum = now.getDate();
  var yearNum = now.getFullYear();
  var hrs = now.getHours();
  var mins = now.getMinutes();
  var ampm = hrs >= 12 ? "PM" : "AM";
  var hrs12 = hrs % 12 || 12;
  var minsPad = mins < 10 ? "0" + mins : mins;

  var formattedBroadcastDate = dayName + ", " + monthName + " " + dayNum + ", " + yearNum + "- " + hrs12 + ":" + minsPad + ampm;

  if (timeEl) timeEl.innerHTML = now.toLocaleDateString() + " " + now.toLocaleTimeString();
  if (hTimeEl) hTimeEl.innerText = formattedBroadcastDate;
}

function setLowerThirdBar(){
  var rawCity = cityName || (CONFIG.selectedLocation ? (CONFIG.selectedLocation.city || CONFIG.selectedLocation.name) : "");
  var cleanCity = (typeof LocationSearch !== 'undefined' && LocationSearch.sanitizeCityName)
    ? LocationSearch.sanitizeCityName(rawCity)
    : rawCity.replace(/^(Provincia de|Regi[oó]n de|Comuna de|County of)\s+/i, "").replace(/,\s*$/, "").trim();

  // Reloj digital en vivo
  var ltClock = getElement('lower-third-clock');
  if (ltClock) {
    var now = new Date();
    var h = now.getHours();
    var m = now.getMinutes();
    var padM = m < 10 ? '0' + m : m;
    var padH = h < 10 ? '0' + h : h;
    ltClock.innerText = padH + ':' + padM;
  }

  // Nombre de Ciudad
  var ltCity = getElement('lt-city-name');
  if (ltCity) {
    ltCity.innerText = cleanCity || "SANTIAGO";
  }

  // Icono miniatura
  var ltIcon = getElement('lt-weather-icon');
  if (ltIcon) {
    var code = (currentIcon !== undefined && currentIcon !== null) ? currentIcon : 30;
    ltIcon.innerHTML = '<img src="assets/icons/conditions/' + code + '.svg" style="width: 34px; height: 34px; vertical-align: middle;" alt="Icon" />';
  }

  // Rango Térmico
  var ltRange = getElement('lt-temp-range');
  if (ltRange) {
    var high = (outlookHigh && outlookHigh[0] !== undefined) ? outlookHigh[0] : (currentTemperature || "--");
    var low = (outlookLow && outlookLow[0] !== undefined) ? outlookLow[0] : "--";
    var unitSymbol = '°';
    ltRange.innerText = high + unitSymbol + ' / ' + low + unitSymbol;
  }

  // Viento
  var ltWind = getElement('lt-wind-val');
  if (ltWind) {
    var wSpd = windSpeed || "0";
    var wDir = windDirection || "";
    var unitStr = CONFIG.units === 'm' ? 'km/h' : 'mph';
    ltWind.innerText = wSpd + ' ' + unitStr + (wDir ? ' ' + wDir : '');
  }

  // Ticker Secundario
  var ltTicker = getElement('lower-third-ticker-text');
  if (ltTicker) {
    ltTicker.innerText = (CONFIG && CONFIG.secondaryTickerText) 
      ? CONFIG.secondaryTickerText 
      : 'The Weather Channel - Local on the 8s | Reportes meteorológicos continuos las 24 horas';
  }
}

function setTimelineEvents(){
  var eventContainer = getElement('timeline-event-container');
  var progreessBarStack = getElement('progress-stack');
  eventContainer.innerHTML = '';
  progreessBarStack.innerHTML = '';

  for(var i = 0; i < pageOrder.length; i++){
    var eventElement = document.createElement("div");
    eventElement.innerHTML = pageOrder[i].name;
    eventElement.classList.add("regular-text");
    eventElement.classList.add("timeline-item");
    eventElement.style.transitionDelay = (i*200).toString() + "ms";
    eventContainer.appendChild(eventElement);

    if(i != 0){
      var progressElement = document.createElement("div");
      progressElement.classList.add("timeline-bar");
      progreessBarStack.appendChild(progressElement);
    }
  }
}

function setCurrentConditions(){
  getElement('cc-condition').innerHTML = currentCondition || "Fair";
  getElement('cc-wind').innerHTML = windSpeed || "CALM";
  getElement('cc-gusts').innerHTML = gusts || "NONE";
  getElement('cc-feelslike').innerHTML = (feelsLike !== undefined && feelsLike !== null) ? feelsLike : "--";

  if (pressure) {
    var pStr = pressure.toString();
    var parts = pStr.split('.');
    getElement('cc-pressure1').innerHTML = parts[0] || "--";
    getElement('cc-pressure2').innerHTML = parts[1] || "00";
  } else {
    getElement('cc-pressure1').innerHTML = "29";
    getElement('cc-pressure2').innerHTML = "92";
  }
  getElement('cc-pressuretrend').innerHTML = pressureTrend || "";

  var uEl = getElement('cc-visibility-unit');
  if (uEl) {
    uEl.innerHTML = CONFIG.units === 'm' ? 'km' : 'Miles';
  }
  var iconCode = (currentIcon !== undefined && currentIcon !== null) ? currentIcon : 30;
  var ccIconEl = getElement('ccicon');
  if (ccIconEl) {
    ccIconEl.href.baseVal = 'assets/icons/conditions/' + iconCode + '.svg';
  }
}

function createLogoElements(){
  var logoStack = getElement('logo-stack');
  logoStack.innerHTML = '';
  var alreadyAddedLogos = [];
  for(var p = 0; p < pageOrder.length; p++){
    for (var s = 0; s < pageOrder[p].subpages.length; s++) {
      var currentPage = getPageLogoFileName(pageOrder[p].subpages[s].name);

      if(!alreadyAddedLogos.includes(currentPage)){
        var logo = new Image();
        logo.style.width = '85px';
        logo.style.height = '85px';
        logo.style.marginRight = '20px';
        logo.src = 'assets/timeline/' + currentPage;
        logoStack.appendChild(logo);
        alreadyAddedLogos.push(currentPage);
      }
    }
  }
}

// Pronóstico individual detallado (Today, Tonight, Tomorrow, Tomorrow Night)
function setForecast(){
  var forecastNarrativeElement = [
    getElement("today-narrative-text"),
    getElement("tonight-narrative-text"),
    getElement("tomorrow-narrative-text"),
    getElement("tomorrow-night-narrative-text")
  ];

  var forecastTempElement = [
    getElement("today-forecast-temp"),
    getElement("tonight-forecast-temp"),
    getElement("tomorrow-forecast-temp"),
    getElement("tomorrow-night-forecast-temp")
  ];

  var forecastIconElement = [
    getElement("today-forecast-icon"),
    getElement("tonight-forecast-icon"),
    getElement("tomorrow-forecast-icon"),
    getElement("tomorrow-night-forecast-icon")
  ];

  var forecastPrecipElement = [
    getElement("today-forecast-precip"),
    getElement("tonight-forecast-precip"),
    getElement("tomorrow-forecast-precip"),
    getElement("tomorrow-night-forecast-precip")
  ];

  for (var i = 0; i < 4; i++) {
    if (forecastNarrativeElement[i]) {
      forecastNarrativeElement[i].innerHTML = forecastNarrative[i] || "";
    }
    if (forecastTempElement[i]) {
      forecastTempElement[i].innerHTML = (forecastTemp[i] !== undefined && forecastTemp[i] !== null) ? forecastTemp[i] : "--";
    }
    if (forecastPrecipElement[i]) {
      forecastPrecipElement[i].innerHTML = forecastPrecip[i] || "0% Chance<br/> of Precip";
    }

    var iconCode = (forecastIcon[i] !== undefined && forecastIcon[i] !== null) ? forecastIcon[i] : 30;
    var icon = new Image();
    icon.style.width = '100%';
    icon.style.height = '100%';
    // Meteocons Fill incluye animación nativa SMIL interna autónoma
    icon.src = 'assets/icons/conditions/' + iconCode + '.svg';
    if (forecastIconElement[i]) {
      forecastIconElement[i].innerHTML = '';
      forecastIconElement[i].appendChild(icon);
    }
  }
}

// Pronóstico extendido a 7 días
function setOutlook(){
  for (var i = 0; i < 7; i++) {
    var textElement = getElement("day" + i + "-text");
    var highElement = getElement("day" + i + "-high");
    var lowElement = getElement("day" + i + "-low");
    var conditionElement = getElement("day" + i + "-condition");
    var containerElement = getElement("day" + i + "-container");
    var iconElement = getElement("day" + i + "-icon");
    var dayIndex = (new Date().getDay() + i + 1) % 7;

    var iconCode = (outlookIcon[i] !== undefined && outlookIcon[i] !== null) ? outlookIcon[i] : 30;
    var icon = new Image();
    icon.style.width = '100%';
    icon.style.height = '100%';
    // Meteocons Fill incluye animación nativa SMIL interna autónoma
    icon.src = 'assets/icons/conditions/' + iconCode + '.svg';
    if (iconElement) {
      iconElement.innerHTML = '';
      iconElement.appendChild(icon);
    }

    var isWeekend = dayIndex == 0 || dayIndex == 6;
    if(containerElement){
      containerElement.style.backgroundColor = isWeekend ? "transparent" : "rgba(0, 0, 0, 0.25)";
    }
    if (textElement) textElement.innerHTML = WEEKDAY[dayIndex];
    if (highElement) highElement.innerHTML = (outlookHigh[i] !== undefined && outlookHigh[i] !== null) ? outlookHigh[i] : "--";
    if (lowElement) lowElement.innerHTML = (outlookLow[i] !== undefined && outlookLow[i] !== null) ? outlookLow[i] : "--";
    if (conditionElement) conditionElement.innerHTML = outlookCondition[i] || "Fair";
  }
}

function setAlertPage(){
  if(alerts.length === 0)
    return;

  if(alerts.length == 1){
    var sAlert = getElement("single-alert0");
    if (sAlert) sAlert.innerHTML = alerts[0];
  }
  else{
    for(var i = 0; i < Math.min(3, alerts.length); i++){
      var idName = 'alert' + i;
      var aEl = getElement(idName);
      if (aEl) aEl.innerHTML = alerts[i];
    }
  }
}

function setInitialPositionCurrentPage(){
  if(pageOrder && pageOrder[0] && pageOrder[0].subpages && pageOrder[0].subpages[0].name == 'current-page'){
    getElement('current-page').style.left = '0px';
  }
  else{
    var cp = getElement('current-page');
    if (cp) cp.style.top = '0px';
  }
}

function getPageLogoFileName(subPageName){
  switch (subPageName) {
    case "single-alert-page":
    case "multiple-alerts-page":
    case "headend-id-page":
      return "8logo.svg";

    case "current-page":
      return "thermometer.svg";

    case "radar-page":
      return "radar1.svg";

    case "zoomed-radar-page":
      return "radar2.svg";

    case "today-page":
    case "tonight-page":
    case "tomorrow-page":
    case "tomorrow-night-page":
      return "calendar.svg";

    case "7day-page":
      return "week.svg";

    default:
      return "8logo.svg";
  }
}
