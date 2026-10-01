import { GeocodingService } from '../services/maps/geocodingService.js';
import { Database } from '../database/db.js';

export class RouteController {
  static async geocode(req, res, next) {
    try {
      const { query } = req.query;
      if (!query) {
        return res.status(400).json({
          success: false,
          error: { code: 'QUERY_REQUIRED', message: 'Address search query required' }
        });
      }

      const result = await GeocodingService.geocode(query);
      res.json({
        success: true,
        data: result
      });
    } catch (err) {
      next(err);
    }
  }

  static async getRouteById(req, res) {
    const route = Database.findById('trip_routes', req.params.id);
    if (!route) {
      return res.status(404).json({
        success: false,
        error: { code: 'ROUTE_NOT_FOUND', message: 'Route not found' }
      });
    }
    res.json({
      success: true,
      data: route
    });
  }
}
