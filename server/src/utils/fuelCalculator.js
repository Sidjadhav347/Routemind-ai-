/**
 * RouteMind AI Fuel Calculation Engine
 * Accounts for vehicle efficiency, payload weight penalty, and traffic congestion factor.
 */

export function calculateFuelConsumption({
  distanceKm,
  vehicleFuelEfficiencyKmL,
  fuelPricePerUnit,
  trafficLevel = 'LOW',
  cargoWeightKg = 0,
  tareWeightKg = 1500
}) {
  // Base fuel efficiency
  let effectiveEfficiency = Math.max(1.0, vehicleFuelEfficiencyKmL || 10.0);

  // 1. Cargo & Gross Weight Impact:
  // For every 1,000 kg above tare weight, fuel efficiency degrades by ~3.5%
  if (cargoWeightKg > 0) {
    const cargoWeightTonnes = cargoWeightKg / 1000.0;
    const weightPenaltyFactor = Math.max(0.70, 1.0 - (cargoWeightTonnes * 0.035));
    effectiveEfficiency *= weightPenaltyFactor;
  }

  // 2. Traffic Congestion Factor (Stop-and-go idling and braking consumption):
  // LOW: 1.0x (free flowing)
  // MODERATE: 1.12x (+12% fuel)
  // HEAVY: 1.28x (+28% fuel)
  // SEVERE: 1.48x (+48% fuel)
  const trafficMultiplier = {
    LOW: 1.0,
    MODERATE: 1.12,
    HEAVY: 1.28,
    SEVERE: 1.48
  }[trafficLevel] || 1.0;

  // Fuel liters = (distance / effectiveEfficiency) * trafficMultiplier
  const baseLiters = distanceKm / effectiveEfficiency;
  const totalLiters = parseFloat((baseLiters * trafficMultiplier).toFixed(2));
  const fuelCost = parseFloat((totalLiters * (fuelPricePerUnit || 95.00)).toFixed(2));

  return {
    effectiveEfficiencyKmL: parseFloat(effectiveEfficiency.toFixed(2)),
    trafficMultiplier,
    totalFuelLiters: totalLiters,
    fuelCost: fuelCost
  };
}
