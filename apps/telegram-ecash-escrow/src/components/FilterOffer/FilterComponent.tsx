import {
  ALL,
  ALL_CURRENCIES,
  AllPaymentMethodIds,
  AllPaymentMethodIdsFiat,
  COIN_OTHERS,
  COIN_USD_STABLECOIN_TICKER,
  LIST_USD_STABLECOIN,
  NAME_PAYMENT_METHOD
} from '@/src/store/constants';
import { FilterCurrencyType } from '@/src/store/type/types';
import { getNumberFromFormatNumber, isShowAmountOrSortFilter } from '@/src/store/util';
import { COIN, PAYMENT_METHOD } from '@bcpros/lixi-models';
import {
  OfferFilterInput,
  getOfferFilterConfig,
  saveOfferFilterConfig,
  useSliceDispatch as useLixiSliceDispatch,
  useSliceSelector as useLixiSliceSelector
} from '@bcpros/redux-store';
import { ArrowDropDown, Close } from '@mui/icons-material';
import {
  Button,
  IconButton,
  InputAdornment,
  MenuItem,
  Select,
  SelectChangeEvent,
  TextField,
  Typography
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { debounce } from 'lodash';
import React, { useCallback, useEffect, useState } from 'react';
import { NumericFormat } from 'react-number-format';
import FilterCurrencyModal from '../FilterList/FilterCurrencyModal';
import FilterFiatPaymentMethodModal from '../FilterList/FilterFiatPaymentMethodModal';

const WrapFilter = styled('div')(({ theme }) => ({
  marginBottom: '16px',

  '.filter-buy-sell': {
    padding: '10px 0 10px',
    display: 'flex',
    gap: '10px',
    justifyContent: 'space-between',

    '.group-btn': {
      width: '100%',
      display: 'flex',

      '.type-buy-btn': {
        borderTopRightRadius: 0,
        borderBottomRightRadius: 0
      },

      '.type-sell-btn': {
        borderTopLeftRadius: 0,
        borderBottomLeftRadius: 0
      },

      button: {
        width: '50%'
      }
    },

    '.select-coin': {
      '.MuiSelect-select': {
        paddingTop: 0,
        paddingBottom: 0
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
    padding: '10px 0 10px',

    '.filter-currency, .filter-payment-method': {
      width: '50%'
    },

    '.filter-currency': {
      '.btn-currency': {
        minWidth: '45px',
        width: 'fit-content',
        padding: '5px 1px',
        borderRadius: '5px',
        marginRight: '-8px'
      },

      input: {
        marginRight: '3px'
      }
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

  const showTickerCryptoUSDStablecoin =
    offerFilterConfig?.paymentMethodIds.length === 1 &&
    offerFilterConfig?.paymentMethodIds[0] === PAYMENT_METHOD.CRYPTO &&
    offerFilterConfig?.coin === COIN_USD_STABLECOIN_TICKER;

  const handleSetBuyOffer = (isBuyOffer: boolean) => {
    setIsBuyOffer(isBuyOffer);
    const offerFilterInput: OfferFilterInput = {
      ...offerFilterConfig,
      isBuyOffer: isBuyOffer
    };

    dispatch(saveOfferFilterConfig(offerFilterInput));
  };

  const handleFilterUSDStablecoin = (e: SelectChangeEvent<string>) => {
    const ticker = e?.target?.value;
    const offerFilterInput: OfferFilterInput = {
      ...offerFilterConfig,
      coinOthers: ticker === ALL ? null : ticker
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
          paymentMethodIds: AllPaymentMethodIdsFiat,
          amount: offerFilterConfig?.amount ?? null
        };
        break;
      case PAYMENT_METHOD.CRYPTO:
        offerFilterInput = {
          isBuyOffer: offerFilterConfig?.isBuyOffer ?? true,
          coin: filterValue?.value ?? '',
          paymentMethodIds: [PAYMENT_METHOD.CRYPTO],
          amount: filterValue?.value !== COIN_OTHERS ? offerFilterConfig?.amount : null
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
      paymentMethodIds: AllPaymentMethodIds,
      amount: null
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

  const debouncedHandler = useCallback(
    debounce(value => {
      const offerFilterInput: OfferFilterInput = {
        ...offerFilterConfig,
        amount: value
      };

      dispatch(saveOfferFilterConfig(offerFilterInput));
    }, 500),
    [offerFilterConfig]
  );

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    debouncedHandler(value ? getNumberFromFormatNumber(value) : null);
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

  const isShowAmountFilter = isShowAmountOrSortFilter(offerFilterConfig);

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
          {/* <div className="select-coin">
            <Select
              variant="filled"
              inputProps={null}
              value={COIN.XEC}
              style={{
                height: '40px'
              }}
            >
              <MenuItem value={COIN.XEC}>{COIN.XEC}</MenuItem>
            </Select>
          </div> */}
        </div>
        <div className="filter-label">
          <Button variant="contained" color="success">
            {isBuyOffer ? 'For' : 'With'}
          </Button>
        </div>
        <div className="filter-detail">
          <div className="filter-currency">
            {isShowAmountFilter ? (
              <NumericFormat
                allowLeadingZeros={false}
                allowNegative={false}
                thousandSeparator={true}
                decimalScale={2}
                customInput={TextField}
                onChange={handleAmountChange}
                value={offerFilterConfig?.amount ?? ''}
                className="form-input"
                id="amount"
                placeholder="Amount"
                variant="outlined"
                InputProps={{
                  endAdornment: (
                    <Button
                      className="btn-currency"
                      color="success"
                      variant="contained"
                      onClick={() => setOpenCurrencyList(true)}
                    >
                      <Typography
                        noWrap
                        sx={{
                          overflow: 'hidden',
                          textOverflow: 'clip',
                          display: 'block',
                          fontSize: '12px',
                          color: 'white'
                        }}
                      >
                        {offerFilterConfig?.fiatCurrency ?? offerFilterConfig?.coin}
                      </Typography>{' '}
                    </Button>
                  )
                }}
              />
            ) : (
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
            )}
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

          {showTickerCryptoUSDStablecoin && (
            <Select
              className="form-input"
              variant="outlined"
              onChange={e => handleFilterUSDStablecoin(e)}
              value={offerFilterConfig?.coinOthers ?? ALL}
              placeholder="All"
              id="coinOthers"
              labelId="coinOthers-label"
              style={{ width: '50%' }}
            >
              <MenuItem key={ALL} value={ALL}>
                ALL
              </MenuItem>
              {LIST_USD_STABLECOIN.map(item => {
                return (
                  <MenuItem key={item.id} value={item.name}>
                    {item.name}
                  </MenuItem>
                );
              })}
            </Select>
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
