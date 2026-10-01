import { TrafficMonitorService } from '../services/traffic/trafficMonitorService.js';
import { Database } from '../database/db.js';
import { DynamicRerouteService } from '../services/traffic/dynamicRerouteService.js';

export class TrafficController {
  static async getEvents(req, res) {
    const { trip_id } = req.query;
    const events = TrafficMonitorService.getTrafficEvents(trip_id || null);
    res.json({
      success: true,
      data: events
    });
  }

  static async getScenarios(req, res) {
    const scenarios = TrafficMonitorService.getSimulationScenarios();
    res.json({
      success: true,
      data: scenarios
    });
  }

  static async triggerScenario(req, res, next) {
    try {
      const { scenario_id, trip_id } = req.body;
      const scenarios = TrafficMonitorService.getSimulationScenarios();
      const scenario = scenarios.find(s => s.id === scenario_id);

      if (!scenario) {
        return res.status(404).json({
          success: false,
          error: { code: 'SCENARIO_NOT_FOUND', message: 'Requested demo scenario does not exist.' }
        });
      }

      // Record event
      let event = null;
      if (scenario.incident) {
        event = TrafficMonitorService.recordTrafficEvent({
          tripId: trip_id || null,
          type: scenario.incident.type,
          severity: scenario.trafficLevel === 'SEVERE' ? 'CRITICAL' : 'HIGH',
          locationName: scenario.incident.location,
          lat: 18.75,
          lng: 73.37,
          affectedRouteName: scenario.incident.affectedRoute,
          delayMinutes: scenario.delayMinutes,
          confidencePercent: 95,
          recommendedAction: scenario.incident.recommendedAction,
          isSimulated: true
        });
      }

      let rerouteProposal = null;
      if (trip_id) {
        rerouteProposal = await DynamicRerouteService.evaluateTripForReroute(trip_id, {
          delayMinutes: scenario.delayMinutes,
          reason: scenario.description
        });
      }

      res.json({
        success: true,
        data: {
          scenario,
          event,
          rerouteProposal,
          mode: 'DEMO / SIMULATION MODE'
        }
      });
    } catch (err) {
      next(err);
    }
  }
}
