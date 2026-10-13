# Multi-Agent Negotiation Simulator

An AI-powered negotiation simulation and training platform designed to model, study, and practice real-world multi-stakeholder negotiations using autonomous intelligent agents.

[![React](https://img.shields.io/badge/React-19.0.0-blue.svg)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6.2.0-646CFF.svg)](https://vitejs.dev/)
[![React Router](https://img.shields.io/badge/React_Router-7.3.0-CA4245.svg)](https://reactrouter.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## Table of Contents

- [Project Description](#project-description)
- [Features](#features)
  - [Current Implementation](#current-implementation)
  - [Planned Features](#planned-features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Installation and Setup](#installation-and-setup)
- [Environment Variables](#environment-variables)
- [Running the Application](#running-the-application)
- [Project Structure](#project-structure)
- [Available Scripts](#available-scripts)
- [Troubleshooting](#troubleshooting)
- [About](#about)

---

## Project Description

Negotiation is a core competency across business operations, contract discussions, procurement, hiring, and resource distribution. However, mastering negotiation skills is challenging due to the scarcity of realistic, scalable, and repeatable practice environments.

The **Multi-Agent Negotiation Simulator** addresses this challenge by providing a web-based platform where autonomous Generative AI agents represent distinct stakeholders with conflicting objectives, strict constraints, and configurable behavioral personalities. Agents exchange contextually reasoned offers and counteroffers, evaluate concessions, and work toward mutually agreeable outcomes.

### Intended Use Cases

* **AI vs AI Simulation Mode:** Observe autonomous AI agents negotiate with one another in real time to analyze negotiation dynamics, concession trajectories, and strategic tradeoffs.
* **Human vs AI Practice Mode:** Step directly into negotiations as one of the active participants to practice tactics, evaluate counterparty resistance, and receive structured feedback.
* **Pre-Built Scenario Templates:**
  * **Vendor Pricing Negotiation:** Enterprise SaaS procurement balancing annual contract value, SLA guarantees, contract tenure, and payment terms.
  * **Job Offer Negotiation:** Candidate and hiring manager negotiating base salary, equity options, sign-on bonuses, and remote work flexibility.
  * **Project Budget Allocation:** Cross-functional leadership dividing a fixed capital expenditure pool between infrastructure stability and customer-facing growth features.
* **Agent Personality & Goal Configuration:** Customize agents with distinct strategic profiles—such as Aggressive, Collaborative, or Risk-Averse.
* **Outcome Analysis:** Review post-negotiation analytics including agreement terms, concession curves, and satisfaction scores.

> **Note:** The current version of this repository establishes the foundational frontend architecture, shared layout shell, sidebar navigation, and placeholder routing. The negotiation engine, scenario selection cards, agent configuration controls, and backend LLM integration represent planned capabilities.

---

## Features

### Current Implementation

* **Foundational Frontend Setup:** Clean, modern Single Page Application built with React 19 and Vite 6.
* **Shared Application Shell (`AppLayout`):** Reusable layout container ensuring consistent navigation and layout across all views.
* **Modern Sidebar Navigation (`Sidebar`):**
  * Brand logo badge and application title.
  * Search input placeholder for fast navigation.
  * Grouped navigation sections: *Main Menu*, *Simulation*, and *System*.
  * Active route highlighting with accent pill indicators and badges.
  * User profile footer with status indicator.
  * Responsive drawer behavior for smaller viewports.
* **Contextual Header Bar (`Header`):** Dynamic page titles and subtitles that update automatically based on the current active route.
* **Main Content Area:** Standardized container with responsive padding and spacing for future module integration.
* **Dashboard Overview:** Clean landing screen with introductory workflow steps explaining the simulation lifecycle.
* **Client-Side Routing:** Configured routes for all primary views with placeholder destinations.
* **Modular Styling System:** Vanilla CSS design tokens with custom CSS properties for colors, spacing, typography, and card components.

### Planned Features

* [ ] Interactive scenario selection interface with pre-built scenario cards.
* [ ] Agent configuration interface with reusable agent cards, goal reviews, and personality selectors.
* [ ] Turn-taking Orchestrator Agent to manage conversational state and detect deadlocks.
* [ ] LLM-powered offer generation and concession decision modules.
* [ ] Chat-style Negotiation Arena with turn-by-turn reasoning and live stance indicators.
* [ ] Interactive Human Participant mode (Practice Mode).
* [ ] Final outcome evaluation screen with downloadable transcripts and summary reports.

---

## Tech Stack

The technologies currently implemented in the repository are:

| Technology | Category | Purpose |
| :--- | :--- | :--- |
| **React 19** | Frontend Framework | Declarative UI component architecture |
| **Vite 6** | Build Tool & Dev Server | Fast Hot Module Replacement (HMR) and optimized bundling |
| **React Router 7** | Client-Side Routing | Multi-page layout navigation without full page reloads |
| **Lucide React** | Icon System | Clean, consistent SVG icons throughout the interface |
| **Vanilla CSS** | Styling System | Custom CSS variables, responsive design, and card styles (`index.css`) |

---

## Prerequisites

Before setting up the project locally, verify that the following tools are installed on your machine:

* **Node.js:** `v18.0.0` or higher (tested with `v20+` / `v24+`)
* **npm:** `v9.0.0` or higher (comes bundled with Node.js)
* **Git:** Installed and configured

Verify your versions by running:

```bash
node -v
npm -v
git --version
```

---

## Quick Start

Get the application running locally in three commands:

```bash
git clone https://github.com/karthik-vana/multi-agent-negotiation-simulator.git
cd multi-agent-negotiation-simulator
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Installation and Setup

Follow these detailed steps to set up the repository on your local development environment:

### 1. Clone the Repository

Clone the project to your local machine using Git:

```bash
git clone https://github.com/karthik-vana/multi-agent-negotiation-simulator.git
```

### 2. Navigate to the Project Root

The application runs directly from the root of the repository:

```bash
cd multi-agent-negotiation-simulator
```

### 3. Install Dependencies

Install all required packages defined in `package.json`:

```bash
npm install
```

---

## Environment Variables

**No environment variables are currently required** to run the frontend application in its current setup. The project runs out of the box with standard local development defaults.

When downstream backend services or LLM API keys (e.g., OpenAI, Anthropic, Gemini) are integrated into future phases, an environment template (`.env.example`) and instructions will be documented here.

---

## Running the Application

### Development Mode

Start the local development server with Hot Module Replacement (HMR):

```bash
npm run dev
```

After starting, Vite will output the local development address:

```text
  VITE v6.2.0  ready in 250 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

Open your web browser and navigate to **`http://localhost:5173`**.

### Building for Production

Compile and bundle the frontend assets for production:

```bash
npm run build
```

The optimized static files will be emitted to the `dist/` directory.

### Previewing the Production Build

Test the production bundle locally before deployment:

```bash
npm run preview
```

---

## Project Structure

The repository is structured as a modular React single-page application:

```text
multi-agent-negotiation-simulator/
├── public/
│   └── favicon.svg                             # Application favicon
├── src/
│   ├── components/
│   │   ├── AppLayout.jsx                       # Shared application layout shell (Sidebar + Header + Outlet)
│   │   ├── Header.jsx                          # Contextual header with dynamic titles and subtitles
│   │   └── Sidebar.jsx                         # Responsive sidebar with categorized navigation links
│   ├── pages/
│   │   ├── Dashboard.jsx                       # Introductory dashboard overview
│   │   ├── ScenariosPlaceholder.jsx            # Placeholder view for Scenario Selection
│   │   ├── AgentConfigurationPlaceholder.jsx   # Placeholder view for Agent Configuration
│   │   ├── NegotiationArenaPlaceholder.jsx     # Placeholder view for Negotiation Arena
│   │   ├── HistoryPlaceholder.jsx              # Placeholder view for History & Reports
│   │   └── SettingsPlaceholder.jsx             # Placeholder view for Settings
│   ├── App.jsx                                 # Application router definition (React Router)
│   ├── index.css                               # Global CSS design tokens, resets, and layout styles
│   └── main.jsx                                # React application bootstrap entry point
├── .gitignore                                  # Git ignore rules for node_modules, build artifacts, etc.
├── index.html                                  # HTML entry template with typography links
├── LICENSE                                     # Project license (MIT)
├── package.json                                # Project dependencies and script definitions
├── package-lock.json                           # Deterministic dependency tree lockfile
├── README.md                                   # Comprehensive project documentation
└── vite.config.js                              # Vite build and server configuration
```

### Key File Responsibilities

* **`src/components/AppLayout.jsx`**: Combines the persistent sidebar, contextual top header, and dynamic content viewport (`<Outlet />`).
* **`src/components/Sidebar.jsx`**: Renders navigation links for Dashboard, Scenarios, Agent Configuration, Arena, History, and Settings with active route indicators.
* **`src/components/Header.jsx`**: Displays the active section title and subtitle dynamically according to browser navigation.
* **`src/App.jsx`**: Centralizes client-side route paths inside React Router's `<BrowserRouter>`.
* **`src/index.css`**: Defines CSS design variables for typography, card surfaces, borders, and responsive breakpoints.

---

## Available Scripts

The following scripts are defined in `package.json`:

| Command | Action | Description |
| :--- | :--- | :--- |
| `npm run dev` | `vite` | Starts the Vite local development server with instant HMR on port `5173`. |
| `npm run build` | `vite build` | Compiles JavaScript and CSS into optimized production bundles in `dist/`. |
| `npm run preview` | `vite preview` | Locally serves the production build generated in `dist/` for verification. |

---

## Troubleshooting

### Port 5173 Already in Use

If another process is running on port `5173`, Vite will automatically attempt the next available port (e.g., `5174`), or you can specify a custom port:

```bash
npm run dev -- --port 3000
```

### Dependencies Missing or Build Errors

If you encounter module resolution errors, clear the local cache and reinstall packages:

```bash
rm -rf node_modules package-lock.json
npm install
```

*(On Windows PowerShell, use `Remove-Item -Recurse -Force node_modules, package-lock.json` followed by `npm install`).*

### Node Version Warnings

If dependencies fail to install due to an older runtime, ensure you are running Node.js `18.0.0` or newer:

```bash
node -v
```

---

## About

* **Project Name:** Multi-Agent Negotiation Simulator
* **Repository:** [https://github.com/karthik-vana/multi-agent-negotiation-simulator](https://github.com/karthik-vana/multi-agent-negotiation-simulator)
* **License:** This project is licensed under the terms of the [MIT License](LICENSE).
