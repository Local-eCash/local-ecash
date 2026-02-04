'use client';

import { LIST_CURRENCIES_USED } from '@bcpros/lixi-models';
import { ChevronLeft } from '@mui/icons-material';
import {
  Box,
  Button,
  Dialog,
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
import React, { useId, useMemo, useState } from 'react';
import { FilterCurrencyType } from '../../store/type/types';

interface ShoppingCurrencyModalProps {
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
    },

    '.btn-clear': {
      color: '#FFF',
      position: 'absolute',
      right: '10px',
      fontSize: '12px',
      padding: '1px 5px'
    }
  },

  '.MuiDialogContent-root': {
    padding: '16px'
  },

  button: {
    color: theme.palette.text.secondary
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

/**
 * Simplified currency modal for Shopping tab
 * Shows fiat currencies + XEC in a single list, sorted alphabetically
 */
const ShoppingCurrencyModal: React.FC<ShoppingCurrencyModalProps> = props => {
  const { isOpen, onDismissModal, setSelectedItem } = props;
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));

  const [searchTerm, setSearchTerm] = useState('');
  const titleId = useId();

  // Build combined list of fiat currencies + XEC, sorted alphabetically by code
  const currencyList = useMemo(() => {
    // Add XEC as a currency option
    const xecOption = { code: 'XEC', name: 'eCash' };

    // Combine fiat currencies with XEC
    const allCurrencies = [...LIST_CURRENCIES_USED, xecOption];

    // Sort alphabetically by code
    return allCurrencies.sort((a, b) => a.code.localeCompare(b.code));
  }, []);

  // Filter currencies based on search term
  const filteredCurrencies = useMemo(() => {
    if (!searchTerm) return currencyList;

    const lowerSearch = searchTerm.toLowerCase();
    return currencyList.filter(
      option => option.code.toLowerCase().includes(lowerSearch) || option.name.toLowerCase().includes(lowerSearch)
    );
  }, [currencyList, searchTerm]);

  const handleSelect = (currency: { code: string; name: string }) => {
    const filterCurrency: FilterCurrencyType = {
      paymentMethod: 5, // PAYMENT_METHOD.GOODS_SERVICES
      value: currency.code
    };
    setSelectedItem?.(filterCurrency);
    onDismissModal?.(false);
    setSearchTerm('');
  };

  const handleClear = () => {
    setSelectedItem?.({ paymentMethod: 5, value: '' });
    onDismissModal?.(false);
    setSearchTerm('');
  };

  const handleClose = () => {
    onDismissModal?.(false);
    setSearchTerm('');
  };

  return (
    <StyledDialog
      fullScreen={fullScreen}
      open={isOpen}
      onClose={handleClose}
      TransitionComponent={Transition}
      aria-labelledby={titleId}
    >
      <DialogTitle id={titleId}>
        <IconButton className="back-btn" onClick={handleClose} aria-label="Close">
          <ChevronLeft />
        </IconButton>
        <Typography style={{ fontSize: '20px', fontWeight: 'bold' }}>Select currency</Typography>
        <Button variant="contained" className="btn-clear" onClick={handleClear}>
          Clear
        </Button>
      </DialogTitle>
      <DialogContent>
        <TextField
          label="Search"
          variant="filled"
          fullWidth
          onChange={e => setSearchTerm(e.target.value)}
          value={searchTerm}
          autoFocus
        />
        <Box sx={{ mt: 1, maxHeight: 'calc(100vh - 200px)', overflow: 'auto' }}>
          {filteredCurrencies.map(option => (
            <Button
              key={option.code}
              onClick={() => handleSelect(option)}
              fullWidth
              variant="text"
              style={{ textTransform: 'none', fontSize: '1.1rem' }}
              sx={{ justifyContent: 'flex-start', textAlign: 'left' }}
            >
              {option.code} - {option.name}
            </Button>
          ))}
          {filteredCurrencies.length === 0 && (
            <Typography sx={{ p: 2, textAlign: 'center', color: 'text.secondary' }}>No currencies found</Typography>
          )}
        </Box>
      </DialogContent>
    </StyledDialog>
  );
};

export default ShoppingCurrencyModal;
