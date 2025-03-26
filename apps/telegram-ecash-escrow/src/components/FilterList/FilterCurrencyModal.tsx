'use client';

import { styled } from '@mui/material/styles';

import { LIST_COIN, NAME_PAYMENT_METHOD, TabType } from '@/src/store/constants';
import { COIN, LIST_CURRENCIES_USED, PAYMENT_METHOD } from '@bcpros/lixi-models';
import { ChevronLeft } from '@mui/icons-material';
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Slide,
  Tab,
  Tabs,
  TextField,
  Typography,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { TransitionProps } from '@mui/material/transitions';
import React, { useState } from 'react';
import { FilterCurrencyType } from '../../store/type/types';

interface FilterCurrencyModal {
  isOpen: boolean;
  onDismissModal?: (value: boolean) => void;
  setSelectedItem?: (value: FilterCurrencyType) => void;
}

const StyledDialog = styled(Dialog)(({ theme }) => ({
  '.MuiPaper-root': {
    background: theme.palette.background.default,
    backgroundRepeat: 'no-repeat',
    backgroundSize: 'cover',
    width: '500px',
    height: '100vh',
    maxHeight: '100%',
    margin: 0,
    [theme.breakpoints.down('sm')]: {
      width: '100%'
    }
  },

  '.MuiIconButton-root': {
    width: 'fit-content',
    svg: {
      fontSize: '32px'
    }
  },

  '.MuiDialogTitle-root': {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',

    '.back-btn': {
      position: 'absolute',
      left: '10px'
    }
  },

  '.MuiDialogContent-root': {
    padding: 0
  },

  button: {
    color: theme.palette.text.secondary
  }
}));

const StyledTabs = styled(Tabs)(({ theme }) => ({
  '.MuiTab-root': {
    color: theme.custom.colorPrimary,
    textTransform: 'none',
    fontWeight: 600,
    fontSize: '16px',

    '&.Mui-selected': {
      backgroundColor: 'rgba(255, 255, 255, 0.08)',
      backdropFilter: 'blur(8px)'
    }
  },

  '.MuiTabs-indicator': {
    backgroundColor: theme.palette.primary.main || '#0076c4'
  }
}));

const Transition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement;
  },
  ref: React.Ref<unknown>
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const FilterCurrencyModal: React.FC<FilterCurrencyModal> = props => {
  const { isOpen, onDismissModal, setSelectedItem } = props;
  const keyFilterTab = 'filter-currency-tab';
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));

  const [searchTerm, setSearchTerm] = useState('');

  const [value, setValue] = useState(Number(sessionStorage.getItem(keyFilterTab)) || 0);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    //store current index to local storage
    sessionStorage.setItem(keyFilterTab, newValue?.toString());
    setValue(newValue);
    setSearchTerm('');
  };

  const handleSelect = currency => {
    const filterCurrency: FilterCurrencyType = {
      paymentMethod: value,
      value: currency?.code ?? currency?.ticker ?? currency
    };
    setSelectedItem(filterCurrency);
    onDismissModal(false);
  };

  const handleSelectGoodsServices = () => {
    const filterCurrency: FilterCurrencyType = {
      paymentMethod: value,
      value: ''
    };
    setSelectedItem(filterCurrency);
    onDismissModal(false);
  };

  const searchTextField = (
    <TextField
      label="Search"
      variant="filled"
      fullWidth
      onChange={e => setSearchTerm(e.target.value)}
      value={searchTerm}
      autoFocus
    />
  );

  const contentFiat = () => {
    const filteredFiats = LIST_CURRENCIES_USED.filter(option =>
      `${option?.country} (${option?.code})`.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
      <div className="content-fiat">
        {searchTextField}
        <Box sx={{ mt: 1 }}>
          {filteredFiats.map(option => (
            <Button
              key={option?.code}
              onClick={() => handleSelect(option)}
              fullWidth
              variant="text"
              style={{ textTransform: 'capitalize', fontSize: '1.1rem' }}
              sx={{ justifyContent: 'flex-start', textAlign: 'left' }}
            >
              {option?.name} ({option?.code})
            </Button>
          ))}
          {filteredFiats.length === 0 && (
            <Button
              variant="text"
              style={{ textTransform: 'capitalize', fontSize: '1.1rem' }}
              sx={{ justifyContent: 'flex-start', textAlign: 'left' }}
            >
              Nothing here
            </Button>
          )}
        </Box>
      </div>
    );
  };

  const contentCrypto = () => {
    const filteredCrypto = LIST_COIN.filter(option => {
      if (option?.ticker === COIN.XEC) return;
      return `${option?.name} (${option?.ticker})`.toLowerCase().includes(searchTerm.toLowerCase());
    });

    return (
      <div className="content-crypto">
        {searchTextField}
        <Box sx={{ mt: 1 }}>
          {filteredCrypto.map(option => (
            <Button
              key={option?.ticker}
              onClick={() => handleSelect(option)}
              fullWidth
              variant="text"
              style={{ textTransform: 'capitalize', fontSize: '1.1rem' }}
              sx={{ justifyContent: 'flex-start', textAlign: 'left' }}
            >
              {option?.name} {option?.isDisplayTicker && `(${option?.ticker})`}
            </Button>
          ))}
          {filteredCrypto.length === 0 && (
            <Button
              variant="text"
              style={{ textTransform: 'capitalize', fontSize: '1.1rem' }}
              sx={{ justifyContent: 'flex-start', textAlign: 'left' }}
            >
              Nothing here
            </Button>
          )}
        </Box>
      </div>
    );
  };

  const contentGoodsServices = () => {
    return (
      <div className="content-goods-services">
        {searchTextField}
        <Box sx={{ mt: 1 }}>
          <Button
            key={NAME_PAYMENT_METHOD.GOODS_SERVICES}
            onClick={() => handleSelect(NAME_PAYMENT_METHOD.GOODS_SERVICES)}
            fullWidth
            variant="text"
            style={{ textTransform: 'capitalize', fontSize: '1.1rem' }}
            sx={{ justifyContent: 'flex-start', textAlign: 'left' }}
          >
            {NAME_PAYMENT_METHOD.GOODS_SERVICES}
          </Button>
        </Box>
      </div>
    );
  };

  const contentTab = () => {
    switch (value) {
      case PAYMENT_METHOD.FIAT_CURRENCY:
        return contentFiat();
      case PAYMENT_METHOD.CRYPTO:
        return contentCrypto();
      case PAYMENT_METHOD.GOODS_SERVICES:
        return contentGoodsServices();
      default:
        return;
    }
  };

  return (
    <React.Fragment>
      <StyledDialog
        fullScreen={fullScreen}
        open={isOpen}
        onClose={() => props.onDismissModal!(false)}
        TransitionComponent={Transition}
      >
        <DialogTitle>
          <IconButton className="back-btn" onClick={() => props.onDismissModal!(false)}>
            <ChevronLeft />
          </IconButton>
          <Typography style={{ fontSize: '20px', fontWeight: 'bold' }}>Select currency</Typography>
        </DialogTitle>
        <DialogContent>
          <StyledTabs
            value={value}
            onChange={handleChange}
            indicatorColor="secondary"
            textColor="inherit"
            variant="fullWidth"
          >
            <Tab
              label={TabType.FIAT}
              value={PAYMENT_METHOD.FIAT_CURRENCY}
              id={`full-width-tab-${TabType.FIAT}`}
              aria-controls={`full-width-tabpanel-${TabType.FIAT}`}
            />
            <Tab
              label={TabType.CRYPTO}
              value={PAYMENT_METHOD.CRYPTO}
              id={`full-width-tab-${TabType.CRYPTO}`}
              aria-controls={`full-width-tabpanel-${TabType.CRYPTO}`}
            />
            <Tab
              label={TabType.GOODS_SERVICES}
              value={PAYMENT_METHOD.GOODS_SERVICES}
              id={`full-width-tab-${TabType.GOODS_SERVICES}`}
              aria-controls={`full-width-tabpanel-${TabType.GOODS_SERVICES}`}
            />
          </StyledTabs>
          <div style={{ padding: '16px' }}>{contentTab()}</div>
        </DialogContent>
      </StyledDialog>
    </React.Fragment>
  );
};

export default FilterCurrencyModal;
