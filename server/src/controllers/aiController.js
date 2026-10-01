import { AIService } from '../services/ai/geminiService.js';
import { SimulatorService } from '../services/trips/simulatorService.js';
import { Database } from '../database/db.js';

export class AIController {
  static async chat(req, res, next) {
    try {
      const { query, trip_id = null } = req.body;
      const activeTrip = trip_id ? Database.findById('trips', trip_id) : null;
      const vehicles = Database.find('vehicles', v => v.user_id === req.user.id);
      const cargoList = Database.find('cargo', c => c.user_id === req.user.id);

      const response = await AIService.handleMobilityQuery({
        query,
        user: req.user,
        activeTrip,
        vehicles,
        cargoList
      });

      res.json({
        success: true,
        data: response
      });
    } catch (err) {
      next(err);
    }
  }

  static async explainRoute(req, res, next) {
    try {
      const { route_id, trip_id } = req.body;
      const route = Database.findById('trip_routes', route_id);
      if (!route) {
        return res.status(404).json({
          success: false,
          error: { code: 'ROUTE_NOT_FOUND', message: 'Route not found' }
        });
      }

      const trip = trip_id ? Database.findById('trips', trip_id) : null;
      const vehicle = trip?.vehicle_id ? Database.findById('vehicles', trip.vehicle_id) : null;
      const cargo = trip?.cargo_id ? Database.findById('cargo', trip.cargo_id) : null;

      const alternatives = trip ? Database.find('trip_routes', r => r.trip_id === trip.id && r.id !== route.id) : [];

      const explanation = await AIService.explainRouteRecommendation({
        recommendedRoute: route,
        alternativeRoutes: alternatives,
        vehicle,
        cargo,
        optimizationMode: trip?.optimization_mode || 'BALANCED',
        deadlineTime: trip?.desired_arrival_time
      });

      res.json({
        success: true,
        data: explanation
      });
    } catch (err) {
      next(err);
    }
  }

  static async runSimulation(req, res, next) {
    try {
      const simulation = await SimulatorService.runSimulation(req.body);
      res.json({
        success: true,
        data: simulation
      });
    } catch (err) {
      next(err);
    }
  }
}
