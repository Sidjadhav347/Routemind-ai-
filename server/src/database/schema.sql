-- ============================================================================
-- ROUTEMIND AI - SUPABASE / POSTGRESQL DATABASE SCHEMA
-- "Predict. Optimize. Move Smarter."
-- Theme: AI for Smart Mobility
-- ============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(150) NOT NULL,
    role VARCHAR(50) DEFAULT 'OPERATOR' CHECK (role IN ('COMMUTER', 'DRIVER', 'OPERATOR', 'ADMIN')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. USER PREFERENCES TABLE
CREATE TABLE IF NOT EXISTS user_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    preferred_mode VARCHAR(50) DEFAULT 'BALANCED' CHECK (preferred_mode IN ('FASTEST', 'CHEAPEST', 'FUEL_EFFICIENT', 'LOW_TRAFFIC', 'DEADLINE_PRIORITY', 'BALANCED')),
    default_vehicle_id UUID,
    max_travel_budget NUMERIC(10, 2) DEFAULT 5000.00,
    preferred_fuel_efficiency NUMERIC(5, 2) DEFAULT 12.00,
    arrival_buffer_mins INTEGER DEFAULT 30,
    notify_on_traffic BOOLEAN DEFAULT TRUE,
    notify_on_reroute BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_user_pref UNIQUE (user_id)
);

-- 3. VEHICLES TABLE
CREATE TABLE IF NOT EXISTS vehicles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('CAR', 'BIKE', 'VAN', 'PICKUP', 'LIGHT_TRUCK', 'HEAVY_TRUCK', 'BUS', 'OTHER')),
    length_m NUMERIC(5, 2) NOT NULL DEFAULT 4.50,
    width_m NUMERIC(5, 2) NOT NULL DEFAULT 1.80,
    height_m NUMERIC(5, 2) NOT NULL DEFAULT 1.60,
    max_weight_capacity_kg NUMERIC(10, 2) NOT NULL DEFAULT 1000.00,
    tare_weight_kg NUMERIC(10, 2) NOT NULL DEFAULT 1500.00,
    fuel_type VARCHAR(50) NOT NULL DEFAULT 'DIESEL' CHECK (fuel_type IN ('DIESEL', 'PETROL', 'ELECTRIC', 'HYBRID', 'CNG')),
    fuel_efficiency_km_l NUMERIC(6, 2) NOT NULL DEFAULT 10.00,
    fuel_price_per_unit NUMERIC(8, 2) NOT NULL DEFAULT 95.00,
    status VARCHAR(50) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'IN_TRANSIT', 'MAINTENANCE', 'INACTIVE')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. CARGO TABLE
CREATE TABLE IF NOT EXISTS cargo (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'GENERAL' CHECK (type IN ('GENERAL', 'PERISHABLE', 'HAZARDOUS', 'FRAGILE', 'ELECTRONICS', 'INDUSTRIAL')),
    weight_kg NUMERIC(10, 2) NOT NULL,
    quantity INTEGER DEFAULT 1,
    length_m NUMERIC(5, 2) DEFAULT 1.00,
    width_m NUMERIC(5, 2) DEFAULT 1.00,
    height_m NUMERIC(5, 2) DEFAULT 1.00,
    is_fragile BOOLEAN DEFAULT FALSE,
    priority VARCHAR(50) DEFAULT 'NORMAL' CHECK (priority IN ('LOW', 'NORMAL', 'HIGH', 'URGENT')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. TRIPS TABLE
CREATE TABLE IF NOT EXISTS trips (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    origin_address VARCHAR(255) NOT NULL,
    origin_lat NUMERIC(10, 7) NOT NULL,
    origin_lng NUMERIC(10, 7) NOT NULL,
    destination_address VARCHAR(255) NOT NULL,
    destination_lat NUMERIC(10, 7) NOT NULL,
    destination_lng NUMERIC(10, 7) NOT NULL,
    waypoints JSONB DEFAULT '[]'::jsonb,
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
    cargo_id UUID REFERENCES cargo(id) ON DELETE SET NULL,
    desired_arrival_time TIMESTAMP WITH TIME ZONE,
    max_budget NUMERIC(10, 2),
    optimization_mode VARCHAR(50) DEFAULT 'BALANCED',
    status VARCHAR(50) DEFAULT 'PLANNED' CHECK (status IN ('PLANNED', 'READY', 'ACTIVE', 'DELAYED', 'REROUTE_RECOMMENDED', 'COMPLETED', 'CANCELLED')),
    current_route_id UUID,
    distance_km NUMERIC(8, 2),
    eta_minutes INTEGER,
    estimated_cost NUMERIC(10, 2),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. TRIP ROUTES TABLE
CREATE TABLE IF NOT EXISTS trip_routes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    route_name VARCHAR(150) NOT NULL,
    route_code VARCHAR(20) NOT NULL, -- e.g. Route A, Route B, Route C
    distance_km NUMERIC(8, 2) NOT NULL,
    duration_minutes INTEGER NOT NULL,
    current_eta VARCHAR(50),
    traffic_level VARCHAR(50) DEFAULT 'LOW' CHECK (traffic_level IN ('LOW', 'MODERATE', 'HEAVY', 'SEVERE')),
    fuel_liters NUMERIC(6, 2) NOT NULL,
    fuel_cost NUMERIC(10, 2) NOT NULL,
    toll_cost NUMERIC(10, 2) DEFAULT 0.00,
    total_cost NUMERIC(10, 2) NOT NULL,
    is_compatible BOOLEAN DEFAULT TRUE,
    incompatibility_reason TEXT,
    deadline_feasible BOOLEAN DEFAULT TRUE,
    delay_risk_percent INTEGER DEFAULT 15,
    route_score NUMERIC(5, 2) DEFAULT 80.00,
    score_breakdown JSONB DEFAULT '{}'::jsonb,
    polyline JSONB DEFAULT '[]'::jsonb,
    summary TEXT,
    is_recommended BOOLEAN DEFAULT FALSE,
    is_current BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. TRAFFIC EVENTS TABLE
CREATE TABLE IF NOT EXISTS traffic_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('CONGESTION', 'ACCIDENT', 'ROAD_CLOSURE', 'CONSTRUCTION', 'SLOWDOWN', 'WEATHER')),
    severity VARCHAR(50) NOT NULL CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    location_name VARCHAR(255) NOT NULL,
    lat NUMERIC(10, 7) NOT NULL,
    lng NUMERIC(10, 7) NOT NULL,
    affected_route_name VARCHAR(150),
    delay_minutes INTEGER NOT NULL DEFAULT 15,
    confidence_percent INTEGER DEFAULT 85,
    recommended_action TEXT,
    is_simulated BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. ROUTE RECALCULATIONS (DYNAMIC REROUTING LOG)
CREATE TABLE IF NOT EXISTS route_recalculations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    previous_route_id UUID REFERENCES trip_routes(id),
    new_route_id UUID REFERENCES trip_routes(id),
    previous_eta VARCHAR(50),
    new_eta VARCHAR(50),
    time_saved_minutes INTEGER NOT NULL,
    reason TEXT NOT NULL,
    confidence_percent INTEGER DEFAULT 90,
    ai_explanation TEXT,
    status VARCHAR(50) DEFAULT 'RECOMMENDED' CHECK (status IN ('RECOMMENDED', 'ACCEPTED', 'REJECTED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. DEPARTURE PREDICTIONS
CREATE TABLE IF NOT EXISTS departure_predictions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    deadline_time TIMESTAMP WITH TIME ZONE NOT NULL,
    recommended_departure VARCHAR(50) NOT NULL,
    expected_arrival VARCHAR(50) NOT NULL,
    safety_buffer_minutes INTEGER NOT NULL,
    traffic_risk VARCHAR(50) DEFAULT 'MEDIUM',
    deadline_confidence INTEGER NOT NULL,
    scenarios JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. AI RECOMMENDATIONS & MOBILITY CHAT
CREATE TABLE IF NOT EXISTS ai_recommendations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
    route_id UUID REFERENCES trip_routes(id) ON DELETE SET NULL,
    prompt_context TEXT,
    recommendation_text TEXT NOT NULL,
    reason TEXT,
    benefits JSONB DEFAULT '[]'::jsonb,
    warnings JSONB DEFAULT '[]'::jsonb,
    confidence_percent INTEGER DEFAULT 90,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 11. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('DEPARTURE_REMINDER', 'TRAFFIC_WARNING', 'DELAY_WARNING', 'REROUTE_RECOMMENDED', 'DEADLINE_RISK', 'TRIP_COMPLETED', 'DISRUPTION')),
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    severity VARCHAR(50) DEFAULT 'INFO' CHECK (severity IN ('INFO', 'WARNING', 'ALERT', 'SUCCESS')),
    is_read BOOLEAN DEFAULT FALSE,
    data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 12. TRIP HISTORY & ANALYTICS
CREATE TABLE IF NOT EXISTS trip_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trip_id UUID REFERENCES trips(id) ON DELETE SET NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    origin_address VARCHAR(255) NOT NULL,
    destination_address VARCHAR(255) NOT NULL,
    vehicle_name VARCHAR(150),
    cargo_name VARCHAR(200),
    planned_duration_min INTEGER,
    actual_duration_min INTEGER,
    planned_cost NUMERIC(10, 2),
    actual_cost NUMERIC(10, 2),
    distance_km NUMERIC(8, 2),
    fuel_used_l NUMERIC(6, 2),
    reroutes_count INTEGER DEFAULT 0,
    delays_count INTEGER DEFAULT 0,
    total_delay_min INTEGER DEFAULT 0,
    optimization_mode VARCHAR(50),
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_trips_user_id ON trips(user_id);
CREATE INDEX IF NOT EXISTS idx_trip_routes_trip_id ON trip_routes(trip_id);
CREATE INDEX IF NOT EXISTS idx_traffic_events_trip_id ON traffic_events(trip_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_trip_history_user_id ON trip_history(user_id);
