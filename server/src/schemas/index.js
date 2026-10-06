import { z } from 'zod';

export const optimizationModeEnum = z.enum([
  'FASTEST',
  'CHEAPEST',
  'FUEL_EFFICIENT',
  'LOW_TRAFFIC',
  'DEADLINE_PRIORITY',
  'BALANCED'
]);

export const vehicleTypeEnum = z.enum([
  'CAR',
  'BIKE',
  'VAN',
  'PICKUP',
  'LIGHT_TRUCK',
  'HEAVY_TRUCK',
  'BUS',
  'OTHER'
]);

export const fuelTypeEnum = z.enum([
  'DIESEL',
  'PETROL',
  'ELECTRIC',
  'HYBRID',
  'CNG'
]);

export const cargoTypeEnum = z.enum([
  'GENERAL',
  'PERISHABLE',
  'HAZARDOUS',
  'FRAGILE',
  'ELECTRONICS',
  'INDUSTRIAL'
]);

export const cargoPriorityEnum = z.enum([
  'LOW',
  'NORMAL',
  'HIGH',
  'URGENT'
]);

// Auth Schemas
export const registerSchema = z.object({
  email: z.string().trim().email('Please provide a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().trim().min(2, 'Name must be at least 2 characters'),
  role: z.enum(['COMMUTER', 'DRIVER', 'OPERATOR']).optional().default('OPERATOR')
});

export const loginSchema = z.object({
  email: z.string().trim().email('Please provide a valid email address'),
  password: z.string().min(1, 'Password is required')
});

// User Preferences Schema
export const updatePreferencesSchema = z.object({
  preferred_mode: optimizationModeEnum.optional(),
  default_vehicle_id: z.string().uuid().nullable().optional(),
  max_travel_budget: z.number().positive().optional(),
  preferred_fuel_efficiency: z.number().positive().optional(),
  arrival_buffer_mins: z.number().int().min(5).max(180).optional(),
  notify_on_traffic: z.boolean().optional(),
  notify_on_reroute: z.boolean().optional()
});

// Vehicle Schema
export const vehicleSchema = z.object({
  name: z.string().min(2, 'Vehicle name must be at least 2 characters'),
  type: vehicleTypeEnum,
  length_m: z.number().positive('Length must be greater than 0'),
  width_m: z.number().positive('Width must be greater than 0'),
  height_m: z.number().positive('Height must be greater than 0'),
  max_weight_capacity_kg: z.number().positive('Max weight capacity must be greater than 0'),
  tare_weight_kg: z.number().positive('Tare weight must be greater than 0'),
  fuel_type: fuelTypeEnum,
  fuel_efficiency_km_l: z.number().positive('Fuel efficiency must be greater than 0'),
  fuel_price_per_unit: z.number().positive('Fuel price must be greater than 0'),
  status: z.enum(['ACTIVE', 'IN_TRANSIT', 'MAINTENANCE', 'INACTIVE']).optional().default('ACTIVE')
});

// Cargo Schema
export const cargoSchema = z.object({
  name: z.string().min(2, 'Cargo name is required'),
  type: cargoTypeEnum.default('GENERAL'),
  weight_kg: z.number().positive('Cargo weight must be greater than 0'),
  quantity: z.number().int().positive().default(1),
  length_m: z.number().positive().optional().default(1.0),
  width_m: z.number().positive().optional().default(1.0),
  height_m: z.number().positive().optional().default(1.0),
  is_fragile: z.boolean().optional().default(false),
  priority: cargoPriorityEnum.optional().default('NORMAL')
});

// Location / Coordinate Schema
export const locationSchema = z.object({
  address: z.string().optional().default(''),
  lat: z.number().min(-90).max(90, 'Valid latitude required (-90 to 90)'),
  lng: z.number().min(-180).max(180, 'Valid longitude required (-180 to 180)')
});

export const flexibleLocationSchema = z.union([
  locationSchema,
  z.string().min(1, 'Location query must not be empty')
]);

// Trip Creation Schema (Validates origin, destination, vehicle, payload weight, budget, deadline, mode)
export const createTripSchema = z.object({
  origin: flexibleLocationSchema,
  destination: flexibleLocationSchema,
  waypoints: z.array(flexibleLocationSchema).optional().default([]),
  vehicle_id: z.string().optional().nullable(),
  vehicleType: z.string().optional(),
  vehicle_type: z.string().optional(),
  cargo_id: z.string().optional().nullable(),
  weight: z.number().min(0).optional(),
  weight_kg: z.number().min(0).optional(),
  volume: z.number().min(0).optional(),
  volume_m3: z.number().min(0).optional(),
  dimensions: z.object({
    length_m: z.number().optional(),
    width_m: z.number().optional(),
    height_m: z.number().optional()
  }).optional(),
  desired_arrival_time: z.string().optional().nullable(),
  deadline: z.string().optional().nullable(),
  max_budget: z.number().min(0).optional().nullable(),
  budget: z.number().min(0).optional().nullable(),
  optimization_mode: z.string().optional().default('BALANCED'),
  optimizationMode: z.string().optional()
});

// Dynamic Rerouting Action Schema
export const rerouteActionSchema = z.object({
  new_route_id: z.string().uuid('Valid route ID required'),
  action: z.enum(['ACCEPT', 'REJECT'])
});

// What-If Simulator Schema
export const simulatorSchema = z.object({
  vehicle_type: vehicleTypeEnum.default('HEAVY_TRUCK'),
  cargo_weight_kg: z.number().min(0).default(3000),
  origin_name: z.string().default('Mumbai'),
  destination_name: z.string().default('Pune'),
  origin_lat: z.number().optional().default(19.0760),
  origin_lng: z.number().optional().default(72.8777),
  destination_lat: z.number().optional().default(18.5204),
  destination_lng: z.number().optional().default(73.8567),
  deadline_time: z.string().optional(),
  budget: z.number().positive().default(2000)
});

// AI Mobility Assistant Query Schema
export const aiChatSchema = z.object({
  query: z.string().min(2, 'Query must be at least 2 characters'),
  trip_id: z.string().uuid().optional().nullable(),
  apiKey: z.string().optional().nullable(),
  context: z.record(z.any()).optional()
});
