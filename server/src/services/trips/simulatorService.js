import { RouteGeneratorService } from '../routing/routeGeneratorService.js';
import { OptimizationEngine } from '../optimization/optimizationEngine.js';
import { AIService } from '../ai/geminiService.js';
import { formatTimeWithAMPM } from '../../utils/distanceUtils.js';

export class SimulatorService {
  /**
   * Run multi-objective What-If transportation simulation
   */
  static async runSimulation({
    vehicleType = 'HEAVY_TRUCK',
    cargoWeightKg = 3000,
    originName = 'Mumbai',
    destinationName = 'Pune',
    originLat = 19.0760,
    originLng = 72.8777,
    destinationLat = 18.5204,
    destinationLng = 73.8567,
    deadlineTime = '6:00 PM',
    budget = 2000
  }) {
    // Virtual vehicle profile based on type
    const virtualVehicles = {
      HEAVY_TRUCK: {
        name: 'Freight Heavy Hauler (Multi-Axle)',
        type: 'HEAVY_TRUCK',
        length_m: 12.5,
        width_m: 2.55,
        height_m: 3.8,
        tare_weight_kg: 7500,
        max_weight_capacity_kg: 16000,
        fuel_type: 'DIESEL',
        fuel_efficiency_km_l: 3.8,
        fuel_price_per_unit: 92.50
      },
      LIGHT_TRUCK: {
        name: 'Medium Commercial Truck',
        type: 'LIGHT_TRUCK',
        length_m: 7.2,
        width_m: 2.2,
        height_m: 2.8,
        tare_weight_kg: 3200,
        max_weight_capacity_kg: 5000,
        fuel_type: 'DIESEL',
        fuel_efficiency_km_l: 6.8,
        fuel_price_per_unit: 92.50
      },
      VAN: {
        name: 'Urban Electric Cargo Van',
        type: 'VAN',
        length_m: 5.4,
        width_m: 1.95,
        height_m: 2.1,
        tare_weight_kg: 2200,
        max_weight_capacity_kg: 1500,
        fuel_type: 'ELECTRIC',
        fuel_efficiency_km_l: 5.5,
        fuel_price_per_unit: 12.00
      },
      CAR: {
        name: 'Express Sedan Logistics',
        type: 'CAR',
        length_m: 4.6,
        width_m: 1.8,
        height_m: 1.5,
        tare_weight_kg: 1400,
        max_weight_capacity_kg: 500,
        fuel_type: 'PETROL',
        fuel_efficiency_km_l: 14.0,
        fuel_price_per_unit: 104.00
      }
    };

    const vehicle = virtualVehicles[vehicleType] || virtualVehicles.HEAVY_TRUCK;
    const cargo = {
      name: 'Simulated Cargo Payload',
      weight_kg: cargoWeightKg,
      type: 'INDUSTRIAL'
    };

    const origin = { address: originName, lat: originLat, lng: originLng };
    const destination = { address: destinationName, lat: destinationLat, lng: destinationLng };

    // Generate real dynamic candidate routes
    const candidateRoutes = await RouteGeneratorService.generateTripRoutes({
      tripId: `sim-${Date.now()}`,
      origin,
      destination,
      vehicle,
      cargo,
      optimizationMode: 'BALANCED',
      desiredArrivalTime: null,
      maxBudget: budget
    });

    // Score independently under each optimization mode
    const bestFastest = OptimizationEngine.scoreAndRankRoutes([...candidateRoutes], 'FASTEST', null, budget)[0] || candidateRoutes[0];
    const bestCheapest = OptimizationEngine.scoreAndRankRoutes([...candidateRoutes], 'CHEAPEST', null, budget)[0] || candidateRoutes[0];
    const bestFuel = OptimizationEngine.scoreAndRankRoutes([...candidateRoutes], 'FUEL_EFFICIENT', null, budget)[0] || candidateRoutes[0];
    const bestBalanced = OptimizationEngine.scoreAndRankRoutes([...candidateRoutes], 'BALANCED', null, budget)[0] || candidateRoutes[0];

    const toScenario = (route, labelDesc) => ({
      durationMinutes: route.duration_minutes,
      eta: route.current_eta,
      cost: route.total_cost,
      fuelLiters: route.fuel_liters,
      tolls: route.toll_cost,
      trafficLevel: route.traffic_level,
      distanceKm: route.distance_km,
      routeLabel: `${route.route_code}: ${route.route_name}`,
      summary: route.summary || labelDesc
    });

    const dynamicScenarios = {
      FASTEST: toScenario(bestFastest, 'Prioritizes minimal transit duration and high-speed bypasses.'),
      CHEAPEST: toScenario(bestCheapest, 'Minimizes express toll outlays and fuel consumption.'),
      FUEL_EFFICIENT: toScenario(bestFuel, 'Optimizes engine efficiency and steady transit gradients.'),
      BALANCED: toScenario(bestBalanced, 'Equitably balances transit time, toll outlays, and safety buffer.')
    };

    // Calculate dynamic AI comparative explanation
    const costSavings = Math.max(0, Math.round(bestFastest.total_cost - bestCheapest.total_cost));
    const timeSaved = Math.max(0, Math.round(bestCheapest.duration_minutes - bestFastest.duration_minutes));

    const aiExplanation = `Simulation Analysis for ${vehicle.name} carrying ${cargoWeightKg.toLocaleString()} kg from ${originName} to ${destinationName}:
- FASTEST (${bestFastest.route_code}) delivers in ${bestFastest.duration_minutes}m (ETA ${bestFastest.current_eta}) for ₹${bestFastest.total_cost.toLocaleString()}, saving ${timeSaved} minutes compared to alternate corridors.
- CHEAPEST (${bestCheapest.route_code}) lowers expenditure to ₹${bestCheapest.total_cost.toLocaleString()} (saving ₹${costSavings.toLocaleString()}), but transit duration is ${bestCheapest.duration_minutes} minutes.
- BALANCED (${bestBalanced.route_code}) delivers in ${bestBalanced.duration_minutes}m for ₹${bestBalanced.total_cost.toLocaleString()}, keeping costs aligned with your ₹${budget.toLocaleString()} budget with optimal load clearance.`;

    return {
      simulationId: `SIM-${Date.now()}`,
      inputParams: {
        vehicleType,
        vehicleName: vehicle.name,
        cargoWeightKg,
        origin: originName,
        destination: destinationName,
        deadlineTime,
        budget
      },
      scenarios: dynamicScenarios,
      aiExplanation,
      recommendedMode: 'BALANCED'
    };
  }
}
