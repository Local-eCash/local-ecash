import { CounterStateInterface } from './state';

export const countSelector = (state: CounterStateInterface): number => {
  return state.counter.count;
};
