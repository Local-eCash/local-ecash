import { api, useXPI } from '@bcpros/redux-store';
import { Action, Store, ThunkAction, configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { getPersistConfig } from 'redux-deep-persist';
import { FLUSH, PAUSE, PERSIST, PURGE, REGISTER, REHYDRATE } from 'redux-persist';
import persistReducer from 'redux-persist/es/persistReducer';
import createSagaMiddleware, { Task } from 'redux-saga';
import rootReducer from './rootReducer';
import rootSaga, { emptySaga } from './rootSaga';
import storage from './storage';

export interface SagaStore extends Store {
  __sagaTask: Task;
}

const persistConfig = getPersistConfig({
  key: 'root',
  storage,

  blacklist: [
    `accounts.envelopeUpload`,
    'accounts.pageCoverUpload',
    'accounts.pageAvatarUpload',
    'accounts.postCoverUploads',
    'accounts.messageUploads',
    'accounts.leaderBoard',
    'accounts.graphqlRequestLoading',
    'accounts.productImageUploads',
    'accounts.accountInfoTemp',
    'accounts.commentUpload',
    'posts.selectedId',
    'pages.currentPageMessageSession',
    'settings.locale',
    'tokens',
    'notifications',
    'envelopes',
    'loading',
    'modal',
    'actionSheet',
    'toast',
    'error',
    'burn',
    'api',
    'action'
  ],
  rootReducer
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const makeStore = () => {
  const isServer = typeof window === 'undefined';
  const sagaMiddleware = createSagaMiddleware({
    context: {
      useXPI: useXPI
    }
  });

  const store = configureStore({
    reducer: persistedReducer,
    //@ts-expect-error: fix later
    middleware: getDefaultMiddleware => {
      return getDefaultMiddleware({
        serializableCheck: {
          ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER]
        }
      })
        .concat(api.middleware)
        .concat(sagaMiddleware);
    },
    devTools:
      process.env.NODE_ENV === 'production'
        ? false
        : {
            actionsDenylist: [
              'wallet/writeWalletStatus',
              'posts/setShowCreatePost',
              'analyticEvent/batchEvents',
              'analyticEvent/analyticEvent'
            ]
          }
  });
  setupListeners(store.dispatch);

  if (!isServer) {
    (store as SagaStore).__sagaTask = sagaMiddleware.run(rootSaga);
  } else {
    (store as SagaStore).__sagaTask = sagaMiddleware.run(emptySaga);
  }

  return store;
};

// Infer the type of makeStore
export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];
// Infer the `RootState` and `AppDispatch` types from the store itself
// export type RootState = ReturnType<typeof store.getState>;
export type AppThunk<ReturnType = void> = ThunkAction<ReturnType, RootState, unknown, Action<string>>;
