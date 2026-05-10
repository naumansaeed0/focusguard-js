
import { formatTime, formatTimeOfDay, formatDuration, dayLabel, todayKey } from './helpers.js';
import { TIMER_STATUS, TIMER_MODE } from './timer.js';


const el = {};

export const initUI = () => {
  el.timerMinutes      = document.getElementById('timer-minutes');
  el.timerSeconds      = document.getElementById('timer-seconds');
  el.timerColon        = document.querySelector('.timer-colon');
  el.timerLabel        = document.getElementById('timer-label');
  el.timerDisplay      = document.querySelector('.timer-display');
  el.btnStartPause     = document.getElementById('btn-start-pause');
  el.sessionCount      = document.getElementById('session-count');
  el.taskList          = document.getElementById('task-list');
  el.taskCount         = document.getElementById('task-count');
  el.taskEmptyState    = document.getElementById('task-empty-state');
  el.taskInput         = document.getElementById('task-input');
  el.statFocusHours    = document.getElementById('stat-focus-hours');
  el.statSessions      = document.getElementById('stat-sessions');
  el.statTasksDone     = document.getElementById('stat-tasks-done');
  el.statStreak        = document.getElementById('stat-streak');
  el.weeklyChart       = document.getElementById('weekly-chart');
  el.weeklyChartLabels = document.getElementById('weekly-chart-labels');
  el.sessionLog        = document.getElementById('session-log');
  el.logEmptyState     = document.getElementById('log-empty-state');
  el.currentDate       = document.getElementById('current-date');
  el.toast             = document.getElementById('toast');
  el.btnNotify         = document.getElementById('btn-notify-permission');
};


export const renderTimer = (state) => {
  const [mm, ss] = formatTime(state.remaining).split(':');

  el.timerMinutes.textContent = mm;
  el.timerSeconds.textContent = ss;

  // Update mode class for color switching (focus = amber, break = green)
  el.timerDisplay.classList.toggle('break-mode', state.mode === TIMER_MODE.BREAK);

  // Pause/resume colon animation based on state
  el.timerColon.classList.toggle('paused', state.status !== TIMER_STATUS.RUNNING);

  // Update button label
  el.btnStartPause.textContent = state.status === TIMER_STATUS.RUNNING ? 'Pause' : 'Start';

  // Update session counter
  el.sessionCount.textContent = state.sessionNumber ?? 1;

  // Update contextual label
  el.timerLabel.textContent = _getTimerLabel(state);

  // Update page title — useful when the tab is in background
  document.title = `${formatTime(state.remaining)} — FocusGuard`;
};

const _getTimerLabel = ({ status, mode }) => {
  if (status === TIMER_STATUS.IDLE)    return mode === TIMER_MODE.FOCUS ? 'Ready to focus?' : 'Ready for a break?';
  if (status === TIMER_STATUS.RUNNING) return mode === TIMER_MODE.FOCUS ? 'Stay in the zone.' : 'Rest up.';
  if (status === TIMER_STATUS.PAUSED)  return 'Paused.';
  if (status === TIMER_STATUS.DONE)    return mode === TIMER_MODE.FOCUS ? '✓ Session complete!' : '✓ Break done!';
  return '';
};


export const renderTasks = (tasks, onComplete, onDelete) => {
  el.taskList.innerHTML = '';

  const pending = tasks.filter(t => !t.done);
  const done    = tasks.filter(t => t.done);
  const ordered = [...pending, ...done]; 

  el.taskCount.textContent = pending.length;
  el.taskEmptyState.style.display = tasks.length === 0 ? 'block' : 'none';

  ordered.forEach((task, index) => {
    const li = document.createElement('li');
    li.className = [
      'task-item',
      index === 0 && !task.done ? 'task-item--active' : '',
      task.done ? 'task-item--done' : '',
    ].filter(Boolean).join(' ');

    li.dataset.id = task.id;

    li.innerHTML = `
      <button class="task-checkbox ${task.done ? 'checked' : ''}"
              aria-label="${task.done ? 'Completed' : 'Mark complete'}"
              data-action="complete">
        ${task.done ? '✓' : ''}
      </button>
      <span class="task-text">${_escapeHtml(task.text)}</span>
      <button class="task-delete" aria-label="Delete task" data-action="delete">×</button>
    `;

    li.addEventListener('click', (e) => {
      const action = e.target.closest('[data-action]')?.dataset.action;
      if (action === 'complete') onComplete(task.id);
      if (action === 'delete')   onDelete(task.id);
    });

    el.taskList.appendChild(li);
  });
};


export const renderStats = ({ formattedTime, sessionCount, tasksCompleted, streak }) => {
  el.statFocusHours.textContent = formattedTime;
  el.statSessions.textContent   = sessionCount;
  el.statTasksDone.textContent  = tasksCompleted;
  el.statStreak.textContent     = `🔥 ${streak}`;
};


export const renderWeeklyChart = (weekData) => {
  el.weeklyChart.innerHTML       = '';
  el.weeklyChartLabels.innerHTML = '';

  const today  = todayKey();
  const maxMin = Math.max(...weekData.map(d => d.minutes), 1); // avoid div-by-zero

  weekData.forEach(({ date, minutes }) => {
    const heightPct = Math.round((minutes / maxMin) * 100);

    const bar = document.createElement('div');
    bar.className = `chart-bar ${date === today ? 'chart-bar--today' : ''}`;
    bar.style.height = `${heightPct}%`;
    bar.title = `${dayLabel(date)}: ${minutes}m`;
    el.weeklyChart.appendChild(bar);

    const label = document.createElement('span');
    label.className   = 'chart-label';
    label.textContent = date === today ? 'Today' : dayLabel(date).slice(0, 2);
    el.weeklyChartLabels.appendChild(label);
  });
};


export const renderSessionLog = (sessions) => {
  el.sessionLog.innerHTML = '';
  el.logEmptyState.style.display = sessions.length === 0 ? 'block' : 'none';

  sessions.forEach(session => {
    const li = document.createElement('li');
    li.className = 'log-item';

    li.innerHTML = `
      <span class="log-item-task">${_escapeHtml(session.taskName ?? 'Focus session')}</span>
      <span class="log-item-time">${formatTimeOfDay(session.startedAt)}</span>
      <span class="log-item-duration">${formatDuration(session.duration)}</span>
    `;

    el.sessionLog.appendChild(li);
  });
};


let _toastTimeout = null;


export const showToast = (message, duration = 2500) => {
  clearTimeout(_toastTimeout);

  el.toast.textContent = message;
  el.toast.classList.add('toast--visible');

  _toastTimeout = setTimeout(() => {
    el.toast.classList.remove('toast--visible');
  }, duration);
};


export const renderNotifyButton = (status) => {
  if (!el.btnNotify) return;

  const labels = {
    default:     '🔔 Enable Alerts',
    granted:     '🔔 Alerts On',
    denied:      '🔕 Alerts Blocked',
    unsupported: '',
  };

  el.btnNotify.textContent = labels[status] ?? '';
  el.btnNotify.disabled    = status === 'granted' || status === 'denied' || status === 'unsupported';
  el.btnNotify.style.display = status === 'unsupported' ? 'none' : '';
};


export const renderDate = (dateString) => {
  el.currentDate.textContent = dateString;
};


const _escapeHtml = (str) =>
  str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');