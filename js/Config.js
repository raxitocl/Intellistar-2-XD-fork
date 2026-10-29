/**
 * Config.js
 * Configuración global e interfaz gráfica On-Demand para IntelliStar 2 XD.
 * Incluye Buscador Universal de Ubicaciones, selección de Modo de Pantalla (Electron),
 * control de TTS, velocidad de Crawl, claves de API y Recarga en Caliente (Hot Reload).
 */

window.CONFIG = {
  crawl: `Thanks to all the contributors of this project. While it's not completely finished, the community effort has made this possible. Stars, contributions, and feedback are welcome and appreciated. Thanks for trying out this emulator.`,
  crawlSpeed: 120, // 80 = Lento, 120 = Normal, 180 = Rápido (px/s)
  greeting: 'This is your weather',
  language: 'en-US',
  countryCode: 'US',
  units: 'm', // 'm' = Métrico (°C, km/h), 'e' = Imperial (°F, mph)
  unitField: 'metric',
  loop: true, // Por defecto en bucle continuo para experiencia broadcast
  provider: 'google', // 'google' | 'openweathermap' | 'twc' | 'openmeteo'
  
  ttsEnabled: true,
  ttsLanguage: 'auto', // 'auto' | 'es' | 'en'
  idScreenPosition: 'end', // 'end' | 'start' | 'none'
  sponsorBanner: true,
  sponsorTitle: 'LOCAL ON THE 8s',

  secrets: {
    twcAPIKey: '71f92ea9dd2f4790b92ea9dd2f779061',
    googleApiKey: '',
    owmApiKey: ''
  },

  selectedLocation: null,
  searchDebounceTimer: null,

  /**
   * Arranque directo broadcast (para Electron o cuando ya existe una ubicación guardada)
   */
  boot: async () => {
    // Cargar perfil guardado
    const savedLocJson = localStorage.getItem('lastLocationJson');
    if (savedLocJson) {
      try {
        CONFIG.selectedLocation = JSON.parse(savedLocJson);
      } catch (e) {}
    }

    // Ubicación de fábrica predeterminada si no hay ninguna previa
    if (!CONFIG.selectedLocation) {
      CONFIG.selectedLocation = {
        label: "Santiago, Región Metropolitana, Chile",
        city: "Santiago",
        state: "Región Metropolitana",
        countryName: "Chile",
        countryCode: "CL",
        stationId: "SCEL",
        lat: -33.4489,
        lon: -70.6693,
        queryText: "Santiago, Chile"
      };
    }

    const loc = CONFIG.selectedLocation;
    latitude = loc.lat;
    longitude = loc.lon;
    cityName = (loc.city || loc.name || "SANTIAGO").toUpperCase();
    stateName = loc.state || "";
    countryName = loc.countryName || loc.countryCode || "Chile";
    stationId = loc.stationId || "SCEL";
    CONFIG.countryCode = loc.countryCode || 'CL';
    CONFIG.unitField = CONFIG.units === 'm' ? 'metric' : 'imperial';

    // Iniciar consulta meteorológica y presentación
    hideSettings();
    if (typeof fetchCurrentWeather === 'function') {
      fetchCurrentWeather();
    }
  },

  /**
   * Guardar configuración y aplicar cambios en caliente (Hot Reload)
   */
  submit: async (btn, e) => {
    const locInput = document.getElementById('location-input');
    const query = locInput ? locInput.value.trim() : '';

    if (query) {
      // Si la ubicación cambió respecto a la seleccionada
      if (!CONFIG.selectedLocation || CONFIG.selectedLocation.queryText !== query) {
        const resolved = await LocationSearch.resolve(query);
        if (resolved) {
          CONFIG.selectedLocation = resolved;
        }
      }
    }

    if (CONFIG.selectedLocation) {
      const loc = CONFIG.selectedLocation;
      latitude = loc.lat;
      longitude = loc.lon;
      cityName = (loc.city || loc.name || query).toUpperCase();
      stateName = loc.state || "";
      countryName = loc.countryName || loc.countryCode || "";
      stationId = loc.stationId || "";
      CONFIG.countryCode = loc.countryCode || 'US';

      localStorage.setItem('lastLocationQuery', query);
      localStorage.setItem('lastLocationJson', JSON.stringify(loc));
    }

    // Proveedor
    const provSelect = document.getElementById('provider-select');
    if (provSelect) {
      CONFIG.provider = provSelect.value;
      localStorage.setItem('weatherProvider', CONFIG.provider);
    }

    // Unidades
    const unitSelect = document.getElementById('units-select');
    if (unitSelect) {
      CONFIG.units = unitSelect.value;
      localStorage.setItem('weatherUnits', CONFIG.units);
    }
    CONFIG.unitField = CONFIG.units === 'm' ? 'metric' : 'imperial';

    // Modo de Pantalla (Electron)
    const modeSelect = document.getElementById('display-mode-select');
    if (modeSelect && window.electronAPI && window.electronAPI.setDisplayMode) {
      const selectedMode = modeSelect.value;
      window.electronAPI.setDisplayMode(selectedMode);
      localStorage.setItem('electronDisplayMode', selectedMode);
    }

    // Velocidad de Crawl
    const crawlSpeedSelect = document.getElementById('crawl-speed-select');
    if (crawlSpeedSelect) {
      CONFIG.crawlSpeed = parseInt(crawlSpeedSelect.value, 10) || 120;
      localStorage.setItem('crawlSpeed', CONFIG.crawlSpeed.toString());
    }

    // Configuración TTS
    const ttsCheck = document.getElementById('tts-checkbox');
    if (ttsCheck) {
      CONFIG.ttsEnabled = ttsCheck.checked;
      localStorage.setItem('ttsEnabled', CONFIG.ttsEnabled ? 'y' : 'n');
    }

    const ttsLangSelect = document.getElementById('tts-lang-select');
    if (ttsLangSelect) {
      CONFIG.ttsLanguage = ttsLangSelect.value;
      localStorage.setItem('ttsLanguage', CONFIG.ttsLanguage);
    }

    // Ubicación Pantalla ID
    const idPosSelect = document.getElementById('id-screen-select');
    if (idPosSelect) {
      CONFIG.idScreenPosition = idPosSelect.value;
      localStorage.setItem('idScreenPosition', CONFIG.idScreenPosition);
    }

    // Sponsor Banner
    const sponsorCheck = document.getElementById('sponsor-checkbox');
    if (sponsorCheck) {
      CONFIG.sponsorBanner = sponsorCheck.checked;
      localStorage.setItem('sponsorBanner', CONFIG.sponsorBanner ? 'y' : 'n');
    }

    // Claves API
    const googleKeyInput = document.getElementById('google-api-key');
    if (googleKeyInput) {
      CONFIG.secrets.googleApiKey = googleKeyInput.value.trim();
      localStorage.setItem('googleApiKey', CONFIG.secrets.googleApiKey);
    }

    const owmKeyInput = document.getElementById('owm-api-key');
    if (owmKeyInput) {
      CONFIG.secrets.owmApiKey = owmKeyInput.value.trim();
      localStorage.setItem('owmApiKey', CONFIG.secrets.owmApiKey);
    }

    const twcKeyInput = document.getElementById('twc-api-key');
    if (twcKeyInput) {
      CONFIG.secrets.twcAPIKey = twcKeyInput.value.trim() || '71f92ea9dd2f4790b92ea9dd2f779061';
      localStorage.setItem('twcAPIKey', CONFIG.secrets.twcAPIKey);
    }

    const crawlInput = document.getElementById('crawlText-text');
    if (crawlInput && crawlInput.value.trim()) {
      CONFIG.crawl = crawlInput.value.trim();
      localStorage.setItem('crawlText', CONFIG.crawl);
    }

    const greetingInput = document.getElementById('greetingText-text');
    if (greetingInput && greetingInput.value.trim()) {
      CONFIG.greeting = greetingInput.value.trim();
      localStorage.setItem('greetingText', CONFIG.greeting);
    }

    const loopCheck = document.getElementById('loop-checkbox');
    if (loopCheck) {
      CONFIG.loop = loopCheck.checked;
      localStorage.setItem('loop', CONFIG.loop ? 'y' : 'n');
    }

    // Aplicar cambios en caliente
    hideSettings();
    if (typeof hotReloadPresentation === 'function') {
      hotReloadPresentation();
    }
  },

  load: () => {
    const content = document.getElementById('settings-content') || document.getElementById('settings-prompt');
    if (!content) return;
    content.innerHTML = '';

    // Cargar valores guardados previamente
    if (localStorage.getItem('crawlSpeed')) CONFIG.crawlSpeed = parseInt(localStorage.getItem('crawlSpeed'), 10);
    if (localStorage.getItem('ttsEnabled')) CONFIG.ttsEnabled = localStorage.getItem('ttsEnabled') === 'y';
    if (localStorage.getItem('ttsLanguage')) CONFIG.ttsLanguage = localStorage.getItem('ttsLanguage');
    if (localStorage.getItem('idScreenPosition')) CONFIG.idScreenPosition = localStorage.getItem('idScreenPosition');
    if (localStorage.getItem('sponsorBanner')) CONFIG.sponsorBanner = localStorage.getItem('sponsorBanner') !== 'n';
    if (localStorage.getItem('weatherProvider')) CONFIG.provider = localStorage.getItem('weatherProvider');
    if (localStorage.getItem('weatherUnits')) CONFIG.units = localStorage.getItem('weatherUnits');
    if (localStorage.getItem('crawlText')) CONFIG.crawl = localStorage.getItem('crawlText');
    if (localStorage.getItem('greetingText')) CONFIG.greeting = localStorage.getItem('greetingText');
    if (localStorage.getItem('googleApiKey')) CONFIG.secrets.googleApiKey = localStorage.getItem('googleApiKey');
    if (localStorage.getItem('owmApiKey')) CONFIG.secrets.owmApiKey = localStorage.getItem('owmApiKey');
    if (localStorage.getItem('twcAPIKey')) CONFIG.secrets.twcAPIKey = localStorage.getItem('twcAPIKey');

    // 1. Título y Contenedor Principal
    const title = document.createElement('div');
    title.classList.add('strong-text', 'settings-text');
    title.style.fontSize = '24px';
    title.style.marginBottom = '15px';
    title.style.textAlign = 'center';
    title.style.color = '#ffffff';
    title.innerText = 'IntelliStar 2 XD - Configuración';
    content.appendChild(title);

    // 2. Selector de Modo de Pantalla (Especial para Electron WebApp)
    if (window.electronAPI && window.electronAPI.isElectron) {
      const modeContainer = document.createElement('div');
      modeContainer.classList.add('settings-container');

      const modeLabel = document.createElement('div');
      modeLabel.classList.add('strong-text', 'settings-text');
      modeLabel.innerText = 'Modo de Pantalla / Ventana';
      modeContainer.appendChild(modeLabel);

      const modeSelect = document.createElement('select');
      modeSelect.id = 'display-mode-select';
      modeSelect.classList.add('settings-select');

      const modes = [
        { val: 'windowed', label: 'Modo Ventana (1280x720 / Redimensionable)' },
        { val: 'borderless', label: 'Ventana Sin Bordes (Borderless / Maximizado)' },
        { val: 'fullscreen', label: 'Pantalla Completa (Kiosk / Broadcast)' }
      ];

      const savedMode = localStorage.getItem('electronDisplayMode') || 'windowed';
      modes.forEach(m => {
        const opt = document.createElement('option');
        opt.value = m.val;
        opt.innerText = m.label;
        if (m.val === savedMode) opt.selected = true;
        modeSelect.appendChild(opt);
      });

      modeSelect.addEventListener('change', () => {
        if (window.electronAPI.setDisplayMode) {
          window.electronAPI.setDisplayMode(modeSelect.value);
          localStorage.setItem('electronDisplayMode', modeSelect.value);
        }
      });

      modeContainer.appendChild(modeSelect);
      content.appendChild(modeContainer);
    }

    // 3. Buscador Universal de Ubicación
    const locContainer = document.createElement('div');
    locContainer.classList.add('settings-container');

    const locLabel = document.createElement('div');
    locLabel.classList.add('strong-text', 'settings-text');
    locLabel.innerHTML = 'Ubicación <span style="font-size: 13px; color: #a5a5c7;">(Ciudad, país, aeropuerto, dirección o CP)</span>';
    locContainer.appendChild(locLabel);

    const searchWrapper = document.createElement('div');
    searchWrapper.id = 'location-search-container';

    const locInput = document.createElement('input');
    locInput.type = 'text';
    locInput.id = 'location-input';
    locInput.classList.add('settings-input');
    locInput.placeholder = 'Ej. Santiago, Chile / SCL / Madrid / 90210 / Providencia 1234';
    locInput.autocomplete = 'off';

    const suggestionsBox = document.createElement('div');
    suggestionsBox.id = 'location-suggestions';
    suggestionsBox.classList.add('hidden');

    searchWrapper.appendChild(locInput);
    searchWrapper.appendChild(suggestionsBox);
    locContainer.appendChild(searchWrapper);
    content.appendChild(locContainer);

    // Recuperar última ubicación guardada
    const savedQuery = localStorage.getItem('lastLocationQuery');
    const savedLocJson = localStorage.getItem('lastLocationJson');
    if (savedQuery) {
      locInput.value = savedQuery;
      if (savedLocJson) {
        try {
          CONFIG.selectedLocation = JSON.parse(savedLocJson);
          CONFIG.selectedLocation.queryText = savedQuery;
        } catch (e) {}
      }
    }

    // Autocompletado en tiempo real con debounce
    locInput.addEventListener('input', (e) => {
      clearTimeout(CONFIG.searchDebounceTimer);
      const val = e.target.value.trim();
      if (val.length < 2) {
        suggestionsBox.innerHTML = '';
        suggestionsBox.classList.add('hidden');
        return;
      }

      CONFIG.searchDebounceTimer = setTimeout(async () => {
        const results = await LocationSearch.search(val);
        suggestionsBox.innerHTML = '';
        if (results && results.length > 0) {
          results.forEach((res) => {
            const item = document.createElement('div');
            item.classList.add('suggestion-item');
            if (res.isAirport) {
              item.innerHTML = `<span class="airport-tag">AEROPUERTO</span>${res.label}`;
            } else {
              item.innerText = res.label;
            }

            item.addEventListener('click', () => {
              locInput.value = res.label;
              CONFIG.selectedLocation = res;
              CONFIG.selectedLocation.queryText = res.label;
              suggestionsBox.classList.add('hidden');

              // Si es fuera de EE.UU., conmutar automáticamente a métrico
              const unitSelect = document.getElementById('units-select');
              if (res.countryCode && res.countryCode !== 'US' && unitSelect) {
                unitSelect.value = 'm';
                CONFIG.units = 'm';
              }
            });
            suggestionsBox.appendChild(item);
          });
          suggestionsBox.classList.remove('hidden');
        } else {
          suggestionsBox.classList.add('hidden');
        }
      }, 250);
    });

    document.addEventListener('click', (e) => {
      if (!searchWrapper.contains(e.target)) {
        suggestionsBox.classList.add('hidden');
      }
    });

    // 4. Selector de Proveedor Meteorológico
    const provContainer = document.createElement('div');
    provContainer.classList.add('settings-container');

    const provLabel = document.createElement('div');
    provLabel.classList.add('strong-text', 'settings-text');
    provLabel.innerText = 'Sistema / API Meteorológica';
    provContainer.appendChild(provLabel);

    const provSelect = document.createElement('select');
    provSelect.id = 'provider-select';
    provSelect.classList.add('settings-select');

    const providers = [
      { val: 'google', label: 'Google Weather API (Google Maps Platform)' },
      { val: 'openweathermap', label: 'OpenWeatherMap One Call 4.0' },
      { val: 'twc', label: 'The Weather Channel (TWC - Nativo)' },
      { val: 'openmeteo', label: 'Open-Meteo (Libre / Sin clave)' }
    ];

    providers.forEach((p) => {
      const opt = document.createElement('option');
      opt.value = p.val;
      opt.innerText = p.label;
      if (p.val === CONFIG.provider) opt.selected = true;
      provSelect.appendChild(opt);
    });
    provContainer.appendChild(provSelect);
    content.appendChild(provContainer);

    // 5. Selector de Unidades
    const unitContainer = document.createElement('div');
    unitContainer.classList.add('settings-container');

    const unitLabel = document.createElement('div');
    unitLabel.classList.add('strong-text', 'settings-text');
    unitLabel.innerText = 'Unidades de Medida';
    unitContainer.appendChild(unitLabel);

    const unitSelect = document.createElement('select');
    unitSelect.id = 'units-select';
    unitSelect.classList.add('settings-select');

    const uMetric = document.createElement('option');
    uMetric.value = 'm';
    uMetric.innerText = 'Métrico (°C, km/h, mb)';
    if (CONFIG.units === 'm') uMetric.selected = true;

    const uImperial = document.createElement('option');
    uImperial.value = 'e';
    uImperial.innerText = 'Imperial (°F, mph, inHg)';
    if (CONFIG.units === 'e') uImperial.selected = true;

    unitSelect.appendChild(uMetric);
    unitSelect.appendChild(uImperial);
    unitContainer.appendChild(unitSelect);
    content.appendChild(unitContainer);

    // 6. Opciones Avanzadas (TTS, Radar, Crawl, ID Page, Claves API)
    const advContainer = document.createElement('div');
    advContainer.id = 'advanced-settings-options';
    advContainer.classList.add('settings-container', 'hidden');

    // Velocidad de Crawl
    const speedLabel = document.createElement('div');
    speedLabel.classList.add('strong-text', 'settings-text');
    speedLabel.innerText = 'Velocidad del Cintillo (Crawl)';
    const speedSelect = document.createElement('select');
    speedSelect.id = 'crawl-speed-select';
    speedSelect.classList.add('settings-select');

    const speeds = [
      { val: 80, label: 'Lento (80 px/s)' },
      { val: 120, label: 'Normal (120 px/s - Recomendado)' },
      { val: 180, label: 'Rápido (180 px/s)' }
    ];
    speeds.forEach(s => {
      const opt = document.createElement('option');
      opt.value = s.val;
      opt.innerText = s.label;
      if (s.val === CONFIG.crawlSpeed) opt.selected = true;
      speedSelect.appendChild(opt);
    });
    advContainer.appendChild(speedLabel);
    advContainer.appendChild(speedSelect);

    // TTS Narration Checkbox & Language
    const ttsRow = document.createElement('div');
    ttsRow.style.marginTop = '12px';
    const ttsLabel = document.createElement('label');
    ttsLabel.classList.add('strong-text', 'settings-text');
    ttsLabel.style.cursor = 'pointer';
    ttsLabel.style.display = 'block';

    const ttsCheck = document.createElement('input');
    ttsCheck.type = 'checkbox';
    ttsCheck.id = 'tts-checkbox';
    ttsCheck.style.marginRight = '8px';
    ttsCheck.checked = CONFIG.ttsEnabled;
    ttsLabel.appendChild(ttsCheck);
    ttsLabel.appendChild(document.createTextNode('Activar locución vocal (TTS Narration)'));
    ttsRow.appendChild(ttsLabel);

    const ttsLangSelect = document.createElement('select');
    ttsLangSelect.id = 'tts-lang-select';
    ttsLangSelect.classList.add('settings-select');
    ttsLangSelect.style.marginTop = '6px';

    const langs = [
      { val: 'auto', label: 'Idioma: Automático (según navegador y sistema)' },
      { val: 'es', label: 'Idioma: Español' },
      { val: 'en', label: 'Idioma: English' }
    ];
    langs.forEach(l => {
      const opt = document.createElement('option');
      opt.value = l.val;
      opt.innerText = l.label;
      if (l.val === CONFIG.ttsLanguage) opt.selected = true;
      ttsLangSelect.appendChild(opt);
    });
    ttsRow.appendChild(ttsLangSelect);
    advContainer.appendChild(ttsRow);

    // Posición Pantalla de Identificación de Cabecera
    const idLabel = document.createElement('div');
    idLabel.classList.add('strong-text', 'settings-text');
    idLabel.style.marginTop = '12px';
    idLabel.innerText = 'Pantalla de Identificación (Headend ID)';
    const idSelect = document.createElement('select');
    idSelect.id = 'id-screen-select';
    idSelect.classList.add('settings-select');

    const idOptions = [
      { val: 'end', label: 'Al final de la presentación (Predeterminado)' },
      { val: 'start', label: 'Al principio de la presentación' },
      { val: 'none', label: 'Desactivada' }
    ];
    idOptions.forEach(optData => {
      const opt = document.createElement('option');
      opt.value = optData.val;
      opt.innerText = optData.label;
      if (optData.val === CONFIG.idScreenPosition) opt.selected = true;
      idSelect.appendChild(opt);
    });
    advContainer.appendChild(idLabel);
    advContainer.appendChild(idSelect);

    // Sponsor Banner Checkbox
    const sponsorRow = document.createElement('div');
    sponsorRow.style.marginTop = '12px';
    const sponsorLabel = document.createElement('label');
    sponsorLabel.classList.add('strong-text', 'settings-text');
    sponsorLabel.style.cursor = 'pointer';
    sponsorLabel.style.display = 'block';

    const sponsorCheck = document.createElement('input');
    sponsorCheck.type = 'checkbox';
    sponsorCheck.id = 'sponsor-checkbox';
    sponsorCheck.style.marginRight = '8px';
    sponsorCheck.checked = CONFIG.sponsorBanner;
    sponsorLabel.appendChild(sponsorCheck);
    sponsorLabel.appendChild(document.createTextNode('Mostrar banner lateral clásico ("Local on the 8s")'));
    sponsorRow.appendChild(sponsorLabel);
    advContainer.appendChild(sponsorRow);

    // Google Key
    const gKeyLabel = document.createElement('div');
    gKeyLabel.classList.add('strong-text', 'settings-text');
    gKeyLabel.style.marginTop = '12px';
    gKeyLabel.innerText = 'Google Weather API Key';
    const gKeyInput = document.createElement('input');
    gKeyInput.type = 'password';
    gKeyInput.id = 'google-api-key';
    gKeyInput.classList.add('settings-input');
    gKeyInput.placeholder = 'Clave de Google Maps Platform Weather API';
    if (CONFIG.secrets.googleApiKey) gKeyInput.value = CONFIG.secrets.googleApiKey;
    advContainer.appendChild(gKeyLabel);
    advContainer.appendChild(gKeyInput);

    // OWM Key
    const owmKeyLabel = document.createElement('div');
    owmKeyLabel.classList.add('strong-text', 'settings-text');
    owmKeyLabel.style.marginTop = '10px';
    owmKeyLabel.innerText = 'OpenWeatherMap API Key (One Call 4.0 / 3.0 / 2.5)';
    const owmKeyInput = document.createElement('input');
    owmKeyInput.type = 'password';
    owmKeyInput.id = 'owm-api-key';
    owmKeyInput.classList.add('settings-input');
    owmKeyInput.placeholder = 'Clave de OpenWeatherMap';
    if (CONFIG.secrets.owmApiKey) owmKeyInput.value = CONFIG.secrets.owmApiKey;
    advContainer.appendChild(owmKeyLabel);
    advContainer.appendChild(owmKeyInput);

    // TWC Key
    const twcKeyLabel = document.createElement('div');
    twcKeyLabel.classList.add('strong-text', 'settings-text');
    twcKeyLabel.style.marginTop = '10px';
    twcKeyLabel.innerText = 'TWC API Key (The Weather Channel)';
    const twcKeyInput = document.createElement('input');
    twcKeyInput.type = 'password';
    twcKeyInput.id = 'twc-api-key';
    twcKeyInput.classList.add('settings-input');
    twcKeyInput.placeholder = 'Dejar en blanco para usar la clave activa por defecto';
    if (CONFIG.secrets.twcAPIKey) twcKeyInput.value = CONFIG.secrets.twcAPIKey;
    advContainer.appendChild(twcKeyLabel);
    advContainer.appendChild(twcKeyInput);

    // Crawl text
    const crawlLabel = document.createElement('div');
    crawlLabel.classList.add('strong-text', 'settings-text');
    crawlLabel.style.marginTop = '10px';
    crawlLabel.innerText = 'Texto del Cintillo (Crawl)';
    const crawlInput = document.createElement('input');
    crawlInput.type = 'text';
    crawlInput.id = 'crawlText-text';
    crawlInput.classList.add('settings-input');
    crawlInput.placeholder = 'Mensaje inferior de la pantalla';
    crawlInput.value = CONFIG.crawl;
    advContainer.appendChild(crawlLabel);
    advContainer.appendChild(crawlInput);

    // Greeting text
    const greetLabel = document.createElement('div');
    greetLabel.classList.add('strong-text', 'settings-text');
    greetLabel.style.marginTop = '10px';
    greetLabel.innerText = 'Mensaje de Saludo';
    const greetInput = document.createElement('input');
    greetInput.type = 'text';
    greetInput.id = 'greetingText-text';
    greetInput.classList.add('settings-input');
    greetInput.placeholder = 'Ej. This is your weather';
    greetInput.value = CONFIG.greeting;
    advContainer.appendChild(greetLabel);
    advContainer.appendChild(greetInput);

    // Loop
    const loopLabel = document.createElement('label');
    loopLabel.classList.add('strong-text', 'settings-text');
    loopLabel.style.display = 'block';
    loopLabel.style.marginTop = '10px';
    loopLabel.style.cursor = 'pointer';
    const loopCheck = document.createElement('input');
    loopCheck.type = 'checkbox';
    loopCheck.id = 'loop-checkbox';
    loopCheck.style.marginRight = '8px';
    loopCheck.checked = CONFIG.loop;
    loopLabel.appendChild(loopCheck);
    loopLabel.appendChild(document.createTextNode('Repetir en bucle (Loop continuo)'));
    advContainer.appendChild(loopLabel);

    content.appendChild(advContainer);

    // Botón Mostrar/Ocultar Opciones Avanzadas
    const advBtn = document.createElement('button');
    advBtn.type = 'button';
    advBtn.id = 'advanced-options-text';
    advBtn.innerText = 'Mostrar opciones avanzadas y claves API';
    advBtn.onclick = () => {
      const isHidden = advContainer.classList.contains('hidden');
      if (isHidden) {
        advContainer.classList.remove('hidden');
        advBtn.innerText = 'Ocultar opciones avanzadas';
      } else {
        advContainer.classList.add('hidden');
        advBtn.innerText = 'Mostrar opciones avanzadas y claves API';
      }
    };
    content.appendChild(advBtn);

    // Botón Guardar y Aplicar en Caliente
    const startBtn = document.createElement('button');
    startBtn.type = 'button';
    startBtn.id = 'submit-button';
    startBtn.classList.add('settings-item', 'button');
    startBtn.innerText = 'Guardar y Aplicar en Caliente';
    startBtn.onclick = CONFIG.submit;
    content.appendChild(startBtn);

    // Vincular botón cerrar del Drawer
    const closeBtn = document.getElementById('settings-close-btn');
    if (closeBtn) {
      closeBtn.onclick = hideSettings;
    }

    // Vincular botón flotante de configuración
    const toggleBtn = document.getElementById('settings-toggle-btn');
    if (toggleBtn) {
      toggleBtn.onclick = toggleSettings;
    }
  }
};

function toggleSettings() {
  const container = document.getElementById('settings-container');
  if (!container) return;
  const isHidden = container.classList.contains('hidden');
  if (isHidden) {
    showSettings();
  } else {
    hideSettings();
  }
}

function showSettings() {
  const container = document.getElementById('settings-container');
  const prompt = document.getElementById('settings-prompt');
  if (container) {
    container.classList.remove('hidden');
  }
  if (prompt) {
    prompt.classList.remove('hide');
  }
}

function hideSettings() {
  const container = document.getElementById('settings-container');
  const prompt = document.getElementById('settings-prompt');
  if (prompt) {
    prompt.classList.add('hide');
  }
  if (container) {
    container.classList.add('hidden');
  }
}

// Escuchar atajos globales dentro de la ventana: F2 o Ctrl+,
document.addEventListener('keydown', (e) => {
  if (e.key === 'F2' || (e.ctrlKey && e.key === ',')) {
    e.preventDefault();
    toggleSettings();
  }
});

// Escuchar evento IPC desde Electron
if (window.electronAPI && window.electronAPI.onToggleSettings) {
  window.electronAPI.onToggleSettings(() => {
    toggleSettings();
  });
}
