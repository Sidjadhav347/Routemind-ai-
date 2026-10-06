import { config } from '../../config/index.js';

/**
 * Checks road clearances, vehicle dimensions, and gross weight limits.
 */
export class RestrictionChecker {
  /**
   * @param {Object} vehicle
   * @param {Object} cargo
   * @param {Object} routeData
   */
  static evaluateCompatibility(vehicle, cargo, routeData) {
    if (!vehicle) {
      return { isCompatible: true, reason: null };
    }

    const vehicleHeight = parseFloat(vehicle.height_m || 1.6);
    const vehicleWidth = parseFloat(vehicle.width_m || 1.8);
    const vehicleLength = parseFloat(vehicle.length_m || 4.5);

    const tareWeightKg = parseFloat(vehicle.tare_weight_kg || 1500);
    const cargoWeightKg = cargo ? parseFloat(cargo.weight_kg ?? cargo.weight ?? 0) : 0;
    const grossWeightKg = tareWeightKg + cargoWeightKg;
    const grossWeightTonnes = grossWeightKg / 1000.0;

    // Check against vehicle's own rated maximum payload capacity
    const maxCapacityKg = parseFloat(vehicle.max_weight_capacity_kg || 1000);
    if (cargoWeightKg > maxCapacityKg) {
      return {
        isCompatible: false,
        reason: `Cargo weight (${cargoWeightKg} kg) exceeds vehicle max payload capacity (${maxCapacityKg} kg). High rollover and brake failure risk.`
      };
    }

    const routeName = (routeData.name || routeData.route_name || '').toLowerCase();
    const routeSummary = (routeData.summary || '').toLowerCase();

    // Modern expressways feature high 5.5m clearance and heavy multi-axle ratings
    const isExpressway = routeName.includes('expressway') || routeName.includes('ne-1') || (routeData.corridorType === 'EXPRESSWAY');

    // Two-wheelers prohibited on high-speed expressways
    if ((vehicle.type === 'BIKE' || vehicle.type === 'TWO_WHEELER') && isExpressway) {
      return {
        isCompatible: false,
        reason: 'Two-wheelers (Motorcycles & Scooters) are prohibited on access-controlled expressways under IRC regulations.'
      };
    }

    // Check against known road restrictions
    for (const res of config.knownRoadRestrictions) {
      const matchCriteria = !isExpressway && (
        routeName.includes('old') ||
        routeName.includes('nh48') ||
        routeName.includes('heritage') ||
        routeSummary.includes('old highway') ||
        routeSummary.includes('nh48')
      );

      if (matchCriteria) {
        // 1. Height restriction check (e.g. low bridge / heritage underpass: 3.5m)
        if (res.maxHeightM && vehicleHeight > res.maxHeightM) {
          return {
            isCompatible: false,
            reason: `Vehicle height (${vehicleHeight}m) exceeds overhead clearance limit (${res.maxHeightM}m) on this segment: ${res.reason}.`
          };
        }

        // 2. Weight restriction check (e.g. old bridge / flyover limit: 7.5 or 10 tonnes)
        if (res.maxWeightTonnes && grossWeightTonnes > res.maxWeightTonnes) {
          return {
            isCompatible: false,
            reason: `Total load (${grossWeightTonnes.toFixed(1)} tonnes: ${tareWeightKg}kg tare + ${cargoWeightKg}kg cargo) exceeds structural load limit (${res.maxWeightTonnes} tonnes) on this segment: ${res.reason}.`
          };
        }

        // 3. Width restriction check
        if (res.maxWidthM && vehicleWidth > res.maxWidthM) {
          return {
            isCompatible: false,
            reason: `Vehicle width (${vehicleWidth}m) exceeds narrow roadway/tunnel limit (${res.maxWidthM}m).`
          };
        }
      }
    }

    return {
      isCompatible: true,
      reason: null
    };
  }
}
