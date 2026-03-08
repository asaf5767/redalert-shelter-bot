/**
 * RedAlert Service - Socket.IO connection to the RedAlert API
 *
 * Connects to https://redalert.orielhaim.com using Socket.IO
 * and listens for real-time alert events (missiles, earthquakes, etc.)
 *
 * Supports both production mode (requires API key) and test mode
 * (no API key, simulated alerts for development).
 */

import { io, Socket } from 'socket.io-client';
import {
  REDALERT_SERVER,
  REDALERT_API_KEY,
  REDALERT_TEST_MODE,
  REDALERT_TEST_TIMING,
  REDALERT_TEST_CITIES,
  REDALERT_TEST_ALERTS,
} from '../config';
import { RedAlertEvent } from '../types';
import { createLogger } from '../utils/logger';

const log = createLogger('redalert');

// Socket.IO client instance
let socket: Socket | null = null;

// Stored callbacks for reconnection
let storedOnAlert: AlertCallback | null = null;
let storedOnEndAlert: EndAlertCallback | null = null;

// Watchdog: reconnect if we've been disconnected for too long
const WATCHDOG_CHECK_INTERVAL_MS = 60_000; // check every 60s
const WATCHDOG_MAX_DISCONNECT_MS = 5 * 60_000; // reconnect if down for 5+ min
let lastConnectedAt: number | null = null;
let watchdogTimer: ReturnType<typeof setInterval> | null = null;

// Callback types
type AlertCallback = (alerts: RedAlertEvent[]) => void;
type EndAlertCallback = (alert: RedAlertEvent) => void;

// =====================
// Connection
// =====================

/**
 * Connect to the RedAlert API via Socket.IO.
 *
 * In production mode: connects to the main server with API key auth.
 * In test mode: connects to the /test namespace with simulation params.
 *
 * @param onAlert - Called when a new alert arrives (array of alerts)
 * @param onEndAlert - Called when an alert ends (single alert)
 */
export function connectToRedAlert(
  onAlert: AlertCallback,
  onEndAlert: EndAlertCallback
): void {
  // Store callbacks so the watchdog can reconnect without needing them passed in
  storedOnAlert = onAlert;
  storedOnEndAlert = onEndAlert;

  if (socket) {
    log.warn('RedAlert already connected - disconnecting first');
    socket.disconnect();
    socket = null;
  }

  if (REDALERT_TEST_MODE) {
    connectTestMode(onAlert, onEndAlert);
  } else {
    connectProductionMode(onAlert, onEndAlert);
  }

  startWatchdog();
}

/**
 * Connect to the production RedAlert server (requires API key).
 */
function connectProductionMode(
  onAlert: AlertCallback,
  onEndAlert: EndAlertCallback
): void {
  log.info('Connecting to RedAlert production server...');

  socket = io(REDALERT_SERVER, {
    auth: {
      apiKey: REDALERT_API_KEY,
    },
    // Reconnection settings
    reconnection: true,
    reconnectionAttempts: Infinity, // Never stop trying
    reconnectionDelay: 1000, // Start with 1s
    reconnectionDelayMax: 30000, // Max 30s between attempts
  });

  setupEventListeners(socket, onAlert, onEndAlert);
}

/**
 * Connect to the RedAlert test server (no API key needed).
 * Generates simulated alerts for development and testing.
 */
function connectTestMode(
  onAlert: AlertCallback,
  onEndAlert: EndAlertCallback
): void {
  log.info(
    { timing: REDALERT_TEST_TIMING, cities: REDALERT_TEST_CITIES || 'random' },
    'Connecting to RedAlert TEST server...'
  );

  // Build query parameters for test simulation
  const query: Record<string, string> = {
    timing: REDALERT_TEST_TIMING,
  };

  if (REDALERT_TEST_ALERTS) {
    query.alerts = REDALERT_TEST_ALERTS;
  }

  if (REDALERT_TEST_CITIES) {
    query.cities = REDALERT_TEST_CITIES;
  }

  socket = io(`${REDALERT_SERVER}/test`, {
    query,
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 30000,
  });

  setupEventListeners(socket, onAlert, onEndAlert);
}

/**
 * Watchdog: checks every minute whether the socket is connected.
 * If it has been disconnected for longer than WATCHDOG_MAX_DISCONNECT_MS,
 * tear down the socket and create a fresh one — this recovers from cases
 * where socket.io's internal reconnection loop stalls (e.g. after an
 * auth rejection the server never re-allows).
 */
function startWatchdog(): void {
  if (watchdogTimer) clearInterval(watchdogTimer);

  watchdogTimer = setInterval(() => {
    if (!storedOnAlert || !storedOnEndAlert) return;

    if (socket?.connected) {
      // All good — record the last known-good time
      lastConnectedAt = Date.now();
      return;
    }

    const disconnectedFor = lastConnectedAt
      ? Date.now() - lastConnectedAt
      : WATCHDOG_MAX_DISCONNECT_MS + 1; // treat "never connected" as long disconnect

    if (disconnectedFor >= WATCHDOG_MAX_DISCONNECT_MS) {
      log.warn(
        { disconnectedForSec: Math.round(disconnectedFor / 1000) },
        'RedAlert watchdog: disconnected too long — forcing fresh reconnect'
      );
      // Tear down the stale socket so socket.io doesn't try to reuse it
      if (socket) {
        try { socket.removeAllListeners(); socket.disconnect(); } catch (_) { /* ignore */ }
        socket = null;
      }
      // Create a brand-new connection
      if (REDALERT_TEST_MODE) {
        connectTestMode(storedOnAlert, storedOnEndAlert);
      } else {
        connectProductionMode(storedOnAlert, storedOnEndAlert);
      }
      // Reset so we don't immediately re-trigger
      lastConnectedAt = Date.now();
    }
  }, WATCHDOG_CHECK_INTERVAL_MS);
}

/**
 * Set up Socket.IO event listeners for alerts and connection status.
 */
function setupEventListeners(
  sock: Socket,
  onAlert: AlertCallback,
  onEndAlert: EndAlertCallback
): void {
  // ---- Connection Events ----

  sock.on('connect', () => {
    lastConnectedAt = Date.now();
    log.info(
      { testMode: REDALERT_TEST_MODE },
      'Connected to RedAlert server'
    );
  });

  sock.on('disconnect', (reason) => {
    log.warn({ reason }, 'Disconnected from RedAlert server');
  });

  sock.on('connect_error', (error) => {
    // Log error.data if the server sent extra details (e.g. "Unauthorized")
    const extra = (error as any).data ?? {};
    log.error({ error: error.message, data: extra }, 'RedAlert connection error');
  });

  sock.io.on('reconnect', (attempt) => {
    lastConnectedAt = Date.now();
    log.info({ attempt }, 'Reconnected to RedAlert server');
  });

  sock.io.on('reconnect_attempt', (attempt) => {
    log.debug({ attempt }, 'RedAlert reconnection attempt...');
  });

  sock.io.on('reconnect_error', (error) => {
    log.warn({ error: (error as any).message }, 'RedAlert reconnection attempt failed');
  });

  sock.io.on('reconnect_failed', () => {
    log.error('RedAlert reconnect_failed — all attempts exhausted (should not happen with Infinity)');
  });

  // ---- Alert Events ----

  // General "alert" event - receives an array of alert objects
  sock.on('alert', (alerts: RedAlertEvent[]) => {
    log.info(
      { count: alerts.length, types: alerts.map((a) => a.type) },
      'Received alert event'
    );

    try {
      onAlert(alerts);
    } catch (err) {
      log.error({ err }, 'Error in alert callback');
    }
  });

  // "endAlert" event - receives a single alert object
  sock.on('endAlert', (alert: RedAlertEvent) => {
    log.info(
      { type: alert.type, cities: alert.cities },
      'Received endAlert event'
    );

    try {
      onEndAlert(alert);
    } catch (err) {
      log.error({ err }, 'Error in endAlert callback');
    }
  });

  // Also listen to specific alert types for additional logging
  const alertTypes = [
    'missiles',
    'earthQuake',
    'tsunami',
    'hostileAircraftIntrusion',
    'hazardousMaterials',
    'terroristInfiltration',
    'newsFlash',
  ];

  for (const type of alertTypes) {
    sock.on(type, (alert: RedAlertEvent) => {
      log.info({ type, cities: alert.cities }, 'Specific alert type received');
    });
  }
}

// =====================
// Status & Control
// =====================

/** Check if the RedAlert Socket.IO connection is active */
export function isRedAlertConnected(): boolean {
  return socket?.connected ?? false;
}

/** Disconnect from the RedAlert server */
export function disconnectRedAlert(): void {
  if (watchdogTimer) {
    clearInterval(watchdogTimer);
    watchdogTimer = null;
  }
  if (socket) {
    socket.disconnect();
    socket = null;
    log.info('Disconnected from RedAlert server');
  }
}
