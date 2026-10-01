import axios from 'axios';
import { GoogleMapsProvider } from './googleMapsProvider.js';

// Built-in high-accuracy geocoding directory for instant offline/fast lookup
const CITY_COORDINATES = {
  'mumbai': { name: 'Mumbai, Maharashtra, India', lat: 19.0760, lng: 72.8777 },
  'pune': { name: 'Pune, Maharashtra, India', lat: 18.5204, lng: 73.8567 },
  'navi mumbai': { name: 'Navi Mumbai, Maharashtra, India', lat: 19.0330, lng: 73.0297 },
  'bhiwandi': { name: 'Bhiwandi Logistics Hub, Maharashtra, India', lat: 19.2967, lng: 73.0631 },
  'chakan': { name: 'Chakan Auto Corridor, Pune, India', lat: 18.7606, lng: 73.8617 },
  'delhi': { name: 'New Delhi, Delhi, India', lat: 28.6139, lng: 77.2090 },
  'bangalore': { name: 'Bengaluru, Karnataka, India', lat: 12.9716, lng: 77.5946 },
  'hyderabad': { name: 'Hyderabad, Telangana, India', lat: 17.3850, lng: 78.4867 },
  'chennai': { name: 'Chennai, Tamil Nadu, India', lat: 13.0827, lng: 80.2707 },
  'ahmedabad': { name: 'Ahmedabad, Gujarat, India', lat: 23.0225, lng: 72.5714 },
  'kolkata': { name: 'Kolkata, West Bengal, India', lat: 22.5726, lng: 88.3639 }
};

export class GeocodingService {
  static async geocode(query) {
    if (!query || typeof query !== 'string') return null;

    const trimmed = query.trim().toLowerCase();

    // 1. Try Google Maps Geocoding if configured
    const googleResult = await GoogleMapsProvider.geocode(query);
    if (googleResult) {
      return googleResult;
    }

    // 2. Check fast local dictionary
    for (const [key, val] of Object.entries(CITY_COORDINATES)) {
      if (trimmed.includes(key)) {
        return {
          address: val.name,
          lat: val.lat,
          lng: val.lng
        };
      }
    }

    // Attempt live Nominatim OpenStreetMap query
    try {
      const response = await axios.get('https://nominatim.openstreetmap.org/search', {
        params: {
          q: query,
          format: 'json',
          limit: 1,
          addressdetails: 1
        },
        headers: {
          'User-Agent': 'RouteMindAI-SmartMobility/1.0 (hackathon@routemind.ai)'
        },
        timeout: 3000
      });

      if (response.data && response.data.length > 0) {
        const item = response.data[0];
        return {
          address: item.display_name,
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon)
        };
      }
    } catch (err) {
      console.warn('[Geocoding] Nominatim query failed, falling back to default coordinate:', err.message);
    }

    // Default fallback (Mumbai center)
    return {
      address: query,
      lat: 19.0760,
      lng: 72.8777
    };
  }

  static async reverseGeocode(lat, lng) {
    try {
      const response = await axios.get('https://nominatim.openstreetmap.org/reverse', {
        params: {
          lat,
          lon: lng,
          format: 'json'
        },
        headers: {
          'User-Agent': 'RouteMindAI-SmartMobility/1.0 (hackathon@routemind.ai)'
        },
        timeout: 3000
      });

      if (response.data && response.data.display_name) {
        return response.data.display_name;
      }
    } catch (err) {
      console.warn('[Geocoding] Reverse geocode failed:', err.message);
    }

    return `Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
  }
}
