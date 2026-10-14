import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Layers,
  Users,
  Swords,
  FileText,
  Settings,
  Search,
  LogOut,
  Sun
} from 'lucide-react';

const Sidebar = () => {
  return (
    <aside className="sidebar">
      {/* Brand Header */}
      <div className="sidebar-header">
        <div className="brand-wrapper">
          <div className="brand-logo">N</div>
          <div className="brand-title">Negotiator AI</div>
        </div>

        {/* Theme Pill Toggle (Visual indicator matching Deep UI design) */}
        <div className="theme-pill-toggle" title="Light mode active">
          <div className="theme-toggle-knob">
            <Sun size={11} />
          </div>
        </div>
      </div>

      {/* Search Input */}
      <div className="sidebar-search">
        <Search size={15} className="sidebar-search-icon" />
        <input
          type="text"
          placeholder="Search modules..."
          className="sidebar-search-input"
          readOnly
        />
      </div>

      {/* Navigation List */}
      <nav className="sidebar-nav">
        {/* Section 1: Main Menu */}
        <div className="nav-section-title">Main Menu</div>

        <NavLink
          to="/"
          end
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
        >
          <LayoutDashboard size={18} className="nav-icon" />
          <span>Dashboard</span>
          <span className="nav-badge">Overview</span>
        </NavLink>

        <NavLink
          to="/scenarios"
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
        >
          <Layers size={18} className="nav-icon" />
          <span>Scenarios</span>
          <span className="nav-badge">3</span>
        </NavLink>

        <NavLink
          to="/agents"
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
        >
          <Users size={18} className="nav-icon" />
          <span>Agent Configuration</span>
        </NavLink>

        {/* Section 2: Negotiation Execution */}
        <div className="nav-section-title">Simulation</div>

        <NavLink
          to="/arena"
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
        >
          <Swords size={18} className="nav-icon" />
          <span>Negotiation Arena</span>
          <span className="nav-badge nav-badge-pill">Live</span>
        </NavLink>

        <NavLink
          to="/history"
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
        >
          <FileText size={18} className="nav-icon" />
          <span>History & Reports</span>
        </NavLink>

        {/* Section 3: System */}
        <div className="nav-section-title">System</div>

        <NavLink
          to="/settings"
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
        >
          <Settings size={18} className="nav-icon" />
          <span>Settings</span>
        </NavLink>
      </nav>

      {/* Bottom Profile Footer (Exact match to Deep UI user card) */}
      <div className="sidebar-footer">
        <div className="user-card">
          <div className="user-profile">
            <div className="avatar-wrapper">
              <div className="user-avatar">TL</div>
              <span className="online-dot" />
            </div>
            <div className="user-details">
              <span className="user-name">Team Lead</span>
              <span className="user-email">lead@simulator.ai</span>
            </div>
          </div>
          <button className="user-action-btn" title="Session details" type="button">
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
