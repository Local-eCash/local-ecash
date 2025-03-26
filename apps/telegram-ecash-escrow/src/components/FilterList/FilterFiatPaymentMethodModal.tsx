'use client';

import { styled } from '@mui/material/styles';

import { LIST_PAYMENT_APP } from '@/src/store/constants/list-payment-app';
import { PAYMENT_METHOD } from '@bcpros/lixi-models';
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
import { ChevronLeft, Close } from '@mui/icons-material';
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
import { FormControlWithNativeSelect } from '../FilterOffer/FilterOfferModal';
import FilterListLocationModal from './FilterListLocationModal';
import FilterListModal from './FilterListModal';

interface FilterFiatPaymentMethodModal {
  isOpen: boolean;
  onDismissModal?: (value: boolean) => void;
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
    padding: '16px'
  },

  '.MuiDialogActions-root': {
    justifyContent: 'space-evenly',
    padding: '16px',
    paddingBottom: '32px',

    button: {
      textTransform: 'none',
      width: '100%',

      '&.confirm-btn': {
        color: 'white'
      }
    }
  },

  '.content': {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '8px'
  },

  button: {
    color: theme.palette.text.secondary
  }
}));

const StyledFiatMethod = styled('div')(({ theme }) => ({
  marginBottom: '16px',
  'p:not(.Mui-error)': {
    color: '#79869b'
  },

  button: {
    textTransform: 'none',
    fontSize: '14px',
    padding: '8px',
    borderColor: theme.custom.borderPrimary,

    '&.active': {
      fontWeight: 'bold',
      border: `${theme.palette.mode === 'dark' ? '1px' : '2px'} solid rgb(41, 142, 23)`
    }
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

const FilterFiatPaymentMethodModal: React.FC<FilterFiatPaymentMethodModal> = props => {
  const { isOpen } = props;
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));
  const dispatch = useLixiSliceDispatch();

  const paymenthods = useLixiSliceSelector(getAllPaymentMethods);
  const countries = useLixiSliceSelector(getAllCountries);
  const offerFilterConfig = useLixiSliceSelector(getOfferFilterConfig);

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
    paymentApp: string;
  }>({
    defaultValues: {
      country: null,
      state: null,
      city: null,
      paymentApp: null
    }
  });

  const [selectedOptionPaymentFiatCurrency, setSelectedOptionPaymentFiatCurrency] = useState<number>(
    offerFilterConfig?.paymentMethodIds.length === 1 && offerFilterConfig?.paymentMethodIds[0] < PAYMENT_METHOD.CRYPTO // means fiat
      ? offerFilterConfig?.paymentMethodIds[0]
      : 0
  );

  const [openCountryList, setOpenCountryList] = useState(false);
  const [openStateList, setOpenStateList] = useState(false);
  const [openCityList, setOpenCityList] = useState(false);

  const [listStates, setListStates] = useState<Location[]>([]);
  const [listCities, setListCities] = useState<Location[]>([]);

  const handleReset = () => {
    reset();
    setSelectedOptionPaymentFiatCurrency(0);
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

  const handleFilter = async data => {
    const { country, state, city, paymentApp } = data;

    let offerFilterInput: OfferFilterInput = {
      ...offerFilterConfig,
      countryName: country && country.name,
      countryCode: country && country.iso2,
      stateName: state && state.adminNameAscii,
      adminCode: state && state.adminCode,
      cityName: city && city.cityAscii,
      paymentApp: paymentApp && paymentApp,
      paymentMethodIds: [selectedOptionPaymentFiatCurrency]
    };

    if (selectedOptionPaymentFiatCurrency !== PAYMENT_METHOD.PAYMENT_APP) {
      offerFilterInput = {
        ...offerFilterInput,
        paymentApp: null
      };
    }

    if (selectedOptionPaymentFiatCurrency !== PAYMENT_METHOD.CASH_IN_PERSON) {
      offerFilterInput = {
        ...offerFilterInput,
        countryName: null,
        countryCode: null,
        stateName: null,
        adminCode: null,
        cityName: null
      };
    }

    dispatch(saveOfferFilterConfig(offerFilterInput));
    props.onDismissModal!(false);
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
              // Config setting have country => Take from config. Otherwise take from location
              const countryDetected = countries.find(
                item => item.iso2 === (offerFilterConfig?.countryCode || locations[0].iso2)
              );
              countryDetected && setValue('country', countryDetected);

              const states = await countryApi.getStates(countryDetected?.iso2 ?? '');
              setListStates(states);

              // auto set state and city if config have
              if (offerFilterConfig.adminCode) {
                // set state
                const stateDetected = states.find(item => item.adminCode === offerFilterConfig.adminCode);
                stateDetected && setValue('state', stateDetected);

                // set city if have
                if (offerFilterConfig.cityName) {
                  const cities = await countryApi.getCities(countryDetected?.iso2, stateDetected?.adminCode);
                  setListCities(cities);
                  const cityDetected = cities.find(item => item.cityAscii === offerFilterConfig.cityName);
                  cityDetected && setValue('city', cityDetected);
                }
              }

              // auto set payment-app if config have
              if (offerFilterConfig.paymentApp) {
                const paymentAppDetected = LIST_PAYMENT_APP.find(item => item.name === offerFilterConfig.paymentApp);
                paymentAppDetected && setValue('paymentApp', paymentAppDetected?.name ?? '');
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
          <Typography style={{ fontSize: '20px', fontWeight: 'bold' }}>Select Payment-method</Typography>
        </DialogTitle>
        <DialogContent>
          <StyledFiatMethod>
            <Typography style={{ marginBottom: '12px' }} variant="h6">
              Payment-method
            </Typography>
            <div className="content">
              {paymenthods.map(item => {
                //take first 3 items of fiat
                if (item.id > 3) return;

                return (
                  <Button
                    key={item.id}
                    onClick={() => setSelectedOptionPaymentFiatCurrency(item.id)}
                    className={selectedOptionPaymentFiatCurrency === item.id ? 'active' : ''}
                    size="small"
                    color="inherit"
                    variant="outlined"
                  >
                    {item.name}
                  </Button>
                );
              })}
            </div>
          </StyledFiatMethod>
          {selectedOptionPaymentFiatCurrency === PAYMENT_METHOD.CASH_IN_PERSON && (
            <div className="filter-item">
              <Typography style={{ marginBottom: '15px' }} variant="h6">
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
              </div>
              {getValues('country') && getValues('state') && (
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

          {selectedOptionPaymentFiatCurrency === PAYMENT_METHOD.PAYMENT_APP && (
            <div className="filter-item">
              <Typography variant="h6">Select Payment-app</Typography>
              <Controller
                name="paymentApp"
                control={control}
                rules={{
                  validate: value => {
                    if (!value) return 'payment-app is required';

                    return true;
                  }
                }}
                render={({ field: { onChange, onBlur, value, ref } }) => (
                  <FormControlWithNativeSelect>
                    <InputLabel variant="outlined" htmlFor="select-paymentApp">
                      Payment-app
                    </InputLabel>
                    <NativeSelect
                      id="select-paymentApp"
                      value={value ?? ''}
                      onBlur={onBlur}
                      ref={ref}
                      onChange={e => {
                        onChange(e);
                      }}
                    >
                      <option aria-label="None" value="" />
                      {LIST_PAYMENT_APP.sort((a, b) => {
                        const nameA = a.name.toLowerCase();
                        const nameB = b.name.toLowerCase();
                        if (nameA < nameB) return -1;
                        if (nameA > nameB) return 1;

                        return 0;
                      }).map(item => {
                        return (
                          <option key={item.id} value={`${item.name}`}>
                            {item.name}
                          </option>
                        );
                      })}
                    </NativeSelect>
                    {errors && errors?.paymentApp && (
                      <FormHelperText error={true}>{errors.paymentApp.message as string}</FormHelperText>
                    )}
                  </FormControlWithNativeSelect>
                )}
              />
            </div>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            color="inherit"
            variant="contained"
            autoFocus
            onClick={() => {
              handleReset();
              props.onDismissModal!(false);
            }}
          >
            Reset
          </Button>
          <Button
            className="confirm-btn"
            color="info"
            variant="contained"
            onClick={handleSubmit(handleFilter)}
            autoFocus
          >
            Confirm
          </Button>
        </DialogActions>
      </StyledDialog>

      <FilterListModal
        isOpen={openCountryList}
        onDismissModal={value => setOpenCountryList(value)}
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
        onDismissModal={value => setOpenStateList(value)}
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
        onDismissModal={value => setOpenCityList(value)}
        setSelectedItem={value => {
          setValue('city', value);
          clearErrors('city');
        }}
      />
    </React.Fragment>
  );
};

export default FilterFiatPaymentMethodModal;
