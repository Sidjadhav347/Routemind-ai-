import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: process.env.PORT || 5000,
  jwtSecret: process.env.JWT_SECRET || 'routemind_super_secure_jwt_secret_key_2026_smart_mobility',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  geminiModel: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
  supabaseUrl: process.env.SUPABASE_URL || '',
  supabaseKey: process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY || '',
  n8nWebhookUrl: process.env.N8N_WEBHOOK_URL || '',

  // Route Rerouting Threshold
  reroute: {
    minTimeSavedMinutes: 8, // Minimum minutes saved to recommend reroute
    significantCongestionLevel: 'SEVERE',
    checkIntervalSeconds: 30
  },

  // Scoring Weights Matrix for Route Optimization
  // All weights are normalized between 0.0 and 1.0
  optimizationWeights: {
    FASTEST: {
      time: 0.60,
      traffic: 0.20,
      cost: 0.08,
      fuel: 0.04,
      deadline: 0.04,
      reliability: 0.04
    },
    CHEAPEST: {
      time: 0.06,
      traffic: 0.04,
      cost: 0.70,
      fuel: 0.14,
      deadline: 0.03,
      reliability: 0.03
    },
    FUEL_EFFICIENT: {
      time: 0.08,
      traffic: 0.12,
      cost: 0.12,
      fuel: 0.60,
      deadline: 0.04,
      reliability: 0.04
    },
    LOW_TRAFFIC: {
      time: 0.15,
      traffic: 0.60,
      cost: 0.08,
      fuel: 0.07,
      deadline: 0.05,
      reliability: 0.05
    },
    DEADLINE_PRIORITY: {
      time: 0.25,
      traffic: 0.12,
      cost: 0.05,
      fuel: 0.05,
      deadline: 0.45,
      reliability: 0.08
    },
    BALANCED: {
      time: 0.25,
      traffic: 0.20,
      cost: 0.22,
      fuel: 0.15,
      deadline: 0.10,
      reliability: 0.08
    }
  },

  // Known real-world road restrictions catalog for demo & verification
  knownRoadRestrictions: [
    {
      id: 'res-old-ghat-height',
      routeNamePart: 'Old Mumbai-Pune Highway / Khandala Bhor Ghat',
      maxHeightM: 3.5, // 3.5m clearance restriction
      maxWidthM: 2.6,
      maxWeightTonnes: 10.0,
      reason: 'Low Heritage Railway Overpass (3.5m clearance) and narrow hairpin bends'
    },
    {
      id: 'res-urban-flyover-weight',
      routeNamePart: 'Old Pune-Mumbai Tunnel & City Flyover',
      maxHeightM: 4.5,
      maxWidthM: 3.0,
      maxWeightTonnes: 7.5, // 7.5 Tonnes limit
      reason: 'Structural load restriction on old municipal flyover (7.5 Tonnes limit)'
    }
  ]
};
