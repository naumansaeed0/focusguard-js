const KEYS = {
  TIMER_STATE:     'fg_timer_state',
  TASKS:           'fg_tasks',
  SESSION_HISTORY: 'fg_session_history',
  SETTINGS:        'fg_settings',
  STREAK:          'fg_streak',
};

const safeParse = (raw) => {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const get = (key) => safeParse(localStorage.getItem(key));
const set = (key, value) => localStorage.setItem(key, JSON.stringify(value));
const remove = (key) => localStorage.removeItem(key);

export const saveTimerState = (state) => set(KEYS.TIMER_STATE, state);
export const loadTimerState = () => get(KEYS.TIMER_STATE);
export const clearTimerState = () => remove(KEYS.TIMER_STATE);
export const loadTasks = () => get(KEYS.TASKS) ?? [];
export const saveTasks = (tasks) => set(KEYS.TASKS, tasks);
export const loadSessionHistory = () => get(KEYS.SESSION_HISTORY) ?? [];
export const saveSession = (session) => {
  const history = loadSessionHistory();
  history.push(session);
  set(KEYS.SESSION_HISTORY, history);
};
export const loadStreak = () =>
  get(KEYS.STREAK) ?? { currentStreak: 0, lastActiveDate: null };

export const saveStreak = (streak) => set(KEYS.STREAK, streak);

const DEFAULT_SETTINGS = {
  focusDuration:  25 * 60, // seconds
  breakDuration:  5  * 60,
  sessionsPerSet: 4,
  notifyEnabled:  false,
};

export const loadSettings = () => ({
  ...DEFAULT_SETTINGS,
  ...(get(KEYS.SETTINGS) ?? {}),
});

export const saveSettings = (patch) => {
  const current = loadSettings();
  set(KEYS.SETTINGS, { ...current, ...patch });
};