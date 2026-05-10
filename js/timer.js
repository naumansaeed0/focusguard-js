

import { saveTimerState, loadTimerState, clearTimerState, loadSettings } from './storage.js';
import { generateId } from './helpers.js';


export const TIMER_MODE = Object.freeze({
  FOCUS: 'focus',
  BREAK: 'break',
});

export const TIMER_STATUS = Object.freeze({
  IDLE:    'idle',
  RUNNING: 'running',
  PAUSED:  'paused',
  DONE:    'done',
});



let _state = {
  mode:          TIMER_MODE.FOCUS,
  status:        TIMER_STATUS.IDLE,
  remaining:     0,   // seconds remaining
  sessionNumber: 1,   // 1-4 in a pomodoro set
  startedAt:     null, // timestamp when this session was started (for history)
  sessionId:     null,
};

let _intervalId = null;



const _callbacks = {
  onTick:    [], // fires every second: (state) => void
  onComplete:[], // fires when timer hits 0: (state) => void
};

// ─── Private Helpers ──────────────────────────────────────────────────────

const _notify = (event, data) => {
  _callbacks[event].forEach(fn => fn(data));
};

const _persist = () => {
  // WHY: We save on every tick so a browser refresh restores exact position.
  // This is the "persistent timer state" feature requirement.
  saveTimerState({
    ..._state,
    savedAt: Date.now(), // used to calculate drift on restore
  });
};

const _getInitialDuration = (mode) => {
  const settings = loadSettings();
  return mode === TIMER_MODE.FOCUS
    ? settings.focusDuration
    : settings.breakDuration;
};


/**
 * Called on app init. Restores a running session after page refresh.
 * Returns true if a session was restored, false if starting fresh.
 *
 * WHY: We saved `savedAt` on every tick. On restore, we subtract the
 * elapsed wall-clock time from `remaining`. This corrects for time that
 * passed while the page was closed.
 * @returns {boolean}
 */
export const restoreTimerState = () => {
  const saved = loadTimerState();
  if (!saved || saved.status === TIMER_STATUS.IDLE) return false;

  if (saved.status === TIMER_STATUS.RUNNING) {
    // Correct for time elapsed since the tab was closed
    const elapsedSeconds = Math.floor((Date.now() - saved.savedAt) / 1000);
    saved.remaining = Math.max(0, saved.remaining - elapsedSeconds);
  }

  _state = { ...saved };

  // If it was running when page closed, auto-resume
  if (_state.status === TIMER_STATUS.RUNNING) {
    _state.status = TIMER_STATUS.PAUSED; // temporarily pause so start() can resume
    startTimer();
  }

  return true;
};


/**
 * Returns a shallow copy of current state.
 * WHY a copy: prevents external code from mutating private state directly.
 * Dart parallel: state getter on a Cubit.
 * @returns {Object}
 */
export const getTimerState = () => ({ ..._state });

/**
 * Subscribe to timer events.
 * @param {'onTick'|'onComplete'} event
 * @param {Function} callback
 */
export const onTimer = (event, callback) => {
  if (_callbacks[event]) _callbacks[event].push(callback);
};

/**
 * Starts or resumes the timer.
 * WHY we check status: calling start() while already running would
 * create a second interval — memory leak and double-speed timer.
 */
export const startTimer = () => {
  if (_state.status === TIMER_STATUS.RUNNING) return;

  if (_state.status === TIMER_STATUS.IDLE) {
    // Fresh start — set duration and record start time
    _state.remaining  = _getInitialDuration(_state.mode);
    _state.startedAt  = Date.now();
    _state.sessionId  = generateId();
  }

  _state.status = TIMER_STATUS.RUNNING;
  _persist();

  // setInterval fires every 1000ms and returns an ID we must hold onto
  _intervalId = setInterval(() => {
    _state.remaining -= 1;
    _persist();
    _notify('onTick', getTimerState());

    if (_state.remaining <= 0) {
      _complete();
    }
  }, 1000);
};

/**
 * Pauses a running timer.
 */
export const pauseTimer = () => {
  if (_state.status !== TIMER_STATUS.RUNNING) return;

  // clearInterval stops the interval — opposite of setInterval
  clearInterval(_intervalId);
  _intervalId = null;

  _state.status = TIMER_STATUS.PAUSED;
  _persist();
  _notify('onTick', getTimerState());
};

/**
 * Resets timer to initial state for current mode.
 */
export const resetTimer = () => {
  clearInterval(_intervalId);
  _intervalId = null;

  _state = {
    ..._state,
    status:    TIMER_STATUS.IDLE,
    remaining: _getInitialDuration(_state.mode),
    startedAt: null,
    sessionId: null,
  };

  clearTimerState();
  _notify('onTick', getTimerState());
};

/**
 * Switches between focus and break modes.
 * @param {string} mode - TIMER_MODE.FOCUS or TIMER_MODE.BREAK
 */
export const setTimerMode = (mode) => {
  clearInterval(_intervalId);
  _intervalId = null;

  _state = {
    ..._state,
    mode,
    status:    TIMER_STATUS.IDLE,
    remaining: _getInitialDuration(mode),
    startedAt: null,
    sessionId: null,
  };

  clearTimerState();
  _notify('onTick', getTimerState());
};


const _complete = () => {
  clearInterval(_intervalId);
  _intervalId = null;

  const completedState = getTimerState();
  _state.status = TIMER_STATUS.DONE;

  const { sessionsPerSet } = loadSettings();
  if (_state.mode === TIMER_MODE.FOCUS) {
    _state.sessionNumber = (_state.sessionNumber % sessionsPerSet) + 1;
  }

  clearTimerState();
  _notify('onComplete', completedState);
  _notify('onTick', getTimerState());

  // Auto-reset to idle after a beat
  setTimeout(() => {
    const nextMode = completedState.mode === TIMER_MODE.FOCUS
      ? TIMER_MODE.BREAK
      : TIMER_MODE.FOCUS;
    setTimerMode(nextMode);
  }, 1500);
};