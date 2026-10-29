/**
 * TTSNarration.js
 * Sistema de síntesis y locución vocal automatizada para IntelliStar 2 XD.
 * Emula la voz del narrador oficial de The Weather Channel ("Local on the 8s").
 */

window.TTSNarration = {
  isSpeaking: false,
  synth: window.speechSynthesis || null,
  selectedVoice: null,

  defaultTemplates: {
    es: {
      greeting: "Este es el tiempo local en los 8 para {city}.",
      now: "En este momento en nuestra zona, la temperatura es de {temperature} grados con cielo {condition}. La sensación térmica es de {feelslike} grados.",
      today: "Para el día de hoy: {narrative}",
      tonight: "Esta noche: {narrative}",
      tomorrow: "Mañana: {narrative}",
      outlook: "A continuación, el pronóstico para los próximos siete días.",
      idScreen: "Emulador IntelliStar 2 XD transmitiendo para {city}, {state}. Proveedor activo: {provider}."
    },
    en: {
      greeting: "This is your local weather on the 8s for {city}.",
      now: "Currently in our area, {temperature} degrees with {condition}. The feels like temperature is {feelslike} degrees.",
      today: "For today: {narrative}",
      tonight: "Tonight: {narrative}",
      tomorrow: "Tomorrow: {narrative}",
      outlook: "Here is your 7-day local outlook.",
      idScreen: "IntelliStar 2 XD headend operational for {city}, {state}. Active provider: {provider}."
    }
  },

  /**
   * Detecta el idioma preferido según el navegador y configuración
   */
  detectLanguage() {
    if (window.CONFIG && window.CONFIG.ttsLanguage && window.CONFIG.ttsLanguage !== "auto") {
      return window.CONFIG.ttsLanguage;
    }
    const navLang = (navigator.language || (navigator.languages && navigator.languages[0]) || "en").toLowerCase();
    if (navLang.startsWith("es")) return "es";
    return "en";
  },

  /**
   * Carga y selecciona la voz más adecuada disponible en el sistema
   */
  init() {
    if (!this.synth) return;
    const updateVoice = () => {
      const voices = this.synth.getVoices();
      const targetLang = this.detectLanguage();
      // Buscar voz que coincida con el idioma detectado
      const matched = voices.find(v => v.lang.toLowerCase().startsWith(targetLang));
      this.selectedVoice = matched || voices[0] || null;
    };

    updateVoice();
    if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = updateVoice;
    }
  },

  /**
   * Cancela cualquier narración en curso y restablece el audio de fondo
   */
  cancel() {
    if (this.synth) {
      this.synth.cancel();
      this.isSpeaking = false;
      if (typeof window.setMusicVolume === 'function') {
        window.setMusicVolume(0.45, 300);
      }
    }
  },

  /**
   * Narra un segmento reemplazando las variables de plantilla dinámicas
   */
  speak(segmentKey, params = {}) {
    if (!this.synth || !window.CONFIG || window.CONFIG.ttsEnabled === false) return;

    this.cancel();

    const lang = this.detectLanguage();
    const templates = (window.CONFIG && window.CONFIG.ttsTemplates && window.CONFIG.ttsTemplates[lang])
      ? window.CONFIG.ttsTemplates[lang]
      : this.defaultTemplates[lang];

    let textTemplate = templates[segmentKey] || "";
    if (!textTemplate) return;

    // Sustitución de tokens
    let text = textTemplate
      .replace(/{city}/g, params.city || cityName || "")
      .replace(/{state}/g, params.state || stateName || "")
      .replace(/{country}/g, params.country || countryName || "")
      .replace(/{temperature}/g, params.temperature !== undefined ? params.temperature : (currentTemperature || "0"))
      .replace(/{feelslike}/g, params.feelslike !== undefined ? params.feelslike : (feelsLike || currentTemperature || "0"))
      .replace(/{condition}/g, params.condition || currentCondition || "")
      .replace(/{wind}/g, params.wind || windSpeed || "")
      .replace(/{humidity}/g, params.humidity !== undefined ? params.humidity : (humidity || "50"))
      .replace(/{narrative}/g, params.narrative || "")
      .replace(/{provider}/g, params.provider || (CONFIG.provider ? CONFIG.provider.toUpperCase() : "TWC"));

    // Limpieza de caracteres de escape y HTML
    text = text.replace(/<[^>]*>/g, "").replace(/\u00B0/g, " grados ").replace(/Â/g, "");

    const utterance = new SpeechSynthesisUtterance(text);
    if (this.selectedVoice) utterance.voice = this.selectedVoice;
    utterance.lang = lang === "es" ? "es-ES" : "en-US";
    utterance.rate = (window.CONFIG && window.CONFIG.ttsRate) ? window.CONFIG.ttsRate : 1.0;
    utterance.pitch = (window.CONFIG && window.CONFIG.ttsPitch) ? window.CONFIG.ttsPitch : 1.0;
    utterance.volume = (window.CONFIG && window.CONFIG.ttsVolume) ? window.CONFIG.ttsVolume : 1.0;

    utterance.onstart = () => {
      this.isSpeaking = true;
      if (typeof window.setMusicVolume === 'function') {
        window.setMusicVolume(0.18, 250);
      }
    };
    utterance.onend = () => {
      this.isSpeaking = false;
      if (typeof window.setMusicVolume === 'function') {
        window.setMusicVolume(0.45, 400);
      }
    };
    utterance.onerror = (e) => {
      console.warn("TTS narration error:", e);
      this.isSpeaking = false;
      if (typeof window.setMusicVolume === 'function') {
        window.setMusicVolume(0.45, 400);
      }
    };

    this.synth.speak(utterance);
  }
};

window.TTSNarration.init();

