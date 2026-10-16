# Multi-Agent Negotiation Simulator

An AI-powered negotiation simulation and training platform designed to model, study, and practice real-world multi-stakeholder negotiations using autonomous intelligent agents.

[![React](https://img.shields.io/badge/React-19.0.0-blue.svg)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6.4.4-646CFF.svg)](https://vitejs.dev/)
[![React Router](https://img.shields.io/badge/React_Router-7.3.0-CA4245.svg)](https://reactrouter.com/)
[![Tests](https://img.shields.io/badge/Unit_Tests-21%20Passed-10b981.svg)](#running-tests)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## Table of Contents

- [Project Description](#project-description)
- [Task 1: Scenario Selection & Agent Configuration](#task-1-scenario-selection--agent-configuration)
  - [Module Overview](#module-overview)
  - [Sequential 3-Step Simulation Workflow](#sequential-3-step-simulation-workflow)
  - [Implemented Deliverables](#implemented-deliverables)
- [Team Task Division](#team-task-division)
- [Features](#features)
  - [Completed Features (Task 1)](#completed-features-task-1)
  - [Planned Features (Downstream Tasks)](#planned-features-downstream-tasks)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Installation and Setup](#installation-and-setup)
- [Environment Variables](#environment-variables)
- [Running the Application](#running-the-application)
- [Running Tests](#running-tests)
- [Project Structure](#project-structure)
- [Configuration Validation Engine](#configuration-validation-engine)
- [Available Scripts](#available-scripts)
- [Troubleshooting](#troubleshooting)
- [About & Team](#about--team)

---

## Project Description

Negotiation is a core competency across business operations, contract discussions, procurement, hiring, and cross-functional resource distribution. However, mastering negotiation skills is challenging due to the scarcity of realistic, scalable, and repeatable practice environments.

The **Multi-Agent Negotiation Simulator (Negotiator AI)** provides a web-based platform where autonomous Generative AI agents represent distinct stakeholders with conflicting objectives, strict boundary constraints, and configurable behavioral personalities. Agents exchange contextually reasoned offers and counteroffers, evaluate concessions, and work toward mutually agreeable outcomes.

---

## Task 1: Scenario Selection & Agent Configuration

### Module Overview
Task 1 establishes the operational context, stakeholder boundary definitions, and agent personality configuration before starting an autonomous negotiation. It guarantees that any negotiation payload handed over to downstream LLM orchestrators is mathematically feasible and structurally complete.

### Sequential 3-Step Simulation Workflow
```
[ Step 1: Scenario Selection ] ➔ [ Step 2: Agent Configuration ] ➔ [ Step 3: AI Negotiation Arena ]
   • Choose Business Domain         • Inspect Stakeholder Bio         • Real-time LLM Bargaining
   • Inspect Core Levers            • Review Primary Goals            • Concession Curves
   • Selection Validation           • Review Constraints              • Outcome Analytics
                                    • Select Personality
                                    • Configuration Validation
```

### Implemented Deliverables

1. **Scenario Selection Module (`/scenarios`):**
   - **Vendor Pricing Negotiation:** B2B enterprise software procurement between Alex Rivers (Procurement Lead) and Marcus Chen (Enterprise Sales VP). Core levers: price per license, minimum order volume, contract tenure, SLA terms.
   - **Job Offer Negotiation:** Talent compensation bargaining between Sarah Jenkins (Hiring Manager) and David Park (Senior Candidate). Core levers: base salary, equity percentage, sign-on bonus, remote work policy.
   - **Project Budget Allocation:** 3-party resource bargaining between Elena Rostova (Engineering Lead), Marcus Vance (Product Lead), and Priya Sharma (Finance Director). Core levers: infrastructure budget, product feature allocation, contingency reserves.
   - **Card Interaction:** High-resolution domain illustrations, category tags, participant counts, turn estimates, negotiation levers, selection highlight, toggle-to-deselect, and navigation guards.

2. **Agent Configuration Interface (`/agents`):**
   - **Agent Role Cards:** Displays stakeholder bio, animated SVG face avatar, highlighted **Primary Goal** container, and bulleted **Key Constraints** container.
   - **3 Strategic Personality Profiles:**
     - 🔴 **Aggressive:** Firm on price targets, highly resistant to early concessions, aims for maximum individual surplus.
     - 🟢 **Collaborative:** Win-win mindset, explores multi-issue package trade-offs, flexible on secondary terms.
     - 🟡 **Risk-Averse:** Prioritizes compliance, stability guarantees, risk-mitigation terms, and dispute penalties.
   - **Dynamic Feedback:** Instant behavioral descriptions update live as users customize personalities, with visual tracking for *Default* vs. *Custom* states.

3. **Scenario-to-Agent Mapping & Validation Engine (`configurationValidator.js`):**
   - Automatically maps selected scenario IDs to their corresponding agent personas, parameters, and default traits.
   - Enforces pre-flight validation preventing simulation launch if scenarios, roles, constraints, or personalities are invalid.
   - Prepares clean, serialized JSON configuration payloads for the downstream orchestrator (`prepareNegotiationConfig`).

---

## Team Task Division

| Team Member | Module / Responsibility | Key Deliverables |
| :--- | :--- | :--- |
| **Niharika Indurthi** | **Scenario Selection UI** | Scenario selection screen, 3 scenario cards, selection logic, toggle deselect, and navigation routing. |
| **Saitejaswini Tammana** | **Scenario Data & Agent Templates** | Centralized data models (`scenarios.js`), agent bios, goal targets, parameter boundaries, and constraints. |
| **Keerthana** | **Agent Configuration UI** | Agent role cards, primary goal & constraint boxes, and 3-way personality selection controls. |
| **Karthik Vana** | **Configuration Validation Logic** | Pre-flight validation rules (`configurationValidator.js`), schema verification, and boundary integrity checks. |
| **Shubhay Yadav** | **Integration, Avatars & Polish** | Animated SVG face avatars, 6-language localization, mobile responsiveness, test suite, and PR integration. |

---

## Features

### Completed Features (Task 1)

* **Pre-Built Negotiation Scenarios:** 3 fully populated templates (*Vendor Pricing*, *Job Offer*, *Project Budget Allocation*).
* **Agent Role Cards with Animated Avatars:** Interactive SVG face avatars with dynamic expressions and breathing micro-animations.
* **3 Personality Selectors:** Aggressive, Collaborative, and Risk-Averse controls with dynamic behavioral previews.
* **Configuration Validation Gate:** Real-time validation banner checking scenario integrity, agent completeness, goals, constraints, and personality enums.
* **Automated Test Suite:** 21 unit tests covering schema validation and edge-case handling with 100% pass rates.
* **Full-Width Modern Layout:** Clean SaaS interface adhering to WCAG contrast standards.
* **Multi-Language Support (i18n):** Complete localization across 6 languages (**English, Hindi, Bengali, Telugu, Tamil, Marathi**).
* **Responsive Mobile Experience:** Touch-friendly slide-out drawer, navigation back controls, and responsive grid layouts.

### Planned Features (Downstream Tasks)

* [ ] Turn-taking Orchestrator Agent to manage conversational state and detect deadlocks.
* [ ] LLM-powered offer generation and concession decision modules (OpenAI, Gemini, Anthropic).
* [ ] Chat-style Negotiation Arena with turn-by-turn reasoning and live stance indicators.
* [ ] Interactive Human vs. AI Practice Mode.
* [ ] Final outcome evaluation screen with concession curves, Pareto efficiency scoring, and downloadable transcripts.

---

## Tech Stack

| Technology | Category | Purpose |
| :--- | :--- | :--- |
| **React 19** | Frontend Framework | Component-driven declarative UI architecture |
| **Vite 6** | Build Tool & Dev Server | Fast Hot Module Replacement (HMR) and optimized bundling |
| **React Router 7** | Client-Side Routing | Multi-step workflow navigation without page reloads |
| **Lucide React** | Icon System | Modern SVG icons throughout the interface |
| **Node Test Runner** | Unit Testing | Native Node.js test suite for configuration validation |
| **Vanilla CSS** | Styling System | Custom CSS variables, responsive breakpoints, and animations (`index.css`) |

---

## Prerequisites

Verify that the following tools are installed on your machine:

* **Node.js:** `v18.0.0` or higher (tested on `v20+` / `v24+`)
* **npm:** `v9.0.0` or higher
* **Git:** Installed and configured

Verify versions by running:
```bash
node -v
npm -v
git --version
```

---

## Quick Start

Get the application running locally in four commands:

```bash
# 1. Clone the repository
git clone https://github.com/karthik-vana/multi-agent-negotiation-simulator.git

# 2. Navigate to the frontend directory
cd multi-agent-negotiation-simulator/frontend

# 3. Install dependencies
npm install

# 4. Start the development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Installation and Setup

### 1. Clone the Repository
```bash
git clone https://github.com/karthik-vana/multi-agent-negotiation-simulator.git
```

### 2. Navigate to Frontend Directory
```bash
cd multi-agent-negotiation-simulator/frontend
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Set Up Environment Variables (Firebase Authentication)
Copy the provided environment template:
```bash
cp .env.example .env
```

---

## Environment Variables

The application uses **Firebase Authentication** for user accounts, profile details, and session management.

Create a `.env` file in the `frontend/` directory (you can copy from `frontend/.env.example`):

```bash
cd frontend
cp .env.example .env
```

### Required Firebase Configuration Keys:

| Variable | Description | Example / Location |
| :--- | :--- | :--- |
| `VITE_FIREBASE_API_KEY` | Firebase Web API Key | Firebase Console > Project Settings |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase Authentication Domain | `your-project.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | Firebase Project Identifier | `your-project-id` |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase Storage Bucket | `your-project.firebasestorage.app` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Cloud Messaging Sender ID | Numeric project sender ID |
| `VITE_FIREBASE_APP_ID` | Firebase Web Application ID | `1:xxx:web:xxx` |
| `VITE_FIREBASE_MEASUREMENT_ID` | Google Analytics Measurement ID (optional) | `G-XXXXXXXXXX` |

> **Local Fallback:** If Firebase credentials are not provided or connectivity fails, the platform automatically activates a local mock session, allowing all Task 1 modules (*Scenario Selection*, *Agent Configuration*, and *Validation*) to run seamlessly without blocking development.

---

## Running the Application

### Development Mode
```bash
npm run dev
```
Vite will launch the local development server at `http://localhost:5173/`.

### Building for Production
```bash
npm run build
```
Build output is emitted to `frontend/dist/`.

### Previewing the Production Build
```bash
npm run preview
```

---

## Running Tests

The repository includes comprehensive automated unit tests verifying scenario configuration validation:

```bash
cd frontend
npm test
```

### Test Suite Summary:
* **21 passing unit tests** covering:
  - Scenario template integrity (unique IDs, non-empty parameters, feasible agreement ranges).
  - Explicit agent list completeness.
  - Rejection of invalid/unknown scenario IDs.
  - Boundary constraint integrity.
  - Personality modification validation and enum enforcement.
  - Handover payload generation via `prepareNegotiationConfig()`.

---

## Project Structure

```text
multi-agent-negotiation-simulator/
├── docs/
│   └── configuration-validator.md              # Detailed validation specification & schema docs
├── frontend/
│   ├── public/
│   │   ├── favicon.svg                         # Application robot favicon
│   │   └── images/                             # Custom high-res artwork
│   │       ├── dashboard/                      # Dashboard cards & hero illustrations
│   │       └── scenarios/                      # Vendor, Job Offer & Budget illustrations
│   ├── src/
│   │   ├── components/
│   │   │   ├── AgentCard.jsx                   # Agent role card with goals, constraints & personality
│   │   │   ├── AgentFaceAvatar.jsx             # Animated SVG face avatars
│   │   │   ├── AgentFaceAvatar.css             # Avatar blinking & breathing micro-animations
│   │   │   ├── AppLayout.jsx                   # Layout shell (Sidebar + Header + Outlet + Mobile Drawer)
│   │   │   ├── Header.jsx                      # Contextual header with page meta & mobile controls
│   │   │   ├── ScenarioCard.jsx                # Domain scenario card with artwork & levers
│   │   │   └── Sidebar.jsx                     # Sidebar navigation with Simulation & Practice modes
│   │   ├── context/
│   │   │   ├── AuthContext.jsx                 # User profile & authentication context
│   │   │   ├── ScenarioContext.jsx             # Active scenario & personality state management
│   │   │   └── SettingsContext.jsx             # Language & theme settings context
│   │   ├── data/
│   │   │   └── scenarios.js                    # 3 pre-built scenario data templates & schemas
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx                   # Introductory landing page & workflow guide
│   │   │   ├── Dashboard.css                   # Hero card & step cards styling
│   │   │   ├── ScenarioSelection.jsx           # Task 1: Step 1 Scenario Selection screen
│   │   │   ├── AgentConfiguration.jsx          # Task 1: Step 2 Agent Configuration screen
│   │   │   ├── NegotiationArenaPlaceholder.jsx # Step 3 Negotiation Arena placeholder
│   │   │   ├── PracticeMode.jsx                # Practice Mode placeholder & feature roadmap
│   │   │   ├── HistoryPlaceholder.jsx          # History & Reports placeholder
│   │   │   └── Settings.jsx                    # User settings & profile preferences
│   │   ├── utils/
│   │   │   ├── configurationValidator.js       # Pre-flight negotiation configuration validator
│   │   │   └── translations.js                 # 6-language dictionary (EN, HI, BN, TE, TA, MR)
│   │   ├── App.jsx                             # Application route definitions
│   │   ├── index.css                           # Global design system, typography, and responsive CSS
│   │   └── main.jsx                            # React 19 bootstrap entry point
│   ├── tests/
│   │   ├── configurationValidator.test.js      # 13 validation engine unit tests
│   │   └── scenarios.test.js                   # 8 scenario data model unit tests
│   ├── package.json                            # Frontend dependencies & npm scripts
│   └── vite.config.js                          # Vite build & development server config
├── .gitignore                                  # Git ignore rules
├── LICENSE                                     # MIT License
└── README.md                                   # Comprehensive project documentation
```

---

## Configuration Validation Engine

The validator (`frontend/src/utils/configurationValidator.js`) ensures valid simulation setup before entering the arena:

```javascript
import { validateNegotiationConfig, prepareNegotiationConfig } from './utils/configurationValidator';

// 1. Validate configuration
const validation = validateNegotiationConfig(selectedScenarioId, activeAgents);
if (!validation.isValid) {
  console.error("Configuration errors:", validation.errors);
  return;
}

// 2. Prepare serialized handover payload for downstream LLM orchestrator
const payload = prepareNegotiationConfig(selectedScenarioId, activeAgents);
console.log("Ready for Negotiation Arena:", payload);
```

For complete technical documentation, see [`docs/configuration-validator.md`](docs/configuration-validator.md).

---

## Available Scripts

Run these scripts from the `frontend/` directory:

| Command | Action | Description |
| :--- | :--- | :--- |
| `npm run dev` | `vite` | Starts local development server on port `5173` with instant HMR. |
| `npm test` | `node --test tests/*.test.js` | Runs all 21 automated unit tests. |
| `npm run build` | `vite build` | Compiles production assets into `frontend/dist/`. |
| `npm run preview` | `vite preview` | Serves the production bundle locally for inspection. |

---

## Troubleshooting

### 1. Working Directory
Make sure to navigate to the `frontend/` subfolder before executing npm commands:
```bash
cd frontend
npm install
npm run dev
```

### 2. Port 5173 in Use
If port `5173` is occupied, specify an alternative port:
```bash
npm run dev -- --port 3000
```

### 3. Clear Cache & Clean Install
If experiencing module resolution warnings:
```bash
# On Linux / macOS
rm -rf node_modules package-lock.json && npm install

# On Windows PowerShell
Remove-Item -Recurse -Force node_modules, package-lock.json; npm install
```

---

## About & Team

* **Project Name:** Multi-Agent Negotiation Simulator (**Negotiator AI**)
* **Repository:** [https://github.com/karthik-vana/multi-agent-negotiation-simulator](https://github.com/karthik-vana/multi-agent-negotiation-simulator)
* **License:** Licensed under the terms of the [MIT License](LICENSE).
* **Team Members:**
  * **Shubhay Yadav**
  * **Niharika Indurthi**
  * **Saitejaswini Tammana**
  * **Keerthana**
  * **Karthik Vana**
