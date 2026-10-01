import axios from 'axios';
import { OSRMProvider } from './osrmProvider.js';

/**
 * Decode Google Encoded Polyline into [ [lat, lng], ... ] coordinates
 */
export function decodeGooglePolyline(encoded) {
  if (!encoded) return [];
  const points = [];
  let index = 0;
  const len = encoded.length;
  let lat = 0;
  let lng = 0;

  while (index < len) {
    let b;
    let shift = 0;
    let result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    points.push([parseFloat((lat / 1e5).toFixed(6)), parseFloat((lng / 1e5).toFixed(6))]);
  }
  return points;
}

export class GoogleMapsProvider {
  /**
   * Fetch live driving routes using Google Maps Directions API.
   * If API key is not configured or fails, falls back gracefully to OSRM / Haversine.
   */
  static async getRoutes(origin, destination, waypoints = []) {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY || global.__RUNTIME_GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      return OSRMProvider.getRoutes(origin, destination, waypoints);
    }

    try {
      let waypointsParam = '';
      if (waypoints && waypoints.length > 0) {
        const wpStr = waypoints.map(w => `${w.lat},${w.lng}`).join('|');
        waypointsParam = `&waypoints=${encodeURIComponent(wpStr)}`;
      }

      const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.lat},${origin.lng}&destination=${destination.lat},${destination.lng}${waypointsParam}&alternatives=true&mode=driving&departure_time=now&key=${apiKey}`;

      const response = await axios.get(url, { timeout: 5000 });

      if (response.data && response.data.status === 'OK' && response.data.routes?.length > 0) {
        const googleRoutes = response.data.routes.map((r, idx) => {
          const leg = r.legs[0] || {};
          const distKm = parseFloat(((leg.distance?.value || 100000) / 1000).toFixed(1));
          const durationMins = Math.round(((leg.duration_in_traffic?.value || leg.duration?.value || 3600) / 60));
          const decoded = decodeGooglePolyline(r.overview_polyline?.points);

          return {
            name: r.summary ? `${r.summary} (via Google)` : `Google Driving Corridor ${idx + 1}`,
            distanceKm: distKm,
            durationMinutes: durationMins,
            polyline: decoded.length > 0 ? decoded : [[origin.lat, origin.lng], [destination.lat, destination.lng]]
          };
        });

        console.log(`[GoogleMapsProvider] Retrieved ${googleRoutes.length} route(s) from Google Maps Directions API`);
        return googleRoutes;
      } else {
        console.warn(`[GoogleMapsProvider] Google API returned status: ${response.data?.status || 'UNKNOWN'}. Falling back to OSRM.`);
        return OSRMProvider.getRoutes(origin, destination, waypoints);
      }
    } catch (err) {
      console.warn('[GoogleMapsProvider] Error connecting to Google Maps Directions API:', err.message, '- Falling back to OSRM.');
      return OSRMProvider.getRoutes(origin, destination, waypoints);
    }
  }

  /**
   * Geocode an address query with Google Maps Geocoding API
   */
  static async geocode(query) {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY || global.__RUNTIME_GOOGLE_MAPS_API_KEY;
    if (!apiKey) return null;

    try {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${apiKey}`;
      const response = await axios.get(url, { timeout: 4000 });

      if (response.data && response.data.status === 'OK' && response.data.results?.length > 0) {
        const first = response.data.results[0];
        return {
          address: first.formatted_address,
          lat: first.geometry.location.lat,
          lng: first.geometry.location.lng
        };
      }
    } catch (err) {
      console.warn('[GoogleMapsProvider] Geocoding request failed:', err.message);
    }
    return null;
  }
}
