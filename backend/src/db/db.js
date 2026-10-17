const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

let pool = null;
let isNeonConnected = false;

// In-Memory Fallback Store (Used if Neon DB URL is not yet configured or offline)
const inMemoryStore = {
  simulations: new Map(),
  agents: new Map(), // key: simulationId, value: Array of agents
  messages: new Map(), // key: simulationId, value: Array of messages
  offers: new Map(), // key: simulationId, value: Array of offers
  agreements: new Map(), // key: simulationId, value: agreement
};

/**
 * Initialize Database Connection
 */
const initDbConnection = async () => {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString || connectionString.trim() === '') {
    console.log('[Neon DB] DATABASE_URL not set in .env. Running with robust In-Memory Store.');
    console.log('[Neon DB] See setup instructions to connect your Neon PostgreSQL instance.');
    isNeonConnected = false;
    return false;
  }

  try {
    // Clean sslmode from URL to use explicit ssl configuration without Node v24 warning
    const cleanConnectionString = connectionString.replace(/([?&])sslmode=[^&]+(&|$)/, '$1').replace(/[?&]$/, '');
    pool = new Pool({
      connectionString: cleanConnectionString,
      ssl: {
        rejectUnauthorized: false, // Required for Neon serverless postgres
      },
      connectionTimeoutMillis: 5000,
    });

    // Test connection
    const client = await pool.connect();
    const res = await client.query('SELECT NOW()');
    client.release();

    console.log('✅ [Neon DB] Connected successfully to Neon PostgreSQL at:', res.rows[0].now);
    isNeonConnected = true;

    // Run migrations
    await runMigrations();
    return true;
  } catch (error) {
    console.warn('⚠️ [Neon DB] Connection failed, falling back to In-Memory Store:', error.message);
    isNeonConnected = false;
    return false;
  }
};

/**
 * Execute Schema Migration
 */
const runMigrations = async () => {
  if (!pool || !isNeonConnected) return;
  try {
    const sqlPath = path.join(__dirname, 'init.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    await pool.query(sql);
    console.log('✅ [Neon DB] Schema tables verified & migrated successfully.');
  } catch (err) {
    console.error('❌ [Neon DB] Migration error:', err.message);
  }
};

// ============================================================================
// Database Service Interface
// ============================================================================

const db = {
  isNeonConnected: () => isNeonConnected,
  getPool: () => pool,

  /**
   * Create a new simulation session with initial agents
   */
  async createSimulation(simData, agents = []) {
    const {
      id,
      scenario_id,
      scenario_title,
      status = 'CREATED',
      current_round = 1,
      max_rounds = 10,
      current_gap = 0,
      agreement_likelihood = 50,
    } = simData;

    if (isNeonConnected && pool) {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        await client.query(
          `INSERT INTO simulations (id, scenario_id, scenario_title, status, current_round, max_rounds, current_gap, agreement_likelihood)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           ON CONFLICT (id) DO UPDATE SET
             scenario_id = EXCLUDED.scenario_id,
             scenario_title = EXCLUDED.scenario_title,
             status = EXCLUDED.status,
             current_round = EXCLUDED.current_round,
             max_rounds = EXCLUDED.max_rounds,
             current_gap = EXCLUDED.current_gap,
             agreement_likelihood = EXCLUDED.agreement_likelihood,
             updated_at = CURRENT_TIMESTAMP`,
          [id, scenario_id, scenario_title, status, current_round, max_rounds, current_gap, agreement_likelihood]
        );

        for (const agent of agents) {
          await client.query(
            `INSERT INTO agents (id, simulation_id, name, role, personality, goal, target_value, reservation_value, current_offer, stance, progress_percent)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
             ON CONFLICT (id) DO NOTHING`,
            [
              agent.id || `${id}_${agent.role.toLowerCase()}`,
              id,
              agent.name,
              agent.role,
              agent.personality || 'Collaborative',
              agent.goal || '',
              agent.target_value || 0,
              agent.reservation_value || 0,
              agent.current_offer || null,
              agent.stance || 'Seeking agreement',
              agent.progress_percent || 50,
            ]
          );
        }

        await client.query('COMMIT');
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    }

    // In-memory cache update
    inMemoryStore.simulations.set(id, {
      ...simData,
      status,
      current_round,
      max_rounds,
      current_gap,
      agreement_likelihood,
      created_at: new Date(),
      updated_at: new Date(),
    });
    inMemoryStore.agents.set(id, agents.map(a => ({ ...a })));
    if (!inMemoryStore.messages.has(id)) inMemoryStore.messages.set(id, []);
    if (!inMemoryStore.offers.has(id)) inMemoryStore.offers.set(id, []);

    return this.getSimulation(id);
  },

  /**
   * Retrieve full simulation state by ID
   */
  async getSimulation(id) {
    if (isNeonConnected && pool) {
      try {
        const simRes = await pool.query('SELECT * FROM simulations WHERE id = $1', [id]);
        if (simRes.rows.length === 0) return null;

        const sim = simRes.rows[0];
        const agentsRes = await pool.query('SELECT * FROM agents WHERE simulation_id = $1 ORDER BY role ASC', [id]);
        const msgRes = await pool.query('SELECT * FROM messages WHERE simulation_id = $1 ORDER BY created_at ASC', [id]);
        const offersRes = await pool.query('SELECT * FROM offers WHERE simulation_id = $1 ORDER BY created_at ASC', [id]);
        const agreementRes = await pool.query('SELECT * FROM agreements WHERE simulation_id = $1', [id]);

        return {
          ...sim,
          agents: agentsRes.rows,
          messages: msgRes.rows,
          offers: offersRes.rows,
          agreement: agreementRes.rows[0] || null,
        };
      } catch (err) {
        console.warn('[Neon DB] Error in getSimulation, falling back to cache:', err.message);
      }
    }

    // Fallback in-memory
    const sim = inMemoryStore.simulations.get(id);
    if (!sim) return null;

    return {
      ...sim,
      agents: inMemoryStore.agents.get(id) || [],
      messages: inMemoryStore.messages.get(id) || [],
      offers: inMemoryStore.offers.get(id) || [],
      agreement: inMemoryStore.agreements.get(id) || null,
    };
  },

  /**
   * List all simulations
   */
  async listSimulations(limit = 20) {
    if (isNeonConnected && pool) {
      try {
        const res = await pool.query('SELECT * FROM simulations ORDER BY created_at DESC LIMIT $1', [limit]);
        return res.rows;
      } catch (err) {
        console.warn('[Neon DB] Error in listSimulations, using cache:', err.message);
      }
    }

    return Array.from(inMemoryStore.simulations.values())
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, limit);
  },

  /**
   * Update Simulation status/round/metrics
   */
  async updateSimulation(id, updates) {
    const keys = Object.keys(updates);
    if (keys.length === 0) return;

    if (isNeonConnected && pool) {
      try {
        const setClauses = keys.map((k, i) => `${k} = $${i + 2}`).join(', ');
        const values = [id, ...keys.map(k => updates[k])];
        await pool.query(
          `UPDATE simulations SET ${setClauses}, updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
          values
        );
      } catch (err) {
        console.warn('[Neon DB] Update error:', err.message);
      }
    }

    const current = inMemoryStore.simulations.get(id);
    if (current) {
      inMemoryStore.simulations.set(id, {
        ...current,
        ...updates,
        updated_at: new Date(),
      });
    }
  },

  /**
   * Append a negotiation message
   */
  async addMessage(msg) {
    const {
      id = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      simulation_id,
      round_number,
      sender_type = 'AGENT',
      sender_name,
      sender_role,
      personality,
      message,
      offer_value = null,
      currency = '₹',
      action = 'OFFER',
      timestamp_label = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    } = msg;

    const record = {
      id,
      simulation_id,
      round_number,
      sender_type,
      sender_name,
      sender_role,
      personality,
      message,
      offer_value,
      currency,
      action,
      timestamp_label,
      created_at: new Date(),
    };

    if (isNeonConnected && pool) {
      try {
        await pool.query(
          `INSERT INTO messages (id, simulation_id, round_number, sender_type, sender_name, sender_role, personality, message, offer_value, currency, action, timestamp_label)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
          [id, simulation_id, round_number, sender_type, sender_name, sender_role, personality, message, offer_value, currency, action, timestamp_label]
        );
      } catch (err) {
        console.warn('[Neon DB] addMessage error:', err.message);
      }
    }

    const list = inMemoryStore.messages.get(simulation_id) || [];
    list.push(record);
    inMemoryStore.messages.set(simulation_id, list);

    return record;
  },

  /**
   * Record a proposed offer
   */
  async addOffer(offer) {
    const {
      id = `off_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      simulation_id,
      round_number,
      agent_role,
      offer_value,
      terms = {},
      decision_status = 'PENDING',
    } = offer;

    const record = {
      id,
      simulation_id,
      round_number,
      agent_role,
      offer_value,
      terms,
      decision_status,
      created_at: new Date(),
    };

    if (isNeonConnected && pool) {
      try {
        await pool.query(
          `INSERT INTO offers (id, simulation_id, round_number, agent_role, offer_value, terms, decision_status)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [id, simulation_id, round_number, agent_role, offer_value, JSON.stringify(terms), decision_status]
        );
      } catch (err) {
        console.warn('[Neon DB] addOffer error:', err.message);
      }
    }

    const list = inMemoryStore.offers.get(simulation_id) || [];
    list.push(record);
    inMemoryStore.offers.set(simulation_id, list);

    return record;
  },

  /**
   * Update Agent state
   */
  async updateAgent(simulationId, role, updates) {
    if (isNeonConnected && pool) {
      try {
        const keys = Object.keys(updates);
        if (keys.length > 0) {
          const setClauses = keys.map((k, i) => `${k} = $${i + 3}`).join(', ');
          const values = [simulationId, role, ...keys.map(k => updates[k])];
          await pool.query(
            `UPDATE agents SET ${setClauses} WHERE simulation_id = $1 AND role = $2`,
            values
          );
        }
      } catch (err) {
        console.warn('[Neon DB] updateAgent error:', err.message);
      }
    }

    const list = inMemoryStore.agents.get(simulationId) || [];
    const idx = list.findIndex(a => a.role === role);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...updates };
      inMemoryStore.agents.set(simulationId, list);
    }
  },

  /**
   * Save Agreement Outcome
   */
  async saveAgreement(agreement) {
    const {
      id = `agr_${Date.now()}`,
      simulation_id,
      final_value,
      terms = {},
      outcome = 'AGREEMENT_REACHED',
    } = agreement;

    const record = {
      id,
      simulation_id,
      final_value,
      terms,
      outcome,
      created_at: new Date(),
    };

    if (isNeonConnected && pool) {
      try {
        await pool.query(
          `INSERT INTO agreements (id, simulation_id, final_value, terms, outcome)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (simulation_id) DO UPDATE SET
             final_value = EXCLUDED.final_value,
             terms = EXCLUDED.terms,
             outcome = EXCLUDED.outcome`,
          [id, simulation_id, final_value, JSON.stringify(terms), outcome]
        );
      } catch (err) {
        console.warn('[Neon DB] saveAgreement error:', err.message);
      }
    }

    inMemoryStore.agreements.set(simulation_id, record);
    return record;
  },
};

module.exports = {
  initDbConnection,
  db,
};
