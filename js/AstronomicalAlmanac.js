/**
 * AstronomicalAlmanac.js
 * Motor astronómico de precisión para IntelliStar 2 XD.
 * - Cálculo de las 4 fases lunares principales (Luna Nueva, Cuarto Creciente, Luna Llena, Cuarto Menguante)
 *   utilizando el algoritmo de Jean Meeus (Astronomical Algorithms, Cap. 49).
 * - Formateo de horas solares y cálculo de respaldo de amanecer/atardecer (NOAA Solar Calculations).
 */

(function (window) {
  'use strict';

  var MONTHS_ES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  var MONTHS_EN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  var AstronomicalAlmanac = {
    /**
     * Formatea una hora solar en formato de emisión televisiva (ej. "06:44" o "6:44 AM").
     * Acepta ISO strings ("2026-10-30T06:44"), timestamps, objetos Date o "HH:MM".
     */
    formatSolarTime: function (val, use24h) {
      if (!val || val === "--") return "--:--";

      if (typeof val === "string" && /^\d{1,2}:\d{2}/.test(val)) {
        var parts = val.split(":");
        var h = parseInt(parts[0], 10);
        var m = parts[1].substr(0, 2);
        if (use24h) {
          return (h < 10 ? "0" + h : h) + ":" + m;
        } else {
          var ampm = h >= 12 ? "PM" : "AM";
          var h12 = h % 12;
          if (h12 === 0) h12 = 12;
          return h12 + ":" + m + " " + ampm;
        }
      }

      var d = null;
      if (val instanceof Date && !isNaN(val.getTime())) {
        d = val;
      } else if (typeof val === "number") {
        d = new Date(val > 1e11 ? val : val * 1000);
      } else if (typeof val === "string") {
        var parsed = Date.parse(val);
        if (!isNaN(parsed)) {
          d = new Date(parsed);
        }
      }

      if (!d || isNaN(d.getTime())) return "--:--";

      var hours = d.getHours();
      var minutes = d.getMinutes();
      var minStr = minutes < 10 ? "0" + minutes : "" + minutes;

      if (use24h) {
        return (hours < 10 ? "0" + hours : hours) + ":" + minStr;
      } else {
        var ampm = hours >= 12 ? "PM" : "AM";
        var h12 = hours % 12;
        if (h12 === 0) h12 = 12;
        return h12 + ":" + minStr + " " + ampm;
      }
    },

    /**
     * Formatea una fecha para tarjetas de fase lunar (ej: "9 Nov" o "Nov 9").
     */
    formatDateStr: function (date, lang) {
      if (!date || !(date instanceof Date) || isNaN(date.getTime())) return "--";
      var d = date.getDate();
      var mIdx = date.getMonth();
      var isSpanish = (lang || "").toLowerCase().indexOf("es") === 0;
      if (isSpanish) {
        return d + " " + MONTHS_ES[mIdx];
      } else {
        return MONTHS_EN[mIdx] + " " + d;
      }
    },

    /**
     * Cálculo de Meeus para el instante exacto de una fase lunar k.
     * k entero = Luna Nueva
     * k + 0.25 = Cuarto Creciente
     * k + 0.50 = Luna Llena
     * k + 0.75 = Cuarto Menguante
     */
    _calcPhaseDate: function (k) {
      var T = k / 1236.85;
      var T2 = T * T;
      var T3 = T2 * T;
      var T4 = T3 * T;
      var jde = 2451550.09766 + 29.530588861 * k + 0.00015437 * T2 - 0.000000150 * T3 + 0.00000000073 * T4;
      var E = 1 - 0.002516 * T - 0.0000074 * T2;
      var M = (2.5534 + 29.10535670 * k - 0.0000014 * T2 - 0.00000011 * T3) * Math.PI / 180;
      var Mprime = (201.5643 + 385.81693528 * k + 0.0107582 * T2 + 0.01238e-3 * T3 - 0.058e-6 * T4) * Math.PI / 180;
      var F = (160.7108 + 390.67050284 * k - 0.0016118 * T2 - 0.00227e-3 * T3 + 0.011e-6 * T4) * Math.PI / 180;

      var phaseFraction = k - Math.floor(k);
      var corr = 0;
      if (Math.abs(phaseFraction) < 0.01) {
        // Luna Nueva
        corr = -0.40720 * Math.sin(Mprime)
             + 0.17241 * E * Math.sin(M)
             + 0.01608 * Math.sin(2 * Mprime)
             + 0.01039 * Math.sin(2 * F)
             + 0.00739 * E * Math.sin(Mprime - M)
             - 0.00514 * E * Math.sin(Mprime + M)
             + 0.00208 * E * E * Math.sin(2 * M);
      } else if (Math.abs(phaseFraction - 0.5) < 0.01) {
        // Luna Llena
        corr = -0.40614 * Math.sin(Mprime)
             + 0.17302 * E * Math.sin(M)
             + 0.01614 * Math.sin(2 * Mprime)
             - 0.01043 * Math.sin(2 * F)
             + 0.00734 * E * Math.sin(Mprime - M)
             - 0.00515 * E * Math.sin(Mprime + M)
             + 0.00209 * E * E * Math.sin(2 * M);
      } else {
        // Cuarto Creciente o Menguante
        corr = -0.62801 * Math.sin(Mprime)
             + 0.17172 * E * Math.sin(M)
             - 0.01183 * E * Math.sin(Mprime + M)
             + 0.00862 * Math.sin(2 * Mprime)
             + 0.00804 * Math.sin(2 * F);
      }
      jde += corr;
      var unixMs = (jde - 2440587.5) * 86400000;
      return new Date(unixMs);
    },

    /**
     * Calcula las 4 fases principales del ciclo lunar con su próxima fecha a partir de la fecha base.
     * Retorna array con los 4 tipos en el orden broadcast establecido:
     * 1. Luna Nueva
     * 2. Cuarto Creciente
     * 3. Luna Llena
     * 4. Cuarto Menguante
     */
    getNextMoonPhases: function (baseDate, lang) {
      var now = (baseDate instanceof Date && !isNaN(baseDate.getTime())) ? baseDate : new Date();
      var year = now.getFullYear() + (now.getMonth() * 30.5 + now.getDate()) / 365.25;
      var kBase = (year - 2000.0) * 12.368530573;
      var kFloor = Math.floor(kBase);

      var phases = [
        {
          id: "new",
          offset: 0.0,
          nameEs: "Luna Nueva",
          nameEn: "New Moon",
          iconFile: "moon-new.svg"
        },
        {
          id: "first-quarter",
          offset: 0.25,
          nameEs: "Cuarto Creciente",
          nameEn: "First Quarter",
          iconFile: "moon-first-quarter.svg"
        },
        {
          id: "full",
          offset: 0.50,
          nameEs: "Luna Llena",
          nameEn: "Full Moon",
          iconFile: "moon-full.svg"
        },
        {
          id: "last-quarter",
          offset: 0.75,
          nameEs: "Cuarto Menguante",
          nameEn: "Last Quarter",
          iconFile: "moon-last-quarter.svg"
        }
      ];

      var results = [];
      for (var i = 0; i < phases.length; i++) {
        var p = phases[i];
        var k = kFloor + p.offset;
        var pDate = this._calcPhaseDate(k);
        // Si la fecha ya pasó respecto al inicio del día actual, saltar a la siguiente lunación
        var startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        if (pDate.getTime() < startOfToday) {
          k += 1.0;
          pDate = this._calcPhaseDate(k);
        }

        var isSpanish = (lang || "").toLowerCase().indexOf("es") === 0;
        results.push({
          id: p.id,
          name: isSpanish ? p.nameEs : p.nameEn,
          date: pDate,
          dateStr: this.formatDateStr(pDate, lang),
          iconFile: p.iconFile
        });
      }

      return results;
    },

    /**
     * Algoritmo solar NOAA para calcular la hora de amanecer y atardecer como respaldo
     * cuando la API meteorológica no incluye los campos de radiación o sol.
     */
    computeSolarTimes: function (lat, lon, date, customTzOffsetMin) {
      var d = date || new Date();
      var latRad = (lat || 0) * Math.PI / 180;
      var dayOfYear = Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 86400000);

      // Ecuación del tiempo y declinación solar aproximada
      var gamma = 2 * Math.PI / 365 * (dayOfYear - 1);
      var eqtime = 229.18 * (0.000075 + 0.001868 * Math.cos(gamma) - 0.032077 * Math.sin(gamma)
                    - 0.014615 * Math.cos(2 * gamma) - 0.040849 * Math.sin(2 * gamma));
      var decl = 0.006918 - 0.399912 * Math.cos(gamma) + 0.070257 * Math.sin(gamma)
                 - 0.006758 * Math.cos(2 * gamma) + 0.000907 * Math.sin(2 * gamma)
                 - 0.002697 * Math.cos(3 * gamma) + 0.00148 * Math.sin(3 * gamma);

      // Ángulo horario para el zenit estándar de 90.833°
      var zenithRad = 90.833 * Math.PI / 180;
      var cosHa = (Math.cos(zenithRad) / (Math.cos(latRad) * Math.cos(decl))) - (Math.tan(latRad) * Math.tan(decl));

      if (cosHa > 1) {
        return { sunrise: "--:--", sunset: "--:--", polarNight: true };
      }
      if (cosHa < -1) {
        return { sunrise: "--:--", sunset: "--:--", midnightSun: true };
      }

      var haRad = Math.acos(cosHa);
      var haDeg = haRad * 180 / Math.PI;

      // Minutos desde medianoche UTC
      var sunriseMinUTC = 720 - 4 * (lon || 0) - eqtime - 4 * haDeg;
      var sunsetMinUTC = 720 - 4 * (lon || 0) - eqtime + 4 * haDeg;

      // Ajuste a hora local del navegador/sistema o desfase especificado
      var tzOffsetMin = (typeof customTzOffsetMin === 'number') ? customTzOffsetMin : -d.getTimezoneOffset();
      var sunriseLocalMin = (sunriseMinUTC + tzOffsetMin + 1440) % 1440;
      var sunsetLocalMin = (sunsetMinUTC + tzOffsetMin + 1440) % 1440;

      var srH = Math.floor(sunriseLocalMin / 60);
      var srM = Math.floor(sunriseLocalMin % 60);
      var ssH = Math.floor(sunsetLocalMin / 60);
      var ssM = Math.floor(sunsetLocalMin % 60);

      var pad = function (n) { return n < 10 ? "0" + n : "" + n; };
      return {
        sunrise: pad(srH) + ":" + pad(srM),
        sunset: pad(ssH) + ":" + pad(ssM)
      };
    }
  };

  window.AstronomicalAlmanac = AstronomicalAlmanac;
})(window);

