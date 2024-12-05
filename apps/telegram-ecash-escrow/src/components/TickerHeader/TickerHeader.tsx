'use client';

import { openModal, useSliceDispatch as useLixiSliceDispatch } from '@bcpros/redux-store';
import styled from '@emotion/styled';
import { ChevronLeft } from '@mui/icons-material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import { IconButton, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';
import React from 'react';

const Header = styled.div`
  position: relative;
  padding: 16px 8px;

  button {
    position: absolute;
    padding: 0;

    svg {
      font-size: 32px;
    }
  }

  .icon-header {
    position: relative;
    .MuiSvgIcon-root {
      color: #fff;
    }
  }

  h4 {
    font-size: 26px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 15px;
    .MuiSvgIcon-root {
      cursor: pointer;
      font-size: 30px;
      color: #3383ff;
    }
  }
`;

interface TickerHeaderProps {
  title: string;
  iconHeader?: any;
  hideIcon?: boolean;
  showBtnCreateOffer?: boolean;
}

const TickerHeader: React.FC<TickerHeaderProps> = ({
  title,
  hideIcon,
  showBtnCreateOffer = false,
  iconHeader = null
}) => {
  const router = useRouter();
  const dispatch = useLixiSliceDispatch();

  const handleOpenCreateOffer = () => {
    dispatch(openModal('CreateOfferModal', {}));
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
    </Header>
  );
};

export default TickerHeader;
