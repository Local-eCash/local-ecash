'use client';

import { styled } from '@mui/material/styles';

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
  Typography,
  useTheme
} from '@mui/material';
import { TransitionProps } from '@mui/material/transitions';
import React, { useState } from 'react';

interface ConfirmCancelModalProps {
  isOpen: boolean;
  onDissmissModal?: (value: boolean) => void;
  onConfirmClick?: () => void;
  returnAction: (value: boolean) => void;
  isBuyerDeposit: boolean;
  disputeFee: number;
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
      textTransform: 'none', // Fixed typo ("math-auto" -> "none")
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

const ConfirmCancelModal: React.FC<ConfirmCancelModalProps> = props => {
  const theme = useTheme();
  const [optionDonate, setOptionDonate] = useState(null);

  const OptionDonate = [
    {
      label: '💼 Claim my security deposit back to my wallet',
      value: false
    },
    {
      label: `💙 Donate my security deposit to Local eCash`,
      value: true
    }
  ];

  return (
    <React.Fragment>
      <StyledDialog
        // fullScreen={fullScreen}
        open={props.isOpen}
        onClose={() => props.onDissmissModal!(false)}
        TransitionComponent={Transition}
      >
        <IconButton className="back-btn" onClick={() => props.onDissmissModal!(false)}>
          <ChevronLeft />
        </IconButton>
        <DialogTitle paddingTop="0px !important">Confirmation</DialogTitle>
        <DialogContent>
          {props.isBuyerDeposit ? (
            <React.Fragment>
              <Typography sx={{ fontSize: '16px', marginTop: '10px' }}>
                Your order will be cancelled without a dispute. You will now be able to claim back your security deposit
                ({props.disputeFee} XEC).
              </Typography>
              <RadioGroup style={{ marginTop: '10px' }} sx={{ gap: '8px' }}>
                {OptionDonate.map(item => {
                  return (
                    <FormControlLabel
                      onClick={() => {
                        setOptionDonate(item.value);
                      }}
                      key={item.label}
                      value={item.value}
                      control={<Radio />}
                      label={item.label}
                      checked={item.value === optionDonate}
                    />
                  );
                })}
              </RadioGroup>
              <Typography sx={{ fontSize: '12px', marginTop: '10px' }} fontStyle="italic">
                Optional: This service has been brought to you free of charge. We would appreciate a donation to
                continue maintaining it.
              </Typography>
            </React.Fragment>
          ) : (
            <Typography sx={{ fontSize: '16px', marginTop: '10px' }}>
              Your order will be cancelled without a dispute.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            className="confirm-btn"
            style={{ backgroundColor: '#a41208' }}
            variant="contained"
            onClick={() => {
              props.returnAction(optionDonate);
              props.onDissmissModal!(false);
            }}
            autoFocus
          >
            Cancel
          </Button>
        </DialogActions>
      </StyledDialog>
    </React.Fragment>
  );
};

export default ConfirmCancelModal;
