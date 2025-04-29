'use client';
import ConfirmSignoutModal from '@/src/components/Settings/ConfirmSignoutModal';
import CustomToast from '@/src/components/Toast/CustomToast';
import MobileLayout from '@/src/components/layout/MobileLayout';
import { SettingContext } from '@/src/store/context/settingProvider';
import { UpdateSettingCommand } from '@bcpros/lixi-models';
import {
  accountsApi,
  getCurrentThemes,
  getIsSystemThemes,
  getSelectedAccountId,
  getSelectedWalletPath,
  getWalletMnemonic,
  removeAllWallets,
  setCurrentThemes,
  setIsSystemThemes,
  settingApi,
  useSliceDispatch as useLixiSliceDispatch,
  useSliceSelector as useLixiSliceSelector
} from '@bcpros/redux-store';
import { CheckCircleOutline } from '@mui/icons-material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Accordion, AccordionDetails, AccordionSummary, Alert, Button, NativeSelect, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import { signOut } from 'next-auth/react';
import { useContext, useState } from 'react';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { IDENTITY_TYPE, THEMES_TYPE } from 'src/store/constants';

const ContainerSetting = styled('div')(({ theme }) => ({
  padding: '1rem',
  '.setting-content': {
    padding: '0 0 4rem',
    '.setting-item': {
      marginBottom: '1rem',
      '.title': {
        paddingTop: '1rem',
        paddingBottom: '0.5rem',
        fontSize: '16px',
        fontWeight: 'bold'
      },
      '.ico-alert': {
        alignSelf: 'center !important'
      }
    }
  },

  '.address-string': {
    fontSize: '14px',
    fontWeight: '500',
    textAlign: 'center',
    margin: '1rem 0',
    color: '#28a5e0',
    textOverflow: 'ellipsis',
    overflow: 'hidden'
  },

  '.collapse-backup-seed': {
    margin: '0 !important',
    '.MuiAccordionSummary-content': {
      margin: '0 0 0px !important'
    }
  },

  '.MuiCollapse-wrapper': {
    '.MuiAccordionDetails-root': {
      padding: '0 16px 10px !important',
      display: 'flex',
      justifyContent: 'center',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '10px',
      '.mnemonic': {
        textAlign: 'center'
      }
    }
  }
}));

export default function Setting() {
  const dispatch = useLixiSliceDispatch();
  const { setSetting, setting } = useContext(SettingContext);

  const selectedMnemonic = useLixiSliceSelector(getWalletMnemonic);
  const isSystemTheme = useLixiSliceSelector(getIsSystemThemes);
  const currentTheme = useLixiSliceSelector(getCurrentThemes);
  const selectedWallet = useLixiSliceSelector(getSelectedWalletPath);
  const selectedAccountId = useLixiSliceSelector(getSelectedAccountId);

  const { useGetAccountByAddressQuery } = accountsApi;
  const { currentData: accountQueryData } = useGetAccountByAddressQuery(
    { address: selectedWallet?.xAddress },
    { skip: !selectedWallet?.xAddress }
  );

  const [openToastCopySuccess, setOpenToastCopySuccess] = useState(false);
  const [openToastChangeIdentity, setOpenToastChangeIdentity] = useState(false);
  const [openSignoutModal, setOpenSignoutModal] = useState(false);

  const themeOptions = [
    {
      id: 1,
      value: THEMES_TYPE.DARK,
      label: 'Dark'
    },
    {
      id: 2,
      value: THEMES_TYPE.LIGHT,
      label: 'Light'
    },
    {
      id: 3,
      value: THEMES_TYPE.SYSTEM,
      label: 'System default'
    }
  ];

  const identityOptions = [
    {
      id: 1,
      value: IDENTITY_TYPE.TELEGRAM,
      label: `Telegram handle: ${accountQueryData?.getAccountByAddress?.telegramUsername}`
    },
    {
      id: 2,
      value: IDENTITY_TYPE.ANONYMOUS,
      label: `Anonymous username: ${accountQueryData?.getAccountByAddress?.anonymousUsernameLocalecash}`
    }
  ];

  const handleOnCopy = () => {
    setOpenToastCopySuccess(true);
  };

  const handleSignOut = () => {
    dispatch(removeAllWallets());
    signOut({ redirect: true, callbackUrl: '/' });
  };

  const handleChangeTheme = selectedTheme => {
    if (selectedTheme === THEMES_TYPE.SYSTEM) {
      dispatch(setIsSystemThemes(true));
    } else {
      dispatch(setCurrentThemes(selectedTheme));
      dispatch(setIsSystemThemes(false));
    }
  };

  const handleChangeIdentity = async (selectedIdentity: string) => {
    const updateSettingCommand: UpdateSettingCommand = {
      accountId: selectedAccountId,
      usePublicLocalUserName: selectedIdentity === IDENTITY_TYPE.ANONYMOUS
    };

    if (selectedAccountId) {
      //setting on server
      const updatedSetting = await settingApi.updateSetting(updateSettingCommand);
      setSetting(updatedSetting);
      setOpenToastChangeIdentity(true);
    }
  };

  return (
    <MobileLayout>
      <ContainerSetting>
        <div className="setting-info">
          <Typography variant="h4" className="title">
            Settings
          </Typography>
        </div>
        {/*TODO: Verify account*/}
        <div className="setting-content">
          {/* <div className="setting-item">
          <p className="title">Verify address</p>
          <Alert icon={<CheckCircleOutline className="ico-alert" fontSize="inherit" />} severity="warning">
            Please verify every 1 month to keep your address always updated on Telegram.
          </Alert>
          <Accordion className="collapse-backup-seed">
            <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls="panel1a-content" id="panel1a-header">
              <p>Click to verify your address</p>
            </AccordionSummary>
            <AccordionDetails>
              <p className="address-string">eCash:qp8ks7622cklc7c9pm2d3ktwzctack6njq6q83ed9x</p>
              {/* <Button variant='linear' onClickItem={handleVerifyAddress}>Verify</LixiButton>	 
              <Button>Verify</Button>
            </AccordionDetails>
          </Accordion>
        </div> */}

          <div className="setting-item">
            <Typography variant="subtitle1" className="title">
              Theme
            </Typography>
            <NativeSelect
              fullWidth
              id="select-theme"
              defaultValue={isSystemTheme ? THEMES_TYPE.SYSTEM : currentTheme}
              onChange={e => handleChangeTheme(e.target.value)}
            >
              {themeOptions.map(item => {
                return (
                  <option key={item.id} value={item.value}>
                    {item.label}
                  </option>
                );
              })}
            </NativeSelect>
          </div>

          <div className="setting-item">
            <Typography variant="subtitle1" className="title">
              Listing Identity
            </Typography>
            <NativeSelect
              fullWidth
              id="select-identity"
              defaultValue={setting?.usePublicLocalUserName ? IDENTITY_TYPE.ANONYMOUS : IDENTITY_TYPE.TELEGRAM}
              onChange={e => handleChangeIdentity(e.target.value)}
            >
              {identityOptions.map(item => {
                return (
                  <option key={item.id} value={item.value}>
                    {item.label}
                  </option>
                );
              })}
            </NativeSelect>
          </div>

          <div className="setting-item">
            <Typography variant="subtitle1" className="title">
              Backup your account
            </Typography>
            <Alert icon={<CheckCircleOutline className="ico-alert" fontSize="inherit" />} severity="warning">
              <Typography variant="subtitle2">
                Your seed phrase is the only way to restore your account. Write it down. Keep it safe. Do not share with
                anyone!
              </Typography>
            </Alert>
            <Accordion className="collapse-backup-seed">
              <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls="panel1a-content" id="panel1a-header">
                <Typography variant="body1">Click to reveal seed phrase</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <CopyToClipboard
                  style={{
                    display: 'inline-block',
                    width: '100%'
                  }}
                  text={selectedMnemonic}
                  onCopy={handleOnCopy}
                >
                  <Typography variant="subtitle2" className="mnemonic">
                    {selectedMnemonic}
                  </Typography>
                </CopyToClipboard>
              </AccordionDetails>
            </Accordion>
          </div>
          <div className="setting-item">
            <Typography variant="subtitle1" className="title">
              Sign out
            </Typography>
            <Alert icon={<CheckCircleOutline className="ico-alert" fontSize="inherit" />} severity="error">
              <Typography variant="subtitle2">Sign out of the current session</Typography>
            </Alert>
            <Accordion className="collapse-backup-seed">
              <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls="panel1a-content" id="panel1a-header">
                <Typography variant="body1">Click to reveal sign out button</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Button
                  variant="contained"
                  color="warning"
                  style={{
                    display: 'inline-block',
                    width: '100%',
                    fontWeight: 'bold',
                    color: '#fff'
                  }}
                  onClick={() => setOpenSignoutModal(true)}
                >
                  Sign Out
                </Button>
              </AccordionDetails>
            </Accordion>
          </div>

          {/*TODO: delete account*/}
          {/* <div className="setting-item">
          <p className="title">Delete account</p>
          <Alert icon={<CheckCircleOutline className="ico-alert" fontSize="inherit" />} severity="error">
            Delete your account in platform. You can import it later by seed phrase have been stored.
          </Alert>
          <Accordion className="collapse-backup-seed">
            <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls="panel1a-content" id="panel1a-header">
              <p>Click to delete account</p>
            </AccordionSummary>
            <AccordionDetails>
              <Button onClick={handleDeleteAccount}>Delete</Button>
            </AccordionDetails>
          </Accordion>
        </div> */}
        </div>
        <CustomToast
          isOpen={openToastCopySuccess}
          handleClose={() => setOpenToastCopySuccess(false)}
          content="Copy to clipboard"
          type="info"
        />
        <CustomToast
          isOpen={openToastChangeIdentity}
          handleClose={() => setOpenToastChangeIdentity(false)}
          content="Identity changed successfully!"
          type="success"
        />
      </ContainerSetting>
      <ConfirmSignoutModal
        isOpen={openSignoutModal}
        onDismissModal={value => setOpenSignoutModal(value)}
        signout={isSignout => {
          if (isSignout) {
            handleSignOut();
          } else {
            setOpenSignoutModal(false);
          }
        }}
      />
    </MobileLayout>
  );
}
