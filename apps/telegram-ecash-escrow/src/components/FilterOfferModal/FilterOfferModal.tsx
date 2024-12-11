'use client';

import { LIST_COIN } from '@/src/store/constants';
import { LIST_CURRENCIES_USED } from '@bcpros/lixi-models';
import {
  Location,
  OfferFilterInput,
  countryApi,
  getAllCountries,
  getAllPaymentMethods,
  getOfferFilterConfig,
  saveOfferFilterConfig,
  useSliceDispatch as useLixiSliceDispatch,
  useSliceSelector as useLixiSliceSelector
} from '@bcpros/redux-store';
import styled from '@emotion/styled';
import { Close, CloseOutlined } from '@mui/icons-material';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormHelperText,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  NativeSelect,
  Slide,
  TextField,
  Typography,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { TransitionProps } from '@mui/material/transitions';
import React, { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import FilterListLocationModal from '../FilterList/FilterListLocationModal';
import FilterListModal from '../FilterList/FilterListModal';

interface FilterOfferModalProps {
  isOpen: boolean;
  onDissmissModal?: (value: boolean) => void;
  onConfirmClick?: () => void;
}

const StyledDialog = styled(Dialog)`
  .MuiPaper-root {
    background-image: url('/bg-dialog.svg');
    background-repeat: no-repeat;
    background-size: cover;
    width: 500px;
    height: 100vh;
    max-height: 100%;
    margin: 0;
    @media (max-width: 576px) {
      width: 100%;
    }
  }

  .MuiIconButton-root {
    width: fit-content;
    svg {
      font-size: 32px;
    }
  }

  .MuiDialogTitle-root {
    padding: 0 16px;
    padding-top: 16px;
    font-size: 26px;
  }

  .MuiDialogContent-root {
    padding: 0;
  }

  .MuiDialogActions-root {
    justify-content: space-evenly;
    padding: 16px;
    padding-bottom: 32px;

    button {
      text-transform: math-auto;
      width: 100%;

      &.confirm-btn {
        color: white;
      }
    }
  }

  .close-btn {
    padding: 6px;
    position: absolute;
    right: 16px;
    top: 16px;
    border: 1px solid rgba(255, 255, 255, 0.3);
    border-radius: 12px;

    svg {
      font-size: 24px;
    }
  }
`;

export const FormControlWithNativeSelect = styled(FormControl)`
  width: 100%;

  .MuiFormLabel-root {
    transform: translate(0, 16px);

    &[data-shrink='true'] {
      display: none;
    }
  }
`;

const FilterWrap = styled.div`
  .filter-item {
    border-bottom: 1px solid rgba(255, 255, 255, 0.2);
    padding: 20px 16px;

    &:last-of-type {
      border-bottom: 0;
    }

    .content {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 8px;
    }

    p:not(.Mui-error) {
      color: #79869b;
    }

    button {
      text-transform: math-auto;
      border-color: rgba(255, 255, 255, 0.2);
      font-size: 14px;
      padding: 8px;

      &.active {
        font-weight: bold;
        border-color: rgb(41, 142, 23);
      }
    }
  }
`;

const Transition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement<any, any>;
  },
  ref: React.Ref<unknown>
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const FilterOfferModal: React.FC<FilterOfferModalProps> = props => {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));
  const offerFilterConfig = useLixiSliceSelector(getOfferFilterConfig);
  const offerFilterPaymenthod = offerFilterConfig?.paymentMethodIds;

  const {
    handleSubmit,
    control,
    reset,
    setValue,
    getValues,
    clearErrors,
    formState: { errors }
  } = useForm<{
    country: {
      name?: string;
    };
    state: {
      adminNameAscii: string;
    };
    city: {
      cityAscii: string;
    };
    currency: string;
    coin: string;
  }>({
    defaultValues: {
      country: null,
      state: null,
      city: null,
      currency: null,
      coin: offerFilterConfig?.coin ?? null
    }
  });

  const [selectedOptionPayment, setSelectedOptionPayment] = useState<number>(
    offerFilterPaymenthod && offerFilterPaymenthod.length === 1 && offerFilterPaymenthod[0] >= 4
      ? offerFilterPaymenthod[0]
      : 0
  ); //0 is fiat currency contains (cash, bank, app)
  const [selectedOptionPaymentFiatCurrency, setSelectedOptionPaymentFiatCurrency] = useState<number[]>(
    offerFilterPaymenthod && offerFilterPaymenthod.length > 1 ? offerFilterPaymenthod : [1]
  ); //1 is cash
  const [openCountryList, setOpenCountryList] = useState(false);
  const [openStateList, setOpenStateList] = useState(false);
  const [openCityList, setOpenCityList] = useState(false);

  const dispatch = useLixiSliceDispatch();
  const paymenthods = useLixiSliceSelector(getAllPaymentMethods);
  const countries = useLixiSliceSelector(getAllCountries);
  const [listStates, setListStates] = useState<Location[]>([]);
  const [listCities, setListCities] = useState<Location[]>([]);

  const handleSelect = (id: number) => {
    const isSelected = selectedOptionPayment === id;

    if (!isSelected) {
      setSelectedOptionPayment(id);
    }
  };

  const handleSelectFiatCurrencyPayment = (id: number) => {
    const isSelected = selectedOptionPaymentFiatCurrency.includes(id);

    if (isSelected) {
      //drop select if mutiple select
      selectedOptionPaymentFiatCurrency.length > 1 &&
        setSelectedOptionPaymentFiatCurrency(pre => pre.filter(item => item !== id));
    } else {
      //select it
      setSelectedOptionPaymentFiatCurrency(pre => [...pre, id]);
    }
  };

  const handleFilter = async data => {
    const { country, state, coin, currency, city } = data;
    const paymentMethodSelected =
      selectedOptionPayment === 0 ? selectedOptionPaymentFiatCurrency : [selectedOptionPayment];

    let offerFilterInput: OfferFilterInput = {
      countryName: country && country.name,
      countryCode: country && country.iso2,
      stateName: state && state.adminNameAscii,
      adminCode: state && state.adminCode,
      cityName: city && city.cityAscii,
      paymentMethodIds: paymentMethodSelected,
      coin: coin ? coin : null,
      fiatCurrency: currency ? currency : null
    };

    //remove country if payment > 3 (not location)
    if (paymentMethodSelected.includes(4) || paymentMethodSelected.includes(5)) {
      offerFilterInput = {
        ...offerFilterInput,
        countryName: null,
        countryCode: null,
        stateName: null,
        adminCode: null,
        cityName: null,
        fiatCurrency: null
      };
    } else if (paymentMethodSelected.length === 1 && paymentMethodSelected[0] === 3)
      offerFilterInput = {
        ...offerFilterInput,
        countryName: null,
        countryCode: null,
        stateName: null,
        adminCode: null,
        cityName: null
      };
    //remove coin if not crypto
    if (!paymentMethodSelected.includes(4)) {
      offerFilterInput = {
        ...offerFilterInput,
        coin: null
      };
    }

    dispatch(saveOfferFilterConfig(offerFilterInput));
    props.onDissmissModal!(false);
  };

  const handleReset = () => {
    reset();
    setSelectedOptionPayment(0);
    const offerFilterInput: OfferFilterInput = {
      countryName: null,
      countryCode: null,
      stateName: null,
      adminCode: null,
      paymentMethodIds: [],
      coin: null,
      fiatCurrency: null
    };

    dispatch(saveOfferFilterConfig(offerFilterInput));
  };

  const getLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        position => {
          const latitude = position.coords.latitude;
          const longitude = position.coords.longitude;

          (async () => {
            const locations = await countryApi.getCoordinate(latitude.toString(), longitude.toString());

            if (locations.length > 0) {
              //Config setting have country => Take from config. Otherwise take from location
              const countryDetected = countries.find(
                item => item.iso2 === (offerFilterConfig?.countryCode || locations[0].iso2)
              );
              countryDetected && setValue('country', countryDetected);

              //set currency
              //Config setting have currency => Take from config. Otherwise take from location
              const currencyDetected = LIST_CURRENCIES_USED.find(item => item.country === countryDetected?.iso2);
              setValue('currency', offerFilterConfig?.fiatCurrency || currencyDetected.code);

              const states = await countryApi.getStates(countryDetected?.iso2 ?? '');
              setListStates(states);

              //auto set state and city if config have
              if (offerFilterConfig.adminCode) {
                //set state
                const stateDetected = states.find(item => item.adminCode === offerFilterConfig.adminCode);
                stateDetected && setValue('state', stateDetected);

                //set city if have
                if (offerFilterConfig.cityName) {
                  const cities = await countryApi.getCities(countryDetected?.iso2, stateDetected?.adminCode);
                  setListCities(cities);
                  const cityDetected = cities.find(item => item.cityAscii === offerFilterConfig.cityName);
                  cityDetected && setValue('city', cityDetected);
                }
              }
            }
          })();
        },
        error => {
          console.error('Geolocation error:', error);
        },
        {
          enableHighAccuracy: true
        }
      );
    } else {
      console.error('Geolocation is not supported by this browser.');
    }
  };

  useEffect(() => {
    props.isOpen && getLocation();
  }, [props.isOpen]);

  return (
    <StyledDialog
      fullScreen={fullScreen}
      open={props.isOpen}
      onClose={() => props.onDissmissModal!(false)}
      TransitionComponent={Transition}
    >
      <IconButton className="close-btn" onClick={() => props.onDissmissModal!(false)}>
        <CloseOutlined />
      </IconButton>
      <DialogTitle>Filter</DialogTitle>
      <DialogContent>
        <FilterWrap>
          <div className="filter-item">
            <Typography style={{ marginBottom: '12px' }} variant="body2">
              Payment method
            </Typography>
            <div className="content">
              <Button
                key={'fiat-currency'}
                onClick={() => handleSelect(0)}
                className={selectedOptionPayment === 0 ? 'active' : ''}
                size="small"
                color="inherit"
                variant="outlined"
              >
                Fiat currency
              </Button>
              {paymenthods.map(item => {
                //drop 3 first items and add Fiat currency to it
                if (item.id <= 3) return;

                return (
                  <Button
                    key={item.id}
                    onClick={() => handleSelect(item.id)}
                    className={selectedOptionPayment === item.id ? 'active' : ''}
                    size="small"
                    color="inherit"
                    variant="outlined"
                  >
                    {item.name}
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Crypto */}
          {selectedOptionPayment === 4 && (
            <div className="filter-item">
              <Typography variant="body2">Select coin</Typography>
              <div className="content">
                <Grid item xs={12}>
                  <Controller
                    name="coin"
                    control={control}
                    rules={{
                      validate: value => {
                        if (!value) return 'Coin is required';

                        return true;
                      }
                    }}
                    render={({ field: { onChange, onBlur, value, ref } }) => (
                      <FormControlWithNativeSelect>
                        <InputLabel variant="outlined" htmlFor="select-coin">
                          Coin
                        </InputLabel>
                        <NativeSelect
                          id="select-coin"
                          value={value ?? ''}
                          onBlur={onBlur}
                          ref={ref}
                          onChange={e => {
                            onChange(e);
                            setValue('currency', null);
                          }}
                        >
                          <option aria-label="None" value="" />
                          {LIST_COIN.map(item => {
                            return (
                              <option key={item.ticker} value={item.ticker}>
                                {item.name} ({item.ticker})
                              </option>
                            );
                          })}
                        </NativeSelect>
                        {errors && errors?.coin && (
                          <FormHelperText error={true}>{errors.coin.message as string}</FormHelperText>
                        )}
                      </FormControlWithNativeSelect>
                    )}
                  />
                </Grid>
              </div>
            </div>
          )}

          {/* Fiat currency */}
          {selectedOptionPayment === 0 && (
            <>
              {' '}
              <div className="filter-item">
                <Typography variant="body2">Select currency</Typography>
                <div className="content">
                  <Grid item xs={12}>
                    <Controller
                      name="currency"
                      control={control}
                      rules={{
                        validate: value => {
                          if (!value) return 'Currency is required';

                          return true;
                        }
                      }}
                      render={({ field: { onChange, onBlur, value, ref } }) => (
                        <FormControlWithNativeSelect>
                          <InputLabel variant="outlined" htmlFor="select-currency">
                            Currency
                          </InputLabel>
                          <NativeSelect
                            id="select-currency"
                            value={value ?? ''}
                            onBlur={onBlur}
                            ref={ref}
                            onChange={e => {
                              onChange(e);
                              setValue('coin', null);
                            }}
                          >
                            <option aria-label="None" value="" />
                            {LIST_CURRENCIES_USED.sort((a, b) => {
                              if (a.name < b.name) return -1;
                              if (a.name > b.name) return 1;

                              return 0;
                            }).map(item => {
                              return (
                                <option key={item.code} value={item.code}>
                                  {item.name} ({item.code})
                                </option>
                              );
                            })}
                          </NativeSelect>
                          {errors && errors?.currency && (
                            <FormHelperText error={true}>{errors.currency.message as string}</FormHelperText>
                          )}
                        </FormControlWithNativeSelect>
                      )}
                    />
                  </Grid>
                </div>
              </div>
              <div className="filter-item">
                <Typography style={{ marginBottom: '12px' }} variant="body2">
                  Payment-method of fiat-currency
                </Typography>
                <div className="content">
                  {paymenthods.map(item => {
                    //take first 3 items of fiat
                    if (item.id > 3) return;

                    return (
                      <Button
                        key={item.id}
                        onClick={() => handleSelectFiatCurrencyPayment(item.id)}
                        className={selectedOptionPaymentFiatCurrency.includes(item.id) ? 'active' : ''}
                        size="small"
                        color="inherit"
                        variant="outlined"
                      >
                        {item.name}
                      </Button>
                    );
                  })}
                </div>
              </div>
              {/* cash or bank */}
              {(selectedOptionPaymentFiatCurrency.includes(1) || selectedOptionPaymentFiatCurrency.includes(2)) && (
                <div className="filter-item">
                  <Typography style={{ marginBottom: '15px' }} variant="body2">
                    Location
                  </Typography>
                  <div className="content">
                    <Grid item xs={6}>
                      <Controller
                        name="country"
                        control={control}
                        rules={{
                          validate: value => {
                            if (!value) return 'Country is required';

                            return true;
                          }
                        }}
                        render={({ field: { onChange, value, onBlur, ref } }) => (
                          <FormControl fullWidth>
                            <TextField
                              label="Country"
                              variant="outlined"
                              fullWidth
                              onChange={onChange}
                              onBlur={onBlur}
                              value={value?.name ?? ''}
                              inputRef={ref}
                              onClick={() => setOpenCountryList(true)}
                              InputProps={{
                                endAdornment: getValues('country') && (
                                  <InputAdornment position="end">
                                    <IconButton
                                      style={{ padding: 0, width: '13px' }}
                                      onClick={e => {
                                        e.stopPropagation();
                                        setValue('country', null);
                                        setValue('state', null);
                                        setValue('city', null);
                                      }}
                                    >
                                      <Close />
                                    </IconButton>
                                  </InputAdornment>
                                ),
                                readOnly: true
                              }}
                            />
                            {errors && errors?.country && (
                              <FormHelperText error={true}>{errors.country.message as string}</FormHelperText>
                            )}
                          </FormControl>
                        )}
                      />
                    </Grid>
                    {selectedOptionPaymentFiatCurrency.includes(1) && (
                      <Grid item xs={6}>
                        <Controller
                          name="state"
                          control={control}
                          render={({ field: { onChange, value, onBlur, ref } }) => (
                            <FormControl fullWidth>
                              <TextField
                                label="State"
                                variant="outlined"
                                fullWidth
                                onChange={onChange}
                                onBlur={onBlur}
                                value={value?.adminNameAscii ?? ''}
                                inputRef={ref}
                                onClick={() => setOpenStateList(true)}
                                disabled={!getValues('country')}
                                InputProps={{
                                  endAdornment: getValues('state') && (
                                    <InputAdornment position="end">
                                      <IconButton
                                        style={{ padding: 0, width: '13px' }}
                                        onClick={e => {
                                          e.stopPropagation();
                                          setValue('state', null);
                                          setValue('city', null);
                                        }}
                                      >
                                        <Close />
                                      </IconButton>
                                    </InputAdornment>
                                  ),
                                  readOnly: true
                                }}
                              />
                            </FormControl>
                          )}
                        />
                      </Grid>
                    )}
                  </div>
                  {selectedOptionPaymentFiatCurrency.includes(1) && getValues('country') && getValues('state') && (
                    <Grid item xs={12}>
                      <Controller
                        name="city"
                        control={control}
                        render={({ field: { onChange, value, onBlur, ref } }) => (
                          <FormControl fullWidth>
                            <TextField
                              style={{ marginTop: '10px' }}
                              label="City"
                              variant="outlined"
                              fullWidth
                              onChange={onChange}
                              onBlur={onBlur}
                              value={value?.cityAscii ?? ''}
                              inputRef={ref}
                              onClick={() => setOpenCityList(true)}
                              disabled={!getValues('country') && !getValues('state')}
                              InputProps={{
                                endAdornment: getValues('city') && (
                                  <InputAdornment position="end">
                                    <IconButton
                                      style={{ padding: 0, width: '13px' }}
                                      onClick={e => {
                                        e.stopPropagation();
                                        setValue('city', null);
                                      }}
                                    >
                                      <Close />
                                    </IconButton>
                                  </InputAdornment>
                                ),
                                readOnly: true
                              }}
                            />
                            {errors && errors?.city && (
                              <FormHelperText error={true}>{errors.city.message as string}</FormHelperText>
                            )}
                          </FormControl>
                        )}
                      />
                    </Grid>
                  )}
                </div>
              )}
            </>
          )}
        </FilterWrap>
      </DialogContent>
      <DialogActions>
        <Button
          color="inherit"
          variant="contained"
          autoFocus
          onClick={() => {
            handleReset();
            props.onDissmissModal!(false);
          }}
        >
          Reset
        </Button>
        <Button className="confirm-btn" color="info" variant="contained" onClick={handleSubmit(handleFilter)} autoFocus>
          Confirm
        </Button>
      </DialogActions>
      <FilterListModal
        isOpen={openCountryList}
        onDissmissModal={value => setOpenCountryList(value)}
        setSelectedItem={async value => {
          setValue('country', value);
          clearErrors('country');
          const states = await countryApi.getStates(value?.iso2 ?? '');
          setListStates(states);
          setValue('state', null);
        }}
        listItems={countries}
      />
      <FilterListLocationModal
        isOpen={openStateList}
        listItems={listStates}
        propertyToSearch="adminNameAscii"
        onDissmissModal={value => setOpenStateList(value)}
        setSelectedItem={async value => {
          setValue('state', value);
          clearErrors('state');
          const cities = await countryApi.getCities(value?.iso2 ?? '', value?.adminCode ?? '');
          setListCities(cities);
          setValue('city', null);
        }}
      />
      <FilterListLocationModal
        isOpen={openCityList}
        listItems={listCities}
        propertyToSearch="cityAscii"
        onDissmissModal={value => setOpenCityList(value)}
        setSelectedItem={value => {
          setValue('city', value);
          clearErrors('city');
        }}
      />
    </StyledDialog>
  );
};

export default FilterOfferModal;
