import { v4 as uuidv4 } from 'uuid';
import { GoogleMapsProvider } from '../maps/googleMapsProvider.js';
import { calculateFuelConsumption } from '../../utils/fuelCalculator.js';
import { calculateTotalTripCost } from '../../utils/costCalculator.js';
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
    desiredArrivalTime = null
  }) {
    // 1. Fetch candidate paths (from Google Maps Directions if key present, else OSRM / realistic fallback)
    const rawRoutes = await GoogleMapsProvider.getRoutes(origin, destination, waypoints);

    // Default metadata presets for multi-corridor real-world routing
    const corridorPresets = [
      {
        code: 'Route A',
        name: 'Mumbai-Pune Expressway (National Expressway 1)',
        summary: 'Direct grade-separated high-speed expressway via Bhor Ghat tunnels',
        trafficLevel: 'LOW',
        tollCost: 320.00,
        delayRiskPercent: 12
      },
      {
        code: 'Route B',
        name: 'Old Mumbai-Pune Highway (NH48)',
        summary: 'Heritage arterial corridor through Panvel, Khopoli & Khandala',
        trafficLevel: 'HEAVY', // Often congested with mixed urban traffic
        tollCost: 135.00,
        delayRiskPercent: 38
      },
      {
        code: 'Route C',
        name: 'Navi Mumbai - Khalapur Ring Bypass',
        summary: 'Bypass corridor with consistent multi-axle freight clearance',
        trafficLevel: 'MODERATE',
        tollCost: 210.00,
        delayRiskPercent: 18
      }
    ];

    const candidateRoutes = rawRoutes.map((raw, idx) => {
      const preset = corridorPresets[idx] || {
        code: `Route ${String.fromCharCode(65 + idx)}`,
        name: raw.name || `Corridor ${idx + 1}`,
        summary: 'Alternative arterial transport route',
        trafficLevel: 'MODERATE',
        tollCost: 150.00,
        delayRiskPercent: 20
      };

      // Compatibility check with vehicle height & gross weight
      const compatibility = RestrictionChecker.evaluateCompatibility(vehicle, cargo, {
        name: preset.name,
        summary: preset.summary
      });

      // Fuel consumption calculation
      const fuelStats = calculateFuelConsumption({
        distanceKm: raw.distanceKm,
        vehicleFuelEfficiencyKmL: vehicle ? vehicle.fuel_efficiency_km_l : 10.0,
        fuelPricePerUnit: vehicle ? vehicle.fuel_price_per_unit : 95.0,
        trafficLevel: preset.trafficLevel,
        cargoWeightKg: cargo ? cargo.weight_kg : 0,
        tareWeightKg: vehicle ? vehicle.tare_weight_kg : 1500
      });

      // Cost calculation
      const costStats = calculateTotalTripCost({
        fuelCost: fuelStats.fuelCost,
        tollCost: preset.tollCost,
        distanceKm: raw.distanceKm,
        vehicleType: vehicle ? vehicle.type : 'CAR',
        isExpressway: idx === 0
      });

      // Compute estimated arrival time from now
      const arrivalTimestamp = Date.now() + (raw.durationMinutes * 60 * 1000);
      const currentEta = formatTimeWithAMPM(arrivalTimestamp);

      return {
        id: uuidv4(),
        trip_id: tripId,
        route_code: preset.code,
        route_name: preset.name,
        summary: preset.summary,
        distance_km: raw.distanceKm,
        duration_minutes: raw.durationMinutes,
        current_eta: currentEta,
        traffic_level: preset.trafficLevel,
        fuel_liters: fuelStats.totalFuelLiters,
        fuel_cost: fuelStats.fuelCost,
        toll_cost: costStats.tollCost,
        total_cost: costStats.totalEstimatedCost,
        operating_cost: costStats.operatingCost,
        is_compatible: compatibility.isCompatible,
        incompatibility_reason: compatibility.reason,
        delay_risk_percent: preset.delayRiskPercent,
        polyline: raw.polyline,
        is_current: idx === 0,
        is_recommended: false
      };
    });

    // 2. Score and rank routes with optimization engine
    const optimizedRoutes = OptimizationEngine.scoreAndRankRoutes(
      candidateRoutes,
      optimizationMode,
      desiredArrivalTime
    );

    return optimizedRoutes;
  }
}
