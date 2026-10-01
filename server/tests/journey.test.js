import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'http';
import app from '../src/app.js';

let server;
let baseUrl;

test.before(async () => {
  await new Promise((resolve) => {
    server = http.createServer(app);
    server.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://localhost:${port}`;
      resolve();
    });
  });
});

test.after(async () => {
  await new Promise((resolve) => server.close(resolve));
});

test('End-to-End User Journey API Flow', async () => {
  // 1. Login with demo credentials
  const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'demo@routemind.ai', password: 'password123' })
  });
  const loginData = await loginRes.json();
  assert.equal(loginRes.status, 200);
  assert.ok(loginData.data.token, 'Should return valid JWT token');
  const token = loginData.data.token;
  const authHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  // 2. Fetch fleet vehicles
  const vehRes = await fetch(`${baseUrl}/api/vehicles`, { headers: authHeaders });
  const vehData = await vehRes.json();
  assert.equal(vehRes.status, 200);
  assert.ok(vehData.data.length >= 1, 'Should have seed vehicles');
  const heavyTruck = vehData.data.find(v => v.type === 'HEAVY_TRUCK') || vehData.data[0];

  // 3. Fetch or add cargo
  const cargoRes = await fetch(`${baseUrl}/api/cargo`, { headers: authHeaders });
  const cargoData = await cargoRes.json();
  const cargo = cargoData.data[0];

  // 4. Create Trip (Step 2 - 7 of Hackathon Demonstration)
  // Mumbai to Pune, Heavy Truck, 3000 kg, Deadline 6 PM, Budget ₹2,000, Balanced mode
  const tripRes = await fetch(`${baseUrl}/api/trips`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      origin: { address: 'Mumbai, Maharashtra', lat: 19.0760, lng: 72.8777 },
      destination: { address: 'Pune, Maharashtra', lat: 18.5204, lng: 73.8567 },
      vehicle_id: heavyTruck.id,
      cargo_id: cargo ? cargo.id : null,
      desired_arrival_time: new Date(Date.now() + 180 * 60 * 1000).toISOString(),
      max_budget: 2000.0,
      optimization_mode: 'BALANCED'
    })
  });
  const tripData = await tripRes.json();
  if (tripRes.status !== 201) console.error('Trip Creation Error:', tripData);
  assert.equal(tripRes.status, 201);
  assert.ok(tripData.data.trip.id, 'Trip should be created');
  assert.ok(tripData.data.routes.length >= 2, 'Should generate multiple candidate routes');
  assert.ok(tripData.data.departurePrediction.recommendedDeparture, 'Should generate departure prediction');
  assert.ok(tripData.data.aiExplanation.reason, 'Should produce AI route explanation');

  const tripId = tripData.data.trip.id;

  // 5. Start Trip (Step 8)
  const startRes = await fetch(`${baseUrl}/api/trips/${tripId}/start`, {
    method: 'POST',
    headers: authHeaders
  });
  const startData = await startRes.json();
  assert.equal(startData.data.status, 'ACTIVE');

  // 6. Simulate Incident & Dynamic Reroute (Step 9 - 13)
  const simRes = await fetch(`${baseUrl}/api/trips/${tripId}/simulate-incident`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      type: 'CONGESTION',
      delayMinutes: 28
    })
  });
  const simData = await simRes.json();
  assert.equal(simRes.status, 200);
  assert.ok(simData.data.rerouteProposal.isRerouteRecommended, 'Reroute should be recommended due to 28 min delay');
  assert.ok(simData.data.rerouteProposal.timeSavedMinutes >= 8, 'Time saved should exceed threshold');

  // 7. Apply Reroute Switch
  const newRouteId = simData.data.rerouteProposal.recommendedRoute.id;
  const switchRes = await fetch(`${baseUrl}/api/trips/${tripId}/reroute/apply`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ new_route_id: newRouteId })
  });
  const switchData = await switchRes.json();
  assert.equal(switchRes.status, 200);
  assert.equal(switchData.data.trip.current_route_id, newRouteId);

  // 8. What-If Simulator (Section 27)
  const simRunRes = await fetch(`${baseUrl}/api/ai/simulate`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      vehicle_type: 'HEAVY_TRUCK',
      cargo_weight_kg: 3000,
      origin_name: 'Mumbai',
      destination_name: 'Pune',
      budget: 2000
    })
  });
  const simRunData = await simRunRes.json();
  assert.equal(simRunRes.status, 200);
  assert.ok(simRunData.data.scenarios.FASTEST);
  assert.ok(simRunData.data.scenarios.CHEAPEST);
  assert.ok(simRunData.data.scenarios.FUEL_EFFICIENT);
  assert.ok(simRunData.data.scenarios.BALANCED);

  // 9. Complete Trip & Analytics
  const completeRes = await fetch(`${baseUrl}/api/trips/${tripId}/complete`, {
    method: 'POST',
    headers: authHeaders
  });
  const completeData = await completeRes.json();
  assert.equal(completeData.data.status, 'COMPLETED');

  const analyticsRes = await fetch(`${baseUrl}/api/analytics`, { headers: authHeaders });
  const analyticsData = await analyticsRes.json();
  assert.ok(analyticsData.data.overview.completedTrips >= 1);
});
