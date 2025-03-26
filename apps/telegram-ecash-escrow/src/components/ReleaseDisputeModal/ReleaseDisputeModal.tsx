'use client';

import { ChevronLeft } from '@mui/icons-material';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Slide,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { TransitionProps } from '@mui/material/transitions';
import Image from 'next/image';
import React from 'react';
import DisputeDetailInfo from '../DisputeDetailInfo/DisputeDetailInfo';

interface ReleaseDisputeModalProps {
  isOpen: boolean;
  onDismissModal?: (value: boolean) => void;
  onConfirmClick?: () => void;
}

const StyledDialog = styled(Dialog)(({ theme }) => ({
  '.MuiPaper-root': {
    background: theme.palette.background.default,
    backgroundRepeat: 'no-repeat',
    backgroundSize: 'cover'
  },

  '.MuiIconButton-root': {
    width: 'fit-content',
    svg: {
      fontSize: 32
    }
  },

  '.MuiDialogTitle-root': {
    padding: theme.spacing(0, 2), // Horizontal padding using theme spacing
    paddingTop: theme.spacing(2), // Top padding using theme spacing
    fontSize: 26,
    textAlign: 'center'
  },

  '.MuiDialogContent-root': {
    padding: 0
  },

  '.MuiDialogActions-root': {
    flexDirection: 'column',
    alignItems: 'normal',

    '.resolve-btn': {
      textTransform: 'none',
      color: 'inherit',
      margin: 0,
      '!important': 'true' // You can use CSS `!important` if needed, but it's better to avoid it if possible
    }
  },

  '.back-btn': {
    padding: 0,
    position: 'absolute',
    left: theme.spacing(1), // Position using theme spacing
    top: theme.spacing(2), // Position using theme spacing
    borderRadius: 12,

    svg: {
      fontSize: 32
    }
  }
}));

// ReleaseDisputeWrap with theme usage
const ReleaseDisputeWrap = styled('div')(({ theme }) => ({
  padding: theme.spacing(2), // Padding using theme spacing

  '.group-btn-chat': {
    display: 'flex',
    justifyContent: 'space-between',
    gap: theme.spacing(1), // Gap using theme spacing
    borderTop: `1px dashed ${theme.palette.grey[500]}`, // Use theme colors for borders
    paddingTop: theme.spacing(1),
    marginTop: theme.spacing(2),

    '.chat-btn': {
      width: 'fit-content',
      justifyContent: 'flex-start',
      textTransform: 'none',
      gap: theme.spacing(1),
      padding: theme.spacing(1, 0), // Padding using theme spacing
      fontWeight: 600
    }
  }
}));

const Transition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement<any, any>;
  },
  ref: React.Ref<unknown>
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const ReleaseDisputeModal: React.FC<ReleaseDisputeModalProps> = props => {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));
  // const router = useRouter();

  return (
    <StyledDialog
      fullScreen={fullScreen}
      open={props.isOpen}
      onClose={() => props.onDismissModal!(false)}
      TransitionComponent={Transition}
    >
      <IconButton className="back-btn" onClick={() => props.onDismissModal!(false)}>
        <ChevronLeft />
      </IconButton>
      <DialogTitle>Resolve Dispute</DialogTitle>
      <DialogContent>
        <ReleaseDisputeWrap>
          <DisputeDetailInfo />
          <div className="group-btn-chat">
            <Button className="chat-btn" color="inherit" variant="text">
              Chat with seller
              <Image width={32} height={32} alt="" src={'/ico-telegram.svg'} />
            </Button>
            <Button className="chat-btn" color="inherit" variant="text">
              Chat with buyer
              <Image width={32} height={32} alt="" src={'/ico-telegram.svg'} />
            </Button>
          </div>
        </ReleaseDisputeWrap>
      </DialogContent>
      <DialogActions>
        <Button
          className="resolve-btn"
          color="info"
          variant="contained"
          onClick={() => {
            props.onDismissModal!(false);
          }}
        >
          Resolve
        </Button>
      </DialogActions>
    </StyledDialog>
  );
};

export default ReleaseDisputeModal;
