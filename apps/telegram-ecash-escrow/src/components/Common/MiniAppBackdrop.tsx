import { TelegramMiniAppContext } from '@/src/store/telegram-mini-app-provider';
import { AccountType, COIN, GenerateAccountType, ImportAccountType } from '@bcpros/lixi-models';
import {
  WalletContextNode,
  axiosClient,
  generateAccount,
  getSelectedWalletPath,
  importAccount,
  useSliceDispatch as useLixiSliceDispatch,
  useSliceSelector as useLixiSliceSelector
} from '@bcpros/redux-store';
import styled from '@emotion/styled';
import SignalWifiConnectedNoInternet4Icon from '@mui/icons-material/SignalWifiConnectedNoInternet4';
import { Alert, Backdrop, Button, FormControl, Snackbar, Stack, TextField, Typography } from '@mui/material';
import { TelegramAuthData } from '@telegram-auth/react';
import _ from 'lodash';
import { signIn, useSession } from 'next-auth/react';
import React, { useContext, useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';

const ContainerImportWallet = styled.div`
  padding: 1rem;
  .header-receive {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    .title-icon {
      display: flex;
      align-items: center;
      gap: 5px;
    }
  }
  .coin-address {
    .address-string {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0.5rem;
      background: #5476eb42;
      color: #5476eb;
      width: fit-content;
      margin: auto;
      border-radius: 1rem;
      gap: 4px;
      svg {
        font-size: 14px;
      }
      span {
        font-size: 12px;
      }
    }
  }
  .receive-form {
    padding: 1rem 0;
    .title {
      margin: 0 0 10px 0;
    }
    .btn-import,
    .btn-create {
      font-weight: bold;
      width: 100%;
      margin-top: 3px;
    }
  }
`;

const MiniAppBackdrop = () => {
  const {
    handleSubmit,
    formState: { errors },
    control
  } = useForm();
  const { data: sessionData } = useSession();
  const dispatch = useLixiSliceDispatch();
  const { launchParams } = useContext(TelegramMiniAppContext);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [importSuccess, setImportSuccess] = useState(false);
  const [error, setError] = useState(false);
  const [networkError, setNetworkError] = useState(false);
  const [newAccountBackdrop, setNewAccountBackdrop] = useState(false);
  const selectedWalletPath = useLixiSliceSelector(getSelectedWalletPath);
  const { getXecWalletPublicKey } = useContext(WalletContextNode);

  const signInByLaunchParams = async () => {
    const { user, authDate, hash } = launchParams.initData;

    const data: TelegramAuthData & { isMiniApp: boolean } = {
      id: user.id,
      auth_date: Math.floor(new Date(authDate).getTime() / 1000),
      first_name: user.firstName,
      hash,
      last_name: user.lastName,
      photo_url: user.photoUrl,
      username: user.username,
      isMiniApp: true
    };

    try {
      await axiosClient.get(`/api/accounts/telegram/${data.id}`);

      await signIn('telegram-login', { redirect: false }, data as any);
    } catch (e) {
      if (e.message === 'Network Error') {
        setNetworkError(true);

        return;
      }

      if (e.response.data.message === 'The account does not exist in the database.') {
        setNewAccountBackdrop(true);
      }
    }
  };

  const handleCreateNewAccount = async () => {
    try {
      const { user, authDate, hash } = launchParams.initData;

      const data: TelegramAuthData & { isMiniApp: boolean } = {
        id: user.id,
        auth_date: Math.floor(new Date(authDate).getTime() / 1000),
        first_name: user.firstName,
        hash,
        last_name: user.lastName,
        photo_url: user.photoUrl,
        username: user.username,
        isMiniApp: true
      };

      const dataGenerateAccount: GenerateAccountType = {
        coin: COIN.XEC,
        telegramId: data.id.toString(),
        accountType: AccountType.NORMAL
      };

      dispatch(generateAccount(dataGenerateAccount));

      await signIn('telegram-login', { redirect: false }, data as any);

      setSuccess(true);
    } catch (e) {
      console.log('handleCreateNewAccount ~ e:', e);
    }
  };

  const importWallet = async (data: { recoveryPhrase: string }) => {
    const { recoveryPhrase } = data;
    const { id } = launchParams.initData.user;
    setLoading(true);
    try {
      const publicKey = await getXecWalletPublicKey(recoveryPhrase);

      await axiosClient.get(`/api/accounts/telegram`, {
        params: {
          telegramId: id,
          publicKey: publicKey
        }
      });

      const dataToImport: ImportAccountType = {
        coin: COIN.XEC,
        mnemonic: recoveryPhrase
      };

      dispatch(importAccount(dataToImport));

      setImportSuccess(true);
    } catch (e) {
      setError(true);
    }

    setLoading(false);
  };

  const handleCreateNewWallet = async () => {
    setLoading(true);
    try {
      const { id } = launchParams.initData.user;

      await axiosClient.get(`/api/accounts/telegram/unlink/${id}`);

      const dataGenerateAccount: GenerateAccountType = {
        coin: COIN.XEC,
        telegramId: id!.toString(),
        accountType: AccountType.NORMAL
      };

      dispatch(generateAccount(dataGenerateAccount));

      setSuccess(true);
    } catch (e) {
      console.log('handleCreateNewWal ~ e:', e);
      setError(true);
    }

    setLoading(false);
  };

  useEffect(() => {
    launchParams && signInByLaunchParams();
  }, [launchParams]);

  if (newAccountBackdrop) {
    return (
      <Backdrop
        sx={theme => ({ color: '#fff', zIndex: theme.zIndex.drawer + 1, backgroundColor: 'black' })}
        open={launchParams && (!sessionData || !selectedWalletPath)}
      >
        <Stack>
          <Typography variant="h5" align="center">
            Welcome to Local eCash
          </Typography>
          <Button
            className="btn-create"
            variant="contained"
            onClick={() => handleCreateNewAccount()}
            disabled={loading || success || !_.isNil(selectedWalletPath)}
          >
            Create new account
          </Button>
        </Stack>

        <Snackbar open={success} autoHideDuration={3500} onClose={() => setSuccess(false)}>
          <Alert severity="success" variant="filled" sx={{ width: '100%' }}>
            Congrats on your new wallet!
          </Alert>
        </Snackbar>
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

  return (
    <React.Fragment>
      <Backdrop
        sx={theme => ({ color: '#fff', zIndex: theme.zIndex.drawer + 1, backgroundColor: 'black' })}
        open={launchParams && (!sessionData || !selectedWalletPath)}
      >
        {!sessionData && selectedWalletPath && (
          <Stack>
            <Typography variant="h5" align="center">
              Signing In...
            </Typography>
          </Stack>
        )}

        {!selectedWalletPath && sessionData && (
          <ContainerImportWallet>
            <div className="receive-form">
              <p className="title" style={{ color: 'white' }}>
                We detected telegram account already exists. Please import your mnemonic seed phrase to continue.
              </p>
              <FormControl fullWidth={true}>
                <Controller
                  name="recoveryPhrase"
                  control={control}
                  defaultValue=""
                  rules={{ required: true }}
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextField
                      onChange={onChange}
                      onBlur={onBlur}
                      value={value}
                      disabled={loading || success || !_.isNil(selectedWalletPath)}
                      id="recoveryPhrase"
                      label="Recovery phrase"
                      placeholder="Enter your recovery phrase (12 words) in the correct order. Separate each word with a single space only (no commas or any other punctuation)."
                      color="primary"
                      variant="outlined"
                      required
                      multiline
                      rows={5}
                      error={errors.recoveryPhrase && true}
                      helperText={errors.recoveryPhrase && 'Valid mnemonic seed phrase required'}
                    />
                  )}
                />
              </FormControl>
              <Button
                className="btn-import"
                variant="contained"
                onClick={handleSubmit(importWallet)}
                disabled={loading || success || !_.isNil(selectedWalletPath)}
              >
                Import
              </Button>
            </div>
            <div className="receive-form">
              <p className="title" style={{ color: 'white' }}>
                I forgot my wallet recovery phrase. Create me a new one.
              </p>
              <Button
                className="btn-create"
                variant="contained"
                onClick={() => handleCreateNewWallet()}
                disabled={loading || success || !_.isNil(selectedWalletPath)}
              >
                Create new wallet
              </Button>
            </div>
          </ContainerImportWallet>
        )}
      </Backdrop>

      <Snackbar open={success} autoHideDuration={3500} onClose={() => setSuccess(false)}>
        <Alert severity="success" variant="filled" sx={{ width: '100%' }}>
          Congrats on your new wallet!
        </Alert>
      </Snackbar>

      <Snackbar open={importSuccess} autoHideDuration={3500} onClose={() => setImportSuccess(false)}>
        <Alert severity="success" variant="filled" sx={{ width: '100%' }}>
          Import wallet successfully!
        </Alert>
      </Snackbar>

      <Snackbar open={error} autoHideDuration={3500} onClose={() => setError(false)}>
        <Alert severity="error" variant="filled" sx={{ width: '100%' }}>
          Import wallet failed — Please check your mnemonic seed phrase!
        </Alert>
      </Snackbar>
    </React.Fragment>
  );
};

export default MiniAppBackdrop;
