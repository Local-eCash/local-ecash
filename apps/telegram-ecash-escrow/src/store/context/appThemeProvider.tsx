'use client';

import { darkTheme, lightTheme } from '@/src/theme/theme';
import {
  getCurrentThemes,
  getIsSystemThemes,
  setCurrentThemes,
  useSliceDispatch as useLixiSliceDispatch,
  useSliceSelector as useLixiSliceSelector
} from '@bcpros/redux-store';
import { ThemeProvider } from '@mui/material/styles';
import { useEffect, useMemo } from 'react';
import { useDetectTheme } from '../custom-hooks/useDetectTheme';

export const AppThemeProvider = ({ children }) => {
  const dispatch = useLixiSliceDispatch();

  const currentDeviceTheme = useDetectTheme();
  const isSystemTheme = useLixiSliceSelector(getIsSystemThemes);
  const currentTheme = useLixiSliceSelector(getCurrentThemes);

  const theme = useMemo(() => (currentTheme === 'light' ? lightTheme : darkTheme), [currentTheme]);

  useEffect(() => {
    if (isSystemTheme) {
      dispatch(setCurrentThemes(currentDeviceTheme));
    }
  }, [isSystemTheme, currentDeviceTheme]);

  return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
};
