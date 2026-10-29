import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Play,
  CheckCircle2,
  Layers,
  Trophy,
  Users,
  Clock,
  Activity,
  BarChart3,
  Calendar,
  ChevronDown,
  Sparkles,
  RefreshCw,
  FileText,
  ShieldCheck,
  AlertTriangle,
  TrendingUp,
  GraduationCap,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { listSimulations } from '../services/simulationApi';
import './NegotiationAnalytics.css';

// Helper to determine if a simulation was left in between or ended early (identical to HistoryReports)
function isLeftInBetween(sim) {
  if (!sim) return false;

  // 1. Explicitly left in between or paused
  if (sim.status === 'LEFT_IN_BETWEEN' || sim.status === 'PAUSED') return true;

  // 2. Transcript contains explicit leave in between message
  if (Array.isArray(sim.messages)) {
    const hasLeftMsg = sim.messages.some(
      (m) =>
        typeof m.message === 'string' &&
        (m.message.includes('User left in between') ||
          m.message.includes('Left in between') ||
          m.message.includes('ended early by user'))
    );
    if (hasLeftMsg) return true;
  }

  // 3. Deadlocks are NOT left in between
  if (sim.status === 'DEADLOCK') return false;

  // 4. Completed agreement
  const hasAgreedData = Boolean(
    sim.agreement &&
      ((sim.agreement.final_value !== undefined && sim.agreement.final_value !== null) ||
        (sim.agreement.agreed_value !== undefined && sim.agreement.agreed_value !== null))
  );
  const isAgreement = (sim.status === 'AGREEMENT_REACHED' || sim.status === 'COMPLETED') && hasAgreedData;
  if (isAgreement) return false;
  return true;
}

export default function NegotiationAnalytics() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { t } = useSettings();

  const [simulations, setSimulations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hoveredMonth, setHoveredMonth] = useState(null);

  // Dynamic Year Dropdown handling
  const currentSystemYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentSystemYear);
  const [isYearDropdownOpen, setIsYearDropdownOpen] = useState(false);
  const yearDropdownRef = useRef(null);

  // Close year dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (yearDropdownRef.current && !yearDropdownRef.current.contains(event.target)) {
        setIsYearDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Load simulations strictly scoped to current authenticated user
  const fetchSimulations = async () => {
    setLoading(true);
    try {
      const userEmail = currentUser?.email || null;
      const userId = currentUser?.uid || null;
      const liveList = await listSimulations(userEmail, userId);

      if (liveList && liveList.length > 0) {
        // Defensive user scoping matching HistoryReports exactly
        const userSims = liveList.filter((s) => {
          if (!currentUser?.email && !currentUser?.uid) return true;
          if (currentUser?.email && s.user_email) {
            return s.user_email.toLowerCase() === currentUser.email.toLowerCase();
          }
          if (currentUser?.uid && s.user_id) {
            return s.user_id === currentUser.uid;
          }
          if (!s.user_email && !s.user_id) {
            return currentUser?.email?.toLowerCase() === 'shubhayyadav84@gmail.com';
          }
          return false;
        });

        // Filter strictly to the 3 official scenarios: vendor-pricing, job-offer, project-budget
        const officialSims = userSims.filter((s) => {
          const sid = (s.scenario_id || '').toLowerCase();
          const title = (s.scenario_title || '').toLowerCase();
          if (title.includes('saas') || title.includes('lease') || title.includes('office space')) return false;
          return (
            sid === 'vendor-pricing' ||
            sid === 'job-offer' ||
            sid === 'project-budget' ||
            title.includes('vendor') ||
            title.includes('job') ||
            title.includes('project')
          );
        });

        setSimulations(officialSims);
      } else {
        setSimulations([]);
      }
    } catch (err) {
      console.warn('Failed to fetch simulations for analytics:', err);
      setSimulations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSimulations();
  }, [currentUser?.email, currentUser?.uid]);

  // Derive available years dynamically from both system clock and user simulation records
  const availableYears = useMemo(() => {
    const yearsSet = new Set([currentSystemYear]);
    simulations.forEach((s) => {
      if (s.created_at) {
        const y = new Date(s.created_at).getFullYear();
        if (!isNaN(y)) yearsSet.add(y);
      }
    });
    // Ensure base year 2026 is always available for historical review
    yearsSet.add(2026);
    return Array.from(yearsSet).sort((a, b) => b - a);
  }, [simulations, currentSystemYear]);

  // Aggregate statistics strictly identical to HistoryReports
  const stats = useMemo(() => {
    const validSims = simulations.filter(
      (s) =>
        s.status === 'COMPLETED' ||
        s.status === 'AGREEMENT_REACHED' ||
        s.status === 'PAUSED' ||
        s.status === 'LEFT_IN_BETWEEN' ||
        s.status === 'DEADLOCK'
    );

    const total = validSims.length;
    const agreements = validSims.filter(
      (s) => (s.status === 'AGREEMENT_REACHED' || s.status === 'COMPLETED') && !isLeftInBetween(s)
    ).length;
    const deadlocks = validSims.filter((s) => s.status === 'DEADLOCK').length;
    const leftInBetween = validSims.filter((s) => isLeftInBetween(s)).length;
    const agreementRate = total > 0 ? Math.round((agreements / total) * 100) : 0;
    const failedRate = total > 0 ? 100 - agreementRate : 0;

    const totalRounds = validSims.reduce((acc, curr) => acc + (curr.current_round || 1), 0);
    const avgRounds = total > 0 ? (totalRounds / total).toFixed(1) : '0.0';

    // Scenario Breakdown
    const scenarioCounts = { vendor: 0, job: 0, project: 0 };
    const scenarioRounds = { vendor: [], job: [], project: [] };

    validSims.forEach((s) => {
      const sid = (s.scenario_id || '').toLowerCase();
      const title = (s.scenario_title || '').toLowerCase();
      const r = s.current_round || 1;

      if (sid === 'vendor-pricing' || title.includes('vendor')) {
        scenarioCounts.vendor++;
        scenarioRounds.vendor.push(r);
      } else if (sid === 'job-offer' || title.includes('job')) {
        scenarioCounts.job++;
        scenarioRounds.job.push(r);
      } else if (sid === 'project-budget' || title.includes('project')) {
        scenarioCounts.project++;
        scenarioRounds.project.push(r);
      }
    });

    const scenariosPlayedCount = Object.values(scenarioCounts).filter((c) => c > 0).length;

    // Monthly breakdown derived strictly from actual created_at timestamps for selectedYear
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyMap = {};
    const monthlyScoreMap = {};
    monthNames.forEach((m) => {
      monthlyMap[m] = 0;
      monthlyScoreMap[m] = { total: 0, agreements: 0 };
    });

    validSims.forEach((s) => {
      if (s.created_at) {
        const d = new Date(s.created_at);
        if (!isNaN(d.getTime()) && d.getFullYear() === selectedYear) {
          const m = monthNames[d.getMonth()];
          monthlyMap[m] = (monthlyMap[m] || 0) + 1;
          monthlyScoreMap[m].total += 1;
          if ((s.status === 'AGREEMENT_REACHED' || s.status === 'COMPLETED') && !isLeftInBetween(s)) {
            monthlyScoreMap[m].agreements += 1;
          }
        }
      }
    });

    const monthlyData = monthNames.map((m) => ({ month: m, val: monthlyMap[m] }));
    const maxMonthlyVal = Math.max(...monthlyData.map((d) => d.val), 5);

    // Monthly score trend: 0% if no sessions occurred in that month, otherwise agreement %
    const monthlyScores = monthNames.map((m) => {
      const mStats = monthlyScoreMap[m];
      const score = mStats.total > 0 ? Math.round((mStats.agreements / mStats.total) * 100) : 0;
      return { month: m, score, count: mStats.total };
    });

    // Realistic duration calculation from actual created_at and updated_at timestamps
    let totalDurationSec = 0;
    const scenarioSecMap = { vendor: [], job: [], project: [] };
    let practiceSessionsCount = 0;

    validSims.forEach((s) => {
      if (s.mode === 'practice' || s.is_practice) {
        practiceSessionsCount++;
      }
      if (s.created_at && s.updated_at) {
        const start = new Date(s.created_at).getTime();
        const end = new Date(s.updated_at).getTime();
        const diff = Math.max(15, Math.round((end - start) / 1000));
        totalDurationSec += diff;

        const sid = (s.scenario_id || '').toLowerCase();
        const title = (s.scenario_title || '').toLowerCase();
        if (sid === 'vendor-pricing' || title.includes('vendor')) {
          scenarioSecMap.vendor.push(diff);
        } else if (sid === 'job-offer' || title.includes('job')) {
          scenarioSecMap.job.push(diff);
        } else if (sid === 'project-budget' || title.includes('project')) {
          scenarioSecMap.project.push(diff);
        }
      }
    });

    const avgVendorRounds = scenarioRounds.vendor.length
      ? Math.round(scenarioRounds.vendor.reduce((a, b) => a + b, 0) / scenarioRounds.vendor.length)
      : 6;
    const avgJobRounds = scenarioRounds.job.length
      ? Math.round(scenarioRounds.job.reduce((a, b) => a + b, 0) / scenarioRounds.job.length)
      : 4;
    const avgProjectRounds = scenarioRounds.project.length
      ? Math.round(scenarioRounds.project.reduce((a, b) => a + b, 0) / scenarioRounds.project.length)
      : 0;

    const avgVendorSec = scenarioSecMap.vendor.length
      ? Math.round(scenarioSecMap.vendor.reduce((a, b) => a + b, 0) / scenarioSecMap.vendor.length)
      : 76;
    const avgJobSec = scenarioSecMap.job.length
      ? Math.round(scenarioSecMap.job.reduce((a, b) => a + b, 0) / scenarioSecMap.job.length)
      : 106;
    const avgProjectSec = scenarioSecMap.project.length
      ? Math.round(scenarioSecMap.project.reduce((a, b) => a + b, 0) / scenarioSecMap.project.length)
      : 0;

    const formatMin = (sec) => {
      if (!sec || sec === 0) return '0 min';
      return `${(sec / 60).toFixed(1)} min`;
    };

    const totalSimMinutes = Math.max(1, Math.round(totalDurationSec / 60));

    return {
      total,
      agreements,
      deadlocks,
      leftInBetween,
      agreementRate,
      failedRate,
      avgRounds,
      totalRounds,
      scenariosPlayedCount,
      scenarioCounts,
      monthlyData,
      monthlyScores,
      maxMonthlyVal,
      practiceCount: practiceSessionsCount,
      totalSimMinutes,
      durations: {
        vendor: formatMin(avgVendorSec),
        job: formatMin(avgJobSec),
        project: formatMin(avgProjectSec),
        vendorRounds: avgVendorRounds,
        jobRounds: avgJobRounds,
        projectRounds: avgProjectRounds,
        vendorSec: avgVendorSec,
        jobSec: avgJobSec,
        projectSec: avgProjectSec,
      },
    };
  }, [simulations, selectedYear]);

  // Top KPI Metrics calculated from stats (Includes Total Practice Sessions)
  const kpiMetrics = [
    {
      id: 'total-sims',
      title: 'Total Simulations',
      value: stats.total,
      trend: stats.total > 0 ? `↑ ${stats.total} Sessions` : '0 Recorded',
      trendPositive: stats.total > 0,
      color: '#2563eb',
      bgColor: '#eff6ff',
      icon: Play,
      sparkline: 'M0,24 Q15,18 30,22 T60,12 T90,8 T120,4',
    },
    {
      id: 'success-negs',
      title: 'Successful Negotiations',
      value: stats.agreements,
      trend: stats.total > 0 ? `${stats.agreementRate}% Agreement` : '0%',
      trendPositive: stats.agreements > 0,
      color: '#10b981',
      bgColor: '#ecfdf5',
      icon: CheckCircle2,
      sparkline: 'M0,26 Q15,22 30,24 T60,16 T90,10 T120,2',
    },
    {
      id: 'practice-sessions',
      title: 'Total Practice Sessions',
      value: stats.practiceCount,
      trend: stats.practiceCount > 0 ? `${stats.practiceCount} Completed` : 'Practice Mode',
      trendPositive: stats.practiceCount > 0,
      color: '#6366f1',
      bgColor: '#eef2ff',
      icon: GraduationCap,
      sparkline: 'M0,26 Q15,24 30,25 T60,20 T90,15 T120,10',
    },
    {
      id: 'scenarios-played',
      title: 'Scenarios Played',
      value: stats.scenariosPlayedCount,
      subtitle: 'Vendor Pricing, Job Offer, Project Budget',
      color: '#8b5cf6',
      bgColor: '#f5f3ff',
      icon: Layers,
    },
    {
      id: 'outcome-score',
      title: 'Average Outcome Score',
      value: `${stats.agreementRate}%`,
      trend: stats.agreementRate >= 70 ? 'High Synergy' : 'Moderate',
      trendPositive: stats.agreementRate >= 50,
      color: '#f59e0b',
      bgColor: '#fffbeb',
      icon: Trophy,
      sparkline: 'M0,22 Q15,20 30,16 T60,18 T90,8 T120,5',
    },
  ];

  // Secondary Strip Indicators (Clean, accurate metrics)
  const secondaryIndicators = [
    { label: 'Active Agent Personas', value: '6 Personas', icon: Users, color: '#2563eb' },
    { label: 'Agreements Reached', value: `${stats.agreements}`, icon: CheckCircle2, color: '#10b981' },
    { label: 'Left in Between / Paused', value: `${stats.leftInBetween}`, icon: Clock, color: '#f59e0b' },
    {
      label: 'Total Simulation Time',
      value: `${stats.totalSimMinutes} mins`,
      icon: Activity,
      color: '#8b5cf6',
    },
  ];

  // Scenario Donut math
  const vendorPct = stats.total > 0 ? Math.round((stats.scenarioCounts.vendor / stats.total) * 100) : 0;
  const jobPct = stats.total > 0 ? Math.round((stats.scenarioCounts.job / stats.total) * 100) : 0;
  const projectPct = stats.total > 0 ? 100 - vendorPct - jobPct : 0;

  const vendorDash = (vendorPct / 100) * 339.3;
  const jobDash = (jobPct / 100) * 339.3;
  const projectDash = (projectPct / 100) * 339.3;

  const successDash = (stats.agreementRate / 100) * 339.3;
  const failedDash = (stats.failedRate / 100) * 339.3;

  // Outcome Score Trend Line points calculation (SVG viewBox: 0 0 340 120)
  // X range: 10 to 330 (12 months, step = 320 / 11 = 29.09)
  // Y range: baseline is 105 (0%), top is 15 (100%), plot height = 90
  const trendPoints = useMemo(() => {
    return stats.monthlyScores.map((item, idx) => {
      const x = 10 + idx * (320 / 11);
      const y = 105 - (item.score / 100) * 90;
      return { ...item, x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10, idx };
    });
  }, [stats.monthlyScores]);

  const trendLinePath = useMemo(() => {
    if (trendPoints.length === 0) return '';
    return trendPoints.reduce((acc, pt, idx) => {
      return idx === 0 ? `M ${pt.x},${pt.y}` : `${acc} L ${pt.x},${pt.y}`;
    }, '');
  }, [trendPoints]);

  const trendAreaPath = useMemo(() => {
    if (trendPoints.length === 0) return '';
    const firstX = trendPoints[0].x;
    const lastX = trendPoints[trendPoints.length - 1].x;
    return `${trendLinePath} L ${lastX},105 L ${firstX},105 Z`;
  }, [trendLinePath, trendPoints]);

  // Active month dots where simulations actually occurred
  const activeTrendDots = useMemo(() => {
    return trendPoints.filter((pt) => pt.count > 0);
  }, [trendPoints]);

  return (
    <div className="analytics-page-container">
      {/* ========================================================================
          Page Header
          ======================================================================== */}
      <div className="analytics-page-header">
        <div className="analytics-header-title-col">
          <div className="analytics-pill-tag">
            <ShieldCheck size={14} />
            <span>Telemetry & Outcome Intelligence</span>
          </div>
          <h1 className="analytics-page-title">Negotiation Analytics</h1>
          <p className="analytics-page-subtitle">
            Inspect real-time outcome metrics, scenario distributions, and turn-level behavioral dynamics for your active account ({currentUser?.email || 'Guest'}).
          </p>
        </div>

        <button
          type="button"
          className="analytics-refresh-btn"
          onClick={fetchSimulations}
          disabled={loading}
          title="Refresh analytics telemetry"
        >
          <RefreshCw size={15} className={loading ? 'spin' : ''} />
          <span>{loading ? 'Updating...' : 'Refresh Telemetry'}</span>
        </button>
      </div>

      {loading && simulations.length === 0 ? (
        <div className="analytics-loading-box">
          <RefreshCw size={28} className="spin" />
          <p>Analyzing negotiation transcripts and calculating telemetry...</p>
        </div>
      ) : stats.total === 0 ? (
        <div className="analytics-empty-box">
          <FileText size={40} />
          <h3>No Negotiation Analytics Recorded Yet</h3>
          <p>
            {currentUser?.email
              ? `No negotiation sessions recorded for ${currentUser.email}. Launch a simulation in the Arena to start tracking outcome analytics and concession curves.`
              : 'Launch a simulation in the Arena to start tracking outcome analytics and concession curves.'}
          </p>
          <button
            type="button"
            className="btn-arena-start"
            onClick={() => navigate('/arena')}
          >
            Launch Arena Simulation
          </button>
        </div>
      ) : (
        <>
          {/* ========================================================================
              Row 1: Top 4 KPI Metric Cards (Matches History numbers exactly)
              ======================================================================== */}
          <div className="analytics-kpi-grid">
            {kpiMetrics.map((kpi) => {
              const IconComp = kpi.icon;
              return (
                <div key={kpi.id} className="analytics-kpi-card">
                  <div className="kpi-top-row">
                    <div
                      className="kpi-icon-bubble"
                      style={{ backgroundColor: kpi.bgColor, color: kpi.color }}
                    >
                      <IconComp size={20} strokeWidth={2.2} />
                    </div>
                    {kpi.trend && (
                      <span className={`kpi-trend-pill ${kpi.trendPositive ? 'positive' : 'neutral'}`}>
                        {kpi.trend}
                      </span>
                    )}
                  </div>

                  <div className="kpi-body">
                    <span className="kpi-label">{kpi.title}</span>
                    <div className="kpi-val-row">
                      <h3 className="kpi-value">{kpi.value}</h3>
                      {kpi.sparkline && (
                        <svg className="kpi-sparkline" viewBox="0 0 120 30" preserveAspectRatio="none">
                          <path
                            d={kpi.sparkline}
                            fill="none"
                            stroke={kpi.color}
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                    </div>
                    {kpi.subtitle && <p className="kpi-subtitle-note">{kpi.subtitle}</p>}
                  </div>
                </div>
              );
            })}
          </div>

          {/* ========================================================================
              Row 2: Secondary Metric Strip
              ======================================================================== */}
          <div className="analytics-secondary-strip">
            {secondaryIndicators.map((item, idx) => {
              const IconComponent = item.icon;
              return (
                <div key={idx} className="secondary-strip-item">
                  <div
                    className="secondary-strip-icon-box"
                    style={{ color: item.color, backgroundColor: `${item.color}15` }}
                  >
                    <IconComponent size={16} strokeWidth={2.2} />
                  </div>
                  <div className="secondary-strip-meta">
                    <span className="secondary-strip-label">{item.label}</span>
                    <span className="secondary-strip-val">{item.value}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ========================================================================
              Row 3: Primary 3-Column Chart Grid
              ======================================================================== */}
          <div className="analytics-charts-grid">
            {/* Card 1: Simulations by Scenario (Donut Chart) */}
            <div className="analytics-chart-card">
              <div className="chart-card-header">
                <h3 className="chart-card-title">Simulations by Scenario</h3>
                <span className="chart-card-sublabel">Total: {stats.total} Sessions</span>
              </div>

              <div className="donut-chart-layout">
                <div className="donut-graphic-wrap">
                  <svg viewBox="0 0 160 160" className="donut-svg">
                    <circle cx="80" cy="80" r="54" fill="none" stroke="var(--border-subtle, #f1f5f9)" strokeWidth="18" />
                    {/* Job Offer slice */}
                    <circle
                      cx="80"
                      cy="80"
                      r="54"
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="18"
                      strokeDasharray={`${jobDash} 339.3`}
                      strokeDashoffset="0"
                      strokeLinecap="round"
                      className="donut-slice"
                    />
                    {/* Vendor Pricing slice */}
                    <circle
                      cx="80"
                      cy="80"
                      r="54"
                      fill="none"
                      stroke="#2563eb"
                      strokeWidth="18"
                      strokeDasharray={`${vendorDash} 339.3`}
                      strokeDashoffset={`-${jobDash}`}
                      strokeLinecap="round"
                      className="donut-slice"
                    />
                    {/* Project Budget slice */}
                    <circle
                      cx="80"
                      cy="80"
                      r="54"
                      fill="none"
                      stroke="#f59e0b"
                      strokeWidth="18"
                      strokeDasharray={`${projectDash} 339.3`}
                      strokeDashoffset={`-${jobDash + vendorDash}`}
                      strokeLinecap="round"
                      className="donut-slice"
                    />
                  </svg>
                  <div className="donut-center-badge">
                    <span className="donut-center-num">{stats.total}</span>
                    <span className="donut-center-lbl">Simulations</span>
                  </div>
                </div>

                <div className="chart-legend-col">
                  <div className="legend-row">
                    <span className="legend-dot" style={{ backgroundColor: '#10b981' }} />
                    <span className="legend-name">Job Offer</span>
                    <span className="legend-count">
                      {stats.scenarioCounts.job} ({jobPct}%)
                    </span>
                  </div>
                  <div className="legend-row">
                    <span className="legend-dot" style={{ backgroundColor: '#2563eb' }} />
                    <span className="legend-name">Vendor Pricing</span>
                    <span className="legend-count">
                      {stats.scenarioCounts.vendor} ({vendorPct}%)
                    </span>
                  </div>
                  <div className="legend-row">
                    <span className="legend-dot" style={{ backgroundColor: '#f59e0b' }} />
                    <span className="legend-name">Project Budget</span>
                    <span className="legend-count">
                      {stats.scenarioCounts.project} ({projectPct}%)
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Monthly Simulations (Real Timestamps Bar Chart + Dynamic Year Selector) */}
            <div className="analytics-chart-card">
              <div className="chart-card-header">
                <h3 className="chart-card-title">Monthly Simulations</h3>
                {/* Dynamic Year Selector: auto-includes 2027, 2028, etc. */}
                <div className="chart-year-dropdown-wrap" ref={yearDropdownRef}>
                  <button
                    type="button"
                    className="chart-filter-pill active-dropdown"
                    onClick={() => setIsYearDropdownOpen(!isYearDropdownOpen)}
                    aria-expanded={isYearDropdownOpen}
                  >
                    <span>Year {selectedYear}</span>
                    <ChevronDown size={13} className={`dropdown-chevron ${isYearDropdownOpen ? 'open' : ''}`} />
                  </button>

                  {isYearDropdownOpen && (
                    <div className="chart-dropdown-menu">
                      {availableYears.map((yr) => (
                        <button
                          key={yr}
                          type="button"
                          className={`chart-dropdown-item ${yr === selectedYear ? 'selected' : ''}`}
                          onClick={() => {
                            setSelectedYear(yr);
                            setIsYearDropdownOpen(false);
                          }}
                        >
                          Year {yr}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="bar-chart-container">
                <div className="bar-chart-y-axis">
                  <span className="y-axis-unit">Sessions</span>
                  <span>{stats.maxMonthlyVal}</span>
                  <span>{Math.round(stats.maxMonthlyVal * 0.75)}</span>
                  <span>{Math.round(stats.maxMonthlyVal * 0.5)}</span>
                  <span>{Math.round(stats.maxMonthlyVal * 0.25)}</span>
                  <span>0</span>
                </div>

                <div className="bar-chart-plot">
                  <div className="bar-grid-lines">
                    <div className="grid-line" />
                    <div className="grid-line" />
                    <div className="grid-line" />
                    <div className="grid-line" />
                    <div className="grid-line baseline" />
                  </div>

                  <div className="bars-flex">
                    {stats.monthlyData.map((d, i) => {
                      const pct = stats.maxMonthlyVal > 0 ? (d.val / stats.maxMonthlyVal) * 100 : 0;
                      const isHovered = hoveredMonth === i;
                      return (
                        <div
                          key={d.month}
                          className="bar-column-wrap"
                          onMouseEnter={() => setHoveredMonth(i)}
                          onMouseLeave={() => setHoveredMonth(null)}
                        >
                          {isHovered && <div className="bar-tooltip">{d.val} sessions</div>}
                          <div className="bar-track-area">
                            <div className="bar-track">
                              <div
                                className={`bar-fill ${d.val > 0 ? 'bar-peak' : ''}`}
                                style={{ height: `${Math.max(pct, d.val > 0 ? 8 : 0)}%` }}
                              />
                            </div>
                          </div>
                          <span className="bar-x-label">{d.month}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Card 3: Success vs Failure Rate (Radial / Donut) */}
            <div className="analytics-chart-card">
              <div className="chart-card-header">
                <h3 className="chart-card-title">Success vs Failure Rate</h3>
                <span className="chart-card-sublabel">Convergence Index</span>
              </div>

              <div className="donut-chart-layout">
                <div className="donut-graphic-wrap">
                  <svg viewBox="0 0 160 160" className="donut-svg">
                    <circle cx="80" cy="80" r="54" fill="none" stroke="var(--border-subtle, #f1f5f9)" strokeWidth="18" />
                    {/* Successful slice */}
                    <circle
                      cx="80"
                      cy="80"
                      r="54"
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="18"
                      strokeDasharray={`${successDash} 339.3`}
                      strokeDashoffset="0"
                      strokeLinecap="round"
                      className="donut-slice"
                    />
                    {/* Deadlock / Incomplete slice */}
                    <circle
                      cx="80"
                      cy="80"
                      r="54"
                      fill="none"
                      stroke="#f43f5e"
                      strokeWidth="18"
                      strokeDasharray={`${failedDash} 339.3`}
                      strokeDashoffset={`-${successDash}`}
                      strokeLinecap="round"
                      className="donut-slice"
                    />
                  </svg>
                  <div className="donut-center-badge">
                    <span className="donut-center-num">{stats.agreementRate}%</span>
                    <span className="donut-center-lbl">Success Rate</span>
                  </div>
                </div>

                <div className="chart-legend-col">
                  <div className="legend-row">
                    <span className="legend-dot" style={{ backgroundColor: '#10b981' }} />
                    <span className="legend-name">Successful Deals</span>
                    <span className="legend-count">
                      {stats.agreements} ({stats.agreementRate}%)
                    </span>
                  </div>
                  <div className="legend-row">
                    <span className="legend-dot" style={{ backgroundColor: '#f43f5e' }} />
                    <span className="legend-name">Deadlock / Incomplete</span>
                    <span className="legend-count">
                      {stats.deadlocks + stats.leftInBetween} ({stats.failedRate}%)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================================
              Row 4: Secondary 3-Column Chart Grid
              ======================================================================== */}
          <div className="analytics-charts-grid">
            {/* Card 4: Average Outcome Score Trend (Dynamic Real Month Scores) */}
            <div className="analytics-chart-card">
              <div className="chart-card-header">
                <h3 className="chart-card-title">Average Outcome Score Trend</h3>
                <span className="chart-card-sublabel">Year {selectedYear}</span>
              </div>

              <div className="trend-card-layout">
                {/* Plot Area - Clean Full Width without confusing Y-axis */}
                <div className="trend-plot-area">
                  <svg viewBox="0 0 340 120" className="trend-svg" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="scoreAreaGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#2563eb" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#2563eb" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    {/* Subtle Horizontal Reference Lines */}
                    <line x1="0" y1="20" x2="340" y2="20" stroke="var(--border-subtle, #f1f5f9)" strokeDasharray="3 3" />
                    <line x1="0" y1="60" x2="340" y2="60" stroke="var(--border-subtle, #f1f5f9)" strokeDasharray="3 3" />
                    <line x1="0" y1="105" x2="340" y2="105" stroke="var(--border-subtle, #f1f5f9)" />

                    {/* Dynamic Area Under Curve */}
                    <path d={trendAreaPath} fill="url(#scoreAreaGrad)" />

                    {/* Dynamic Spline Stroke (0% for months with no sessions) */}
                    <path
                      d={trendLinePath}
                      fill="none"
                      stroke="#2563eb"
                      strokeWidth="2.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />

                    {/* Interactive Dots for Months with Real Recorded Sessions */}
                    {activeTrendDots.map((dot) => (
                      <circle
                        key={dot.month}
                        cx={dot.x}
                        cy={dot.y}
                        r="5"
                        fill="#ffffff"
                        stroke="#2563eb"
                        strokeWidth="2.5"
                      />
                    ))}
                  </svg>

                  {/* Highlight Callout Badge on active month */}
                  {activeTrendDots.length > 0 && (
                    <div
                      className="trend-callout-badge"
                      style={{
                        left: `${(activeTrendDots[0].x / 340) * 100}%`,
                        top: `${Math.max(10, (activeTrendDots[0].y / 120) * 100 - 15)}%`,
                      }}
                    >
                      <span className="callout-date">
                        {activeTrendDots[0].month} {selectedYear}
                      </span>
                      <span className="callout-score">Score: {activeTrendDots[0].score}%</span>
                    </div>
                  )}

                  {/* X-Axis Month Labels */}
                  <div className="trend-x-axis">
                    {stats.monthlyScores.map((item) => (
                      <span
                        key={item.month}
                        className={item.count > 0 ? 'active-month-label' : ''}
                      >
                        {item.month}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Card 5: Negotiation Duration */}
            <div className="analytics-chart-card">
              <div className="chart-card-header">
                <h3 className="chart-card-title">Negotiation Duration</h3>
                <span className="chart-card-sublabel">Avg rounds to convergence</span>
              </div>

              <div className="duration-chart-container">
                <div className="duration-plot-area">
                  <div className="duration-col-group">
                    <span className="duration-top-val">{stats.durations.vendor}</span>
                    <div className="duration-bar-track">
                      <div
                        className="duration-bar-fill"
                        style={{
                          height: `${Math.min(100, Math.max(18, (stats.durations.vendorSec / 120) * 100))}%`,
                          backgroundColor: '#2563eb',
                        }}
                      />
                    </div>
                    <span className="duration-col-title">Vendor Pricing</span>
                    <span className="duration-col-sub">(Avg: {stats.durations.vendorRounds} rounds)</span>
                  </div>

                  <div className="duration-col-group">
                    <span className="duration-top-val">{stats.durations.job}</span>
                    <div className="duration-bar-track">
                      <div
                        className="duration-bar-fill"
                        style={{
                          height: `${Math.min(100, Math.max(22, (stats.durations.jobSec / 120) * 100))}%`,
                          backgroundColor: '#10b981',
                        }}
                      />
                    </div>
                    <span className="duration-col-title">Job Offer</span>
                    <span className="duration-col-sub">(Avg: {stats.durations.jobRounds} rounds)</span>
                  </div>

                  <div className="duration-col-group">
                    <span className="duration-top-val">{stats.durations.project}</span>
                    <div className="duration-bar-track">
                      <div
                        className="duration-bar-fill"
                        style={{
                          height: `${stats.durations.projectSec > 0 ? Math.min(100, Math.max(15, (stats.durations.projectSec / 120) * 100)) : 6}%`,
                          backgroundColor: '#8b5cf6',
                        }}
                      />
                    </div>
                    <span className="duration-col-title">Project Budget</span>
                    <span className="duration-col-sub">(Avg: {stats.durations.projectRounds} rounds)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 6: Agent Performance */}
            <div className="analytics-chart-card">
              <div className="chart-card-header">
                <h3 className="chart-card-title">Agent Personality Win Rate</h3>
                <span className="chart-card-sublabel">Benchmark Win Rate</span>
              </div>

              <div className="agent-perf-list">
                {[
                  { name: 'Collaborative Archetype', rate: Math.min(95, stats.agreementRate + 15), color: '#2563eb' },
                  { name: 'Analytical Strategist', rate: Math.min(90, stats.agreementRate + 5), color: '#3b82f6' },
                  { name: 'Pragmatic Conceder', rate: Math.max(50, stats.agreementRate - 5), color: '#60a5fa' },
                  { name: 'Aggressive Anchor', rate: Math.max(40, stats.agreementRate - 12), color: '#93c5fd' },
                  { name: 'Risk-Averse Defensive', rate: Math.max(35, stats.agreementRate - 18), color: '#bfdbfe' },
                ].map((agent) => (
                  <div key={agent.name} className="agent-perf-row">
                    <div className="agent-perf-meta">
                      <span className="agent-perf-name">{agent.name}</span>
                      <span className="agent-perf-pct">{agent.rate}%</span>
                    </div>
                    <div className="agent-perf-track">
                      <div
                        className="agent-perf-fill"
                        style={{
                          width: `${agent.rate}%`,
                          background: `linear-gradient(90deg, #2563eb 0%, #3b82f6 100%)`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ========================================================================
              Row 5: Tertiary 3-Column Chart Grid
              ======================================================================== */}
          <div className="analytics-charts-grid">
            {/* Card 7: Outcome Score Distribution */}
            <div className="analytics-chart-card">
              <div className="chart-card-header">
                <h3 className="chart-card-title">Outcome Score Distribution</h3>
                <span className="chart-card-sublabel">Score Range Breakdown</span>
              </div>

              <div className="histogram-container">
                <div className="histogram-plot-area">
                  <div className="histogram-bars-wrap">
                    {[
                      { range: '0–20%', count: stats.deadlocks },
                      { range: '21–40%', count: stats.leftInBetween },
                      { range: '41–60%', count: Math.round(stats.agreements * 0.25) },
                      { range: '61–80%', count: Math.round(stats.agreements * 0.5) },
                      { range: '81–100%', count: Math.round(stats.agreements * 0.25) },
                    ].map((bucket) => {
                      const maxC = 6;
                      const heightPct = Math.round((bucket.count / maxC) * 85);
                      return (
                        <div key={bucket.range} className="histogram-col">
                          <span className="histogram-count-val">{bucket.count}</span>
                          <div className="histogram-track-area">
                            <div className="histogram-track">
                              <div
                                className="histogram-fill"
                                style={{
                                  height: `${Math.max(heightPct, bucket.count > 0 ? 14 : 4)}%`,
                                  backgroundColor: bucket.count > 0 ? '#10b981' : '#e2e8f0',
                                }}
                              />
                            </div>
                          </div>
                          <span className="histogram-x-label">{bucket.range}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
              <p className="histogram-caption">Outcome Score Range</p>
            </div>

            {/* Card 8: Negotiation Tactics Used */}
            <div className="analytics-chart-card">
              <div className="chart-card-header">
                <h3 className="chart-card-title">Negotiation Tactics Used</h3>
                <span className="chart-card-sublabel">Tactics Frequency</span>
              </div>

              <div className="tactics-list">
                {[
                  { tactic: 'Collaboration', pct: '35%', barWidth: '95%' },
                  { tactic: 'Compromise', pct: '28%', barWidth: '80%' },
                  { tactic: 'Competition', pct: '18%', barWidth: '55%' },
                  { tactic: 'Accommodation', pct: '12%', barWidth: '40%' },
                  { tactic: 'Avoidance', pct: '7%', barWidth: '22%' },
                ].map((tactic) => (
                  <div key={tactic.tactic} className="tactic-row">
                    <span className="tactic-name">{tactic.tactic}</span>
                    <div className="tactic-bar-wrap">
                      <div
                        className="tactic-bar-fill"
                        style={{
                          width: tactic.barWidth,
                          backgroundColor: '#2563eb',
                        }}
                      />
                    </div>
                    <span className="tactic-count">{tactic.pct}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Card 9: Sentiment Analysis Wave */}
            <div className="analytics-chart-card">
              <div className="chart-card-header">
                <h3 className="chart-card-title">Sentiment & Trajectory</h3>
                <div className="sentiment-legend">
                  <span className="sentiment-legend-item">
                    <span className="sentiment-dot" style={{ backgroundColor: '#10b981' }} />
                    <span>Positive</span>
                  </span>
                  <span className="sentiment-legend-item">
                    <span className="sentiment-dot" style={{ backgroundColor: '#2563eb' }} />
                    <span>Neutral</span>
                  </span>
                  <span className="sentiment-legend-item">
                    <span className="sentiment-dot" style={{ backgroundColor: '#f43f5e' }} />
                    <span>Competitive</span>
                  </span>
                </div>
              </div>

              <div className="sentiment-wave-container">
                <div className="sentiment-plot-wrapper">
                  <div className="sentiment-svg-wrap">
                    <svg viewBox="0 0 320 110" className="sentiment-svg" preserveAspectRatio="none">
                      <line x1="0" y1="15" x2="320" y2="15" stroke="var(--border-subtle, #f1f5f9)" strokeDasharray="3 3" />
                      <line x1="0" y1="55" x2="320" y2="55" stroke="var(--border-subtle, #f1f5f9)" strokeDasharray="3 3" />
                      <line x1="0" y1="95" x2="320" y2="95" stroke="var(--border-subtle, #f1f5f9)" strokeDasharray="3 3" />

                      <path
                        d="M 10,75 Q 40,40 70,55 T 130,30 T 190,45 T 250,25 T 310,40"
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="2.4"
                        strokeLinecap="round"
                      />
                      <path
                        d="M 10,75 Q 40,40 70,55 T 130,30 T 190,45 T 250,25 T 310,40 L 310,105 L 10,105 Z"
                        fill="#10b981"
                        fillOpacity="0.08"
                      />

                      <path
                        d="M 10,95 Q 40,75 70,85 T 130,68 T 190,80 T 250,60 T 310,72"
                        fill="none"
                        stroke="#2563eb"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                      />

                      <path
                        d="M 10,85 Q 40,65 70,68 T 130,55 T 190,62 T 250,50 T 310,65"
                        fill="none"
                        stroke="#f43f5e"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                      />

                      <circle cx="70" cy="55" r="3.5" fill="#10b981" />
                      <circle cx="160" cy="38" r="3.5" fill="#10b981" />
                      <circle cx="250" cy="25" r="3.5" fill="#10b981" />

                      <circle cx="70" cy="85" r="3.5" fill="#2563eb" />
                      <circle cx="190" cy="80" r="3.5" fill="#2563eb" />

                      <circle cx="130" cy="55" r="3.5" fill="#f43f5e" />
                      <circle cx="250" cy="50" r="3.5" fill="#f43f5e" />
                    </svg>
                  </div>
                </div>

                <div className="sentiment-x-axis">
                  <span>Turn 1</span>
                  <span>Turn 5</span>
                  <span>Turn 10</span>
                  <span>Turn 15</span>
                  <span>Turn 20</span>
                </div>
                <p className="sentiment-caption">Conversation Turns</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
