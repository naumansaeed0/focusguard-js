
import { loadTasks, saveTasks } from './storage.js';
import { generateId } from './helpers.js';



let _tasks = [];

const _callbacks = {
  onChange: [],
};

const _notify = () => {
  _callbacks.onChange.forEach(fn => fn([..._tasks]));
};

const _persist = () => saveTasks(_tasks);


/**
 * Load tasks from storage into memory. Call once on app init.
 */
export const initTasks = () => {
  _tasks = loadTasks();
  _notify();
};


/**
 * Subscribe to task list changes.
 * @param {Function} callback - receives a copy of the task array
 */
export const onTasksChange = (callback) => {
  _callbacks.onChange.push(callback);
};


/**
 * @returns {Array} Shallow copy of all tasks.
 */
export const getTasks = () => [..._tasks];

/**
 * @returns {Object|null} The first incomplete task — the "active" task.
 */
export const getActiveTask = () =>
  _tasks.find(t => !t.done) ?? null;

/**
 * Adds a new task to the end of the queue.
 * @param {string} text
 * @returns {Object} The new task object.
 */
export const addTask = (text) => {
  const trimmed = text.trim();
  if (!trimmed) return null;

  const task = {
    id:        generateId(),
    text:      trimmed,
    done:      false,
    createdAt: Date.now(),
  };

  _tasks.push(task);
  _persist();
  _notify();

  return task;
};

/**
 * Marks a task as done by ID.
 * @param {string} id
 */
export const completeTask = (id) => {
  const task = _tasks.find(t => t.id === id);
  if (!task || task.done) return;

  task.done      = true;
  task.doneAt    = Date.now();

  _persist();
  _notify();
};

/**
 * Deletes a task by ID.
 * @param {string} id
 */
export const deleteTask = (id) => {
  const index = _tasks.findIndex(t => t.id === id);
  if (index === -1) return;

  _tasks.splice(index, 1);
  _persist();
  _notify();
};

/**
 * Returns the count of incomplete tasks.
 * @returns {number}
 */
export const pendingCount = () => _tasks.filter(t => !t.done).length;

/**
 * Returns the count of completed tasks.
 * @returns {number}
 */
export const doneCount = () => _tasks.filter(t => t.done).length;