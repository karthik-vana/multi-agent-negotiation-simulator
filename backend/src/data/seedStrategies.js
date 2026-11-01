/**
 * Comprehensive Negotiation Strategy Library Seed Data
 * Covers all 10 standard negotiation categories with realistic dialogues,
 * pros/cons, ethics, and difficulty levels.
 */

const SEED_STRATEGIES = [
  {
    id: 'strat_batna',
    slug: 'batna',
    title: 'BATNA (Best Alternative to a Negotiated Agreement)',
    description: 'The standard against which any proposed agreement should be measured. Your strongest source of bargaining power.',
    category: 'Fundamental Negotiation Principles',
    difficulty: 'Beginner',
    best_use_case: 'Any negotiation where walking away is an option. Crucial during vendor procurement, job compensation, and real estate purchases.',
    advantages: [
      'Prevents accepting an unfavorable or exploitative deal',
      'Provides clear walk-away point and psychological confidence',
      'Protects against emotional decision-making under pressure'
    ],
    risks: [
      'Overestimating your alternative creates false arrogance',
      'Prematurely revealing your BATNA weakens your leverage if it is mediocre'
    ],
    example_dialogue: [
      { speaker: 'Candidate', text: 'Thank you for the ₹1,50,000 offer. Given my verified concurrent offer at ₹1,68,000 with remote flexibility, I would need us to reach ₹1,65,000 to sign immediately.' },
      { speaker: 'Hiring Director', text: 'Understood. Since your technical score is top-tier, let us adjust the base to ₹1,62,000 plus an ₹8,000 signing incentive.' }
    ],
    recommended_scenarios: ['job-offer', 'vendor-pricing', 'project-budget']
  },
  {
    id: 'strat_zopa',
    slug: 'zopa',
    title: 'ZOPA (Zone of Possible Agreement)',
    description: 'The overlapping range between buyer reservation price (maximum willingness to pay) and seller reservation price (minimum willingness to accept).',
    category: 'Fundamental Negotiation Principles',
    difficulty: 'Beginner',
    best_use_case: 'Early stage diagnostics in pricing, budget allocations, and contractual milestones to assess deal feasibility.',
    advantages: [
      'Quickly identifies whether an agreement is mathematically feasible',
      'Directs focus on extracting surplus rather than fighting zero-sum battles',
      'Prevents wasted cycles when a negative ZOPA exists'
    ],
    risks: [
      'Parties often camouflage their true reservation boundaries',
      'Assuming an overlap exists when the cultural or terms gap is too wide'
    ],
    example_dialogue: [
      { speaker: 'Procurement Buyer', text: 'Our upper limit authorized for annual licensing is ₹1,05,000.' },
      { speaker: 'Enterprise Supplier', text: 'Our strict cost floor is ₹96,000. Since ₹96,000 to ₹1,05,000 is our shared zone, let us explore service levels to settle at ₹1,01,000.' }
    ],
    recommended_scenarios: ['vendor-pricing', 'project-budget']
  },
  {
    id: 'strat_anchoring',
    slug: 'anchoring',
    title: 'First-Offer Anchoring',
    description: 'Establishing a well-justified opening numerical or contractual marker that pulls the bargaining midpoint toward your objective.',
    category: 'Bargaining and Counteroffers',
    difficulty: 'Intermediate',
    best_use_case: 'When market data is ambiguous or when you possess superior information regarding asset value or replacement cost.',
    advantages: [
      'Exploits the cognitive anchoring bias to tilt the negotiation corridor',
      'Forces the counterparty to adjust relative to your starting frame',
      'Establishes high aspiration levels backed by objective metrics'
    ],
    risks: [
      'An absurdly aggressive anchor damages trust or causes counterparty walkaway',
      'Requires plausible market rationale to avoid being dismissed as bad faith'
    ],
    example_dialogue: [
      { speaker: 'Sales Account Exec', text: 'Based on Gartner category benchmarks and 99.9% uptime SLA, standard enterprise deployment is ₹1,20,000.' },
      { speaker: 'Procurement Director', text: 'We acknowledge your enterprise tier, but for our seat volume, industry average sits at ₹95,000. Let us discuss volume discounts.' }
    ],
    recommended_scenarios: ['vendor-pricing', 'job-offer']
  },
  {
    id: 'strat_active_listening',
    slug: 'active-listening',
    title: 'Active Listening & Tactical Empathy',
    description: 'Demonstrating deep comprehension of the counterparty’s emotional drivers, constraints, and unstated priorities using mirroring and labeling.',
    category: 'Persuasion and Influence',
    difficulty: 'Beginner',
    best_use_case: 'High-friction negotiations, contentious partnerships, and resolving customer escalations.',
    advantages: [
      'De-escalates hostility and builds genuine rapport',
      'Uncovers hidden constraints and non-monetary value items',
      'Low cost, high psychological yield'
    ],
    risks: [
      'Can feel patronizing if delivered formulaically without authenticity',
      'Listening does not mean conceding; maintain clear boundaries'
    ],
    example_dialogue: [
      { speaker: 'Lead Architect', text: 'It seems like your primary concern isn’t the headline rate, but guaranteeing that delivery doesn’t slip into Q3.' },
      { speaker: 'Product Director', text: 'Exactly. If we miss the July launch, the engineering cost exceeds any 5% vendor discount.' }
    ],
    recommended_scenarios: ['project-budget', 'job-offer']
  },
  {
    id: 'strat_conditional_concessions',
    slug: 'conditional-concessions',
    title: 'Conditional Concessions (If-Then Bargaining)',
    description: 'Never conceding on price or terms without extracting an explicit, reciprocal value item in return ("If you can do X, then I can agree to Y").',
    category: 'Bargaining and Counteroffers',
    difficulty: 'Intermediate',
    best_use_case: 'Counteroffer exchanges when protecting margins, scope creep, or timeline concessions.',
    advantages: [
      'Protects against unilateral erosion of value',
      'Teaches the counterparty that concessions have real cost',
      'Creates integrative trade-offs dynamically'
    ],
    risks: [
      'Can cause gridlock if demands are disproportionate',
      'Requires knowing the relative cost-benefit of each traded variable'
    ],
    example_dialogue: [
      { speaker: 'Enterprise Supplier', text: 'If you can commit to a 24-month contract and quarterly upfront payment, then we can reduce unit rates to ₹98,000.' },
      { speaker: 'Procurement Buyer', text: 'We can accept the 24-month duration if Net-60 terms are preserved.' }
    ],
    recommended_scenarios: ['vendor-pricing', 'project-budget']
  },
  {
    id: 'strat_value_creation',
    slug: 'value-creation',
    title: 'Value Creation & Integrative Logrolling',
    description: 'Trading issues of low cost to you but high value to the other party to expand the overall surplus before dividing it.',
    category: 'Win-Win Negotiation',
    difficulty: 'Intermediate',
    best_use_case: 'Multi-issue commercial contracts, joint ventures, and executive hiring packages.',
    advantages: [
      'Converts zero-sum conflict into mutually beneficial outcomes',
      'Generates higher joint satisfaction and lower post-deal regret',
      'Strengthens long-term business relationships'
    ],
    risks: [
      'Counterparty may pocket non-monetary perks and continue pressing on price',
      'Requires transparent information sharing which exposes vulnerability'
    ],
    example_dialogue: [
      { speaker: 'Recruiter', text: 'While our salary ceiling is ₹1,60,000, we can add 0.5% equity acceleration and an annual ₹15,000 continuous learning stipend.' },
      { speaker: 'Job Candidate', text: 'That equity and education package provides immense value to me. With that in place, ₹1,60,000 works.' }
    ],
    recommended_scenarios: ['job-offer', 'project-budget', 'vendor-pricing']
  },
  {
    id: 'strat_package_deals',
    slug: 'package-deals',
    title: 'Package Deals (Multi-Issue Bundling)',
    description: 'Negotiating multiple contractual clauses simultaneously as a linked bundle rather than debating item-by-item.',
    category: 'Win-Win Negotiation',
    difficulty: 'Intermediate',
    best_use_case: 'Complex commercial agreements involving pricing, SLAs, payment terms, delivery timelines, and intellectual property.',
    advantages: [
      'Prevents getting boxed in on single contentious points',
      'Enables rapid trades across different dimensions',
      'Shortens overall negotiation rounds'
    ],
    risks: [
      'Can overwhelm inexperienced negotiators with too many variables',
      'Requires strong analytical tracking of total package value'
    ],
    example_dialogue: [
      { speaker: 'Procurement Lead', text: 'We propose Package A: ₹97,000 base, 99.9% uptime SLA, and Net-45 days. Alternatively, Package B: ₹1,02,000 base with 24/7 dedicated support and Net-30.' },
      { speaker: 'Vendor Rep', text: 'Package A is workable for our operations team provided warranty is 12 months.' }
    ],
    recommended_scenarios: ['vendor-pricing', 'project-budget']
  },
  {
    id: 'strat_objective_criteria',
    slug: 'objective-criteria',
    title: 'Objective Criteria & Benchmark Standards',
    description: 'Grounding proposals and arguments in verifiable external metrics, published market rates, legal precedent, or industry standards.',
    category: 'Fundamental Negotiation Principles',
    difficulty: 'Beginner',
    best_use_case: 'Depersonalizing tough negotiations, budget approvals, and resolving disputes with stubborn counterparts.',
    advantages: [
      'Shifts the debate from a battle of wills to a search for fair standards',
      'Harder for counterparts to reject without looking unreasonable',
      'Preserves professional relationships during disputes'
    ],
    risks: [
      'Both sides may cherry-pick competing benchmarks (e.g. conflicting salary surveys)',
      'Benchmark data may not perfectly fit custom specifications'
    ],
    example_dialogue: [
      { speaker: 'Engineering Manager', text: 'According to Radford and Levels.fyi P75 benchmarks for Senior ML Engineers in our metro, market compensation is ₹1,65,000.' },
      { speaker: 'HR Comp Committee', text: 'Reviewing the Radford P75 numbers, we see that is accurate. We will calibrate our offer band accordingly.' }
    ],
    recommended_scenarios: ['job-offer', 'project-budget']
  },
  {
    id: 'strat_strategic_questioning',
    slug: 'strategic-questioning',
    title: 'Strategic Questioning & Calibrated Inquiries',
    description: 'Using open-ended "What" and "How" questions that compel the counterparty to solve your problem without provoking defensiveness.',
    category: 'Persuasion and Influence',
    difficulty: 'Intermediate',
    best_use_case: 'Overcoming unilateral demands, resistance, or when facing restrictive corporate policies.',
    advantages: [
      'Gives the counterparty an illusion of control while steering the agenda',
      'Uncovers the real reasoning behind arbitrary objections',
      'Transforms resistance into collaborative problem-solving'
    ],
    risks: [
      'Can be seen as evasive if you never take a firm position',
      'Requires patience and active moderation'
    ],
    example_dialogue: [
      { speaker: 'Client Lead', text: 'How are we supposed to meet the Q3 regulatory audit if external vendor onboarding is capped at 6 weeks?' },
      { speaker: 'Procurement Director', text: 'Good question. If we fast-track internal security clearance, we can compress the vendor review to 2 weeks.' }
    ],
    recommended_scenarios: ['project-budget', 'vendor-pricing']
  },
  {
    id: 'strat_deadlock_breaking',
    slug: 'deadlock-breaking',
    title: 'Deadlock Breaking & Process Reframing',
    description: 'Techniques to overcome an impasse: introducing contingent contracts, setting aside thorny issues temporarily, or changing the participants.',
    category: 'Deadlock Resolution',
    difficulty: 'Advanced',
    best_use_case: 'When negotiations have completely stalled on price or risk liability after multiple consecutive rounds.',
    advantages: [
      'Rescues valuable deals on the brink of termination',
      'Aligns future incentives through milestone or performance-based pay',
      'Breaks emotional deadlock by resetting negotiation cadence'
    ],
    risks: [
      'Contingent contracts require unambiguous metrics to avoid future litigation',
      'Setting issues aside risks running out of time later'
    ],
    example_dialogue: [
      { speaker: 'Product VP', text: 'Since we are deadlocked between ₹1,00,000 and ₹1,15,000, let us agree on ₹1,02,000 base with an additional ₹13,000 performance bonus tied directly to achieving 99.95% system uptime.' },
      { speaker: 'Vendor VP', text: 'That performance-tied structure works for us because we are confident in our engineering.' }
    ],
    recommended_scenarios: ['vendor-pricing', 'project-budget', 'job-offer']
  },
  {
    id: 'strat_reservation_price',
    slug: 'reservation-price-discipline',
    title: 'Reservation Price Discipline',
    description: 'Establishing and strictly adhering to the exact mathematical threshold beyond which you will walk away from the table.',
    category: 'Bargaining and Counteroffers',
    difficulty: 'Beginner',
    best_use_case: 'Financial risk management, high-stakes asset procurement, and auction scenarios.',
    advantages: [
      'Protects against the Winner’s Curse and auction fever',
      'Ensures deals generate economic profit or value surplus',
      'Removes impulsive emotional capitulation'
    ],
    risks: [
      'Rigid inflexibility if market fundamentals or scope change during talks',
      'Walking away from good deals if reservation calculation was overly pessimistic'
    ],
    example_dialogue: [
      { speaker: 'Buyer', text: 'Our strict board-approved walkaway ceiling is ₹1,00,000 per unit. If ₹1,05,000 is your final word, we will respectfully activate our secondary vendor.' },
      { speaker: 'Supplier', text: 'Wait — if we exclude the on-site training module, we can bring the unit price to ₹99,500.' }
    ],
    recommended_scenarios: ['vendor-pricing', 'project-budget']
  },
  {
    id: 'strat_nibble_defense',
    slug: 'the-nibble-defense',
    title: 'The Nibble & Incremental Defense',
    description: 'Recognizing when a counterparty seeks small concessions right before signature, and neutralizing it courteously without unraveling the agreement.',
    category: 'Conflict Resolution',
    difficulty: 'Advanced',
    best_use_case: 'Final contracting stage when the other side asks for "just one more small thing" like free shipping or extended warranty.',
    advantages: [
      'Protects deal economics from end-of-game erosion',
      'Maintains commercial dignity and boundaries',
      'Can reopen other terms reciprocally if they persist'
    ],
    risks: [
      'Overreacting to an innocent minor inquiry can look petty',
      'Requires polite firmness ("Of course we can add that, and for that we would just adjust the unit price by 2%")'
    ],
    example_dialogue: [
      { speaker: 'Client', text: 'We are ready to sign! You will throw in 6 months of 24/7 weekend phone support at no charge, right?' },
      { speaker: 'Account Exec', text: 'We would love to provide weekend support! Our standard weekend add-on is ₹10,000, or we can trade that for net-15 payment terms. Which do you prefer?' }
    ],
    recommended_scenarios: ['vendor-pricing', 'job-offer']
  },
  {
    id: 'strat_salary_equity_tradeoff',
    slug: 'salary-equity-tradeoff',
    title: 'Salary vs. Equity & Benefits Optimization',
    description: 'Balancing liquid fixed compensation with long-term equity upside, remote flexibility, and performance bonuses.',
    category: 'Salary and Job Offer Negotiation',
    difficulty: 'Intermediate',
    best_use_case: 'Tech, startup, and executive employment agreements with budget caps.',
    advantages: [
      'Overcomes departmental salary budget bands by tapping alternative budgets',
      'Aligns candidate’s long-term wealth creation with company valuation growth',
      'Tailors offer to personal tax and risk preferences'
    ],
    risks: [
      'Equity valuation carries liquidity risk and vesting cliffs',
      'Requires clear capitalization table transparency'
    ],
    example_dialogue: [
      { speaker: 'Candidate', text: 'If ₹1,55,000 is the hard ceiling for the L5 engineering band, could we add 0.25% stock options and a guaranteed 6-month performance review cycle?' },
      { speaker: 'Hiring Director', text: 'Yes, our equity pool has flexibility for that senior designation. Let us formulate that addendum.' }
    ],
    recommended_scenarios: ['job-offer']
  },
  {
    id: 'strat_vendor_sla_tradeoff',
    slug: 'vendor-sla-tradeoff',
    title: 'Vendor Tiering & SLA Trade-Offs',
    description: 'Deconstructing vendor pricing into software licenses, implementation, uptime SLA penalties, and support response times.',
    category: 'Vendor and Business Negotiation',
    difficulty: 'Intermediate',
    best_use_case: 'SaaS, cloud infrastructure, and IT managed services procurement.',
    advantages: [
      'Dissects vendor margin drivers to find non-critical cost elements',
      'Allows cutting price without hurting fundamental product capabilities',
      'Creates measurable accountability through service credits'
    ],
    risks: [
      'Accepting too low an SLA can jeopardize mission-critical operations',
      'Requires engineering buy-in on acceptable risk thresholds'
    ],
    example_dialogue: [
      { speaker: 'Procurement Lead', text: 'We do not require the 15-minute response SLA for staging environments. Downgrading to standard 4-hour SLA on non-prod saves us ₹14,000 annually.' },
      { speaker: 'Vendor Account Rep', text: 'That adjustment fits our support matrix nicely. We will re-issue the quotation at ₹94,000.' }
    ],
    recommended_scenarios: ['vendor-pricing']
  },
  {
    id: 'strat_tripartite_budget',
    slug: 'tripartite-budget-tradeoffs',
    title: 'Cross-Department Budget Allocation & Trade-offs',
    description: 'Negotiating shared project budgets among competing internal stakeholders by linking funding to shared KPIs and milestones.',
    category: 'Project Budget Allocation',
    difficulty: 'Advanced',
    best_use_case: 'Enterprise annual budgeting, inter-departmental resource allocation, and program management.',
    advantages: [
      'Eliminates siloed department infighting',
      'Ensures organizational capital flows to highest ROI initiatives',
      'Builds cross-functional coalitions'
    ],
    risks: [
      'Department heads may engage in political maneuvering or posturing',
      'Requires transparent accounting of headcount and resource usage'
    ],
    example_dialogue: [
      { speaker: 'Product Lead', text: 'If Marketing co-funds ₹40,000 of the customer portal revamp, Engineering will dedicate two frontend developers to the marketing automation integrations in Q2.' },
      { speaker: 'Marketing VP', text: 'Agreed. That integration will double our conversion funnel efficiency, justifying our departmental contribution.' }
    ],
    recommended_scenarios: ['project-budget']
  },
  {
    id: 'strat_multi_agent_coalition',
    slug: 'multi-agent-coalition',
    title: 'Multi-Agent Coalition & Consensus Building',
    description: 'Forming strategic alignments among multiple stakeholders in n-party negotiations to create an irresistible consensus block.',
    category: 'Advanced Multi-Agent Strategies',
    difficulty: 'Advanced',
    best_use_case: 'Multi-party consortiums, steering committees, shareholder voting, and multi-vendor partnerships.',
    advantages: [
      'Multiplies bargaining leverage against isolated dominant parties',
      'Creates stable majorities that speed up collective decision-making',
      'Distributes negotiation risk across coalition members'
    ],
    risks: [
      'Coalition partners may break ranks or make side-deals',
      'Requires continuous governance and communication overhead'
    ],
    example_dialogue: [
      { speaker: 'Stakeholder A', text: 'If we unite our three functional divisions behind a unified ₹2,50,000 enterprise platform, the vendor cannot play our departments against each other for individual licenses.' },
      { speaker: 'Stakeholder B', text: 'Agreed. By presenting a single collective purchasing block, we secure Tier 1 enterprise volume pricing.' }
    ],
    recommended_scenarios: ['project-budget', 'vendor-pricing']
  }
];

module.exports = {
  SEED_STRATEGIES
};

