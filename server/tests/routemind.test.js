import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateFuelConsumption } from '../src/utils/fuelCalculator.js';
import { calculateTotalTripCost } from '../src/utils/costCalculator.js';
import { RestrictionChecker } from '../src/services/optimization/restrictionChecker.js';
import { OptimizationEngine } from '../src/services/optimization/optimizationEngine.js';
import { DeparturePredictorService } from '../src/services/trips/departurePredictorService.js';
import { DynamicRerouteService } from '../src/services/traffic/dynamicRerouteService.js';
import { AIService } from '../src/services/ai/geminiService.js';
import { Database } from '../src/database/db.js';

test('1. Fuel Calculation Engine with Traffic & Payload Penalty', () => {
  // Free flowing traffic with empty cargo
  const lowTraffic = calculateFuelConsumption({
    distanceKm: 100,
    vehicleFuelEfficiencyKmL: 10.0,
    fuelPricePerUnit: 100,
    trafficLevel: 'LOW',
    cargoWeightKg: 0
  });
  assert.equal(lowTraffic.totalFuelLiters, 10.0);
  assert.equal(lowTraffic.fuelCost, 1000.0);

  // Heavy traffic (+28% fuel) with 3,000 kg cargo
  const heavyTraffic = calculateFuelConsumption({
    distanceKm: 100,
    vehicleFuelEfficiencyKmL: 10.0,
    fuelPricePerUnit: 100,
    trafficLevel: 'HEAVY',
    cargoWeightKg: 3000
  });
  assert.ok(heavyTraffic.totalFuelLiters > 12.0, 'Heavy traffic and cargo should consume significantly more fuel');
  assert.ok(heavyTraffic.fuelCost > 1200.0, 'Fuel cost should reflect congestion multiplier');
});

test('2. Total Cost Calculation with Tolls and Operating Wear', () => {
  const tripCost = calculateTotalTripCost({
    fuelCost: 1500,
    tollCost: 320,
    distanceKm: 140,
    vehicleType: 'HEAVY_TRUCK'
  });
  assert.equal(tripCost.tollCost, 320);
  assert.ok(tripCost.totalEstimatedCost > 1820, 'Total cost must incorporate operating allocation and tolls');
  assert.ok(tripCost.breakdown.fuelPercentage > 0);
});

test('3. Vehicle Height Clearance Restriction Check', () => {
  const tallTruck = { height_m: 3.8, tare_weight_kg: 5000, max_weight_capacity_kg: 10000 };
  const standardCar = { height_m: 1.5, tare_weight_kg: 1400, max_weight_capacity_kg: 500 };

  // Route with low heritage bridge (3.5m clearance limit)
  const restrictedRoute = {
    name: 'Old Mumbai-Pune Highway / Khandala Bhor Ghat',
    summary: 'Old highway passes under heritage railway overpass'
  };

  const truckCheck = RestrictionChecker.evaluateCompatibility(tallTruck, null, restrictedRoute);
  assert.equal(truckCheck.isCompatible, false, '3.8m tall truck must be rejected on 3.5m bridge');
  assert.match(truckCheck.reason, /height/i);

  const carCheck = RestrictionChecker.evaluateCompatibility(standardCar, null, restrictedRoute);
  assert.equal(carCheck.isCompatible, true, '1.5m car must be permitted');
});

test('4. Vehicle Gross Weight Restriction Check', () => {
  const heavyTruck = { height_m: 3.0, tare_weight_kg: 6000, max_weight_capacity_kg: 12000 };
  const heavyCargo = { weight_kg: 3500 }; // Gross weight = 9.5 Tonnes

  // Route with 7.5 Tonnes bridge limit
  const weightRestrictedRoute = {
    name: 'Old Pune-Mumbai Tunnel & City Flyover',
    summary: 'Structural limit 7.5T'
  };

  const check = RestrictionChecker.evaluateCompatibility(heavyTruck, heavyCargo, weightRestrictedRoute);
  assert.equal(check.isCompatible, false, '9.5 Tonnes gross weight must violate 7.5 Tonnes limit');
  assert.match(check.reason, /load limit/i);
});

test('5. Multi-Mode Route Optimization Weighted Scoring', () => {
  const candidateRoutes = [
    {
      id: 'route-fast',
      duration_minutes: 45,
      total_cost: 600,
      fuel_liters: 12,
      traffic_level: 'LOW',
      is_compatible: true
    },
    {
      id: 'route-cheap',
      duration_minutes: 75,
      total_cost: 350,
      fuel_liters: 8,
      traffic_level: 'MODERATE',
      is_compatible: true
    }
  ];

  // In FASTEST mode, fastest route should score higher
  const fastestScored = OptimizationEngine.scoreAndRankRoutes(candidateRoutes, 'FASTEST');
  assert.equal(fastestScored[0].id, 'route-fast', 'Fastest mode must rank lower duration first');

  // In CHEAPEST mode, cheaper route should score higher
  const cheapestScored = OptimizationEngine.scoreAndRankRoutes(candidateRoutes, 'CHEAPEST');
  assert.equal(cheapestScored[0].id, 'route-cheap', 'Cheapest mode must rank lower cost first');
});

test('6. Departure Window Prediction and Safety Buffer', () => {
  const deadline = new Date(Date.now() + 180 * 60 * 1000).toISOString(); // 3 hours from now
  const prediction = DeparturePredictorService.predictDepartureWindows({
    desiredDeadline: deadline,
    baseDurationMinutes: 100,
    trafficCondition: 'MODERATE',
    preferredBufferMinutes: 30
  });

  assert.ok(prediction.recommendedDeparture, 'Should return recommended departure');
  assert.ok(prediction.expectedArrival, 'Should return expected arrival');
  assert.equal(prediction.safetyBufferMinutes, 30);
  assert.equal(prediction.scenarios.length, 4, 'Should provide 4 departure scenarios');
  const recommendedScenario = prediction.scenarios.find(s => s.isRecommended);
  assert.ok(recommendedScenario, 'Should tag recommended window');
});

test('7. AI Route Explanation Verification', async () => {
  const route = {
    id: 'test-route-1',
    route_code: 'Route A',
    route_name: 'Expressway',
    current_eta: '5:15 PM',
    duration_minutes: 135,
    distance_km: 145,
    total_cost: 1600,
    fuel_liters: 32,
    fuel_cost: 1200,
    toll_cost: 320,
    traffic_level: 'LOW',
    route_score: 92,
    delay_risk_percent: 10
  };

  const explanation = await AIService.explainRouteRecommendation({
    recommendedRoute: route,
    alternativeRoutes: [],
    vehicle: { height_m: 3.8, tare_weight_kg: 5000 },
    cargo: { weight_kg: 2000 },
    optimizationMode: 'BALANCED'
  });

  assert.ok(explanation.recommendation, 'Must provide recommendation text');
  assert.ok(explanation.reason, 'Must explain why the route was picked');
  assert.ok(explanation.benefits.length >= 2, 'Must list key benefits');
  assert.ok(explanation.confidence >= 80, 'Must have high confidence score');
});
