'use client';

import styled from '@emotion/styled';
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
import { TransitionProps } from '@mui/material/transitions';
import Image from 'next/image';
import React, { useState } from 'react';
import DisputeDetailInfo from '../DisputeDetailInfo/DisputeDetailInfo';

interface PlaceAnOrderModalProps {
  isOpen: boolean;
  onDissmissModal?: (value: boolean) => void;
  onConfirmClick?: () => void;
}

const StyledDialog = styled(Dialog)`
  .MuiPaper-root {
    background-image: url('/bg-dialog.svg');
    background-repeat: no-repeat;
    background-size: cover;
  }

  .MuiIconButton-root {
    width: fit-content;
    svg {
      font-size: 32px;
    }
  }

  .MuiDialogTitle-root {
    padding: 0 16px;
    padding-top: 16px;
    font-size: 26px;
    text-align: center;
  }

  .MuiDialogContent-root {
    padding: 0;
  }

  .MuiDialogActions-root {
    flex-direction: column;
    align-items: normal;

    .resolve-btn {
      text-transform: none;
      color: inherit;
      margin: 0 !important;
    }
  }

  .back-btn {
    padding: 0;
    position: absolute;
    left: 8px;
    top: 20px;
    // border: 1px solid rgba(255, 255, 255, 0.3);
    border-radius: 12px;

    svg {
      font-size: 32px;
    }
  }
`;

const StyledReleaseDialog = styled(Dialog)`
  .MuiPaper-root {
    background-image: url('/bg-dialog.svg');
    background-repeat: no-repeat;
    background-size: cover;
  }

  .MuiIconButton-root {
    width: fit-content;
    svg {
      font-size: 32px;
    }
  }

  .MuiDialogTitle-root {
    padding: 0 16px;
    padding-top: 16px;
    font-size: 26px;
    text-align: center;
  }

  .MuiDialogContent-root {
    padding: 0;
  }

  .back-btn {
    padding: 0;
    position: absolute;
    left: 8px;
    top: 20px;
    // border: 1px solid rgba(255, 255, 255, 0.3);
    border-radius: 12px;

    svg {
      font-size: 32px;
    }
  }
`;

const ResolveDisputeWrap = styled.div`
  padding: 16px;

  .group-btn-chat {
    display: flex;
    justify-content: space-between;
    gap: 8px;
    border-top: 1px dashed gray;
    padding-top: 8px;
    margin-top: 16px;

    .chat-btn {
      width: fit-content;
      justify-content: flex-start;
      text-transform: none;
      gap: 8px;
      padding: 8px 0;
      font-weight: 600;
    }
  }
`;

const ReleaseDisputeWrap = styled.div`
  padding: 16px;

  .seller-release,
  .buyer-release {
    text-align: center;
    display: flex;
    flex-direction: column;
    gap: 16px;
    margin-bottom: 32px;

    button {
      color: white;
      text-transform: none;
    }

    .disclaim-buyer {
      color: #29b6f6;
    }

    .disclaim-seller {
      color: #f44336;
    }
  }
`;

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
