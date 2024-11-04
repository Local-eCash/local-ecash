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
  useMediaQuery,
  useTheme
} from '@mui/material';
import { TransitionProps } from '@mui/material/transitions';
import Image from 'next/image';
import React from 'react';
import DisputeDetailInfo from '../DisputeDetailInfo/DisputeDetailInfo';

interface ReleaseDisputeModalProps {
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

const ReleaseDisputeWrap = styled.div`
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
      onClose={() => props.onDissmissModal!(false)}
      TransitionComponent={Transition}
    >
      <IconButton className="back-btn" onClick={() => props.onDissmissModal!(false)}>
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
            props.onDissmissModal!(false);
          }}
        >
          Resolve
        </Button>
      </DialogActions>
    </StyledDialog>
  );
};

export default ReleaseDisputeModal;
