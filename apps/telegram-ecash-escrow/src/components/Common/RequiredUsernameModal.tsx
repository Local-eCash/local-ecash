import { TelegramMiniAppContext } from '@/src/store/telegram-mini-app-provider';
import { closeModal, useSliceDispatch as useLixiSliceDispatch } from '@bcpros/redux-store';
import styled from '@emotion/styled';
import { Box, Button, Modal } from '@mui/material';
import { postEvent } from '@telegram-apps/sdk-react';
import { useRouter } from 'next/navigation';
import { useContext } from 'react';

const StyledBox = styled(Box)`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 300px;
  border: 2px solid #000;
  text-align: center;

  .group-button-wrap {
    width: 100%;
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
    padding-bottom: 16px;

    button {
      text-transform: none;
      color: white;
    }
  }
`;

export const RequiredUsernameModal = () => {
  const router = useRouter();
  const dispatch = useLixiSliceDispatch();
  const { launchParams } = useContext(TelegramMiniAppContext);

  const handleOnCancel = () => {
    dispatch(closeModal());
  };

  return (
    <Modal
      open={true}
      onClose={handleOnCancel}
      aria-labelledby="child-modal-title"
      aria-describedby="child-modal-description"
    >
      <StyledBox sx={{ bgcolor: 'background.paper', boxShadow: 24, p: 4 }}>
        <h4 style={{ color: 'white' }}>You need a Telegram username before creating an offer!</h4>
        {launchParams ? (
          <p style={{ color: 'white' }}>
            Instructions:
            <br />
            <br />
            1. Close the app
            <br />
            <br />
            2. Set Telegram username
            <br />
            <br />
            3. Reopen the app
            <br />
          </p>
        ) : (
          <p style={{ color: 'white' }}>
            Instructions:
            <br />
            <br />
            1. Go to Telegram and set a username
            <br />
            <br />
            2. Go to Settings
            <br />
            <br />
            3. Backup your seed phrase and sign out
            <br />
          </p>
        )}

        <div className="group-button-wrap">
          <Button variant="contained" fullWidth onClick={() => dispatch(closeModal())}>
            Later
          </Button>
          {launchParams ? (
            <Button variant="contained" fullWidth color="warning" onClick={() => postEvent('web_app_close')}>
              Close App!
            </Button>
          ) : (
            <Button
              variant="contained"
              fullWidth
              color="warning"
              onClick={() => {
                dispatch(closeModal());
                router.push('/settings');
              }}
            >
              Settings
            </Button>
          )}
        </div>
      </StyledBox>
    </Modal>
  );
};
