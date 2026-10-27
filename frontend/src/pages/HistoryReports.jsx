import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  FileText,
  Sparkles,
  ArrowLeft,
  Bot,
  User,
  Users,
  Pause,
  Building2,
  Download,
  FileSpreadsheet,
  Code,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  TrendingUp,
  Search,
  Filter,
  RefreshCw,
  ChevronRight,
  Copy,
  Check,
  DollarSign,
  ShieldCheck,
  BarChart3,
  ExternalLink,
  SlidersHorizontal,
} from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { listSimulations, getSimulationState } from '../services/simulationApi';
import './HistoryReports.css';

// Official supported scenarios
const OFFICIAL_SCENARIO_IDS = ['vendor-pricing', 'job-offer', 'project-budget'];


// Helper to determine simulation mode from metadata
function getSimulationModeLabel(sim) {
  if (sim.simulation_mode) return sim.simulation_mode;
  if (sim.mode) return sim.mode;
  const agents = sim.agents || [];
  if (agents.some(a => a.name?.toLowerCase().includes('human') || a.role?.toLowerCase().includes('human') || a.is_human)) {
    return 'Human vs Agent (Practice Mode)';
  }
  return 'Agent vs Agent (Autonomous)';
}

// Helper to parse vendor and buyer details
function getParticipants(sim) {
  const agents = sim.agents || [];
  const vendor = agents.find(a =>
    a.role?.toLowerCase().includes('vendor') ||
    a.role?.toLowerCase().includes('seller') ||
    a.role?.toLowerCase().includes('provider') ||
    a.role?.toLowerCase().includes('recruiter') ||
    a.role?.toLowerCase().includes('supplier')
  ) || agents[1] || {
    name: 'Enterprise Vendor Lead',
    role: 'Vendor',
    personality: 'Analytical',
    current_offer: null,
    stance: 'Active Participant',
  };

  const buyer = agents.find(a =>
    a.role?.toLowerCase().includes('buyer') ||
    a.role?.toLowerCase().includes('client') ||
    a.role?.toLowerCase().includes('candidate') ||
    a.role?.toLowerCase().includes('human') ||
    a.role?.toLowerCase().includes('procurement')
  ) || agents[0] || {
    name: 'Procurement Specialist',
    role: 'Buyer',
    personality: 'Collaborative',
    current_offer: null,
    stance: 'Evaluating terms',
  };

  return { vendor, buyer };
}

// Formatting currency
function formatCurrency(val, currency = '₹') {
  if (val === null || val === undefined || isNaN(Number(val))) return '—';
  return `${currency}${Number(val).toLocaleString('en-IN')}`;
}

// Helper to determine if a simulation was left in between or ended early
function isLeftInBetween(sim) {
  if (!sim) return false;

  // 1. If agreement was reached or completed with agreement data, it is NOT left in between
  const hasAgreedData = Boolean(
    sim.agreement && (sim.agreement.final_value !== undefined && sim.agreement.final_value !== null || sim.agreement.agreed_value !== undefined && sim.agreement.agreed_value !== null)
  );
  const isAgreement = sim.status === 'AGREEMENT_REACHED' || sim.status === 'COMPLETED' || hasAgreedData;
  if (isAgreement) {
    return false;
  }

  // 2. Deadlocks are NOT left in between
  if (sim.status === 'DEADLOCK') {
    return false;
  }

  // 3. Explicitly left in between or paused
  if (sim.status === 'LEFT_IN_BETWEEN' || sim.status === 'PAUSED') {
    return true;
  }

  // 4. Any other non-completed session ended early
  return true;
}

export default function HistoryReports() {
  const navigate = useNavigate();
  const { simulationId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { t } = useSettings();

  const [simulations, setSimulations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Active selected simulation for the detailed report view
  const [selectedSim, setSelectedSim] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState('ALL');
  const [filterOutcome, setFilterOutcome] = useState('ALL');
  const [sortBy, setSortBy] = useState('NEWEST');
  const [copiedId, setCopiedId] = useState(false);

  const reportPrintRef = useRef(null);

  // Load Simulations List: strictly Vendor, Job, and Project scenarios only
  const fetchSimulations = async () => {
    setLoading(true);
    setError(null);
    try {
      const liveList = await listSimulations();
      if (liveList && liveList.length > 0) {
        // Filter strictly to the 3 official scenarios: vendor-pricing, job-offer, project-budget
        const officialSims = liveList.filter(s => {
          const sid = (s.scenario_id || '').toLowerCase();
          const title = (s.scenario_title || '').toLowerCase();

          // Reject any legacy SaaS or Lease mock titles
          if (title.includes('saas') || title.includes('lease') || title.includes('office space')) {
            return false;
          }

          const isVendor = sid === 'vendor-pricing' || title.includes('vendor');
          const isJob = sid === 'job-offer' || title.includes('job');
          const isProject = sid === 'project-budget' || title.includes('project');

          return isVendor || isJob || isProject;
        }).map(s => {
          // Standardize clean title if needed
          const sid = (s.scenario_id || '').toLowerCase();
          const title = (s.scenario_title || '').toLowerCase();
          let cleanTitle = s.scenario_title;
          if (sid === 'vendor-pricing' || title.includes('vendor')) {
            cleanTitle = 'Vendor Pricing Negotiation';
          } else if (sid === 'job-offer' || title.includes('job')) {
            cleanTitle = 'Job Offer Negotiation';
          } else if (sid === 'project-budget' || title.includes('project')) {
            cleanTitle = 'Project Budget Allocation';
          }
          return { ...s, scenario_title: cleanTitle };
        });

        setSimulations(officialSims);
      } else {
        setSimulations([]);
      }
    } catch (err) {
      console.warn('Failed to fetch simulations:', err);
      setSimulations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSimulations();
  }, []);

  // Sync simulationId from URL params or search params
  const targetId = simulationId || searchParams.get('id');

  useEffect(() => {
    if (!targetId) {
      setSelectedSim(null);
      return;
    }

    const loadSingleSim = async () => {
      setLoadingDetail(true);
      // Check in existing list first
      const foundInState = simulations.find(s => s.id === targetId);
      if (foundInState && foundInState.messages && foundInState.messages.length > 0) {
        setSelectedSim(foundInState);
        setLoadingDetail(false);
        return;
      }

      // Otherwise fetch from backend API
      try {
        const fullSim = await getSimulationState(targetId);
        if (fullSim) {
          setSelectedSim(fullSim);
        } else if (foundInState) {
          setSelectedSim(foundInState);
        }
      } catch (err) {
        console.warn('Failed to load full simulation details:', err);
      } finally {
        setLoadingDetail(false);
      }
    };

    loadSingleSim();
  }, [targetId, simulations]);

  // Handle selecting a simulation to view full report
  const handleSelectSimulation = (sim) => {
    setSearchParams({ id: sim.id });
    setSelectedSim(sim);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Back to history list
  const handleBackToList = () => {
    setSearchParams({});
    setSelectedSim(null);
  };

  // Copy ID
  const handleCopyId = (id) => {
    navigator.clipboard.writeText(id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  // Export as PDF / Print
  const handleExportPDF = () => {
    window.print();
  };

  // Filter & Sort Logic: strictly Completed, Paused, Left in Between, or Deadlock (NO Running)
  const filteredSimulations = useMemo(() => {
    return simulations.filter(sim => {
      // Exclude all RUNNING or CREATED simulations
      const isAllowedStatus = sim.status === 'COMPLETED' ||
        sim.status === 'AGREEMENT_REACHED' ||
        sim.status === 'PAUSED' ||
        sim.status === 'LEFT_IN_BETWEEN' ||
        sim.status === 'DEADLOCK';
      if (!isAllowedStatus) return false;

      const mode = getSimulationModeLabel(sim);
      const { vendor, buyer } = getParticipants(sim);
      const isEarlyLeft = isLeftInBetween(sim);

      // Mode filter
      if (filterMode === 'AUTONOMOUS' && !mode.includes('Autonomous')) return false;
      if (filterMode === 'PRACTICE' && !mode.includes('Practice')) return false;

      // Outcome filter: Agreement Reached, Deadlock, or Leave in Between
      if (filterOutcome === 'AGREEMENT') {
        if (isEarlyLeft || (sim.status !== 'AGREEMENT_REACHED' && sim.status !== 'COMPLETED')) return false;
      }
      if (filterOutcome === 'DEADLOCK' && sim.status !== 'DEADLOCK') return false;
      if (filterOutcome === 'LEFT_IN_BETWEEN' && !isEarlyLeft) return false;

      // Enhanced search query: multi-field, multi-token matching across all fields
      if (searchQuery.trim()) {
        const queryTokens = searchQuery.trim().toLowerCase().split(/\s+/);
        const statusText = isEarlyLeft ? 'leave in between left paused' : (sim.status || '').toLowerCase();
        const modeText = mode.toLowerCase();
        const scenarioTitle = (sim.scenario_title || '').toLowerCase();
        const scenarioId = (sim.scenario_id || '').toLowerCase();
        const simId = (sim.id || '').toLowerCase();
        const allAgents = (sim.agents || []).map(a => `${a.name || ''} ${a.role || ''} ${a.personality || ''} ${a.goal || ''}`).join(' ').toLowerCase();
        const vendorText = `${vendor.name || ''} ${vendor.role || ''} ${vendor.personality || ''}`.toLowerCase();
        const buyerText = `${buyer.name || ''} ${buyer.role || ''} ${buyer.personality || ''}`.toLowerCase();

        const corpus = `${scenarioTitle} ${scenarioId} ${simId} ${statusText} ${modeText} ${allAgents} ${vendorText} ${buyerText}`;

        const matches = queryTokens.every(token => corpus.includes(token));
        if (!matches) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'NEWEST') return new Date(b.created_at || 0) - new Date(a.created_at || 0);
      if (sortBy === 'OLDEST') return new Date(a.created_at || 0) - new Date(b.created_at || 0);
      if (sortBy === 'ROUNDS') return (b.current_round || 0) - (a.current_round || 0);
      return 0;
    });
  }, [simulations, searchQuery, filterMode, filterOutcome, sortBy]);

  // Aggregate statistics across completed and left-in-between simulations
  const stats = useMemo(() => {
    const validSims = simulations.filter(s =>
      s.status === 'COMPLETED' ||
      s.status === 'AGREEMENT_REACHED' ||
      s.status === 'PAUSED' ||
      s.status === 'LEFT_IN_BETWEEN' ||
      s.status === 'DEADLOCK'
    );
    const total = validSims.length;
    const agreements = validSims.filter(s => (s.status === 'AGREEMENT_REACHED' || s.status === 'COMPLETED') && !isLeftInBetween(s)).length;
    const deadlocks = validSims.filter(s => s.status === 'DEADLOCK').length;
    const leftInBetween = validSims.filter(s => isLeftInBetween(s)).length;
    const agreementRate = total > 0 ? Math.round((agreements / total) * 100) : 0;
    const avgRounds = total > 0
      ? (validSims.reduce((acc, curr) => acc + (curr.current_round || 1), 0) / total).toFixed(1)
      : '0.0';

    return { total, agreements, deadlocks, leftInBetween, agreementRate, avgRounds };
  }, [simulations]);

  // Offer points for chart rendering
  const chartOffers = useMemo(() => {
    if (!selectedSim) return [];
    const messages = selectedSim.messages || [];
    const points = [];

    messages.forEach(m => {
      if (m.offer_value !== null && m.offer_value !== undefined && m.offer_value > 0) {
        const isVendor = m.sender_role?.toLowerCase().includes('vendor') ||
          m.sender_role?.toLowerCase().includes('seller') ||
          m.sender_role?.toLowerCase().includes('provider') ||
          m.sender_role?.toLowerCase().includes('recruiter') ||
          m.sender_role?.toLowerCase().includes('landlord');

        points.push({
          round: m.round_number || 1,
          senderName: m.sender_name,
          role: isVendor ? 'Vendor' : 'Buyer',
          offer: Number(m.offer_value),
          action: m.action,
        });
      }
    });

    return points;
  }, [selectedSim]);

  // Render Mode Badge Component
  const renderModeBadge = (modeStr) => {
    if (modeStr.includes('Practice')) {
      return (
        <span className="mode-badge mode-badge-practice">
          <User size={12} />
          <span>Human vs Agent (Practice)</span>
        </span>
      );
    }
    return (
      <span className="mode-badge mode-badge-autonomous">
        <Bot size={12} />
        <span>Agent vs Agent (Autonomous)</span>
      </span>
    );
  };

  // Render Status Badge Component
  const renderStatusBadge = (simOrStatus) => {
    const isEarly = typeof simOrStatus === 'object' && simOrStatus ? isLeftInBetween(simOrStatus) : (simOrStatus === 'LEFT_IN_BETWEEN' || simOrStatus === 'PAUSED');

    if (isEarly) {
      return (
        <span className="status-badge status-warning">
          <Pause size={13} />
          <span>Leave in Between</span>
        </span>
      );
    }
    const status = typeof simOrStatus === 'string' ? simOrStatus : simOrStatus?.status;
    if (status === 'DEADLOCK') {
      return (
        <span className="status-badge status-danger">
          <XCircle size={13} />
          <span>Deadlock</span>
        </span>
      );
    }
    if (status === 'AGREEMENT_REACHED' || status === 'COMPLETED') {
      return (
        <span className="status-badge status-success">
          <CheckCircle2 size={13} />
          <span>Agreement Reached</span>
        </span>
      );
    }
    return (
      <span className="status-badge status-warning">
        <Pause size={13} />
        <span>Leave in Between</span>
      </span>
    );
  };

  return (
    <div className="history-page-container">
      {/* Loading state when fetching specific simulation details */}
      {loadingDetail && !selectedSim ? (
        <div className="report-loading-container" style={{ textAlign: 'center', padding: '90px 20px', background: 'var(--bg-card, #ffffff)', borderRadius: '16px', border: '1px solid var(--border-color, #e2e8f0)', boxShadow: '0 4px 16px rgba(0,0,0,0.03)' }}>
          <RefreshCw size={32} className="spin" style={{ color: 'var(--accent-primary, #6366f1)', marginBottom: '16px' }} />
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main, #0f172a)', margin: '0 0 8px 0' }}>Loading Simulation Audit Report...</h2>
          <p style={{ color: 'var(--text-muted, #64748b)', margin: 0 }}>Fetching telemetry, counterparty profiles, and complete transcript.</p>
        </div>
      ) : targetId && !loadingDetail && !selectedSim ? (
        <div className="report-notfound-container" style={{ textAlign: 'center', padding: '60px 20px', background: 'var(--bg-card, #ffffff)', borderRadius: '16px', border: '1px solid var(--border-color, #e2e8f0)' }}>
          <AlertTriangle size={36} style={{ color: '#d97706', marginBottom: '12px' }} />
          <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-main, #0f172a)', margin: '0 0 8px 0' }}>Simulation Report Not Found</h2>
          <p style={{ color: 'var(--text-muted, #64748b)', margin: '0 0 20px 0' }}>The requested simulation ID could not be loaded or was cleared.</p>
          <button type="button" className="btn-back-to-list" onClick={handleBackToList}>
            <ArrowLeft size={16} />
            <span>Back to Negotiation History</span>
          </button>
        </div>
      ) : selectedSim ? (
        <div className="report-detail-wrapper" ref={reportPrintRef}>
          {/* Top Navigation & Action Bar */}
          <div className="report-top-bar no-print">
            {searchParams.get('from') === 'arena' ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  type="button"
                  className="btn-back-to-list"
                  onClick={() => navigate('/arena')}
                  title="Return to the active Negotiation Arena"
                >
                  <ArrowLeft size={16} />
                  <span>Back to Negotiation Arena</span>
                </button>
                <button
                  type="button"
                  className="btn-back-to-list"
                  onClick={handleBackToList}
                  style={{ opacity: 0.75 }}
                  title="View all past negotiation records"
                >
                  <span>All History</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="btn-back-to-list"
                onClick={handleBackToList}
              >
                <ArrowLeft size={16} />
                <span>Back to History</span>
              </button>
            )}

            {/* Download Options */}
            {/* Download Option: PDF Report only */}
            <div className="report-actions-group">
              <button
                type="button"
                className="btn-report-action btn-pdf"
                onClick={handleExportPDF}
                title="Download formatted executive PDF report"
              >
                <Download size={15} />
                <span>Download PDF</span>
              </button>
            </div>
          </div>

          {/* Report Header Card */}
          <div className="report-header-card">
            <div className="report-header-main">
              <div className="report-meta-tags">
                {renderModeBadge(getSimulationModeLabel(selectedSim))}
                {renderStatusBadge(selectedSim)}
                <span className="round-pill">
                  <Clock size={13} />
                  Round {selectedSim.current_round || 1} of {selectedSim.max_rounds || 10}
                </span>
              </div>

              <h1 className="report-scenario-title">
                {selectedSim.scenario_title || 'Autonomous Negotiation Simulation'}
              </h1>

              <div className="report-id-bar">
                <span className="report-id-label">Simulation ID:</span>
                <code className="report-id-code">{selectedSim.id}</code>
                <button
                  type="button"
                  className="btn-copy-id"
                  onClick={() => handleCopyId(selectedSim.id)}
                  title="Copy Simulation ID"
                >
                  {copiedId ? <Check size={13} className="text-success" /> : <Copy size={13} />}
                </button>
                <span className="report-timestamp">
                  Recorded on {new Date(selectedSim.created_at || Date.now()).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Executive KPI Cards */}
          <div className="report-kpi-grid">
            <div className="report-kpi-card">
              <div className="kpi-icon-wrap kpi-icon-value">
                <DollarSign size={20} />
              </div>
              <div className="kpi-info">
                <span className="kpi-title">Settlement Value</span>
                <span className="kpi-value">
                  {selectedSim.agreement
                    ? formatCurrency(selectedSim.agreement.final_value, selectedSim.currency)
                    : selectedSim.status === 'DEADLOCK'
                    ? 'No Deal (Deadlock)'
                    : formatCurrency(selectedSim.agents?.[0]?.current_offer || selectedSim.current_gap, selectedSim.currency)}
                </span>
                <span className="kpi-subtext">
                  {selectedSim.agreement ? 'Contract Agreement Finalized' : 'Final offer evaluated'}
                </span>
              </div>
            </div>

            <div className="report-kpi-card">
              <div className="kpi-icon-wrap kpi-icon-convergence">
                <TrendingUp size={20} />
              </div>
              <div className="kpi-info">
                <span className="kpi-title">Agreement Likelihood</span>
                <span className="kpi-value">{selectedSim.agreement_likelihood || 50}%</span>
                <span className="kpi-subtext">
                  {selectedSim.agreement_likelihood > 80 ? 'High Synergy' : 'Moderate Friction'}
                </span>
              </div>
            </div>

            <div className="report-kpi-card">
              <div className="kpi-icon-wrap kpi-icon-rounds">
                <Clock size={20} />
              </div>
              <div className="kpi-info">
                <span className="kpi-title">Rounds to Converge</span>
                <span className="kpi-value">{selectedSim.current_round || 1}</span>
                <span className="kpi-subtext">
                  {selectedSim.messages?.length || 0} Total Strategy Turns
                </span>
              </div>
            </div>

            <div className="report-kpi-card">
              <div className="kpi-icon-wrap kpi-icon-vendor">
                <Building2 size={20} />
              </div>
              <div className="kpi-info">
                <span className="kpi-title">Vendor Stance</span>
                <span className="kpi-value">
                  {getParticipants(selectedSim).vendor.personality || 'Analytical'}
                </span>
                <span className="kpi-subtext text-truncate">
                  {getParticipants(selectedSim).vendor.stance || 'Final round position'}
                </span>
              </div>
            </div>
          </div>

          {/* Participants Breakdown: Vendor & Buyer Cards */}
          <div className="report-participants-section">
            <h2 className="section-heading">
              <Users size={18} />
              <span>Counterparty Profiles & Concession Stances</span>
            </h2>

            <div className="participants-grid">
              {/* Vendor Profile Card */}
              <div className="participant-card participant-vendor">
                <div className="participant-header">
                  <div className="participant-badge-pill badge-vendor">
                    <Building2 size={13} />
                    <span>Vendor / Counterparty</span>
                  </div>
                  <span className="personality-pill">
                    {getParticipants(selectedSim).vendor.personality || 'Collaborative'}
                  </span>
                </div>

                <div className="participant-body">
                  <h3 className="participant-name">
                    {getParticipants(selectedSim).vendor.name}
                  </h3>
                  <p className="participant-role">
                    Role: {getParticipants(selectedSim).vendor.role}
                  </p>

                  <div className="participant-metrics-row">
                    <div className="p-metric">
                      <span className="p-metric-label">Opening / Target Ask</span>
                      <span className="p-metric-val">
                        {formatCurrency(getParticipants(selectedSim).vendor.target_value, selectedSim.currency)}
                      </span>
                    </div>
                    <div className="p-metric">
                      <span className="p-metric-label">Reservation Price</span>
                      <span className="p-metric-val">
                        {formatCurrency(getParticipants(selectedSim).vendor.reservation_value, selectedSim.currency)}
                      </span>
                    </div>
                    <div className="p-metric">
                      <span className="p-metric-label">Closing Offer</span>
                      <span className="p-metric-val text-vendor">
                        {formatCurrency(getParticipants(selectedSim).vendor.current_offer, selectedSim.currency)}
                      </span>
                    </div>
                  </div>

                  {getParticipants(selectedSim).vendor.goal && (
                    <div className="participant-goal-box">
                      <strong>Goal:</strong> {getParticipants(selectedSim).vendor.goal}
                    </div>
                  )}

                  {getParticipants(selectedSim).vendor.stance && (
                    <div className="participant-stance-box">
                      <strong>Current Stance:</strong> {getParticipants(selectedSim).vendor.stance}
                    </div>
                  )}
                </div>
              </div>

              {/* Buyer Profile Card */}
              <div className="participant-card participant-buyer">
                <div className="participant-header">
                  <div className="participant-badge-pill badge-buyer">
                    <User size={13} />
                    <span>Buyer / Client</span>
                  </div>
                  <span className="personality-pill">
                    {getParticipants(selectedSim).buyer.personality || 'Collaborative'}
                  </span>
                </div>

                <div className="participant-body">
                  <h3 className="participant-name">
                    {getParticipants(selectedSim).buyer.name}
                  </h3>
                  <p className="participant-role">
                    Role: {getParticipants(selectedSim).buyer.role}
                  </p>

                  <div className="participant-metrics-row">
                    <div className="p-metric">
                      <span className="p-metric-label">Opening Target Bid</span>
                      <span className="p-metric-val">
                        {formatCurrency(getParticipants(selectedSim).buyer.target_value, selectedSim.currency)}
                      </span>
                    </div>
                    <div className="p-metric">
                      <span className="p-metric-label">Reservation Budget</span>
                      <span className="p-metric-val">
                        {formatCurrency(getParticipants(selectedSim).buyer.reservation_value, selectedSim.currency)}
                      </span>
                    </div>
                    <div className="p-metric">
                      <span className="p-metric-label">Closing Bid</span>
                      <span className="p-metric-val text-buyer">
                        {formatCurrency(getParticipants(selectedSim).buyer.current_offer, selectedSim.currency)}
                      </span>
                    </div>
                  </div>

                  {getParticipants(selectedSim).buyer.goal && (
                    <div className="participant-goal-box">
                      <strong>Goal:</strong> {getParticipants(selectedSim).buyer.goal}
                    </div>
                  )}

                  {getParticipants(selectedSim).buyer.stance && (
                    <div className="participant-stance-box">
                      <strong>Current Stance:</strong> {getParticipants(selectedSim).buyer.stance}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Price Convergence Timeline / Concession Chart */}
          {chartOffers.length > 1 && (
            <div className="report-chart-section">
              <h2 className="section-heading">
                <BarChart3 size={18} />
                <span>Price Convergence & Concession Progression</span>
              </h2>

              <div className="concession-chart-container">
                <div className="chart-legend">
                  <span className="legend-item">
                    <span className="legend-dot dot-vendor" /> Vendor Asks
                  </span>
                  <span className="legend-item">
                    <span className="legend-dot dot-buyer" /> Buyer Bids
                  </span>
                  {selectedSim.agreement && (
                    <span className="legend-item">
                      <span className="legend-dot dot-deal" /> Final Agreement
                    </span>
                  )}
                </div>

                {/* SVG Visual Step Progression Chart */}
                <div className="chart-svg-wrapper">
                  <svg viewBox="0 0 700 220" className="concession-svg" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="vendorGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.0" />
                      </linearGradient>
                      <linearGradient id="buyerGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    {/* Grid lines */}
                    <line x1="50" y1="30" x2="670" y2="30" stroke="rgba(255,255,255,0.08)" strokeDasharray="4" />
                    <line x1="50" y1="90" x2="670" y2="90" stroke="rgba(255,255,255,0.08)" strokeDasharray="4" />
                    <line x1="50" y1="150" x2="670" y2="150" stroke="rgba(255,255,255,0.08)" strokeDasharray="4" />
                    <line x1="50" y1="190" x2="670" y2="190" stroke="rgba(255,255,255,0.15)" />

                    {/* Dynamic Step points calculated */}
                    {(() => {
                      const maxVal = Math.max(...chartOffers.map(o => o.offer)) * 1.05;
                      const minVal = Math.min(...chartOffers.map(o => o.offer)) * 0.95;
                      const range = maxVal - minVal || 1;
                      const stepX = 600 / Math.max(chartOffers.length - 1, 1);

                      const pointsCoords = chartOffers.map((o, idx) => {
                        const x = 60 + idx * stepX;
                        const y = 180 - ((o.offer - minVal) / range) * 140;
                        return { ...o, x, y };
                      });

                      const vendorPoints = pointsCoords.filter(p => p.role === 'Vendor');
                      const buyerPoints = pointsCoords.filter(p => p.role === 'Buyer');

                      return (
                        <>
                          {/* Vendor Curve */}
                          {vendorPoints.length > 1 && (
                            <path
                              d={vendorPoints.reduce((acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`, '')}
                              fill="none"
                              stroke="#8b5cf6"
                              strokeWidth="3"
                              strokeLinecap="round"
                            />
                          )}

                          {/* Buyer Curve */}
                          {buyerPoints.length > 1 && (
                            <path
                              d={buyerPoints.reduce((acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`, '')}
                              fill="none"
                              stroke="#10b981"
                              strokeWidth="3"
                              strokeLinecap="round"
                            />
                          )}

                          {/* Dots */}
                          {pointsCoords.map((pt, i) => (
                            <g key={i}>
                              <circle
                                cx={pt.x}
                                cy={pt.y}
                                r="5"
                                fill={pt.role === 'Vendor' ? '#8b5cf6' : '#10b981'}
                                stroke="#ffffff"
                                strokeWidth="2"
                              />
                              <text
                                x={pt.x}
                                y={pt.role === 'Vendor' ? pt.y - 10 : pt.y + 18}
                                fill="#ffffff"
                                fontSize="10"
                                fontWeight="600"
                                textAnchor="middle"
                              >
                                {formatCurrency(pt.offer, selectedSim.currency)}
                              </text>
                              <text
                                x={pt.x}
                                y="208"
                                fill="rgba(255,255,255,0.5)"
                                fontSize="10"
                                textAnchor="middle"
                              >
                                R{pt.round}
                              </text>
                            </g>
                          ))}
                        </>
                      );
                    })()}
                  </svg>
                </div>
              </div>
            </div>
          )}

          {/* Turn-by-Turn Negotiation Transcript */}
          <div className="report-transcript-section">
            <h2 className="section-heading">
              <FileText size={18} />
              <span>Turn-by-Turn Negotiation Transcript</span>
            </h2>

            <div className="transcript-timeline">
              {(!selectedSim.messages || selectedSim.messages.length === 0) ? (
                <div className="empty-transcript-card">
                  <p>No messages recorded for this session yet.</p>
                </div>
              ) : (
                selectedSim.messages.map((msg, idx) => {
                  const isVendor = msg.sender_role?.toLowerCase().includes('vendor') ||
                    msg.sender_role?.toLowerCase().includes('seller') ||
                    msg.sender_role?.toLowerCase().includes('provider') ||
                    msg.sender_role?.toLowerCase().includes('recruiter');
                  const isOrchestrator = msg.sender_type === 'ORCHESTRATOR' || msg.sender_role?.toLowerCase().includes('orchestrator');

                  return (
                    <div
                      key={idx}
                      className={`transcript-message-item ${
                        isOrchestrator ? 'msg-orchestrator' : isVendor ? 'msg-vendor' : 'msg-buyer'
                      }`}
                    >
                      <div className="msg-sender-col">
                        <div className="msg-avatar-chip">
                          {isOrchestrator ? <Sparkles size={14} /> : isVendor ? <Building2 size={14} /> : <User size={14} />}
                        </div>
                        <span className="msg-round-tag">Round {msg.round_number || 1}</span>
                      </div>

                      <div className="msg-content-card">
                        <div className="msg-card-top">
                          <span className="msg-speaker-name">{msg.sender_name}</span>
                          <span className="msg-role-tag">
                            {msg.sender_role} {msg.personality ? `• ${msg.personality}` : ''}
                          </span>

                          {msg.action && (
                            <span className={`msg-action-pill action-${msg.action.toLowerCase()}`}>
                              {msg.action}
                            </span>
                          )}

                          {msg.offer_value !== null && msg.offer_value !== undefined && msg.offer_value > 0 && (
                            <span className="msg-offer-pill">
                              {formatCurrency(msg.offer_value, selectedSim.currency || msg.currency)}
                            </span>
                          )}
                        </div>

                        <p className="msg-dialogue-text">{msg.message}</p>

                        <div className="msg-card-foot">
                          <span className="msg-time">
                            {msg.created_at ? new Date(msg.created_at).toLocaleTimeString() : `Turn #${idx + 1}`}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      ) : (
        /* ============================================================== */
        /* VIEW B: SIMULATION HISTORY LIST VIEW                           */
        /* ============================================================== */
        <div className="history-list-wrapper">
          {/* Header & Stats Banner */}
          <div className="history-header">
            <div className="history-header-titles">
              <span className="history-kicker">
                <ShieldCheck size={14} />
                Audit Logs & Telemetry
              </span>
              <h1 className="history-main-title">Negotiation History & Reports</h1>
              <p className="history-subtitle">
                Inspect archived sessions, counterparty concession curves, vendor performance metrics, and complete turn-by-turn transcripts.
              </p>
            </div>

            <button
              type="button"
              className="btn-refresh-history"
              onClick={fetchSimulations}
              disabled={loading}
              title="Refresh simulation records from database"
            >
              <RefreshCw size={15} className={loading ? 'spin' : ''} />
              <span>{loading ? 'Refreshing...' : 'Refresh'}</span>
            </button>
          </div>

          {/* Quick Metrics Bar */}
          <div className="history-metrics-strip">
            <div className="metric-strip-item">
              <span className="metric-strip-num">{stats.total}</span>
              <span className="metric-strip-label">All Completed</span>
            </div>
            <div className="metric-strip-item">
              <span className="metric-strip-num text-success">{stats.agreements}</span>
              <span className="metric-strip-label">Agreements Reached</span>
            </div>
            <div className="metric-strip-item">
              <span className="metric-strip-num text-warning">{stats.leftInBetween}</span>
              <span className="metric-strip-label">Leave in Between</span>
            </div>
            <div className="metric-strip-item">
              <span className="metric-strip-num text-danger">{stats.deadlocks}</span>
              <span className="metric-strip-label">Deadlocks</span>
            </div>
          </div>

          {/* Filter, Search & Sort Control Bar */}
          <div className="history-controls-bar">
            {/* Search Input */}
            <div className="search-box">
              <Search size={16} className="search-icon" />
              <input
                type="text"
                placeholder="Search scenario, vendor, buyer, or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
              {searchQuery && (
                <button
                  type="button"
                  className="search-clear-btn"
                  onClick={() => setSearchQuery('')}
                >
                  ×
                </button>
              )}
            </div>

            {/* Filter by Mode (Multi-Vendor removed, only Autonomous and Practice) */}
            <div className="filter-select-group">
              <label htmlFor="filter-mode" className="filter-label">Mode:</label>
              <select
                id="filter-mode"
                value={filterMode}
                onChange={(e) => setFilterMode(e.target.value)}
                className="filter-select"
              >
                <option value="ALL">All Modes</option>
                <option value="AUTONOMOUS">Agent vs Agent (Autonomous)</option>
                <option value="PRACTICE">Human vs Agent (Practice)</option>
              </select>
            </div>

            {/* Filter by Outcome: All Completed, Agreement Reached, Deadlock, Leave in Between */}
            <div className="filter-select-group">
              <label htmlFor="filter-outcome" className="filter-label">Outcome:</label>
              <select
                id="filter-outcome"
                value={filterOutcome}
                onChange={(e) => setFilterOutcome(e.target.value)}
                className="filter-select"
              >
                <option value="ALL">All Completed</option>
                <option value="AGREEMENT">Agreement Reached</option>
                <option value="DEADLOCK">Deadlock</option>
                <option value="LEFT_IN_BETWEEN">Leave in Between</option>
              </select>
            </div>

            {/* Sort Dropdown */}
            <div className="filter-select-group">
              <label htmlFor="filter-sort" className="filter-label">Sort:</label>
              <select
                id="filter-sort"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="filter-select"
              >
                <option value="NEWEST">Newest First</option>
                <option value="OLDEST">Oldest First</option>
                <option value="ROUNDS">Most Rounds</option>
              </select>
            </div>
          </div>

          {/* List of Simulation Cards */}
          <div className="history-cards-grid">
            {loading && simulations.length === 0 ? (
              <div className="history-loading-box">
                <RefreshCw size={24} className="spin" />
                <p>Loading negotiation history...</p>
              </div>
            ) : filteredSimulations.length === 0 ? (
              <div className="history-empty-box">
                <FileText size={36} />
                <h3>No Matching Negotiations Found</h3>
                <p>Try modifying your search term or clearing the active filters.</p>
                <button
                  type="button"
                  className="btn-clear-filters"
                  onClick={() => {
                    setSearchQuery('');
                    setFilterMode('ALL');
                    setFilterOutcome('ALL');
                  }}
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              filteredSimulations.map((sim) => {
                const modeLabel = getSimulationModeLabel(sim);
                const { vendor, buyer } = getParticipants(sim);
                const isEarly = isLeftInBetween(sim);
                const hasAgreement = (sim.status === 'AGREEMENT_REACHED' || (sim.agreement && sim.agreement.agreed_value)) && !isEarly;

                return (
                  <div key={sim.id} className="history-card">
                    {/* Card Header: Mode & Status */}
                    <div className="history-card-top">
                      <div className="history-card-mode">
                        {renderModeBadge(modeLabel)}
                      </div>
                      <div className="history-card-status">
                        {renderStatusBadge(sim)}
                      </div>
                    </div>

                    {/* Scenario Title */}
                    <h3 className="history-card-title">{sim.scenario_title}</h3>

                    {/* Vendor & Counterparty Info Box */}
                    <div className="history-card-participants">
                      {/* Vendor Line */}
                      <div className="participant-line">
                        <span className="p-tag-badge vendor-tag">
                          <Building2 size={11} /> Vendor
                        </span>
                        <span className="p-title-name text-truncate" title={vendor.name}>
                          {vendor.name}
                        </span>
                        <span className="p-trait-pill">
                          {vendor.personality || 'Analytical'}
                        </span>
                      </div>

                      {/* Buyer Line */}
                      <div className="participant-line">
                        <span className="p-tag-badge buyer-tag">
                          <User size={11} /> Buyer
                        </span>
                        <span className="p-title-name text-truncate" title={buyer.name}>
                          {buyer.name}
                        </span>
                        <span className="p-trait-pill">
                          {buyer.personality || 'Collaborative'}
                        </span>
                      </div>
                    </div>

                    {/* Financial & Rounds Summary Bar */}
                    <div className="history-card-financials">
                      <div className="f-metric-block">
                        <span className="f-label">Final Deal / Spread</span>
                        <span className="f-val">
                          {hasAgreement
                            ? formatCurrency(sim.agreement?.final_value || vendor.current_offer, sim.currency)
                            : isEarly
                            ? 'Left in Between'
                            : sim.status === 'DEADLOCK'
                            ? 'Spread Unresolved'
                            : `Gap: ${formatCurrency(sim.current_gap, sim.currency)}`}
                        </span>
                      </div>

                      <div className="f-metric-block">
                        <span className="f-label">Convergence</span>
                        <span className="f-val text-muted">
                          Round {sim.current_round || 1} / {sim.max_rounds || 10}
                        </span>
                      </div>

                      <div className="f-metric-block">
                        <span className="f-label">Synergy</span>
                        <span className="f-val text-likelihood">
                          {sim.agreement_likelihood || 50}%
                        </span>
                      </div>
                    </div>

                    {/* Footer with Timestamp and Action */}
                    <div className="history-card-footer">
                      <span className="history-card-date">
                        <Clock size={12} />
                        {new Date(sim.created_at || Date.now()).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>

                      <button
                        type="button"
                        className="btn-view-report"
                        onClick={() => handleSelectSimulation(sim)}
                      >
                        <span>View Full Report</span>
                        <ChevronRight size={15} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
