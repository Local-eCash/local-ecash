'use client';

import { LIST_COIN } from '@/src/store/constants';
import { LIST_CURRENCIES_USED } from '@bcpros/lixi-models';
import {
  OfferFilterInput,
  getAllCountries,
  getAllPaymentMethods,
  getAllStates,
  getStates,
  saveOfferFilterConfig,
  useSliceDispatch as useLixiSliceDispatch,
  useSliceSelector as useLixiSliceSelector
} from '@bcpros/redux-store';
import styled from '@emotion/styled';
import { CloseOutlined } from '@mui/icons-material';
import {
  Autocomplete,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormHelperText,
  Grid,
  IconButton,
  Slide,
  TextField,
  Typography,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { TransitionProps } from '@mui/material/transitions';
import React, { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';

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

const FilterWrap = styled.div`
  .filter-item {
    border-bottom: 1px solid rgba(255, 255, 255, 0.2);
    padding: 20px 16px;

    &::last-of-type {
      border-bottom: 0;
    }

    &::first-of-type {
      padding-top: 0;
    }

    .content {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 8px;
      margin-top: 18px;
    }

    p {
      color: #79869b;
    }

    button {
      text-transform: math-auto;
      border-color: rgba(255, 255, 255, 0.2);

      &.active {
        border-color: rgba(255, 255, 255, 1);
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

  const {
    handleSubmit,
    control,
    reset,
    setValue,
    getValues,
    formState: { errors }
  } = useForm({
    defaultValues: {
      country: null,
      state: null,
      currency: null,
      coin: null
    }
  });
  const [selectedOptionsPayment, setSelectedOptionsPayment] = useState<number[]>([]);

  const dispatch = useLixiSliceDispatch();
  const paymenthods = useLixiSliceSelector(getAllPaymentMethods);
  const countries = useLixiSliceSelector(getAllCountries);
  const states = useLixiSliceSelector(getAllStates);

  const handleSelect = (id: number) => {
    const isSelected = !!selectedOptionsPayment.includes(id);
    //select before => drop select
    if (isSelected) {
      setSelectedOptionsPayment(pre => pre.filter(item => item !== id));
    } else {
      //select it
      setSelectedOptionsPayment(pre => [...pre, id]);
    }
  };

  const handleFilter = async data => {
    const { country, state, coin, currency } = data;

    const offerFilterInput: OfferFilterInput = {
      countryId: country && country.id,
      stateId: state && state.id,
      countryName: country && country.name,
      stateName: state && state.name,
      paymentMethodIds: selectedOptionsPayment,
      coin: coin && coin.ticker,
      fiatCurrency: currency && currency.code
    };

    dispatch(saveOfferFilterConfig(offerFilterInput));
    props.onDissmissModal!(false);
  };

  const handleReset = () => {
    reset();
    setSelectedOptionsPayment([]);
    const offerFilterInput: OfferFilterInput = {
      countryId: null,
      countryName: '',
      stateId: null,
      stateName: '',
      paymentMethodIds: [],
      coin: null,
      fiatCurrency: null
    };

    dispatch(saveOfferFilterConfig(offerFilterInput));
  };

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
            <Typography variant="body2">Payment method</Typography>
            <div className="content">
              {paymenthods.map(item => {
                return (
                  <Button
                    key={item.id}
                    onClick={() => handleSelect(item.id)}
                    className={selectedOptionsPayment.includes(item.id) ? 'active' : ''}
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
          <div className="filter-item">
            <Typography variant="body2">Fiat/Coin</Typography>
            <div className="content">
              <Grid item xs={6}>
                <Controller
                  name="currency"
                  control={control}
                  render={({ field: { onChange, onBlur, value, ref } }) => (
                    <FormControl fullWidth>
                      <Autocomplete
                        id="currency-select"
                        options={LIST_CURRENCIES_USED}
                        autoHighlight
                        getOptionLabel={option => (option ? `${option.name} (${option.code})` : '')}
                        value={value}
                        onBlur={onBlur}
                        ref={ref}
                        onChange={(e, value) => {
                          onChange(value);
                          setValue('coin', null);
                        }}
                        renderOption={(props, option) => {
                          const { ...optionProps } = props;

                          return (
                            <Box {...optionProps} key={option.code} component="li">
                              {option.name} ({option.code})
                            </Box>
                          );
                        }}
                        renderInput={params => <TextField {...params} label="Currency" />}
                      />
                      {errors && errors?.currency && (
                        <FormHelperText error={true}>{errors.currency.message as string}</FormHelperText>
                      )}
                    </FormControl>
                  )}
                />
              </Grid>
              <Grid item xs={6}>
                <Controller
                  name="coin"
                  control={control}
                  render={({ field: { onChange, onBlur, value, ref } }) => (
                    <FormControl fullWidth>
                      <Autocomplete
                        id="coin-select"
                        options={LIST_COIN}
                        autoHighlight
                        getOptionLabel={option => (option ? `${option.name} (${option.ticker})` : '')}
                        value={value}
                        onBlur={onBlur}
                        ref={ref}
                        onChange={(e, value) => {
                          onChange(value);
                          setValue('currency', null);
                        }}
                        renderOption={(props, option) => {
                          const { ...optionProps } = props;

                          return (
                            <Box {...optionProps} key={option.id} component="li">
                              {option.name} ({option.ticker})
                            </Box>
                          );
                        }}
                        renderInput={params => <TextField {...params} label="Coin" />}
                      />
                      {errors && errors?.coin && (
                        <FormHelperText error={true}>{errors.coin.message as string}</FormHelperText>
                      )}
                    </FormControl>
                  )}
                />
              </Grid>
            </div>
          </div>
          <div className="filter-item">
            <Typography variant="body2">Country/State</Typography>
            <div className="content">
              <Grid item xs={6}>
                <Controller
                  name="country"
                  control={control}
                  render={({ field: { onChange, value } }) => (
                    <FormControl fullWidth>
                      <Autocomplete
                        id="country-select"
                        options={countries}
                        autoHighlight
                        getOptionLabel={option => (option ? option.name : '')}
                        value={value}
                        onChange={(e, value) => {
                          onChange(value);
                          if (value) {
                            dispatch(getStates(value.id));
                            setValue('state', null);
                          }
                        }}
                        renderOption={(props, option) => {
                          const { ...optionProps } = props;

                          return (
                            <Box {...optionProps} key={option.id} component="li">
                              {option.name}
                            </Box>
                          );
                        }}
                        renderInput={params => <TextField {...params} label="Country" />}
                      />
                    </FormControl>
                  )}
                />
              </Grid>
              <Grid item xs={6}>
                <Controller
                  name="state"
                  control={control}
                  render={({ field: { onChange, value } }) => (
                    <FormControl fullWidth>
                      <Autocomplete
                        id="state-select"
                        options={states}
                        autoHighlight
                        getOptionLabel={option => (option ? option.name : '')}
                        value={value}
                        onChange={(e, value) => {
                          if (value) {
                            onChange(value);
                          }
                        }}
                        disabled={!getValues('country')}
                        renderOption={(props, option) => {
                          const { ...optionProps } = props;

                          return (
                            <Box {...optionProps} key={option.id} component="li">
                              {option.name}
                            </Box>
                          );
                        }}
                        renderInput={params => <TextField {...params} label="State" />}
                      />
                    </FormControl>
                  )}
                />
              </Grid>
            </div>
          </div>
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
    </StyledDialog>
  );
};

export default FilterOfferModal;
