import { test } from 'node:test';
import assert from 'node:assert';
import { coloadingService } from '../src/services/coloading/coloadingService.js';

test('Co-Loading Engine: Listing retrieval & seed verification', () => {
  const listings = coloadingService.getListings();
  assert.ok(listings.length >= 4, 'Should contain at least 4 active seed listings');

  const companyA = listings.find(l => l.company_name.includes('FrostBio'));
  assert.ok(companyA, 'Company A (FrostBio) should be listed');
  assert.strictEqual(companyA.utilization_percent, 60.0, 'Company A should be exactly 60% filled');
  assert.strictEqual(companyA.available_capacity_kg, 3600, 'Company A should have 3600 kg available capacity');
  assert.strictEqual(companyA.cargo_type, 'TEMPERATURE_CONTROLLED_REEFER', 'Company A must be a refrigerated reefer');
});

test('Co-Loading Engine: Autonomous AI Matching between Company A and Company B', () => {
  const matches = coloadingService.getAiMatches(null, true);
  assert.ok(matches.length > 0, 'Should find at least 1 valid co-loading match');

  const matchAB = matches.find(m =>
    m.host_company.name.includes('FrostBio') && m.guest_company.name.includes('PureDairy')
  );

  assert.ok(matchAB, 'Should automatically match FrostBio Pharma with PureDairy Organics');

  // Verify non-competing check
  assert.notStrictEqual(matchAB.host_company.industry, matchAB.guest_company.industry, 'Industries must be non-competing');

  // Verify container utilization increase
  assert.strictEqual(matchAB.operational_metrics.initial_utilization_percent, 60.0);
  assert.ok(matchAB.operational_metrics.optimized_utilization_percent > 90.0, 'Utilization should jump to > 90%');

  // Verify cost splitting
  assert.ok(matchAB.host_company.net_savings > 2000, 'Host Company A should save over ₹2,000');
  assert.ok(matchAB.guest_company.net_savings > 2000, 'Guest Company B should save over ₹2,000');
  assert.ok(matchAB.host_company.savings_percent > 30.0, 'Host Company A should save > 30%');
  assert.ok(matchAB.guest_company.savings_percent > 30.0, 'Guest Company B should save > 30%');

  // Verify emissions
  assert.ok(matchAB.operational_metrics.co2_emissions_saved_kg > 50, 'Should save over 50 kg CO2');
});

test('Co-Loading Engine: Execute match agreement', () => {
  const matches = coloadingService.getAiMatches(null, true);
  const matchId = matches[0].id;

  const result = coloadingService.acceptMatch(matchId, '00000000-0000-4000-a000-000000000001');
  assert.strictEqual(result.success, true);
  assert.strictEqual(result.execution.status, 'DISPATCH_SCHEDULED');
});
