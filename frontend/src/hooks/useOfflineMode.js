import { useState, useEffect, useCallback } from 'react';

export function useOfflineMode() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lowDataMode, setLowDataMode] = useState(
    localStorage.getItem('ppoint_low_data_mode') === 'true'
  );
  const [bandwidth, setBandwidth] = useState('4g');
  const [dataUsage, setDataUsage] = useState(0);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Detect bandwidth
    if (navigator.connection) {
      const connection = navigator.connection;
      const effectiveType = connection.effectiveType;
      setBandwidth(effectiveType);

      const handleChange = () => setBandwidth(connection.effectiveType);
      connection.addEventListener('change', handleChange);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
        connection.removeEventListener('change', handleChange);
      };
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const toggleLowDataMode = useCallback(() => {
    const newValue = !lowDataMode;
    setLowDataMode(newValue);
    localStorage.setItem('ppoint_low_data_mode', newValue);
  }, [lowDataMode]);

  const shouldLoadImage = useCallback((priority = 'normal') => {
    if (lowDataMode && priority !== 'critical') return false;
    if (bandwidth === 'slow-2g' || bandwidth === '2g') return priority === 'critical';
    return true;
  }, [lowDataMode, bandwidth]);

  const getImageQuality = useCallback(() => {
    if (lowDataMode) return 0.5;
    if (bandwidth === 'slow-2g' || bandwidth === '2g') return 0.6;
    if (bandwidth === '3g') return 0.7;
    return 1.0;
  }, [lowDataMode, bandwidth]);

  const shouldPrefetch = useCallback(() => {
    return isOnline && !lowDataMode && (bandwidth === '4g' || bandwidth === 'wifi');
  }, [isOnline, lowDataMode, bandwidth]);

  return {
    isOnline,
    lowDataMode,
    toggleLowDataMode,
    bandwidth,
    dataUsage,
    shouldLoadImage,
    getImageQuality,
    shouldPrefetch,
  };
}
