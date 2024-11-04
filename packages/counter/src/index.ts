import { configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import { counterReducer } from './reducer';
import { CounterStateInterface } from './state';

// This function would configure a "local" store if called, but currently it is
// not called, and is just used for type inference.
const configureLocalStore = () =>
  configureStore({
    reducer: { counter: counterReducer }
  });

export let useSliceSelector: TypedUseSelectorHook<CounterStateInterface> = useSelector;

type SliceDispatch = ReturnType<typeof configureLocalStore>['dispatch'];

export let useSliceDispatch = () => useDispatch<SliceDispatch>();

// Allows initializing of this package by a calling package with the "global"
// dispatch and selector hooks of that package, provided they satisfy this packages
// state and dispatch interfaces--which they will if the imported this package and
// used it to compose their store.
export const initializeSlicePackage = (
  useAppDispatch: typeof useSliceDispatch,
  useAppSelector: typeof useSliceSelector
) => {
  useSliceDispatch = useAppDispatch;
  useSliceSelector = useAppSelector;
};

export * from './actions';
export * from './saga';
export * from './selectors';
export * from './state';
export { counterReducer };
