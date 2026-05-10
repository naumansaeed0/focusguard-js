
import {
  loadSessionHistory,
  saveSession,
  loadStreak,
  saveStreak,
} from './storage.js';
import {
  toDateKey,
  todayKey,
  lastNDays,
  isConsecutiveDay,
  formatDuration,
} from './helpers.js';
import { TIMER_MODE } from './timer.js';


export const recordSession = (timerState, taskName = null) => {
  if (timerState.mode !== TIMER_MODE.FOCUS) return; // don't record breaks

  const session = {
    id:        timerState.sessionId,
    startedAt: timerState.startedAt,
    endedAt:   Date.now(),
    duration:  timerState.startedAt
                 ? Math.floor((Date.now() - timerState.startedAt) / 1000)
                 : 25 * 60,
    taskName,
    date:      todayKey(),
  };

  saveSession(session);
  _updateStreak();

  return session;
};

export const getTodayStats = () => {
  const today    = todayKey();
  const sessions = loadSessionHistory().filter(s => s.date === today);

  const focusSeconds = sessions.reduce((total, s) => total + s.duration, 0);

  return {
    focusSeconds,
    sessionCount:  sessions.length,
    formattedTime: formatDuration(focusSeconds),
  };
};

export const getWeeklyStats = () => {
  const history = loadSessionHistory();
  const days    = lastNDays(7);

  const secondsByDay = history.reduce((acc, session) => {
    const key = session.date ?? toDateKey(session.startedAt);
    acc[key]  = (acc[key] ?? 0) + session.duration;
    return acc;
  }, {});

  return days.map(date => ({
    date,
    minutes: Math.round((secondsByDay[date] ?? 0) / 60),
  }));
};


export const getTodaySessionLog = () => {
  const today = todayKey();
  return loadSessionHistory()
    .filter(s => s.date === today)
    .reverse();
};

export const getCurrentStreak = () => loadStreak().currentStreak;

const _updateStreak = () => {
  const today  = todayKey();
  const streak = loadStreak();

  if (streak.lastActiveDate === today) return; // already counted today

  if (
    streak.lastActiveDate !== null &&
    isConsecutiveDay(streak.lastActiveDate, today)
  ) {
    streak.currentStreak += 1; // extend streak
  } else if (streak.lastActiveDate === null) {
    streak.currentStreak = 1; // first ever session
  } else {
    streak.currentStreak = 1; // gap detected — reset streak
  }

  streak.lastActiveDate = today;
  saveStreak(streak);
};

export const getAverageSessionLength = () => {
  const sessions = loadSessionHistory();
  if (sessions.length === 0) return '0m';

  const total   = sessions.reduce((sum, s) => sum + s.duration, 0);
  const average = Math.floor(total / sessions.length);

  return formatDuration(average);
};