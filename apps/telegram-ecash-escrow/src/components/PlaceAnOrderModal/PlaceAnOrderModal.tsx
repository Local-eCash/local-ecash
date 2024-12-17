'use client';

import { UtxoContext } from '@/src/store/context/utxoProvider';
import { buyerDepositFee, Escrow, splitUtxos } from '@/src/store/escrow';
import { convertXECToSatoshi, estimatedFee } from '@/src/store/util';
import { COIN, coinInfo, CreateEscrowOrderInput } from '@bcpros/lixi-models';
import {
  closeModal,
  convertEscrowScriptHashToEcashAddress,
  escrowOrderApi,
  fiatCurrencyApi,
  getSelectedWalletPath,
  parseCashAddressToPrefix,
  PostQueryItem,
  showToast,
  useSliceDispatch as useLixiSliceDispatch,
  useSliceSelector as useLixiSliceSelector,
  UtxoInNodeInput,
  WalletContextNode
} from '@bcpros/redux-store';
import styled from '@emotion/styled';
import { ChevronLeft } from '@mui/icons-material';
import {
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Grid,
  IconButton,
  Radio,
  RadioGroup,
  Slide,
  TextField,
  Typography,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { TransitionProps } from '@mui/material/transitions';
import { fromHex, Script, shaRmd160 } from 'ecash-lib';
import _ from 'lodash';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import React, { useContext, useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import QRCode from '../QRcode/QRcode';
import CustomToast from '../Toast/CustomToast';

interface PlaceAnOrderModalProps {
  isOpen: boolean;
  post: any;
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
    text-align: center;
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

  .back-btn {
    padding: 0;
    position: absolute;
    left: 8px;
    top: 20px;
    // border: 1px solid rgba(255, 255, 255, 0.3);
    border-radius: 12px;

    svg {
      font-size: 32px;
    }
  }

  .offer-info {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.6);
    padding: 16px;

    &:before {
      position: absolute;
      content: '';
      width: 4px;
      height: 33px;
      background: #2bb6f6;
      border-top-right-radius: 16px;
      border-bottom-right-radius: 16px;
      filter: drop-shadow(0 0 3px #2bb6f6);
    }

    span {
      margin-left: 16px;
    }
  }
`;

const PlaceAnOrderWrap = styled.div`
  padding: 16px;

  .form-input {
    width: 100%;
  }

  .payment-method-wrap {
    display: flex;
    flex-direction: row;
    gap: 16px;
    justify-content: space-between;
    margin: 16px 0;

    .MuiFormControlLabel-root {
      .MuiTypography-root {
        font-size: 14px;
      }
    }
  }

  .disclaim-wrap {
    .lable {
      text-align: center;
      border-bottom: 1px solid rgba(255, 255, 255, 0.2);
      padding-bottom: 12px;
      margin-bottom: 16px;
      color: rgba(255, 255, 255, 0.5);
    }

    .title {
      font-size: 13px;
    }

    .MuiFormControlLabel-label {
      font-size: 14px;
    }
  }

  .deposit-wrap {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    margin-top: 16px;

    .deposit-info {
      align-self: center;

      p {
        &::first-of-type {
          margin-bottom: 6px;
        }

        &.deposit-status {
          color: #66bb6a;
        }
      }
    }

    .address-code {
      .qr-code {
        padding: 0;
        svg {
          width: 100%;
          height: 100%;
        }
      }
    }

    .address-string {
      border-radius: 12px;
      border: 1px solid rgba(255, 255, 255, 0.2);
      padding: 2px 12px;
      text-align: center;
      grid-column-start: 1;
      grid-column-end: 4;

      button {
        svg {
          font-size: 21px;
        }
      }
    }
  }
  .text-receive-amount {
    margin-top: 10px;
    .amount-receive {
      font-weight: bold;
    }
  }
`;

const Transition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement;
  },
  ref: React.Ref<unknown>
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const PlaceAnOrderModal: React.FC<PlaceAnOrderModalProps> = props => {
  const theme = useTheme();
  const router = useRouter();
  const dispatch = useLixiSliceDispatch();
  const { post }: { post: PostQueryItem } = props;
  const { data } = useSession();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));
  const Wallet = useContext(WalletContextNode);
  const { totalValidAmount, totalValidUtxos } = useContext(UtxoContext);
  const { chronik, XPI } = Wallet;

  const [arbiDataError, setArbiDataError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [rateData, setRateData] = useState(null);
  const [amountXEC, setAmountXEC] = useState(0);
  const [textAmountPer1MXEC, setTextAmountPer1MXEC] = useState('');
  const [escrowScript, setEscrowScript] = useState<Escrow>(null);
  const [nonce, setNonce] = useState<string>(null);
  const selectedWalletPath = useLixiSliceSelector(getSelectedWalletPath);

  const { useCreateEscrowOrderMutation, useGetModeratorAccountQuery, useGetRandomArbitratorAccountQuery } =
    escrowOrderApi;
  const [createOrderTrigger] = useCreateEscrowOrderMutation();

  const { currentData: moderatorCurrentData, isError: moderatorIsError } = useGetModeratorAccountQuery(
    {},
    { skip: !data }
  );
  const { currentData: arbitratorCurrentData, isError: arbitratorIsError } = useGetRandomArbitratorAccountQuery(
    {},
    { skip: !data }
  );

  const { useGetFiatRateQuery } = fiatCurrencyApi;
  const { data: fiatData } = useGetFiatRateQuery();

  const {
    handleSubmit,
    formState: { errors },
    setError: setErrorForm,
    clearErrors,
    control,
    trigger,
    watch
  } = useForm();

  const amountValue = watch('amount');
  const isBuyerDeposit = watch('isDepositFee');

  const calEscrowScript = () => {
    const sellerPk = fromHex(post.account.publicKey);
    const buyerPk = fromHex(selectedWalletPath?.publicKey ?? '');
    const arbitratorPk = fromHex(arbitratorCurrentData?.getRandomArbitratorAccount?.publicKey ?? '');
    const moderatorPk = fromHex(moderatorCurrentData?.getModeratorAccount?.publicKey ?? '');

    const nonce = Math.floor(Date.now() / 1000).toString();

    const escrowScript = new Escrow({
      sellerPk,
      buyerPk,
      arbiPk: arbitratorPk,
      modPk: moderatorPk,
      nonce
    });
    setEscrowScript(escrowScript);
    setNonce(nonce);
  };

  const handleCreateEscrowOrder = async data => {
    setLoading(true);
    if (moderatorIsError || arbitratorIsError) {
      setArbiDataError(true);

      return;
    }

    const { amount, message, isDepositFee }: { amount: string; message: string; isDepositFee: boolean } = data;
    const sellerId = post.accountId;
    const moderatorId = moderatorCurrentData.getModeratorAccount.id;
    const arbitratorId = arbitratorCurrentData.getRandomArbitratorAccount.id;

    const buyerPk = fromHex(selectedWalletPath?.publicKey);
    const buyerSk = fromHex(selectedWalletPath?.privateKey);

    try {
      const scriptSmartContract = escrowScript.script();

      //split utxos is here and broadcast. Then build tx
      let hexTxBuyerDeposit = null;
      let foundUtxo: UtxoInNodeInput;
      const depositFeeSats = convertXECToSatoshi(calDisputeFee);

      const utxosToSplit = [];
      let totalAmount = 0;
      for (let i = 0; i < totalValidUtxos.length; i++) {
        totalAmount += totalValidUtxos[i].value;
        utxosToSplit.push(totalValidUtxos[i]);
        const feeSats =
          XPI.BitcoinCash.getByteCount({ P2PKH: utxosToSplit.length }, { P2PKH: 2 }) * coinInfo[COIN.XEC].defaultFee;
        if (totalAmount >= depositFeeSats + feeSats) break;
      }

      if (isDepositFee) {
        const txBuildSplitUtxo = splitUtxos(utxosToSplit, buyerSk, buyerPk, depositFeeSats);
        const txidSplit = (await chronik.broadcastTx(txBuildSplitUtxo)).txid;

        if (txidSplit) {
          foundUtxo = {
            txid: txidSplit,
            outIdx: 0,
            value: depositFeeSats
          };
        }
        if (!foundUtxo) throw new Error('No suitable UTXO found!');

        const totalAmountEscrow =
          Number(amountXEC) +
          calDisputeFee * 2 +
          estimatedFee(Buffer.from(scriptSmartContract.bytecode).toString('hex'));
        const scriptEscrow = new Script(scriptSmartContract.bytecode);
        hexTxBuyerDeposit = buyerDepositFee(foundUtxo, buyerSk, buyerPk, totalAmountEscrow, scriptEscrow);
      }

      const escrowAddress = convertEscrowScriptHashToEcashAddress(shaRmd160(escrowScript.script().bytecode));

      const data: CreateEscrowOrderInput = {
        amount: amountXEC,
        amountCoinOrCurrency: parseFloat(amount),
        sellerId,
        arbitratorId,
        moderatorId,
        escrowAddress,
        nonce,
        escrowScript: Buffer.from(escrowScript.script().bytecode).toString('hex'),
        price: textAmountPer1MXEC,
        paymentMethodId: post.postOffer.paymentMethods[0].paymentMethod.id,
        postId: post.id,
        message: message,
        buyerDepositTx: hexTxBuyerDeposit,
        utxoInProcess: foundUtxo
      };

      const result = await createOrderTrigger({ input: data }).unwrap();

      dispatch(
        showToast('success', {
          message: 'Success',
          description: 'Create order successfully!'
        })
      );
      handleCloseModal();
      router.push(`/order-detail?id=${result.createEscrowOrder.id}`);
    } catch (e) {
      console.log(e);
      setError(true);
    }
    setLoading(false);
  };

  const calDisputeFee = useMemo(() => {
    const fee1Percent = parseFloat((Number(amountXEC || 0) / 100).toFixed(2));
    const dustXEC = coinInfo[COIN.XEC].dustSats / Math.pow(10, coinInfo[COIN.XEC].cashDecimals);

    return Math.max(fee1Percent, dustXEC);
  }, [amountXEC]);

  const checkBuyerEnoughFund = () => {
    return totalValidAmount > calDisputeFee;
  };

  const InfoEscrow = () => {
    const fee1Percent = calDisputeFee;
    const totalBalanceFormat = totalValidAmount.toLocaleString('de-DE');

    return (
      <div style={{ color: 'white' }}>
        <p>
          Your wallet: {totalBalanceFormat} {COIN.XEC}
        </p>
        <p>
          Dispute fee (1%): {fee1Percent.toLocaleString('de-DE')} {COIN.XEC}
        </p>
      </div>
    );
  };

  const convertToAmountXEC = async () => {
    if (!rateData) return 0;
    let amountXEC = 0;
    let amountCoinOrCurrency = 0;
    let textAmountPer1MXEC = 1000000;
    //if payment is crypto, we convert from coin => USD => XEC
    if (post?.postOffer?.coinPayment) {
      const coinPayment = post.postOffer.coinPayment.toLowerCase();
      const rateArrayCoin = rateData.find(item => item.coin === coinPayment);
      const rateArrayXec = rateData.find(item => item.coin === 'xec');
      const latestRateCoin = rateArrayCoin?.rates?.reduce((max, item) => (item.ts > max.ts ? item : max));
      const latestRateXec = rateArrayXec?.rates?.reduce((max, item) => (item.ts > max.ts ? item : max));
      const rateCoinPerXec = latestRateCoin?.rate / latestRateXec?.rate;
      amountXEC = Number(amountValue ?? '0') * rateCoinPerXec;
      amountCoinOrCurrency = (latestRateXec?.rate * textAmountPer1MXEC) / latestRateCoin?.rate;
    } else {
      //convert from currency to XEC
      const rateArrayXec = rateData.find(item => item.coin === 'xec');
      const latestRateXec = rateArrayXec?.rates?.reduce((max, item) => (item.ts > max.ts ? item : max));
      amountXEC = Number(amountValue ?? '0') / latestRateXec?.rate;
      amountCoinOrCurrency = textAmountPer1MXEC * latestRateXec?.rate;
    }

    //set amount XEC (minus fee network, withdraw fee, margin amount)
    const feeSats = XPI.BitcoinCash.getByteCount({ P2PKH: 5 }, { P2PKH: 1, P2SH: 1 }) * coinInfo[COIN.XEC].defaultFee; // assume worst case input is 5, because we estimate from buyer, so we don't know input of seller
    const feeAmount = parseFloat((feeSats / Math.pow(10, coinInfo[COIN.XEC].cashDecimals)).toFixed(2));
    const feeWithdraw = estimatedFee(Buffer.from(escrowScript.script().bytecode).toString('hex'));
    const amountMargin = (amountXEC * post.postOffer.marginPercentage) / 100;

    amountXEC = amountXEC - amountMargin - feeAmount - feeWithdraw;
    const amountXecRounded = parseFloat(amountXEC.toFixed(2));
    if (amountXecRounded > 5.46) {
      clearErrors('amount');
    }
    amountXecRounded > 0 ? setAmountXEC(amountXecRounded) : setAmountXEC(0);

    const compactNumberFormatter = new Intl.NumberFormat('en-GB', {
      notation: 'compact',
      compactDisplay: 'short',
      maximumFractionDigits: 2
    });

    const amountWithPercentage = amountCoinOrCurrency * (1 + post?.postOffer?.marginPercentage / 100);
    const amountFormatted =
      amountWithPercentage < 1 ? amountWithPercentage.toFixed(5) : compactNumberFormatter.format(amountWithPercentage);
    setTextAmountPer1MXEC(
      `${amountFormatted} ${post.postOffer.coinPayment ?? post.postOffer.localCurrency ?? 'XEC'} / 1M XEC`
    );
  };

  const handleCloseModal = () => {
    dispatch(closeModal());
  };

  //cal escrow script
  useEffect(() => {
    calEscrowScript();
  }, [
    post.account.publicKey,
    selectedWalletPath?.publicKey,
    arbitratorCurrentData?.getRandomArbitratorAccount?.publicKey,
    moderatorCurrentData?.getModeratorAccount?.publicKey
  ]);

  //convert to XEC
  useEffect(() => {
    if (post.postOffer.paymentMethods[0]?.paymentMethod?.id !== 5) {
      convertToAmountXEC();
    } else {
      setAmountXEC(Number(amountValue) ?? 0);
    }
  }, [amountValue]);

  //get rate data
  useEffect(() => {
    const rateData = fiatData?.getFiatRate?.find(item => item.currency === (post?.postOffer?.localCurrency ?? 'USD'));
    setRateData(rateData?.fiatRates);
  }, [post?.postOffer?.localCurrency, fiatData?.getFiatRate]);

  useEffect(() => {
    if (amountXEC && amountXEC !== 0) {
      trigger('amount'); // Re-run validation for the "amount" field
    }
  }, [amountXEC, trigger]);

  return (
    <React.Fragment>
      <StyledDialog
        fullScreen={fullScreen}
        open={true}
        onClose={() => {
          handleCloseModal();
        }}
        TransitionComponent={Transition}
      >
        <IconButton className="back-btn" onClick={() => handleCloseModal()}>
          <ChevronLeft />
        </IconButton>
        <DialogTitle>Place an order</DialogTitle>
        <Typography className="offer-info" variant="body2">
          <span>{`Offer Id: ${post.id}`}</span>
          <br />
          <span>{`By: ${post.account.telegramUsername} • posted on: ${new Date(post.createdAt).toLocaleString()}`}</span>
        </Typography>
        <DialogContent>
          <PlaceAnOrderWrap>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Controller
                  name="amount"
                  control={control}
                  defaultValue={''}
                  rules={{
                    required: {
                      value: true,
                      message: 'Amount is required!'
                    },
                    pattern: {
                      value: /^-?[0-9]\d*\.?\d*$/,
                      message: 'Amount is invalid!'
                    },
                    validate: value => {
                      const numberValue = parseFloat(value);
                      const minValue = post.postOffer.orderLimitMin;
                      const maxValue = post.postOffer.orderLimitMax;
                      if (numberValue < 0) return 'XEC amount must be greater than 0!';
                      if (numberValue < minValue || numberValue > maxValue)
                        return `Amount must between ${minValue}-${maxValue}`;
                      if (amountXEC < 5.46) return `You need to buy amount greater than 5.46 XEC`;
                      return true;
                    }
                  }}
                  render={({ field: { onChange, onBlur, value, name, ref } }) => (
                    <TextField
                      onChange={onChange}
                      onBlur={onBlur}
                      value={value}
                      name={name}
                      inputRef={ref}
                      placeholder={post.postOffer.orderLimitMin + ' - ' + post.postOffer.orderLimitMax}
                      className="form-input"
                      id="amount"
                      label="Amount"
                      variant="outlined"
                      error={errors.amount ? true : false}
                      helperText={errors.amount && (errors.amount?.message as string)}
                      InputProps={{
                        endAdornment: (
                          <Typography variant="subtitle1">
                            {post.postOffer.coinPayment ?? post.postOffer.localCurrency ?? 'XEC'}
                          </Typography>
                        )
                      }}
                    />
                  )}
                />
                <Typography component={'div'} className="text-receive-amount">
                  {amountXEC < 5.46
                    ? 'You need to buy amount greater than 5.46 XEC'
                    : post.postOffer.paymentMethods[0]?.paymentMethod?.id !== 5 && (
                        <div>
                          You will receive <span className="amount-receive">{amountXEC.toLocaleString('de-DE')}</span>{' '}
                          XEC
                          <div>Price: {textAmountPer1MXEC}</div>
                        </div>
                      )}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Controller
                  name="message"
                  control={control}
                  defaultValue={''}
                  rules={{
                    validate: value => {
                      return _.isEmpty(value) ? 'Should include a message' : true;
                    }
                  }}
                  render={({ field: { onChange, onBlur, value, name, ref } }) => (
                    <TextField
                      onChange={onChange}
                      onBlur={onBlur}
                      value={value}
                      name={name}
                      inputRef={ref}
                      className="form-input"
                      id="message"
                      label="Message"
                      variant="outlined"
                      error={errors.message ? true : false}
                      helperText={
                        errors.message
                          ? (errors.message?.message as string)
                          : `* Orders with messages have higher acceptance rates`
                      }
                    />
                  )}
                />
              </Grid>
            </Grid>
            <RadioGroup className="payment-method-wrap" name="payment-method-groups" defaultValue="cash-in-person">
              {post.postOffer.paymentMethods.map(item => {
                return (
                  <FormControlLabel
                    key={item.paymentMethod.name}
                    value={item.paymentMethod.name}
                    checked={true}
                    control={<Radio />}
                    label={item.paymentMethod.name}
                  />
                );
              })}
              {errors.paymentMethod && (
                <Typography color="error">{errors?.paymentMethod?.message as string}</Typography>
              )}
            </RadioGroup>
            <div className="disclaim-wrap">
              <Typography className="title" variant="body2">
                * Deposit a dispute fee to have a higher chance of being accepted. Dispute fees will be returned if
                there is no dispute.
              </Typography>
              <Controller
                name="isDepositFee"
                control={control}
                defaultValue={false}
                render={({ field: { onChange, onBlur, value, ref } }) => (
                  <FormControlLabel
                    control={<Checkbox onChange={onChange} onBlur={onBlur} checked={value} inputRef={ref} />}
                    label={`I want to deposit dispute fees (1%): ${calDisputeFee} XEC`}
                  />
                )}
              />
              {isBuyerDeposit && (
                <div>
                  {InfoEscrow()}
                  {!checkBuyerEnoughFund() && (
                    <QRCode
                      address={parseCashAddressToPrefix(COIN.XEC, selectedWalletPath?.cashAddress)}
                      amount={calDisputeFee}
                      width="60%"
                    />
                  )}
                </div>
              )}
            </div>
          </PlaceAnOrderWrap>
        </DialogContent>
        <DialogActions>
          <Button
            className="confirm-btn"
            color="info"
            variant="contained"
            onClick={handleSubmit(handleCreateEscrowOrder)}
            autoFocus
            disabled={(isBuyerDeposit && !checkBuyerEnoughFund()) || loading}
          >
            Create
          </Button>
        </DialogActions>
      </StyledDialog>
      <CustomToast
        isOpen={arbiDataError}
        content="Can't get arbi/mod data"
        handleClose={() => setArbiDataError(false)}
        type="error"
        autoHideDuration={3500}
      />
      <CustomToast
        isOpen={error}
        content="There is an error while placing an order"
        handleClose={() => setError(false)}
        type="error"
        autoHideDuration={3500}
      />
    </React.Fragment>
  );
};

export default PlaceAnOrderModal;
