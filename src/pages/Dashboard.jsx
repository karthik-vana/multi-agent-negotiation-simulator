import React from 'react';
import { Bot, Sliders, Play, FileText, CheckCircle2 } from 'lucide-react';

const Dashboard = () => {
  return (
    <div>
      {/* Welcome & Overview Card */}
      <div className="content-card">
        <h2 className="card-title">Welcome to Multi-Agent Negotiation Simulator</h2>
        <p className="card-description">
          An autonomous AI-powered simulation and training platform designed to study multi-stakeholder
          negotiation dynamics. Autonomous LLM agents represent conflicting parties with customized goals,
          constraints, and distinct behavioral personalities.
        </p>

        {/* Introductory Workflow Card */}
        <div className="intro-grid">
          <div className="intro-item">
            <div className="intro-item-title">
              <Sliders size={16} style={{ color: '#4f46e5' }} />
              <span>1. Scenario Selection</span>
            </div>
            <p className="intro-item-desc">
              Select predefined negotiation templates (such as vendor pricing, job offers, or budget allocations) to initialize context and boundary conditions.
            </p>
          </div>

          <div className="intro-item">
            <div className="intro-item-title">
              <Bot size={16} style={{ color: '#06b6d4' }} />
              <span>2. Agent Configuration</span>
            </div>
            <p className="intro-item-desc">
              Review participating stakeholder roles and configure behavioral personalities (Aggressive, Collaborative, or Risk-Averse).
            </p>
          </div>

          <div className="intro-item">
            <div className="intro-item-title">
              <Play size={16} style={{ color: '#10b981' }} />
              <span>3. Live Negotiation Arena</span>
            </div>
            <p className="intro-item-desc">
              Observe autonomous AI-vs-AI turn-taking and concessions, or step in directly to negotiate in Practice Mode.
            </p>
          </div>
        </div>
      </div>

      {/* Task 1 Foundation Verification Card */}
      <div className="content-card" style={{ borderLeft: '4px solid #4f46e5' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <CheckCircle2 size={18} style={{ color: '#10b981' }} />
          <h3 style={{ fontSize: '1.05rem', fontWeight: 600 }}>Task 1: Shared Application Foundation Established</h3>
        </div>
        <p className="card-description" style={{ fontSize: '0.88rem' }}>
          This dashboard verifies the shared application layout, navigation shell, responsive sidebar,
          and global styling system. All downstream feature modules can now be implemented inside their
          designated placeholder routes without structural conflicts.
        </p>
      </div>
    </div>
  );
};

export default Dashboard;
