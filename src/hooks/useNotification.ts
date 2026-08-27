import { useCallback, useEffect, useState } from 'react';

export function useNotification() {
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    if (!('Notification' in window)) return;
    setPermission(Notification.permission);
  }, []);

  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) return;
    const result = await Notification.requestPermission();
    setPermission(result);
    return result;
  }, []);

  const notify = useCallback(
    (title: string, body: string) => {
      if (!('Notification' in window) || Notification.permission !== 'granted') return;
      new Notification(title, { body });
    },
    [],
  );

  return { permission, requestPermission, notify };
}
