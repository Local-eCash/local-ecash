import {
  ALL_CURRENCIES,
  AllPaymentMethodIds,
  AllPaymentMethodIdsFiat,
  NAME_PAYMENT_METHOD
} from '@/src/store/constants';
import { FilterCurrencyType } from '@/src/store/type/types';
import { COIN, PAYMENT_METHOD } from '@bcpros/lixi-models';
import {
  OfferFilterInput,
  getOfferFilterConfig,
  saveOfferFilterConfig,
  useSliceDispatch as useLixiSliceDispatch,
  useSliceSelector as useLixiSliceSelector
} from '@bcpros/redux-store';
import { ArrowDropDown, Close } from '@mui/icons-material';
import { Button, IconButton, InputAdornment, TextField } from '@mui/material';
import { styled } from '@mui/material/styles';
import React, { useEffect, useState } from 'react';
import FilterCurrencyModal from '../FilterList/FilterCurrencyModal';
import FilterFiatPaymentMethodModal from '../FilterList/FilterFiatPaymentMethodModal';

const WrapFilter = styled('div')(({ theme }) => ({
  marginBottom: '16px',

  '.filter-buy-sell': {
    padding: '10px',
    background: theme.custom.bgQuaternary,

    '.group-btn': {
      display: 'flex',
      gap: '10px',
      button: {
        width: '50%'
      }
    },

    '.inactive': {
      background: '#bfbfbf'
    }
  },

  '.filter-label': {
    display: 'flex',
    margin: '-4px 0',

    button: {
      pointerEvents: 'none',
      padding: '0 10px',
      fontSize: '11px',
      textTransform: 'uppercase',
      borderRadius: '5px',
      minWidth: 'fit-content',
      margin: '0 auto'
    }
  },

  '.filter-detail': {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '16px',
    padding: '10px',
    background: theme.custom.bgTertiary,

    '.filter-currency, .filter-payment-method': {
      width: '50%'
    },

    '.MuiInputBase-root': {
      height: '45px',
      width: 'fit-content'
    },

    '& input::placeholder': {
      fontSize: '13px',
      fontWeight: 'bold'
    }
  }
}));

const FilterComponent = () => {
  const dispatch = useLixiSliceDispatch();

  const offerFilterConfig = useLixiSliceSelector(getOfferFilterConfig);

  const [isBuyOffer, setIsBuyOffer] = useState(offerFilterConfig?.isBuyOffer ?? true);

  const [openCurrencyList, setOpenCurrencyList] = useState(false);
  const [openPaymentMethodFilter, setOpenPaymentMethodFilter] = useState(false);

  const disablePaymentMethod = () => {
    const paymentMethodSelected =
      offerFilterConfig?.paymentMethodIds.length === 1 && offerFilterConfig?.paymentMethodIds[0];

    if (
      paymentMethodSelected === PAYMENT_METHOD.CRYPTO ||
      paymentMethodSelected === PAYMENT_METHOD.GOODS_SERVICES ||
      offerFilterConfig?.paymentMethodIds.length === 0
    ) {
      return true;
    }

    return false;
  };

  const handleSetBuyOffer = (isBuyOffer: boolean) => {
    setIsBuyOffer(isBuyOffer);
    const offerFilterInput: OfferFilterInput = {
      ...offerFilterConfig,
      isBuyOffer: isBuyOffer
    };

    dispatch(saveOfferFilterConfig(offerFilterInput));
  };

  const handleFilterCurrency = (filterValue: FilterCurrencyType) => {
    let offerFilterInput: OfferFilterInput = {
      ...offerFilterConfig
    };

    switch (filterValue.paymentMethod) {
      case PAYMENT_METHOD.FIAT_CURRENCY:
        offerFilterInput = {
          isBuyOffer: offerFilterConfig?.isBuyOffer ?? true,
          fiatCurrency: filterValue?.value ?? '',
          paymentMethodIds: AllPaymentMethodIdsFiat
        };
        break;
      case PAYMENT_METHOD.CRYPTO:
        offerFilterInput = {
          isBuyOffer: offerFilterConfig?.isBuyOffer ?? true,
          coin: filterValue?.value ?? '',
          paymentMethodIds: [PAYMENT_METHOD.CRYPTO]
        };
        break;
      case PAYMENT_METHOD.GOODS_SERVICES:
        offerFilterInput = {
          isBuyOffer: offerFilterInput?.isBuyOffer ?? true,
          paymentMethodIds: [PAYMENT_METHOD.GOODS_SERVICES]
        };
        break;
    }

    dispatch(saveOfferFilterConfig(offerFilterInput));
  };

  const handleResetFilterCurrency = () => {
    const offerFilterInput: OfferFilterInput = {
      isBuyOffer: offerFilterConfig?.isBuyOffer ?? false,
      paymentMethodIds: AllPaymentMethodIds
    };

    dispatch(saveOfferFilterConfig(offerFilterInput));
  };

  const handleResetFilterCurrencyFiat = () => {
    const offerFilterInput: OfferFilterInput = {
      ...offerFilterConfig,
      countryName: null,
      countryCode: null,
      stateName: null,
      adminCode: null,
      cityName: null,
      paymentApp: null,
      paymentMethodIds: [1, 2, 3]
    };

    dispatch(saveOfferFilterConfig(offerFilterInput));
  };

  const placeholderCurrency = () => {
    const paymentMethodSelected =
      offerFilterConfig?.paymentMethodIds.length === 1 && offerFilterConfig?.paymentMethodIds[0];
    if (paymentMethodSelected === PAYMENT_METHOD.GOODS_SERVICES) {
      return NAME_PAYMENT_METHOD.GOODS_SERVICES;
    }
    if (offerFilterConfig?.paymentMethodIds !== AllPaymentMethodIds) {
      return ALL_CURRENCIES;
    }
    return 'Everything';
  };

  const placeholderPaymentMethod = () => {
    const paymentMethodSelected =
      offerFilterConfig?.paymentMethodIds.length === 1 && offerFilterConfig?.paymentMethodIds[0];
    if (paymentMethodSelected === PAYMENT_METHOD.GOODS_SERVICES) {
      return NAME_PAYMENT_METHOD.GOODS_SERVICES;
    }
    if (paymentMethodSelected === PAYMENT_METHOD.CRYPTO) {
      return NAME_PAYMENT_METHOD.CRYPTO;
    }
    return NAME_PAYMENT_METHOD.PAYMENT_METHOD;
  };

  const valuePaymentMethod = () => {
    const paymentMethodSelected =
      offerFilterConfig?.paymentMethodIds.length === 1 && offerFilterConfig?.paymentMethodIds[0];
    switch (paymentMethodSelected) {
      case PAYMENT_METHOD.CASH_IN_PERSON:
        return NAME_PAYMENT_METHOD.CASH_IN_PERSON;
      case PAYMENT_METHOD.BANK_TRANSFER:
        return NAME_PAYMENT_METHOD.BANK_TRANSFER;
      case PAYMENT_METHOD.PAYMENT_APP:
        return offerFilterConfig?.paymentApp;
      default:
        return '';
    }
  };

  const isResetCurrency =
    offerFilterConfig?.fiatCurrency ||
    offerFilterConfig?.coin ||
    disablePaymentMethod() ||
    placeholderCurrency() === ALL_CURRENCIES;

  // if config not set buy or not have payment-methods, set default
  useEffect(() => {
    if (offerFilterConfig?.isBuyOffer === undefined || offerFilterConfig?.paymentMethodIds?.length === 0) {
      handleResetFilterCurrency();
    }
  }, []);

  return (
    <React.Fragment>
      <WrapFilter>
        <div className="filter-buy-sell">
          <div className="group-btn">
            <Button
              className={`type-buy-btn ${!isBuyOffer ? '' : 'inactive'}`}
              variant="contained"
              color="info"
              onClick={() => handleSetBuyOffer(false)} // want to buy => sellOffer
            >
              Buy {COIN.XEC}
            </Button>
            <Button
              className={`type-sell-btn ${isBuyOffer ? '' : 'inactive'}`}
              variant="contained"
              color="info"
              onClick={() => handleSetBuyOffer(true)} // want to sell => buyOffer
            >
              Sell {COIN.XEC}
            </Button>
          </div>
        </div>
        <div className="filter-label">
          <Button variant="contained" color="warning">
            {isBuyOffer ? 'For' : 'With'}
          </Button>
        </div>
        <div className="filter-detail">
          <div className="filter-currency">
            <TextField
              variant="outlined"
              placeholder={placeholderCurrency()}
              value={offerFilterConfig?.fiatCurrency ?? offerFilterConfig?.coin ?? ''}
              onClick={() => setOpenCurrencyList(true)}
              InputProps={{
                endAdornment: isResetCurrency ? (
                  <InputAdornment position="end">
                    <IconButton
                      style={{ padding: 0, width: '13px' }}
                      onClick={e => {
                        e.stopPropagation();
                        handleResetFilterCurrency();
                      }}
                    >
                      <Close />
                    </IconButton>
                  </InputAdornment>
                ) : (
                  <InputAdornment position="end">
                    <IconButton style={{ padding: 0, width: '13px' }}>
                      <ArrowDropDown />
                    </IconButton>
                  </InputAdornment>
                ),
                readOnly: true
              }}
            />
          </div>
          {!disablePaymentMethod() && (
            <div className="filter-payment-method">
              <TextField
                variant="outlined"
                placeholder={placeholderPaymentMethod()}
                value={valuePaymentMethod()}
                onClick={() => setOpenPaymentMethodFilter(true)}
                InputProps={{
                  endAdornment: disablePaymentMethod() ? (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={e => {
                          disablePaymentMethod() && e.stopPropagation();
                        }}
                        style={{ padding: 0, width: '13px' }}
                      >
                        <ArrowDropDown />
                      </IconButton>
                    </InputAdornment>
                  ) : (
                    <InputAdornment position="end">
                      <IconButton
                        disabled={disablePaymentMethod()}
                        style={{ padding: 0, width: '13px' }}
                        onClick={e => {
                          e.stopPropagation();
                          handleResetFilterCurrencyFiat();
                        }}
                      >
                        <Close />
                      </IconButton>
                    </InputAdornment>
                  ),
                  readOnly: true
                }}
              />
            </div>
          )}
        </div>
      </WrapFilter>
      <FilterCurrencyModal
        isOpen={openCurrencyList}
        setSelectedItem={value => handleFilterCurrency(value)}
        onDismissModal={value => setOpenCurrencyList(value)}
      />
      <FilterFiatPaymentMethodModal
        isOpen={openPaymentMethodFilter}
        onDismissModal={value => setOpenPaymentMethodFilter(value)}
      />
    </React.Fragment>
  );
};

export default FilterComponent;
