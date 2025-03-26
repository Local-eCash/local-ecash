'use client';

import { styled } from '@mui/material/styles';

import { formatNumber } from '@/src/store/util';
import { COIN } from '@bcpros/lixi-models';
import { ChevronLeft } from '@mui/icons-material';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Slide,
  Typography
} from '@mui/material';
import { TransitionProps } from '@mui/material/transitions';
import React from 'react';

interface ConfirmDepositModalProps {
  isOpen: boolean;
  depositSecurity: number;
  isLoading: boolean;
  onDismissModal?: (value: boolean) => void;
  depositFee?: (isDeposit: boolean) => void;
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

const ConfirmDepositModal: React.FC<ConfirmDepositModalProps> = props => {
  return (
    <React.Fragment>
      <StyledDialog open={props.isOpen} onClose={() => props.onDismissModal!(false)} TransitionComponent={Transition}>
        <IconButton className="back-btn" onClick={() => props.onDismissModal!(false)}>
          <ChevronLeft />
        </IconButton>
        <DialogTitle paddingTop="0px !important">Confirm Security Deposit</DialogTitle>
        <DialogContent>
          <Typography variant="subtitle2" sx={{ marginTop: '10px' }}>
            * Deposit a security deposit to have a higher chance of being accepted. The security deposit will be
            returned if there is no dispute.
          </Typography>
          <Typography variant="body1" sx={{ marginTop: '10px', fontWeight: 'bold' }}>
            Security deposit (1%): {formatNumber(props.depositSecurity)} {COIN.XEC}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            className="confirm-btn"
            variant="contained"
            color="warning"
            onClick={() => {
              props.depositFee!(false);
            }}
            disabled={props.isLoading}
            autoFocus
          >
            No, thanks
          </Button>
          <Button
            className="confirm-btn"
            variant="contained"
            color="success"
            onClick={() => {
              props.depositFee!(true);
            }}
            disabled={props.isLoading}
            autoFocus
          >
            Deposit {formatNumber(props.depositSecurity)} {COIN.XEC}
          </Button>
        </DialogActions>
      </StyledDialog>
    </React.Fragment>
  );
};

export default ConfirmDepositModal;
