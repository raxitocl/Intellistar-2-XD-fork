// Preset timeline sequences
const MORNING = [
  {name: "Now", subpages: [{name: "current-page", duration: 9000}, {name: "radar-page", duration: 8000}]},
  {name: "Today", subpages: [{name: "today-page", duration: 10000}]},
  {name: "Tonight", subpages: [{name: "tonight-page", duration: 10000}]},
  {name: "Beyond", subpages: [{name: "tomorrow-page", duration: 10000}, {name: "7day-page", duration: 13000}]}
];

const NIGHT = [
  {name: "Now", subpages: [{name: "current-page", duration: 9000}, {name: "radar-page", duration: 8000}]},
  {name: "Tonight", subpages: [{name: "tonight-page", duration: 10000}]},
  {name: "Beyond", subpages: [{name: "tomorrow-page", duration: 10000}, {name: "tomorrow-night-page", duration: 10000}, {name: "7day-page", duration: 13000}]}
];

const SINGLE = [
  {name: "Alert", subpages: [{name: "single-alert-page", duration: 7000}]},
  {name: "Now", subpages: [{name: "current-page", duration: 8000}, {name: "radar-page", duration: 8000}, {name: "zoomed-radar-page", duration: 8000}]},
  {name: "Tonight", subpages: [{name: "tonight-page", duration: 8000}]},
  {name: "Beyond", subpages: [{name: "tomorrow-page", duration: 8000}, {name: "7day-page", duration: 13000}]}
];

const MULTIPLE = [
  {name: "Alerts", subpages: [{name: "multiple-alerts-page", duration: 7000}]},
  {name: "Now", subpages: [{name: "current-page", duration: 8000}, {name: "radar-page", duration: 8000}, {name: "zoomed-radar-page", duration: 8000}]},
  {name: "Tonight", subpages: [{name: "tonight-page", duration: 8000}]},
  {name: "Beyond", subpages: [{name: "tomorrow-page", duration: 8000}, {name: "7day-page", duration: 13000}]}
];

// WEEKDAY inicializado globalmente en Conditions.js

const jingle = new Audio("assets/music/jingle.wav");

var isDay = true;
var currentLogo;
var currentLogoIndex = 0;
var pageOrder;
var music;
var activeRadarMap = null;
var activeZoomedRadarMap = null;

window.onload = function() {
  CONFIG.load();
  preLoadMusic();
  setMainBackground();
  resizeWindow();
  setClockTime();

  // Arranque directo broadcast de inmediato (tanto en WebApp como en navegador web)
  hideSettings();
  CONFIG.boot();
};

function preLoadMusic(){
  if (music) {
    try {
      music.pause();
      music.src = "";
      music.load();
    } catch (e) {}
    music = null;
  }
  // Pistas de música disponibles en assets/music: 2.wav a 12.wav
  var index = Math.floor(Math.random() * 11) + 2;
  music = new Audio("assets/music/" + index + ".wav");
  music.loop = true;
  music.volume = 0.45;
  jingle.volume = 0.70;
}

window.setMusicVolume = function(targetVol, durationMs = 300) {
  if (!music) return;
  if (window._musicFadeInterval) {
    clearInterval(window._musicFadeInterval);
    window._musicFadeInterval = null;
  }
  var startVol = music.volume;
  var startTime = performance.now();
  window._musicFadeInterval = setInterval(function() {
    var elapsed = performance.now() - startTime;
    var progress = Math.min(1, elapsed / durationMs);
    music.volume = Math.max(0, Math.min(1, startVol + (targetVol - startVol) * progress));
    if (progress >= 1) {
      clearInterval(window._musicFadeInterval);
      window._musicFadeInterval = null;
    }
  }, 25);
};

/* Set the timeline page order depending on time of day, alerts, and headend ID configuration */
function scheduleTimeline(){
  var baseSequence;
  if(alerts.length == 1){
    baseSequence = JSON.parse(JSON.stringify(SINGLE));
  }else if(alerts.length > 1){
    baseSequence = JSON.parse(JSON.stringify(MULTIPLE));
  }else if(isDay){
    baseSequence = JSON.parse(JSON.stringify(MORNING));
  }else{
    baseSequence = JSON.parse(JSON.stringify(NIGHT));
  }

  var almanacPageItem = {
    name: "Almanac",
    subpages: [{ name: "almanac-page", duration: 15000 }]
  };

  var idPageItem = {
    name: "Headend ID",
    subpages: [{ name: "headend-id-page", duration: 9500 }]
  };

  var idPos = (window.CONFIG && window.CONFIG.idScreenPosition) ? window.CONFIG.idScreenPosition : 'end';
  if (idPos === 'start') {
    baseSequence.unshift(idPageItem);
    baseSequence.push(almanacPageItem);
  } else if (idPos === 'end') {
    baseSequence.push(almanacPageItem);
    baseSequence.push(idPageItem);
  } else {
    baseSequence.push(almanacPageItem);
  }

  pageOrder = baseSequence;
  setInformation();
}

function revealTimeline(){
  getElement('timeline-event-container').classList.add('shown');
  getElement('progressbar-container').classList.add('shown');
  getElement('logo-stack').classList.add('shown');
  var timelineElements = document.querySelectorAll(".timeline-item");
  for (var i = 0; i < timelineElements.length; i++) {
    timelineElements[i].style.top = '0px';
  }

  // Activar banner de patrocinio clásico si está habilitado
  if (CONFIG.sponsorBanner !== false) {
    var sponsor = getElement('sponsor-banner-container');
    if (sponsor) sponsor.classList.add('shown');
  }
}

/* Now that all the fetched information is stored in memory, display them in the appropriate elements */
function setInformation(){
  setGreetingPage();
  checkStormMusic();
  setAlertPage();
  setForecast();
  setOutlook();
  if (typeof setAlmanacPage === 'function') setAlmanacPage();
  createLogoElements();
  setCurrentConditions();
  setHeadendIdPage();
  try {
    if (typeof setLowerThirdBar === 'function') setLowerThirdBar();
  } catch(e) {
    console.warn("setLowerThirdBar warning:", e);
  }
  try {
    if (typeof NationalTicker !== 'undefined' && NationalTicker.init) NationalTicker.init();
  } catch(e) {
    console.warn("NationalTicker warning:", e);
  }
  setTimelineEvents();
  setMainBackground();
  hideSettings();
  setTimeout(startAnimation, 1000);
}

/* Fondos dinámicos HD por condición meteorológica y consulta de fotografía de ciudad en Wikipedia Commons */
async function setMainBackground(){
  var bgEl = getElement('background-image');
  if (!bgEl) return;

  var conditionBgs = {
    clearDay: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1920&q=80',
    clearNight: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1920&q=80',
    cloudy: 'https://images.unsplash.com/photo-1534088568595-a066f410bcda?auto=format&fit=crop&w=1920&q=80',
    rain: 'https://images.unsplash.com/photo-1519692933481-e162a57d6721?auto=format&fit=crop&w=1920&q=80',
    snow: 'https://images.unsplash.com/photo-1491002052546-bf38f186af56?auto=format&fit=crop&w=1920&q=80'
  };

  var defaultUrl = isDay ? conditionBgs.clearDay : conditionBgs.clearNight;
  if (currentCondition) {
    var cLower = currentCondition.toLowerCase();
    if (cLower.includes('rain') || cLower.includes('drizzle') || cLower.includes('shower')) defaultUrl = conditionBgs.rain;
    else if (cLower.includes('snow') || cLower.includes('flurr') || cLower.includes('ice')) defaultUrl = conditionBgs.snow;
    else if (cLower.includes('cloud') || cLower.includes('overcast')) defaultUrl = conditionBgs.cloudy;
  }
  bgEl.style.backgroundImage = 'url("' + defaultUrl + '")';

  if (cityName) {
    var cleanCityQuery = cityName.replace(/^(Provincia de|Regi[oó]n de|Comuna de|County of)\s+/i, "").split(',')[0].trim();
    try {
      var wikiUrl = 'https://en.wikipedia.org/w/api.php?action=query&titles=' + encodeURIComponent(cleanCityQuery) + '&prop=pageimages&format=json&pithumbsize=1920&origin=*';
      var res = await fetch(wikiUrl);
      if (res.ok) {
        var data = await res.json();
        var pages = data.query && data.query.pages;
        if (pages) {
          var firstKey = Object.keys(pages)[0];
          if (firstKey && pages[firstKey].thumbnail && pages[firstKey].thumbnail.source) {
            var cityImgUrl = pages[firstKey].thumbnail.source;
            var testImg = new Image();
            testImg.onload = function() {
              bgEl.style.backgroundImage = 'url("' + cityImgUrl + '")';
            };
            testImg.src = cityImgUrl;
          }
        }
      }
    } catch (e) {
      console.log('City background lookup skipped:', e);
    }
  }
}

function checkStormMusic(){
  // Conservar la pista de música seleccionada
}

function installAudioUnlocker() {
  if (window._audioUnlockerInstalled) return;
  window._audioUnlockerInstalled = true;
  var unlock = function() {
    if (jingle && jingle.paused && !jingle.ended) {
      jingle.play().catch(function(e) { console.warn("AudioUnlocker jingle notice:", e); });
    }
    if (music && music.paused && !music.ended) {
      music.play().catch(function(e) { console.warn("AudioUnlocker music notice:", e); });
    }
    window.removeEventListener('pointerdown', unlock);
    window.removeEventListener('keydown', unlock);
  };
  window.addEventListener('pointerdown', unlock, { once: true });
  window.addEventListener('keydown', unlock, { once: true });
}

function startAnimation(){
  installAudioUnlocker();
  jingle.play().catch(e => console.warn("Jingle autoplay notice:", e));
  setTimeout(startMusic, 5000);
  executeGreetingPage();
}

function startMusic(){
  if (music) {
    if (music.volume < 0.45) {
      music.volume = 0.45;
    }
    music.play().catch(e => console.warn("Music autoplay notice:", e));
  }
}

function hideSettings(){
  var prompt = getElement('settings-prompt');
  var container = getElement('settings-container');
  if (prompt) {
    prompt.classList.add('hide');
    prompt.style.pointerEvents = '';
  }
  if (container) {
    container.classList.add('hidden');
    container.style.pointerEvents = '';
  }
}

function executeGreetingPage(){
  var gp = getElement('greeting-page');
  if (gp) gp.style.display = 'block';
  getElement('background-image').classList.remove("below-screen");
  getElement('content-container').classList.add('shown');
  getElement('infobar-twc-logo').classList.add('shown');
  getElement('hello-text').classList.add('shown');
  getElement('hello-location-text').classList.add('shown');
  getElement('greeting-text').classList.add('shown');
  getElement('local-logo-container').classList.add("shown");

  // Iniciar el crawl inferior sincrónicamente con la intro
  showCrawl();

  // Intro puramente musical con fanfarria jingle (sin diálogo de voz en el inicio por diseño)

  // 6.5 segundos para acompañar el jingle completo y la locución TTS
  setTimeout(clearGreetingPage, 6500);
}

function clearGreetingPage(){
  getElement('greeting-text').classList.remove('shown');
  getElement('local-logo-container').classList.remove('shown');

  getElement('greeting-text').classList.add('hidden');
  getElement('hello-text-container').classList.add('hidden');
  getElement("hello-location-container").classList.add("hidden");
  getElement("local-logo-container").classList.add("hidden");

  // Tras completarse la animación de salida (600ms), ocultar greeting-page
  setTimeout(function() {
    var gp = getElement('greeting-page');
    if (gp) gp.style.display = 'none';
  }, 600);

  schedulePages();
  loadInfoBar();
  revealTimeline();
}

// Set start and end times for every sub page.
function schedulePages(){
  var cumlativeTime = 0;
  for(var p = 0; p < pageOrder.length; p++){
    for (var s = 0; s < pageOrder[p].subpages.length; s++) {
      var startTime = cumlativeTime;
      var clearTime = cumlativeTime + pageOrder[p].subpages[s].duration;
      setTimeout(executePage, startTime, p, s);
      setTimeout(clearPage, clearTime, p, s);
      cumlativeTime = clearTime;
    }
  }
}

function getTodayNarrative() {
  var lang = (CONFIG && CONFIG.language) ? CONFIG.language : "es";
  var isSpanish = lang.toLowerCase().indexOf("es") === 0;
  var nat = forecastNarrative[0];
  if (nat && nat.trim() && (!isSpanish || !/^(Today:|Tonight:)/i.test(nat))) {
    return nat;
  }
  var temp = forecastTemp[0] !== undefined ? forecastTemp[0] : currentTemperature;
  var cond = currentCondition || (isSpanish ? "cielo despejado" : "fair");
  if (isSpanish) {
    return "máxima de " + temp + " grados con " + cond + ".";
  } else {
    return "High of " + temp + " degrees with " + cond + ".";
  }
}

function getTonightNarrative() {
  var lang = (CONFIG && CONFIG.language) ? CONFIG.language : "es";
  var isSpanish = lang.toLowerCase().indexOf("es") === 0;
  var nat = forecastNarrative[1];
  if (nat && nat.trim() && (!isSpanish || !/^(Today:|Tonight:)/i.test(nat))) {
    return nat;
  }
  var temp = forecastTemp[1] !== undefined ? forecastTemp[1] : (currentTemperature - 8);
  var cond = currentCondition || (isSpanish ? "cielo despejado" : "fair");
  if (isSpanish) {
    return "mínima de " + temp + " grados con " + cond + ".";
  } else {
    return "Low of " + temp + " degrees with " + cond + ".";
  }
}

function getTomorrowNarrative() {
  var lang = (CONFIG && CONFIG.language) ? CONFIG.language : "es";
  var isSpanish = lang.toLowerCase().indexOf("es") === 0;
  var nat = forecastNarrative[2];
  if (nat && nat.trim() && (!isSpanish || !/^(Today:|Tomorrow:)/i.test(nat))) {
    return nat;
  }
  var temp = forecastTemp[2] !== undefined ? forecastTemp[2] : currentTemperature;
  var rawCond = (outlookCondition && outlookCondition[1]) ? outlookCondition[1] : (currentCondition || (isSpanish ? "cielo despejado" : "fair"));
  var cond = String(rawCond).replace(/<br\s*[\/]?>/gi, " ");
  if (isSpanish) {
    return "máxima estimada en " + temp + " grados con " + cond + ".";
  } else {
    return "High expected around " + temp + " degrees with " + cond + ".";
  }
}

function getTomorrowNightNarrative() {
  var lang = (CONFIG && CONFIG.language) ? CONFIG.language : "es";
  var isSpanish = lang.toLowerCase().indexOf("es") === 0;
  var nat = forecastNarrative[3];
  if (nat && nat.trim() && (!isSpanish || !/^(Today:|Tomorrow:)/i.test(nat))) {
    return nat;
  }
  var temp = forecastTemp[3] !== undefined ? forecastTemp[3] : (currentTemperature - 8);
  if (isSpanish) {
    return "mínima nocturna de " + temp + " grados.";
  } else {
    return "Nighttime low of " + temp + " degrees.";
  }
}

function executePage(pageIndex, subPageIndex){
  var currentPage = pageOrder[pageIndex];
  var currentSubPageName = currentPage.subpages[subPageIndex].name;
  var currentSubPageElement = getElement(currentSubPageName);
  var subPageCount = currentPage.subpages.length;
  var currentSubPageDuration = currentPage.subpages[subPageIndex].duration;

  if (!currentSubPageElement) return;

  if(subPageIndex === 0){
    var pageTime = 0;
    for (var i = 0; i < subPageCount; i++) {
      pageTime += currentPage.subpages[i].duration;
    }
    getElement('progressbar').style.transitionDuration = pageTime + "ms";
    getElement('progressbar').classList.add('progress');
    getElement('timeline-event-container').style.left = (-280*pageIndex).toString() + "px";
    getElement('progress-stack').style.left = (-280*pageIndex).toString() + "px";
  }

  if(currentLogo != getPageLogoFileName(currentSubPageName)){
    getElement('logo-stack').style.left = ((-85*currentLogoIndex)-(20*currentLogoIndex)).toString() + "px";
    currentLogo = getPageLogoFileName(currentSubPageName);
    currentLogoIndex++;
  }

  currentSubPageElement.style.transitionDelay = '0.5s';
  currentSubPageElement.style.left = '0px';
  currentSubPageElement.style.top = '0px';

  var isLastPage = pageIndex >= pageOrder.length-1 && subPageIndex >= pageOrder[pageOrder.length-1].subpages.length-1;
  if(isLastPage)
    setTimeout(hideCrawl, 2000);

  if(currentSubPageName == "current-page"){
    setTimeout(loadCC, 1000);
    setTimeout(scrollCC, currentSubPageDuration / 2);
    animateValue('cc-temperature-text', -50, currentTemperature, 2500, 1);
    animateDialProgress(currentTemperature, 2500);
    if (window.TTSNarration) TTSNarration.speak('now');
  }
  else if(currentSubPageName == 'radar-page'){
    startRadar();
  }
  else if(currentSubPageName == 'zoomed-radar-page'){
    startZoomedRadar();
  }
  else if(currentSubPageName == 'today-page'){
    if (window.TTSNarration) TTSNarration.speak('today', { narrative: getTodayNarrative() });
  }
  else if(currentSubPageName == 'tonight-page'){
    if (window.TTSNarration) TTSNarration.speak('tonight', { narrative: getTonightNarrative() });
  }
  else if(currentSubPageName == 'tomorrow-page'){
    if (window.TTSNarration) TTSNarration.speak('tomorrow', { narrative: getTomorrowNarrative() });
  }
  else if(currentSubPageName == 'tomorrow-night-page'){
    if (window.TTSNarration) TTSNarration.speak('tomorrowNight', { narrative: getTomorrowNightNarrative() });
  }
  else if(currentSubPageName == 'almanac-page'){
    if (typeof setAlmanacPage === 'function') setAlmanacPage();
    if (window.TTSNarration) TTSNarration.speak('almanac');
  }
  else if(currentSubPageName == '7day-page'){
    if (window.TTSNarration) TTSNarration.speak('outlook');
  }
  else if(currentSubPageName == 'headend-id-page'){
    var pAlmanac = getElement('almanac-page');
    if (pAlmanac) pAlmanac.style.left = '-101%';
    var p7 = getElement('7day-page');
    if (p7) p7.style.left = '-101%';
    var fl = getElement('forecast-left-container');
    if (fl) fl.classList.add('hidden');
    var fr = getElement('forecast-right-container');
    if (fr) fr.classList.add('hidden');
    var ot = getElement('outlook-titlebar');
    if (ot) ot.classList.add('hidden');
    if (typeof setHeadendIdPage === 'function') setHeadendIdPage();
    var rawCity = cityName || (CONFIG.selectedLocation ? (CONFIG.selectedLocation.city || CONFIG.selectedLocation.name) : "");
    var cleanCity = (typeof LocationSearch !== 'undefined' && LocationSearch.sanitizeCityName)
      ? LocationSearch.sanitizeCityName(rawCity)
      : rawCity.replace(/^(Provincia de|Regi[oó]n de|Comuna de|County of)\s+/i, "").replace(/,\s*$/, "").trim();
    var sName = stateName || (CONFIG.selectedLocation && CONFIG.selectedLocation.state) || "";
    var cableName = (CONFIG && CONFIG.cableProvider) ? CONFIG.cableProvider : "Spectrum";
    if (window.TTSNarration) TTSNarration.speak('idScreen', { city: cleanCity, state: sName, provider: cableName });
  }
}

function clearPage(pageIndex, subPageIndex){
  var currentPage = pageOrder[pageIndex];
  var currentSubPageName = currentPage.subpages[subPageIndex].name;
  var currentSubPageElement = getElement(currentSubPageName);
  var subPageCount = currentPage.subpages.length;

  var isNewPage = subPageCount-1 == subPageIndex;
  var isLastPage = pageIndex >= pageOrder.length-1 && subPageIndex >= pageOrder[pageOrder.length-1].subpages.length-1;

  if (currentSubPageName === 'almanac-page') {
    var ap = getElement('almanac-page');
    if (ap) ap.style.left = '-101%';
  }

  if (currentSubPageName === 'radar-page' || currentSubPageName === 'zoomed-radar-page') {
    if (typeof NationalTicker !== 'undefined' && NationalTicker.startRotation) {
      NationalTicker.startRotation();
    }
  }

  if (currentSubPageName === '7day-page') {
    var fl = getElement('forecast-left-container');
    if (fl) fl.classList.add('hidden');
    var fr = getElement('forecast-right-container');
    if (fr) fr.classList.add('hidden');
    var ot = getElement('outlook-titlebar');
    if (ot) ot.classList.add('hidden');
  }

  if(isNewPage && !isLastPage){
    resetProgressBar();
  }

  if(isLastPage){
    endSequence();
  }
  else{
    if (currentSubPageElement) {
      currentSubPageElement.style.transitionDelay = '0s';
      currentSubPageElement.style.left = '-101%';
    }
  }
}

function resetProgressBar(){
  getElement('progressbar').style.transitionDuration = '0ms';
  getElement('progressbar').classList.remove('progress');
  void getElement('progressbar').offsetWidth;
}

function addRadarBasemap(mapInstance) {
  var esriBaseUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}';
  var esriRefUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}';

  var cartoKey = (CONFIG && CONFIG.secrets && CONFIG.secrets.cartoApiKey) ? CONFIG.secrets.cartoApiKey.trim() : "";

  if (cartoKey) {
    var cartoUrl = 'https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}{r}.png?api_key=' + encodeURIComponent(cartoKey);
    var cartoLayer = L.tileLayer(cartoUrl, {
      maxZoom: 18,
      subdomains: 'abcd',
      zIndex: 1
    });

    cartoLayer.on('tileerror', function() {
      console.warn("CARTO tile error. Conmutando a mapa base libre Esri World Dark Gray...");
      mapInstance.removeLayer(cartoLayer);
      L.tileLayer(esriBaseUrl, { maxZoom: 18, zIndex: 1 }).addTo(mapInstance);
    });

    cartoLayer.addTo(mapInstance);
  } else {
    // Servicio libre predeterminado (sin claves API ni límites de cuota)
    L.tileLayer(esriBaseUrl, {
      maxZoom: 18,
      zIndex: 1
    }).addTo(mapInstance);
  }

  // Capa de referencias geográficas (ciudades, fronteras) por encima del radar
  L.tileLayer(esriRefUrl, {
    maxZoom: 18,
    zIndex: 20
  }).addTo(mapInstance);
}

/* Radar Global en tiempo real vía Leaflet y RainViewer API */
async function startRadar(){
  var container = getElement('radar-container');
  if (!container) return;
  container.innerHTML = '';
  container.style.width = '1235px';
  container.style.height = '525px';

  var brokenOverlay = document.querySelector('.broken-radar-text');
  if (brokenOverlay) brokenOverlay.style.display = 'none';

  if (activeRadarMap) {
    try { activeRadarMap.remove(); } catch(e){}
    activeRadarMap = null;
  }

  if (typeof NationalTicker !== 'undefined' && NationalTicker.stop) {
    NationalTicker.stop();
  }

  if (typeof L === 'undefined') {
    if (radarImage) container.appendChild(radarImage);
    return;
  }

  try {
    activeRadarMap = L.map(container, {
      attributionControl: false,
      zoomControl: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      dragging: false
    }).setView([latitude, longitude], 8);

    addRadarBasemap(activeRadarMap);

    var res = await fetch('https://api.rainviewer.com/public/weather-maps.json');
    if (res.ok) {
      var rvData = await res.json();
      var frames = rvData.radar && rvData.radar.past;
      if (frames && frames.length > 0) {
        var latest = frames[frames.length - 1];
        var radarUrl = rvData.host + latest.path + '/256/{z}/{x}/{y}/2/1_1.png';
        L.tileLayer(radarUrl, {
          opacity: 0.75,
          maxNativeZoom: 6,
          maxZoom: 18,
          zIndex: 10
        }).addTo(activeRadarMap);
      }
    }
  } catch (e) {
    console.warn("Radar loading error:", e);
    if (radarImage) container.appendChild(radarImage);
  }
}

async function startZoomedRadar(){
  var container = getElement('zoomed-radar-container');
  if (!container) return;
  container.innerHTML = '';
  container.style.width = '1235px';
  container.style.height = '525px';

  if (activeZoomedRadarMap) {
    try { activeZoomedRadarMap.remove(); } catch(e){}
    activeZoomedRadarMap = null;
  }

  if (typeof L === 'undefined') {
    if (zoomedRadarImage) container.appendChild(zoomedRadarImage);
    return;
  }

  try {
    activeZoomedRadarMap = L.map(container, {
      attributionControl: false,
      zoomControl: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      dragging: false
    }).setView([latitude, longitude], 10);

    addRadarBasemap(activeZoomedRadarMap);

    var res = await fetch('https://api.rainviewer.com/public/weather-maps.json');
    if (res.ok) {
      var rvData = await res.json();
      var frames = rvData.radar && rvData.radar.past;
      if (frames && frames.length > 0) {
        var latest = frames[frames.length - 1];
        var radarUrl = rvData.host + latest.path + '/256/{z}/{x}/{y}/2/1_1.png';
        L.tileLayer(radarUrl, {
          opacity: 0.75,
          maxNativeZoom: 6,
          maxZoom: 18,
          zIndex: 10
        }).addTo(activeZoomedRadarMap);
      }
    }
  } catch (e) {
    console.warn("Zoomed radar loading error:", e);
    if (zoomedRadarImage) container.appendChild(zoomedRadarImage);
  }
}

function loadCC(){
  var ccElements = document.querySelectorAll(".cc-vertical-group");
  for (var i = 0; i < ccElements.length; i++) {
    ccElements[i].style.top = '0px';
  }
}

function scrollCC(){
  var ccElements = document.querySelectorAll(".cc-vertical-group");
  for (var i = 0; i < ccElements.length; i++) {
    ccElements[i].style.top = '-80px';
  }
  animateValue("cc-visibility", 0, visibility || 10, 800, 1);
  animateValue("cc-humidity", 0, humidity || 50, 1000, 1);
  animateValue("cc-dewpoint", 0, dewPoint || 15, 1200, 1);
  animateValue("cc-feelslike", 0, (feelsLike !== undefined && feelsLike !== null) ? feelsLike : currentTemperature, 1000, 1);

  var isMetric = (CONFIG && CONFIG.units === "m");
  var pDot = getElement("cc-pressuredot");
  var p2 = getElement("cc-pressure2");
  if (isMetric) {
    if (pDot) pDot.style.display = 'none';
    if (p2) p2.style.display = 'none';
    animateValue("cc-pressure1", 0, pressure ? Math.round(parseFloat(pressure)) : 1013, 1400, 1);
  } else {
    if (pDot) pDot.style.display = 'inline';
    if (p2) p2.style.display = 'inline';
    var pressureArray = (pressure ? pressure.toString() : "29.92").split('.');
    animateValue("cc-pressure1", 0, pressureArray[0] || "29", 1400, 1);
    animateValue("cc-pressure2", 0, pressureArray[1] || "92", 1400, 2);
  }
}

// Called at end of sequence. Animates everything out and shows ending text
function endSequence(){
  clearInfoBar();
}

function twcLogoClick() {
  var alertMessageShown = getElement('alert-message').classList.contains('shown');
  if(alertMessageShown) return;
  var loopStatus = localStorage.getItem('loop');
  if(loopStatus == "y"){
    localStorage.setItem('loop', 'n');
    CONFIG.loop = false;
  }
  else{
    localStorage.setItem('loop', 'y');
    CONFIG.loop = true;
  }
  showLoopMessage();
}

function clearInfoBar(){
  ['infobar-twc-logo', 'infobar-local-logo', 'infobar-location-container', 'infobar-time-container'].forEach(id => {
    var el = getElement(id);
    if (el) {
      el.classList.remove('shown');
      el.classList.add('hidden');
    }
  });
  setTimeout(clearElements, 200);
}

// Animates everything out (not including main background)
function clearElements(){
  getElement("outlook-titlebar").classList.add('hidden');
  getElement("forecast-left-container").classList.add('hidden');
  getElement("forecast-right-container").classList.add('hidden');
  getElement("content-container").classList.add("expand");
  getElement("timeline-container").style.visibility = "hidden";

  var sponsor = getElement('sponsor-banner-container');
  if (sponsor) sponsor.classList.remove('shown');

  if (window.TTSNarration) {
    TTSNarration.cancel();
  }

  if (typeof window.setMusicVolume === 'function') {
    window.setMusicVolume(0, 1500);
  }

  showEnding();
  setTimeout(clearEnd, 2000);
}

function showEnding(){
  if(alertsActive){
    stayUpdated();
  }
  else{
    itsAmazingOutThere();
  }
}

function itsAmazingOutThere(){
  getElement('amazing-text').classList.add('extend');
  getElement("amazing-logo").classList.add('shown');
  getElement("amazing-container").classList.add('hide');
}

function stayUpdated(){
  getElement('updated-text').classList.add('extend');
  getElement("updated-logo").classList.add('shown');
  getElement("updated-container").classList.add('hide');
}

// Final background animate out
function clearEnd(){
  getElement('background-image').classList.add("above-screen");
  getElement('content-container').classList.add("above-screen");
  setTimeout(reloadPage, 400);
}

function reloadPage(){
  var isElectron = (typeof window.electronAPI !== 'undefined' && window.electronAPI && window.electronAPI.isElectron);
  if (CONFIG.loop || isElectron) {
    restartSequenceInMemory();
  } else {
    resetVisualState();
    showSettings();
  }
}

function resetVisualState(){
  getElement('background-image').className = 'below-screen';
  getElement('content-container').className = '';
  getElement('timeline-event-container').innerHTML = '';
  getElement('progress-stack').innerHTML = '';
  getElement('logo-stack').innerHTML = '';
  getElement('radar-container').innerHTML = '';
  getElement('zoomed-radar-container').innerHTML = '';
  getElement('timeline-container').style.visibility = 'visible';
  getElement('outlook-titlebar').classList.remove('hidden');
  getElement('forecast-left-container').classList.remove('hidden');
  getElement('forecast-right-container').classList.remove('hidden');
  getElement('amazing-container').classList.remove('hide');
  getElement('amazing-logo').classList.remove('shown');
  getElement('amazing-text').classList.remove('extend');
  getElement('updated-container').classList.remove('hide');
  getElement('updated-logo').classList.remove('shown');
  getElement('updated-text').classList.remove('extend');
  getElement('crawl-text').classList.remove('animate');
  getElement('crawler-container').classList.remove('shown');
  getElement('crawler-container').classList.remove('hidden');

  var sponsor = getElement('sponsor-banner-container');
  if (sponsor) sponsor.classList.remove('shown');

  // CRITICAL FIX: Pages slide from left: 100%, top: 0px!
  var pages = [
    'current-page', 'radar-page', 'zoomed-radar-page', 'today-page',
    'tonight-page', 'tomorrow-page', 'tomorrow-night-page', 'almanac-page', '7day-page',
    'single-alert-page', 'multiple-alerts-page', 'headend-id-page'
  ];
  pages.forEach(p => {
    var el = getElement(p);
    if (el) {
      el.style.transitionDelay = '0s';
      el.style.left = '100%';
      el.style.top = '0px';
    }
  });

  // Reset vertical groups for CC
  var ccElements = document.querySelectorAll(".cc-vertical-group");
  for (var i = 0; i < ccElements.length; i++) {
    ccElements[i].style.top = '80px';
  }

  // Reset greeting page components
  var gp = getElement("greeting-page");
  if (gp) gp.style.display = 'block';
  var helloLocCont = getElement("hello-location-container");
  var helloTextCont = getElement("hello-text-container");
  var greetTextCont = getElement("greeting-text-container");
  var localLogoCont = getElement("local-logo-container");
  if (helloLocCont) helloLocCont.classList.remove("hidden");
  if (helloTextCont) helloTextCont.classList.remove("hidden");
  if (greetTextCont) greetTextCont.classList.remove("hidden");
  if (localLogoCont) localLogoCont.classList.remove("hidden", "shown");

  var helloLocText = getElement("hello-location-text");
  var helloTextEl = getElement("hello-text");
  var greetTextEl = getElement("greeting-text");
  if (helloLocText) helloLocText.classList.remove("shown");
  if (helloTextEl) helloTextEl.classList.remove("shown");
  if (greetTextEl) greetTextEl.classList.remove("shown", "hidden");

  // Reset Infobar state
  ['infobar-twc-logo', 'infobar-local-logo', 'infobar-location-container', 'infobar-time-container'].forEach(id => {
    var el = getElement(id);
    if (el) el.classList.remove('hidden', 'shown');
  });

  if (activeRadarMap) {
    try { activeRadarMap.remove(); } catch(e){}
    activeRadarMap = null;
  }
  if (activeZoomedRadarMap) {
    try { activeZoomedRadarMap.remove(); } catch(e){}
    activeZoomedRadarMap = null;
  }

  if (typeof NationalTicker !== 'undefined' && NationalTicker.stop) {
    NationalTicker.stop();
  }

  currentLogoIndex = 0;
  currentLogo = null;
  resetProgressBar();
}

function restartSequenceInMemory(){
  resetVisualState();
  if (typeof NationalTicker !== 'undefined' && NationalTicker.startRotation) {
    NationalTicker.startRotation();
  }
  preLoadMusic();
  fetchCurrentWeather();
}

function loadInfoBar(){
  ['infobar-twc-logo', 'infobar-local-logo', 'infobar-location-container'].forEach(id => {
    var el = getElement(id);
    if (el) {
      el.classList.remove('hidden');
      el.classList.add('shown');
    }
  });
}

function setClockTime(){
  var currentTime = new Date();
  var diem = "AM";
  var h = currentTime.getHours();
  var m = currentTime.getMinutes();

  if(h == 0){
    h = 12;
  }
  else if(h > 12){
    h = h - 12;
    diem = "PM";
  }
  if(m < 10){
    m = "0" + m;
  }

  var finalString = h + ":" + m;
  getElement("infobar-time-text").innerHTML = finalString;
  var ltClock = getElement('lower-third-clock');
  if (ltClock) {
    var realHrs = currentTime.getHours();
    var padHrs = realHrs < 10 ? '0' + realHrs : realHrs;
    ltClock.innerText = padHrs + ':' + m;
  }

  setTimeout(setClockTime, 1000);
}

function animateValue(id, start, end, duration, pad) {
  var obj = getElement(id);
  if (!obj) return;
  var numStart = parseInt(start, 10);
  var numEnd = parseInt(end, 10);
  if (isNaN(numStart)) numStart = 0;
  if (isNaN(numEnd)) numEnd = 0;

  var formatVal = function(v) {
    return (typeof v.pad === 'function' && pad) ? v.pad(pad) : v;
  };

  if (numStart === numEnd) {
    obj.innerHTML = formatVal(numEnd);
    return;
  }
  var startTime = performance.now();
  var animDuration = Math.min(duration || 1200, 1400);

  function step(now) {
    var elapsed = now - startTime;
    var progress = Math.min(1, elapsed / animDuration);
    var ease = 1 - Math.pow(1 - progress, 3); // Deceleración cúbica suave
    var current = Math.round(numStart + (numEnd - numStart) * ease);
    obj.innerHTML = formatVal(current);
    if (progress < 1) {
      requestAnimationFrame(step);
    } else {
      obj.innerHTML = formatVal(numEnd);
    }
  }
  requestAnimationFrame(step);
}

window.showApiToast = function(message, type) {
  var toast = getElement('api-toast-notification');
  var msgEl = getElement('api-toast-message');
  var iconEl = getElement('api-toast-icon');
  if (!toast || !msgEl) {
    console.warn("API Notification:", message);
    return;
  }
  msgEl.innerText = message;
  if (iconEl) {
    iconEl.innerText = type === 'error' ? '❌' : '⚠️';
  }
  toast.classList.remove('api-toast-hidden');
  toast.classList.add('api-toast-visible');

  if (window._apiToastTimer) clearTimeout(window._apiToastTimer);
  window._apiToastTimer = setTimeout(function() {
    toast.classList.remove('api-toast-visible');
    toast.classList.add('api-toast-hidden');
  }, 4500);
};

/**
 * Cálculo del color del dial circular según los umbrales de IntelliStar 2 XD:
 * - < 5 °C: Azul (#4dabf7 / rgb(77, 171, 247))
 * - 6 °C a 29 °C: Naranjo con gradiente (#ffd43b -> #f76707)
 * - >= 30 °C: Rojo (#e03131 / rgb(224, 49, 49))
 */
function getTemperatureColor(temperature){
  var tempVal = parseInt(temperature, 10);
  if (isNaN(tempVal)) tempVal = 20;

  // Convertir a Celsius si está en Imperial para aplicar los umbrales exactos pedidos
  var tC = CONFIG.units === 'm' ? tempVal : ((tempVal - 32) * 5 / 9);

  if (tC < 5) {
    return 'rgb(77, 171, 247)'; // Azul
  }
  else if (tC >= 30) {
    return 'rgb(224, 49, 49)'; // Rojo
  }
  else {
    // 6 °C a 29 °C: Gradiente de amarillo/oro a naranja profundo
    var ratio = Math.min(Math.max((tC - 5) / 25, 0), 1);
    return interpolateColor([255, 212, 59], [247, 103, 7], ratio);
  }
}

/**
 * Animación del dial circular (gauge) que se mueve según la cantidad de temperatura.
 * Llena el arco de 270 grados (longitud 155.56 px) proporcionalmente.
 */
function animateDialProgress(temperature, duration) {
  var arcEl = getElement('cc-dial-arc');
  var colorEl = getElement('cc-dial-color');
  var numTemp = parseInt(temperature, 10);
  if (isNaN(numTemp)) numTemp = 20;

  var targetColor = getTemperatureColor(numTemp);
  if (colorEl) colorEl.style.fill = targetColor;

  if (!arcEl) return;
  arcEl.style.stroke = targetColor;

  // El arco completo de 270 grados mide 155.56 px
  var maxArc = 155.56;
  var tC = CONFIG.units === 'm' ? numTemp : ((numTemp - 32) * 5 / 9);

  // Escalar temperatura entre -10 °C (mínimo, 8% del dial) y 40 °C (máximo, 100% del dial)
  var percent = Math.min(Math.max((tC + 10) / 50, 0.08), 1.0);
  var targetOffset = maxArc * (1 - percent);

  // Iniciar desde vacío (155.56) y animar hacia targetOffset
  arcEl.style.strokeDashoffset = '155.56';
  setTimeout(function() {
    arcEl.style.strokeDashoffset = targetOffset.toFixed(2);
  }, 50);
}

Number.prototype.pad = function(size) {
    var s = String(this);
    while (s.length < (size || 2)) {s = "0" + s;}
    return s;
};

// Returns a single rgb color interpolated between two colors.
function interpolateColor(color1, color2, factor) {
  if (arguments.length < 3) {
      factor = 0.5;
  }
  var result = color1.slice();
  for (var i = 0; i < 3; i++) {
      result[i] = Math.round(result[i] + factor * (color2[i] - color1[i]));
  }
  return 'rgb(' + result[0] + ', ' + result[1] + ', ' + result[2] + ')';
}

function resizeWindow(){
  var originalWidth = 1920;
  var originalHeight = 1080;
  var scale = Math.min(window.innerWidth / originalWidth, window.innerHeight / originalHeight);
  var renderFrame = getElement('render-frame');
  if (renderFrame) {
    renderFrame.style.transform = "scale(" + scale + ")";
  }
}
window.onresize = resizeWindow;

function getElement(id){
  return document.getElementById(id);
}

function showCrawl(){
  getElement('crawler-container').classList.add("shown");
  setTimeout(startCrawl, 400);
}

function hideCrawl(){
  getElement('crawler-container').classList.add("hidden");
}

function startCrawl(){
  calculateCrawlSpeed();
  getElement('crawl-text').classList.add('animate');
}

function calculateCrawlSpeed() {
  var crawlTextElement = getElement('crawl-text');
  var elementLength = crawlTextElement.offsetWidth || 1500;
  var speed = (window.CONFIG && window.CONFIG.crawlSpeed) ? window.CONFIG.crawlSpeed : 120;
  var timeTaken = (elementLength + 1250) / speed;
  crawlTextElement.style.animationDuration = timeTaken.toFixed(2) + "s";
}

function showLoopMessage(){
  var loopStatus = ((CONFIG.loop) ? 'enabled' : 'disabled');
  alert("Looping " + loopStatus + ", click TWC logo to toggle");
}

function hideAlertMessage(){
  getElement('alert-message').classList.remove('shown');
}


async function hotReloadPresentation() {
  hideSettings();
  if (window.TTSNarration) {
    TTSNarration.cancel();
  }

  if (typeof window.setMusicVolume === 'function') {
    window.setMusicVolume(0, 1500);
  }
  resetVisualState();
  await fetchCurrentWeather();
}
window.hotReloadPresentation = hotReloadPresentation;
