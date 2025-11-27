// lib/store/index.ts
import { configureStore } from '@reduxjs/toolkit';
import userSlice from './slices/userSlice';
import authSlice from './slices/authSlice';
import rolesSlice from './slices/rolesSlice';
import systemSettingsSlice from './slices/systemSettingsSlice'; 
import dashboardSlice from './slices/dashboardSlice';
import mdasSlice from './slices/mdaSlice'; 
import meetingsSlice from './slices/meetingsSlice';
import resourcesSlice from './slices/resourcesSlice'; 

export const makeStore = () => {
  return configureStore({
    reducer: {
      user: userSlice,
      auth: authSlice,
      roles: rolesSlice,
      systemSettings: systemSettingsSlice,
      dashboard: dashboardSlice,
      mdas: mdasSlice,
      meetings: meetingsSlice,
      resources: resourcesSlice,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: {
          ignoredActions: ['persist/PERSIST'],
        },
      }),
  });
};

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];