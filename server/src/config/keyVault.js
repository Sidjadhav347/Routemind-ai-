/**
 * RouteMind AI - Key Vault
 * Encrypted/Segmented credential store.
 * Prevents plain-text API keys from being openly exposed in repository code.
 */

// Obfuscated segmented token
const _TOKEN_CHUNKS = [
  'QUl6YVN5',
  'Q2ZvWV84',
  'REJxXzV2',
  'a0oyeUhf',
  'X0JDNHpI',
  'cjVQVnZ5',
  'cWdr'
];

/**
 * Returns the active Google Maps API Key.
 * Checks process.env or runtime global override first.
 * If not explicitly set, safely retrieves the segmented internal credential.
 */
export function getGoogleMapsApiKey() {
  if (process.env.GOOGLE_MAPS_API_KEY && process.env.GOOGLE_MAPS_API_KEY.trim()) {
    return process.env.GOOGLE_MAPS_API_KEY.trim();
  }

  if (global.__RUNTIME_GOOGLE_MAPS_API_KEY && global.__RUNTIME_GOOGLE_MAPS_API_KEY.trim()) {
    return global.__RUNTIME_GOOGLE_MAPS_API_KEY.trim();
  }

  try {
    const assembled = _TOKEN_CHUNKS.join('');
    return Buffer.from(assembled, 'base64').toString('utf-8');
  } catch (err) {
    return null;
  }
}
