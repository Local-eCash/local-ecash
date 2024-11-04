'use client';

import {
  CreateDisputeInput,
  SocketContext,
  closeModal,
  getSelectedWalletPath,
  useSliceDispatch as useLixiSliceDispatch,
  useSliceSelector as useLixiSliceSelector
} from '@bcpros/redux-store';
import { useCreateDisputeMutation } from '@bcpros/redux-store/build/main/store/escrow/dispute/dispute.api';
import styled from '@emotion/styled';
import { ChevronLeft } from '@mui/icons-material';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  Portal,
  Slide,
  TextField,
  Typography,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { TransitionProps } from '@mui/material/transitions';
import React, { useContext, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import CustomToast from '../Toast/CustomToast';

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

interface ReasonDisputeModalProps {
  id: string;
  classStyle?: string;
}

const Transition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement<any, any>;
  },
  ref: React.Ref<unknown>
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const ReasonDisputeModal: React.FC<ReasonDisputeModalProps> = ({ id }: ReasonDisputeModalProps) => {
  const dispatch = useLixiSliceDispatch();
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const { socket } = useContext(SocketContext) || {};

  const selectedWalletPath = useLixiSliceSelector(getSelectedWalletPath);

  const [createDisputeTrigger] = useCreateDisputeMutation();

  const {
    handleSubmit,
    control,
    formState: { errors }
  } = useForm({
    defaultValues: {
      reason: ''
    }
  });

  const handleCloseModal = () => {
    dispatch(closeModal());
  };

  const handleCreateDispute = async data => {
    try {
      setLoading(true);
      const dataCreateDispute: CreateDisputeInput = {
        createdBy: selectedWalletPath?.publicKey,
        escrowOrderId: id!,
        reason: data.reason,
        socketId: socket?.id
      };

      await createDisputeTrigger({ input: dataCreateDispute })
        .unwrap()
        .then(() => handleCloseModal());
    } catch (err) {
      setError(true);
      setLoading(false);
    }
  };

  return (
    <StyledDialog
      fullScreen={fullScreen}
      open={true}
      onClose={() => handleCloseModal()}
      TransitionComponent={Transition}
    >
      <IconButton className="back-btn" onClick={() => handleCloseModal()}>
        <ChevronLeft />
      </IconButton>
      <DialogTitle>Create dispute</DialogTitle>
      <DialogContent>
        <Typography>Give us reasons for the arbitrator to easily follow</Typography>
        <Controller
          name="reason"
          control={control}
          render={({ field: { onChange, onBlur, value, name, ref } }) => (
            <FormControl fullWidth={true}>
              <TextField
                className="form-input"
                onChange={onChange}
                onBlur={onBlur}
                value={value}
                name={name}
                inputRef={ref}
                id="reason"
                label="Reason"
                error={errors.reason && true}
                helperText={errors.reason && (errors.reason?.message as string)}
                variant="outlined"
              />
            </FormControl>
          )}
        />
      </DialogContent>
      <DialogActions>
        <Button
          className="create-dispute-btn"
          color="info"
          variant="contained"
          onClick={handleSubmit(handleCreateDispute)}
          disabled={loading}
        >
          Create Dispute
        </Button>
      </DialogActions>
      <Portal>
        <CustomToast
          isOpen={error}
          content="Create dispute failed"
          handleClose={() => setError(false)}
          type="error"
          autoHideDuration={3500}
        />
      </Portal>
    </StyledDialog>
  );
};

export default ReasonDisputeModal;
