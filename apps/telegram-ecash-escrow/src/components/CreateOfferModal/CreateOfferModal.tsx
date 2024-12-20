'use client';

import { LIST_COIN } from '@/src/store/constants';
import { LIST_CURRENCIES_USED, Location } from '@bcpros/lixi-models';
import {
  Coin,
  CreateOfferInput,
  OfferQueryItem,
  OfferType,
  UpdateOfferInput,
  closeModal,
  countryApi,
  getAllCountries,
  getAllPaymentMethods,
  offerApi,
  useSliceDispatch as useLixiSliceDispatch,
  useSliceSelector as useLixiSliceSelector
} from '@bcpros/redux-store';
import styled from '@emotion/styled';
import { Close } from '@mui/icons-material';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  FormHelperText,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  NativeSelect,
  Portal,
  Radio,
  RadioGroup,
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
import { FormControlWithNativeSelect } from '../FilterOfferModal/FilterOfferModal';
import CustomToast from '../Toast/CustomToast';

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

  .heading {
    font-size: 18px;
    font-weight: bold;
  }

  .bold {
    font-weight: bold;
  }

  .prefix {
    font-size: 15px;
    color: #79869b;
  }

  .label {
    color: #79869b;
    margin-top: 8px;
    margin-bottom: 4px;
  }

  .container-step2 {
    .margin-component {
      .MuiInputBase-root {
        border-radius: 0px !important;
        .MuiInputBase-input {
          text-align: center;
        }
      }
    }
  }

  .container-step3 {
    .payment-wrap {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;

      .payment-method,
      .payment-currency {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;

        button {
          text-transform: none;
          color: white;
        }
      }
    }
  }

  .back-btn {
    padding: 0;
    position: absolute;
    left: 8px;
    top: 20px;
    border-radius: 12px;

    svg {
      font-size: 32px;
    }
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
`;

const PercentInputWrap = styled.div`
  margin: 16px 0;
  display: grid;
  grid-template-columns: max-content 1fr max-content;
  border-radius: 9px;
  border: 1px solid gray;
  min-height: 48px;

  .btn-minus,
  .btn-plus {
    width: 15%;
    border-radius: 0;
    boder: 0;
  }

  .btn-minus {
    border-top-left-radius: 8px;
    border-bottom-left-radius: 8px;
  }

  .btn-plus {
    border-bottom-right-radius: 8px;
    border-top-right-radius: 8px;
  }

  input {
    height: 36px;
  }

  fieldset {
    border: 0 !important;
  }
`;

const OrderLimitWrap = styled.div`
  padding-left: 16px;
  padding-top: 16px;

  .group-input {
    display: grid;
    grid-template-columns: 1fr max-content 1fr;
    gap: 16px;
    align-items: baseline;
  }
`;

interface CreateOfferModalProps {
  offer?: OfferQueryItem;
  isEdit?: boolean;
}

const Transition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement;
  },
  ref: React.Ref<unknown>
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const CreateOfferModal: React.FC<CreateOfferModalProps> = props => {
  const { isEdit = false, offer } = props;

  const dispatch = useLixiSliceDispatch();
  const { useCreateOfferMutation, useUpdateOfferMutation } = offerApi;
  const [createOfferTrigger] = useCreateOfferMutation();
  const [updateOfferTrigger] = useUpdateOfferMutation();
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));

  const paymentMethods = useLixiSliceSelector(getAllPaymentMethods);
  const countries = useLixiSliceSelector(getAllCountries);
  const [listStates, setListStates] = useState<Location[]>([]);
  const [listCities, setListCities] = useState<Location[]>([]);

  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeStep, setActiveStep] = React.useState(isEdit ? 2 : 1);
  const [coinCurrency, setCoinCurrency] = useState('XEC');
  const [fixAmount, setFixAmount] = useState(1000);

  const [openCountryList, setOpenCountryList] = useState(false);
  const [openStateList, setOpenStateList] = useState(false);
  const [openCityList, setOpenCityList] = useState(false);

  const {
    handleSubmit,
    control,
    watch,
    reset,
    setValue,
    getValues,
    clearErrors,
    formState: { errors }
  } = useForm({
    defaultValues: {
      message: offer?.message ?? '',
      min: `${offer?.orderLimitMin ?? ''}`,
      max: `${offer?.orderLimitMax ?? ''}`,
      option: offer?.paymentMethods[0]?.paymentMethod.id ?? '',
      currency: null,
      coin: null,
      percentage: offer?.marginPercentage ?? 0,
      note: offer?.noteOffer ?? '',
      country: null,
      state: null,
      city: null
    }
  });

  const option = Number(watch('option'));
  const percentageValue = watch('percentage');
  const currencyValue = watch('currency');
  const coinValue = watch('coin');

  const handleNext = () => {
    setActiveStep(prevActiveStep => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep(prevActiveStep => prevActiveStep - 1);
  };

  const handleCreateOffer = async data => {
    setLoading(true);
    const minNum = parseFloat(data.min);
    const maxNum = parseFloat(data.max);
    const input = {
      message: data.message,
      noteOffer: data.note,
      paymentMethodIds: [option],
      coinPayment: data?.coin ? data.coin.split(':')[0] : null,
      localCurrency: data?.currency ? data.currency.split(':')[0] : null,
      marginPercentage: Number(data?.percentage ?? 0),
      orderLimitMin: minNum,
      orderLimitMax: maxNum,
      locationId: data?.city?.id ?? null
    };

    //Just have location when paymentmethods is 1 or 2
    if (option !== 1) {
      input.locationId = null;
    }

    if (isEdit) {
      let inputUpdateOffer: UpdateOfferInput = {
        message: data.message,
        marginPercentage: Number(data.percentage),
        noteOffer: data.note,
        orderLimitMin: minNum,
        orderLimitMax: maxNum,
        id: offer?.postId
      };
      await updateOfferTrigger({ input: inputUpdateOffer })
        .unwrap()
        .then(() => setSuccess(true))
        .catch(err => {
          setError(true);
        });
    } else {
      const inputCreateOffer: CreateOfferInput = {
        ...input,
        price: '',
        coin: Coin.Xec,
        type: OfferType.Sell
      };
      await createOfferTrigger({ input: inputCreateOffer })
        .unwrap()
        .then(() => setSuccess(true))
        .catch(err => {
          setError(true);
        });
    }
  };

  const handleIncrease = value => {
    setValue('percentage', Math.min(30, value + 1));
  };

  const handleDecrease = value => {
    setValue('percentage', Math.max(0, value - 1));
  };

  const handleCloseModal = () => {
    dispatch(closeModal());
  };

  const marginComponent = (
    <Grid item xs={12}>
      <div className="margin-component">
        <Typography variant="body2" className="label">
          Offer Margin
        </Typography>
        <Controller
          name="percentage"
          control={control}
          rules={{
            validate: value => {
              if (value > 30) return 'Margin is between 0 - 30%';
              return true;
            }
          }}
          render={({ field }) => (
            <PercentInputWrap>
              <Button variant="contained" className="btn-minus" onClick={() => handleDecrease(field.value)}>
                -
              </Button>

              <TextField
                {...field}
                type="number"
                variant="outlined"
                size="small"
                InputProps={{
                  endAdornment: <InputAdornment position="end">%</InputAdornment>,
                  inputProps: { min: 0 }
                }}
              />
              <Button variant="contained" className="btn-plus" onClick={() => handleIncrease(field.value)}>
                +
              </Button>
            </PercentInputWrap>
          )}
        />
        {errors && errors?.percentage && (
          <FormHelperText error={true}>{errors.percentage.message as string}</FormHelperText>
        )}
        <Typography className="example-value">
          <span className="bold">Example: </span> If you sell <span className="bold">XEC</span> worth{' '}
          <span className="bold">
            {Intl.NumberFormat('de-DE').format(fixAmount)} {coinCurrency}
          </span>
          , you will receive{' '}
          <span className="bold">
            {Intl.NumberFormat('de-DE').format(fixAmount * (1 + percentageValue / 100))} {coinCurrency}
          </span>{' '}
          in return
        </Typography>
      </div>
    </Grid>
  );

  const stepContent1 = (
    <div className="container-step1">
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Typography fontStyle={'italic'} className="heading" variant="body2">
            *You are selling XEC
          </Typography>
        </Grid>
        <Grid item xs={12}>
          <Typography variant="body2" className="label">
            Payment method
          </Typography>
          <Controller
            name="option"
            control={control}
            rules={{
              required: {
                value: true,
                message: 'Need to choose payment-method!'
              }
            }}
            render={({ field: { onChange, onBlur, value, ref } }) => (
              <RadioGroup
                style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', columnGap: '16px' }}
                value={value}
                onChange={e => {
                  if (e.target.value === '5') {
                    setValue('percentage', 0);
                    setValue('coin', null);
                    setValue('currency', null);
                  }
                  onChange(e);
                }}
                onBlur={onBlur}
                ref={ref}
              >
                {paymentMethods.map(item => {
                  return (
                    <div key={item.id}>
                      <FormControlLabel
                        checked={option === item.id}
                        value={item.id}
                        control={<Radio />}
                        label={item.name}
                      />
                    </div>
                  );
                })}
              </RadioGroup>
            )}
          />
          {errors && errors?.option && <FormHelperText error={true}>{errors.option.message as string}</FormHelperText>}
        </Grid>

        {option != 0 && option < 4 && (
          <>
            <Grid item xs={12}>
              <Typography variant="body2" className="label">
                Select currency
              </Typography>
            </Grid>
            <Grid item xs={12} style={{ paddingTop: 0 }}>
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
                        setFixAmount(Number(e?.target?.value?.split(':')[1]));
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
                          <option key={item.code} value={`${item.code}:${item.fixAmount}`}>
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
          </>
        )}
        {option == 4 && (
          <>
            <Grid item xs={12}>
              <Typography variant="body2" className="label">
                Select coin
              </Typography>
            </Grid>
            <Grid item xs={12} style={{ paddingTop: 0 }}>
              <Controller
                name="coin"
                control={control}
                rules={{
                  validate: value => {
                    // if (!value && !coinState) return 'Coin is required';
                    if (!value) return 'Coin is required';

                    return true;
                  }
                }}
                render={({ field: { onChange, onBlur, value, ref } }) => (
                  <FormControlWithNativeSelect>
                    <InputLabel variant="outlined" htmlFor="select-currency">
                      Coin
                    </InputLabel>
                    <NativeSelect
                      id="select-coin"
                      value={value ?? ''}
                      onBlur={onBlur}
                      ref={ref}
                      onChange={e => {
                        onChange(e);
                        setFixAmount(Number(e?.target?.value?.split(':')[1]));
                        setValue('currency', null);
                      }}
                    >
                      <option aria-label="None" value="" />
                      {LIST_COIN.map(item => {
                        if (item.ticker === 'XEC') return;
                        return (
                          <option key={item.ticker} value={`${item.ticker}:${item.fixAmount}`}>
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
          </>
        )}
        {option === 1 && (
          <>
            <Grid item xs={12}>
              <Typography variant="body2" className="label">
                Location
              </Typography>
            </Grid>

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
                      label={option === 1 ? 'Country' : ''}
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
                rules={{
                  validate: value => {
                    if (!value) return 'State is required';

                    return true;
                  }
                }}
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
                    {errors && errors?.state && (
                      <FormHelperText error={true}>{errors.state.message as string}</FormHelperText>
                    )}
                  </FormControl>
                )}
              />
            </Grid>

            {getValues('country') && getValues('state') && (
              <Grid item xs={12}>
                <Controller
                  name="city"
                  control={control}
                  rules={{
                    validate: value => {
                      if (!value) return 'City is required';

                      return true;
                    }
                  }}
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
          </>
        )}
      </Grid>
    </div>
  );

  const stepContent2 = (
    <div className="container-step2">
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Controller
            name="message"
            control={control}
            rules={{
              required: {
                value: true,
                message: 'Headline is required!'
              }
            }}
            render={({ field: { onChange, onBlur, value, name, ref } }) => (
              <FormControl fullWidth={true}>
                <TextField
                  className="form-input"
                  onChange={onChange}
                  onBlur={onBlur}
                  value={value}
                  name={name}
                  inputRef={ref}
                  id="message"
                  label="Headline"
                  error={errors.message && true}
                  helperText={errors.message && (errors.message?.message as string)}
                  variant="standard"
                />
              </FormControl>
            )}
          />
        </Grid>
        {option !== 5 && marginComponent}
        <OrderLimitWrap>
          <Typography variant="body2" className="label">
            {`Order limit (${coinCurrency})`}
          </Typography>

          <div className="group-input">
            <Controller
              name="min"
              control={control}
              rules={{
                required: {
                  value: true,
                  message: 'Minimum is required!'
                },
                pattern: {
                  value: /^-?[0-9]\d*\.?\d*$/,
                  message: 'Minimum amount is invalid!'
                },
                validate: value => {
                  const max = parseFloat(watch('max'));
                  if (parseFloat(value) >= max) return 'Minimum amount must be less than maximum amount!';

                  return true;
                }
              }}
              render={({ field: { onChange, onBlur, value, name, ref } }) => (
                <FormControl fullWidth={true}>
                  <TextField
                    onChange={onChange}
                    onBlur={onBlur}
                    value={value}
                    type="number"
                    name={name}
                    inputRef={ref}
                    className="form-input"
                    id="min"
                    placeholder={`Min (${coinCurrency})`}
                    error={errors.min && true}
                    helperText={errors.min && (errors.min?.message as string)}
                    variant="standard"
                  />
                </FormControl>
              )}
            />
            <Typography variant="h6" style={{ color: 'white' }}>
              to
            </Typography>
            <Controller
              name="max"
              control={control}
              rules={{
                required: {
                  value: true,
                  message: 'Maximum is required!'
                },
                pattern: {
                  value: /^-?[0-9]\d*\.?\d*$/,
                  message: 'Maximum amount is invalid!'
                },
                validate: value => {
                  const min = parseFloat(watch('min'));

                  if (parseFloat(value) < 0) return 'Maximum amount must be greater than 0!';
                  if (parseFloat(value) <= min) return 'Maximum amount must be greater than minimum amount!';

                  return true;
                }
              }}
              render={({ field: { onChange, onBlur, value, name, ref } }) => (
                <FormControl fullWidth={true}>
                  <TextField
                    onChange={onChange}
                    onBlur={onBlur}
                    value={value}
                    name={name}
                    type="number"
                    inputRef={ref}
                    className="form-input"
                    id="max"
                    label=" "
                    placeholder={`Max (${coinCurrency})`}
                    error={errors.max && true}
                    helperText={errors.max && (errors.max?.message as string)}
                    variant="standard"
                  />
                </FormControl>
              )}
            />
          </div>
        </OrderLimitWrap>
        <Grid item xs={12}>
          <Controller
            name="note"
            control={control}
            render={({ field: { onChange, onBlur, value, name, ref } }) => (
              <FormControl fullWidth={true}>
                <Typography className="label" variant="body2">
                  Offer note
                </Typography>
                <TextField
                  style={{ marginTop: '16px' }}
                  className="form-input"
                  onChange={onChange}
                  onBlur={onBlur}
                  value={value}
                  name={name}
                  inputRef={ref}
                  id="note"
                  placeholder="Input offer note..."
                  variant="filled"
                  multiline
                  minRows={3}
                  maxRows={10}
                />
              </FormControl>
            )}
          />
        </Grid>
      </Grid>
    </div>
  );

  const stepContent3 = (
    <div className="container-step3">
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Typography fontStyle={'italic'} className="heading" variant="body1">
            *You are selling XEC
          </Typography>
        </Grid>
        {option === 1 && (
          <Grid item xs={12}>
            <Typography variant="body1">
              <span className="prefix">Location: </span>
              {offer?.location
                ? [offer?.location?.cityAscii, offer?.location?.adminNameAscii, offer?.location?.country]
                    .filter(Boolean)
                    .join(', ')
                : [getValues('city')?.cityAscii, getValues('city')?.adminNameAscii, getValues('city')?.country]
                    .filter(Boolean)
                    .join(', ')}
            </Typography>
          </Grid>
        )}
        <Grid item xs={12}>
          <div className="payment-wrap">
            <div className="payment-method">
              <Typography>Payment method</Typography>
              <Button variant="contained" color="success">
                {paymentMethods[Number(option ?? '1') - 1]?.name}
              </Button>
            </div>
            <div className="payment-currency">
              <Typography>Payment currency</Typography>
              <Button variant="contained" color="warning">
                {coinCurrency}
              </Button>
            </div>
          </div>
        </Grid>
        <Grid item xs={12}>
          <Typography variant="body1">
            <span className="prefix">Headline: </span> {getValues('message')}
          </Typography>
        </Grid>
        {option !== 5 && (
          <Grid item xs={12}>
            <Typography variant="body1">
              <span className="prefix">Price: </span> {percentageValue}% on top of market price
            </Typography>
          </Grid>
        )}
        <Grid item xs={12}>
          <Typography variant="body1">
            <span className="prefix">Order limit ({coinCurrency}): </span> {getValues('min')} {coinCurrency} -{' '}
            {getValues('max')} {coinCurrency}
          </Typography>
        </Grid>
        <Grid item xs={12}>
          <Typography variant="body1">
            <span className="prefix">Offer note: </span> {getValues('note')}
          </Typography>
        </Grid>
      </Grid>
    </div>
  );

  const stepContents = {
    stepContent1: stepContent1,
    stepContent2: stepContent2,
    stepContent3: stepContent3
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
              const countryDetected = countries.find(item => item.iso2 === locations[0].iso2);
              setValue('country', countryDetected);
              const states = await countryApi.getStates(countryDetected?.iso2 ?? '');
              setListStates(states);
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
    if (isEdit && !offer?.locationId) return;
    getLocation();
  }, []);

  useEffect(() => {
    const currency = currencyValue?.split(':')[0];
    const coin = coinValue?.split(':')[0];
    setCoinCurrency(currency ?? coin ?? 'XEC');
  }, [currencyValue, coinValue]);

  return (
    <StyledDialog
      fullScreen={fullScreen}
      open={true}
      onClose={() => {
        reset();
        handleCloseModal();
      }}
      TransitionComponent={Transition}
    >
      <DialogTitle textAlign={'center'}>
        <b>{isEdit ? 'Edit offer' : 'Create a new sell offer'}</b>
      </DialogTitle>
      <IconButton className="back-btn" onClick={() => handleCloseModal()}>
        <Close />
      </IconButton>
      <DialogContent>{stepContents[`stepContent${activeStep}`]}</DialogContent>
      <DialogActions>
        <Button
          variant="contained"
          onClick={() => handleBack()}
          disabled={isEdit ? activeStep === 2 : activeStep === 1}
        >
          Back
        </Button>
        <Button
          variant="contained"
          color="success"
          onClick={activeStep !== 3 ? handleSubmit(handleNext) : handleSubmit(handleCreateOffer)}
          disabled={loading}
        >
          {activeStep === 1 && 'Next'}
          {activeStep === 2 && 'Preview'}
          {activeStep === 3 && `${isEdit ? 'Update' : 'Create'} offer`}
        </Button>
      </DialogActions>

      <Portal>
        <CustomToast
          isOpen={success}
          handleClose={() => {
            reset();
            setLoading(false);
            setActiveStep(1);
            setSuccess(false);
            handleCloseModal();
          }}
          content={`Offer ${isEdit ? 'updated' : 'created'} successfully`}
          type="success"
          autoHideDuration={3000}
        />
        <CustomToast
          isOpen={error}
          handleClose={() => {
            setError(false);
          }}
          content={`${isEdit ? 'Update' : 'Create'} offer failed!`}
          type="error"
          autoHideDuration={3000}
        />
      </Portal>
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

export default CreateOfferModal;
