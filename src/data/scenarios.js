/**
 * Predefined Negotiation Scenario Templates & Agent Configurations
 * Shared data structure for:
 * 1. Scenario Selection Module
 * 2. Agent Configuration Module
 * 3. Dynamic Scenario-to-Agent Mapping
 */

export const PERSONALITIES = {
  AGGRESSIVE: 'Aggressive',
  COLLABORATIVE: 'Collaborative',
  RISK_AVERSE: 'Risk-Averse'
};

export const PERSONALITY_DESCRIPTIONS = {
  [PERSONALITIES.AGGRESSIVE]:
    'Firm on opening positions, makes minimal concessions, presses for maximum value, and challenges counterpart proposals.',
  [PERSONALITIES.COLLABORATIVE]:
    'Seeks win-win trade-offs, communicates transparently, explores creative package deals, and values relationship durability.',
  [PERSONALITIES.RISK_AVERSE]:
    'Prioritizes safety margins, avoids high-stakes deadlocks, favors guaranteed contractual terms, and concedes cautiously.'
};

export const SCENARIOS = [
  {
    id: 'vendor-pricing',
    name: 'Vendor Pricing Negotiation',
    category: 'Procurement & Sales',
    shortDescription:
      'Negotiate product pricing, purchasing terms, order quantities, and delivery conditions between a buyer and a vendor.',
    detailedDescription:
      'An enterprise procurement director meets with a vendor account executive to establish annual SaaS licensing, volume tiers, payment terms, and delivery SLA commitments.',
    iconName: 'ShoppingCart',
    accentColor: '#4f46e5',
    participantCount: 2,
    keyLevers: ['Unit Pricing', 'Order Volume', 'Payment Terms (Net 30/60)', 'Delivery SLA'],
    estimatedRounds: '8 - 12 Turns',
    complexity: 'Standard (2 Agents)',

    // Detailed Agent Definitions for Agent Configuration Screen
    agents: [
      {
        id: 'buyer-procurement',
        name: 'Procurement Director',
        stakeholder: 'Enterprise Buyer Organization',
        avatarText: 'PD',
        roleDescription:
          'Responsible for controlling corporate expenditure and securing reliable multi-year software contracts under budget.',
        primaryGoal:
          'Reduce total annual contract value from $120,000 to below $95,000, secure Net-60 payment terms, and lock in 99.9% uptime SLA.',
        keyConstraints: [
          'Hard budget ceiling of $100,000 max',
          'Payment terms must be Net-60 (cannot accept Net-30)',
          'Requires delivery and implementation within 4 weeks'
        ],
        defaultPersonality: PERSONALITIES.COLLABORATIVE,
        availablePersonalities: [
          PERSONALITIES.AGGRESSIVE,
          PERSONALITIES.COLLABORATIVE,
          PERSONALITIES.RISK_AVERSE
        ]
      },
      {
        id: 'vendor-sales',
        name: 'Enterprise Account Executive',
        stakeholder: 'SaaS Vendor Partner',
        avatarText: 'AE',
        roleDescription:
          'Represents the technology vendor aiming to maximize contract profitability, ensure recurring revenue, and minimize custom SLA penalties.',
        primaryGoal:
          'Close the contract above $110,000 with a 2-year commitment, upfront annual billing, and standard Net-30 payment terms.',
        keyConstraints: [
          'Cannot discount total contract below $90,000 without VP approval',
          'Cannot offer 99.99% custom SLA without dedicated support tier fee ($10,000)',
          'Prefers standard Net-30 payment cycle'
        ],
        defaultPersonality: PERSONALITIES.AGGRESSIVE,
        availablePersonalities: [
          PERSONALITIES.AGGRESSIVE,
          PERSONALITIES.COLLABORATIVE,
          PERSONALITIES.RISK_AVERSE
        ]
      }
    ]
  },
  {
    id: 'job-offer',
    name: 'Job Offer Negotiation',
    category: 'Talent & Human Resources',
    shortDescription:
      'Negotiate employment terms between a job candidate and an employer, including salary, benefits, joining date, and work arrangements.',
    detailedDescription:
      'A prospective Senior Staff AI Engineer discusses compensation trade-offs with the Hiring Director, balancing base salary expectations, stock equity vesting, sign-on bonus, and hybrid/remote flexibility.',
    iconName: 'Briefcase',
    accentColor: '#06b6d4',
    participantCount: 2,
    keyLevers: ['Base Salary', 'Equity Stock Grants', 'Sign-On Bonus', 'Remote Flexibility'],
    estimatedRounds: '6 - 10 Turns',
    complexity: 'Standard (2 Agents)',

    // Detailed Agent Definitions for Agent Configuration Screen
    agents: [
      {
        id: 'job-candidate',
        name: 'Senior AI Engineer Candidate',
        stakeholder: 'Prospective Employee',
        avatarText: 'CD',
        roleDescription:
          'Top-tier engineering talent with competing offers, seeking high market valuation, equity upside, and flexible working conditions.',
        primaryGoal:
          'Secure $175,000+ base salary, 0.25% equity stock grant with standard 4-year vesting, a $20,000 sign-on bonus, and full remote flexibility.',
        keyConstraints: [
          'Minimum acceptable base salary is $160,000 (deal-breaker)',
          'Will not accept more than 2 mandatory in-office days per week',
          'Must join no earlier than 60 days due to notice period'
        ],
        defaultPersonality: PERSONALITIES.COLLABORATIVE,
        availablePersonalities: [
          PERSONALITIES.AGGRESSIVE,
          PERSONALITIES.COLLABORATIVE,
          PERSONALITIES.RISK_AVERSE
        ]
      },
      {
        id: 'hiring-director',
        name: 'Hiring Director & Talent Lead',
        stakeholder: 'Hiring Organization',
        avatarText: 'HD',
        roleDescription:
          'Strives to attract key engineering leadership while respecting departmental salary bands, internal pay parity, and team co-location.',
        primaryGoal:
          'Onboard candidate within the approved salary band ($150,000 - $165,000 base), offer equity grant of 0.15% - 0.20%, and secure hybrid office presence.',
        keyConstraints: [
          'Strict salary ceiling of $168,000 base without board override',
          'Maximum sign-on bonus capped at $15,000',
          'Requires at least 2 days/week in-office presence for team mentorship'
        ],
        defaultPersonality: PERSONALITIES.RISK_AVERSE,
        availablePersonalities: [
          PERSONALITIES.AGGRESSIVE,
          PERSONALITIES.COLLABORATIVE,
          PERSONALITIES.RISK_AVERSE
        ]
      }
    ]
  },
  {
    id: 'project-budget',
    name: 'Project Budget Allocation',
    category: 'Corporate Strategy & Finance',
    shortDescription:
      'Negotiate how a limited project budget should be distributed among competing departments or project stakeholders.',
    detailedDescription:
      'Department heads convene to divide a fixed $1,000,000 capital pool across core cloud infrastructure, marketing customer acquisition, and strategic generative AI innovation.',
    iconName: 'PieChart',
    accentColor: '#10b981',
    participantCount: 3,
    keyLevers: ['Capital Share %', 'Priority Milestones', 'Headcount Quota', 'ROI Projections'],
    estimatedRounds: '10 - 15 Turns',
    complexity: 'Multi-Party (3 Agents)',

    // Detailed Agent Definitions for Agent Configuration Screen
    agents: [
      {
        id: 'vp-engineering',
        name: 'VP of Engineering',
        stakeholder: 'Core Infrastructure & Reliability',
        avatarText: 'ENG',
        roleDescription:
          'Protects architectural integrity, uptime SLAs, legacy tech debt retirement, and cloud scalability.',
        primaryGoal:
          'Secure at least 45% ($450,000) of the $1,000,000 budget to migrate database clusters and prevent potential high-load outages.',
        keyConstraints: [
          'Absolute minimum survival budget of $350,000 needed',
          'Cannot delay infrastructure upgrades past Q2',
          'Will not trade off security compliance funding'
        ],
        defaultPersonality: PERSONALITIES.RISK_AVERSE,
        availablePersonalities: [
          PERSONALITIES.AGGRESSIVE,
          PERSONALITIES.COLLABORATIVE,
          PERSONALITIES.RISK_AVERSE
        ]
      },
      {
        id: 'cmo-marketing',
        name: 'Chief Marketing Officer',
        stakeholder: 'Growth & Customer Acquisition',
        avatarText: 'MKT',
        roleDescription:
          'Drives quarterly revenue growth, top-of-funnel customer acquisition, paid ad spend, and brand positioning.',
        primaryGoal:
          'Secure 35% ($350,000) of budget for performance marketing campaigns, customer expansion, and conference activations.',
        keyConstraints: [
          'Needs a minimum of $250,000 to maintain competitive market share',
          'Demands committed launch dates before releasing funds'
        ],
        defaultPersonality: PERSONALITIES.AGGRESSIVE,
        availablePersonalities: [
          PERSONALITIES.AGGRESSIVE,
          PERSONALITIES.COLLABORATIVE,
          PERSONALITIES.RISK_AVERSE
        ]
      },
      {
        id: 'head-product-ai',
        name: 'Head of Product AI',
        stakeholder: 'Strategic AI Innovation',
        avatarText: 'AI',
        roleDescription:
          'Champions next-generation GenAI features, model fine-tuning, and automated negotiation research capabilities.',
        primaryGoal:
          'Secure 30% ($300,000) of budget to fund GPU compute clusters, domain evaluation benchmarks, and specialized AI engineer hires.',
        keyConstraints: [
          'Requires at least $200,000 to deliver committed MVP milestone',
          'Flexible on timeline if engineering provides shared GPU infrastructure'
        ],
        defaultPersonality: PERSONALITIES.COLLABORATIVE,
        availablePersonalities: [
          PERSONALITIES.AGGRESSIVE,
          PERSONALITIES.COLLABORATIVE,
          PERSONALITIES.RISK_AVERSE
        ]
      }
    ]
  }
];

/**
 * Helper to fetch a scenario by unique stable ID
 * @param {string} id
 * @returns {object|undefined}
 */
export const getScenarioById = (id) => {
  return SCENARIOS.find((scenario) => scenario.id === id);
};

/**
 * Returns all predefined scenarios
 * @returns {Array<object>}
 */
export const getAllScenarios = () => {
  return SCENARIOS;
};

export default SCENARIOS;
