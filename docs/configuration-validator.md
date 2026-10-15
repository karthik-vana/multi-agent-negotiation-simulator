# Negotiation Configuration Validator & Integration Contract

## Overview

The Centralized Configuration Validator (`frontend/src/utils/configurationValidator.js`) verifies that a selected negotiation scenario and its participating agent configurations are complete, valid, consistent, and ready for simulation before initializing the downstream Orchestrator Agent.

---

## Architecture & Design Principles

1. **Pure & UI-Independent**: The validator is a pure JavaScript module with no DOM or framework dependencies. It can be consumed by client UI components, background services, CLI tools, and test suites.
2. **Template Integrity**: Operates directly on the canonical predefined scenario templates (`frontend/src/data/scenarios.js`). Canonical templates are strictly frozen (`Object.freeze`) and are never mutated.
3. **Structured Downstream Payload**: On validation success, produces a structured, normalized configuration object containing all required context, parameters, and agent goals/constraints for the Orchestrator Agent.

---

## API Reference

### `validateNegotiationConfig(scenarioInput, agentPersonalities, options)`

Validates a scenario and its agent personalities.

```javascript
import { validateNegotiationConfig } from './utils/configurationValidator.js';

const result = validateNegotiationConfig('vendor-pricing', {
  'buyer-procurement': 'Collaborative',
  'vendor-sales': 'Aggressive'
});

console.log(result.isValid); // true | false
console.log(result.errors); // Array of string error messages
console.log(result.fieldErrors); // Map of field-level errors
console.log(result.validatedConfig); // Downstream payload object or null
```

#### Parameters:
- `scenarioInput` (`string | object`): Scenario ID string (e.g. `'vendor-pricing'`) or a scenario object.
- `agentPersonalities` (`Record<string, string> | Array<object>`): Map of `agentId -> personality` or an array of configured agent objects.
- `options` (`object`, optional): Additional configuration (e.g. `{ mode: 'simulation' }`).

#### Return Shape:
```typescript
{
  isValid: boolean;
  errors: string[];
  fieldErrors: Record<string, string>;
  validatedConfig: {
    scenarioId: string;
    scenarioName: string;
    mode: string;
    timestamp: string;
    scenario: {
      id: string;
      name: string;
      category: string;
      description: string;
      context: string;
      topics: object[];
      parameters: Record<string, object>;
      estimatedRounds: string;
      complexity: string;
    };
    agents: Array<{
      id: string;
      name: string;
      role: string;
      roleDescription: string;
      stakeholder: string;
      avatarText: string;
      primaryGoal: string;
      goal: string;
      constraints: object[];
      keyConstraints: string[];
      objectives: object[];
      personality: 'Aggressive' | 'Collaborative' | 'Risk-Averse';
      defaultPersonality: string;
      isCustomPersonality: boolean;
    }>;
  } | null;
}
```

---

### `prepareNegotiationConfig(scenarioInput, agentPersonalities, options)`

Helper function that validates the configuration and returns the downstream payload directly, or throws an Error if invalid.

```javascript
import { prepareNegotiationConfig } from './utils/configurationValidator.js';

try {
  const config = prepareNegotiationConfig('vendor-pricing', {
    'buyer-procurement': 'Collaborative'
  });
  // Pass config directly to Orchestrator Agent
} catch (err) {
  console.error(err.message, err.validationErrors);
}
```

---

## Validation Rules

| Category | Rule | Description |
|---|---|---|
| **Scenario** | Scenario Selected | Must provide a non-empty scenario identifier or object. |
| **Scenario** | Scenario Exists | Scenario ID must exist in registered templates. |
| **Scenario** | Required Metadata | Scenario must possess a valid name and description. |
| **Scenario** | Participating Agents | Scenario must have a non-empty array of participating agents. |
| **Agent** | Agent Identification | Each agent must have a valid string ID. |
| **Agent** | Role & Description | Role and role description must be defined and non-empty. |
| **Agent** | Primary Goal | Agent must have a clear primary goal/target. |
| **Agent** | Key Constraints | Agent must have non-empty constraints. |
| **Agent** | Valid Personality | Personality must be one of: `Aggressive`, `Collaborative`, `Risk-Averse`. |
| **Consistency** | Scenario Match | Configured agents must belong to the selected scenario. Rogue agent IDs are rejected. |
| **Consistency** | Missing Agents | All required scenario agents must be accounted for. |

---

## Downstream Orchestrator Integration Contract

When navigating to `/arena` via the "Start Negotiation Arena" button:

```javascript
navigate('/arena', {
  state: {
    scenarioId: validatedConfig.scenarioId,
    scenario: validatedConfig.scenario,
    agents: validatedConfig.agents,
    agentPersonalities: { ...agentPersonalities },
    negotiationConfig: validatedConfig
  }
});
```

---

## Unit Testing

Tests are executed with the Node.js test runner:

```bash
npm test
# Or directly:
node --test tests/*.test.js
```
