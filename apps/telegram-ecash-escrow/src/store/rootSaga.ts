import {
  accountSaga,
  analyticEventSaga,
  burnSaga,
  categorySaga,
  claimSaga,
  commentSaga,
  countrySaga,
  envelopeSaga,
  escrowSaga,
  lixiSaga,
  localAccountSaga,
  messageSaga,
  notificationSaga,
  pageSaga,
  paymentMethodsSaga,
  postSaga,
  sendSaga,
  settingsSaga,
  tokenSaga,
  walletSaga,
  webpushSaga,
  websocketSaga
} from '@bcpros/redux-store';
import { all } from 'redux-saga/effects';

export function* emptySaga() {
  yield all([]);
}

export default function* rootSaga() {
  yield all([
    accountSaga(),
    walletSaga(),
    localAccountSaga(),
    lixiSaga(),
    sendSaga(),
    claimSaga(),
    envelopeSaga(),
    settingsSaga(),
    notificationSaga(),
    webpushSaga(),
    pageSaga(),
    postSaga(),
    commentSaga(),
    countrySaga(),
    tokenSaga(),
    burnSaga(),
    categorySaga(),
    messageSaga(),
    websocketSaga(),
    analyticEventSaga(),
    paymentMethodsSaga(),
    escrowSaga()
  ]);
}
