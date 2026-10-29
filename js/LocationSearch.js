/**
 * LocationSearch.js
 * Motor de búsqueda y geocodificación global para IntelliStar 2 XD.
 * Permite buscar por localidad, país, código postal internacional,
 * dirección de hogar y códigos de aeropuerto (IATA e ICAO).
 */

const AIRPORT_DATABASE = {
  // Sudamérica
  "SCL": { name: "Aeropuerto Int. Arturo Merino Benítez", city: "Santiago", state: "Región Metropolitana", country: "Chile", countryCode: "CL", lat: -33.393, lon: -70.785, stationId: "SCEL" },
  "SCEL": { name: "Aeropuerto Int. Arturo Merino Benítez", city: "Santiago", state: "Región Metropolitana", country: "Chile", countryCode: "CL", lat: -33.393, lon: -70.785, stationId: "SCEL" },
  "EZE": { name: "Aeropuerto Int. Ministro Pistarini", city: "Buenos Aires", state: "Buenos Aires", country: "Argentina", countryCode: "AR", lat: -34.822, lon: -58.535, stationId: "SAEZ" },
  "SAEZ": { name: "Aeropuerto Int. Ministro Pistarini", city: "Buenos Aires", state: "Buenos Aires", country: "Argentina", countryCode: "AR", lat: -34.822, lon: -58.535, stationId: "SAEZ" },
  "AEP": { name: "Aeroparque Jorge Newbery", city: "Buenos Aires", state: "CABA", country: "Argentina", countryCode: "AR", lat: -34.559, lon: -58.415, stationId: "SABE" },
  "BOG": { name: "Aeropuerto Int. El Dorado", city: "Bogotá", state: "Cundinamarca", country: "Colombia", countryCode: "CO", lat: 4.701, lon: -74.146, stationId: "SKBO" },
  "SKBO": { name: "Aeropuerto Int. El Dorado", city: "Bogotá", state: "Cundinamarca", country: "Colombia", countryCode: "CO", lat: 4.701, lon: -74.146, stationId: "SKBO" },
  "LIM": { name: "Aeropuerto Int. Jorge Chávez", city: "Lima", state: "Callao", country: "Perú", countryCode: "PE", lat: -12.021, lon: -77.114, stationId: "SPJC" },
  "SPJC": { name: "Aeropuerto Int. Jorge Chávez", city: "Lima", state: "Callao", country: "Perú", countryCode: "PE", lat: -12.021, lon: -77.114, stationId: "SPJC" },
  "GRU": { name: "Aeroporto Int. de São Paulo-Guarulhos", city: "São Paulo", state: "São Paulo", country: "Brasil", countryCode: "BR", lat: -23.435, lon: -46.473, stationId: "SBGR" },
  "SBGR": { name: "Aeroporto Int. de São Paulo-Guarulhos", city: "São Paulo", state: "São Paulo", country: "Brasil", countryCode: "BR", lat: -23.435, lon: -46.473, stationId: "SBGR" },
  "GIG": { name: "Aeroporto Int. do Galeão", city: "Río de Janeiro", state: "Río de Janeiro", country: "Brasil", countryCode: "BR", lat: -22.808, lon: -43.243, stationId: "SBGL" },
  "MVD": { name: "Aeropuerto Int. de Carrasco", city: "Montevideo", state: "Canelones", country: "Uruguay", countryCode: "UY", lat: -34.838, lon: -56.030, stationId: "SUMU" },
  "UIO": { name: "Aeropuerto Int. Mariscal Sucre", city: "Quito", state: "Pichincha", country: "Ecuador", countryCode: "EC", lat: -0.129, lon: -78.357, stationId: "SEQM" },
  "PTY": { name: "Aeropuerto Int. de Tocumen", city: "Ciudad de Panamá", state: "Panamá", country: "Panamá", countryCode: "PA", lat: 9.071, lon: -79.383, stationId: "MPTO" },
  "SJO": { name: "Aeropuerto Int. Juan Santamaría", city: "San José", state: "Alajuela", country: "Costa Rica", countryCode: "CR", lat: 9.993, lon: -84.208, stationId: "MROC" },

  // Norteamérica
  "MEX": { name: "Aeropuerto Int. Benito Juárez", city: "Ciudad de México", state: "CDMX", country: "México", countryCode: "MX", lat: 19.436, lon: -99.072, stationId: "MMMX" },
  "MMMX": { name: "Aeropuerto Int. Benito Juárez", city: "Ciudad de México", state: "CDMX", country: "México", countryCode: "MX", lat: 19.436, lon: -99.072, stationId: "MMMX" },
  "CUN": { name: "Aeropuerto Int. de Cancún", city: "Cancún", state: "Quintana Roo", country: "México", countryCode: "MX", lat: 21.036, lon: -86.877, stationId: "MMUN" },
  "MIA": { name: "Miami International Airport", city: "Miami", state: "Florida", country: "United States", countryCode: "US", lat: 25.795, lon: -80.287, stationId: "KMIA" },
  "KMIA": { name: "Miami International Airport", city: "Miami", state: "Florida", country: "United States", countryCode: "US", lat: 25.795, lon: -80.287, stationId: "KMIA" },
  "JFK": { name: "John F. Kennedy International Airport", city: "New York", state: "New York", country: "United States", countryCode: "US", lat: 40.641, lon: -73.778, stationId: "KJFK" },
  "KJFK": { name: "John F. Kennedy International Airport", city: "New York", state: "New York", country: "United States", countryCode: "US", lat: 40.641, lon: -73.778, stationId: "KJFK" },
  "LAX": { name: "Los Angeles International Airport", city: "Los Angeles", state: "California", country: "United States", countryCode: "US", lat: 33.942, lon: -118.408, stationId: "KLAX" },
  "KLAX": { name: "Los Angeles International Airport", city: "Los Angeles", state: "California", country: "United States", countryCode: "US", lat: 33.942, lon: -118.408, stationId: "KLAX" },
  "ORD": { name: "O'Hare International Airport", city: "Chicago", state: "Illinois", country: "United States", countryCode: "US", lat: 41.974, lon: -87.907, stationId: "KORD" },
  "ATL": { name: "Hartsfield-Jackson Atlanta Int. Airport", city: "Atlanta", state: "Georgia", country: "United States", countryCode: "US", lat: 33.640, lon: -84.427, stationId: "KATL" },
  "DFW": { name: "Dallas/Fort Worth International Airport", city: "Dallas", state: "Texas", country: "United States", countryCode: "US", lat: 32.899, lon: -97.040, stationId: "KDFW" },
  "YYZ": { name: "Toronto Pearson International Airport", city: "Toronto", state: "Ontario", country: "Canada", countryCode: "CA", lat: 43.677, lon: -79.624, stationId: "CYYZ" },

  // Europa y resto del mundo
  "MAD": { name: "Aeropuerto Adolfo Suárez Madrid-Barajas", city: "Madrid", state: "Comunidad de Madrid", country: "España", countryCode: "ES", lat: 40.471, lon: -3.562, stationId: "LEMD" },
  "LEMD": { name: "Aeropuerto Adolfo Suárez Madrid-Barajas", city: "Madrid", state: "Comunidad de Madrid", country: "España", countryCode: "ES", lat: 40.471, lon: -3.562, stationId: "LEMD" },
  "BCN": { name: "Aeropuerto Josep Tarradellas Barcelona-El Prat", city: "Barcelona", state: "Cataluña", country: "España", countryCode: "ES", lat: 41.297, lon: 2.078, stationId: "LEBL" },
  "LHR": { name: "Heathrow Airport", city: "London", state: "England", country: "United Kingdom", countryCode: "GB", lat: 51.470, lon: -0.454, stationId: "EGLL" },
  "CDG": { name: "Aéroport de Paris-Charles de Gaulle", city: "Paris", state: "Île-de-France", country: "France", countryCode: "FR", lat: 49.009, lon: 2.547, stationId: "LFPG" },
  "FRA": { name: "Frankfurt Airport", city: "Frankfurt", state: "Hesse", country: "Germany", countryCode: "DE", lat: 50.037, lon: 8.562, stationId: "EDDF" },
  "AMS": { name: "Amsterdam Airport Schiphol", city: "Amsterdam", state: "North Holland", country: "Netherlands", countryCode: "NL", lat: 52.310, lon: 4.768, stationId: "EHAM" },
  "FCO": { name: "Aeroporto di Roma-Fiumicino", city: "Rome", state: "Lazio", country: "Italy", countryCode: "IT", lat: 41.800, lon: 12.238, stationId: "LIRF" },
  "NRT": { name: "Narita International Airport", city: "Tokyo", state: "Chiba", country: "Japan", countryCode: "JP", lat: 35.764, lon: 140.386, stationId: "RJAA" },
  "HND": { name: "Haneda Airport", city: "Tokyo", state: "Tokyo", country: "Japan", countryCode: "JP", lat: 35.549, lon: 139.779, stationId: "RJTT" },
  "SYD": { name: "Sydney Kingsford Smith Airport", city: "Sydney", state: "New South Wales", country: "Australia", countryCode: "AU", lat: -33.946, lon: 151.177, stationId: "YSSY" }
};

window.LocationSearch = {
  /**
   * Sanitiza el nombre de la ciudad eliminando prefijos de división administrativa
   * como 'Provincia de', 'Región de', 'Comuna de', 'County of', etc.
   */
  sanitizeCityName(rawName) {
    if (!rawName) return "";
    return rawName
      .replace(/^(Provincia de|Región de|Comuna de|Departamento de|Municipio de|County of|Municipality of)\s+/i, "")
      .replace(/\s+(County|Province|District)$/i, "")
      .trim();
  },

  /**
   * Extrae la mejor ciudad limpia a partir de las propiedades devueltas por el geocodificador
   */
  extractCleanCity(props, name) {
    if (props.city && props.city.trim()) {
      return this.sanitizeCityName(props.city);
    }
    if (props.town && props.town.trim()) {
      return this.sanitizeCityName(props.town);
    }
    if (props.village && props.village.trim()) {
      return this.sanitizeCityName(props.village);
    }
    if (props.municipality && props.municipality.trim()) {
      return this.sanitizeCityName(props.municipality);
    }
    if (name && name.trim()) {
      return this.sanitizeCityName(name);
    }
    if (props.county && props.county.trim()) {
      return this.sanitizeCityName(props.county);
    }
    return "Ciudad";
  },

  /**
   * Verifica si la consulta corresponde a un código de aeropuerto IATA o ICAO
   */
  checkAirport(query) {
    if (!query) return null;
    const clean = query.trim().toUpperCase();
    if (AIRPORT_DATABASE[clean]) {
      const ap = AIRPORT_DATABASE[clean];
      return {
        label: `${ap.name} (${clean}), ${ap.city}, ${ap.country}`,
        city: ap.city,
        state: ap.state || ap.city,
        country: ap.country,
        countryCode: ap.countryCode,
        stationId: ap.stationId || clean,
        lat: ap.lat,
        lon: ap.lon,
        isAirport: true
      };
    }
    return null;
  },

  /**
   * Busca coincidencias para autocompletado en base de datos de aeropuertos y servicio geográfico global
   */
  async search(query) {
    if (!query || query.trim().length < 2) return [];
    const results = [];
    const clean = query.trim();

    // 1. Probar aeropuerto exacto o parcial
    const airportDirect = this.checkAirport(clean);
    if (airportDirect) {
      results.push(airportDirect);
    } else {
      const upper = clean.toUpperCase();
      for (const [code, ap] of Object.entries(AIRPORT_DATABASE)) {
        if (code.startsWith(upper) || ap.city.toUpperCase().includes(upper) || ap.name.toUpperCase().includes(upper)) {
          results.push({
            label: `✈ ${ap.name} (${code}), ${ap.city}, ${ap.country}`,
            city: ap.city,
            state: ap.state || ap.city,
            country: ap.country,
            countryCode: ap.countryCode,
            stationId: ap.stationId || code,
            lat: ap.lat,
            lon: ap.lon,
            isAirport: true
          });
          if (results.length >= 3) break;
        }
      }
    }

    // 2. Geocodificador global Photon (OpenStreetMap)
    try {
      const encoded = encodeURIComponent(clean);
      const res = await fetch(`https://photon.komoot.io/api/?q=${encoded}&limit=5`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.features) {
          for (const feat of data.features) {
            const props = feat.properties || {};
            const coords = feat.geometry ? feat.geometry.coordinates : null;
            if (!coords) continue;

            const name = props.name || props.street || props.city || "";
            const cleanCity = this.extractCleanCity(props, name);
            const state = props.state || props.county || cleanCity;
            const country = props.country || "";
            const countryCode = (props.countrycode || "US").toUpperCase();
            const postcode = props.postcode ? ` [${props.postcode}]` : "";

            let labelParts = [];
            if (name) labelParts.push(name);
            if (props.street && props.street !== name) labelParts.push(props.street);
            if (cleanCity && cleanCity !== name) labelParts.push(cleanCity);
            if (state && state !== cleanCity) labelParts.push(state);
            if (country) labelParts.push(country);
            if (postcode) labelParts.push(postcode);

            const fullLabel = labelParts.filter(Boolean).join(", ");

            if (!results.some(r => Math.abs(r.lat - coords[1]) < 0.05 && Math.abs(r.lon - coords[0]) < 0.05)) {
              results.push({
                label: fullLabel || cleanCity,
                city: cleanCity,
                state: state,
                country: country,
                countryCode: countryCode,
                stationId: `${countryCode}-${cleanCity.substring(0, 3).toUpperCase()}`,
                lat: coords[1],
                lon: coords[0]
              });
            }
          }
        }
      }
    } catch (err) {
      console.warn("Photon geocoder error, probando fallback Nominatim:", err);
      try {
        const nomRes = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(clean)}&format=json&limit=5&addressdetails=1`);
        if (nomRes.ok) {
          const nomData = await nomRes.json();
          for (const item of nomData) {
            const addr = item.address || {};
            const rawCity = addr.city || addr.town || addr.village || addr.municipality || item.display_name.split(",")[0];
            const cleanCity = this.sanitizeCityName(rawCity);
            const state = addr.state || addr.county || cleanCity;
            const countryCode = (addr.country_code || "US").toUpperCase();
            results.push({
              label: item.display_name,
              city: cleanCity,
              state: state,
              country: addr.country || "",
              countryCode: countryCode,
              stationId: `${countryCode}-${cleanCity.substring(0, 3).toUpperCase()}`,
              lat: parseFloat(item.lat),
              lon: parseFloat(item.lon)
            });
          }
        }
      } catch (nomErr) {
        console.error("Geocoding falló por completo:", nomErr);
      }
    }

    return results;
  },

  /**
   * Resuelve una consulta inmediatamente al mejor resultado
   */
  async resolve(query) {
    const list = await this.search(query);
    if (list && list.length > 0) {
      return list[0];
    }
    return null;
  }
};
