'use client';

import { COIN } from '@bcpros/lixi-models';

import {
  getSelectedWalletPath,
  parseCashAddressToPrefix,
  useSliceSelector as useLixiSliceSelector
} from '@bcpros/redux-store';
import { ChevronLeft } from '@mui/icons-material';
import {
  Button,
  Checkbox,
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
import { styled } from '@mui/material/styles';
import { TransitionProps } from '@mui/material/transitions';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';

const StyledDialog = styled(Dialog)(({ theme }) => ({
  '.MuiPaper-root': {
    background: theme.palette.background.default,
    backgroundRepeat: 'no-repeat',
    backgroundSize: 'cover',
    width: '500px',
    boxSizing: 'border-box',
    padding: '16px',
    margin: 0,
    '@media (max-width: 576px)': {
      width: '100%'
    }
  },

  '.MuiDialogTitle-root': {
    padding: '0 16px',
    paddingTop: '16px',
    fontSize: '26px',
    textAlign: 'center'
  },

  '.MuiFormControl-root': {
    marginTop: '5px'
  },

  '.MuiDialogContent-root': {
    padding: 0
  },

  '.confirm-btn': {
    width: '100%',
    color: '#fff'
  },

  '.back-btn': {
    padding: 0,
    position: 'absolute',
    left: '8px',
    top: '20px',
    borderRadius: '12px',

    svg: {
      fontSize: '32px'
    }
  }
}));

const ActionStatusRelease = styled('div')(({ theme }) => ({
  '.verified-container': {
    display: 'flex',
    gap: '10px',
    alignItems: 'flex-start'
  },
  '.MuiFormGroup-root': {
    marginBottom: '5px'
  },
  '.MuiFormControl-root': {
    marginBottom: '5px'
  }
}));

interface ConfirmReleaseModalProps {
  isOpen: boolean;
  disputeFee: number;
  onDissmissModal?: (value: boolean) => void;
  onConfirmClick?: () => void;
  returnAction: (value: string) => void;
}

const Transition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement<any, any>;
  },
  ref: React.Ref<unknown>
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const ConfirmReleaseModal: React.FC<ConfirmReleaseModalProps> = (props: ConfirmReleaseModalProps) => {
  const selectedWalletPath = useLixiSliceSelector(getSelectedWalletPath);
  const [optionDonate, setOptionDonate] = useState(null);
  const [verified, setVerified] = useState(false);
  const OptionDonate = [
    {
      label: '💼 Claim my security deposit back to my wallet',
      value: 1
    },
    {
      label: `💙 Donate my security deposit to Local eCash`,
      value: 2
    }
  ];

  const { handleSubmit } = useForm();

  const handleReleaseConfirm = data => {
    const eCashAddress = parseCashAddressToPrefix(COIN.XEC, selectedWalletPath?.cashAddress);

    props.returnAction(optionDonate === 1 ? eCashAddress : '');
    props.onDissmissModal!(false);
  };

  return (
    <React.Fragment>
      <StyledDialog open={props.isOpen} onClose={() => props.onDissmissModal!(false)} TransitionComponent={Transition}>
        <IconButton className="back-btn" onClick={() => props.onDissmissModal!(false)}>
          <ChevronLeft />
        </IconButton>
        <DialogTitle paddingTop="0px">Confirmation</DialogTitle>
        <DialogContent>
          <ActionStatusRelease>
            <div className="verified-container" onClick={() => setVerified(!verified)}>
              <Checkbox checked={verified} sx={{ padding: '0px' }} />
              <Typography sx={{ fontSize: '16px' }}>
                I have verified that the buyer has fufilled his side of the deal. I.e.: I have received the payment or
                goods & services.
              </Typography>
            </div>
            {verified && (
              <React.Fragment>
                <Typography sx={{ fontSize: '16px', marginTop: '10px' }}>
                  Your order will be completed without a dispute. You will now be able to claim back your security
                  deposit ({props.disputeFee} XEC).
                </Typography>
                <RadioGroup style={{ marginTop: '10px' }} sx={{ gap: '8px' }}>
                  {OptionDonate.map(item => {
                    return (
                      <FormControlLabel
                        onClick={() => {
                          setOptionDonate(item.value);
                        }}
                        key={item.value}
                        value={item.value}
                        control={<Radio />}
                        label={item.label}
                      />
                    );
                  })}
                </RadioGroup>
                <Typography sx={{ fontSize: '12px', marginTop: '10px' }} fontStyle="italic">
                  Optional: This service has been brought to you free of charge. We would appreciate a donation to
                  continue maintaining it.
                </Typography>
              </React.Fragment>
            )}
          </ActionStatusRelease>
        </DialogContent>
        {verified && (
          <DialogActions sx={{ paddingLeft: '0px', paddingRight: '0px' }}>
            <Button
              className="confirm-btn"
              style={{ backgroundColor: '#66bb6a' }}
              variant="contained"
              onClick={handleSubmit(handleReleaseConfirm)}
              disabled={optionDonate === null}
              autoFocus
              fullWidth
            >
              Release
            </Button>
          </DialogActions>
        )}
      </StyledDialog>
    </React.Fragment>
  );
};

export default ConfirmReleaseModal;
