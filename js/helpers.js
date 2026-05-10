
export const formatTime = (totalSeconds) => {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  // padStart(2, '0') is JS's equivalent of Dart's toString().padLeft(2, '0')
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

export const formatDuration = (totalSeconds) => {
  const hours   = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
};


export const formatTimeOfDay = (timestamp) => {
  return new Date(timestamp).toLocaleTimeString([], {
    hour:   '2-digit',
    minute: '2-digit',
  });
};

export const toDateKey = (timestamp = Date.now()) => {
  return new Date(timestamp).toISOString().slice(0, 10);
};

export const todayKey = () => toDateKey();


export const lastNDays = (n) => {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (n - 1 - i));
    return toDateKey(d.getTime());
  });
};

export const dayLabel = (dateKey) => {
  return new Date(dateKey + 'T12:00:00').toLocaleDateString([], { weekday: 'short' });
};

export const isConsecutiveDay = (dateKeyA, dateKeyB) => {
  const msPerDay = 86_400_000;
  const a = new Date(dateKeyA + 'T12:00:00').getTime();
  const b = new Date(dateKeyB + 'T12:00:00').getTime();
  return b - a === msPerDay;
};

export const generateId = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;


export const clamp = (value, min, max) => Math.min(Math.max(value, min), max);


export const formattedToday = () => {
  return new Date().toLocaleDateString([], {
    weekday: 'long',
    day:     'numeric',
    month:   'long',
  });
};
