import { DynamicRerouteService } from '../services/traffic/dynamicRerouteService.js';
import { TrafficMonitorService } from '../services/traffic/trafficMonitorService.js';
import { Database } from '../database/db.js';

export class WebhookController {
  /**
   * n8n Scheduled Traffic Update webhook
   */
  static async handleTrafficSync(req, res, next) {
    try {
      const { incident, affectedRoutes, severity } = req.body;

      if (incident) {
        TrafficMonitorService.recordTrafficEvent({
          type: incident.type || 'CONGESTION',
          severity: severity || 'MEDIUM',
          locationName: incident.location || 'Automated Telemetry Sensor Point',
          lat: incident.lat || 18.9,
          lng: incident.lng || 73.1,
          affectedRouteName: affectedRoutes || 'Major Transit Corridor',
          delayMinutes: incident.delayMinutes || 15,
          recommendedAction: 'Autonomous reroute evaluation triggered via n8n pipeline',
          isSimulated: false
        });
      }

      // Check all active trips and run reroute evaluations
      const activeTrips = Database.find('trips', t => t.status === 'ACTIVE');
      const rerouteResults = [];

      for (const trip of activeTrips) {
        const evalResult = await DynamicRerouteService.evaluateTripForReroute(trip.id);
        if (evalResult.isRerouteRecommended) {
          rerouteResults.push({ tripId: trip.id, ...evalResult });
        }
      }

      res.json({
        success: true,
        data: {
          synced: true,
          activeTripsScanned: activeTrips.length,
          reroutesRecommended: rerouteResults.length,
          details: rerouteResults,
          source: 'n8n Workflow Automation Bridge'
        }
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * n8n Active Trip Batch Recalculation Check
   */
  static async handleActiveTripCheck(req, res, next) {
    try {
      const activeTrips = Database.find('trips', t => t.status === 'ACTIVE');
      res.json({
        success: true,
        data: {
          count: activeTrips.length,
          trips: activeTrips.map(t => ({
            id: t.id,
            origin: t.origin_address,
            destination: t.destination_address,
            status: t.status,
            etaMinutes: t.eta_minutes
          }))
        }
      });
    } catch (err) {
      next(err);
    }
  }
}
