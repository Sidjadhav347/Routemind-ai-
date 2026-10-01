import { v4 as uuidv4 } from 'uuid';
import { Database } from '../../database/db.js';

export class TrafficMonitorService {
  /**
   * Get all active disruptions or traffic events for a trip/area
   */
  static getTrafficEvents(tripId = null) {
    if (tripId) {
      return Database.find('traffic_events', e => e.trip_id === tripId && e.is_active);
    }
    return Database.find('traffic_events', e => e.is_active);
  }

  /**
   * Inject a traffic event (can be real-time or simulation)
   */
  static recordTrafficEvent({
    tripId = null,
    type,
    severity = 'HIGH',
    locationName,
    lat,
    lng,
    affectedRouteName,
    delayMinutes = 20,
    confidencePercent = 90,
    recommendedAction,
    isSimulated = true
  }) {
    const event = Database.insert('traffic_events', {
      id: uuidv4(),
      trip_id: tripId,
      type,
      severity,
      locationName,
      lat,
      lng,
      affectedRouteName,
      delayMinutes,
      confidencePercent,
      recommendedAction,
      isSimulated,
      is_active: true
    });

    return event;
  }

  /**
   * Predict delay based on route traffic telemetry
   */
  static predictDelay(route) {
    const traffic = route.traffic_level || 'LOW';
    const delayMap = {
      LOW: { probability: 10, expectedDelayMinutes: 0, risk: 'LOW', reason: 'Free-flowing highway telemetry.' },
      MODERATE: { probability: 35, expectedDelayMinutes: 8, risk: 'MEDIUM', reason: 'Moderate bottleneck at toll plazas and urban interchanges.' },
      HEAVY: { probability: 78, expectedDelayMinutes: 24, risk: 'HIGH', reason: 'Heavy traffic volume and crawling speed in ghat section.' },
      SEVERE: { probability: 95, expectedDelayMinutes: 45, risk: 'CRITICAL', reason: 'Multi-vehicle collision or complete lane blockage detected ahead.' }
    };

    return delayMap[traffic] || delayMap.LOW;
  }

  /**
   * Five Controlled Hackathon Simulation Scenarios (Section 40)
   */
  static getSimulationScenarios() {
    return [
      {
        id: 'scenario-normal',
        title: 'Scenario 1: Normal Traffic Flow',
        description: 'Smooth driving conditions across all major corridors. Primary expressway remains optimal.',
        trafficLevel: 'LOW',
        delayMinutes: 0,
        incident: null,
        mode: 'SIMULATED DATA'
      },
      {
        id: 'scenario-heavy-traffic',
        title: 'Scenario 2: Heavy Congestion on Expressway',
        description: 'Sudden high density traffic jam (+28 min delay) on Mumbai-Pune Expressway near Khandala. Alternate route recommended.',
        trafficLevel: 'HEAVY',
        delayMinutes: 28,
        incident: {
          type: 'CONGESTION',
          location: 'Khandala Ghat Tunnel Entry (km 72)',
          affectedRoute: 'Mumbai-Pune Expressway',
          recommendedAction: 'Reroute to Khalapur Bypass to bypass gridlock'
        },
        mode: 'SIMULATED DATA'
      },
      {
        id: 'scenario-accident',
        title: 'Scenario 3: Multi-Vehicle Incident on NH48',
        description: 'Overturned trailer blocking 2 arterial lanes on NH48. Route delay exceeds 40 mins.',
        trafficLevel: 'SEVERE',
        delayMinutes: 42,
        incident: {
          type: 'ACCIDENT',
          location: 'NH48 Khopoli Junction (km 65)',
          affectedRoute: 'Old Mumbai-Pune Highway (NH48)',
          recommendedAction: 'Immediate reroute to Expressway'
        },
        mode: 'SIMULATED DATA'
      },
      {
        id: 'scenario-restriction',
        title: 'Scenario 4: Low Bridge & Gross Weight Violation',
        description: 'Demonstrates restriction checker: Heavy Truck (3.8m height, 10.5T weight) rejected on Old NH48 Heritage underpass (3.5m clearance, 7.5T limit).',
        trafficLevel: 'LOW',
        delayMinutes: 0,
        incident: {
          type: 'ROAD_CLOSURE',
          location: 'Old Khandala Heritage Railway Underpass',
          affectedRoute: 'Old Mumbai-Pune Highway (NH48)',
          recommendedAction: 'Divert to Expressway with 5.5m clearance'
        },
        mode: 'SIMULATED DATA'
      },
      {
        id: 'scenario-deadline-risk',
        title: 'Scenario 5: Delivery Deadline Risk Alert',
        description: 'Current departure will breach customer 6:00 PM delivery SLA. AI calculates urgent earlier departure window.',
        trafficLevel: 'MODERATE',
        delayMinutes: 20,
        incident: {
          type: 'SLOWDOWN',
          location: 'Chakan Industrial Approach Road',
          affectedRoute: 'All routes approaching Chakan',
          recommendedAction: 'Advance departure time to 3:45 PM with 35 min buffer'
        },
        mode: 'SIMULATED DATA'
      }
    ];
  }
}
