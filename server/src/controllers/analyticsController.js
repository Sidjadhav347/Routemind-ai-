import { AnalyticsService } from '../services/analytics/analyticsService.js';

export class AnalyticsController {
  static async getAnalytics(req, res) {
    const data = AnalyticsService.getUserAnalytics(req.user.id);
    res.json({
      success: true,
      data
    });
  }
}
