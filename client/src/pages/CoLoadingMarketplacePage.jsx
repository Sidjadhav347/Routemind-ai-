import React, { useState, useEffect } from 'react';
import { coloadingApi } from '../services/api';
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
  Filter,
  DollarSign,
  Percent,
  Check,
  X,
  FileText,
  AlertCircle,
  Building2,
  ChevronRight,
  Zap,
  Award
} from 'lucide-react';

export default function CoLoadingMarketplacePage() {
  const [matches, setMatches] = useState([]);
  const [listings, setListings] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('matches'); // 'matches' | 'listings'
  
  // Agreement Modal state
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [agreementSuccess, setAgreementSuccess] = useState(null);
  const [isAccepting, setIsAccepting] = useState(false);

  // New Listing Modal state
  const [showPostModal, setShowPostModal] = useState(false);
  const [postingError, setPostingError] = useState(null);
  const [postingSuccess, setPostingSuccess] = useState(false);
  const [listingForm, setListingForm] = useState({
    company_name: '',
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
    notes: 'GPS monitored, ISO cold-chain certified, dual temperature logging.'
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
      console.error('Error loading co-loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmMatch = (match) => {
    setSelectedMatch(match);
    setAgreementSuccess(null);
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
          loadData();
        }, 1200);
      }
    } catch (err) {
      setPostingError(err.message || 'Failed to create listing');
    }
  };

  // Filter listings
  const filteredListings = listings.filter((item) => {
    const compName = item.company_name || '';
    const corridor = item.corridor_name || item.lane_corridor || '';
    const origin = item.origin_address || item.origin?.city || '';
    const dest = item.destination_address || item.destination?.city || '';

    const matchesSearch =
      compName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      corridor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      origin.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dest.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (filterType === 'ALL') return true;
    if (filterType === 'REEFER') {
      return (
        (item.cargo_type && item.cargo_type.includes('REEFER')) ||
        (item.temperature_range && item.temperature_range.includes('°C')) ||
        (item.temperature_zone && item.temperature_zone.includes('REFRIGERATED'))
      );
    }
    if (filterType === 'DRY') {
      return (
        (item.cargo_type && item.cargo_type.includes('DRY')) ||
        item.temperature_range === 'AMBIENT' ||
        item.temperature_zone === 'AMBIENT_DRY'
      );
    }
    if (filterType === 'OFFER') return item.listing_type === 'OFFERING_SPACE';
    if (filterType === 'SEEK') return item.listing_type === 'SEEKING_SPACE';
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-300">
      {/* Header & Value Proposition */}
      <div className="relative overflow-hidden rounded-3xl glass-panel p-8 sm:p-10 border border-emerald-500/25 bg-gradient-to-br from-[#061810]/95 via-[#040907]/95 to-[#082216]/85 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-10 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold tracking-wide">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Real-Time Autonomous Logistics Sharing</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
              Co-Loading <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-emerald-300 to-amber-300">Marketplace Network</span>
            </h1>

            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              Allows non-competing enterprises to securely share empty container and refrigerated trailer space in real time. 
              If Company A fills only 60% of a refrigerated truck on a specific lane, RouteMind AI scans the corridor, 
              matches them with Company B needing similar cold-chain movement, and splits costs autonomously.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowPostModal(true)}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-bold text-sm shadow-emerald-glow hover:shadow-emerald-glow-hover transition-all transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <Plus className="w-4 h-4" />
              <span>Post Empty Space / Need</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('matches');
                loadData();
              }}
              className="flex items-center gap-2 px-4 py-3 rounded-2xl glass-panel-light hover:bg-emerald-950/40 text-emerald-300 border border-emerald-500/30 font-semibold text-sm transition"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Refresh AI Matches</span>
            </button>
          </div>
        </div>

        {/* Live Network KPI Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-6 border-t border-emerald-900/40">
          <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-[#040907]/60 border border-emerald-900/40">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <TrendingDown className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl font-bold text-white tracking-tight">
                ₹{((stats?.totalNetworkSavingsInr || 16700)).toLocaleString()}
              </div>
              <div className="text-xs text-slate-400 font-medium">Network Costs Saved</div>
            </div>
          </div>

          <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-[#040907]/60 border border-emerald-900/40">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Percent className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl font-bold text-white tracking-tight">
                60% → <span className="text-emerald-400">91.1%</span>
              </div>
              <div className="text-xs text-slate-400 font-medium">Reefer Utilization Surge</div>
            </div>
          </div>

          <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-[#040907]/60 border border-emerald-900/40">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Leaf className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl font-bold text-emerald-300 tracking-tight">
                {((stats?.totalCo2AvoidedKg || 204)).toLocaleString()} kg
              </div>
              <div className="text-xs text-slate-400 font-medium">CO₂ Emissions Avoided</div>
            </div>
          </div>

          <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-[#040907]/60 border border-emerald-900/40">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl font-bold text-white tracking-tight">
                {stats?.networkMatchRatePercent || 98.4}% Match Rate
              </div>
              <div className="text-xs text-slate-400 font-medium">Non-Competing Verified</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center justify-between gap-4 border-b border-emerald-900/40 pb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('matches')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition flex items-center gap-2 ${
              activeTab === 'matches'
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-emerald-glow'
                : 'text-slate-300 hover:text-white hover:bg-emerald-950/30'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>AI Match Opportunities ({matches.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('listings')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition flex items-center gap-2 ${
              activeTab === 'listings'
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-emerald-glow'
                : 'text-slate-300 hover:text-white hover:bg-emerald-950/30'
            }`}
          >
            <Truck className="w-4 h-4" />
            <span>Open Network Capacity ({listings.length})</span>
          </button>
        </div>

        {activeTab === 'listings' && (
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search route or company..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-3 py-1.5 rounded-xl bg-[#08140f] border border-emerald-500/20 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400"
              />
            </div>

            <div className="flex items-center gap-1 bg-[#08140f] p-1 rounded-xl border border-emerald-500/20 text-xs">
              <button
                onClick={() => setFilterType('ALL')}
                className={`px-2.5 py-1 rounded-lg font-medium transition ${
                  filterType === 'ALL' ? 'bg-emerald-500/20 text-emerald-300 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterType('REEFER')}
                className={`px-2.5 py-1 rounded-lg font-medium transition ${
                  filterType === 'REEFER' ? 'bg-emerald-500/20 text-emerald-300 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Refrigerated
              </button>
              <button
                onClick={() => setFilterType('DRY')}
                className={`px-2.5 py-1 rounded-lg font-medium transition ${
                  filterType === 'DRY' ? 'bg-emerald-500/20 text-emerald-300 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Dry Box
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="py-20 text-center text-slate-400 space-y-3">
          <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-medium">Scanning live logistics telemetry & matching empty container space...</p>
        </div>
      ) : activeTab === 'matches' ? (
        /* AI MATCHES TAB */
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                <span>Autonomous Route & Cargo Matches</span>
                <span className="px-2.5 py-0.5 rounded-full text-xs bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  AI Verified Non-Competing
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Paired based on exact corridor overlap, compatible temperature zone, and autonomous cost minimization.
              </p>
            </div>
          </div>

          {matches.length === 0 ? (
            <div className="glass-panel p-12 rounded-3xl text-center space-y-4 border border-emerald-500/20">
              <Share2 className="w-12 h-12 text-emerald-400/50 mx-auto" />
              <h3 className="text-base font-bold text-white">No Unmatched Pairs at this Moment</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                All high-priority shipments on monitored corridors have been paired or are in transit. Post a new empty trailer listing to test match generation!
              </p>
              <button
                onClick={() => setShowPostModal(true)}
                className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs shadow-emerald-glow"
              >
                Post New Capacity
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {matches.map((match) => {
                const host = match.host_company;
                const guest = match.guest_company;
                const ops = match.operational_metrics || {};
                const sla = match.digital_sla || {};
                const isConfirmed = match.status === 'AGREEMENT_CONFIRMED' || match.status === 'MATCHED';

                return (
                  <div
                    key={match.id}
                    className="relative rounded-3xl glass-panel p-6 sm:p-8 border border-emerald-500/30 bg-[#081610]/90 shadow-xl hover:border-emerald-400/50 transition-all duration-300 group"
                  >
                    {/* Top match header badge */}
                    <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-emerald-900/40">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-amber-400 flex items-center justify-center text-slate-950 font-black shadow-md shadow-emerald-500/20">
                          <Share2 className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-base font-bold text-white">{match.corridor}</span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              {match.match_score}% Match Score
                            </span>
                            {isConfirmed && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-amber-400" />
                                Confirmed & Locked
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                            <span>Vehicle: {host.vehicle || 'Heavy Commercial Reefer'}</span>
                            <span>•</span>
                            <span>Temperature: {ops.temperature_compliance || 'Cold-Chain'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 rounded-xl text-xs font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 flex items-center gap-1.5">
                          <ThermometerSnowflake className="w-3.5 h-3.5 text-cyan-400" />
                          <span>{ops.temperature_compliance || '+2°C to +8°C'}</span>
                        </span>
                        <span className="px-3 py-1 rounded-xl text-xs font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 flex items-center gap-1.5">
                          <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Non-Competing</span>
                        </span>
                      </div>
                    </div>

                    {/* Company A and Company B Side-by-Side Comparison */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 my-6">
                      {/* Host: Company A */}
                      <div className="rounded-2xl p-5 bg-[#05100b] border border-emerald-900/60 relative overflow-hidden">
                        <div className="absolute top-0 right-0 px-3 py-1 rounded-bl-xl bg-emerald-500/20 text-emerald-300 text-[11px] font-bold border-l border-b border-emerald-500/30">
                          COMPANY A (Truck Host)
                        </div>

                        <div className="space-y-4">
                          <div>
                            <div className="flex items-center gap-2 text-xs text-emerald-400 font-semibold tracking-wide">
                              <Building2 className="w-3.5 h-3.5" />
                              <span>{host.industry}</span>
                            </div>
                            <h3 className="text-base font-bold text-white mt-1">{host.name}</h3>
                            <div className="text-xs text-slate-400 mt-0.5">
                              Refrigerated 16T Reefer Truck • Initial Load: {host.original_utilization}%
                            </div>
                          </div>

                          {/* Initial Fill Level vs New Fill Level */}
                          <div className="space-y-2 pt-2 border-t border-emerald-900/40">
                            <div className="flex justify-between text-xs">
                              <span className="text-slate-400">Truck Initial Load:</span>
                              <span className="font-bold text-amber-300">{host.original_utilization}% filled</span>
                            </div>
                            <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden p-0.5">
                              <div
                                className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full"
                                style={{ width: `${host.original_utilization}%` }}
                              />
                            </div>
                            <div className="flex justify-between text-[11px] text-slate-400">
                              <span>{host.loaded_weight_kg.toLocaleString()} kg loaded</span>
                              <span>Available Space: <strong className="text-emerald-300">{(ops.total_capacity_kg - host.loaded_weight_kg).toLocaleString()} kg (40%)</strong></span>
                            </div>
                          </div>

                          {/* Cost Split for Company A */}
                          <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/20 flex items-center justify-between text-xs">
                            <div>
                              <div className="text-slate-400 text-[11px]">Original Solo Cost: <span className="line-through text-slate-500">₹{host.solo_cost.toLocaleString()}</span></div>
                              <div className="font-bold text-white text-sm">New Co-Loaded Cost: <span className="text-emerald-400">₹{host.split_cost.toLocaleString()}</span></div>
                            </div>
                            <div className="text-right">
                              <div className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 font-extrabold text-xs">
                                Saves ₹{host.net_savings.toLocaleString()} ({host.savings_percent}%)
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Guest: Company B */}
                      <div className="rounded-2xl p-5 bg-[#05100b] border border-emerald-900/60 relative overflow-hidden">
                        <div className="absolute top-0 right-0 px-3 py-1 rounded-bl-xl bg-indigo-500/20 text-indigo-300 text-[11px] font-bold border-l border-b border-indigo-500/30">
                          COMPANY B (Matched Shipper)
                        </div>

                        <div className="space-y-4">
                          <div>
                            <div className="flex items-center gap-2 text-xs text-indigo-400 font-semibold tracking-wide">
                              <Building2 className="w-3.5 h-3.5" />
                              <span>{guest.industry}</span>
                            </div>
                            <h3 className="text-base font-bold text-white mt-1">{guest.name}</h3>
                            <div className="text-xs text-slate-400 mt-0.5">
                              Certified Organic Cold Produce • Exact Same Route Corridor
                            </div>
                          </div>

                          {/* Cargo weight requested */}
                          <div className="space-y-2 pt-2 border-t border-emerald-900/40">
                            <div className="flex justify-between text-xs">
                              <span className="text-slate-400">Required Shared Space:</span>
                              <span className="font-bold text-emerald-300">{guest.needed_weight_kg.toLocaleString()} kg ({Math.round((guest.needed_weight_kg / ops.total_capacity_kg) * 100)}% of truck)</span>
                            </div>
                            <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden p-0.5">
                              <div
                                className="h-full bg-gradient-to-r from-indigo-400 to-emerald-400 rounded-full"
                                style={{ width: `${(guest.needed_weight_kg / ops.total_capacity_kg) * 100}%` }}
                              />
                            </div>
                            <div className="flex justify-between text-[11px] text-slate-400">
                              <span>Temperature: {ops.temperature_compliance || '+2°C to +6°C'}</span>
                              <span className="text-emerald-400 font-semibold">100% Fits Space</span>
                            </div>
                          </div>

                          {/* Cost Split for Company B */}
                          <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/20 flex items-center justify-between text-xs">
                            <div>
                              <div className="text-slate-400 text-[11px]">Original Solo Cost: <span className="line-through text-slate-500">₹{guest.solo_cost.toLocaleString()}</span></div>
                              <div className="font-bold text-white text-sm">New Co-Loaded Cost: <span className="text-emerald-400">₹{guest.split_cost.toLocaleString()}</span></div>
                            </div>
                            <div className="text-right">
                              <div className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 font-extrabold text-xs">
                                Saves ₹{guest.net_savings.toLocaleString()} ({guest.savings_percent}%)
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* AI Synergy Explanation */}
                    {match.ai_explanation && (
                      <div className="mb-6 p-4 rounded-2xl bg-[#040e09] border border-emerald-900/50 text-xs text-slate-300 flex items-start gap-3">
                        <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-emerald-300 font-semibold">AI Route Reasoning: </strong>
                          <span>{match.ai_explanation}</span>
                        </div>
                      </div>
                    )}

                    {/* Surged Synergy Banner & Call to Action */}
                    <div className="rounded-2xl p-4 bg-gradient-to-r from-[#041d13] via-[#09261a] to-[#041d13] border border-emerald-500/40 flex flex-col md:flex-row items-center justify-between gap-4">
                      <div className="flex flex-wrap items-center gap-6">
                        <div>
                          <div className="text-[11px] text-slate-400 uppercase font-semibold">Surged Container Utilization</div>
                          <div className="text-lg font-extrabold text-white">
                            {ops.initial_utilization_percent}% → <span className="text-emerald-400">{ops.optimized_utilization_percent}%</span>
                          </div>
                        </div>
                        <div className="h-8 w-px bg-emerald-800/40 hidden md:block" />
                        <div>
                          <div className="text-[11px] text-slate-400 uppercase font-semibold">Combined Net Savings</div>
                          <div className="text-lg font-extrabold text-amber-400">
                            ₹{ops.total_money_saved.toLocaleString()} (39.5%)
                          </div>
                        </div>
                        <div className="h-8 w-px bg-emerald-800/40 hidden md:block" />
                        <div>
                          <div className="text-[11px] text-slate-400 uppercase font-semibold">CO₂ Emissions Eliminated</div>
                          <div className="text-lg font-extrabold text-emerald-300 flex items-center gap-1">
                            <Leaf className="w-4 h-4 text-emerald-400" />
                            <span>{ops.co2_emissions_saved_kg} kg</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        {isConfirmed ? (
                          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            <span>Agreement Signed & Active</span>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleConfirmMatch(match)}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-bold text-xs shadow-emerald-glow hover:shadow-emerald-glow-hover transition-all"
                          >
                            <span>Review & Ratify SLA</span>
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* OPEN NETWORK LISTINGS TAB */
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">Active Capacity Listings</h2>
              <p className="text-xs text-slate-400 mt-1">
                Real-time shared capacity offers and transport requests across all commercial trade corridors.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredListings.map((item) => {
              const isOffering = item.listing_type === 'OFFERING_SPACE';
              const fillPct = isOffering ? item.utilization_percent : Math.round(((item.required_capacity_kg || 2500) / 10000) * 100);

              return (
                <div
                  key={item.id}
                  className="rounded-2xl glass-panel p-6 border border-emerald-900/40 hover:border-emerald-500/40 transition flex flex-col justify-between space-y-4 bg-[#081510]/80"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          isOffering
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                        }`}
                      >
                        {isOffering ? 'Offering Space' : 'Needs Space'}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {item.corridor_name || item.lane_corridor}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-base font-bold text-white">{item.company_name}</h4>
                      <p className="text-xs text-emerald-400/80 font-medium">{item.company_industry || item.industry}</p>
                    </div>

                    <div className="p-3 rounded-xl bg-[#040a07] border border-emerald-900/50 space-y-2 text-xs">
                      <div className="flex items-center justify-between text-slate-300">
                        <span>Vehicle / Class:</span>
                        <span className="font-semibold text-white">{item.vehicle_name || item.vehicle_type}</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-300">
                        <span>Temperature:</span>
                        <span className="font-semibold text-cyan-300">{item.temperature_range || item.temperature_zone}</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-300">
                        <span>{isOffering ? 'Available Payload:' : 'Weight Needed:'}</span>
                        <span className="font-bold text-emerald-400">
                          {isOffering
                            ? `${(item.available_capacity_kg || 0).toLocaleString()} kg open`
                            : `${(item.required_capacity_kg || 0).toLocaleString()} kg`}
                        </span>
                      </div>
                    </div>

                    {isOffering && (
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-400">Current Truck Fill:</span>
                          <span className="font-bold text-amber-300">{item.utilization_percent || item.fill_percentage}% filled</span>
                        </div>
                        <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-amber-400 to-emerald-400 rounded-full"
                            style={{ width: `${item.utilization_percent || item.fill_percentage}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-emerald-900/40 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase">Solo Baseline</div>
                      <div className="text-xs font-bold text-slate-300">₹{(item.solo_trip_cost || item.base_solo_cost_inr || 8400).toLocaleString()}</div>
                    </div>
                    <button
                      onClick={() => {
                        setActiveTab('matches');
                      }}
                      className="px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1.5 transition"
                    >
                      <span>Find Matches</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SLA / Legal Execution Agreement Modal */}
      {selectedMatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-2xl rounded-3xl glass-panel p-6 sm:p-8 border border-emerald-500/40 bg-[#06140e] shadow-2xl space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-emerald-900/40">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Autonomous Co-Loading SLA</h3>
                  <p className="text-xs text-slate-400">RouteMind Smart Logistics Protocol</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedMatch(null)}
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {agreementSuccess ? (
              <div className="py-6 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/40 animate-bounce-subtle">
                  <Check className="w-8 h-8" />
                </div>
                <h4 className="text-xl font-bold text-white">Agreement Successfully Ratified!</h4>
                <p className="text-xs text-slate-300 max-w-md mx-auto">
                  Agreement ID: <code className="text-emerald-300 font-mono">{agreementSuccess.contract_id || agreementSuccess.agreement_id || 'SLA-RTMD-9912'}</code>. 
                  Digital escrow initialized. Driver manifests and secondary waypoint coordinates updated in real time.
                </p>
                <div className="p-4 rounded-2xl bg-[#040907] border border-emerald-500/30 text-xs text-left space-y-2 text-slate-300">
                  <div className="flex justify-between">
                    <span>Host Escrow Share:</span>
                    <strong className="text-emerald-400">₹{selectedMatch.host_company.split_cost.toLocaleString()}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Guest Escrow Share:</span>
                    <strong className="text-emerald-400">₹{selectedMatch.guest_company.split_cost.toLocaleString()}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Temperature Compliance Guarantee:</span>
                    <strong className="text-cyan-400">{selectedMatch.operational_metrics?.temperature_compliance || '+2°C to +8°C'} Verified</strong>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedMatch(null)}
                  className="px-6 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-bold text-sm shadow-emerald-glow"
                >
                  Close & View Manifest
                </button>
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                <div className="p-4 rounded-2xl bg-[#030a07] border border-emerald-900/60 space-y-3">
                  <div className="flex justify-between text-slate-300 font-medium">
                    <span>Corridor Lane:</span>
                    <strong className="text-white">{selectedMatch.corridor}</strong>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Non-Competing Parties:</span>
                    <span className="text-emerald-300 font-bold">{selectedMatch.host_company.name} &amp; {selectedMatch.guest_company.name}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Autonomous Split Ratio:</span>
                    <span className="text-amber-300 font-mono">
                      {selectedMatch.digital_sla?.escrow_split_pct ? `${selectedMatch.digital_sla.escrow_split_pct.host}% Host / ${selectedMatch.digital_sla.escrow_split_pct.guest}% Guest` : '57.9% Host / 42.1% Guest'}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Temperature Range:</span>
                    <span className="text-cyan-300 font-semibold">{selectedMatch.operational_metrics?.temperature_compliance || '+2°C to +8°C'}</span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/20 space-y-2">
                  <div className="font-bold text-emerald-300 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Terms &amp; Multi-Tenant Guarantees</span>
                  </div>
                  <ul className="list-disc pl-4 space-y-1 text-slate-400 text-[11px] leading-relaxed">
                    <li>Cross-contamination isolation SLA enforced by physical partition or sealed reefer palletizing.</li>
                    <li>Automatic telemetry escrow release upon secondary waypoint signature confirmation.</li>
                    <li>Mutual 8% host coordination incentive included in autonomous cost reduction.</li>
                  </ul>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-emerald-900/40">
                  <button
                    onClick={() => setSelectedMatch(null)}
                    className="px-4 py-2 rounded-xl text-slate-400 hover:text-white font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleExecuteAgreement}
                    disabled={isAccepting}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-bold text-xs shadow-emerald-glow"
                  >
                    {isAccepting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                        <span>Ratifying via Smart Contract...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Sign &amp; Lock Co-Loading Deal</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal: Post New Space or Demand */}
      {showPostModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-xl rounded-3xl glass-panel p-6 sm:p-8 border border-emerald-500/40 bg-[#06140e] shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-emerald-900/40">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Post Capacity / Space Request</h3>
                  <p className="text-xs text-slate-400">Publish to RouteMind's Real-time Co-Loading Pool</p>
                </div>
              </div>
              <button
                onClick={() => setShowPostModal(false)}
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {postingSuccess ? (
              <div className="py-8 text-center space-y-3">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto animate-bounce-subtle" />
                <h4 className="text-lg font-bold text-white">Listing Broadcasted to Network!</h4>
                <p className="text-xs text-slate-300">
                  AI match algorithm is now calculating compatible corridors and pairing opportunities...
                </p>
              </div>
            ) : (
              <form onSubmit={handleCreateListing} className="space-y-4 text-xs">
                {postingError && (
                  <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{postingError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-slate-300 font-medium">Company Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Apex Cold Logistics"
                      value={listingForm.company_name}
                      onChange={(e) => setListingForm({ ...listingForm, company_name: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-[#081510] border border-emerald-500/20 text-white focus:outline-none focus:border-emerald-400"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-300 font-medium">Industry Classification</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Organic Produce & Dairy"
                      value={listingForm.industry}
                      onChange={(e) => setListingForm({ ...listingForm, industry: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-[#081510] border border-emerald-500/20 text-white focus:outline-none focus:border-emerald-400"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-medium">Listing Role</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setListingForm({ ...listingForm, listing_type: 'OFFERING_SPACE' })}
                      className={`p-3 rounded-xl border text-center transition font-semibold ${
                        listingForm.listing_type === 'OFFERING_SPACE'
                          ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                          : 'bg-[#081510] border-emerald-900/40 text-slate-400'
                      }`}
                    >
                      Offering Empty Space (Truck Host)
                    </button>
                    <button
                      type="button"
                      onClick={() => setListingForm({ ...listingForm, listing_type: 'SEEKING_SPACE' })}
                      className={`p-3 rounded-xl border text-center transition font-semibold ${
                        listingForm.listing_type === 'SEEKING_SPACE'
                          ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                          : 'bg-[#081510] border-emerald-900/40 text-slate-400'
                      }`}
                    >
                      Seeking Space (Cargo Shipper)
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-slate-300 font-medium">Origin City</label>
                    <input
                      type="text"
                      required
                      value={listingForm.origin_city}
                      onChange={(e) => setListingForm({ ...listingForm, origin_city: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-[#081510] border border-emerald-500/20 text-white focus:outline-none focus:border-emerald-400"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-300 font-medium">Destination City</label>
                    <input
                      type="text"
                      required
                      value={listingForm.destination_city}
                      onChange={(e) => setListingForm({ ...listingForm, destination_city: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-[#081510] border border-emerald-500/20 text-white focus:outline-none focus:border-emerald-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-slate-300 font-medium">Temperature Zone</label>
                    <select
                      value={listingForm.temperature_zone}
                      onChange={(e) => setListingForm({ ...listingForm, temperature_zone: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-[#081510] border border-emerald-500/20 text-white focus:outline-none focus:border-emerald-400"
                    >
                      <option value="REFRIGERATED_2_8C">Refrigerated (+2°C to +8°C)</option>
                      <option value="AMBIENT_DRY">Ambient Dry (No cooling)</option>
                      <option value="FROZEN_NEG_18C">Deep Frozen (-18°C)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-300 font-medium">Vehicle / Container Type</label>
                    <input
                      type="text"
                      value={listingForm.vehicle_type}
                      onChange={(e) => setListingForm({ ...listingForm, vehicle_type: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-[#081510] border border-emerald-500/20 text-white focus:outline-none focus:border-emerald-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-slate-300 font-medium">Total Capacity (kg)</label>
                    <input
                      type="number"
                      required
                      value={listingForm.capacity_total_kg}
                      onChange={(e) => setListingForm({ ...listingForm, capacity_total_kg: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-[#081510] border border-emerald-500/20 text-white focus:outline-none focus:border-emerald-400"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-300 font-medium">Filled / Needed (kg)</label>
                    <input
                      type="number"
                      required
                      value={listingForm.filled_weight_kg}
                      onChange={(e) => setListingForm({ ...listingForm, filled_weight_kg: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-[#081510] border border-emerald-500/20 text-white focus:outline-none focus:border-emerald-400"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-300 font-medium">Solo Baseline (₹)</label>
                    <input
                      type="number"
                      required
                      value={listingForm.base_solo_cost_inr}
                      onChange={(e) => setListingForm({ ...listingForm, base_solo_cost_inr: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-[#081510] border border-emerald-500/20 text-white focus:outline-none focus:border-emerald-400"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-emerald-900/40">
                  <button
                    type="button"
                    onClick={() => setShowPostModal(false)}
                    className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 text-slate-950 font-bold shadow-emerald-glow"
                  >
                    Broadcast to Network
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
