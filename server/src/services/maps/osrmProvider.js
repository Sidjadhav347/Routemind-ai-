import axios from 'axios';
import { calculateHaversineDistanceKm, generateCurvedPath } from '../../utils/distanceUtils.js';

export class OSRMProvider {
  /**
   * Fetch driving routes from OSRM or fallback to realistic routing generator.
   * Guarantees at least 3 distinct alternative corridors for multi-objective comparison.
   */
  static async getRoutes(origin, destination, waypoints = []) {
    const directDistKm = calculateHaversineDistanceKm(origin.lat, origin.lng, destination.lat, destination.lng);
    const baseDistanceKm = Math.max(15, parseFloat((directDistKm * 1.30).toFixed(1)));

    const routes = [];

    const extractCity = (loc) => {
      if (!loc) return 'City';
      const addr = (loc.address || '').split(',')[0].trim();
      return addr || 'Terminal';
    };

    const origCity = extractCity(origin);
    const destCity = extractCity(destination);
    const isMumbaiPune = (origCity.toLowerCase().includes('mumbai') && destCity.toLowerCase().includes('pune')) ||
                         (origCity.toLowerCase().includes('pune') && destCity.toLowerCase().includes('mumbai'));

    // Try fetching from public OSRM
    const coordsStr = `${origin.lng},${origin.lat};${destination.lng},${destination.lat}`;
    const url = `https://router.project-osrm.org/route/v1/driving/${coordsStr}?overview=full&geometries=geojson&alternatives=true&steps=true`;

    try {
      const response = await axios.get(url, { timeout: 3500 });
      if (response.data && response.data.routes && response.data.routes.length > 0) {
        response.data.routes.forEach((r, idx) => {
          let name = '';
          let corridorType = 'EXPRESSWAY';
          let summary = '';

          if (isMumbaiPune) {
            if (idx === 0) {
              name = 'Mumbai-Pune Expressway (NE-1)';
              corridorType = 'EXPRESSWAY';
              summary = 'Direct grade-separated high-speed expressway via Bhor Ghat tunnels';
            } else if (idx === 1) {
              name = 'Old Mumbai-Pune Highway (NH48)';
              corridorType = 'HIGHWAY';
              summary = 'Heritage arterial corridor through Panvel, Khopoli & Khandala';
            } else {
              name = 'Navi Mumbai - Khalapur Ring Bypass';
              corridorType = 'BYPASS';
              summary = 'Bypass corridor with consistent multi-axle freight clearance';
            }
          } else {
            if (idx === 0) {
              name = `${origCity} - ${destCity} Primary Express Corridor`;
              corridorType = 'EXPRESSWAY';
              summary = `Primary grade-separated transit corridor connecting ${origCity} and ${destCity}`;
            } else if (idx === 1) {
              name = `${origCity} - ${destCity} Direct Arterial Highway`;
              corridorType = 'HIGHWAY';
              summary = `Direct arterial national/state highway corridor connecting ${origCity} and ${destCity}`;
            } else {
              name = `${origCity} - ${destCity} Outer Logistics Bypass`;
              corridorType = 'BYPASS';
              summary = `Outer freight bypass corridor with generous axle clearances avoiding municipal bottlenecks`;
            }
          }

          routes.push({
            name,
            corridorType,
            summary,
            distanceKm: parseFloat((r.distance / 1000).toFixed(2)),
            durationMinutes: Math.round(r.duration / 60),
            polyline: r.geometry.coordinates.map(c => [c[1], c[0]])
          });
        });
      }
    } catch (err) {
      console.warn('[OSRMProvider] Public OSRM API unreachable or timed out:', err.message);
    }

    // If OSRM returned fewer than 2 alternatives, supplement with realistic alternative corridors
    if (routes.length < 2) {
      routes.push({
        name: isMumbaiPune ? 'Old Mumbai-Pune Highway (NH48)' : `${origCity} - ${destCity} Direct Arterial Highway`,
        corridorType: 'HIGHWAY',
        summary: isMumbaiPune ? 'Heritage arterial corridor through Panvel, Khopoli & Khandala' : `Direct arterial corridor between ${origCity} and ${destCity}`,
        distanceKm: parseFloat((baseDistanceKm * 0.96).toFixed(1)),
        durationMinutes: Math.round((baseDistanceKm * 0.96) / 48 * 60), // slower average speed 48 km/h
        polyline: generateCurvedPath(origin.lat, origin.lng, destination.lat, destination.lng, -0.06)
      });
    }

    if (routes.length < 3) {
      routes.push({
        name: isMumbaiPune ? 'Navi Mumbai - Khalapur Ring Bypass' : `${origCity} - ${destCity} Outer Logistics Bypass`,
        corridorType: 'BYPASS',
        summary: isMumbaiPune ? 'Bypass corridor with consistent multi-axle freight clearance' : `Outer regional freight bypass avoiding congested city centers`,
        distanceKm: parseFloat((baseDistanceKm * 1.15).toFixed(1)),
        durationMinutes: Math.round((baseDistanceKm * 1.15) / 60 * 60), // steady 60 km/h
        polyline: generateCurvedPath(origin.lat, origin.lng, destination.lat, destination.lng, 0.10)
      });
    }

    // Ensure primary Express route is at index 0 if not present
    if (routes.length === 2 && !routes.some(r => r.corridorType === 'EXPRESSWAY')) {
      routes.unshift({
        name: isMumbaiPune ? 'Mumbai-Pune Expressway (NE-1)' : `${origCity} - ${destCity} Primary Express Corridor`,
        corridorType: 'EXPRESSWAY',
        summary: isMumbaiPune ? 'Direct grade-separated high-speed expressway via Bhor Ghat tunnels' : `Fastest grade-separated highway route between ${origCity} and ${destCity}`,
        distanceKm: parseFloat((baseDistanceKm * 1.02).toFixed(1)),
        durationMinutes: Math.round((baseDistanceKm * 1.02) / 75 * 60),
        polyline: generateCurvedPath(origin.lat, origin.lng, destination.lat, destination.lng, 0.04)
      });
    }

    return routes;
  }
}
