import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  BookOpen,
  Search,
  Filter,
  Bookmark,
  BookmarkCheck,
  Sparkles,
  Send,
  X,
  Copy,
  Check,
  RotateCcw,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  ShieldAlert,
  HelpCircle,
  ArrowRight,
  MessageSquare,
  Layers,
  Award,
  Lightbulb,
  ExternalLink,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useScenario } from '../context/ScenarioContext';
import {
  fetchStrategies,
  fetchUserBookmarks,
  toggleBookmarkApi,
  askGeminiTutor,
  fetchConversationHistory
} from '../services/strategyApi';
import './StrategyLibrary.css';

const CATEGORIES = [
  'All Categories',
  'Fundamental Negotiation Principles',
  'Bargaining and Counteroffers',
  'Win-Win Negotiation',
  'Persuasion and Influence',
  'Conflict Resolution',
  'Salary and Job Offer Negotiation',
  'Vendor and Business Negotiation',
  'Project Budget Allocation',
  'Deadlock Resolution',
  'Advanced Multi-Agent Strategies'
];

const DIFFICULTIES = ['All Levels', 'Beginner', 'Intermediate', 'Advanced'];

const SUGGESTED_QUESTIONS = [
  'What is BATNA, with an example?',
  'How do I respond to an aggressive vendor?',
  'When should I make a counteroffer?',
  'What is the difference between BATNA and ZOPA?',
  'How can I resolve a negotiation deadlock?',
  'Which strategy should I use in a salary negotiation?',
  'Explain this strategy in simple language.',
  'Give me a realistic example of this tactic.'
];

// Helper to render markdown safely without heavy extra dependencies
function renderFormattedMarkdown(text) {
  if (!text) return null;
  const lines = text.split('\n');

  return (
    <div className="markdown-content">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) {
          return <div key={idx} className="md-spacer" />;
        }
        if (trimmed.startsWith('### ')) {
          return <h4 key={idx} className="md-h4">{trimmed.replace('### ', '')}</h4>;
        }
        if (trimmed.startsWith('#### ')) {
          return <h5 key={idx} className="md-h5">{trimmed.replace('#### ', '')}</h5>;
        }
        if (trimmed.startsWith('# ') || trimmed.startsWith('## ')) {
          return <h3 key={idx} className="md-h3">{trimmed.replace(/^#+\s/, '')}</h3>;
        }
        if (trimmed.startsWith('> ')) {
          const quoteText = trimmed.replace(/^>\s*/, '');
          return (
            <blockquote key={idx} className="md-quote">
              {renderInlineStyles(quoteText)}
            </blockquote>
          );
        }
        if (trimmed.startsWith('* ') || trimmed.startsWith('- ') || /^\d+\.\s/.test(trimmed)) {
          const bulletText = trimmed.replace(/^(\*|-|\d+\.)\s*/, '');
          return (
            <div key={idx} className="md-bullet">
              <span className="md-bullet-dot">•</span>
              <span className="md-bullet-text">{renderInlineStyles(bulletText)}</span>
            </div>
          );
        }
        return (
          <p key={idx} className="md-p">
            {renderInlineStyles(trimmed)}
          </p>
        );
      })}
    </div>
  );
}

function renderInlineStyles(text) {
  // Simple bold and code formatter
  const parts = [];
  const regex = /(\*\*.*?\*\*|`.*?`)/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }
    const token = match[0];
    if (token.startsWith('**') && token.endsWith('**')) {
      parts.push(<strong key={match.index}>{token.slice(2, -2)}</strong>);
    } else if (token.startsWith('`') && token.endsWith('`')) {
      parts.push(<code key={match.index} className="md-code">{token.slice(1, -1)}</code>);
    }
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }
  return parts.length > 0 ? parts : text;
}

export default function StrategyLibrary() {
  const { currentUser } = useAuth();
  const { selectedScenarioId } = useScenario();

  // State
  const [strategies, setStrategies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [selectedDifficulty, setSelectedDifficulty] = useState('All Levels');
  const [showBookmarksOnly, setShowBookmarksOnly] = useState(false);
  const [sortBy, setSortBy] = useState('name'); // 'name', 'difficulty', 'recent'
  const [bookmarks, setBookmarks] = useState(new Set());
  const [recentlyViewedIds, setRecentlyViewedIds] = useState([]);

  // Detail Modal State
  const [activeStrategyModal, setActiveStrategyModal] = useState(null);

  // Gemini AI Doubt Assistant Chat Drawer State
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isChatMaximized, setIsChatMaximized] = useState(false);
  const [chatStrategyContext, setChatStrategyContext] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [chatConversationId, setChatConversationId] = useState(null);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [chatError, setChatError] = useState(null);

  const chatEndRef = useRef(null);

  // Load strategies and bookmarks
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setLoading(true);
      try {
        const [stratData, bmData] = await Promise.all([
          fetchStrategies(),
          fetchUserBookmarks(currentUser?.uid || 'guest')
        ]);
        if (isMounted) {
          setStrategies(stratData || []);
          setBookmarks(new Set(bmData || []));
        }
      } catch (err) {
        console.error('Error loading strategy data:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadData();

    // Load recently viewed
    try {
      const storedRecent = localStorage.getItem('negotiator_recent_strategies');
      if (storedRecent) {
        setRecentlyViewedIds(JSON.parse(storedRecent));
      }
    } catch {}

    return () => {
      isMounted = false;
    };
  }, [currentUser]);

  // Scroll to bottom of chat when new messages arrive
  useEffect(() => {
    if (isChatOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isChatOpen, isChatLoading]);

  // Toggle Bookmark
  const handleToggleBookmark = async (e, strategyId) => {
    e.stopPropagation();
    const isBookmarked = bookmarks.has(strategyId);
    const newBookmarks = new Set(bookmarks);
    if (isBookmarked) {
      newBookmarks.delete(strategyId);
    } else {
      newBookmarks.add(strategyId);
    }
    setBookmarks(newBookmarks);

    await toggleBookmarkApi(
      strategyId,
      isBookmarked,
      currentUser?.uid || 'guest',
      currentUser?.email || null
    );
  };

  // Open Strategy Detail Modal & Track Recently Viewed
  const handleOpenDetailModal = (strategy) => {
    setActiveStrategyModal(strategy);

    // Update recently viewed
    const updatedRecent = [strategy.id, ...recentlyViewedIds.filter((id) => id !== strategy.id)].slice(0, 10);
    setRecentlyViewedIds(updatedRecent);
    try {
      localStorage.setItem('negotiator_recent_strategies', JSON.stringify(updatedRecent));
    } catch {}
  };

  // Open Gemini AI Chat Assistant
  const handleOpenChat = (strategyContext = null) => {
    if (strategyContext) {
      setChatStrategyContext(strategyContext);
    }
    setIsChatOpen(true);
    setChatError(null);
  };

  // Send message to Gemini Doubt Assistant
  const handleSendMessage = async (textToSend = null) => {
    const message = (textToSend || chatInput).trim();
    if (!message || isChatLoading) return;

    setChatInput('');
    setChatError(null);

    const userMsg = {
      role: 'user',
      content: message,
      strategyId: chatStrategyContext?.id || null,
      createdAt: new Date().toISOString()
    };

    setChatMessages((prev) => [...prev, userMsg]);
    setIsChatLoading(true);

    try {
      const response = await askGeminiTutor({
        message,
        strategyId: chatStrategyContext?.id || null,
        conversationId: chatConversationId,
        userId: currentUser?.uid || 'guest',
        userEmail: currentUser?.email || null
      });

      if (response?.conversationId) {
        setChatConversationId(response.conversationId);
      }

      const botMsg = {
        role: 'assistant',
        content: response?.answer || 'Thank you for your question. What specific aspect would you like to explore next?',
        strategyId: chatStrategyContext?.id || null,
        createdAt: new Date().toISOString()
      };

      setChatMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      console.error('Error from Gemini assistant:', err);
      setChatError('Could not reach Gemini Tutor. Click Retry to re-send.');
    } finally {
      setIsChatLoading(false);
    }
  };

  // Handle retry
  const handleRetry = () => {
    const lastUserMsg = [...chatMessages].reverse().find((m) => m.role === 'user');
    if (lastUserMsg) {
      handleSendMessage(lastUserMsg.content);
    }
  };

  // Copy assistant response
  const handleCopy = (content, index) => {
    navigator.clipboard.writeText(content);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Filtered and Sorted Strategies
  const filteredStrategies = useMemo(() => {
    return strategies
      .filter((s) => {
        // Search filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchTitle = s.title.toLowerCase().includes(q);
          const matchDesc = s.description.toLowerCase().includes(q);
          const matchCat = s.category.toLowerCase().includes(q);
          const matchUse = s.best_use_case && s.best_use_case.toLowerCase().includes(q);
          if (!matchTitle && !matchDesc && !matchCat && !matchUse) return false;
        }
        // Category filter
        if (selectedCategory !== 'All Categories' && s.category !== selectedCategory) {
          return false;
        }
        // Difficulty filter
        if (selectedDifficulty !== 'All Levels' && s.difficulty.toLowerCase() !== selectedDifficulty.toLowerCase()) {
          return false;
        }
        // Bookmarks only
        if (showBookmarksOnly && !bookmarks.has(s.id)) {
          return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'name') {
          return a.title.localeCompare(b.title);
        }
        if (sortBy === 'difficulty') {
          const rank = { beginner: 1, intermediate: 2, advanced: 3 };
          return (rank[a.difficulty.toLowerCase()] || 0) - (rank[b.difficulty.toLowerCase()] || 0);
        }
        if (sortBy === 'recent') {
          const indexA = recentlyViewedIds.indexOf(a.id);
          const indexB = recentlyViewedIds.indexOf(b.id);
          if (indexA === -1 && indexB === -1) return 0;
          if (indexA === -1) return 1;
          if (indexB === -1) return -1;
          return indexA - indexB;
        }
        return 0;
      });
  }, [strategies, searchQuery, selectedCategory, selectedDifficulty, showBookmarksOnly, sortBy, bookmarks, recentlyViewedIds]);

  // Recommended strategies for the active scenario
  const recommendedStrategies = useMemo(() => {
    const scenarioKey = selectedScenarioId || 'vendor-pricing';
    return strategies.filter((s) => {
      const recs = s.recommended_scenarios || [];
      return recs.includes(scenarioKey) || recs.some((r) => scenarioKey.includes(r));
    }).slice(0, 3);
  }, [strategies, selectedScenarioId]);

  return (
    <div className="strategy-library-page">
      {/* Page Header */}
      <div className="strat-header-card">
        <div className="strat-header-content">
          <div className="strat-header-badge">
            <BookOpen size={16} />
            <span>Framework Academy</span>
          </div>
          <h1 className="strat-header-title">Negotiation Strategy Library</h1>
          <p className="strat-header-desc">
            Explore battle-tested tactical frameworks, principled negotiation blueprints, and get real-time tactical guidance from Gemini AI.
          </p>
        </div>

        <div className="strat-header-actions">
          <button
            type="button"
            className="ask-gemini-btn-primary"
            onClick={() => handleOpenChat(null)}
            title="Ask Gemini questions about negotiation concepts"
          >
            <Sparkles size={18} className="sparkle-icon" />
            <span>Ask Gemini AI</span>
          </button>
        </div>
      </div>

      {/* Recommended for Current Scenario Banner */}
      {recommendedStrategies.length > 0 && !searchQuery && selectedCategory === 'All Categories' && !showBookmarksOnly && (
        <section className="recommended-section">
          <div className="recommended-header">
            <div className="rec-title-group">
              <Lightbulb size={18} className="rec-icon" />
              <h2 className="rec-title">Recommended for Your Active Scenario</h2>
              <span className="rec-scenario-tag">
                {selectedScenarioId === 'job-offer' ? 'Job Offer Negotiation' : selectedScenarioId === 'project-budget' ? 'Project Budget Allocation' : 'Vendor Pricing Negotiation'}
              </span>
            </div>
            <span className="rec-count">{recommendedStrategies.length} Curated Frameworks</span>
          </div>

          <div className="recommended-grid">
            {recommendedStrategies.map((strat) => (
              <div
                key={strat.id}
                className="rec-card"
                onClick={() => handleOpenDetailModal(strat)}
              >
                <div className="rec-card-top">
                  <span className={`diff-pill diff-${strat.difficulty.toLowerCase()}`}>
                    {strat.difficulty}
                  </span>
                  <button
                    type="button"
                    className={`bm-icon-btn ${bookmarks.has(strat.id) ? 'bookmarked' : ''}`}
                    onClick={(e) => handleToggleBookmark(e, strat.id)}
                    title={bookmarks.has(strat.id) ? 'Remove Bookmark' : 'Save Strategy'}
                  >
                    {bookmarks.has(strat.id) ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
                  </button>
                </div>
                <h3 className="rec-card-title">{strat.title}</h3>
                <p className="rec-card-desc">{strat.description}</p>
                <div className="rec-card-actions">
                  <span className="rec-learn-more">
                    Learn More <ChevronRight size={14} />
                  </span>
                  <button
                    type="button"
                    className="rec-ask-gemini"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenChat(strat);
                    }}
                  >
                    <Sparkles size={12} />
                    <span>Ask Gemini</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Controls & Search Toolbar */}
      <div className="strat-controls-card">
        {/* Search Row */}
        <div className="controls-search-row">
          <div className="search-input-wrapper">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Search by strategy name, concept, or keyword (e.g. BATNA, concession, anchoring)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="strategy-search-input"
            />
            {searchQuery && (
              <button
                type="button"
                className="search-clear-btn"
                onClick={() => setSearchQuery('')}
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Bookmarks & Sort */}
          <div className="controls-right-group">
            <button
              type="button"
              className={`filter-bm-btn ${showBookmarksOnly ? 'active' : ''}`}
              onClick={() => setShowBookmarksOnly(!showBookmarksOnly)}
            >
              <Bookmark size={15} />
              <span>Saved Only</span>
              {bookmarks.size > 0 && <span className="bm-count-pill">{bookmarks.size}</span>}
            </button>

            <div className="sort-dropdown-wrapper">
              <span className="sort-label">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="sort-select"
              >
                <option value="name">Name (A-Z)</option>
                <option value="difficulty">Difficulty (Low to High)</option>
                <option value="recent">Recently Viewed</option>
              </select>
            </div>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="category-filter-bar">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              className={`cat-pill ${selectedCategory === cat ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Difficulty Filter Bar & Results Count */}
        <div className="meta-filter-row">
          <div className="difficulty-pills">
            <span className="meta-filter-label">Level:</span>
            {DIFFICULTIES.map((diff) => (
              <button
                key={diff}
                type="button"
                className={`diff-filter-btn ${selectedDifficulty === diff ? 'active' : ''}`}
                onClick={() => setSelectedDifficulty(diff)}
              >
                {diff}
              </button>
            ))}
          </div>

          <div className="results-counter">
            Showing <strong>{filteredStrategies.length}</strong> {filteredStrategies.length === 1 ? 'framework' : 'frameworks'}
          </div>
        </div>
      </div>

      {/* Strategies Grid */}
      {loading ? (
        <div className="strat-loading-state">
          <div className="loading-spinner-ring" />
          <p>Loading negotiation strategies...</p>
        </div>
      ) : filteredStrategies.length === 0 ? (
        <div className="strat-empty-state">
          <HelpCircle size={44} className="empty-icon" />
          <h3>No matching strategies found</h3>
          <p>Try clearing your filters or searching for terms like "BATNA", "concession", or "pricing".</p>
          <button
            type="button"
            className="clear-all-filters-btn"
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('All Categories');
              setSelectedDifficulty('All Levels');
              setShowBookmarksOnly(false);
            }}
          >
            Reset All Filters
          </button>
        </div>
      ) : (
        <div className="strategies-grid">
          {filteredStrategies.map((strat) => {
            const isBookmarked = bookmarks.has(strat.id);
            return (
              <div
                key={strat.id}
                className="strategy-card"
                onClick={() => handleOpenDetailModal(strat)}
              >
                <div className="card-top-row">
                  <span className="card-category-tag">{strat.category}</span>
                  <div className="card-top-badges">
                    <span className={`diff-pill diff-${strat.difficulty.toLowerCase()}`}>
                      {strat.difficulty}
                    </span>
                    <button
                      type="button"
                      className={`bm-icon-btn ${isBookmarked ? 'bookmarked' : ''}`}
                      onClick={(e) => handleToggleBookmark(e, strat.id)}
                      title={isBookmarked ? 'Remove Bookmark' : 'Bookmark Strategy'}
                    >
                      {isBookmarked ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
                    </button>
                  </div>
                </div>

                <h3 className="card-title">{strat.title}</h3>
                <p className="card-description">{strat.description}</p>

                {/* Best Use Case */}
                {strat.best_use_case && (
                  <div className="card-use-case">
                    <span className="use-case-label">Best Use:</span>
                    <span className="use-case-text">{strat.best_use_case}</span>
                  </div>
                )}

                {/* Pros & Cons Preview */}
                <div className="card-highlights">
                  {strat.advantages && strat.advantages[0] && (
                    <div className="highlight-item pro">
                      <CheckCircle2 size={14} className="hi-icon pro" />
                      <span>{strat.advantages[0]}</span>
                    </div>
                  )}
                  {strat.risks && strat.risks[0] && (
                    <div className="highlight-item con">
                      <ShieldAlert size={14} className="hi-icon con" />
                      <span>{strat.risks[0]}</span>
                    </div>
                  )}
                </div>

                {/* Card Actions Footer */}
                <div className="card-actions-row">
                  <button
                    type="button"
                    className="card-btn-learn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenDetailModal(strat);
                    }}
                  >
                    <span>Learn More</span>
                    <ChevronRight size={14} />
                  </button>

                  <button
                    type="button"
                    className="card-btn-ask"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenChat(strat);
                    }}
                    title="Ask Gemini specifically about this strategy"
                  >
                    <Sparkles size={14} />
                    <span>Ask Gemini</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Floating Ask Gemini Button (Always accessible) */}
      <button
        type="button"
        className="floating-ask-gemini"
        onClick={() => handleOpenChat(null)}
        title="Open Gemini AI Negotiation Assistant"
      >
        <Sparkles size={20} />
        <span>Ask Gemini</span>
      </button>

      {/* Strategy Detail Modal */}
      {activeStrategyModal && (
        <div className="modal-backdrop" onClick={() => setActiveStrategyModal(null)}>
          <div className="strat-detail-modal" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="modal-header">
              <div className="modal-header-titles">
                <div className="modal-badge-row">
                  <span className="card-category-tag">{activeStrategyModal.category}</span>
                  <span className={`diff-pill diff-${activeStrategyModal.difficulty.toLowerCase()}`}>
                    {activeStrategyModal.difficulty}
                  </span>
                </div>
                <h2 className="modal-title">{activeStrategyModal.title}</h2>
              </div>

              <div className="modal-header-actions">
                <button
                  type="button"
                  className={`modal-bm-btn ${bookmarks.has(activeStrategyModal.id) ? 'bookmarked' : ''}`}
                  onClick={(e) => handleToggleBookmark(e, activeStrategyModal.id)}
                >
                  {bookmarks.has(activeStrategyModal.id) ? (
                    <>
                      <BookmarkCheck size={16} />
                      <span>Saved</span>
                    </>
                  ) : (
                    <>
                      <Bookmark size={16} />
                      <span>Bookmark</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  className="modal-close-btn"
                  onClick={() => setActiveStrategyModal(null)}
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="modal-body">
              {/* Strategic Overview */}
              <div className="modal-section">
                <h3 className="section-title">Strategic Overview</h3>
                <p className="section-body-text">{activeStrategyModal.description}</p>
              </div>

              {/* Best Use Case */}
              <div className="modal-section">
                <h3 className="section-title">Ideal Deployment Scenarios</h3>
                <div className="use-case-box">
                  <p>{activeStrategyModal.best_use_case}</p>
                </div>
              </div>

              {/* Advantages vs Risks */}
              <div className="modal-split-grid">
                <div className="split-box advantages">
                  <div className="split-box-title pro">
                    <CheckCircle2 size={16} />
                    <span>Expected Advantages</span>
                  </div>
                  <ul className="split-list">
                    {(activeStrategyModal.advantages || []).map((adv, i) => (
                      <li key={i}>{adv}</li>
                    ))}
                  </ul>
                </div>

                <div className="split-box risks">
                  <div className="split-box-title con">
                    <ShieldAlert size={16} />
                    <span>Potential Risks & Boundary Conditions</span>
                  </div>
                  <ul className="split-list">
                    {(activeStrategyModal.risks || []).map((risk, i) => (
                      <li key={i}>{risk}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Example Negotiation Dialogue */}
              {activeStrategyModal.example_dialogue && activeStrategyModal.example_dialogue.length > 0 && (
                <div className="modal-section">
                  <h3 className="section-title">Realistic Negotiation Dialogue</h3>
                  <div className="dialogue-box">
                    {activeStrategyModal.example_dialogue.map((turn, i) => (
                      <div key={i} className="dialogue-turn">
                        <div className="speaker-badge">{turn.speaker}</div>
                        <div className="dialogue-text">"{turn.text}"</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer CTA */}
            <div className="modal-footer">
              <button
                type="button"
                className="modal-secondary-btn"
                onClick={() => setActiveStrategyModal(null)}
              >
                Close
              </button>

              <button
                type="button"
                className="modal-ask-gemini-cta"
                onClick={() => {
                  const strat = activeStrategyModal;
                  setActiveStrategyModal(null);
                  handleOpenChat(strat);
                }}
              >
                <Sparkles size={16} />
                <span>Ask Gemini About This Strategy</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Gemini AI Doubt Assistant Centered Modal */}
      {isChatOpen && (
        <div className="chat-modal-backdrop" onClick={() => setIsChatOpen(false)}>
          <div
            className={`gemini-chat-modal ${isChatMaximized ? 'maximized' : ''}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="chat-modal-header">
              <div className="chat-header-main">
                <div className="chat-avatar-gemini">
                  <Sparkles size={18} />
                </div>
                <div>
                  <h3 className="chat-title">Gemini AI Doubt Assistant</h3>
                  <p className="chat-subtitle">Negotiation Strategy Tutor & Practice Advisor</p>
                </div>
              </div>

              <div className="chat-header-right">
                <button
                  type="button"
                  className="chat-maximize-btn"
                  onClick={() => setIsChatMaximized(!isChatMaximized)}
                  title={isChatMaximized ? 'Restore standard size' : 'Expand full view'}
                >
                  {isChatMaximized ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                </button>
                {chatMessages.length > 0 && (
                  <button
                    type="button"
                    className="chat-clear-btn"
                    onClick={() => {
                      setChatMessages([]);
                      setChatConversationId(null);
                    }}
                    title="Clear conversation"
                  >
                    <RotateCcw size={15} />
                  </button>
                )}
                <button
                  type="button"
                  className="chat-close-btn"
                  onClick={() => setIsChatOpen(false)}
                  title="Close chat"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

        {/* Selected Strategy Context Pill */}
        {chatStrategyContext && (
          <div className="chat-context-banner">
            <div className="context-left">
              <span className="context-label">Context Focus:</span>
              <strong className="context-name">{chatStrategyContext.title}</strong>
              <span className="context-cat">({chatStrategyContext.difficulty})</span>
            </div>
            <button
              type="button"
              className="context-remove-btn"
              onClick={() => setChatStrategyContext(null)}
              title="Remove strategy context for general negotiation questions"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Messages Stream */}
        <div className="chat-messages-container">
          {chatMessages.length === 0 ? (
            <div className="chat-welcome-state">
              <div className="welcome-icon-ring">
                <Sparkles size={28} />
              </div>
              <h4>Welcome to Negotiation AI Tutor</h4>
              <p>
                {chatStrategyContext
                  ? `Ask me how to implement ${chatStrategyContext.title}, see custom dialogue examples, or prepare counter-tactics.`
                  : 'Ask any questions about BATNA, ZOPA, counteroffers, anchoring, or handling difficult negotiators.'}
              </p>

              <div className="suggested-queries-box">
                <span className="suggested-heading">Suggested Questions:</span>
                <div className="suggested-chips">
                  {(chatStrategyContext
                    ? [
                        `How do I apply ${chatStrategyContext.title} in a salary negotiation?`,
                        `What are common counter-tactics against this?`,
                        `Give me a realistic example of this tactic in vendor pricing.`
                      ]
                    : SUGGESTED_QUESTIONS.slice(0, 5)
                  ).map((q, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className="suggested-chip-btn"
                      onClick={() => handleSendMessage(q)}
                    >
                      <span>{q}</span>
                      <ArrowRight size={12} />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            chatMessages.map((msg, index) => {
              const isAssistant = msg.role === 'assistant';
              return (
                <div
                  key={index}
                  className={`chat-message-row ${isAssistant ? 'assistant' : 'user'}`}
                >
                  <div className="message-bubble-wrapper">
                    <div className="message-bubble">
                      {isAssistant ? (
                        renderFormattedMarkdown(msg.content)
                      ) : (
                        <p className="user-text">{msg.content}</p>
                      )}
                    </div>

                    {isAssistant && (
                      <div className="message-action-bar">
                        <button
                          type="button"
                          className="msg-action-btn"
                          onClick={() => handleCopy(msg.content, index)}
                          title="Copy response"
                        >
                          {copiedIndex === index ? (
                            <>
                              <Check size={13} className="text-emerald-500" />
                              <span>Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy size={13} />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}

          {/* Thinking / Loading Animation */}
          {isChatLoading && (
            <div className="chat-message-row assistant">
              <div className="message-bubble-wrapper">
                <div className="message-bubble thinking-bubble">
                  <div className="pulsing-dots">
                    <span />
                    <span />
                    <span />
                  </div>
                  <span className="thinking-text">Gemini Tutor is reasoning...</span>
                </div>
              </div>
            </div>
          )}

          {chatError && (
            <div className="chat-error-banner">
              <AlertCircle size={15} />
              <span>{chatError}</span>
              <button type="button" className="retry-btn" onClick={handleRetry}>
                Retry
              </button>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Input Bar */}
        <div className="chat-input-bar">
          <textarea
            className="chat-textarea"
            rows={1}
            placeholder={
              chatStrategyContext
                ? `Ask about ${chatStrategyContext.title}... (Enter to send)`
                : 'Ask Gemini any negotiation question... (Enter to send)'
            }
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
          />
          <button
            type="button"
            className={`chat-send-btn ${chatInput.trim() && !isChatLoading ? 'active' : ''}`}
            disabled={!chatInput.trim() || isChatLoading}
            onClick={() => handleSendMessage()}
            title="Send inquiry (Enter)"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  )}
</div>
  );
}

