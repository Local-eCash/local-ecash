'use client';
import TickerHeader from '@/src/components/TickerHeader/TickerHeader';
import {
  getAllPaymentMethods,
  getPaymenMethods,
  useSliceDispatch as useLixiSliceDispatch,
  useSliceSelector as useLixiSliceSelector
} from '@bcpros/redux-store';
import styled from '@emotion/styled';
import { LocationOn } from '@mui/icons-material';
import {
  Box,
  Button,
  Checkbox,
  FormControl,
  FormControlLabel,
  FormGroup,
  Grid,
  IconButton,
  TextField
} from '@mui/material';
import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';

const NewOfferWrap = styled.div`
  min-height: 100vh;
  background-image: url('/bg-dialog.svg');
  background-repeat: no-repeat;
  background-size: cover;
  padding-bottom: 56px;

  .offer-content {
    padding: 16px;
    .form-input {
      width: 100%;
    }
  }

  .create-offer-btn {
    width: 100%;
    text-transform: none;
    color: white;
    font-weight: 600;
    font-size: 16px;
    margin-top: 16px;
  }
`;

export default function NewOffer() {
  const {
    handleSubmit,
    formState: { errors },
    control,
    watch
  } = useForm({
    defaultValues: {
      amount: '',
      message: '',
      min: '',
      max: '',
      paymentMethods: ''
    }
  });
  const dispatch = useLixiSliceDispatch();
  // const { useCreateOfferMutation } = offerApi;
  const paymentMethods = useLixiSliceSelector(getAllPaymentMethods);

  //auto call paymentMethods
  useEffect(() => {
    if (paymentMethods.length === 0) dispatch(getPaymenMethods());
  }, [paymentMethods.length]);

  const handleCreateOffer = async data => {
    console.log('🚀 ~ handleCreateOffer ~ data:', data);
  };

  return (
    <NewOfferWrap>
      <TickerHeader title="Create new offer" />

      <div className="offer-content">
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Controller
              name="amount"
              control={control}
              rules={{
                required: {
                  value: true,
                  message: 'XEC amount is required!'
                },
                pattern: {
                  value: /^-?[0-9]\d*\.?\d*$/,
                  message: 'XEC amount is invalid!'
                },
                validate: value => {
                  if (parseFloat(value) < 0) return 'XEC amount must be greater than 0!';

                  return true;
                }
              }}
              render={({ field: { onChange, onBlur, value, name, ref } }) => (
                <FormControl fullWidth={true}>
                  <TextField
                    id="payment-amount"
                    label="XEC amount"
                    placeholder="Input amount"
                    onChange={onChange}
                    color="info"
                    onBlur={onBlur}
                    value={value}
                    name={name}
                    inputRef={ref}
                    error={errors.amount ? true : false}
                    helperText={errors.amount && (errors.amount?.message as string)}
                    variant="standard"
                  />
                </FormControl>
              )}
            />
          </Grid>
          <Grid item xs={12}>
            <Controller
              name="message"
              control={control}
              rules={{
                required: {
                  value: true,
                  message: 'Message is required!'
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
                    label="Message"
                    defaultValue="I want to buy 20M XEC in cash"
                    error={errors.message && true}
                    helperText={errors.message && (errors.message?.message as string)}
                    variant="standard"
                  />
                </FormControl>
              )}
            />
          </Grid>
          <Grid item xs={6}>
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

                  if (parseFloat(value) < 0) return 'Minimum amount must be greater than 0!';
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
                    label="Order limit (USD)"
                    placeholder="Min order limit (USD)"
                    error={errors.min && true}
                    helperText={errors.min && (errors.min?.message as string)}
                    variant="standard"
                  />
                </FormControl>
              )}
            />
          </Grid>
          <Grid item xs={1}>
            <h2 style={{ color: 'white' }}>to</h2>
          </Grid>
          <Grid item xs={5}>
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
                    placeholder="Max order limit (USD)"
                    error={errors.max && true}
                    helperText={errors.max && (errors.max?.message as string)}
                    variant="standard"
                  />
                </FormControl>
              )}
            />
          </Grid>
          <Grid item xs={10}>
            <TextField
              className="form-input"
              id="max"
              label="Location"
              defaultValue="Hoi an, Vietnam"
              // helperText="helper text here."
              variant="standard"
            />
          </Grid>
          <Grid item xs={2}>
            <IconButton>
              <LocationOn />
            </IconButton>
          </Grid>
        </Grid>

        <Box sx={{ display: 'flex', margin: '16px 0' }}>
          <FormGroup sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)' }}>
            {paymentMethods.map(method => (
              <FormControlLabel
                key={method.id}
                control={
                  <Controller
                    control={control}
                    name={`paymentMethods`} // TODO: fix this
                    render={({ field: props }) => (
                      <Checkbox {...props} checked={!!props.value} onChange={e => props.onChange(e.target.checked)} />
                    )}
                  />
                }
                label={method.name}
              />
            ))}
          </FormGroup>
          {/* <FormHelperText>Be careful</FormHelperText> */}
        </Box>

        {/* <Box>
          <Typography className="title" variant="body2">
            Payment currency (TBU) - available for Cash and bank transfer - single choice
          </Typography>
          <FormGroup sx={{ display: 'grid', gridTemplateColumns: '1fr' }}>
            <FormControlLabel control={<Radio name="payment" />} label="Payment app" />
            <FormControlLabel control={<Radio name="crypto" />} label="Crypto" />
            <FormControlLabel control={<Radio name="good" />} label="Good/Services" />
          </FormGroup>
          <FormHelperText>Be careful</FormHelperText>
        </Box> */}

        <Button className="create-offer-btn" variant="contained" color="info" onClick={handleSubmit(handleCreateOffer)}>
          Create offer
        </Button>
      </div>
    </NewOfferWrap>
  );
}
