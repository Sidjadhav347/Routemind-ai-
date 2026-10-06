/**
 * RouteMind AI Comprehensive Cost Calculation Engine
 * Computes:
 * - Fuel cost
 * - Toll cost (highway tolls / expressway charges based on distance, corridor type & vehicle category)
 * - Operating & maintenance wear cost
 * - Total estimated transportation cost
 */

/**
 * Calculates realistic, dynamically computed toll fees based on vehicle class and road type
 */
export function calculateRouteToll({
  distanceKm = 0,
  vehicleType = 'CAR',
  corridorType = 'EXPRESSWAY'
}) {
  // Vehicle toll category multipliers based on standard NHAI / Express Highway matrix
  const vehicleTollMultiplier = {
    BIKE: 0.0,         // Two-wheelers exempt on Indian highways / banned on expressways
    CAR: 1.0,          // Base passenger car
    VAN: 1.25,         // Light Commercial / Delivery Van
    PICKUP: 1.4,       // LCV / Pickup
    LIGHT_TRUCK: 2.2,  // 2-axle commercial truck
    HEAVY_TRUCK: 4.2,  // 3-axle to multi-axle heavy commercial truck (16T+)
    BUS: 3.4,          // Commercial passenger bus
    OTHER: 1.5
  }[vehicleType] ?? 1.0;

  // Base rate per km for a passenger car
  const baseTollRatePerKm = {
    EXPRESSWAY: 2.10,  // Controlled access expressway
    HIGHWAY: 0.85,     // National Highway / 4-lane arterial
    BYPASS: 0.35,      // State bypass / semi-tolled ring road
    LOCAL: 0.0         // Non-tolled arterial
  }[corridorType] ?? 0.85;

  const rawToll = distanceKm * baseTollRatePerKm * vehicleTollMultiplier;
  return parseFloat(Math.round(rawToll).toFixed(2));
}

export function calculateTotalTripCost({
  fuelCost = 0,
  tollCost = 0,
  distanceKm = 0,
  vehicleType = 'CAR',
  isExpressway = false
}) {
  // Vehicle operating wear cost per km (tires, maintenance, depreciation)
  const operatingCostPerKm = {
    BIKE: 0.8,
    CAR: 2.5,
    VAN: 3.8,
    PICKUP: 4.2,
    LIGHT_TRUCK: 6.5,
    HEAVY_TRUCK: 11.0,
    BUS: 9.5,
    OTHER: 4.0
  }[vehicleType] || 3.0;

  const operatingCost = parseFloat((distanceKm * operatingCostPerKm).toFixed(2));
  const tolls = parseFloat(tollCost.toFixed(2));
  const totalCost = parseFloat((fuelCost + tolls + (operatingCost * 0.25)).toFixed(2)); // Primary direct trip cost + minor operating allocation

  return {
    fuelCost: parseFloat(fuelCost.toFixed(2)),
    tollCost: tolls,
    operatingCost: operatingCost,
    totalEstimatedCost: totalCost,
    breakdown: {
      fuelPercentage: Math.round((fuelCost / (totalCost || 1)) * 100),
      tollPercentage: Math.round((tolls / (totalCost || 1)) * 100),
      operatingPercentage: Math.round(((operatingCost * 0.25) / (totalCost || 1)) * 100)
    }
  };
}

