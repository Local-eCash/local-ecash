'use client';

import { getOfferFilterConfig, useSliceSelector as useLixiSliceSelector } from '@bcpros/redux-store';
import { FilterAltOutlined } from '@mui/icons-material';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import { IconButton, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import React, { useState } from 'react';
import FilterOfferModal from '../FilterOfferModal/FilterOfferModal';

const TopSectionWrap = styled('div')(({ theme }) => ({
  padding: theme.spacing(1.5, 1), // Adjusted padding using theme
  border: `1px solid ${theme.palette.grey[300]}`, // Use theme color for the border
  borderRadius: 16,
  marginBottom: theme.spacing(2), // Margin bottom using theme

  '.location-wrap': {
    display: 'grid',
    gridTemplateColumns: '1fr max-content',
    gap: theme.spacing(2), // Gap between columns using theme

    div: {
      display: 'flex',
      alignItems: 'center',
      gap: theme.spacing(1) // Gap between items using theme
    }
  }
}));

const TopSection: React.FC = () => {
  const [open, setOpen] = useState<boolean>(false);

  const offerFilterConfig = useLixiSliceSelector(getOfferFilterConfig);
  const { countryName, stateName, cityName, coin, fiatCurrency } = offerFilterConfig;

  return (
    <>
      <TopSectionWrap>
        <div className="location-wrap">
          <div onClick={() => setOpen(true)}>
            <IconButton size="large">
              <LocationOnOutlinedIcon />
            </IconButton>
            <Typography variant="body2">
              {stateName || countryName || cityName
                ? [cityName, stateName, countryName].filter(Boolean).join(', ')
                : 'All the world'}
            </Typography>
          </div>
          <div onClick={() => setOpen(true)} style={{ display: 'flex', alignItems: 'end', gap: '2px' }}>
            {coin || fiatCurrency ? (
              <Typography fontWeight="bold"> {coin ?? fiatCurrency} </Typography>
            ) : (
              <Typography fontWeight="bold">Filter</Typography>
            )}
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
