import { put, takeEvery } from 'redux-saga/effects';

import { decrement, increment } from './actions';

function* incrementWorker() {
  yield put(increment());
}

function* decrementWatcher() {
  yield put(decrement());
  // let count: ReturnType<typeof countSelector> = yield select(countSelector)
}

export function* countWatcher() {
  yield takeEvery(increment.type, incrementWorker);
  yield takeEvery(decrement.type, decrementWatcher);
}
