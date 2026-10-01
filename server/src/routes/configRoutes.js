import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { getGoogleMapsApiKey } from '../config/keyVault.js';

const router = Router();

// Test verification against Google Geocode API
async function verifyGoogleMapsKey(apiKey) {
  if (!apiKey) return { valid: false, message: 'No API key provided' };
  try {
    const res = await axios.get(`https://maps.googleapis.com/maps/api/geocode/json?address=Mumbai&key=${apiKey}`, {
      timeout: 4000
    });
    if (res.data?.status === 'OK') {
      return { valid: true, message: 'Google Maps API Key is active and verified!' };
    } else if (res.data?.status === 'REQUEST_DENIED') {
      return { valid: false, message: res.data.error_message || 'Request denied. Please ensure Geocoding and Directions APIs are enabled in Google Cloud Console.' };
    }
    return { valid: true, message: `Key status: ${res.data?.status}` };
  } catch (err) {
    return { valid: false, message: `Verification error: ${err.message}` };
  }
}

// Helper to persist key to server/.env
function persistToEnv(keyName, value) {
  try {
    const envPath = path.resolve(process.cwd(), '.env');
    let envContent = '';
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
    }

    const regex = new RegExp(`^${keyName}=.*$`, 'm');
    if (regex.test(envContent)) {
      envContent = envContent.replace(regex, `${keyName}=${value}`);
    } else {
      envContent = envContent ? `${envContent.trim()}\n${keyName}=${value}\n` : `${keyName}=${value}\n`;
    }

    fs.writeFileSync(envPath, envContent, 'utf8');
  } catch (err) {
    console.warn('[Config] Failed writing to .env:', err.message);
  }
}

router.get('/keys', (req, res) => {
  const currentKey = getGoogleMapsApiKey() || '';
  const maskedKey = currentKey.length > 8 ? `${currentKey.substring(0, 6)}...${currentKey.slice(-4)}` : null;

  res.json({
    success: true,
    data: {
      hasGoogleMapsKey: Boolean(currentKey),
      googleMapsApiKeyMasked: maskedKey,
      hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
      envFilePath: path.resolve(process.cwd(), '.env')
    }
  });
});

router.post('/keys', async (req, res) => {
  const { googleMapsApiKey, geminiApiKey } = req.body;

  let verification = null;
  if (googleMapsApiKey !== undefined) {
    const trimmed = (googleMapsApiKey || '').trim();
    if (trimmed) {
      verification = await verifyGoogleMapsKey(trimmed);
      process.env.GOOGLE_MAPS_API_KEY = trimmed;
      global.__RUNTIME_GOOGLE_MAPS_API_KEY = trimmed;
      persistToEnv('GOOGLE_MAPS_API_KEY', trimmed);
    } else {
      delete process.env.GOOGLE_MAPS_API_KEY;
      delete global.__RUNTIME_GOOGLE_MAPS_API_KEY;
      persistToEnv('GOOGLE_MAPS_API_KEY', '');
    }
  }

  if (geminiApiKey !== undefined) {
    const trimmed = (geminiApiKey || '').trim();
    if (trimmed) {
      process.env.GEMINI_API_KEY = trimmed;
      persistToEnv('GEMINI_API_KEY', trimmed);
    }
  }

  res.json({
    success: true,
    message: 'API configuration updated successfully.',
    data: {
      hasGoogleMapsKey: Boolean(process.env.GOOGLE_MAPS_API_KEY || global.__RUNTIME_GOOGLE_MAPS_API_KEY),
      verification: verification
    }
  });
});

export default router;
