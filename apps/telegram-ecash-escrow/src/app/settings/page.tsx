'use client';
import CustomToast from '@/src/components/Toast/CustomToast';
import MobileLayout from '@/src/components/layout/MobileLayout';
import {
  getCurrentThemes,
  getIsSystemThemes,
  getSelectedAccount,
  getSelectedWalletPath,
  getWalletMnemonic,
  removeAllWallets,
  setCurrentThemes,
  setIsSystemThemes,
  useSliceDispatch as useLixiSliceDispatch,
  useSliceSelector as useLixiSliceSelector
} from '@bcpros/redux-store';
import { CheckCircleOutline } from '@mui/icons-material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Accordion, AccordionDetails, AccordionSummary, Alert, Button, NativeSelect, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import { signOut, useSession } from 'next-auth/react';
import { useState } from 'react';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { THEMES_TYPE } from 'src/store/constants';

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
  const { data: sessionData } = useSession();
  const dispatch = useLixiSliceDispatch();
  const selectedWalletPath = useLixiSliceSelector(getSelectedWalletPath);
  const selectedMnemonic = useLixiSliceSelector(getWalletMnemonic);
  const selectedAccount = useLixiSliceSelector(getSelectedAccount);
  const isSystemTheme = useLixiSliceSelector(getIsSystemThemes);
  const currentTheme = useLixiSliceSelector(getCurrentThemes);

  const [openToastCopySuccess, setOpenToastCopySuccess] = useState(false);

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

  return (
    <MobileLayout>
      <ContainerSetting>
        <div className="setting-info">
          <Typography variant="h4" className="title">
            Setting
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
                  style={{
                    display: 'inline-block',
                    width: '100%',
                    fontWeight: 'bold',
                    color: '#fff'
                  }}
                  onClick={() => handleSignOut()}
                >
                  Sign Out
                </Button>
              </AccordionDetails>
            </Accordion>
          </div>

          <div className="setting-item">
            <Typography variant="subtitle1" className="title">
              Themes
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
      </ContainerSetting>
    </MobileLayout>
  );
}
