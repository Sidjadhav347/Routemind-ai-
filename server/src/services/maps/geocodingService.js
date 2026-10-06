import axios from 'axios';
import { GoogleMapsProvider } from './googleMapsProvider.js';

// Built-in high-accuracy geocoding directory for instant offline/fast lookup
const CITY_COORDINATES = {
  'mumbai': { name: 'Mumbai, Maharashtra, India', lat: 19.0760, lng: 72.8777 },
  'pune': { name: 'Pune, Maharashtra, India', lat: 18.5204, lng: 73.8567 },
  'nashik': { name: 'Nashik, Maharashtra, India', lat: 19.9975, lng: 73.7898 },
  'nasik': { name: 'Nashik, Maharashtra, India', lat: 19.9975, lng: 73.7898 },
  'navi mumbai': { name: 'Navi Mumbai, Maharashtra, India', lat: 19.0330, lng: 73.0297 },
  'bhiwandi': { name: 'Bhiwandi Logistics Hub, Maharashtra, India', lat: 19.2967, lng: 73.0631 },
  'chakan': { name: 'Chakan Auto Corridor, Pune, India', lat: 18.7606, lng: 73.8617 },
  'jnpt': { name: 'JNPT Port Terminal, Navi Mumbai, India', lat: 18.9499, lng: 72.9515 },
  'hinjawadi': { name: 'Hinjawadi Tech Park, Pune, India', lat: 18.5913, lng: 73.7389 },
  'vashi': { name: 'Vashi Cold Chain Logistics Hub, Navi Mumbai, India', lat: 19.0771, lng: 72.9986 },
  'thane': { name: 'Thane, Maharashtra, India', lat: 19.2183, lng: 72.9781 },
  'panvel': { name: 'Panvel, Maharashtra, India', lat: 18.9894, lng: 73.1175 },
  'khopoli': { name: 'Khopoli, Maharashtra, India', lat: 18.7845, lng: 73.3444 },
  'lonavala': { name: 'Lonavala, Maharashtra, India', lat: 18.7557, lng: 73.4091 },
  'kolhapur': { name: 'Kolhapur, Maharashtra, India', lat: 16.7050, lng: 74.2433 },
  'solapur': { name: 'Solapur, Maharashtra, India', lat: 17.6599, lng: 75.9064 },
  'aurangabad': { name: 'Chhatrapati Sambhajinagar, Maharashtra, India', lat: 19.8762, lng: 75.3433 },
  'sambhajinagar': { name: 'Chhatrapati Sambhajinagar, Maharashtra, India', lat: 19.8762, lng: 75.3433 },
  'nagpur': { name: 'Nagpur, Maharashtra, India', lat: 21.1458, lng: 79.0882 },
  'surat': { name: 'Surat, Gujarat, India', lat: 21.1702, lng: 72.8311 },
  'ahmedabad': { name: 'Ahmedabad, Gujarat, India', lat: 23.0225, lng: 72.5714 },
  'vadodara': { name: 'Vadodara, Gujarat, India', lat: 22.3072, lng: 73.1812 },
  'delhi': { name: 'New Delhi, Delhi, India', lat: 28.6139, lng: 77.2090 },
  'gurugram': { name: 'Gurugram, Haryana, India', lat: 28.4595, lng: 77.0266 },
  'noida': { name: 'Noida, Uttar Pradesh, India', lat: 28.5355, lng: 77.3910 },
  'jaipur': { name: 'Jaipur, Rajasthan, India', lat: 26.9124, lng: 75.7873 },
  'agra': { name: 'Agra, Uttar Pradesh, India', lat: 27.1767, lng: 78.0081 },
  'bangalore': { name: 'Bengaluru, Karnataka, India', lat: 12.9716, lng: 77.5946 },
  'bengaluru': { name: 'Bengaluru, Karnataka, India', lat: 12.9716, lng: 77.5946 },
  'hyderabad': { name: 'Hyderabad, Telangana, India', lat: 17.3850, lng: 78.4867 },
  'chennai': { name: 'Chennai, Tamil Nadu, India', lat: 13.0827, lng: 80.2707 },
  'kolkata': { name: 'Kolkata, West Bengal, India', lat: 22.5726, lng: 88.3639 },
  'latur': { name: 'Latur, Maharashtra, India', lat: 18.4088, lng: 76.5604 }
};

export class GeocodingService {
  static async geocode(query) {
    if (!query || typeof query !== 'string') return null;

    const trimmed = query.trim().toLowerCase();

    // Check if query is already numeric coordinates "lat, lng"
    const coordMatch = trimmed.match(/^([-+]?\d{1,2}(?:\.\d+)?)\s*,\s*([-+]?\d{1,3}(?:\.\d+)?)$/);
    if (coordMatch) {
      const lat = parseFloat(coordMatch[1]);
      const lng = parseFloat(coordMatch[2]);
      if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        return {
          address: `Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
          lat,
          lng
        };
      }
    }

    // 1. Try fast local directory match first for high speed and accuracy
    for (const [key, val] of Object.entries(CITY_COORDINATES)) {
      if (trimmed.includes(key)) {
        return {
          address: val.name,
          lat: val.lat,
          lng: val.lng
        };
      }
    }

    // 2. Try Google Maps Geocoding if configured & working
    const googleResult = await GoogleMapsProvider.geocode(query);
    if (googleResult) {
      return googleResult;
    }

    // 3. Attempt live Nominatim OpenStreetMap query
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
        timeout: 3500
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
      console.warn('[Geocoding] Nominatim query failed:', err.message);
    }

    return null;
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
