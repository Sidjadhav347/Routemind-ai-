import { config } from '../../config/index.js';

export class OptimizationEngine {
  /**
   * Score and rank candidate routes based on user preference, physical constraints, and budget
   * @param {Array} routes - List of candidate routes
   * @param {string} optimizationMode - FASTEST | CHEAPEST | FUEL_EFFICIENT | LOW_TRAFFIC | DEADLINE_PRIORITY | BALANCED
   * @param {Date|string|null} deadlineTime - Optional desired arrival time
   * @param {number|null} maxBudget - Optional budget ceiling
   * @returns {Array} Scored, sorted routes with detailed score breakdown and budget evaluation
   */
  static scoreAndRankRoutes(routes, optimizationMode = 'BALANCED', deadlineTime = null, maxBudget = null) {
    if (!routes || routes.length === 0) return [];

    const weights = config.optimizationWeights[optimizationMode] || config.optimizationWeights.BALANCED;
    const budgetLimit = maxBudget ? parseFloat(maxBudget) : null;

    // Find min and max values across candidates to normalize 0 - 100
    const minDuration = Math.min(...routes.map(r => r.duration_minutes || r.durationMinutes));
    const maxDuration = Math.max(...routes.map(r => r.duration_minutes || r.durationMinutes));

    const minCost = Math.min(...routes.map(r => r.total_cost || r.totalCost));
    const maxCost = Math.max(...routes.map(r => r.total_cost || r.totalCost));

    const minFuel = Math.min(...routes.map(r => r.fuel_liters || r.fuelLiters));
    const maxFuel = Math.max(...routes.map(r => r.fuel_liters || r.fuelLiters));

    const trafficScoreMap = {
      LOW: 95,
      MODERATE: 75,
      HEAVY: 45,
      SEVERE: 20
    };

    const scoredRoutes = routes.map(route => {
      const duration = route.duration_minutes || route.durationMinutes;
      const totalCost = route.total_cost || route.totalCost;
      const fuelLiters = route.fuel_liters || route.fuelLiters;
      const trafficLevel = route.traffic_level || route.trafficLevel || 'LOW';
      const delayRisk = route.delay_risk_percent || route.delayRiskPercent || 15;
      const isCompatible = route.is_compatible !== undefined ? route.is_compatible : true;

      // 1. Time Score (Shorter is better, 0 - 100, sensitive scaling)
      const timeScore = maxDuration === minDuration ? 95 :
        parseFloat(Math.max(10, (100 - ((duration - minDuration) / (maxDuration - minDuration || 1)) * 85)).toFixed(1));

      // 2. Cost Score (Lower is better, 0 - 100, sensitive scaling)
      const costScore = maxCost === minCost ? 95 :
        parseFloat(Math.max(10, (100 - ((totalCost - minCost) / (maxCost - minCost || 1)) * 85)).toFixed(1));

      // 3. Fuel Score (Lower consumption is better, 0 - 100)
      const fuelScore = maxFuel === minFuel ? 95 :
        parseFloat(Math.max(10, (100 - ((fuelLiters - minFuel) / (maxFuel - minFuel || 1)) * 85)).toFixed(1));

      // 4. Traffic Score
      const trafficScore = trafficScoreMap[trafficLevel] || 80;

      // 5. Reliability / Risk Score (Lower delay risk = higher score)
      const reliabilityScore = Math.max(10, 100 - delayRisk);

      // 6. Deadline Score
      let deadlineScore = 85;
      let deadlineFeasible = true;
      if (deadlineTime) {
        const deadlineDate = new Date(deadlineTime).getTime();
        const expectedArrivalDate = Date.now() + (duration * 60 * 1000);
        const marginMins = Math.round((deadlineDate - expectedArrivalDate) / (60 * 1000));

        if (marginMins < 0) {
          deadlineScore = Math.max(5, 40 + marginMins);
          deadlineFeasible = false;
        } else if (marginMins < 15) {
          deadlineScore = 65;
        } else if (marginMins < 30) {
          deadlineScore = 85;
        } else {
          deadlineScore = 100;
        }
      }

      // 7. Budget Feasibility Evaluation
      let budgetFeasible = true;
      let budgetPenalty = 0;
      if (budgetLimit && budgetLimit > 0) {
        if (totalCost > budgetLimit) {
          budgetFeasible = false;
          // Apply a progressive penalty proportional to the budget overrun
          const overrunRatio = (totalCost - budgetLimit) / budgetLimit;
          budgetPenalty = Math.min(40, overrunRatio * 60);
        }
      }

      // Compute weighted composite score (0 - 100)
      let compositeScore = (
        (timeScore * weights.time) +
        (trafficScore * weights.traffic) +
        (costScore * weights.cost) +
        (fuelScore * weights.fuel) +
        (deadlineScore * weights.deadline) +
        (reliabilityScore * weights.reliability)
      );

      // Deduct budget penalty if applicable
      if (budgetPenalty > 0) {
        compositeScore = Math.max(10.0, compositeScore - budgetPenalty);
      }

      // If route violates vehicle height/weight restrictions, penalize heavily
      if (!isCompatible) {
        compositeScore = Math.min(20.0, compositeScore * 0.25); // Disqualify from recommendation
      }

      const finalScore = parseFloat(compositeScore.toFixed(1));

      return {
        ...route,
        deadline_feasible: deadlineFeasible,
        budget_feasible: budgetFeasible,
        route_score: finalScore,
        score_breakdown: {
          timeScore,
          trafficScore,
          costScore,
          fuelScore,
          deadlineScore,
          reliabilityScore,
          budgetFeasible,
          weightsApplied: weights
        }
      };
    });

    // Check if any route satisfies both compatibility and budget
    const anyWithinBudget = budgetLimit ? scoredRoutes.some(r => r.is_compatible !== false && r.budget_feasible) : true;

    // Sort descending by route_score (highest score first)
    // Preference order:
    // 1. Compatible routes over incompatible routes
    // 2. If some routes are within budget, prefer budget-satisfying routes
    // 3. Highest route_score
    scoredRoutes.sort((a, b) => {
      if (a.is_compatible !== b.is_compatible) {
        return a.is_compatible ? -1 : 1;
      }
      if (anyWithinBudget && a.budget_feasible !== b.budget_feasible) {
        return a.budget_feasible ? -1 : 1;
      }
      return b.route_score - a.route_score;
    });

    // Mark the top feasible route as recommended
    const topPick = scoredRoutes.find(r => r.is_compatible !== false && (anyWithinBudget ? r.budget_feasible : true)) ||
                    scoredRoutes.find(r => r.is_compatible !== false) ||
                    scoredRoutes[0];

    if (topPick) {
      topPick.is_recommended = true;
    }

    return scoredRoutes;
  }
}
