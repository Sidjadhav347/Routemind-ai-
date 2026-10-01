import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, 'routemind_data.json');

// Supabase client instance (initialized if credentials provided)
let supabase = null;
if (process.env.SUPABASE_URL && (process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY)) {
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY;
  supabase = createClient(process.env.SUPABASE_URL, supabaseKey);
  console.log('[Database] Connected to remote Supabase PostgreSQL instance');
} else {
  console.log('[Database] Running in Local Persistent Mode (Zero-Config Hackathon Mode)');
}

// In-Memory state
let db = {
  users: [],
  user_preferences: [],
  vehicles: [],
  cargo: [],
  trips: [],
  trip_routes: [],
  traffic_events: [],
  route_recalculations: [],
  departure_predictions: [],
  ai_recommendations: [],
  notifications: [],
  trip_history: []
};

// Seed initial realistic data for hackathon demo
function seedDatabase() {
  const demoUserId = '00000000-0000-4000-a000-000000000001';
  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync('password123', salt);

  const demoUser = {
    id: demoUserId,
    email: 'demo@routemind.ai',
    name: 'Alex Mercer (Logistics Dispatcher)',
    password_hash: passwordHash,
    role: 'OPERATOR',
    created_at: new Date('2026-09-01T08:00:00Z').toISOString(),
    updated_at: new Date('2026-09-01T08:00:00Z').toISOString()
  };

  const demoPreferences = {
    id: uuidv4(),
    user_id: demoUserId,
    preferred_mode: 'BALANCED',
    max_travel_budget: 3500.00,
    preferred_fuel_efficiency: 10.0,
    arrival_buffer_mins: 30,
    notify_on_traffic: true,
    notify_on_reroute: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const heavyTruckId = '00000000-0000-4000-a000-000000000010';
  const electricVanId = '00000000-0000-4000-a000-000000000011';
  const lightTruckId = '00000000-0000-4000-a000-000000000012';

  const defaultVehicles = [
    {
      id: heavyTruckId,
      user_id: demoUserId,
      name: 'FreightMaster 3500 Heavy Truck',
      type: 'HEAVY_TRUCK',
      length_m: 12.5,
      width_m: 2.55,
      height_m: 3.8, // 3.8m tall (triggers low bridge warnings!)
      max_weight_capacity_kg: 16000.0,
      tare_weight_kg: 7500.0,
      fuel_type: 'DIESEL',
      fuel_efficiency_km_l: 3.8, // 3.8 km per liter for heavy truck
      fuel_price_per_unit: 92.50, // INR per liter
      status: 'ACTIVE',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: electricVanId,
      user_id: demoUserId,
      name: 'VoltRoute Urban e-Van',
      type: 'VAN',
      length_m: 5.4,
      width_m: 1.95,
      height_m: 2.1,
      max_weight_capacity_kg: 1500.0,
      tare_weight_kg: 2200.0,
      fuel_type: 'ELECTRIC',
      fuel_efficiency_km_l: 5.5, // Equivalent km per kWh
      fuel_price_per_unit: 12.00, // INR per kWh
      status: 'ACTIVE',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: lightTruckId,
      user_id: demoUserId,
      name: 'Canter InterCity Express',
      type: 'LIGHT_TRUCK',
      length_m: 7.2,
      width_m: 2.2,
      height_m: 2.8,
      max_weight_capacity_kg: 5000.0,
      tare_weight_kg: 3200.0,
      fuel_type: 'DIESEL',
      fuel_efficiency_km_l: 6.8,
      fuel_price_per_unit: 92.50,
      status: 'ACTIVE',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: uuidv4(),
      user_id: demoUserId,
      name: 'EcoRide Courier Hybrid',
      type: 'CAR',
      length_m: 4.6,
      width_m: 1.8,
      height_m: 1.5,
      max_weight_capacity_kg: 500.0,
      tare_weight_kg: 1400.0,
      fuel_type: 'HYBRID',
      fuel_efficiency_km_l: 22.0,
      fuel_price_per_unit: 98.00,
      status: 'ACTIVE',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];

  const heavyCargoId = '00000000-0000-4000-a000-000000000020';
  const defaultCargo = [
    {
      id: heavyCargoId,
      user_id: demoUserId,
      name: 'Industrial Precision Turbines & Assemblies',
      type: 'INDUSTRIAL',
      weight_kg: 3000.0,
      quantity: 4,
      length_m: 3.0,
      width_m: 2.0,
      height_m: 1.8,
      is_fragile: false,
      priority: 'HIGH',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: uuidv4(),
      user_id: demoUserId,
      name: 'Temperature-Sensitive Pharma Vaccines',
      type: 'PERISHABLE',
      weight_kg: 650.0,
      quantity: 20,
      length_m: 1.2,
      width_m: 1.0,
      height_m: 1.2,
      is_fragile: true,
      priority: 'URGENT',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];

  // Seed sample historical completed trips for immediate rich analytics
  const historyTrips = [
    {
      id: uuidv4(),
      user_id: demoUserId,
      origin_address: 'Bhiwandi Logistics Park, Mumbai',
      destination_address: 'Chakan Auto Hub, Pune',
      vehicle_name: 'FreightMaster 3500 Heavy Truck',
      cargo_name: 'Auto Chassis Parts (4,500 kg)',
      planned_duration_min: 165,
      actual_duration_min: 172,
      planned_cost: 2850.00,
      actual_cost: 2910.00,
      distance_km: 142.5,
      fuel_used_l: 37.5,
      reroutes_count: 1,
      delays_count: 1,
      total_delay_min: 12,
      optimization_mode: 'BALANCED',
      completed_at: new Date(Date.now() - 86400000 * 2).toISOString()
    },
    {
      id: uuidv4(),
      user_id: demoUserId,
      origin_address: 'JNPT Port Terminal, Navi Mumbai',
      destination_address: 'Hadapsar Industrial Estate, Pune',
      vehicle_name: 'FreightMaster 3500 Heavy Truck',
      cargo_name: 'Container Freight (8,000 kg)',
      planned_duration_min: 180,
      actual_duration_min: 185,
      planned_cost: 3200.00,
      actual_cost: 3220.00,
      distance_km: 148.0,
      fuel_used_l: 39.0,
      reroutes_count: 2,
      delays_count: 1,
      total_delay_min: 8,
      optimization_mode: 'CHEAPEST',
      completed_at: new Date(Date.now() - 86400000 * 4).toISOString()
    },
    {
      id: uuidv4(),
      user_id: demoUserId,
      origin_address: 'Bandra Kurla Complex, Mumbai',
      destination_address: 'Hinjawadi Phase 1, Pune',
      vehicle_name: 'VoltRoute Urban e-Van',
      cargo_name: 'Server Hardware Enclosures (900 kg)',
      planned_duration_min: 140,
      actual_duration_min: 142,
      planned_cost: 950.00,
      actual_cost: 960.00,
      distance_km: 135.0,
      fuel_used_l: 24.5,
      reroutes_count: 0,
      delays_count: 0,
      total_delay_min: 0,
      optimization_mode: 'FUEL_EFFICIENT',
      completed_at: new Date(Date.now() - 86400000 * 6).toISOString()
    },
    {
      id: uuidv4(),
      user_id: demoUserId,
      origin_address: 'Thane MIDC, Mumbai',
      destination_address: 'Talegaon Dabhade, Pune',
      vehicle_name: 'Canter InterCity Express',
      cargo_name: 'Precision Bearings (2,100 kg)',
      planned_duration_min: 155,
      actual_duration_min: 175,
      planned_cost: 2100.00,
      actual_cost: 2320.00,
      distance_km: 128.0,
      fuel_used_l: 22.0,
      reroutes_count: 1,
      delays_count: 2,
      total_delay_min: 20,
      optimization_mode: 'FASTEST',
      completed_at: new Date(Date.now() - 86400000 * 8).toISOString()
    }
  ];

  const defaultNotifications = [
    {
      id: uuidv4(),
      user_id: demoUserId,
      type: 'TRAFFIC_WARNING',
      title: 'Monsoon Ghat Slowdown Alert',
      message: 'Khandala Ghat section reports heavy fog and +18 min slowdown. Alternative Expressway lanes recommended.',
      severity: 'WARNING',
      is_read: false,
      data: { route: 'Old NH48', delay_minutes: 18 },
      created_at: new Date(Date.now() - 3600000).toISOString()
    },
    {
      id: uuidv4(),
      user_id: demoUserId,
      type: 'REROUTE_RECOMMENDED',
      title: 'Smart Reroute Optimization Saved 22 Mins',
      message: 'Autonomous reroute suggested via Pune Outer Ring Road bypassed urban gridlock.',
      severity: 'SUCCESS',
      is_read: false,
      data: { time_saved_minutes: 22 },
      created_at: new Date(Date.now() - 7200000).toISOString()
    }
  ];

  db.users = [demoUser];
  db.user_preferences = [demoPreferences];
  db.vehicles = defaultVehicles;
  db.cargo = defaultCargo;
  db.trip_history = historyTrips;
  db.notifications = defaultNotifications;

  saveDatabase();
}

// Load or initialize database
export function initDatabase() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      db = { ...db, ...parsed };
      console.log(`[Database] Loaded local persistent store (${db.users.length} users, ${db.vehicles.length} vehicles, ${db.trip_history.length} history records).`);
    } else {
      console.log('[Database] Initializing fresh database with RouteMind seed presets...');
      seedDatabase();
    }
  } catch (err) {
    console.error('[Database] Error loading database file, re-seeding:', err.message);
    seedDatabase();
  }
}

export function saveDatabase() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('[Database] Failed to write database file:', err.message);
  }
}

// Universal database entity operations
export const Database = {
  // Direct access to tables
  get: (table) => db[table] || [],

  // Query records
  find: (table, predicate) => {
    return (db[table] || []).filter(predicate);
  },

  findOne: (table, predicate) => {
    return (db[table] || []).find(predicate) || null;
  },

  findById: (table, id) => {
    return (db[table] || []).find(item => item.id === id) || null;
  },

  insert: (table, record) => {
    if (!db[table]) db[table] = [];
    const item = {
      id: record.id || uuidv4(),
      ...record,
      created_at: record.created_at || new Date().toISOString(),
      updated_at: record.updated_at || new Date().toISOString()
    };
    db[table].push(item);
    saveDatabase();
    return item;
  },

  update: (table, id, updates) => {
    if (!db[table]) return null;
    const index = db[table].findIndex(item => item.id === id);
    if (index === -1) return null;
    db[table][index] = {
      ...db[table][index],
      ...updates,
      updated_at: new Date().toISOString()
    };
    saveDatabase();
    return db[table][index];
  },

  delete: (table, id) => {
    if (!db[table]) return false;
    const initialLength = db[table].length;
    db[table] = db[table].filter(item => item.id !== id);
    const deleted = db[table].length < initialLength;
    if (deleted) saveDatabase();
    return deleted;
  },

  // Supabase proxy helper
  getSupabaseClient: () => supabase,
  isSupabaseConfigured: () => Boolean(supabase)
};

// Initialize on module load
initDatabase();
