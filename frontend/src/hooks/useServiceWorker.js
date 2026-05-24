import { useEffect, useState } from 'react';

export function useServiceWorker() {
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [swRegistration, setSwRegistration] = useState(null);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .then((registration) => {
          setSwRegistration(registration);
          // Check for updates every hour
          setInterval(() => {
            registration.update();
          }, 3600000);
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error);
        });
    }

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const triggerSync = async (tag = 'sync-addresses') => {
    if (swRegistration && 'sync' in swRegistration) {
      try {
        await swRegistration.sync.register(tag);
        return true;
      } catch (error) {
        console.error('Background sync failed:', error);
        return false;
      }
    }
    return false;
  };

  const subscribeToPush = async (subscription) => {
    if (swRegistration && 'pushManager' in swRegistration) {
      try {
        await swRegistration.pushManager.subscribe(subscription);
        return true;
      } catch (error) {
        console.error('Push subscription failed:', error);
        return false;
      }
    }
    return false;
  };

  return {
    isOnline,
    swRegistration,
    triggerSync,
    subscribeToPush,
  };
}

export default useServiceWorker;
