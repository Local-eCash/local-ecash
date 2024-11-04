'use client';

import {
  AuthenticationProvider,
  AuthorizationProvider,
  ServiceWorkerProvider,
  SocketProvider,
  WalletProviderNode,
  callConfig
} from '@bcpros/redux-store';
import { Box, CircularProgress } from '@mui/material';
import { setupListeners } from '@reduxjs/toolkit/query';
import { initWasm } from 'ecash-lib';
import React, { useEffect, useRef, useState } from 'react';
import OutsideCallConsumer from 'react-outside-call';
import { Provider } from 'react-redux';
import { persistStore, type Persistor } from 'redux-persist';
import { PersistGate } from 'redux-persist/integration/react';
import { AppStore, makeStore } from './store';
const PGate = PersistGate;

interface ReduxProviderProps {
  children: React.ReactNode;
}

const LoadingComponent = () => {
  return (
    <React.Fragment>
      <Box sx={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress color="primary" />
      </Box>
    </React.Fragment>
  );
};

const ReduxProvider: React.FC<ReduxProviderProps> = ({ children }) => {
  const storeRef = useRef<AppStore>();
  const persistorRef = useRef<Persistor>({} as Persistor);
  const [isWasmInitialized, setIsWasmInitialized] = useState(false);
  if (!storeRef.current) {
    storeRef.current = makeStore();
    persistorRef.current = persistStore(storeRef.current);
  }
  useEffect(() => {
    if (storeRef.current != null) {
      // configure listeners using the provided defaults
      // optional, but required for `refetchOnFocus`/`refetchOnReconnect` behaviors
      const unsubscribe = setupListeners(storeRef.current.dispatch);

      return unsubscribe;
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      await initWasm().then(() => {
        setIsWasmInitialized(true);
      });
    };

    init();
  }, []);

  if (!isWasmInitialized) {
    return <LoadingComponent />;
  }

  return (
    <React.Fragment>
      <Provider store={storeRef.current}>
        <PGate persistor={persistorRef.current} loading={<LoadingComponent />}>
          <SocketProvider>
            <ServiceWorkerProvider>
              <WalletProviderNode>
                <AuthenticationProvider>
                  <AuthorizationProvider>
                    <OutsideCallConsumer config={callConfig}>{children}</OutsideCallConsumer>
                  </AuthorizationProvider>
                </AuthenticationProvider>
              </WalletProviderNode>
            </ServiceWorkerProvider>
          </SocketProvider>
        </PGate>
      </Provider>
    </React.Fragment>
  );
};

export default ReduxProvider;
