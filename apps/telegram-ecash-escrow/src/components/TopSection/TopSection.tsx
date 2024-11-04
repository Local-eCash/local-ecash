'use client';

import { getOfferFilterConfig, useSliceSelector as useLixiSliceSelector } from '@bcpros/redux-store';
import styled from '@emotion/styled';
import { FilterAltOutlined } from '@mui/icons-material';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import { IconButton, Typography } from '@mui/material';
import React, { useState } from 'react';
import FilterOfferModal from '../FilterOfferModal/FilterOfferModal';

const TopSectionWrap = styled.div`
  padding: 12px 8px;
  border: 1px solid #f1f1f147;
  border-radius: 16px;
  margin-bottom: 16px;

  .location-wrap {
    display: grid;
    grid-template-columns: 1fr max-content;
    gap: 16px;

    div {
      display: flex;
      align-items: center;
      gap: 8px;
    }
  }
`;

const TopSection: React.FC = () => {
  const [open, setOpen] = useState<boolean>(false);

  const offerFilterConfig = useLixiSliceSelector(getOfferFilterConfig);
  const { countryName, stateName, coin, fiatCurrency } = offerFilterConfig;

  return (
    <>
      <TopSectionWrap>
        <div className="location-wrap">
          <div onClick={() => setOpen(true)}>
            <IconButton size="large">
              <LocationOnOutlinedIcon />
            </IconButton>
            <Typography variant="body2">
              {stateName || countryName ? [stateName, countryName].filter(Boolean).join(', ') : 'All the world'}
            </Typography>
          </div>
          <div onClick={() => setOpen(true)}>
            {(coin || fiatCurrency) && <Typography>• {coin ?? fiatCurrency} </Typography>}
            <IconButton>
              <FilterAltOutlined />
            </IconButton>
          </div>
        </div>
      </TopSectionWrap>

      <FilterOfferModal isOpen={open} onDissmissModal={value => setOpen(value)} />
    </>
  );
};

export default TopSection;
