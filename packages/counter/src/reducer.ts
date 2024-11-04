import { createReducer } from '@reduxjs/toolkit';
import { decrement, increment } from './actions';
import { CountState } from './state';

const initialState: CountState = {
  count: 0
};

export const counterReducer = createReducer(initialState, builder => {
  builder
    .addCase(increment, state => {
      state.count += 1;
    })
    .addCase(decrement, state => {
      state.count -= 1;
    });
});
