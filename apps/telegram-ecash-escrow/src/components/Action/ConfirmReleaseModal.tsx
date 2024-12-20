'use client';

import { COIN } from '@bcpros/lixi-models';
import { isValidCoinAddress } from '@bcpros/redux-store';
import styled from '@emotion/styled';
import { ChevronLeft } from '@mui/icons-material';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  IconButton,
  Radio,
  RadioGroup,
  Slide,
  TextField,
  Typography
} from '@mui/material';
import { TransitionProps } from '@mui/material/transitions';
import React, { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';

const StyledDialog = styled(Dialog)`
  .MuiPaper-root {
    background-image: url('/bg-dialog.svg');
    background-repeat: no-repeat;
    background-size: cover;
    width: 500px;
    box-sizing: border-box;
    padding: 16px;
    margin: 0;
    @media (max-width: 576px) {
      width: 100%;
    }
  }

  .MuiDialogTitle-root {
    padding: 0 16px;
    padding-top: 16px;
    font-size: 26px;
    text-align: center;
  }

  .MuiFormControl-root {
    margin-top: 5px;
  }

  .MuiDialogContent-root {
    padding: 0;
  }

  .create-dispute-btn {
    width: 100%;
    color: #fff;
  }

  .back-btn {
    padding: 0;
    position: absolute;
    left: 8px;
    top: 20px;
    border-radius: 12px;

    svg {
      font-size: 32px;
    }
  }
`;

const ActionStatusRelease = styled.div`
  .MuiFormGroup-root {
    margin-bottom: 5px;
  }
  .MuiFormControl-root {
    margin-bottom: 5px;
  }
`;

interface ConfirmReleaseModalProps {
  isOpen: boolean;
  disputeFee: number;
  onDissmissModal?: (value: boolean) => void;
  onConfirmClick?: () => void;
  returnAction: () => void;
  setAddressToRelease: (value: string) => void;
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
  const [optionDonate, setOptionDonate] = useState(1);
  const OptionDonate = [
    {
      label: 'Donate dispute fees to keep this service running',
      value: 1
    },
    {
      label: 'I want to withdraw dispute fees to my wallet',
      value: 2
    }
  ];

  const {
    handleSubmit,
    control,
    formState: { errors }
  } = useForm({
    defaultValues: {
      address: ''
    }
  });

  const handleReleaseConfirm = data => {
    props.returnAction();
    props.onDissmissModal!(false);
  };

  return (
    <React.Fragment>
      <StyledDialog open={props.isOpen} onClose={() => props.onDissmissModal!(false)} TransitionComponent={Transition}>
        <IconButton className="back-btn" onClick={() => props.onDissmissModal!(false)}>
          <ChevronLeft />
        </IconButton>
        <DialogTitle>Confirm release</DialogTitle>
        <DialogContent>
          <ActionStatusRelease>
            <Typography variant="body1">
              Dispute fees: {props.disputeFee} {COIN.XEC}
            </Typography>
            <RadioGroup className="" name="" defaultValue={1}>
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
            {optionDonate === 2 && (
              <Controller
                name="address"
                control={control}
                rules={{
                  required: {
                    value: true,
                    message: 'Address is required!'
                  },
                  validate: {
                    addressValid: addr => {
                      if (!isValidCoinAddress(COIN.XEC, addr)) return 'Invalid address!';
                    }
                  }
                }}
                render={({ field: { onChange, onBlur, value, name, ref } }) => (
                  <FormControl fullWidth={true}>
                    <TextField
                      className="form-input"
                      onChange={e => {
                        onChange(e);
                        props.setAddressToRelease(e.target.value);
                      }}
                      onBlur={onBlur}
                      value={value}
                      name={name}
                      inputRef={ref}
                      id="address"
                      label="Your address"
                      error={errors.address && true}
                      helperText={errors.address && (errors.address?.message as string)}
                      variant="outlined"
                    />
                  </FormControl>
                )}
              />
            )}
          </ActionStatusRelease>
        </DialogContent>
        <DialogActions>
          <Button
            className="confirm-btn"
            style={{ backgroundColor: '#66bb6a' }}
            variant="contained"
            onClick={handleSubmit(handleReleaseConfirm)}
            autoFocus
          >
            Release
          </Button>
        </DialogActions>
      </StyledDialog>
    </React.Fragment>
  );
};

export default ConfirmReleaseModal;
