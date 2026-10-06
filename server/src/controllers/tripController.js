import { v4 as uuidv4 } from 'uuid';
import { Database } from '../database/db.js';
import { RouteGeneratorService } from '../services/routing/routeGeneratorService.js';
import { DeparturePredictorService } from '../services/trips/departurePredictorService.js';
import { DynamicRerouteService } from '../services/traffic/dynamicRerouteService.js';
import { AIService } from '../services/ai/geminiService.js';
import { TrafficMonitorService } from '../services/traffic/trafficMonitorService.js';
import { GeocodingService } from '../services/maps/geocodingService.js';

export class TripController {
  /**
   * Helper to normalize location (geocodes string queries if needed)
   */
  static async resolveLocation(loc, defaultName = 'Location') {
    if (typeof loc === 'string') {
      const geo = await GeocodingService.geocode(loc);
      if (!geo) {
        throw new Error(`Unable to resolve location coordinates for: "${loc}". Please check the address.`);
      }
      return geo;
    }
    if (loc && typeof loc.lat === 'number' && typeof loc.lng === 'number') {
      return {
        address: loc.address || `${defaultName} (${loc.lat.toFixed(4)}, ${loc.lng.toFixed(4)})`,
        lat: loc.lat,
        lng: loc.lng
      };
    }
    throw new Error(`Invalid location coordinates for ${defaultName}.`);
  }

  /**
   * Core optimization processor shared by createTrip and optimizeTrip
   */
  static async processTripOptimization(reqBody, userId = null) {
    const {
      origin: rawOrigin,
      destination: rawDestination,
      waypoints: rawWaypoints = [],
      vehicle_id,
      vehicleType,
      vehicle_type,
      cargo_id = null,
      weight,
      weight_kg,
      desired_arrival_time = null,
      deadline = null,
      max_budget = null,
      budget = null,
      optimization_mode = 'BALANCED',
      optimizationMode
    } = reqBody;

    // 1. Resolve & normalize origin and destination coordinates
    const origin = await TripController.resolveLocation(rawOrigin, 'Departure Origin');
    const destination = await TripController.resolveLocation(rawDestination, 'Arrival Destination');

    const waypoints = [];
    if (Array.isArray(rawWaypoints)) {
      for (let i = 0; i < rawWaypoints.length; i++) {
        const wp = await TripController.resolveLocation(rawWaypoints[i], `Waypoint ${i + 1}`);
        waypoints.push(wp);
      }
    }

    // 2. Fetch or construct vehicle
    const targetType = vehicleType || vehicle_type;
    let vehicle = null;

    if (vehicle_id) {
      vehicle = Database.findById('vehicles', vehicle_id);
    }
    if (!vehicle && targetType) {
      const allVehicles = Database.get('vehicles');
      vehicle = allVehicles.find(v => v.type === targetType.toUpperCase());
    }
    if (!vehicle) {
      // Default fallback vehicle if fleet not specified
      const allVehicles = Database.get('vehicles');
      vehicle = allVehicles[0] || {
        id: uuidv4(),
        name: 'Standard Commercial Transport',
        type: 'HEAVY_TRUCK',
        max_weight_capacity_kg: 16000,
        tare_weight_kg: 7500,
        height_m: 3.8,
        width_m: 2.55,
        length_m: 12.5,
        fuel_type: 'DIESEL',
        fuel_efficiency_km_l: 3.8,
        fuel_price_per_unit: 92.50
      };
    }

    // 3. Resolve cargo and explicit shipment weight
    let cargo = cargo_id ? Database.findById('cargo', cargo_id) : null;
    const explicitWeight = weight !== undefined && weight !== null ? parseFloat(weight) :
      (weight_kg !== undefined && weight_kg !== null ? parseFloat(weight_kg) : null);

    if (explicitWeight !== null && !isNaN(explicitWeight)) {
      if (cargo) {
        cargo = { ...cargo, weight_kg: explicitWeight };
      } else {
        cargo = {
          id: 'custom-cargo',
          name: `Custom Consignment (${explicitWeight.toLocaleString()} kg)`,
          weight_kg: explicitWeight,
          type: 'GENERAL'
        };
      }
    }

    const shipmentWeightKg = cargo ? parseFloat(cargo.weight_kg || 0) : 0;
    const vehicleMaxCapacityKg = parseFloat(vehicle.max_weight_capacity_kg || 1000);

    // 4. CRITICAL REJECTION: Vehicle payload capacity constraint validation
    if (shipmentWeightKg > vehicleMaxCapacityKg) {
      const err = new Error('Vehicle payload capacity cannot be less than shipment weight.');
      err.statusCode = 400;
      err.code = 'CAPACITY_EXCEEDED';
      err.details = {
        shipmentWeightKg,
        vehicleMaxCapacityKg,
        vehicleName: vehicle.name,
        vehicleType: vehicle.type
      };
      throw err;
    }

    // 5. Budget and deadline parameters
    const budgetVal = budget !== null && budget !== undefined ? parseFloat(budget) :
      (max_budget !== null && max_budget !== undefined ? parseFloat(max_budget) : null);

    const deadlineVal = desired_arrival_time || deadline || null;
    const activeMode = (optimizationMode || optimization_mode || 'BALANCED').toUpperCase();

    const tripId = uuidv4();

    // 6. Generate candidate routes dynamically
    const candidateRoutes = await RouteGeneratorService.generateTripRoutes({
      tripId,
      origin,
      destination,
      waypoints,
      vehicle,
      cargo,
      optimizationMode: activeMode,
      desiredArrivalTime: deadlineVal,
      maxBudget: budgetVal
    });

    if (!candidateRoutes || candidateRoutes.length === 0) {
      throw new Error('Unable to calculate this route. Please check the locations and try again.');
    }

    // Identify recommended route
    const recommendedRoute = candidateRoutes.find(r => r.is_recommended) || candidateRoutes[0];
    const alternativeRoutes = candidateRoutes.filter(r => r.id !== recommendedRoute.id);

    // 7. Check budget feasibility across routes
    const minCostRoute = candidateRoutes.reduce((min, r) => (!min || r.total_cost < min.total_cost ? r : min), null);
    let budgetWarning = null;
    let budgetSatisfied = true;

    if (budgetVal && budgetVal > 0 && minCostRoute) {
      if (minCostRoute.total_cost > budgetVal) {
        budgetSatisfied = false;
        budgetWarning = `No route currently satisfies your budget of ₹${budgetVal.toLocaleString()}. The closest feasible option is ₹${minCostRoute.total_cost.toLocaleString()} (${minCostRoute.route_code}).`;
      }
    }

    // 8. Departure prediction
    const departurePrediction = DeparturePredictorService.predictDepartureWindows({
      desiredDeadline: deadlineVal,
      baseDurationMinutes: recommendedRoute.duration_minutes,
      trafficCondition: recommendedRoute.traffic_level
    });

    // 9. AI Route Explanation grounded on real computed data
    const aiExplanation = await AIService.explainRouteRecommendation({
      recommendedRoute,
      alternativeRoutes,
      vehicle,
      cargo,
      optimizationMode: activeMode,
      deadlineTime: deadlineVal,
      maxBudget: budgetVal
    });

    // If budget is not satisfied, append clear advisory to AI explanation
    if (!budgetSatisfied && budgetWarning) {
      aiExplanation.warnings = aiExplanation.warnings || [];
      if (!aiExplanation.warnings.some(w => w.includes('budget'))) {
        aiExplanation.warnings.unshift(budgetWarning);
      }
    }

    return {
      tripId,
      origin,
      destination,
      waypoints,
      vehicle,
      cargo,
      budgetVal,
      deadlineVal,
      activeMode,
      candidateRoutes,
      recommendedRoute,
      alternativeRoutes,
      departurePrediction,
      aiExplanation,
      budgetWarning,
      budgetSatisfied
    };
  }

  static async optimizeTrip(req, res, next) {
    try {
      const optimization = await TripController.processTripOptimization(req.body, req.user?.id);
      res.json({
        success: true,
        data: {
          routes: optimization.candidateRoutes,
          recommendedRoute: optimization.recommendedRoute,
          departurePrediction: optimization.departurePrediction,
          aiExplanation: optimization.aiExplanation,
          budgetWarning: optimization.budgetWarning,
          budgetSatisfied: optimization.budgetSatisfied,
          vehicle: optimization.vehicle,
          cargo: optimization.cargo
        }
      });
    } catch (err) {
      if (err.statusCode === 400 || err.code === 'CAPACITY_EXCEEDED') {
        return res.status(400).json({
          success: false,
          error: err.message || 'Vehicle payload capacity cannot be less than shipment weight.',
          details: err.details || null
        });
      }
      next(err);
    }
  }

  static async createTrip(req, res, next) {
    try {
      const optimization = await TripController.processTripOptimization(req.body, req.user?.id);
      const {
        tripId,
        origin,
        destination,
        waypoints,
        vehicle,
        cargo,
        budgetVal,
        deadlineVal,
        activeMode,
        candidateRoutes,
        recommendedRoute,
        departurePrediction,
        aiExplanation,
        budgetWarning,
        budgetSatisfied
      } = optimization;

      // Save routes to DB
      for (const r of candidateRoutes) {
        Database.insert('trip_routes', r);
      }

      Database.insert('departure_predictions', {
        id: uuidv4(),
        trip_id: tripId,
        deadline_time: deadlineVal || new Date(Date.now() + 180 * 60 * 1000).toISOString(),
        recommended_departure: departurePrediction.recommendedDeparture,
        expected_arrival: departurePrediction.expectedArrival,
        safety_buffer_minutes: departurePrediction.safetyBufferMinutes,
        traffic_risk: departurePrediction.trafficRisk,
        deadline_confidence: departurePrediction.deadlineConfidence,
        scenarios: departurePrediction.scenarios
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

      // Create Master Trip Record
      const newTrip = Database.insert('trips', {
        id: tripId,
        user_id: req.user ? req.user.id : '00000000-0000-4000-a000-000000000001',
        origin_address: origin.address,
        origin_lat: origin.lat,
        origin_lng: origin.lng,
        destination_address: destination.address,
        destination_lat: destination.lat,
        destination_lng: destination.lng,
        waypoints,
        vehicle_id: vehicle.id,
        cargo_id: cargo ? cargo.id : null,
        desired_arrival_time: deadlineVal,
        max_budget: budgetVal,
        optimization_mode: activeMode,
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
          aiExplanation,
          budgetWarning,
          budgetSatisfied
        }
      });
    } catch (err) {
      if (err.statusCode === 400 || err.code === 'CAPACITY_EXCEEDED') {
        return res.status(400).json({
          success: false,
          error: err.message || 'Vehicle payload capacity cannot be less than shipment weight.',
          details: err.details || null
        });
      }
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
