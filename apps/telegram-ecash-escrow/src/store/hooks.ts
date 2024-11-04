// import { initializeSlicePackage as initializeCounterSlice } from '@bcpros/counter';
import { initializeSlicePackage as initializeLixiSlice } from '@bcpros/redux-store';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from './store';
// Use throughout your app instead of plain `useDispatch` and `useSelector`
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

// initializeCounterSlice(useAppDispatch, useAppSelector as TypedUseSelectorHook<any>);
initializeLixiSlice(useAppDispatch, useAppSelector as TypedUseSelectorHook<any>);
