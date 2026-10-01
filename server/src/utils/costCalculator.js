/**
 * RouteMind AI Comprehensive Cost Calculation Engine
 * Computes:
 * - Fuel cost
 * - Toll cost (highway tolls / expressway charges)
 * - Operating & maintenance wear cost
 * - Total estimated transportation cost
 */

export function calculateTotalTripCost({
  fuelCost,
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
