import { ShoppingFilterConfig } from '@/src/shared/models/shoppingFilterConfig';
import { ALL, ALL_CURRENCIES, COIN_USD_STABLECOIN_TICKER, LIST_USD_STABLECOIN } from '@/src/store/constants';
import { FilterCurrencyType } from '@/src/store/type/types';
import { getNumberFromFormatNumber, isShowAmountOrSortFilter } from '@/src/store/util';
import { OfferFilterInput } from '@bcpros/redux-store';
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
import React, { useCallback, useState } from 'react';
import { NumericFormat } from 'react-number-format';
import ShoppingCurrencyModal from '../FilterList/ShoppingCurrencyModal';

const WrapFilter = styled('div')(({ theme }) => ({
  marginBottom: '16px',

  '.filter-detail': {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '16px',
    padding: '10px 0 10px',

    '.filter-currency': {
      width: '100%',

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

interface ShoppingFilterComponentProps {
  filterConfig: ShoppingFilterConfig;
  setFilterConfig: (config: ShoppingFilterConfig) => void;
}

const ShoppingFilterComponent: React.FC<ShoppingFilterComponentProps> = ({ filterConfig, setFilterConfig }) => {
  const [openCurrencyList, setOpenCurrencyList] = useState(false);

  const showTickerCryptoUSDStablecoin = filterConfig?.coin === COIN_USD_STABLECOIN_TICKER;

  const handleFilterUSDStablecoin = (e: SelectChangeEvent<string>) => {
    const ticker = e?.target?.value;
    setFilterConfig({
      ...filterConfig,
      coinOthers: ticker === ALL ? null : ticker
    });
  };

  const handleFilterCurrency = (filterValue: FilterCurrencyType) => {
    let updatedConfig = { ...filterConfig };

    // For Goods & Services, we use tickerPriceGoodsServices field (backend filter)
    const selectedCurrency = filterValue?.value ?? '';

    updatedConfig = {
      ...updatedConfig,
      tickerPriceGoodsServices: selectedCurrency, // NEW: Backend filter field
      fiatCurrency: null,
      coin: null,
      amount: null
    };

    setFilterConfig(updatedConfig);
  };

  const handleResetFilterCurrency = () => {
    setFilterConfig({
      ...filterConfig,
      tickerPriceGoodsServices: null, // Reset backend filter
      fiatCurrency: null,
      coin: null,
      amount: null
    });
  };

  const debouncedHandler = useCallback(
    debounce(value => {
      setFilterConfig({
        ...filterConfig,
        amount: value
      });
    }, 500),
    [filterConfig]
  );

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    debouncedHandler(value ? getNumberFromFormatNumber(value) : null);
  };

  const placeholderCurrency = () => {
    return ALL_CURRENCIES;
  };

  const isResetCurrency = !!filterConfig?.tickerPriceGoodsServices;

  const offerFilterInput: OfferFilterInput = {
    ...filterConfig,
    amount: typeof filterConfig.amount === 'string' ? Number(filterConfig.amount) : filterConfig.amount
  };
  const isShowAmountFilter = Boolean(isShowAmountOrSortFilter(offerFilterInput));

  return (
    <React.Fragment>
      <WrapFilter>
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
                value={filterConfig?.amount ?? ''}
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
                        {filterConfig?.tickerPriceGoodsServices}
                      </Typography>{' '}
                    </Button>
                  )
                }}
              />
            ) : (
              <TextField
                variant="outlined"
                placeholder={placeholderCurrency()}
                value={filterConfig?.tickerPriceGoodsServices ?? ''}
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

          {showTickerCryptoUSDStablecoin && (
            <Select
              className="form-input"
              variant="outlined"
              onChange={e => handleFilterUSDStablecoin(e)}
              value={filterConfig?.coinOthers ?? ALL}
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
      <ShoppingCurrencyModal
        isOpen={openCurrencyList}
        setSelectedItem={value => handleFilterCurrency(value)}
        onDismissModal={value => setOpenCurrencyList(value)}
      />
    </React.Fragment>
  );
};

export default ShoppingFilterComponent;
