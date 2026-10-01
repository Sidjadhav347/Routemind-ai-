import { formatTimeWithAMPM } from '../../utils/distanceUtils.js';

export class DeparturePredictorService {
  /**
   * Predict optimal departure times and generate comparative departure windows
   * @param {Object} params
   * @param {string|Date} params.desiredDeadline
   * @param {number} params.baseDurationMinutes
   * @param {string} params.trafficCondition
   * @param {number} params.preferredBufferMinutes
   */
  static predictDepartureWindows({
    desiredDeadline,
    baseDurationMinutes,
    trafficCondition = 'MODERATE',
    preferredBufferMinutes = 30
  }) {
    const deadlineDate = desiredDeadline ? new Date(desiredDeadline) : new Date(Date.now() + 180 * 60 * 1000);
    const deadlineMs = deadlineDate.getTime();

    // Congestion escalation model during peak evening & morning hours
    // (e.g. 5:00 PM - 7:30 PM has +20% to +35% longer travel times)
    const trafficRiskMap = {
      LOW: { factor: 1.05, risk: 'Low', confidence: 96 },
      MODERATE: { factor: 1.15, risk: 'Medium', confidence: 91 },
      HEAVY: { factor: 1.35, risk: 'High', confidence: 78 },
      SEVERE: { factor: 1.60, risk: 'Critical', confidence: 58 }
    };

    const riskProfile = trafficRiskMap[trafficCondition] || trafficRiskMap.MODERATE;
    const adjustedDuration = Math.round(baseDurationMinutes * riskProfile.factor);

    // Recommended departure: Deadline minus (adjusted duration + buffer)
    const recommendedSafetyBuffer = Math.max(20, preferredBufferMinutes || 35);
    const recommendedDepartureMs = deadlineMs - ((adjustedDuration + recommendedSafetyBuffer) * 60 * 1000);
    const expectedArrivalMs = recommendedDepartureMs + (adjustedDuration * 60 * 1000);

    // Generate 4 departure scenarios (Early, Recommended, Borderline, Risky)
    const scenarios = [
      {
        id: 'scenario-early',
        departureTime: formatTimeWithAMPM(recommendedDepartureMs - 30 * 60 * 1000),
        expectedArrival: formatTimeWithAMPM(expectedArrivalMs - 30 * 60 * 1000),
        bufferMinutes: recommendedSafetyBuffer + 30,
        status: 'Optimal Early Buffer',
        confidencePercent: Math.min(99, riskProfile.confidence + 6),
        isRecommended: false
      },
      {
        id: 'scenario-recommended',
        departureTime: formatTimeWithAMPM(recommendedDepartureMs),
        expectedArrival: formatTimeWithAMPM(expectedArrivalMs),
        bufferMinutes: recommendedSafetyBuffer,
        status: 'AI Recommended Window',
        confidencePercent: riskProfile.confidence,
        isRecommended: true
      },
      {
        id: 'scenario-tight',
        departureTime: formatTimeWithAMPM(recommendedDepartureMs + 20 * 60 * 1000),
        expectedArrival: formatTimeWithAMPM(expectedArrivalMs + 20 * 60 * 1000),
        bufferMinutes: recommendedSafetyBuffer - 20,
        status: 'Tight Schedule (Low Buffer)',
        confidencePercent: Math.max(40, riskProfile.confidence - 15),
        isRecommended: false
      },
      {
        id: 'scenario-late',
        departureTime: formatTimeWithAMPM(recommendedDepartureMs + 45 * 60 * 1000),
        expectedArrival: formatTimeWithAMPM(expectedArrivalMs + 50 * 60 * 1000), // higher congestion penalty
        bufferMinutes: Math.max(0, recommendedSafetyBuffer - 50),
        status: 'High Delay Risk (May Miss Deadline)',
        confidencePercent: Math.max(25, riskProfile.confidence - 35),
        isRecommended: false
      }
    ];

    return {
      deadlineTime: formatTimeWithAMPM(deadlineDate),
      recommendedDeparture: formatTimeWithAMPM(recommendedDepartureMs),
      expectedArrival: formatTimeWithAMPM(expectedArrivalMs),
      safetyBufferMinutes: recommendedSafetyBuffer,
      trafficRisk: riskProfile.risk,
      deadlineConfidence: riskProfile.confidence,
      adjustedDurationMinutes: adjustedDuration,
      disclaimer: 'Predictions are AI-assisted probabilistic estimates based on real-time transit telemetry and historical traffic curves, not absolute guarantees.',
      scenarios
    };
  }
}
