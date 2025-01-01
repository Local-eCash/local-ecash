'use client';
import CustomToast from '@/src/components/Toast/CustomToast';
import MobileLayout from '@/src/components/layout/MobileLayout';
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
import QrCodeScannerOutlinedIcon from '@mui/icons-material/QrCodeScannerOutlined';
import {
  Backdrop,
  Button,
  CircularProgress,
  FormControl,
  InputAdornment,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useContext, useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';

const ContainerImportWallet = styled('div')(({ theme }) => ({
  padding: '1rem',
  '.header-receive': {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    '.title-icon': {
      marginBottom: '16px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',

      svg: {
        color: theme.custom.colorItem
      }
    }
  },
  '.coin-address': {
    '.address-string': {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '0.5rem',
      background: '#5476eb42',
      color: '#5476eb',
      width: 'fit-content',
      margin: 'auto',
      borderRadius: '1rem',
      gap: '4px',
      svg: {
        fontSize: '21px',
        color: '#000'
      },
      span: {
        fontSize: '12px'
      }
    }
  },

  '.receive-form': {
    padding: '1rem 0',
    '.title': {
      marginBottom: '10px'
    },
    '.btn-import, .btn-create': {
      fontWeight: 'bold',
      width: '100%',
      marginTop: '16px'
    },
    '.btn-create': {
      marginTop: '4px'
    }
  }
}));

export default function ImportWallet() {
  const search = useSearchParams();
  const dispatch = useLixiSliceDispatch();
  const router = useRouter();
  const id = search!.get('id');
  const {
    handleSubmit,
    formState: { errors },
    control
  } = useForm();
  const { status, data } = useSession();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);
  const { getXecWalletPublicKey } = useContext(WalletContextNode);
  const selectedWalletPath = useLixiSliceSelector(getSelectedWalletPath);

  const scanQRCode = () => {
    // haptic.notificationOccurred('warning');
    // scanner.open('Scan the seed phrase').then((content) => {
    //   setSeedPhrase(content || '');
    //   scanner.close();
    // });
  };

  useEffect(() => {
    selectedWalletPath && router.push('/');
  }, [selectedWalletPath]);

  const importWallet = async (data: { recoveryPhrase: string }) => {
    const { recoveryPhrase } = data;
    const trimRecoveryPhrase = recoveryPhrase?.trim();
    setLoading(true);
    try {
      const publicKey = await getXecWalletPublicKey(trimRecoveryPhrase);

      await axiosClient.get(`/api/accounts/telegram`, {
        params: {
          telegramId: id,
          publicKey: publicKey
        }
      });

      const dataImportAccount: ImportAccountType = {
        mnemonic: trimRecoveryPhrase,
        coin: COIN.XEC
      };
      dispatch(importAccount(dataImportAccount));

      setSuccess(true);
    } catch (e) {
      setError(true);
    }

    setLoading(false);
  };

  const handleCreateNewWallet = async () => {
    setLoading(true);
    try {
      await axiosClient.get(`/api/accounts/telegram/unlink/${id}`);

      const dataGenerateAccount: GenerateAccountType = {
        coin: COIN.XEC,
        telegramId: id!.toString(),
        accountType: AccountType.NORMAL
      };
      dispatch(generateAccount(dataGenerateAccount));

      setSuccess(true);
    } catch (e) {
      console.log('🚀 ~ handleCreateNewWal ~ e:', e);
      setError(true);
    }

    setLoading(false);
  };

  if (status === 'unauthenticated') {
    return (
      <MobileLayout>
        <div>
          <Typography variant="h1">Please sign in to continue</Typography>
          <Button onClick={() => router.push('/login')}>Login</Button>
        </div>
      </MobileLayout>
    );
  }

  if (status === 'authenticated' && data.user.id !== id) {
    return (
      <MobileLayout>
        <div>
          <h1 style={{ color: 'white' }}>You are not authorized to access this page</h1>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout>
      <ContainerImportWallet>
        <div className="header-receive">
          <div className="title-icon">
            <Typography variant="h4">Import</Typography>
            <picture>
              <img width={24} height={24} src="/import.svg" alt="" />
            </picture>
          </div>
          <span></span>
        </div>
        <div className="receive-form" style={{ paddingTop: '0' }}>
          <Typography variant="body1" className="title">
            We detected telegram account already exists. Please import your mnemonic seed phrase to continue.
          </Typography>
          <FormControl style={{ marginTop: '8px' }} fullWidth={true}>
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
                  disabled={loading || success}
                  id="recoveryPhrase"
                  label="Recovery phrase"
                  placeholder="Enter your recovery phrase (12 words) in the correct order. Separate each word with a single space only (no commas or any other punctuation)."
                  color="primary"
                  variant="outlined"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <div onClick={scanQRCode}>
                          <QrCodeScannerOutlinedIcon />
                        </div>
                      </InputAdornment>
                    )
                  }}
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
            disabled={loading || success}
          >
            Import
          </Button>
        </div>
        <div className="receive-form">
          <Typography variant="body1" className="title">
            I forgot my wallet recovery phrase. Create me a new one.
          </Typography>
          <Button
            className="btn-create"
            variant="contained"
            onClick={() => handleCreateNewWallet()}
            disabled={loading || success}
          >
            Create new wallet
          </Button>
        </div>
        <Backdrop sx={{ color: '#fff', zIndex: theme => theme.zIndex.drawer + 1 }} open={loading}>
          <CircularProgress color={'inherit'} />
        </Backdrop>
        <Stack>
          <CustomToast
            isOpen={success}
            handleClose={() => setSuccess(false)}
            content="Import wallet success - Redirecting to home..."
            type="success"
          />
          <CustomToast
            isOpen={error}
            handleClose={() => setError(false)}
            content="Import wallet failed — Please check your mnemonic seed phrase!!"
            type="error"
            autoHideDuration={2000}
          />
        </Stack>
      </ContainerImportWallet>
    </MobileLayout>
  );
}
