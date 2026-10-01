# RouteMind AI
### *"Predict. Optimize. Move Smarter."*

> **Hackathon Theme: AI for Smart Mobility**  
> An intelligent transportation and logistics optimization platform that unifies real-time telemetry, vehicle physical clearances, gross weight restrictions, multi-factor weighted routing, AI-grounded explanations, and autonomous dynamic rerouting.

---

## 1. What RouteMind AI Is
**RouteMind AI** is an intelligent mobility platform designed for commercial logistics operators, delivery fleets, and intercity commuters. Rather than behaving like a simple navigation application that merely seeks the shortest Euclidean path, RouteMind AI simultaneously optimizes across physical road restrictions, traffic congestion curves, vehicle tare/cargo weights, fuel economy penalties, toll tariffs, and SLA delivery deadlines.

---

## 2. Problem Statement
Modern logistics dispatchers and commercial drivers face severe daily bottlenecks:
- **Vehicle Incompatibility & Bridge Collisions**: Heavy and tall commercial trucks frequently encounter low heritage railway underpasses or weight-limited municipal bridges.
- **Unpredicted Congestion Surges**: Rush hour bottlenecks and ghat section incidents inflate travel time by 40–80%, resulting in breached delivery SLAs.
- **Suboptimal Multi-Objective Trade-offs**: Traditional GPS apps do not compute true operational expenses (fuel consumption adjusted for gradient and cargo load + highway toll tariffs + operating wear).
- **Static In-Transit Routing**: When incidents occur mid-route, drivers rarely receive proactive recommendations with quantitative time-saved justifications.

---

## 3. The RouteMind AI Solution
RouteMind AI introduces an end-to-end autonomous routing and dispatch intelligence loop:
1. **Physical Clearance & Weight Verification**: Pre-screens routes against vehicle height, length, width, and gross payload weight.
2. **Multi-Factor Weighted Optimization**: Normalizes and scores travel time, fuel liters, tolls, congestion, and deadline reliability across custom operator profiles (`FASTEST`, `CHEAPEST`, `FUEL_EFFICIENT`, `LOW_TRAFFIC`, `DEADLINE_PRIORITY`, `BALANCED`).
3. **AI Grounded Explanations**: Generates transparent, natural-language justifications for why a route was picked, without hallucinating transportation facts.
4. **AI-Assisted Departure Window Prediction**: Computes optimal departure windows, safety buffers, and risk probabilities to guarantee on-time arrival.
5. **Autonomous Dynamic Rerouting**: Periodically tracks active telemetry; if delay surpasses a configurable threshold (e.g. $\ge 8$ min) and an alternative corridor yields significant savings (e.g. 28 min saved), it alerts the operator and enables 1-click route diversion.
6. **What-If Transportation Simulator**: Allows dispatchers to simulate trade-offs between vehicle classes, payloads, budgets, and objectives side-by-side.

---

## 4. Key Features
- **Interactive Multi-Corridor Leaflet Maps**: Color-coded routes (Indigo for recommended expressway, Amber for arterial corridors, Cyan for bypasses, pulsing Red for incident alerts).
- **Vehicle Size & Weight-Aware Routing**: Proactively flags and rejects routes that breach overhead clearances (e.g. 3.5m low heritage underpasses) or structural weight ratings (e.g. 7.5T bridge limits).
- **Fuel Calculation Engine**: Incorporates stop-and-go congestion multipliers (up to +48% in severe traffic) and cargo weight penalties (+3.5% per extra 1,000 kg).
- **Cost Calculation Engine**: Itemizes fuel expenses, toll plaza tariffs, and vehicle wear allocations.
- **Active Trip Telemetry & Live Monitor**: Real-time progress monitoring, congestion alert triggers, and seamless reroute acceptance.
- **AI Mobility Assistant Drawer**: Conversational assistant answering natural-language queries ("I need to deliver 500 kg from Mumbai to Pune by 6 PM", "Why did you choose Route A?", "Can I use this truck on this route?").
- **Fleet & Cargo Management**: Full CRUD management of vehicle specs (dimensions, tare weight, fuel type) and cargo consignments (dimensions, weight, fragility, priority).
- **Operational Analytics Dashboard**: Historical fleet logs, expense savings metrics (16.5% average ROI), reroute event counters, and AI machine-learning pattern detection.
- **Interactive Hackathon Simulation Deck**: 5 one-click demo presets for live presentations.
- **n8n Webhook Integration**: Dedicated endpoints for automated traffic synchronization and active trip batch recalculations.

---

## 5. AI Integration & Grounding Principles
RouteMind AI adheres to a strict grounding rule: **The AI model is never permitted to invent factual transportation metrics (such as distance, actual traffic speed, fuel prices, toll rates, or road clearances).**
- All quantitative facts originate from the deterministic backend calculation engines and OpenStreetMap/OSRM providers.
- The AI layer (powered by Google Gemini / fallback grounded domain reasoning engine) handles:
  - Natural-language query parsing and intent extraction.
  - Personalized route reasoning and trade-off explanations.
  - Summarizing traffic incident severities and recommended actions.
  - Synthesizing historical transit patterns into actionable dispatch advice.

---

## 6. Route Optimization Scoring Logic
The composite route score ($0 - 100$) is computed dynamically using configurable weights:
$$\text{Score} = (S_{\text{time}} \cdot w_t) + (S_{\text{traffic}} \cdot w_{\text{tr}}) + (S_{\text{cost}} \cdot w_c) + (S_{\text{fuel}} \cdot w_f) + (S_{\text{deadline}} \cdot w_d) + (S_{\text{risk}} \cdot w_r)$$

| Optimization Mode | Time ($w_t$) | Traffic ($w_{\text{tr}}$) | Cost ($w_c$) | Fuel ($w_f$) | Deadline ($w_d$) | Reliability ($w_r$) |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **FASTEST** | 0.50 | 0.20 | 0.10 | 0.05 | 0.10 | 0.05 |
| **CHEAPEST** | 0.10 | 0.05 | 0.55 | 0.15 | 0.10 | 0.05 |
| **FUEL_EFFICIENT** | 0.10 | 0.15 | 0.15 | 0.50 | 0.05 | 0.05 |
| **LOW_TRAFFIC** | 0.20 | 0.50 | 0.05 | 0.10 | 0.05 | 0.10 |
| **DEADLINE_PRIORITY**| 0.30 | 0.15 | 0.05 | 0.05 | 0.35 | 0.10 |
| **BALANCED** | 0.25 | 0.20 | 0.20 | 0.15 | 0.10 | 0.10 |

*Disqualification*: If a candidate route violates physical bridge clearances or structural weight ratings, it is marked `is_compatible = false`, penalized with a score cap ($\le 25$), and disqualified from recommendation.

---

## 7. Dynamic Rerouting Engine
1. During an active trip, the system monitors road congestion and incident telemetry.
2. If the current corridor encounters sudden congestion (e.g. +28 min delay on Expressway), the system recalculates compatible alternatives (e.g. Khalapur Ring Bypass).
3. **Threshold Guard**: Only recommends diversion if $\Delta t_{\text{saved}} \ge 8$ minutes (prevents erratic ping-pong rerouting).
4. Returns an alert displaying:
   - **Current Route**: ETA 5:52 PM (Degraded)
   - **Recommended Diversion**: ETA 5:24 PM (Expedited)
   - **Time Saved**: 28 minutes
   - **AI Justification**: Explains the rationale and confidence level.
5. The operator clicks **"Switch to New Route"** to dynamically repoint active telemetry and update ETA.

---

## 8. Vehicle & Cargo Physical Clearance Checks
- **Overhead Clearance**: Compares vehicle height (e.g. 3.8m Heavy Hauler) against road segment clearance limits (e.g. 3.5m Heritage Rail Underpass on Old NH48).
- **Structural Gross Weight**: Computes $\text{Gross Load} = \text{Tare Weight} + \text{Cargo Weight}$. Compares against municipal bridge structural ratings (e.g. 7.5 Tonnes limit).
- **Overload Prevention**: Rejects cargo weights exceeding the vehicle's rated maximum payload capacity.

---

## 9. Technology Stack
- **Frontend**: React 19, Vite, Tailwind CSS, React Router v7, Leaflet, React-Leaflet, Lucide React, Axios.
- **Backend**: Node.js (ES Modules), Express.js, Helmet, CORS, JWT (`jsonwebtoken`), Bcrypt (`bcryptjs`), Zod, UUID.
- **Database**: Supabase PostgreSQL DDL (`schema.sql`) + Built-in zero-config local persistent store for out-of-the-box local execution.
- **AI**: Google Gemini API (`@google/generative-ai`) with deterministic fallback domain engine.
- **Routing & Maps**: OpenStreetMap tiles, Nominatim Geocoding API, OSRM (Open Source Routing Machine) corridor provider.
- **Automation**: n8n Webhook integration endpoints for scheduled traffic updates and active trip scans.

---

## 10. Database Schema (Supabase PostgreSQL)
The database structure is defined in [`server/src/database/schema.sql`](file:///c:/workshop/server/src/database/schema.sql):
- `users`: Operator, Driver, and Commuter credentials.
- `user_preferences`: Preferred optimization mode, budget, buffer minutes.
- `vehicles`: Fleet dimensions ($L \times W \times H$), tare weights, capacities, fuel efficiencies, and status.
- `cargo`: Consignment manifest, weight, dimensions, fragility, and dispatch priority.
- `trips`: Origin, destination, waypoints, vehicle FK, cargo FK, deadline, budget, status, active route FK.
- `trip_routes`: Candidate corridors, distances, durations, current ETAs, toll tariffs, fuel liters, scores, and polylines.
- `traffic_events`: Active congestion, accidents, closures, location coordinates, delays, and simulated flags.
- `route_recalculations`: Audit log of dynamic reroute recommendations, time saved, and acceptance status.
- `departure_predictions`: Predicted departure windows, safety arrival buffers, risk profiles, and scenario matrices.
- `ai_recommendations`: AI route explanations, advantages, advisory constraints, and confidence ratings.
- `notifications`: Dispatch notifications, traffic warnings, and reroute alerts.
- `trip_history`: Completed trip analytics audit log for ROI calculation and delay pattern discovery.

---

## 11. Environment Configuration (`.env.example`)
```env
# Server Port
PORT=5000

# Authentication
JWT_SECRET=routemind_super_secure_jwt_secret_key_2026_smart_mobility
JWT_EXPIRES_IN=7d

# Google Gemini API (Optional: Grounded deterministic engine operates if omitted)
GEMINI_API_KEY=
GEMINI_MODEL=gemini-1.5-flash

# Supabase PostgreSQL (Optional: Zero-config local persistence operates out-of-the-box)
SUPABASE_URL=
SUPABASE_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# n8n Automation Webhooks
N8N_WEBHOOK_URL=
```

---

## 12. Local Setup & Running

### Prerequisites
- Node.js $\ge 18$ (Tested on Node v24.21.0)
- npm $\ge 9$

### Quick Start (Runs Entire App)
1. **Clone repository & install dependencies**:
   ```bash
   cd c:\workshop
   npm install
   npm --prefix server install
   npm --prefix client install
   ```

2. **Run both Backend & Frontend simultaneously**:
   ```bash
   npm run dev
   ```
   - **Frontend UI**: [http://localhost:3000](http://localhost:3000)
   - **Backend API**: [http://localhost:5000](http://localhost:5000)
   - **Health Check**: [http://localhost:5000/api/health](http://localhost:5000/api/health)

3. **Run Automated Test Suite**:
   ```bash
   npm --prefix server test
   ```
   *Executes 8 test suites validating fuel calculation, physical clearances, multi-objective scoring, departure prediction, and the end-to-end user API journey.*

---

## 13. Hackathon Demonstration Walkthrough (14 Steps)
For live judging, follow this workflow:
1. Open [http://localhost:3000](http://localhost:3000).
2. Click **"1-Click Hackathon Demo Credentials"** (`demo@routemind.ai` / `password123`) and sign in.
3. On the **Trip Optimizer**:
   - Origin: `Mumbai, Maharashtra`
   - Destination: `Pune, Maharashtra`
   - Vehicle: `FreightMaster 3500 Heavy Truck` (3.8m tall, 16,000 kg capacity)
   - Cargo: `Industrial Precision Turbines` (3,000 kg payload)
   - Objective: `Balanced`
   - Deadline: `6:00 PM`
   - Budget: `₹2,000`
4. Click **"Generate & Optimize Routes"**.
5. Observe:
   - **Candidate Comparison**: Route A (Expressway: 100% compliant), Route B (NH48: Rejected due to 3.5m bridge clearance), Route C (Khalapur Bypass: 100% compliant).
   - **AI Route Recommendation Banner**: Explains why Route A was chosen with confidence percentage.
   - **Departure Prediction Matrix**: Displays 4 departure windows with safety arrival buffers.
6. Click **"Engage Live Trip Telemetry"** (transitions to `/monitor`).
7. Click **"Simulate +28m Traffic Jam"** in the Hackathon Simulator deck.
8. The urgent **"Route Change Recommended: Save 28 Minutes"** advisory banner appears with current vs. new ETA comparison.
9. Click **"Switch to New Route & Save 28 Mins"**; watch active route telemetry divert immediately.
10. Click **"Complete Delivery & Update Analytics"**; view the updated ROI savings metrics and ML insights on the Analytics dashboard.
11. Explore the **What-If Transportation Simulator** (`/simulator`) to inspect side-by-side trade-offs.
12. Click **"AI Co-Pilot"** in the top navigation bar to test conversational queries.

---

## 14. REST API Reference
- `POST /api/auth/register` — Create operator account.
- `POST /api/auth/login` — Sign in and receive JWT token.
- `GET /api/vehicles` / `POST /api/vehicles` — Fleet CRUD.
- `GET /api/cargo` / `POST /api/cargo` — Consignment CRUD.
- `POST /api/trips` — Multi-route generation, constraint screening, and AI departure prediction.
- `GET /api/trips/:id` — Full trip telemetry and active corridors.
- `POST /api/trips/:id/start` — Mark trip status `ACTIVE`.
- `POST /api/trips/:id/simulate-incident` — Inject simulated traffic disruption.
- `POST /api/trips/:id/reroute/apply` — Execute dynamic route switch.
- `POST /api/trips/:id/complete` — Complete trip and record to history.
- `POST /api/ai/chat` — Conversational AI mobility queries.
- `POST /api/ai/simulate` — What-If transportation scenario simulation.
- `GET /api/analytics` — Fleet operational analytics and ML pattern insights.
- `GET /api/coloading/matches` — AI autonomous matching for shared container/reefer freight.
- `GET /api/coloading/listings` / `POST /api/coloading/listings` — Post and browse open vehicle space and freight requests.
- `POST /api/coloading/matches/accept` — Ratify digital co-loading SLA smart contract with escrow split.
- `GET /api/coloading/stats` — Network-wide cost reduction and CO2 avoided analytics.
- `GET /api/config/keys` / `POST /api/config/keys` — Configure & verify Google Maps and Gemini AI API keys.
- `POST /api/webhooks/traffic-sync` — n8n traffic synchronization webhook.

---

## 15. Autonomous Co-Loading Marketplace (`/coloading`)
A breakthrough collaborative logistics network allowing non-competing enterprises to share empty container and refrigerated trailer space in real time:
- **Corridor & Volume Scanning**: When a refrigerated truck on a specific lane (e.g. Mumbai ➔ Pune) is only 60% filled, the AI scans the network and matches them with a shipper needing compatible cold-chain movement (+2°C to +8°C).
- **Autonomous Cost Splitting**: Fair pro-rata weight distribution with an 8% host incentive credit. Company A saves ₹3,077 (36.6%), Company B saves ₹2,923 (43.0%), total savings ₹6,000 (39.5%).
- **Space Surge & Carbon Reduction**: Container utilization jumps from 60.0% to 91.1%, eliminating 1 full diesel deadhead trip and avoiding 102 kg CO₂.
- **Digital Smart Contract SLA**: Escrow percentage split (57.9% Host / 42.1% Guest) with temperature telemetry guarantees.

---

## 16. Interactive Map Location Pinning
- **Click-to-Pin**: Drop Departure Origin (Pin A), Arrival Destination (Pin B), or Waypoint Stops directly on the map.
- **Draggable Pins**: Move pins to exact logistics hubs, warehouse gates, or highway junctions with real-time reverse geocoding.
- **Map Layer Switcher**: Toggle between RouteMind Dark, Google Maps (Road), Google Maps (Hybrid), and Google Satellite.

---

## 17. Known Limitations & Production Roadmap
- **Real-Time Cellular Telemetry**: Currently relies on Google Maps Directions, OSRM corridor APIs and simulated telemetry injection. In production, vehicle GPS pings can be ingested via MQTT/Kafka into Supabase Realtime.
- **Toll Tag (FASTag) Integration**: Toll tariffs use curated expressway tariff tables; direct integration with NPCI FASTag APIs can provide live vehicle toll deductions.
- **Dynamic Weather Overlays**: Extreme monsoon ghat landslides can be integrated via OpenWeatherMap radar APIs.

---

**Developed for the Hackathon: AI for Smart Mobility**  
*RouteMind AI — Predict. Optimize. Move Smarter.*

