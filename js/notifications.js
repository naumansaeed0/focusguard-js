
export const getPermissionStatus = () => {
  if (!('Notification' in window)) return 'unsupported';
  return Notification.permission;
};


export const requestPermission = async () => {
  if (!('Notification' in window)) return 'unsupported';
  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission === 'denied') return 'denied';

  // This is the async permission dialog — same await pattern as geolocation
  const result = await Notification.requestPermission();
  return result;
};


const _show = (title, options = {}) => {
  if (Notification.permission !== 'granted') return;

  const notification = new Notification(title, {
    icon: options.icon ?? 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">◎</text></svg>',
    body: options.body ?? '',
    tag:  options.tag  ?? 'focusguard', 
    ...options,
  });

  setTimeout(() => notification.close(), 5000);

  return notification;
};

export const notifyFocusComplete = (taskName = null) => {
  const body = taskName
    ? `You finished a session on "${taskName}". Time for a break!`
    : 'Focus session complete. Take a well-earned break!';

  return _show('🎯 Focus Session Complete', { body, tag: 'fg-focus-done' });
};


export const notifyBreakComplete = () => {
  return _show('⏰ Break Over', {
    body: 'Ready to get back in the zone?',
    tag:  'fg-break-done',
  });
};