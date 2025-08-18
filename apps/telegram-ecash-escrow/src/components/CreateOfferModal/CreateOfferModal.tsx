'use client';

import { COIN_OTHERS, COIN_USD_STABLECOIN_TICKER, LIST_COIN } from '@/src/store/constants';
import { LIST_PAYMENT_APP } from '@/src/store/constants/list-payment-app';
import { SettingContext } from '@/src/store/context/settingProvider';
import { formatNumber, getNumberFromFormatNumber } from '@/src/store/util';
import {
  COIN,
  Country,
  LIST_CURRENCIES_USED,
  Location,
  PAYMENT_METHOD,
  UpdateSettingCommand
} from '@bcpros/lixi-models';
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
  getCountries,
  getPaymentMethods,
  getSelectedAccountId,
  offerApi,
  settingApi,
  showToast,
  useSliceDispatch as useLixiSliceDispatch,
  useSliceSelector as useLixiSliceSelector
} from '@bcpros/redux-store';
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
  MenuItem,
  NativeSelect,
  Radio,
  RadioGroup,
  Select,
  Slide,
  TextField,
  Typography,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { TransitionProps } from '@mui/material/transitions';
import React, { useContext, useEffect, useRef, useState } from 'react';
import {
  Control,
  Controller,
  FieldErrors,
  UseFormClearErrors,
  UseFormGetValues,
  UseFormSetValue,
  useForm
} from 'react-hook-form';
import { NumericFormat } from 'react-number-format';
import FilterListLocationModal from '../FilterList/FilterListLocationModal';
import FilterListModal from '../FilterList/FilterListModal';
import { FormControlWithNativeSelect } from '../FilterOffer/FilterOfferModal';
import ConfirmOfferAnonymousModal from './ConfirmOfferAnonymousModal';

// Styled components
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

  '.heading': {
    fontSize: '18px',
    fontWeight: 'bold'
  },

  '.bold': {
    fontWeight: 'bold'
  },

  '.prefix, .label': {
    fontSize: '15px',
    color: theme.palette.text.secondary
  },

  '.label': {
    marginTop: '8px',
    marginBottom: '4px'
  },

  '.container-step1': {
    '.type-btn-group': {
      paddingTop: '0',
      button: {
        width: '50%',
        border: `1px solid ${theme.custom.borderPrimary}`,
        color: theme.custom.colorPrimary
      },
      '.type-buy-btn': {
        borderRadius: '8px 0 0 8px'
      },
      '.type-sell-btn': {
        borderRadius: '0 8px 8px 0'
      },
      '.inactive': {
        background: 'transparent'
      },
      '.active': {
        color: '#fff'
      }
    }
  },

  '.container-step2 .margin-component .MuiInputBase-root': {
    borderRadius: 0,
    '& .MuiInputBase-input': {
      textAlign: 'center'
    }
  },

  '.container-step2': {
    '.buy-offer-text-example': {
      fontSize: '13px',
      color: theme.custom.colorSecondary
    }
  },

  '.container-step3 .payment-wrap': {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '16px',

    '.payment-method, .payment-currency': {
      display: 'flex',
      flexDirection: 'column',
      gap: '0.5rem',

      button: {
        textTransform: 'none',
        color: theme.palette.common.white
      }
    }
  },

  '.back-btn': {
    padding: 0,
    position: 'absolute',
    left: '8px',
    top: '20px',
    borderRadius: '12px',

    svg: {
      fontSize: '32px'
    }
  },

  '.MuiDialogActions-root': {
    justifyContent: 'space-evenly',
    padding: '16px 16px 32px',

    button: {
      textTransform: 'none',
      width: '100%',
      '&.confirm-btn': {
        color: theme.palette.common.white
      }
    },

    '.button-group': {
      width: '100%',
      display: 'flex',
      gap: '7px'
    }
  },

  '.MuiButton-root': {
    color: '#fff'
  }
}));

const PercentInputWrap = styled('div')(({ theme }) => ({
  margin: '16px 0',
  display: 'grid',
  gridTemplateColumns: 'max-content 1fr max-content',
  borderRadius: '9px',
  border: `1px solid ${theme.palette.grey[500]}`,
  minHeight: '48px',

  '.btn-minus, .btn-plus': {
    width: '15%',
    borderRadius: 0,
    border: 0
  },

  '.btn-minus': {
    borderTopLeftRadius: '8px',
    borderBottomLeftRadius: '8px'
  },

  '.btn-plus': {
    borderTopRightRadius: '8px',
    borderBottomRightRadius: '8px'
  },

  input: {
    height: '36px'
  },

  fieldset: {
    border: '0 !important'
  }
}));

const OrderLimitWrap = styled('div')(() => ({
  paddingLeft: '16px',
  paddingTop: '16px',

  '.group-input': {
    display: 'grid',
    gridTemplateColumns: '1fr max-content 1fr',
    gap: '16px',
    alignItems: 'baseline'
  }
}));

// Types and interfaces
interface CreateOfferModalProps {
  offer?: OfferQueryItem;
  isEdit?: boolean;
  isFirstOffer?: boolean;
}

interface OfferFormValues {
  message: string;
  min: string;
  max: string;
  option: string | number;
  currency: string | null;
  paymentApp: string;
  coin: string | null;
  coinOthers: string;
  priceCoinOthers: number | null;
  percentage: number;
  note: string;
  country: Country | null;
  state: Location | null;
  city: Location | null;
}

interface FormControlProps {
  control: Control<OfferFormValues>;
  errors: FieldErrors<OfferFormValues>;
  getValues: UseFormGetValues<OfferFormValues>;
  setValue: UseFormSetValue<OfferFormValues>;
  clearErrors: UseFormClearErrors<OfferFormValues>;
}

// Helper components
const Transition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement;
  },
  ref: React.Ref<unknown>
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

// Main component
const CreateOfferModal: React.FC<CreateOfferModalProps> = props => {
  const { isEdit = false, offer, isFirstOffer = false } = props;
  const dispatch = useLixiSliceDispatch();
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));
  const dialogContentRef = useRef<HTMLDivElement>(null);

  // Context
  const settingContext = useContext(SettingContext);
  const { setSetting } = settingContext;

  // Redux selectors and API
  const selectedAccountId = useLixiSliceSelector(getSelectedAccountId);
  const paymentMethods = useLixiSliceSelector(getAllPaymentMethods);
  const countries = useLixiSliceSelector(getAllCountries);
  const { useCreateOfferMutation, useUpdateOfferMutation } = offerApi;
  const [createOfferTrigger] = useCreateOfferMutation();
  const [updateOfferTrigger] = useUpdateOfferMutation();

  // State for location data
  const [listStates, setListStates] = useState<Location[]>([]);
  const [listCities, setListCities] = useState<Location[]>([]);

  // UI state
  const [loading, setLoading] = useState(false);
  const [activeStep, setActiveStep] = useState(isEdit ? 2 : 1);
  const [coinCurrency, setCoinCurrency] = useState<string>(COIN.XEC);
  const [fixAmount, setFixAmount] = useState(1000);
  const [isBuyOffer, setIsBuyOffer] = useState(offer?.type ? offer?.type === OfferType.Buy : true);
  const [isHiddenOffer, setIsHiddenOffer] = useState(true);

  // Modal state
  const [openCountryList, setOpenCountryList] = useState(false);
  const [openStateList, setOpenStateList] = useState(false);
  const [openCityList, setOpenCityList] = useState(false);
  const [openConfirmAnonymousOffer, setOpenConfirmAnonymousOffer] = useState(false);

  // Form handling
  const {
    handleSubmit,
    control,
    watch,
    reset,
    setValue,
    getValues,
    clearErrors,
    formState: { errors }
  } = useForm<OfferFormValues>({
    defaultValues: {
      message: offer?.message ?? '',
      min: `${offer?.orderLimitMin ?? ''}`,
      max: `${offer?.orderLimitMax ?? ''}`,
      option: offer?.paymentMethods[0]?.paymentMethod.id ?? '',
      currency: offer?.localCurrency ?? null,
      paymentApp: '',
      coin: offer?.coinPayment ?? null,
      coinOthers: offer?.coinOthers ?? '',
      priceCoinOthers: offer?.priceCoinOthers ?? null,
      percentage: offer?.marginPercentage ?? 0,
      note: offer?.noteOffer ?? '',
      country: null,
      state: null,
      city: null
    },
    reValidateMode: 'onBlur'
  });

  // Watched form values
  const option = Number(watch('option'));
  const percentageValue = watch('percentage');
  const currencyValue = watch('currency');
  const coinValue = watch('coin');

  // Navigation handlers
  const handleNext = () => setActiveStep(prevStep => prevStep + 1);
  const handleBack = () => setActiveStep(prevStep => prevStep - 1);
  const handleCloseModal = () => {
    reset();
    dispatch(closeModal());
  };

  // Helper function to check if margin should be shown
  const showMarginComponent = () => option !== PAYMENT_METHOD.GOODS_SERVICES;

  // Handler for creating/updating offers
  const handleCreateOffer = async (data: OfferFormValues, isHidden: boolean) => {
    setLoading(true);
    const minNum = getNumberFromFormatNumber(data.min) || null;
    const maxNum = getNumberFromFormatNumber(data.max) || null;

    const input = {
      message: data.message,
      noteOffer: data.note,
      paymentMethodIds: [option],
      coinPayment: data?.coin ? data.coin.split(':')[0] : null,
      coinOthers: data?.coinOthers ? data.coinOthers : null,
      priceCoinOthers: data?.priceCoinOthers ? Number(data.priceCoinOthers) : 0,
      localCurrency: data?.currency ? data.currency.split(':')[0] : null,
      paymentApp: data?.paymentApp ? data.paymentApp : null,
      marginPercentage: Number(data?.percentage ?? 0),
      orderLimitMin: minNum,
      orderLimitMax: maxNum,
      locationId: data?.city?.id ?? null,
      hideFromHome: isHidden
    };

    // Just have location when paymentmethod is CASH_IN_PERSON
    if (option !== PAYMENT_METHOD.CASH_IN_PERSON) {
      input.locationId = null;
    }

    try {
      if (isEdit) {
        const inputUpdateOffer: UpdateOfferInput = {
          message: data.message,
          marginPercentage: Number(data.percentage),
          noteOffer: data.note,
          orderLimitMin: minNum,
          orderLimitMax: maxNum,
          priceCoinOthers: Number(data.priceCoinOthers),
          id: offer?.postId
        };
        await updateOfferTrigger({ input: inputUpdateOffer }).unwrap();
        dispatch(
          showToast('success', {
            message: 'Success',
            description: 'Offer updated successfully!'
          })
        );
      } else {
        const inputCreateOffer: CreateOfferInput = {
          ...input,
          price: '',
          coin: Coin.Xec,
          type: isBuyOffer ? OfferType.Buy : OfferType.Sell
        };
        await createOfferTrigger({ input: inputCreateOffer }).unwrap();
        dispatch(
          showToast('success', {
            message: 'Success',
            description: 'Offer created successfully!'
          })
        );
      }
    } catch (error) {
      console.error('Error creating/updating offer:', error);
      dispatch(
        showToast('error', {
          message: 'Error',
          description: `${isEdit ? 'Update' : 'Create'} offer failed!`
        })
      );
    }
  };

  // Main form submission handler
  const handleCreateUpdate = () => {
    // First offer scenario
    if (isFirstOffer && !isEdit) {
      setOpenConfirmAnonymousOffer(true);
      return;
    }

    // Determine whether offer should be hidden based on context
    const hiddenStatus = isEdit ? false : isHiddenOffer;
    handleSubmit(data => handleCreateOffer(data, hiddenStatus))();
  };

  // Margin adjustment handlers
  const handleIncrease = (value: number) => setValue('percentage', Math.min(30, value + 1));
  const handleDecrease = (value: number) => setValue('percentage', Math.max(0, value - 1));

  // Helper function for offer note placeholder text
  const getPlaceholderOfferNote = (): string => {
    switch (option) {
      case PAYMENT_METHOD.CASH_IN_PERSON:
        return 'A public note attached to your offer. For example: "Exchanging XEC to cash, only meeting in public places at daytime!"';
      case PAYMENT_METHOD.BANK_TRANSFER:
      case PAYMENT_METHOD.PAYMENT_APP:
        return 'A public note attached to your offer. For example: "Bank transfer in Vietnam only. Available from 9AM to 5PM workdays."';
      case PAYMENT_METHOD.CRYPTO:
        return 'A public note attached to your offer. For example: "Accepting USDT on TRX and ETH network."';
      case PAYMENT_METHOD.GOODS_SERVICES:
        return 'A public note attached to your offer. For example: "Exchanging XEC for a logo design. Send your proposal along with a proposed price.';
      default:
        return 'Input offer note';
    }
  };

  // Location detection
  const getLocation = async () => {
    if (!navigator.geolocation) {
      console.error('Geolocation is not supported by this browser.');
      return;
    }

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true });
      });

      const { latitude, longitude } = position.coords;
      const locations = await countryApi.getCoordinate(latitude.toString(), longitude.toString());

      if (locations.length > 0) {
        const countryDetected = countries.find(item => item.iso2 === locations[0].iso2);
        if (countryDetected) {
          setValue('country', countryDetected);
          const states = await countryApi.getStates(countryDetected?.iso2 ?? '');
          setListStates(states);

          // Set currency based on detected country
          const currencyDetected = LIST_CURRENCIES_USED.find(item => item.country === countryDetected?.iso2);
          if (currencyDetected) {
            setValue('currency', `${currencyDetected?.code}:${currencyDetected?.fixAmount}`);
          }
        }
      }
    } catch (error) {
      console.error('Geolocation error:', error);
    }
  };

  // Effect to get location on component mount
  useEffect(() => {
    if (isEdit && !offer?.locationId) return;
    getLocation();
  }, []);

  // Effect to update coinCurrency when related form values change
  useEffect(() => {
    const currency = currencyValue?.split(':')[0];
    const coin = coinValue?.split(':')[0];

    setCoinCurrency(currency ?? (coin?.includes(COIN_OTHERS) ? getValues('coinOthers') : coin) ?? COIN.XEC);
  }, [currencyValue, coinValue, getValues('coinOthers')]);

  // Effect to load payment methods and countries on component mount
  useEffect(() => {
    dispatch(getPaymentMethods());
    dispatch(getCountries());
  }, []);

  // UI Components for the steps
  const MarginComponent = () => (
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
        {errors?.percentage && <FormHelperText error={true}>{errors.percentage.message}</FormHelperText>}
        <Typography className="example-value" component="div">
          {isBuyOffer ? (
            <div>
              <span className="buy-offer-text-example">
                You will pay {percentageValue}% less than the market price for every XEC you buy
              </span>
              <br />
              <span className="bold">Example: </span> If you pay{' '}
              <span className="bold">
                {formatNumber(fixAmount)} {coinCurrency}
              </span>
              , you will receive{' '}
              <span className="bold">
                {formatNumber(fixAmount * (1 + percentageValue / 100))} {coinCurrency}
              </span>{' '}
              worth of <span className="bold">XEC</span> in return
            </div>
          ) : (
            <div>
              <span className="bold">Example: </span> If you sell <span className="bold">XEC</span> worth{' '}
              <span className="bold">
                {formatNumber(fixAmount)} {coinCurrency}
              </span>
              , you will receive{' '}
              <span className="bold">
                {formatNumber(fixAmount * (1 + percentageValue / 100))} {coinCurrency}
              </span>{' '}
              in return
            </div>
          )}
        </Typography>
      </div>
    </Grid>
  );

  // Step 1: Basic settings (type, payment method)
  const Step1Content = () => (
    <div className="container-step1">
      <Grid container spacing={2}>
        {/* Buy/Sell buttons */}
        <Grid item xs={12} className="type-btn-group">
          <Button
            className={`type-buy-btn ${isBuyOffer ? 'active' : 'inactive'}`}
            variant="contained"
            color="success"
            onClick={() => setIsBuyOffer(true)}
          >
            Buy
          </Button>
          <Button
            className={`type-sell-btn ${!isBuyOffer ? 'active' : 'inactive'}`}
            variant="contained"
            color="error"
            onClick={() => setIsBuyOffer(false)}
          >
            Sell
          </Button>
        </Grid>

        {/* Description */}
        <Grid item xs={12}>
          <Typography fontStyle={'italic'} className="heading" variant="body2">
            {isBuyOffer
              ? 'You are buying XEC. Your offer will be listed for users who want to SELL XEC.'
              : 'You are selling XEC. Your offer will be listed for users who want to BUY XEC.'}
          </Typography>
        </Grid>

        {/* Payment method */}
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
                message: 'Need to choose a payment method!'
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
                {paymentMethods.map(item => (
                  <div key={item.id}>
                    <FormControlLabel
                      checked={option === item.id}
                      value={item.id}
                      control={<Radio />}
                      label={item.name}
                    />
                  </div>
                ))}
              </RadioGroup>
            )}
          />
          {errors?.option && <FormHelperText error={true}>{errors.option.message}</FormHelperText>}
        </Grid>

        {/* Payment app specific fields - Only show when option is Bank transfer or Payment app */}
        {option != 0 && option < 4 && (
          <>
            {option === PAYMENT_METHOD.PAYMENT_APP && (
              <>
                <Grid item xs={12}>
                  <Typography variant="body2" className="label">
                    Select payment-app
                  </Typography>
                </Grid>
                <Grid item xs={12} style={{ paddingTop: 0 }}>
                  <Controller
                    name="paymentApp"
                    control={control}
                    rules={{
                      validate: value => (!value ? 'payment-app is required' : true)
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
                          }).map(item => (
                            <option key={item.id} value={`${item.name}`}>
                              {item.name}
                            </option>
                          ))}
                        </NativeSelect>
                        {errors?.paymentApp && (
                          <FormHelperText error={true}>{errors.paymentApp.message}</FormHelperText>
                        )}
                      </FormControlWithNativeSelect>
                    )}
                  />
                </Grid>
              </>
            )}

            {/* Currency selection for non-crypto options */}
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
                  validate: value => (!value ? 'Currency is required' : true)
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
                      }).map(item => (
                        <option key={item.code} value={`${item.code}:${item.fixAmount}`}>
                          {item.name} ({item.code})
                        </option>
                      ))}
                    </NativeSelect>
                    {errors?.currency && <FormHelperText error={true}>{errors.currency.message}</FormHelperText>}
                  </FormControlWithNativeSelect>
                )}
              />
            </Grid>
          </>
        )}

        {/* Crypto option */}
        {option == PAYMENT_METHOD.CRYPTO && (
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
                  validate: value => (!value ? 'Coin is required' : true)
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
                        if (item.ticker === 'XEC') return null;
                        return (
                          <option key={item.ticker} value={`${item.ticker}:${item.fixAmount}`}>
                            {item.name} {item.isDisplayTicker && `(${item.ticker})`}
                          </option>
                        );
                      })}
                    </NativeSelect>
                    {errors?.coin && <FormHelperText error={true}>{errors.coin.message}</FormHelperText>}
                  </FormControlWithNativeSelect>
                )}
              />
            </Grid>

            {/* Custom coin inputs */}
            {coinValue?.includes(COIN_OTHERS) && (
              <React.Fragment>
                <Grid item xs={12}>
                  <Controller
                    name="coinOthers"
                    control={control}
                    rules={{
                      required: {
                        value: true,
                        message: 'Ticker is required!'
                      }
                    }}
                    render={({ field: { onChange, onBlur, value, name, ref } }) => (
                      <FormControl style={{ width: '35%' }}>
                        <TextField
                          className="form-input"
                          onChange={onChange}
                          onBlur={onBlur}
                          value={value}
                          name={name}
                          inputRef={ref}
                          id="coinOthers"
                          label="Ticker"
                          error={!!errors.coinOthers}
                          helperText={errors.coinOthers?.message}
                          placeholder="E.g. PEPE"
                          variant="standard"
                          inputProps={{
                            maxLength: 12
                          }}
                        />
                      </FormControl>
                    )}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Controller
                    name="priceCoinOthers"
                    control={control}
                    rules={{
                      required: {
                        value: true,
                        message: 'Price is required!'
                      }
                    }}
                    render={({ field: { onChange, onBlur, value, name, ref } }) => (
                      <FormControl style={{ width: '35%' }}>
                        <NumericFormat
                          allowLeadingZeros={false}
                          allowNegative={false}
                          thousandSeparator={true}
                          decimalScale={8}
                          customInput={TextField}
                          onChange={onChange}
                          onBlur={onBlur}
                          value={value}
                          name={name}
                          inputRef={ref}
                          className="form-input"
                          id="priceCoinOthers"
                          label="Price"
                          placeholder={`E.g. 1`}
                          error={!!errors.priceCoinOthers}
                          helperText={errors.priceCoinOthers?.message}
                          variant="standard"
                          InputProps={{
                            endAdornment: 'USD'
                          }}
                        />
                      </FormControl>
                    )}
                  />
                </Grid>
              </React.Fragment>
            )}

            {/* USD stablecoins */}
            {coinValue?.includes(COIN_USD_STABLECOIN_TICKER) && (
              <Grid item xs={4}>
                <Controller
                  name="coinOthers"
                  control={control}
                  render={({ field: { onChange, onBlur, value, name, ref } }) => (
                    <FormControl fullWidth={true} variant="standard" error={!!errors.coinOthers}>
                      <InputLabel id="coinOthers-label">Ticker</InputLabel>
                      <Select
                        className="form-input"
                        onChange={onChange}
                        onBlur={onBlur}
                        value={value}
                        name={name}
                        inputRef={ref}
                        id="coinOthers"
                        labelId="coinOthers-label"
                        label="Ticker"
                      >
                        <MenuItem value="">None</MenuItem>
                        <MenuItem value="USDT">USDT</MenuItem>
                        <MenuItem value="USDC">USDC</MenuItem>
                      </Select>
                      {errors.coinOthers && <FormHelperText>{errors.coinOthers.message}</FormHelperText>}
                    </FormControl>
                  )}
                />
              </Grid>
            )}
          </>
        )}

        {/* Location fields for cash in person */}
        {option === PAYMENT_METHOD.CASH_IN_PERSON && (
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
                  validate: value => (!value ? 'Country is required' : true)
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
                    {errors?.country && <FormHelperText error={true}>{errors.country.message}</FormHelperText>}
                  </FormControl>
                )}
              />
            </Grid>

            <Grid item xs={6}>
              <Controller
                name="state"
                control={control}
                rules={{
                  validate: value => (!value ? 'State is required' : true)
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
                    {errors?.state && <FormHelperText error={true}>{errors.state.message}</FormHelperText>}
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
                    validate: value => (!value ? 'City is required' : true)
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
                        disabled={!getValues('country') || !getValues('state')}
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
                      {errors?.city && <FormHelperText error={true}>{errors.city.message}</FormHelperText>}
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

  // Step 2: Offer details
  const Step2Content = () => (
    <div className="container-step2">
      <Grid container spacing={2}>
        {/* Headline */}
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
                  error={!!errors.message}
                  helperText={errors.message?.message}
                  variant="standard"
                />
              </FormControl>
            )}
          />
        </Grid>

        {/* Margin */}
        {showMarginComponent() && <MarginComponent />}

        {/* Order limits */}
        <OrderLimitWrap>
          <Typography variant="body2" className="label">
            {`Order limit (${coinCurrency})`}
          </Typography>

          <div className="group-input">
            <Controller
              name="min"
              control={control}
              rules={{
                validate: value => {
                  const parseAmount = parseFloat(value.replace(/,/g, ''));
                  const max = parseFloat(getValues('max').replace(/,/g, ''));

                  if (parseAmount < 0) return 'Minimum amount must be greater than 0!';
                  if (parseAmount > max) return 'Minimum amount must be less than maximum amount!';

                  return true;
                }
              }}
              render={({ field: { onChange, onBlur, value, name, ref } }) => (
                <FormControl fullWidth={true}>
                  <NumericFormat
                    allowLeadingZeros={false}
                    allowNegative={false}
                    thousandSeparator={true}
                    decimalScale={2}
                    customInput={TextField}
                    onChange={onChange}
                    onBlur={onBlur}
                    value={value}
                    name={name}
                    inputRef={ref}
                    className="form-input"
                    id="min"
                    placeholder={`Min: e.g. ${formatNumber(fixAmount)} ${coinCurrency}`}
                    error={!!errors.min}
                    helperText={errors.min?.message}
                    variant="standard"
                  />
                </FormControl>
              )}
            />
            <Typography variant="h6">to</Typography>
            <Controller
              name="max"
              control={control}
              rules={{
                validate: value => {
                  const parseAmount = parseFloat(value.replace(/,/g, ''));
                  const min = parseFloat(getValues('min').replace(/,/g, ''));

                  if (parseAmount < 0) return 'Maximum amount must be greater than 0!';
                  if (parseAmount < min) return `Maximum amount must be greater than or equal to the minimum amount!`;

                  return true;
                }
              }}
              render={({ field: { onChange, onBlur, value, name, ref } }) => (
                <FormControl fullWidth={true}>
                  <NumericFormat
                    allowLeadingZeros={false}
                    allowNegative={false}
                    thousandSeparator={true}
                    decimalScale={2}
                    customInput={TextField}
                    onChange={onChange}
                    onBlur={onBlur}
                    value={value}
                    name={name}
                    inputRef={ref}
                    className="form-input"
                    id="max"
                    label=" "
                    placeholder={`Max: e.g. ${formatNumber(fixAmount)} ${coinCurrency}`}
                    error={!!errors.max}
                    helperText={errors.max?.message}
                    variant="standard"
                  />
                </FormControl>
              )}
            />
          </div>
        </OrderLimitWrap>

        {/* Offer note */}
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
                  onBlur={() => {
                    dialogContentRef.current.style.paddingBottom = '20px';
                    onBlur();
                  }}
                  value={value}
                  name={name}
                  inputRef={ref}
                  id="note"
                  placeholder={getPlaceholderOfferNote()}
                  variant="filled"
                  multiline
                  minRows={3}
                  maxRows={10}
                  onFocus={() => (dialogContentRef.current.style.paddingBottom = '40vh')}
                />
              </FormControl>
            )}
          />
        </Grid>
      </Grid>
    </div>
  );

  // Step 3: Review and confirmation
  const Step3Content = () => {
    const renderPricePreview = () => {
      if (isEdit) {
        return (
          <Grid item xs={12} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span>Price: </span>
            <Controller
              name="priceCoinOthers"
              control={control}
              rules={{
                required: {
                  value: true,
                  message: 'Price is required!'
                }
              }}
              render={({ field: { onChange, onBlur, value, name, ref } }) => (
                <FormControl style={{ width: '35%' }}>
                  <NumericFormat
                    allowLeadingZeros={false}
                    allowNegative={false}
                    thousandSeparator={true}
                    decimalScale={8}
                    customInput={TextField}
                    onChange={onChange}
                    onBlur={onBlur}
                    value={value}
                    name={name}
                    inputRef={ref}
                    className="form-input"
                    id="priceCoinOthers"
                    placeholder={`E.g. 1`}
                    error={!!errors.priceCoinOthers}
                    helperText={errors.priceCoinOthers?.message}
                    variant="standard"
                    InputProps={{
                      endAdornment: 'USD'
                    }}
                  />
                </FormControl>
              )}
            />
          </Grid>
        );
      } else {
        return (
          <Grid item xs={12}>
            <Typography variant="body1">
              <span className="prefix">Price: </span> {getValues('priceCoinOthers')} USD
            </Typography>
          </Grid>
        );
      }
    };

    return (
      <div className="container-step3">
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Typography fontStyle={'italic'} className="heading" variant="body1">
              {isBuyOffer ? '*You are buying XEC' : '*You are selling XEC'}
            </Typography>
          </Grid>

          {/* Offer visibility selection */}
          {!isEdit && (
            <Grid item xs={12} className="offer-type-wrap" style={{ marginTop: '0' }}>
              <RadioGroup value={isHiddenOffer} onChange={e => setIsHiddenOffer(e.target.value === 'true')}>
                <FormControlLabel
                  checked={isHiddenOffer === false}
                  value={false}
                  control={<Radio />}
                  label={`Listed: Your offer is listed on Marketplace and visible to everyone.`}
                />
                <FormControlLabel
                  checked={isHiddenOffer === true}
                  value={true}
                  control={<Radio />}
                  label={`Unlisted: Your offer is not listed on Marketplace. Only you can see it.`}
                />
              </RadioGroup>
            </Grid>
          )}

          {/* Location preview */}
          {option === PAYMENT_METHOD.CASH_IN_PERSON && (
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

          {/* Payment method and currency summary */}
          <Grid item xs={12}>
            <div className="payment-wrap">
              <div className="payment-method">
                <Typography>Payment method</Typography>
                <Button variant="outlined" color="success">
                  <Typography>{paymentMethods[Number(option ?? '1') - 1]?.name}</Typography>
                </Button>
              </div>
              <div className="payment-currency">
                <Typography>Payment currency</Typography>
                <Button variant="outlined" color="warning">
                  <Typography>{coinCurrency}</Typography>
                </Button>
              </div>
            </div>
          </Grid>

          {/* Payment app if applicable */}
          {getValues('paymentApp') && (
            <Grid item xs={12}>
              <Typography variant="body1">
                <span className="prefix">Payment-App: </span> {getValues('paymentApp')}
              </Typography>
            </Grid>
          )}

          {/* Headline */}
          <Grid item xs={12}>
            <Typography variant="body1">
              <span className="prefix">Headline: </span> {getValues('message')}
            </Typography>
          </Grid>

          {/* Margin */}
          {showMarginComponent() && (
            <Grid item xs={12}>
              <Typography variant="body1">
                <span className="prefix">Price: </span> {percentageValue}% on top of market price
              </Typography>
            </Grid>
          )}

          {/* Order limits */}
          {(getValues('min') || getValues('max')) && (
            <Grid item xs={12}>
              <Typography variant="body1">
                <span className="prefix">Order limit ({coinCurrency}): </span> {getValues('min')} {coinCurrency} -{' '}
                {getValues('max')} {coinCurrency}
              </Typography>
            </Grid>
          )}

          {/* Price for custom coins */}
          {getValues('priceCoinOthers') !== null && renderPricePreview()}

          {/* Offer note */}
          {getValues('note') && (
            <Grid item xs={12}>
              <Typography variant="body1">
                <span className="prefix">Offer note: </span> {getValues('note')}
              </Typography>
            </Grid>
          )}
        </Grid>
      </div>
    );
  };

  // Step mapping
  const stepContents = {
    stepContent1: <Step1Content />,
    stepContent2: <Step2Content />,
    stepContent3: <Step3Content />
  };

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
        <b>{isEdit ? 'Edit offer' : 'Create a new offer'}</b>
      </DialogTitle>
      <IconButton className="back-btn" onClick={handleCloseModal}>
        <Close />
      </IconButton>
      <DialogContent ref={dialogContentRef}>{stepContents[`stepContent${activeStep}`]}</DialogContent>
      <DialogActions>
        <div className="button-group">
          <Button
            className="button-back"
            variant="contained"
            onClick={handleBack}
            disabled={isEdit ? activeStep === 2 : activeStep === 1}
          >
            Back
          </Button>
          <Button
            className="button-create"
            variant="contained"
            color="success"
            onClick={activeStep !== 3 ? handleSubmit(handleNext) : handleCreateUpdate}
            disabled={loading}
          >
            {activeStep === 1 && 'Next'}
            {activeStep === 2 && 'Preview'}
            {activeStep === 3 && `${isEdit ? 'Update' : 'Create'} offer`}
          </Button>
        </div>
      </DialogActions>

      {/* Location selection modals */}
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

      {/* Anonymous offer confirmation */}
      <ConfirmOfferAnonymousModal
        isOpen={openConfirmAnonymousOffer}
        isLoading={loading}
        onDismissModal={value => setOpenConfirmAnonymousOffer(value)}
        createOffer={async (usePublicLocalUserName: boolean) => {
          const updateSettingCommand: UpdateSettingCommand = {
            accountId: selectedAccountId,
            usePublicLocalUserName
          };

          if (selectedAccountId) {
            const updatedSetting = await settingApi.updateSetting(updateSettingCommand);
            setSetting(updatedSetting);
          }

          handleSubmit(data => {
            handleCreateOffer(data, isHiddenOffer);
          })();
        }}
      />
    </StyledDialog>
  );
};

export default CreateOfferModal;
