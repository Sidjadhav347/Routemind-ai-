import { v4 as uuidv4 } from 'uuid';
import { GoogleMapsProvider } from '../maps/googleMapsProvider.js';
import { calculateFuelConsumption } from '../../utils/fuelCalculator.js';
import { calculateTotalTripCost, calculateRouteToll } from '../../utils/costCalculator.js';
import { RestrictionChecker } from '../optimization/restrictionChecker.js';
import { OptimizationEngine } from '../optimization/optimizationEngine.js';
import { formatTimeWithAMPM } from '../../utils/distanceUtils.js';

export class RouteGeneratorService {
  /**
   * Generate and evaluate all possible routes for a given trip
   */
  static async generateTripRoutes({
    tripId,
    origin,
    destination,
    waypoints = [],
    vehicle,
    cargo,
    optimizationMode = 'BALANCED',
    desiredArrivalTime = null,
    maxBudget = null
  }) {
    // 1. Fetch candidate paths (from Google Maps Directions if key present, else OSRM / realistic fallback)
    const rawRoutes = await GoogleMapsProvider.getRoutes(origin, destination, waypoints);

    // Vehicle-specific speed factor (heavy trucks cruise at 50-60 km/h, cars at 80-90 km/h)
    const vehicleSpeedFactor = {
      HEAVY_TRUCK: 1.30,
      LIGHT_TRUCK: 1.15,
      VAN: 1.05,
      CAR: 1.0,
      BIKE: 1.10,
      BUS: 1.20,
      PICKUP: 1.05,
      OTHER: 1.10
    }[vehicle?.type] || 1.0;

    const cargoWeight = cargo ? parseFloat(cargo.weight_kg ?? cargo.weight ?? 0) : 0;

    const candidateRoutes = rawRoutes.map((raw, idx) => {
      const code = `Route ${String.fromCharCode(65 + idx)}`;
      const corridorType = raw.corridorType || (idx === 0 ? 'EXPRESSWAY' : idx === 1 ? 'HIGHWAY' : 'BYPASS');

      // Traffic level & congestion delay profile
      const trafficLevel = raw.trafficLevel || (idx === 0 ? 'LOW' : idx === 1 ? 'HEAVY' : 'MODERATE');
      const delayRisk = idx === 0 ? 12 : idx === 1 ? 38 : 18;

      // Compatibility check with vehicle height & gross weight
      const compatibility = RestrictionChecker.evaluateCompatibility(vehicle, cargo, {
        name: raw.name,
        summary: raw.summary,
        corridorType
      });

      // Adjusted duration based on vehicle transit capabilities
      const durationMins = Math.round(raw.durationMinutes * vehicleSpeedFactor);

      // Dynamically computed toll based on route distance, corridor class, and vehicle category
      const dynamicToll = calculateRouteToll({
        distanceKm: raw.distanceKm,
        vehicleType: vehicle ? vehicle.type : 'CAR',
        corridorType
      });

      // Fuel consumption calculation with payload penalty and traffic multiplier
      const fuelStats = calculateFuelConsumption({
        distanceKm: raw.distanceKm,
        vehicleFuelEfficiencyKmL: vehicle ? vehicle.fuel_efficiency_km_l : 10.0,
        fuelPricePerUnit: vehicle ? vehicle.fuel_price_per_unit : 95.0,
        trafficLevel,
        cargoWeightKg: cargoWeight,
        tareWeightKg: vehicle ? vehicle.tare_weight_kg : 1500
      });

      // Cost calculation with fuel, vehicle toll, operating maintenance allocation
      const costStats = calculateTotalTripCost({
        fuelCost: fuelStats.fuelCost,
        tollCost: dynamicToll,
        distanceKm: raw.distanceKm,
        vehicleType: vehicle ? vehicle.type : 'CAR',
        isExpressway: corridorType === 'EXPRESSWAY'
      });

      // Compute estimated arrival time from now
      const arrivalTimestamp = Date.now() + (durationMins * 60 * 1000);
      const currentEta = formatTimeWithAMPM(arrivalTimestamp);

      return {
        id: uuidv4(),
        trip_id: tripId,
        route_code: code,
        route_name: raw.name,
        corridor_type: corridorType,
        summary: raw.summary,
        distance_km: raw.distanceKm,
        duration_minutes: durationMins,
        current_eta: currentEta,
        traffic_level: trafficLevel,
        fuel_liters: fuelStats.totalFuelLiters,
        fuel_cost: fuelStats.fuelCost,
        toll_cost: costStats.tollCost,
        total_cost: costStats.totalEstimatedCost,
        operating_cost: costStats.operatingCost,
        is_compatible: compatibility.isCompatible,
        incompatibility_reason: compatibility.reason,
        delay_risk_percent: delayRisk,
        polyline: raw.polyline,
        is_current: idx === 0,
        is_recommended: false
      };
    });

    // 2. Score and rank routes with optimization engine
    const optimizedRoutes = OptimizationEngine.scoreAndRankRoutes(
      candidateRoutes,
      optimizationMode,
      desiredArrivalTime,
      maxBudget
    );

    return optimizedRoutes;
  }
}
