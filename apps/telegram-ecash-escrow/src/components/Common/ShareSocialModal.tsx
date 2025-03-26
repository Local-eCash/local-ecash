import { closeModal, OfferQueryItem, showToast, useSliceDispatch as useLixiSliceDispatch } from '@bcpros/redux-store';
import { Close, CopyAllRounded } from '@mui/icons-material';
import { Box, Button, Dialog, Grid, IconButton, Slide, styled, Typography } from '@mui/material';
import { TransitionProps } from '@mui/material/transitions';
import React from 'react';
import {
  FacebookIcon,
  FacebookMessengerIcon,
  FacebookMessengerShareButton,
  FacebookShareButton,
  LinkedinIcon,
  LinkedinShareButton,
  RedditIcon,
  RedditShareButton,
  TelegramIcon,
  TelegramShareButton,
  TwitterIcon,
  TwitterShareButton,
  WhatsappIcon,
  WhatsappShareButton
} from 'react-share';

const StyledDialog = styled(Dialog)(({ theme }) => ({
  '.MuiPaper-root': {
    background: theme.palette.background.default,
    backgroundRepeat: 'no-repeat',
    backgroundSize: 'cover',
    width: '500px',
    margin: 0,
    [theme.breakpoints.down('sm')]: {
      width: '100%'
    }
  },

  '.MuiGrid-root': {
    marginTop: 0
  },

  '.item-share': {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '3px'
  },

  '.MuiSvgIcon-root': {
    color: theme.custom.colorPrimary
  }
}));

interface ShareSocialModalProps {
  offer: OfferQueryItem;
}

const Transition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement<any, any>;
  },
  ref: React.Ref<unknown>
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const ShareSocialModal: React.FC<ShareSocialModalProps> = ({ offer }) => {
  const dispatch = useLixiSliceDispatch();

  const sizeIcon = 50;
  const linkWeb = `${process.env.NEXT_PUBLIC_WEB_LINK}/offer-detail?id=${offer?.postId}`;
  const linkTelegram = `https://t.me/${process.env.NEXT_PUBLIC_BOT_USERNAME}?startapp=offer__detail__${offer?.postId}`;

  const shareOptions = [
    {
      label: 'Twitter',
      icon: (
        <TwitterShareButton url={linkWeb}>
          <TwitterIcon size={sizeIcon} round />
        </TwitterShareButton>
      )
    },
    {
      label: 'Facebook',
      icon: (
        <FacebookShareButton url={linkWeb}>
          <FacebookIcon size={sizeIcon} round />
        </FacebookShareButton>
      )
    },
    {
      label: 'LinkedIn ',
      icon: (
        <LinkedinShareButton url={linkWeb}>
          <LinkedinIcon size={sizeIcon} round />
        </LinkedinShareButton>
      )
    },
    {
      label: 'Reddit',
      icon: (
        <RedditShareButton url={linkWeb}>
          <RedditIcon size={sizeIcon} round />
        </RedditShareButton>
      )
    },
    {
      label: 'Messenger',
      icon: (
        <FacebookMessengerShareButton url={linkWeb} appId="521270401588372">
          <FacebookMessengerIcon size={sizeIcon} round />
        </FacebookMessengerShareButton>
      )
    },
    {
      label: 'Telegram',
      icon: (
        <TelegramShareButton url={linkTelegram}>
          <TelegramIcon size={sizeIcon} round />
        </TelegramShareButton>
      )
    },
    {
      label: 'WhatsApp',
      icon: (
        <WhatsappShareButton url={linkWeb}>
          <WhatsappIcon size={sizeIcon} round />
        </WhatsappShareButton>
      )
    }
  ];

  const handleCopy = () => {
    dispatch(
      showToast('success', {
        message: 'Success',
        description: 'Link copied to clipboard!'
      })
    );
    navigator.clipboard.writeText(linkWeb);
  };

  const handleCloseModal = () => {
    dispatch(closeModal());
  };

  return (
    <StyledDialog
      fullWidth
      open={true}
      TransitionComponent={Transition}
      onClose={() => handleCloseModal()}
      PaperProps={{
        sx: {
          m: 0,
          width: '100%',
          borderRadius: '16px 16px 0 0',
          position: 'absolute',
          bottom: 0
        }
      }}
    >
      {/* Modal Header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          p: 2,
          borderBottom: '1px solid #ddd'
        }}
      >
        <Typography variant="h6">Share with your friend</Typography>
        <IconButton onClick={() => handleCloseModal()}>
          <Close />
        </IconButton>
      </Box>

      {/* Share Options */}
      <Grid container spacing={2} sx={{ mt: 1, p: 2 }}>
        {shareOptions.map((option, index) => (
          <Grid item xs={3} key={index} className="item-share">
            <IconButton
              sx={{
                width: 50,
                height: 50
              }}
            >
              <span>{option.icon}</span>
            </IconButton>
            <span className="label-icon">{option.label}</span>
          </Grid>
        ))}

        <Grid item xs={3} className="item-share" onClick={handleCopy}>
          <IconButton
            sx={{
              width: 50,
              height: 50
            }}
          >
            <span>
              <Button style={{ fontSize: 10 + sizeIcon }}>
                <CopyAllRounded />
              </Button>
            </span>
          </IconButton>
          <span className="label-icon">Copy link</span>
        </Grid>
      </Grid>
    </StyledDialog>
  );
};

export default ShareSocialModal;
