import { Action } from '@reduxjs/toolkit';
import { ThunkAction } from 'redux-thunk';

export type CounterStateInterface = {
  counter: CountState;
};

export interface CountState {
  count: number;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
type SliceThunkInterface<ReturnType = void> = ThunkAction<ReturnType, CounterStateInterface, unknown, Action<string>>;
