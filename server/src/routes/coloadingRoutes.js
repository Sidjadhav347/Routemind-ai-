import { Router } from 'express';
import { coloadingService } from '../services/coloading/coloadingService.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

// GET all co-loading listings (capacity offers and demands)
router.get('/listings', (req, res, next) => {
  try {
    const listings = coloadingService.getListings(req.query);
    res.json({ success: true, count: listings.length, data: listings });
  } catch (err) {
    next(err);
  }
});

// POST create a new capacity offer or demand
router.post('/listings', authenticate, (req, res, next) => {
  try {
    const created = coloadingService.createListing(req.user.id, req.body);
    res.status(201).json({ success: true, data: created });
  } catch (err) {
    next(err);
  }
});

// GET AI Matches with autonomous cost splitting
router.get('/matches', (req, res, next) => {
  try {
    const { origin, destination, weight, weight_kg, cargo_type, budget, listingId, listing_id, mode } = req.query;

    if (origin || destination || weight || weight_kg) {
      const dynamicMatches = coloadingService.findMatchesForShipment({
        origin: origin || 'Mumbai',
        destination: destination || 'Pune',
        weightKg: weight || weight_kg || 2500,
        cargoType: cargo_type || 'GENERAL',
        maxBudget: budget || null,
        mode: mode || 'LIVE'
      });
      return res.json({ success: true, count: dynamicMatches.length, data: dynamicMatches, mode: mode || 'LIVE' });
    }

    const includeAll = req.query.includeAll !== 'false';
    const matches = coloadingService.getAiMatches(listingId || listing_id || null, includeAll);
    res.json({ success: true, count: matches.length, data: matches });
  } catch (err) {
    next(err);
  }
});

// POST accept and lock a co-loading match agreement
router.post('/matches/accept', authenticate, (req, res, next) => {
  try {
    const { match_id } = req.body;
    if (!match_id) {
      return res.status(400).json({ success: false, error: { message: 'match_id is required' } });
    }
    const result = coloadingService.acceptMatch(match_id, req.user.id);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

// GET Co-loading Network Statistics
router.get('/stats', (req, res, next) => {
  try {
    const listings = coloadingService.getListings();
    const matches = coloadingService.getAiMatches();

    const totalSavings = matches.reduce((sum, m) => sum + m.operational_metrics.total_money_saved, 0);
    const totalCo2Saved = matches.reduce((sum, m) => sum + m.operational_metrics.co2_emissions_saved_kg, 0);
    const avgSavingsPercent = matches.length > 0
      ? Math.round(matches.reduce((sum, m) => sum + ((m.host_company.savings_percent + m.guest_company.savings_percent) / 2), 0) / matches.length)
      : 39;

    res.json({
      success: true,
      data: {
        activeListingsCount: listings.length,
        potentialMatchesCount: matches.length,
        totalNetworkSavingsInr: totalSavings,
        totalCo2AvoidedKg: totalCo2Saved,
        avgCostReductionPercent: avgSavingsPercent,
        trucksRemovedFromRoad: matches.length,
        networkMatchRatePercent: 98.4
      }
    });
  } catch (err) {
    next(err);
  }
});

export default router;
