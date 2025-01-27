import { closeModal, useSliceDispatch as useLixiSliceDispatch } from '@bcpros/redux-store';
import { Box, Button, Modal, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'background.paper',
  boxShadow: 24,
  pt: 2,
  px: 4,
  pb: 3
};

export type BackupModalProps = {
  isFromHome?: boolean;
  isFromSetting?: boolean;
  offerId?: string;
};

export const BackupModal = ({ isFromHome = true, isFromSetting = false, offerId }: BackupModalProps) => {
  const dispatch = useLixiSliceDispatch();
  const router = useRouter();

  const handleOnCancel = () => {
    dispatch(closeModal());
  };

  const handleABackup = () => {
    dispatch(closeModal());
    const queryParams = new URLSearchParams();

    if (isFromHome) {
      queryParams.append('isFromHome', isFromHome ? 'true' : 'false');
    }
    if (isFromSetting) {
      queryParams.append('isFromSetting', isFromSetting ? 'true' : 'false');
    }
    if (offerId) {
      queryParams.append('offerId', offerId);
    }

    const linkToRoute = `/backup${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    router.push(linkToRoute);
  };

  return (
    <Modal
      open={true}
      onClose={handleOnCancel}
      aria-labelledby="child-modal-title"
      aria-describedby="child-modal-description"
    >
      <Box sx={{ ...style, width: 300 }}>
        <Typography variant="h6">You need to back up your seed phrase before continuing!</Typography>
        <Button
          style={{ textTransform: 'none', fontWeight: 'bold', fontSize: '16px' }}
          variant="contained"
          fullWidth
          onClick={() => handleABackup()}
        >
          Backup
        </Button>
      </Box>
    </Modal>
  );
};
