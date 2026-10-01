import { v4 as uuidv4 } from 'uuid';
import { Database } from '../database/db.js';
import { RouteGeneratorService } from '../services/routing/routeGeneratorService.js';
import { DeparturePredictorService } from '../services/trips/departurePredictorService.js';
import { DynamicRerouteService } from '../services/traffic/dynamicRerouteService.js';
import { AIService } from '../services/ai/geminiService.js';
import { TrafficMonitorService } from '../services/traffic/trafficMonitorService.js';

export class TripController {
  static async createTrip(req, res, next) {
    try {
      const {
        origin,
        destination,
        waypoints = [],
        vehicle_id,
        cargo_id = null,
        desired_arrival_time = null,
        max_budget = null,
        optimization_mode = 'BALANCED'
      } = req.body;

      // 1. Fetch vehicle and cargo
      const vehicle = Database.findById('vehicles', vehicle_id);
      if (!vehicle) {
        return res.status(400).json({
          success: false,
          error: { code: 'VEHICLE_NOT_FOUND', message: 'Selected vehicle does not exist.' }
        });
      }

      const cargo = cargo_id ? Database.findById('cargo', cargo_id) : null;

      const tripId = uuidv4();

      // 2. Generate and score multiple candidate routes
      const candidateRoutes = await RouteGeneratorService.generateTripRoutes({
        tripId,
        origin,
        destination,
        waypoints,
        vehicle,
        cargo,
        optimizationMode: optimization_mode,
        desiredArrivalTime: desired_arrival_time
      });

      // Save routes to DB
      for (const r of candidateRoutes) {
        Database.insert('trip_routes', r);
      }

      // Identify recommended route
      const recommendedRoute = candidateRoutes.find(r => r.is_recommended) || candidateRoutes[0];
      const alternativeRoutes = candidateRoutes.filter(r => r.id !== recommendedRoute.id);

      // 3. Departure prediction
      const departurePrediction = DeparturePredictorService.predictDepartureWindows({
        desiredDeadline: desired_arrival_time,
        baseDurationMinutes: recommendedRoute.duration_minutes,
        trafficCondition: recommendedRoute.traffic_level
      });

      Database.insert('departure_predictions', {
        id: uuidv4(),
        trip_id: tripId,
        deadline_time: desired_arrival_time || new Date(Date.now() + 180 * 60 * 1000).toISOString(),
        recommended_departure: departurePrediction.recommendedDeparture,
        expected_arrival: departurePrediction.expectedArrival,
        safety_buffer_minutes: departurePrediction.safetyBufferMinutes,
        traffic_risk: departurePrediction.trafficRisk,
        deadline_confidence: departurePrediction.deadlineConfidence,
        scenarios: departurePrediction.scenarios
      });

      // 4. AI Route Explanation
      const aiExplanation = await AIService.explainRouteRecommendation({
        recommendedRoute,
        alternativeRoutes,
        vehicle,
        cargo,
        optimizationMode: optimization_mode,
        deadlineTime: desired_arrival_time
      });

      Database.insert('ai_recommendations', {
        id: uuidv4(),
        trip_id: tripId,
        route_id: recommendedRoute.id,
        recommendation_text: aiExplanation.recommendation,
        reason: aiExplanation.reason,
        benefits: aiExplanation.benefits,
        warnings: aiExplanation.warnings,
        confidence_percent: aiExplanation.confidence
      });

      // 5. Create Master Trip Record
      const newTrip = Database.insert('trips', {
        id: tripId,
        user_id: req.user.id,
        origin_address: origin.address,
        origin_lat: origin.lat,
        origin_lng: origin.lng,
        destination_address: destination.address,
        destination_lat: destination.lat,
        destination_lng: destination.lng,
        waypoints,
        vehicle_id,
        cargo_id,
        desired_arrival_time,
        max_budget,
        optimization_mode,
        status: 'READY',
        current_route_id: recommendedRoute.id,
        distance_km: recommendedRoute.distance_km,
        eta_minutes: recommendedRoute.duration_minutes,
        estimated_cost: recommendedRoute.total_cost
      });

      res.status(201).json({
        success: true,
        data: {
          trip: newTrip,
          routes: candidateRoutes,
          recommendedRoute,
          departurePrediction,
          aiExplanation
        }
      });
    } catch (err) {
      next(err);
    }
  }

  static async getTrips(req, res) {
    const trips = Database.find('trips', t => t.user_id === req.user.id);
    res.json({ success: true, data: trips });
  }

  static async getTripById(req, res) {
    const trip = Database.findById('trips', req.params.id);
    if (!trip) {
      return res.status(404).json({
        success: false,
        error: { code: 'TRIP_NOT_FOUND', message: 'Trip not found' }
      });
    }

    const routes = Database.find('trip_routes', r => r.trip_id === trip.id);
    const vehicle = trip.vehicle_id ? Database.findById('vehicles', trip.vehicle_id) : null;
    const cargo = trip.cargo_id ? Database.findById('cargo', trip.cargo_id) : null;
    const departurePrediction = Database.findOne('departure_predictions', d => d.trip_id === trip.id);
    const aiRecommendation = Database.findOne('ai_recommendations', a => a.trip_id === trip.id);
    const trafficEvents = Database.find('traffic_events', e => e.trip_id === trip.id && e.is_active);

    res.json({
      success: true,
      data: {
        trip,
        routes,
        vehicle,
        cargo,
        departurePrediction,
        aiRecommendation,
        trafficEvents
      }
    });
  }

  static async startTrip(req, res) {
    const trip = Database.findById('trips', req.params.id);
    if (!trip) {
      return res.status(404).json({
        success: false,
        error: { code: 'TRIP_NOT_FOUND', message: 'Trip not found' }
      });
    }

    const updated = Database.update('trips', trip.id, {
      status: 'ACTIVE',
      started_at: new Date().toISOString()
    });

    // Notify user
    Database.insert('notifications', {
      user_id: req.user.id,
      trip_id: trip.id,
      type: 'DEPARTURE_REMINDER',
      title: 'Trip Started & Active Telemetry Engaged',
      message: `Navigating via ${trip.origin_address.split(',')[0]} to ${trip.destination_address.split(',')[0]}. Dynamic rerouting active.`,
      severity: 'INFO'
    });

    res.json({ success: true, data: updated });
  }

  static async completeTrip(req, res) {
    const trip = Database.findById('trips', req.params.id);
    if (!trip) {
      return res.status(404).json({
        success: false,
        error: { code: 'TRIP_NOT_FOUND', message: 'Trip not found' }
      });
    }

    const vehicle = trip.vehicle_id ? Database.findById('vehicles', trip.vehicle_id) : null;
    const cargo = trip.cargo_id ? Database.findById('cargo', trip.cargo_id) : null;
    const activeRoute = Database.findById('trip_routes', trip.current_route_id);

    const updated = Database.update('trips', trip.id, {
      status: 'COMPLETED',
      completed_at: new Date().toISOString()
    });

    // Archive into trip_history for analytics
    Database.insert('trip_history', {
      trip_id: trip.id,
      user_id: trip.user_id,
      origin_address: trip.origin_address,
      destination_address: trip.destination_address,
      vehicle_name: vehicle ? vehicle.name : 'Logistics Carrier',
      cargo_name: cargo ? cargo.name : 'General Goods',
      planned_duration_min: trip.eta_minutes,
      actual_duration_min: trip.eta_minutes,
      planned_cost: trip.estimated_cost,
      actual_cost: trip.estimated_cost,
      distance_km: trip.distance_km,
      fuel_used_l: activeRoute ? activeRoute.fuel_liters : 25,
      reroutes_count: 1,
      delays_count: 0,
      total_delay_min: 0,
      optimization_mode: trip.optimization_mode,
      completed_at: new Date().toISOString()
    });

    Database.insert('notifications', {
      user_id: req.user.id,
      trip_id: trip.id,
      type: 'TRIP_COMPLETED',
      title: 'Trip Completed Successfully',
      message: `Delivery successfully completed. Trip telemetry archived to logistics analytics.`,
      severity: 'SUCCESS'
    });

    res.json({ success: true, data: updated });
  }

  static async evaluateReroute(req, res, next) {
    try {
      const { tripId } = req.params;
      const result = await DynamicRerouteService.evaluateTripForReroute(tripId);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  static async applyReroute(req, res, next) {
    try {
      const { tripId } = req.params;
      const { new_route_id } = req.body;
      const result = DynamicRerouteService.applyReroute(tripId, new_route_id);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  static async simulateIncident(req, res, next) {
    try {
      const { tripId } = req.params;
      const { type = 'CONGESTION', delayMinutes = 28, scenarioId = 'scenario-heavy-traffic' } = req.body;

      const trip = Database.findById('trips', tripId);
      if (!trip) {
        return res.status(404).json({
          success: false,
          error: { code: 'TRIP_NOT_FOUND', message: 'Trip not found' }
        });
      }

      // Record simulated traffic event
      const trafficEvent = TrafficMonitorService.recordTrafficEvent({
        tripId,
        type,
        severity: 'HIGH',
        locationName: 'Khandala Ghat Outer Incline (NE-1)',
        lat: 18.75,
        lng: 73.37,
        affectedRouteName: 'Mumbai-Pune Expressway',
        delayMinutes: Number(delayMinutes),
        confidencePercent: 95,
        recommendedAction: 'Dynamic rerouting available saving 28 minutes',
        isSimulated: true
      });

      // Evaluate reroute against the disruption
      const rerouteProposal = await DynamicRerouteService.evaluateTripForReroute(tripId, {
        delayMinutes: Number(delayMinutes),
        reason: 'Heavy traffic congestion detected ahead (+28 min delay).'
      });

      res.json({
        success: true,
        data: {
          trafficEvent,
          rerouteProposal
        }
      });
    } catch (err) {
      next(err);
    }
  }
}
