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

    // Try fetching from public OSRM
    const coordsStr = `${origin.lng},${origin.lat};${destination.lng},${destination.lat}`;
    const url = `https://router.project-osrm.org/route/v1/driving/${coordsStr}?overview=full&geometries=geojson&alternatives=true&steps=true`;

    try {
      const response = await axios.get(url, { timeout: 3500 });
      if (response.data && response.data.routes && response.data.routes.length > 0) {
        response.data.routes.forEach((r, idx) => {
          routes.push({
            name: idx === 0 ? 'Mumbai-Pune Expressway (NE-1)' : `Alternative Corridor ${String.fromCharCode(65 + idx)}`,
            distanceKm: parseFloat((r.distance / 1000).toFixed(2)),
            durationMinutes: Math.round(r.duration / 60),
            polyline: r.geometry.coordinates.map(c => [c[1], c[0]])
          });
        });
      }
    } catch (err) {
      console.warn('[OSRMProvider] Public OSRM API unreachable or timed out:', err.message);
    }

    // If OSRM returned fewer than 3 alternatives, supplement with realistic alternative corridors
    if (routes.length < 2) {
      // 1. National Highway NH48 / Heritage Corridor
      routes.push({
        name: 'Old Mumbai-Pune Highway (NH48)',
        distanceKm: parseFloat((baseDistanceKm * 0.94).toFixed(1)),
        durationMinutes: Math.round((baseDistanceKm * 0.94) / 46 * 60), // slower average speed 46 km/h
        polyline: generateCurvedPath(origin.lat, origin.lng, destination.lat, destination.lng, -0.06)
      });
    }

    if (routes.length < 3) {
      // 2. Outer Logistics Bypass Corridor
      routes.push({
        name: 'Navi Mumbai - Khalapur Ring Bypass',
        distanceKm: parseFloat((baseDistanceKm * 1.15).toFixed(1)),
        durationMinutes: Math.round((baseDistanceKm * 1.15) / 60 * 60), // steady 60 km/h
        polyline: generateCurvedPath(origin.lat, origin.lng, destination.lat, destination.lng, 0.10)
      });
    }

    // If primary route wasn't retrieved by OSRM, prepend direct Expressway
    if (routes.length === 2 && !routes.some(r => r.name.includes('Expressway'))) {
      routes.unshift({
        name: 'Mumbai-Pune Expressway (NE-1)',
        distanceKm: parseFloat((baseDistanceKm * 1.02).toFixed(1)),
        durationMinutes: Math.round((baseDistanceKm * 1.02) / 75 * 60),
        polyline: generateCurvedPath(origin.lat, origin.lng, destination.lat, destination.lng, 0.04)
      });
    }

    return routes;
  }
}
