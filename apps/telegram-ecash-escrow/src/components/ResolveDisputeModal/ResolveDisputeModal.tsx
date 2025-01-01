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
  TextField,
  Typography,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { TransitionProps } from '@mui/material/transitions';
import Image from 'next/image';
import React, { useState } from 'react';
import DisputeDetailInfo from '../DisputeDetailInfo/DisputeDetailInfo';

interface PlaceAnOrderModalProps {
  isOpen: boolean;
  onDissmissModal?: (value: boolean) => void;
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
    padding: theme.spacing(0, 2), // Horizontal padding using theme
    paddingTop: theme.spacing(2), // Top padding using theme
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
      '!important': 'true' // Avoid using '!important' if possible
    }
  },

  '.back-btn': {
    padding: 0,
    position: 'absolute',
    left: theme.spacing(1), // Spacing based on theme
    top: theme.spacing(2), // Spacing based on theme
    borderRadius: 12,

    svg: {
      fontSize: 32
    }
  }
}));

// StyledReleaseDialog using MUI theme
const StyledReleaseDialog = styled(Dialog)(({ theme }) => ({
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
    padding: theme.spacing(0, 2),
    paddingTop: theme.spacing(2),
    fontSize: 26,
    textAlign: 'center'
  },

  '.MuiDialogContent-root': {
    padding: 0
  },

  '.back-btn': {
    padding: 0,
    position: 'absolute',
    left: theme.spacing(1),
    top: theme.spacing(2),
    borderRadius: 12,

    svg: {
      fontSize: 32
    }
  }
}));

// ResolveDisputeWrap using MUI theme
const ResolveDisputeWrap = styled('div')(({ theme }) => ({
  padding: theme.spacing(2),

  '.group-btn-chat': {
    display: 'flex',
    justifyContent: 'space-between',
    gap: theme.spacing(1),
    borderTop: `1px dashed ${theme.palette.grey[500]}`,
    paddingTop: theme.spacing(1),
    marginTop: theme.spacing(2),

    '.chat-btn': {
      width: 'fit-content',
      justifyContent: 'flex-start',
      textTransform: 'none',
      gap: theme.spacing(1),
      padding: theme.spacing(1, 0),
      fontWeight: 600
    }
  }
}));

// ReleaseDisputeWrap using MUI theme
const ReleaseDisputeWrap = styled('div')(({ theme }) => ({
  padding: theme.spacing(2),

  '.seller-release, .buyer-release': {
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(2),
    marginBottom: theme.spacing(4),

    button: {
      color: 'white',
      textTransform: 'none'
    },

    '.disclaim-buyer': {
      color: '#29b6f6'
    },

    '.disclaim-seller': {
      color: '#f44336'
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

const ResolveDisputeModal: React.FC<PlaceAnOrderModalProps> = props => {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));
  // const router = useRouter();

  const [isOpenReleaseModal, setIsOpenReleaseModal] = useState<boolean>(false);

  return (
    <>
      <StyledDialog
        fullScreen={fullScreen}
        open={props.isOpen}
        onClose={() => props.onDissmissModal!(false)}
        TransitionComponent={Transition}
      >
        <IconButton className="back-btn" onClick={() => props.onDissmissModal!(false)}>
          <ChevronLeft />
        </IconButton>
        <DialogTitle>Resolve Dispute</DialogTitle>
        <DialogContent>
          <ResolveDisputeWrap>
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
          </ResolveDisputeWrap>
        </DialogContent>
        <DialogActions>
          <Button className="resolve-btn" color="info" variant="contained" onClick={() => setIsOpenReleaseModal(true)}>
            Resolve
          </Button>
        </DialogActions>
      </StyledDialog>

      <StyledReleaseDialog
        fullScreen={fullScreen}
        open={isOpenReleaseModal}
        onClose={() => setIsOpenReleaseModal(false)}
        TransitionComponent={Transition}
      >
        <IconButton className="back-btn" onClick={() => setIsOpenReleaseModal(false)}>
          <ChevronLeft />
        </IconButton>
        <DialogTitle>Release Dispute</DialogTitle>
        <DialogContent>
          <ReleaseDisputeWrap>
            <div className="seller-release">
              <Typography textAlign="center" variant="body1">
                Are you sure you want to release 20M XEC to Seller: seller 1?
              </Typography>
              <TextField
                className="form-input"
                id="input-seller"
                label="Type seller Telegram username to release 20M XEC to @seller1"
                defaultValue="ericson"
                // helperText="helper text here."
                variant="standard"
              />
              <Button variant="contained" color="info" onClick={() => {}} autoFocus>
                Release to Seller
              </Button>
              <Typography className="disclaim-seller" textAlign="center" variant="body2">
                Collect 200k XEC dispute fees from buyer
              </Typography>
            </div>
            <br />
            <div className="buyer-release">
              <Typography textAlign="center" variant="body1">
                Are you sure you want to release 20M XEC to Buyer: buyer 1?
              </Typography>
              <TextField
                className="form-input"
                id="input-buyer"
                label="Type buyer Telegram username to release 20M XEC to @buyer1"
                defaultValue="nghiacc"
                // helperText="helper text here."
                variant="standard"
              />
              <Button variant="contained" color="error" onClick={() => {}} autoFocus>
                Release to Buyer
              </Button>
              <Typography className="disclaim-buyer" textAlign="center" variant="body2">
                Collect 200k XEC dispute fees from seller
              </Typography>
            </div>
          </ReleaseDisputeWrap>
        </DialogContent>
      </StyledReleaseDialog>
    </>
  );
};

export default ResolveDisputeModal;
