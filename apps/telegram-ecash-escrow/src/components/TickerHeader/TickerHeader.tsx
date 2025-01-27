'use client';

import { openModal, PostQueryItem, useSliceDispatch as useLixiSliceDispatch } from '@bcpros/redux-store';
import { ChevronLeft } from '@mui/icons-material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import ShareIcon from '@mui/icons-material/Share';
import { IconButton, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import React from 'react';

const Header = styled('div')(({ theme }) => ({
  position: 'relative',
  padding: '16px 8px',
  button: {
    position: 'absolute',
    padding: 0,
    svg: {
      fontSize: '32px'
    }
  },

  '.share-btn': {
    top: '15px',
    right: '10px',
    svg: {
      fontSize: '30px'
    }
  },

  '.icon-header': {
    position: 'relative',
    '.MuiSvgIcon-root': {
      color: theme.custom.colorItem
    }
  },

  h4: {
    fontSize: '26px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '15px',
    '.MuiSvgIcon-root': {
      cursor: 'pointer',
      fontSize: '30px',
      color: '#3383ff'
    }
  }
}));

interface TickerHeaderProps {
  title: string;
  iconHeader?: any;
  hideIcon?: boolean;
  showBtnCreateOffer?: boolean;
  showShareIcon?: boolean;
  postData?: PostQueryItem;
}

const TickerHeader: React.FC<TickerHeaderProps> = ({
  title,
  hideIcon,
  showBtnCreateOffer = false,
  iconHeader = null,
  showShareIcon = false,
  postData
}) => {
  const router = useRouter();
  const dispatch = useLixiSliceDispatch();
  const { data } = useSession();

  const handleOpenCreateOffer = () => {
    if (data?.user?.name.startsWith('@')) {
      dispatch(openModal('CreateOfferModal', {}));
    } else {
      dispatch(openModal('RequiredUsernameModal', {}));
    }
  };

  return (
    <Header>
      {!hideIcon && (
        <IconButton
          className="back-btn"
          onClick={() => {
            if (window.history.length > 1) {
              router.back();
            } else {
              router.push('/');
            }
          }}
        >
          <ChevronLeft />
        </IconButton>
      )}
      <Typography variant="h4">
        {iconHeader && <IconButton className="icon-header">{iconHeader}</IconButton>}
        {title} {showBtnCreateOffer && <AddCircleOutlineIcon onClick={handleOpenCreateOffer} />}{' '}
      </Typography>
      {showShareIcon && (
        <IconButton
          style={{ fontSize: '25px' }}
          className="share-btn"
          onClick={() => {
            dispatch(openModal('ShareSocialModal', { offer: postData?.postOffer }));
          }}
        >
          <ShareIcon />
        </IconButton>
      )}
    </Header>
  );
};

export default TickerHeader;
