
import { loadSettings }from './storage.js';
import { formattedToday }from './helpers.js';
import {
  startTimer, pauseTimer, resetTimer,
  setTimerMode, restoreTimerState,
  getTimerState, onTimer,
  TIMER_STATUS, TIMER_MODE,
}from './timer.js';
import {
  initTasks, addTask, completeTask,
  deleteTask, getTasks, getActiveTask,
  onTasksChange, doneCount,
}from './tasks.js';
import {
  recordSession, getTodayStats,
  getWeeklyStats, getTodaySessionLog,
  getCurrentStreak,
}from './stats.js';
import {
  getPermissionStatus, requestPermission,
  notifyFocusComplete, notifyBreakComplete,
}from './notifications.js';
import {
  initUI, renderTimer, renderTasks,
  renderStats, renderWeeklyChart,
  renderSessionLog, renderDate,
  renderNotifyButton, showToast,
}from './ui.js';

const init = () => {
  // 1. Init UI (caches DOM element references)
  initUI();

  // 2. Init domain modules
  initTasks();

  // 3. Wire all event listeners
  _bindTimerControls();
  _bindTaskControls();
  _bindModeTab();
  _bindNotificationButton();
  _bindKeyboardShortcuts();

  // 4. Subscribe to state changes → re-render
  onTimer('onTick',     _handleTimerTick);
  onTimer('onComplete', _handleTimerComplete);
  onTasksChange(_handleTasksChange);

  // 5. Restore persisted timer (survives page refresh)
  const restored = restoreTimerState();

  // 6. Initial render pass — paint the UI with current state
  _refreshAll();

  // 7. Render header
  renderDate(formattedToday());
  renderNotifyButton(getPermissionStatus());

  if (restored) showToast('⏱ Timer restored');
};


const _handleTimerTick = (state) => {
  renderTimer(state);
};


const _handleTimerComplete = (completedState) => {
  const activeTask = getActiveTask();

  if (completedState.mode === TIMER_MODE.FOCUS) {
    // Record the session in history and update streak
    recordSession(completedState, activeTask?.text ?? null);

    // Fire browser notification
    notifyFocusComplete(activeTask?.text ?? null);

    showToast('🎯 Focus session complete! Great work.');
  } else {
    notifyBreakComplete();
    showToast('⏰ Break over — back to it!');
  }

  _refreshStats();
};


const _handleTasksChange = (tasks) => {
  renderTasks(tasks, _onCompleteTask, _onDeleteTask);
  _refreshStats();

  const state = getTimerState();
  renderTimer(state);
};

const _onCompleteTask = (id) => {
  completeTask(id);
  showToast('✓ Task complete');
};

const _onDeleteTask = (id) => {
  deleteTask(id);
};


const _bindTimerControls = () => {
  document.getElementById('btn-start-pause').addEventListener('click', _toggleTimer);
  document.getElementById('btn-reset').addEventListener('click', () => {
    resetTimer();
    renderTimer(getTimerState());
    showToast('Timer reset');
  });
};

const _bindTaskControls = () => {
  const input  = document.getElementById('task-input');
  const btnAdd = document.getElementById('btn-add-task');

  const submit = () => {
    const text = input.value.trim();
    if (!text) return;
    addTask(text);
    input.value = '';
    input.focus();
  };

  btnAdd.addEventListener('click', submit);

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') submit();
  });
};

const _bindModeTab = () => {
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      // Update active tab styling
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('tab--active'));
      tab.classList.add('tab--active');

      const mode = tab.dataset.mode === 'focus' ? TIMER_MODE.FOCUS : TIMER_MODE.BREAK;
      setTimerMode(mode);
      renderTimer(getTimerState());
    });
  });
};

const _bindNotificationButton = () => {
  document.getElementById('btn-notify-permission').addEventListener('click', async () => {
    const result = await requestPermission();
    renderNotifyButton(result);

    if (result === 'granted') showToast('🔔 Notifications enabled');
    if (result === 'denied')  showToast('🔕 Notifications blocked — enable in browser settings');
  });
};


const _bindKeyboardShortcuts = () => {
  document.addEventListener('keydown', (e) => {
    // Guard: don't intercept shortcuts when focus is inside a text input
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if (e.metaKey || e.ctrlKey) return; // don't intercept browser shortcuts

    switch (e.key) {
      case ' ':
        e.preventDefault(); // prevent page scroll on Space
        _toggleTimer();
        break;

      case 'n':
      case 'N':
        e.preventDefault();
        document.getElementById('task-input').focus();
        break;

      case 'r':
      case 'R':
        resetTimer();
        renderTimer(getTimerState());
        showToast('Timer reset');
        break;
    }
  });
};


const _toggleTimer = () => {
  const { status } = getTimerState();

  if (status === TIMER_STATUS.RUNNING) {
    pauseTimer();
    showToast('Paused');
  } else {
    startTimer();

    // If there's an active task, surface it in a toast
    const active = getActiveTask();
    if (active) showToast(`▶ Focusing on: ${active.text}`);
  }

  renderTimer(getTimerState());
};


const _refreshStats = () => {
  const todayStats = getTodayStats();

  renderStats({
    formattedTime:  todayStats.formattedTime,
    sessionCount:   todayStats.sessionCount,
    tasksCompleted: doneCount(),
    streak:         getCurrentStreak(),
  });

  renderWeeklyChart(getWeeklyStats());
  renderSessionLog(getTodaySessionLog());
};

const _refreshAll = () => {
  renderTimer(getTimerState());
  renderTasks(getTasks(), _onCompleteTask, _onDeleteTask);
  _refreshStats();
};

init();
