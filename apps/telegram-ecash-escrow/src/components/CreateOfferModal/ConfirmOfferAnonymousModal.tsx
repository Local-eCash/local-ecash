'use client';

import { styled } from '@mui/material/styles';

import { accountsApi, getSelectedWalletPath, useSliceSelector as useLixiSliceSelector } from '@bcpros/redux-store';
import { ChevronLeft } from '@mui/icons-material';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  Radio,
  RadioGroup,
  Slide,
  Typography
} from '@mui/material';
import { TransitionProps } from '@mui/material/transitions';
import React, { useState } from 'react';

interface ConfirmOfferAnonymousModalProps {
  isOpen: boolean;
  isLoading: boolean;
  onDismissModal?: (value: boolean) => void;
  createOffer?: (usePublicLocalUserName: boolean) => void;
}

const StyledDialog = styled(Dialog)(({ theme }) => ({
  '.MuiPaper-root': {
    background: theme.palette.background.default,
    backgroundRepeat: 'no-repeat',
    backgroundSize: 'cover',
    width: '500px',
    maxHeight: '100%',
    padding: '16px',
    margin: '0',
    [theme.breakpoints.down('sm')]: {
      width: '100%'
    }
  },

  '.MuiIconButton-root': {
    width: 'fit-content',
    svg: {
      fontSize: '32px'
    }
  },

  '.MuiDialogTitle-root': {
    padding: '0 16px',
    paddingTop: '16px',
    fontSize: '26px',
    textAlign: 'center'
  },

  '.MuiDialogContent-root': {
    padding: '0'
  },

  '.MuiDialogActions-root': {
    justifyContent: 'space-evenly',

    button: {
      textTransform: 'none',
      width: '100%',
      '&.confirm-btn': {
        color: theme.palette.common.white
      }
    }
  },

  '.back-btn': {
    padding: '0',
    position: 'absolute',
    left: '8px',
    top: '20px',
    borderRadius: '12px',
    svg: {
      fontSize: '32px'
    }
  }
}));

const Transition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement;
  },
  ref: React.Ref<unknown>
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const ConfirmOfferAnonymousModal: React.FC<ConfirmOfferAnonymousModalProps> = props => {
  const selectedWallet = useLixiSliceSelector(getSelectedWalletPath);
  const { useGetAccountByAddressQuery } = accountsApi;

  const { currentData: accountQueryData } = useGetAccountByAddressQuery(
    { address: selectedWallet?.xAddress },
    { skip: !selectedWallet?.xAddress }
  );

  const [usePublicLocalUserName, setUsePublicLocalUserName] = useState(false);

  return (
    <React.Fragment>
      <StyledDialog open={props.isOpen} onClose={() => props.onDismissModal!(false)} TransitionComponent={Transition}>
        <IconButton className="back-btn" onClick={() => props.onDismissModal!(false)}>
          <ChevronLeft />
        </IconButton>
        <DialogTitle paddingTop="0px !important">Confirm your listing identity</DialogTitle>
        <DialogContent>
          <Typography component={'div'} sx={{ fontSize: '16px', marginTop: '10px' }}>
            <div>Which identity would you want to list your offers under?</div>
            <RadioGroup
              value={!usePublicLocalUserName}
              onChange={e => {
                if (e.target.value === 'true') {
                  setUsePublicLocalUserName(true);
                } else {
                  setUsePublicLocalUserName(false);
                }
              }}
            >
              <FormControlLabel
                checked={usePublicLocalUserName === false}
                value={false}
                control={<Radio />}
                label={`Telegram handle: ${accountQueryData?.getAccountByAddress?.telegramUsername}`}
              />
              <FormControlLabel
                checked={usePublicLocalUserName === true}
                value={true}
                control={<Radio />}
                label={`Anonymous username: ${accountQueryData?.getAccountByAddress?.anonymousUsernameLocalecash}`}
              />
            </RadioGroup>
            <Typography variant="subtitle1" style={{ fontSize: '14px' }}>
              Note: You can change your listing identity under Settings later
            </Typography>
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            className="confirm-btn"
            variant="contained"
            color="success"
            onClick={() => {
              props.createOffer!(usePublicLocalUserName);
            }}
            disabled={props.isLoading}
            autoFocus
          >
            Create
          </Button>
        </DialogActions>
      </StyledDialog>
    </React.Fragment>
  );
};

export default ConfirmOfferAnonymousModal;
