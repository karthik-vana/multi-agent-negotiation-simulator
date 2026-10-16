import React from 'react';
import './AgentFaceAvatar.css';

/**
 * Animated SVG Face Avatar tailored for each AI Agent Role
 */
const AgentFaceAvatar = ({ agentId, accentColor = '#4f46e5' }) => {
  // Render agent face based on agent ID
  switch (agentId) {
    /* =========================================================================
       1. Senior AI Engineer Candidate (job-candidate)
       Tech-savvy, stylish round glasses, expressive blinking eyes
       ========================================================================= */
    case 'job-candidate':
      return (
        <div
          className="agent-face-avatar-wrap"
          style={{
            '--face-accent-border': accentColor || '#0ea5e9',
            '--face-accent-bg': 'linear-gradient(135deg, #e0f2fe, #bae6fd)',
            '--face-accent-glow': 'rgba(14, 165, 233, 0.25)',
          }}
          title="Senior AI Engineer Candidate"
        >
          <svg viewBox="0 0 100 100" className="agent-face-svg">
            {/* Background Halo */}
            <circle cx="50" cy="50" r="48" fill="#e0f2fe" opacity="0.6" />

            {/* Neck & Tech Hoodie */}
            <path d="M 38 78 L 38 88 L 62 88 L 62 78 Z" fill="#fbcfe8" />
            <path d="M 22 100 Q 50 82 78 100 L 78 100 L 22 100 Z" fill="#0284c7" />
            <path d="M 40 86 L 50 96 L 60 86" stroke="#ffffff" strokeWidth="2" fill="none" />

            {/* Head Shape */}
            <ellipse cx="50" cy="52" rx="26" ry="30" fill="#fde68a" />
            {/* Ears */}
            <circle cx="23" cy="53" r="5" fill="#fcd34d" />
            <circle cx="77" cy="53" r="5" fill="#fcd34d" />

            {/* Modern Haircut */}
            <path
              d="M 24 45 C 24 24 40 20 54 20 C 68 20 78 28 78 44 C 74 38 68 34 56 34 C 44 34 32 38 24 45 Z"
              fill="#1e1b4b"
            />
            {/* Front Fringe */}
            <path d="M 34 30 Q 48 38 66 32 C 60 26 50 24 34 30 Z" fill="#312e81" />

            {/* Eyebrows */}
            <path d="M 34 42 Q 41 39 46 42" stroke="#1e1b4b" strokeWidth="2.5" strokeLinecap="round" className="agent-eyebrow" fill="none" />
            <path d="M 54 42 Q 59 39 66 42" stroke="#1e1b4b" strokeWidth="2.5" strokeLinecap="round" className="agent-eyebrow" fill="none" />

            {/* Glasses Frames */}
            <circle cx="40" cy="52" r="10" stroke="#0284c7" strokeWidth="3" fill="#ffffff" fillOpacity="0.4" />
            <circle cx="60" cy="52" r="10" stroke="#0284c7" strokeWidth="3" fill="#ffffff" fillOpacity="0.4" />
            <line x1="50" y1="52" x2="50" y2="52" stroke="#0284c7" strokeWidth="3" />
            <line x1="47" y1="52" x2="53" y2="52" stroke="#0284c7" strokeWidth="3" />

            {/* Glasses Lens Glare */}
            <path d="M 34 46 L 42 46" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" opacity="0.8" className="agent-glasses-shine" />
            <path d="M 54 46 L 62 46" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" opacity="0.8" className="agent-glasses-shine" />

            {/* Blinking Eyes inside glasses */}
            <g className="agent-eye-blink">
              <ellipse cx="40" cy="52" rx="3.5" ry="4" fill="#0f172a" />
              <circle cx="39" cy="50.5" r="1.2" fill="#ffffff" />
            </g>
            <g className="agent-eye-blink">
              <ellipse cx="60" cy="52" rx="3.5" ry="4" fill="#0f172a" />
              <circle cx="59" cy="50.5" r="1.2" fill="#ffffff" />
            </g>

            {/* Cute nose */}
            <path d="M 49 57 Q 50 60 52 59" stroke="#d97706" strokeWidth="1.8" strokeLinecap="round" fill="none" />

            {/* Friendly Smiling Mouth */}
            <path d="M 43 66 Q 50 73 57 66" stroke="#b45309" strokeWidth="2.5" strokeLinecap="round" fill="#ffffff" className="agent-mouth" />
          </svg>
          <span className="agent-live-dot" />
        </div>
      );

    /* =========================================================================
       2. Hiring Director (hiring-director)
       Polished, approachable leadership face, warm eyes, elegant hair
       ========================================================================= */
    case 'hiring-director':
      return (
        <div
          className="agent-face-avatar-wrap"
          style={{
            '--face-accent-border': accentColor || '#10b981',
            '--face-accent-bg': 'linear-gradient(135deg, #ecfdf5, #d1fae5)',
            '--face-accent-glow': 'rgba(16, 185, 129, 0.25)',
          }}
          title="Hiring Director"
        >
          <svg viewBox="0 0 100 100" className="agent-face-svg">
            <circle cx="50" cy="50" r="48" fill="#ecfdf5" opacity="0.6" />

            {/* Shoulders & Business Blazer */}
            <path d="M 22 100 Q 50 82 78 100 L 78 100 L 22 100 Z" fill="#065f46" />
            <polygon points="44,80 50,96 56,80" fill="#ffffff" />
            <path d="M 36 82 L 48 100 L 52 100 L 64 82" stroke="#047857" strokeWidth="2" fill="none" />

            {/* Head */}
            <ellipse cx="50" cy="50" rx="25" ry="28" fill="#fed7aa" />
            <circle cx="24" cy="51" r="4.5" fill="#fdba74" />
            <circle cx="76" cy="51" r="4.5" fill="#fdba74" />

            {/* Professional Styled Hair */}
            <path
              d="M 25 44 C 24 22 42 16 56 16 C 72 16 78 24 76 46 C 74 36 68 30 52 30 C 38 30 28 35 25 44 Z"
              fill="#451a03"
            />
            {/* Hair Side Volume */}
            <path d="M 24 40 Q 22 55 27 62 Q 29 48 27 40 Z" fill="#451a03" />
            <path d="M 76 40 Q 78 55 73 62 Q 71 48 73 40 Z" fill="#451a03" />

            {/* Eyebrows */}
            <path d="M 35 41 Q 42 38 46 41" stroke="#451a03" strokeWidth="2.2" strokeLinecap="round" className="agent-eyebrow" fill="none" />
            <path d="M 54 41 Q 58 38 65 41" stroke="#451a03" strokeWidth="2.2" strokeLinecap="round" className="agent-eyebrow" fill="none" />

            {/* Blinking Eyes */}
            <g className="agent-eye-blink">
              <ellipse cx="40" cy="49" rx="4" ry="4.5" fill="#1e293b" />
              <circle cx="39" cy="47.5" r="1.3" fill="#ffffff" />
              <path d="M 36 44 Q 40 43 44 44" stroke="#451a03" strokeWidth="1.5" strokeLinecap="round" fill="none" />
            </g>
            <g className="agent-eye-blink">
              <ellipse cx="60" cy="49" rx="4" ry="4.5" fill="#1e293b" />
              <circle cx="59" cy="47.5" r="1.3" fill="#ffffff" />
              <path d="M 56 44 Q 60 43 64 44" stroke="#451a03" strokeWidth="1.5" strokeLinecap="round" fill="none" />
            </g>

            {/* Soft Blush */}
            <ellipse cx="33" cy="56" rx="4" ry="2.5" fill="#fb7185" opacity="0.35" />
            <ellipse cx="67" cy="56" rx="4" ry="2.5" fill="#fb7185" opacity="0.35" />

            {/* Delicate Nose */}
            <path d="M 50 52 L 49 56 L 52 56" stroke="#ea580c" strokeWidth="1.5" strokeLinecap="round" fill="none" />

            {/* Warm Friendly Smile */}
            <path d="M 43 63 Q 50 71 57 63" stroke="#9a3412" strokeWidth="2.4" strokeLinecap="round" fill="#ffffff" className="agent-mouth" />
          </svg>
          <span className="agent-live-dot" />
        </div>
      );

    /* =========================================================================
       3. Procurement Director (buyer-procurement)
       Executive corporate negotiator, focused wireframe glasses, firm posture
       ========================================================================= */
    case 'buyer-procurement':
      return (
        <div
          className="agent-face-avatar-wrap"
          style={{
            '--face-accent-border': accentColor || '#4f46e5',
            '--face-accent-bg': 'linear-gradient(135deg, #eef2ff, #e0e7ff)',
            '--face-accent-glow': 'rgba(79, 70, 229, 0.25)',
          }}
          title="Procurement Director"
        >
          <svg viewBox="0 0 100 100" className="agent-face-svg">
            <circle cx="50" cy="50" r="48" fill="#eef2ff" opacity="0.6" />

            {/* Corporate Suit & Tie */}
            <path d="M 22 100 Q 50 82 78 100 L 78 100 L 22 100 Z" fill="#1e1b4b" />
            <polygon points="46,80 50,96 54,80" fill="#ffffff" />
            <polygon points="48,84 50,98 52,84" fill="#ef4444" />

            {/* Head */}
            <ellipse cx="50" cy="50" rx="25" ry="28" fill="#fde047" />
            <circle cx="24" cy="51" r="4.5" fill="#eab308" />
            <circle cx="76" cy="51" r="4.5" fill="#eab308" />

            {/* Executive Short Hair */}
            <path
              d="M 25 42 C 24 22 42 16 56 16 C 70 16 76 22 76 42 C 72 34 62 28 50 28 C 36 28 28 34 25 42 Z"
              fill="#18181b"
            />

            {/* Direct Eyebrows */}
            <path d="M 34 40 L 46 39" stroke="#18181b" strokeWidth="2.8" strokeLinecap="round" className="agent-eyebrow" />
            <path d="M 54 39 L 66 40" stroke="#18181b" strokeWidth="2.8" strokeLinecap="round" className="agent-eyebrow" />

            {/* Sleek Rectangular Glasses */}
            <rect x="30" y="44" width="17" height="13" rx="3" stroke="#4f46e5" strokeWidth="2.5" fill="#ffffff" fillOpacity="0.45" />
            <rect x="53" y="44" width="17" height="13" rx="3" stroke="#4f46e5" strokeWidth="2.5" fill="#ffffff" fillOpacity="0.45" />
            <line x1="47" y1="50" x2="53" y2="50" stroke="#4f46e5" strokeWidth="2.5" />

            {/* Eyes */}
            <g className="agent-eye-blink">
              <ellipse cx="38.5" cy="50.5" rx="3" ry="3.5" fill="#09090b" />
              <circle cx="37.5" cy="49.5" r="1" fill="#ffffff" />
            </g>
            <g className="agent-eye-blink">
              <ellipse cx="61.5" cy="50.5" rx="3" ry="3.5" fill="#09090b" />
              <circle cx="60.5" cy="49.5" r="1" fill="#ffffff" />
            </g>

            {/* Nose */}
            <path d="M 50 52 L 48 57 L 52 57" stroke="#ca8a04" strokeWidth="1.8" strokeLinecap="round" fill="none" />

            {/* Determined Composed Mouth */}
            <path d="M 42 66 Q 50 69 58 66" stroke="#854d0e" strokeWidth="2.6" strokeLinecap="round" fill="none" className="agent-mouth" />
          </svg>
          <span className="agent-live-dot" />
        </div>
      );

    /* =========================================================================
       4. Sales Account Executive (vendor-sales)
       High-energy, wide radiant smile, animated expression
       ========================================================================= */
    case 'vendor-sales':
      return (
        <div
          className="agent-face-avatar-wrap"
          style={{
            '--face-accent-border': accentColor || '#f97316',
            '--face-accent-bg': 'linear-gradient(135deg, #fff7ed, #ffedd5)',
            '--face-accent-glow': 'rgba(249, 115, 22, 0.25)',
          }}
          title="Sales Account Executive"
        >
          <svg viewBox="0 0 100 100" className="agent-face-svg">
            <circle cx="50" cy="50" r="48" fill="#fff7ed" opacity="0.6" />

            {/* Vibrant Smart Casual Shirt */}
            <path d="M 22 100 Q 50 82 78 100 L 78 100 L 22 100 Z" fill="#ea580c" />
            <polygon points="42,80 50,94 58,80" fill="#ffffff" />

            {/* Head */}
            <ellipse cx="50" cy="50" rx="25" ry="28" fill="#fed7aa" />
            <circle cx="24" cy="51" r="4.5" fill="#fdba74" />
            <circle cx="76" cy="51" r="4.5" fill="#fdba74" />

            {/* Wavy Dynamic Hair */}
            <path
              d="M 24 40 C 22 20 40 14 54 14 C 68 14 78 22 76 38 C 70 32 60 26 48 26 C 36 26 28 32 24 40 Z"
              fill="#7c2d12"
            />
            <path d="M 32 24 Q 44 18 56 22 Q 44 26 32 24 Z" fill="#9a3412" />

            {/* High Eyebrows */}
            <path d="M 33 39 Q 40 34 46 38" stroke="#7c2d12" strokeWidth="2.4" strokeLinecap="round" className="agent-eyebrow" fill="none" />
            <path d="M 54 38 Q 60 34 67 39" stroke="#7c2d12" strokeWidth="2.4" strokeLinecap="round" className="agent-eyebrow" fill="none" />

            {/* Large expressive blinking eyes */}
            <g className="agent-eye-blink">
              <ellipse cx="39" cy="48" rx="4.5" ry="5" fill="#0f172a" />
              <circle cx="37.5" cy="46" r="1.5" fill="#ffffff" />
            </g>
            <g className="agent-eye-blink">
              <ellipse cx="61" cy="48" rx="4.5" ry="5" fill="#0f172a" />
              <circle cx="59.5" cy="46" r="1.5" fill="#ffffff" />
            </g>

            {/* Friendly Nose */}
            <path d="M 50 51 Q 52 55 49 56" stroke="#c2410c" strokeWidth="2" strokeLinecap="round" fill="none" />

            {/* Broad Enthusiastic Smile */}
            <path d="M 39 63 Q 50 76 61 63 Z" fill="#ffffff" stroke="#9a3412" strokeWidth="2.2" className="agent-mouth" />
          </svg>
          <span className="agent-live-dot" />
        </div>
      );

    /* =========================================================================
       5. Engineering & Infrastructure Lead (department-a)
       Deep architect look, headset mic, sharp observant eyes
       ========================================================================= */
    case 'department-a':
      return (
        <div
          className="agent-face-avatar-wrap"
          style={{
            '--face-accent-border': accentColor || '#6366f1',
            '--face-accent-bg': 'linear-gradient(135deg, #eef2ff, #c7d2fe)',
            '--face-accent-glow': 'rgba(99, 102, 241, 0.25)',
          }}
          title="Engineering & Infrastructure Lead"
        >
          <svg viewBox="0 0 100 100" className="agent-face-svg">
            <circle cx="50" cy="50" r="48" fill="#eef2ff" opacity="0.6" />

            {/* Tech Polo / Jacket */}
            <path d="M 22 100 Q 50 82 78 100 L 78 100 L 22 100 Z" fill="#312e81" />
            <path d="M 44 82 L 50 96 L 56 82" stroke="#6366f1" strokeWidth="2.5" fill="#ffffff" />

            {/* Head */}
            <ellipse cx="50" cy="50" rx="25" ry="28" fill="#fbcfe8" />
            <circle cx="24" cy="51" r="4.5" fill="#f472b6" />
            <circle cx="76" cy="51" r="4.5" fill="#f472b6" />

            {/* Modern Haircut */}
            <path
              d="M 25 42 C 24 20 40 16 54 16 C 68 16 76 22 76 42 C 72 32 60 26 48 26 C 36 26 28 32 25 42 Z"
              fill="#1e293b"
            />

            {/* Headset Band & Mic */}
            <path d="M 23 48 C 22 24 78 24 77 48" stroke="#475569" strokeWidth="3" fill="none" />
            <circle cx="23" cy="48" r="4" fill="#6366f1" />
            <path d="M 23 50 Q 26 68 40 68" stroke="#475569" strokeWidth="2.5" fill="none" />
            <circle cx="41" cy="68" r="3" fill="#ef4444" />

            {/* Sharp Eyes */}
            <path d="M 35 41 L 45 40" stroke="#1e293b" strokeWidth="2.4" strokeLinecap="round" className="agent-eyebrow" />
            <path d="M 55 40 L 65 41" stroke="#1e293b" strokeWidth="2.4" strokeLinecap="round" className="agent-eyebrow" />

            <g className="agent-eye-blink">
              <ellipse cx="40" cy="49" rx="3.5" ry="4" fill="#0f172a" />
              <circle cx="39" cy="47.5" r="1.2" fill="#ffffff" />
            </g>
            <g className="agent-eye-blink">
              <ellipse cx="60" cy="49" rx="3.5" ry="4" fill="#0f172a" />
              <circle cx="59" cy="47.5" r="1.2" fill="#ffffff" />
            </g>

            {/* Nose */}
            <path d="M 50 53 L 49 57 L 52 57" stroke="#db2777" strokeWidth="1.6" strokeLinecap="round" fill="none" />

            {/* Confident Smile */}
            <path d="M 44 65 Q 50 70 56 65" stroke="#9d174d" strokeWidth="2.4" strokeLinecap="round" fill="none" className="agent-mouth" />
          </svg>
          <span className="agent-live-dot" />
        </div>
      );

    /* =========================================================================
       6. Product & Growth Lead (department-b)
       Modern product strategist, creative, bright smile
       ========================================================================= */
    case 'department-b':
      return (
        <div
          className="agent-face-avatar-wrap"
          style={{
            '--face-accent-border': accentColor || '#14b8a6',
            '--face-accent-bg': 'linear-gradient(135deg, #f0fdfa, #ccfbf1)',
            '--face-accent-glow': 'rgba(20, 184, 166, 0.25)',
          }}
          title="Product & Growth Lead"
        >
          <svg viewBox="0 0 100 100" className="agent-face-svg">
            <circle cx="50" cy="50" r="48" fill="#f0fdfa" opacity="0.6" />

            {/* Contemporary Collar */}
            <path d="M 22 100 Q 50 82 78 100 L 78 100 L 22 100 Z" fill="#0f766e" />
            <polygon points="44,80 50,92 56,80" fill="#ccfbf1" />

            {/* Head */}
            <ellipse cx="50" cy="50" rx="25" ry="28" fill="#fed7aa" />
            <circle cx="24" cy="51" r="4.5" fill="#fdba74" />
            <circle cx="76" cy="51" r="4.5" fill="#fdba74" />

            {/* Chic Swept Haircut */}
            <path
              d="M 23 44 C 22 20 44 14 62 16 C 76 18 78 30 76 44 C 70 34 56 26 44 28 C 32 30 26 36 23 44 Z"
              fill="#134e4a"
            />
            {/* Highlighting streak */}
            <path d="M 38 22 Q 54 20 66 26" stroke="#2dd4bf" strokeWidth="3" strokeLinecap="round" fill="none" />

            {/* Lively Eyebrows */}
            <path d="M 34 40 Q 40 36 46 40" stroke="#134e4a" strokeWidth="2.4" strokeLinecap="round" className="agent-eyebrow" fill="none" />
            <path d="M 54 39 Q 60 35 66 40" stroke="#134e4a" strokeWidth="2.4" strokeLinecap="round" className="agent-eyebrow" fill="none" />

            {/* Eyes */}
            <g className="agent-eye-blink">
              <ellipse cx="40" cy="48" rx="4" ry="4.5" fill="#042f2e" />
              <circle cx="38.5" cy="46.5" r="1.3" fill="#ffffff" />
            </g>
            <g className="agent-eye-blink">
              <ellipse cx="60" cy="48" rx="4" ry="4.5" fill="#042f2e" />
              <circle cx="58.5" cy="46.5" r="1.3" fill="#ffffff" />
            </g>

            {/* Soft Cheeks */}
            <ellipse cx="33" cy="55" rx="3.5" ry="2" fill="#fb7185" opacity="0.4" />
            <ellipse cx="67" cy="55" rx="3.5" ry="2" fill="#fb7185" opacity="0.4" />

            {/* Nose */}
            <path d="M 50 51 L 49 55 L 52 55" stroke="#ea580c" strokeWidth="1.6" strokeLinecap="round" fill="none" />

            {/* Playful Upbeat Smile */}
            <path d="M 42 63 Q 50 71 58 63" stroke="#9a3412" strokeWidth="2.4" strokeLinecap="round" fill="#ffffff" className="agent-mouth" />
          </svg>
          <span className="agent-live-dot" />
        </div>
      );

    /* =========================================================================
       Default Generic Intelligent AI Agent Face
       ========================================================================= */
    default:
      return (
        <div
          className="agent-face-avatar-wrap"
          style={{
            '--face-accent-border': accentColor || '#4f46e5',
            '--face-accent-bg': 'linear-gradient(135deg, #eef2ff, #c7d2fe)',
            '--face-accent-glow': 'rgba(79, 70, 229, 0.2)',
          }}
          title="Autonomous AI Agent"
        >
          <svg viewBox="0 0 100 100" className="agent-face-svg">
            <circle cx="50" cy="50" r="48" fill="#eef2ff" opacity="0.6" />
            <path d="M 22 100 Q 50 82 78 100 L 78 100 L 22 100 Z" fill="#4338ca" />
            <ellipse cx="50" cy="50" rx="25" ry="28" fill="#fde68a" />
            <path d="M 25 42 C 24 20 40 16 54 16 C 68 16 76 22 76 42 Z" fill="#1e1b4b" />
            <g className="agent-eye-blink">
              <ellipse cx="40" cy="50" rx="3.5" ry="4" fill="#0f172a" />
              <circle cx="39" cy="48.5" r="1.2" fill="#ffffff" />
            </g>
            <g className="agent-eye-blink">
              <ellipse cx="60" cy="50" rx="3.5" ry="4" fill="#0f172a" />
              <circle cx="59" cy="48.5" r="1.2" fill="#ffffff" />
            </g>
            <path d="M 43 64 Q 50 70 57 64" stroke="#b45309" strokeWidth="2.4" strokeLinecap="round" fill="none" />
          </svg>
          <span className="agent-live-dot" />
        </div>
      );
  }
};

export default AgentFaceAvatar;
