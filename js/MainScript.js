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

const WEEKDAY = ["SUN", "MON", "TUES", "WED", "THU", "FRI", "SAT"];

const jingle = new Audio("assets/music/jingle.wav");

var isDay = true;
var currentLogo;
var currentLogoIndex = 0;
var pageOrder;
var music;
var activeRadarMap = null;

window.onload = function() {
  CONFIG.load();
  preLoadMusic();
  setMainBackground();
  resizeWindow();
  setClockTime();

  var isElectron = (typeof window.electronAPI !== 'undefined' && window.electronAPI && window.electronAPI.isElectron);
  var hasSavedLoc = !!localStorage.getItem('lastLocationJson');

  if (isElectron || hasSavedLoc) {
    // Arranque directo broadcast sin bloqueos
    hideSettings();
    CONFIG.boot();
  } else {
    showSettings();
  }
};

function preLoadMusic(){
  // Pistas de música disponibles en assets/music: 2.wav a 12.wav
  var index = Math.floor(Math.random() * 11) + 2;
  music = new Audio("assets/music/" + index + ".wav");
}

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

  var idPageItem = {
    name: "Headend ID",
    subpages: [{ name: "headend-id-page", duration: 7000 }]
  };

  var idPos = (window.CONFIG && window.CONFIG.idScreenPosition) ? window.CONFIG.idScreenPosition : 'end';
  if (idPos === 'start') {
    baseSequence.unshift(idPageItem);
  } else if (idPos === 'end') {
    baseSequence.push(idPageItem);
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
  createLogoElements();
  setCurrentConditions();
  setHeadendIdPage();
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

function startAnimation(){
  setInitialPositionCurrentPage();

  jingle.play().catch(e => console.warn("Jingle autoplay notice:", e));
  setTimeout(startMusic, 5000);
  executeGreetingPage();
}

function startMusic(){
  if (music) {
    music.play().catch(e => console.warn("Music autoplay notice:", e));
  }
}

function hideSettings(){
  getElement('settings-prompt').classList.add('hide');
  getElement('settings-container').style.pointerEvents = 'none';
}

function executeGreetingPage(){
  getElement('background-image').classList.remove("below-screen");
  getElement('content-container').classList.add('shown');
  getElement('infobar-twc-logo').classList.add('shown');
  getElement('hello-text').classList.add('shown');
  getElement('hello-location-text').classList.add('shown');
  getElement('greeting-text').classList.add('shown');
  getElement('local-logo-container').classList.add("shown");

  if (window.TTSNarration) {
    TTSNarration.speak('greeting');
  }

  setTimeout(clearGreetingPage, 2500);
}

function clearGreetingPage(){
  getElement('greeting-text').classList.remove('shown');
  getElement('local-logo-container').classList.remove('shown');

  getElement('greeting-text').classList.add('hidden');
  getElement('hello-text-container').classList.add('hidden');
  getElement("hello-location-container").classList.add("hidden");
  getElement("local-logo-container").classList.add("hidden");

  schedulePages();
  loadInfoBar();
  revealTimeline();
  setTimeout(showCrawl, 3000);
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
  if(pageIndex === 0 && subPageIndex == 0){
    currentSubPageElement.style.top = '0px';
  }
  else{
    currentSubPageElement.style.left = '0px';
  }

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
    if (window.TTSNarration) TTSNarration.speak('today', { narrative: forecastNarrative[0] });
  }
  else if(currentSubPageName == 'tonight-page'){
    if (window.TTSNarration) TTSNarration.speak('tonight', { narrative: forecastNarrative[1] });
  }
  else if(currentSubPageName == 'tomorrow-page'){
    if (window.TTSNarration) TTSNarration.speak('tomorrow', { narrative: forecastNarrative[2] });
  }
  else if(currentSubPageName == '7day-page'){
    if (window.TTSNarration) TTSNarration.speak('outlook');
  }
  else if(currentSubPageName == 'headend-id-page'){
    if (window.TTSNarration) TTSNarration.speak('idScreen');
  }
}

function clearPage(pageIndex, subPageIndex){
  var currentPage = pageOrder[pageIndex];
  var currentSubPageName = currentPage.subpages[subPageIndex].name;
  var currentSubPageElement = getElement(currentSubPageName);
  var subPageCount = currentPage.subpages.length;

  var isNewPage = subPageCount-1 == subPageIndex;
  var isLastPage = pageIndex >= pageOrder.length-1 && subPageIndex >= pageOrder[pageOrder.length-1].subpages.length-1;

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

    // Mapa base oscuro idéntico a TWC
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 18,
      subdomains: 'abcd'
    }).addTo(activeRadarMap);

    var res = await fetch('https://api.rainviewer.com/public/weather-maps.json');
    if (res.ok) {
      var rvData = await res.json();
      var frames = rvData.radar && rvData.radar.past;
      if (frames && frames.length > 0) {
        var latest = frames[frames.length - 1];
        var radarUrl = rvData.host + latest.path + '/256/{z}/{x}/{y}/2/1_1.png';
        L.tileLayer(radarUrl, {
          opacity: 0.75,
          maxZoom: 12,
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

  if (typeof L === 'undefined') {
    if (zoomedRadarImage) container.appendChild(zoomedRadarImage);
    return;
  }

  try {
    var zoomedMap = L.map(container, {
      attributionControl: false,
      zoomControl: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      dragging: false
    }).setView([latitude, longitude], 10);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 18,
      subdomains: 'abcd'
    }).addTo(zoomedMap);

    var res = await fetch('https://api.rainviewer.com/public/weather-maps.json');
    if (res.ok) {
      var rvData = await res.json();
      var frames = rvData.radar && rvData.radar.past;
      if (frames && frames.length > 0) {
        var latest = frames[frames.length - 1];
        var radarUrl = rvData.host + latest.path + '/256/{z}/{x}/{y}/2/1_1.png';
        L.tileLayer(radarUrl, {
          opacity: 0.75,
          maxZoom: 12,
          zIndex: 10
        }).addTo(zoomedMap);
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
  var pressureArray = (pressure ? pressure.toString() : "1013").split('.');
  animateValue("cc-visibility", 0, visibility || 10, 800, 1);
  animateValue("cc-humidity", 0, humidity || 50, 1000, 1);
  animateValue("cc-dewpoint", 0, dewPoint || 15, 1200, 1);
  animateValue("cc-feelslike", 0, (feelsLike !== undefined && feelsLike !== null) ? feelsLike : currentTemperature, 1000, 1);
  animateValue("cc-pressure1", 0, pressureArray[0] || "0", 1400, 1);
  animateValue("cc-pressure2", 0, pressureArray[1] || "0", 1400, 2);
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
    'tonight-page', 'tomorrow-page', 'tomorrow-night-page', '7day-page',
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

  // Reset greeting page components
  var helloLoc = getElement("hello-location-container");
  var helloText = getElement("hello-text-container");
  var greetText = getElement("greeting-text-container");
  var localLogo = getElement("local-logo-container");
  if (helloLoc) helloLoc.classList.remove("hidden");
  if (helloText) helloText.classList.remove("hidden");
  if (greetText) greetText.classList.remove("hidden");
  if (localLogo) localLogo.classList.remove("hidden");

  // Reset Infobar state
  ['infobar-twc-logo', 'infobar-local-logo', 'infobar-location-container', 'infobar-time-container'].forEach(id => {
    var el = getElement(id);
    if (el) el.classList.remove('hidden', 'shown');
  });

  if (activeRadarMap) {
    try { activeRadarMap.remove(); } catch(e){}
    activeRadarMap = null;
  }

  currentLogoIndex = 0;
  currentLogo = null;
  resetProgressBar();
}

function restartSequenceInMemory(){
  resetVisualState();
  preLoadMusic();
  fetchCurrentWeather();
}

function loadInfoBar(){
  ['infobar-local-logo', 'infobar-location-container', 'infobar-time-container'].forEach(id => {
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

  setTimeout(setClockTime, 1000);
}

function animateValue(id, start, end, duration, pad) {
  var obj = getElement(id);
  if (!obj) return;
  var numStart = parseInt(start, 10);
  var numEnd = parseInt(end, 10);
  if (isNaN(numStart)) numStart = 0;
  if (isNaN(numEnd)) numEnd = 0;

  if (numStart === numEnd) {
    obj.innerHTML = numEnd.pad(pad);
    return;
  }
  var range = numEnd - numStart;
  var current = numStart;
  var increment = numEnd > numStart ? 1 : -1;
  var stepTime = Math.abs(Math.floor(duration / (range || 1)));
  if (stepTime < 10) stepTime = 10;
  var timer = setInterval(function() {
      current += increment;
      obj.innerHTML = current.pad(pad);
      if (current == numEnd) {
          clearInterval(timer);
      }
  }, stepTime);
}

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
    renderFrame.style.transform = "scale(" + scale + ") translate(-50%, -50%)";
  }
  setTimeout(resizeWindow, 1000);
}

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
  resetVisualState();
  await fetchCurrentWeather();
}
window.hotReloadPresentation = hotReloadPresentation;
