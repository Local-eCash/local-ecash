// import { counterReducer } from '@bcpros/counter';
import {
  WalletState,
  accountReducer,
  actionReducer,
  actionSheetReducer,
  api,
  burnReducer,
  categoryReducer,
  claimReducer,
  countryReducer,
  envelopeReducer,
  errorReducer,
  lixiReducer,
  loadingReducer,
  localUserAccountReducer,
  messageReducer,
  modalReducer,
  notificationReducer,
  pageReducer,
  paymentMethodReducer,
  postReducer,
  settingsReducer,
  stateReducer,
  toastReducer,
  tokenReducer,
  walletStateReducer
} from '@bcpros/redux-store';
import { combineReducers } from '@reduxjs/toolkit';
import { PersistConfig, persistReducer } from 'redux-persist';
import storage from './storage';

const walletPersistConfig: PersistConfig<WalletState> = {
  key: 'wallet',
  storage
};

const reducer = combineReducers({
  // counter: counterReducer,
  wallet: persistReducer(walletPersistConfig, walletStateReducer),
  accounts: accountReducer,
  localAccounts: localUserAccountReducer,
  posts: postReducer,
  lixies: lixiReducer,
  claims: claimReducer,
  settings: settingsReducer,
  pages: pageReducer,
  tokens: tokenReducer,
  notifications: notificationReducer,
  envelopes: envelopeReducer,
  loading: loadingReducer,
  modal: modalReducer,
  actionSheet: actionSheetReducer,
  toast: toastReducer,
  error: errorReducer,
  countries: countryReducer,
  states: stateReducer,
  categories: categoryReducer,
  burn: burnReducer,
  pageMessage: messageReducer,
  paymentMethods: paymentMethodReducer,
  [api.reducerPath]: api.reducer,
  action: actionReducer
});

export default reducer;
