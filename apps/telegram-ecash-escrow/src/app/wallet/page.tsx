'use client';

import { BackupModalProps } from '@/src/components/Common/BackupModal';
import Header from '@/src/components/Header/Header';
import QRCode from '@/src/components/QRcode/QRcode';
import SendComponent from '@/src/components/Send/send';
import AuthorizationLayout from '@/src/components/layout/AuthorizationLayout';
import MobileLayout from '@/src/components/layout/MobileLayout';
import { SettingContext } from '@/src/store/context/settingProvider';
import { UtxoContext } from '@/src/store/context/utxoProvider';
import { COIN } from '@bcpros/lixi-models';
import {
  getSelectedWalletPath,
  openModal,
  parseCashAddressToPrefix,
  useSliceDispatch as useLixiSliceDispatch,
  useSliceSelector as useLixiSliceSelector
} from '@bcpros/redux-store';
import { Backdrop, Button, Stack, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import { signOut, useSession } from 'next-auth/react';
import Image from 'next/image';
import { useContext, useState } from 'react';

const WrapWallet = styled('div')(({ theme }) => ({
  position: 'relative',
  backgroundRepeat: 'no-repeat',
  padding: '1rem',
  paddingBottom: '85px',
  minHeight: '100svh',
  '.shape-reg-footer': {
    position: 'absolute',
    zIndex: -1,
    bottom: 0,
    right: 0
  }
}));

const WrapContentWallet = styled('div')(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: '10px',
  '.balance-amount': {
    h5: {
      fontWeight: 'bold'
    },
    '.amount': {
      margin: '16px 0',
      backgroundColor: theme.custom.bgItem3,
      padding: '28px 16px',
      borderRadius: '16px',
      display: 'flex',
      justifyContent: 'center',
      '.coin-ticker': {
        fontSize: '13px'
      }
    }
  },

  '.group-btn': {
    display: 'flex',
    gap: '10px',
    button: {
      background: '#0076c4',
      width: '100%',
      color: '#fff',
      fontWeight: 600,
      borderRadius: '12px',
      textTransform: 'capitalize'
    }
  }
}));

const ReceiveWrap = styled('div')(({ theme }) => ({
  display: 'flex',
  textAlign: 'center',
  marginTop: '10px'
}));

const SendWrap = styled('div')(({ theme }) => ({
  backgroundColor: theme.custom.bgItem4,
  borderRadius: '20px',
  padding: '15px',
  marginTop: '10px'
}));

export default function Wallet() {
  const { data: sessionData } = useSession();
  const dispatch = useLixiSliceDispatch();

  const selectedWalletPath = useLixiSliceSelector(getSelectedWalletPath);
  const settingContext = useContext(SettingContext);
  const seedBackupTime = settingContext?.setting?.lastSeedBackupTime ?? '';

  const [address, setAddress] = useState(parseCashAddressToPrefix(COIN.XEC, selectedWalletPath?.cashAddress));
  const [openReceive, setOpenReceive] = useState(true);

  const { totalValidAmount, totalValidUtxos } = useContext(UtxoContext);

  const handleOpenSend = () => {
    //check backup
    const oneMonthLater = new Date(seedBackupTime);
    oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);
    const currentDate = new Date();
    const isGreaterThanOneMonth = currentDate > oneMonthLater;

    const backupModalProps: BackupModalProps = {
      isFromSetting: true,
      isFromHome: false
    };
    if (!seedBackupTime || isGreaterThanOneMonth) {
      dispatch(openModal('BackupModal', backupModalProps));

      return;
    }

    setOpenReceive(false);
  };

  if (selectedWalletPath === null && sessionData) {
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

  return (
    <MobileLayout>
      <AuthorizationLayout>
        <WrapWallet>
          <Header />

          <WrapContentWallet>
            <div className="balance-amount">
              <Typography variant="h5">Balance</Typography>
              <div className="amount">
                <Typography variant="h5">
                  {totalValidAmount ?? 0} <span className="coin-ticker">XEC</span>
                </Typography>
              </div>
            </div>
            <div className="group-btn">
              <Button color="success" variant="contained" className="btn-send" onClick={() => handleOpenSend()}>
                Send
              </Button>
              <Button color="success" variant="contained" className="btn-receive" onClick={() => setOpenReceive(true)}>
                Receive
              </Button>
            </div>
            {openReceive ? (
              <ReceiveWrap>
                <QRCode address={address} />
              </ReceiveWrap>
            ) : (
              <SendWrap>
                <SendComponent totalValidAmount={totalValidAmount} totalValidUtxos={totalValidUtxos} />
              </SendWrap>
            )}
          </WrapContentWallet>
          <Image width={200} height={200} className="shape-reg-footer" src="/shape-reg-footer.svg" alt="" />
        </WrapWallet>
      </AuthorizationLayout>
    </MobileLayout>
  );
}
