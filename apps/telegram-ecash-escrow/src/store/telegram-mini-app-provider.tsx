'use client';

import {
  accountsApi,
  axiosClient,
  getSelectedWalletPath,
  removeAllWallets,
  useSliceDispatch as useLixiSliceDispatch,
  useSliceSelector as useLixiSliceSelector
} from '@bcpros/redux-store';
import { useUpdateAccountTelegramUsernameMutation } from '@bcpros/redux-store/build/main/store/account/accounts.api';
import SignalWifiConnectedNoInternet4Icon from '@mui/icons-material/SignalWifiConnectedNoInternet4';
import { Backdrop, Button, Stack, Typography } from '@mui/material';
import { LaunchParams, init, postEvent, retrieveLaunchParams } from '@telegram-apps/sdk-react';
import { signOut, useSession } from 'next-auth/react';
import { usePathname, useRouter } from 'next/navigation';
import { createContext, useEffect, useState } from 'react';

export type TelegramMiniAppValue = {
  launchParams?: LaunchParams;
};

const defaultTelegramMiniAppValue: TelegramMiniAppValue = {
  launchParams: undefined
};

export const TelegramMiniAppContext = createContext<TelegramMiniAppValue>(defaultTelegramMiniAppValue);

export function TelegramMiniAppProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const path = usePathname();
  const dispatch = useLixiSliceDispatch();
  const { data: sessionData } = useSession();
  const selectedWalletPath = useLixiSliceSelector(getSelectedWalletPath);
  const { useGetAccountByAddressQuery } = accountsApi;

  const [launchParams, setLaunchParams] = useState<LaunchParams | undefined>(undefined);
  const [mismatchAccount, setMismatchAccount] = useState(false);
  const [networkError, setNetworkError] = useState(false);
  const [createTriggerUpdateAccountTelegramUsername] = useUpdateAccountTelegramUsernameMutation();
  const { currentData: accountQueryData } = useGetAccountByAddressQuery(
    { address: selectedWalletPath?.xAddress },
    { skip: !selectedWalletPath || !sessionData }
  );

  useEffect(() => {
    if (selectedWalletPath && sessionData) {
      (async () => {
        try {
          await axiosClient.get(`/api/accounts/telegram`, {
            params: {
              telegramId: sessionData.user.id,
              publicKey: selectedWalletPath.publicKey
            }
          });
        } catch (e) {
          if (e.message === 'Network Error') {
            setNetworkError(true);

            return;
          }

          setMismatchAccount(true);
        }
      })();
    }
  }, [selectedWalletPath, sessionData]);

  useEffect(() => {
    try {
      init();
      setLaunchParams(retrieveLaunchParams());
      postEvent('web_app_expand');
      postEvent('web_app_setup_closing_behavior', { need_confirmation: true });
    } catch (e) {
      console.log('not telegram mini app env');
    }
  }, []);

  useEffect(() => {
    if (launchParams && launchParams.startParam) {
      const [param1, param2, id] = launchParams.startParam.split('_');
      router.push(`/${param1}-${param2}?id=${id}`);
    }
  }, [launchParams]);

  useEffect(() => {
    sessionData &&
      accountQueryData &&
      accountQueryData?.getAccountByAddress.telegramUsername !== sessionData?.user.name &&
      createTriggerUpdateAccountTelegramUsername({
        telegramId: sessionData.user.id,
        telegramUsername: sessionData.user.name
      });
  }, [sessionData, accountQueryData?.getAccountByAddress]);

  if (mismatchAccount) {
    return (
      <Backdrop sx={theme => ({ color: '#fff', zIndex: theme.zIndex.drawer + 1 })} open={true}>
        <Stack>
          <Typography variant="h5" align="center">
            Mismatch Telegram account with current wallet
          </Typography>
          <Typography variant="body1" align="center">
            Please sign out and try again!
          </Typography>
          <Button
            variant="contained"
            style={{ marginTop: '15px' }}
            onClick={() => {
              dispatch(removeAllWallets());
              signOut({ redirect: true, callbackUrl: '/' });
            }}
          >
            Sign Out
          </Button>
        </Stack>
      </Backdrop>
    );
  }

  if (networkError) {
    return (
      <Backdrop
        sx={theme => ({ color: '#fff', zIndex: theme.zIndex.drawer + 1, backgroundColor: 'black' })}
        open={true}
      >
        <Stack alignItems="center">
          <SignalWifiConnectedNoInternet4Icon fontSize="large" />
          <Typography variant="h5">Network Error</Typography>
          <Typography variant="h5">Please try again later</Typography>
        </Stack>
      </Backdrop>
    );
  }

  if (selectedWalletPath === null && sessionData && !launchParams && path !== '/import') {
    return (
      <Backdrop sx={theme => ({ color: '#fff', zIndex: theme.zIndex.drawer + 1 })} open={true}>
        <Stack>
          <Typography variant="h5" align="center">
            No wallet detected
          </Typography>
          <Typography variant="body1" align="center">
            Please sign out and try again!
          </Typography>
          <Button
            variant="contained"
            style={{ marginTop: '15px' }}
            onClick={() => signOut({ redirect: true, callbackUrl: '/' })}
          >
            Sign Out
          </Button>
        </Stack>
      </Backdrop>
    );
  }

  return <TelegramMiniAppContext.Provider value={{ launchParams }}>{children}</TelegramMiniAppContext.Provider>;
}
