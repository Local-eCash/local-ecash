'use client';

import { ChevronLeft } from '@mui/icons-material';
import {
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
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
  onDismissModal?: (value: boolean) => void;
  onConfirmClick?: () => void;
  returnAction: () => void;
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
  const [verified, setVerified] = useState(false);

  const { handleSubmit } = useForm();

  const handleReleaseConfirm = data => {
    props.returnAction();
    props.onDismissModal!(false);
  };

  return (
    <React.Fragment>
      <StyledDialog open={props.isOpen} onClose={() => props.onDismissModal!(false)} TransitionComponent={Transition}>
        <IconButton className="back-btn" onClick={() => props.onDismissModal!(false)}>
          <ChevronLeft />
        </IconButton>
        <DialogTitle paddingTop="0px !important">Confirmation</DialogTitle>
        <DialogContent>
          <ActionStatusRelease>
            <div className="verified-container" onClick={() => setVerified(!verified)}>
              <Checkbox checked={verified} sx={{ padding: '0px' }} />
              <Typography sx={{ fontSize: '16px' }}>
                I have verified that the buyer has fufilled his side of the deal. I.e.: I have received the payment or
                goods & services.
              </Typography>
            </div>
          </ActionStatusRelease>
        </DialogContent>
        {verified && (
          <DialogActions sx={{ paddingLeft: '0px', paddingRight: '0px' }}>
            <Button
              className="confirm-btn"
              style={{ backgroundColor: '#66bb6a' }}
              variant="contained"
              onClick={handleSubmit(handleReleaseConfirm)}
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
