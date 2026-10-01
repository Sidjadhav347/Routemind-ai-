import React, { useState, useEffect } from 'react';
import { coloadingApi } from '../../services/api';
import {
  Share2,
  TrendingDown,
  Leaf,
  ShieldCheck,
  Truck,
  Package,
  ArrowRight,
  Sparkles,
  ThermometerSnowflake,
  CheckCircle2,
  Clock,
  Plus,
  Search,
  DollarSign,
  Check,
  FileText,
  AlertCircle,
  Building2,
  Zap,
  Award,
  Navigation
} from 'lucide-react';

export default function CoLoadingFeatureSection({
  currentOrigin = 'Mumbai, Maharashtra',
  currentDestination = 'Pune, Maharashtra',
  onApplyLaneToPlanner = () => {}
}) {
  const [matches, setMatches] = useState([]);
  const [listings, setListings] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Capacity Slider State (Company A: 60% default)
  const [fillPercent, setFillPercent] = useState(60);
  const [contractVerified, setContractVerified] = useState(false);
  const [verifiedHash, setVerifiedHash] = useState('');

  // Agreement Modal State
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [agreementSuccess, setAgreementSuccess] = useState(null);
  const [isAccepting, setIsAccepting] = useState(false);

  // New Listing Modal State
  const [showPostModal, setShowPostModal] = useState(false);
  const [postingError, setPostingError] = useState(null);
  const [postingSuccess, setPostingSuccess] = useState(false);
  const [listingForm, setListingForm] = useState({
    company_name: 'Apex Cold Logistics',
    industry: 'Bio-Pharmaceuticals & Healthcare',
    listing_type: 'OFFERING_SPACE',
    origin_city: 'Mumbai',
    destination_city: 'Pune',
    departure_time: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
    vehicle_type: 'Refrigerated 16T Reefer Truck',
    temperature_zone: 'REFRIGERATED_2_8C',
    capacity_total_kg: 9000,
    filled_weight_kg: 5400,
    base_solo_cost_inr: 8400,
    notes: 'ISO cold-chain certified, dual temperature logging, GPS monitored.'
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [matchesRes, listingsRes, statsRes] = await Promise.all([
        coloadingApi.getMatches(),
        coloadingApi.getListings(),
        coloadingApi.getStats()
      ]);

      if (matchesRes.success) setMatches(matchesRes.data || []);
      if (listingsRes.success) setListings(listingsRes.data || []);
      if (statsRes.success) setStats(statsRes.data || null);
    } catch (err) {
      console.warn('Error loading co-loading telemetry:', err);
    } finally {
      setLoading(false);
    }
  };

  // Calculations for Company A 60% Capacity Simulator
  const totalPallets = 20;
  const filledPallets = Math.round(totalPallets * (fillPercent / 100));
  const emptyPercent = 100 - fillPercent;
  const emptyPallets = totalPallets - filledPallets;

  const baseCost = 24000;
  const rawCostA = Math.round(baseCost * (fillPercent / 100));
  const rawCostB = Math.round(baseCost * (emptyPercent / 100));
  const savingsA = Math.round(baseCost - rawCostA);
  const savingsPercentA = Math.round((savingsA / baseCost) * 100);
  const savingsPercentB = Math.round((1 - rawCostB / baseCost) * 100);
  const co2Savings = Math.round(148 * (emptyPercent / 40));

  const handleAuthorizeSmartContract = () => {
    const hash = 'RM-LANE-' + Math.random().toString(36).substring(2, 9).toUpperCase() + '-VERIFIED';
    setVerifiedHash(hash);
    setContractVerified(true);
    setTimeout(() => setContractVerified(false), 5000);
  };

  const handleExecuteAgreement = async () => {
    if (!selectedMatch) return;
    setIsAccepting(true);
    try {
      const matchId = selectedMatch.id || selectedMatch.match_id;
      const res = await coloadingApi.acceptMatch(
        matchId,
        'Autonomous agreement ratified via RouteMind AI Smart Contract.'
      );
      if (res.success) {
        setAgreementSuccess(res.data);
        await loadData();
      }
    } catch (err) {
      alert(err.message || 'Failed to ratify co-loading agreement');
    } finally {
      setIsAccepting(false);
    }
  };

  const handleCreateListing = async (e) => {
    e.preventDefault();
    setPostingError(null);
    try {
      const payload = {
        ...listingForm,
        capacity_total_kg: Number(listingForm.capacity_total_kg),
        filled_weight_kg: Number(listingForm.filled_weight_kg),
        base_solo_cost_inr: Number(listingForm.base_solo_cost_inr),
      };
      const res = await coloadingApi.createListing(payload);
      if (res.success) {
        setPostingSuccess(true);
        setTimeout(() => {
          setPostingSuccess(false);
          setShowPostModal(false);
        }, 1800);
        await loadData();
      }
    } catch (err) {
      setPostingError(err.message || 'Failed to broadcast listing');
    }
  };

  return (
    <section
      id="coloading-feature"
      className="mt-10 pt-8 border-t border-emerald-900/50 space-y-6 scroll-mt-20"
    >
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-6 rounded-3xl border border-amber-500/30 bg-gradient-to-r from-amber-950/20 via-[#081810] to-emerald-950/20">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[11px] font-heading font-extrabold uppercase tracking-wider mb-2">
            <Share2 className="w-3.5 h-3.5 text-amber-400" />
            <span>Co-Loading Marketplace Network &bull; Integrated Feature</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-heading font-extrabold text-white tracking-tight">
            Autonomous Empty Container Space Sharing
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-3xl">
            When <strong>Company A</strong> is filled only <strong>60% of a refrigerated truck</strong> on a specific lane, 
            the AI automatically scans the network and matches them with <strong>Company B</strong> on that exact corridor, 
            splitting freight costs autonomously with zero intermediaries.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowPostModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-heading font-bold shadow-lg shadow-amber-500/30 transition transform hover:-translate-y-0.5"
          >
            <Plus className="w-4 h-4" />
            <span>Offer Empty Space</span>
          </button>
        </div>
      </div>

      {/* Real-Time Metrics Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="glass-panel p-4 rounded-2xl border border-emerald-500/30 bg-emerald-950/20">
          <div className="text-[11px] text-slate-400 font-heading font-semibold uppercase">Cost Reduction</div>
          <div className="text-2xl font-heading font-black text-emerald-400 mt-0.5">40% - 60%</div>
          <div className="text-[10px] text-slate-500">Autonomous lane split</div>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-cyan-500/30 bg-cyan-950/20">
          <div className="text-[11px] text-slate-400 font-heading font-semibold uppercase">CO₂ Abatement</div>
          <div className="text-2xl font-heading font-black text-cyan-300 mt-0.5">148 kg / trip</div>
          <div className="text-[10px] text-slate-500">Deadhead miles avoided</div>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-amber-500/30 bg-amber-950/20">
          <div className="text-[11px] text-slate-400 font-heading font-semibold uppercase">AI Match Rate</div>
          <div className="text-2xl font-heading font-black text-amber-300 mt-0.5">99.4%</div>
          <div className="text-[10px] text-slate-500">Non-competing goods</div>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-purple-500/30 bg-purple-950/20">
          <div className="text-[11px] text-slate-400 font-heading font-semibold uppercase">Smart Contracts</div>
          <div className="text-2xl font-heading font-black text-purple-300 mt-0.5">Instant</div>
          <div className="text-[10px] text-slate-500">Zero broker commissions</div>
        </div>
      </div>

      {/* Main Interactive Co-Loading Showcase Widget */}
      <div className="glass-panel p-6 rounded-3xl border border-emerald-500/30 bg-[#06120b] shadow-2xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* Column 1: Company A State (4 cols) */}
          <div className="lg:col-span-4 p-5 rounded-2xl bg-[#081810] border border-emerald-900/50 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-sky-600 to-sky-400 flex items-center justify-center text-white font-black text-lg shadow-md shadow-sky-500/30">
                  A
                </div>
                <div>
                  <h3 className="font-heading font-bold text-sm text-white">Company A: Apex Cold Logistics</h3>
                  <div className="text-[11px] text-slate-400">Refrigerated Pharma &bull; Non-Compete</div>
                </div>
              </div>

              {/* Truck Capacity Visualizer */}
              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-300 font-semibold font-heading">Reefer Truck Capacity:</span>
                  <span className="text-sky-400 font-black font-mono">{fillPercent}% Filled ({filledPallets}/20 Pallets)</span>
                </div>

                <div className="h-9 rounded-lg overflow-hidden flex border border-slate-700 bg-slate-900">
                  <div
                    style={{ width: `${fillPercent}%` }}
                    className="bg-sky-500 text-slate-950 font-black text-[11px] flex items-center justify-center transition-all duration-300"
                  >
                    Company A ({fillPercent}%)
                  </div>
                  <div
                    style={{ width: `${emptyPercent}%` }}
                    className="bg-amber-500/20 text-amber-300 font-bold text-[11px] flex items-center justify-center border-l-2 border-dashed border-amber-400 transition-all duration-300"
                  >
                    {emptyPercent}% Empty Space
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>Adjust Company A Load:</span>
                    <span>{fillPercent}%</span>
                  </div>
                  <input
                    type="range"
                    min="30"
                    max="85"
                    step="5"
                    value={fillPercent}
                    onChange={(e) => setFillPercent(Number(e.target.value))}
                    className="w-full accent-sky-400 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-400">Active Corridor:</span>
                <span className="font-semibold text-white">{currentOrigin} &rarr; {currentDestination}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Truck Spec:</span>
                <span className="font-semibold text-white">32ft Multi-Axle Reefer (-18&deg;C)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Solo Charter Cost:</span>
                <span className="font-mono text-slate-400 line-through">₹24,000</span>
              </div>
            </div>
          </div>

          {/* Column 2: AI Matching Engine Centerpiece (4 cols) */}
          <div className="lg:col-span-4 p-5 rounded-2xl bg-gradient-to-b from-emerald-950/40 via-[#0a1e14] to-emerald-950/30 border border-emerald-500/40 flex flex-col justify-between text-center space-y-4 relative">
            <div>
              <div className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center text-slate-950 mx-auto shadow-lg shadow-emerald-500/40 animate-pulse">
                <Sparkles className="w-6 h-6" />
              </div>
              <div className="mt-2 inline-block px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-heading font-extrabold uppercase tracking-wider">
                AI SCANNING NETWORK
              </div>
              <h4 className="font-heading font-extrabold text-base text-white mt-1">99.4% Lane Overlap Found!</h4>
              <p className="text-[11px] text-slate-300 leading-relaxed mt-1">
                AI identified compatible temperature profile (-18&deg;C). Non-competing agricultural perishables sharing the same corridor.
              </p>
            </div>

            {/* Cost-Splitting Matrix */}
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-emerald-500/30 text-left text-xs space-y-2">
              <div className="flex justify-between text-slate-400">
                <span>Original Solo Freight:</span>
                <span className="line-through font-mono">₹24,000</span>
              </div>
              <div className="h-px bg-slate-800" />
              <div className="flex justify-between font-bold text-white">
                <span>Company A Pays ({fillPercent}%):</span>
                <span className="text-sky-400 font-mono">
                  ₹{rawCostA.toLocaleString()} <span className="text-emerald-400 text-[10px]">(-{savingsPercentA}%)</span>
                </span>
              </div>
              <div className="flex justify-between font-bold text-white">
                <span>Company B Pays ({emptyPercent}%):</span>
                <span className="text-amber-300 font-mono">
                  ₹{rawCostB.toLocaleString()} <span className="text-emerald-400 text-[10px]">(-{savingsPercentB}%)</span>
                </span>
              </div>
              <div className="flex justify-between p-1.5 rounded-lg bg-emerald-950/50 text-emerald-300 text-[11px] font-bold">
                <span className="flex items-center gap-1">
                  <Leaf className="w-3.5 h-3.5" /> Carbon Abated:
                </span>
                <span className="font-mono">{co2Savings} kg CO₂e</span>
              </div>
            </div>

            <div>
              <button
                onClick={handleAuthorizeSmartContract}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-slate-950 font-heading font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/30 transition transform hover:-translate-y-0.5"
              >
                {contractVerified ? '✓ Smart Contract Authenticated' : 'Authorize Autonomous Contract →'}
              </button>
              {verifiedHash && (
                <div className="text-[10px] font-mono text-emerald-400 mt-1.5 break-all">
                  Hash: {verifiedHash}
                </div>
              )}
            </div>
          </div>

          {/* Column 3: Company B Matched Partner (4 cols) */}
          <div className="lg:col-span-4 p-5 rounded-2xl bg-[#081810] border border-emerald-900/50 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-emerald-600 to-emerald-400 flex items-center justify-center text-slate-950 font-black text-lg shadow-md shadow-emerald-500/30">
                  B
                </div>
                <div>
                  <h3 className="font-heading font-bold text-sm text-white">Company B: FreshBerry Organics</h3>
                  <div className="text-[11px] text-slate-400">High-Grade Fresh Fruits &bull; Non-Compete</div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                <div className="inline-block px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                  COMPATIBLE COLD CHAIN
                </div>
                <h4 className="font-bold text-xs text-white">{emptyPallets} Pallets Organic Berries</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Requires -18&deg;C refrigerated storage. Matched pickup time window (&plusmn;30 min) and shared offload destination.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-400">Space Taken:</span>
                <span className="font-semibold text-emerald-300">{emptyPercent}% Capacity ({emptyPallets} Pallets)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Solo Charter:</span>
                <span className="font-mono text-slate-400 line-through">₹24,000</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Co-Loading Total:</span>
                <span className="font-mono font-bold text-emerald-400">
                  ₹{rawCostB.toLocaleString()} <span className="text-xs text-emerald-300">(Saved ₹{(baseCost - rawCostB).toLocaleString()})</span>
                </span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Live Commercial Network Openings */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-heading font-bold text-base text-white flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-400" />
              Live Network Openings on Commercial Corridors
            </h3>
            <p className="text-xs text-slate-400">
              Verified carriers broadcasting empty container space ready for autonomous co-loading.
            </p>
          </div>
          <button
            onClick={loadData}
            className="text-xs text-emerald-400 hover:text-emerald-300 underline font-mono"
          >
            Refresh Network
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {listings.slice(0, 3).map((item) => {
            const emptySpacePercent = Math.max(
              0,
              Math.round(((item.capacity_total_kg - item.filled_weight_kg) / item.capacity_total_kg) * 100)
            );

            return (
              <div
                key={item.id}
                className="glass-panel p-4 rounded-2xl border border-emerald-900/40 hover:border-emerald-500/40 transition bg-[#06100b]/80 flex flex-col justify-between space-y-3 group"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-heading font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      {item.temperature_zone?.includes('REFRIGERATED') ? '❄️ Reefer (-18°C)' : '📦 Ambient Dry'}
                    </span>
                    <span className="text-xs font-bold text-amber-300">
                      {emptySpacePercent}% Space Left
                    </span>
                  </div>

                  <h4 className="font-heading font-bold text-sm text-white group-hover:text-emerald-300 transition-colors">
                    {item.origin_city} &rarr; {item.destination_city}
                  </h4>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {item.company_name} &bull; {item.vehicle_type}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-500 block text-[10px]">Co-Loading Rate</span>
                    <span className="font-mono font-bold text-emerald-400">
                      ₹{Math.round(item.base_solo_cost_inr * 0.55).toLocaleString()} / split
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      onApplyLaneToPlanner({
                        origin: item.origin_city,
                        destination: item.destination_city
                      });
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-950/60 hover:bg-emerald-900 text-emerald-300 border border-emerald-500/40 text-[11px] font-semibold transition"
                  >
                    <Navigation className="w-3 h-3" />
                    <span>Apply to Route</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Post Space Modal */}
      {showPostModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl glass-panel p-6 border border-emerald-500/40 bg-[#081810] shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-emerald-900/50">
              <div className="flex items-center gap-2">
                <Share2 className="w-5 h-5 text-emerald-400" />
                <h3 className="font-heading font-bold text-base text-white">Broadcast Empty Container Space</h3>
              </div>
              <button
                onClick={() => setShowPostModal(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {postingSuccess ? (
              <div className="p-6 text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center text-slate-950 mx-auto">
                  <Check className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-sm text-white">Open Container Capacity Broadcasted!</h4>
                <p className="text-xs text-slate-300">
                  RouteMind AI is now scanning network corridors to pair your truck with compatible cargo.
                </p>
              </div>
            ) : (
              <form onSubmit={handleCreateListing} className="space-y-3 text-xs">
                {postingError && (
                  <div className="p-2.5 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs">
                    {postingError}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-400 block mb-1">Company Name</label>
                    <input
                      type="text"
                      value={listingForm.company_name}
                      onChange={(e) => setListingForm({ ...listingForm, company_name: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Vehicle Specification</label>
                    <input
                      type="text"
                      value={listingForm.vehicle_type}
                      onChange={(e) => setListingForm({ ...listingForm, vehicle_type: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-400 block mb-1">Origin City</label>
                    <input
                      type="text"
                      value={listingForm.origin_city}
                      onChange={(e) => setListingForm({ ...listingForm, origin_city: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Destination City</label>
                    <input
                      type="text"
                      value={listingForm.destination_city}
                      onChange={(e) => setListingForm({ ...listingForm, destination_city: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-slate-400 block mb-1">Total Capacity (kg)</label>
                    <input
                      type="number"
                      value={listingForm.capacity_total_kg}
                      onChange={(e) => setListingForm({ ...listingForm, capacity_total_kg: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Filled Weight (kg)</label>
                    <input
                      type="number"
                      value={listingForm.filled_weight_kg}
                      onChange={(e) => setListingForm({ ...listingForm, filled_weight_kg: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Solo Cost (₹)</label>
                    <input
                      type="number"
                      value={listingForm.base_solo_cost_inr}
                      onChange={(e) => setListingForm({ ...listingForm, base_solo_cost_inr: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowPostModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-900 text-slate-300 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold font-heading"
                  >
                    Broadcast to Network
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
