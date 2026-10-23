import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { OrchestratorEngine, STATUS } from '../engine/orchestratorEngine.js';

/* -------------------------------------------------------------------------- */
/* Context                                                                     */
/* -------------------------------------------------------------------------- */

const NegotiationContext = createContext(null);

/* -------------------------------------------------------------------------- */
/* Provider                                                                    */
/* -------------------------------------------------------------------------- */

export const NegotiationProvider = ({ children }) => {
  const engineRef = useRef(null);
  const runningRef = useRef(false);       // guards against concurrent runToCompletion calls
  const timerRef = useRef(null);

  // UI state mirrors
  const [negotiationState, setNegotiationState] = useState(null);
  const [isAutoRunning, setIsAutoRunning] = useState(false);

  /** Turn delay in ms — enough for the user to follow the conversation. */
  const TURN_DELAY = 1200;

  // ---- helpers --------------------------------------------------------

  const syncState = useCallback(() => {
    if (engineRef.current) {
      setNegotiationState({ ...engineRef.current.getState() });
    }
  }, []);

  // ---- public actions --------------------------------------------------

  /**
   * Initialize the orchestrator from a validated config and set it to IDLE.
   * Does NOT start running yet.
   */
  const initNegotiation = useCallback((validatedConfig) => {
    // Clean up any running auto-play
    runningRef.current = false;
    if (timerRef.current) clearTimeout(timerRef.current);
    setIsAutoRunning(false);

    engineRef.current = new OrchestratorEngine(validatedConfig);
    syncState();
  }, [syncState]);

  /**
   * Start and auto-run the negotiation turn-by-turn with a delay.
   */
  const startNegotiation = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;

    if (engine.status === STATUS.IDLE) {
      engine.start();
      syncState();
    } else if (engine.status === STATUS.PAUSED) {
      engine.resume();
      syncState();
    }

    if (engine.status !== STATUS.RUNNING) return;

    setIsAutoRunning(true);
    runningRef.current = true;

    const runLoop = () => {
      if (!runningRef.current || !engineRef.current) return;
      if (engineRef.current.status !== STATUS.RUNNING) {
        runningRef.current = false;
        setIsAutoRunning(false);
        syncState();
        return;
      }

      engineRef.current.runNextTurn();
      syncState();

      if (engineRef.current.status === STATUS.RUNNING && runningRef.current) {
        timerRef.current = setTimeout(runLoop, TURN_DELAY);
      } else {
        runningRef.current = false;
        setIsAutoRunning(false);
        syncState();
      }
    };

    timerRef.current = setTimeout(runLoop, 300); // small initial delay
  }, [syncState]);

  /**
   * Pause auto-running.
   */
  const pauseNegotiation = useCallback(() => {
    runningRef.current = false;
    if (timerRef.current) clearTimeout(timerRef.current);
    setIsAutoRunning(false);

    const engine = engineRef.current;
    if (engine && engine.status === STATUS.RUNNING) {
      engine.pause();
      syncState();
    }
  }, [syncState]);

  /**
   * Advance exactly one turn manually.
   */
  const stepOneTurn = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;

    // Ensure auto-run is off
    runningRef.current = false;
    if (timerRef.current) clearTimeout(timerRef.current);
    setIsAutoRunning(false);

    if (engine.status === STATUS.IDLE) {
      engine.start();
    } else if (engine.status === STATUS.PAUSED) {
      engine.resume();
    }

    if (engine.status === STATUS.RUNNING) {
      engine.runNextTurn();
      // Re-pause so user stays in manual mode
      if (engine.status === STATUS.RUNNING) {
        engine.pause();
      }
    }

    syncState();
  }, [syncState]);

  /**
   * Reset everything back to IDLE (keeps the same config).
   */
  const resetNegotiation = useCallback(() => {
    runningRef.current = false;
    if (timerRef.current) clearTimeout(timerRef.current);
    setIsAutoRunning(false);

    if (engineRef.current) {
      engineRef.current.reset();
      syncState();
    }
  }, [syncState]);

  // ---- derived values --------------------------------------------------

  const status = negotiationState?.status || STATUS.IDLE;
  const currentRound = negotiationState?.currentRound || 0;
  const maxRounds = negotiationState?.maxRounds || 0;
  const conversationHistory = negotiationState?.conversationHistory || [];
  const activeAgent = negotiationState?.activeAgent || null;
  const agents = negotiationState?.agents || [];
  const scenario = negotiationState?.scenario || null;
  const agreementTerms = negotiationState?.agreementTerms || null;
  const terminationReason = negotiationState?.terminationReason || null;
  const isTerminated = [STATUS.AGREED, STATUS.REJECTED, STATUS.MAX_ROUNDS].includes(status);

  return (
    <NegotiationContext.Provider
      value={{
        // State
        status,
        currentRound,
        maxRounds,
        conversationHistory,
        activeAgent,
        agents,
        scenario,
        agreementTerms,
        terminationReason,
        isTerminated,
        isAutoRunning,

        // Actions
        initNegotiation,
        startNegotiation,
        pauseNegotiation,
        stepOneTurn,
        resetNegotiation,
      }}
    >
      {children}
    </NegotiationContext.Provider>
  );
};

/* -------------------------------------------------------------------------- */
/* Hook                                                                        */
/* -------------------------------------------------------------------------- */

export const useNegotiation = () => {
  const context = useContext(NegotiationContext);
  if (!context) {
    throw new Error('useNegotiation must be used within a NegotiationProvider');
  }
  return context;
};

export { STATUS };
export default NegotiationContext;
