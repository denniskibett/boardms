// hooks/useSystemSettingsRedux.ts
import { useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '@/lib/store/hooks';
import { fetchSystemSettings } from '@/lib/store/slices/systemSettingsSlice';

export const useSystemSettingsRedux = () => {
  const dispatch = useAppDispatch();
  const { settings, loading, error } = useAppSelector((state) => state.systemSettings);

  useEffect(() => {
    if (!settings) {
      dispatch(fetchSystemSettings());
    }
  }, [dispatch, settings]);

  const getSystemName = () => {
    return settings?.name || 'E-Cabinet System';
  };

  const getSystemTimezone = () => {
    return settings?.timezone || 'Africa/Nairobi';
  };

  const getSystemDateFormat = () => {
    return settings?.date_format || 'DD/MM/YYYY';
  };

  return {
    settings,
    loading,
    error,
    getSystemName,
    getSystemTimezone,
    getSystemDateFormat,
    refetch: () => dispatch(fetchSystemSettings()),
  };
};