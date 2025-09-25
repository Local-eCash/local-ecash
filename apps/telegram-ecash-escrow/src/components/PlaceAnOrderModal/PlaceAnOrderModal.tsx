'use client';

import { LIST_BANK } from '@/src/store/constants/list-bank';
import { SettingContext } from '@/src/store/context/settingProvider';
import { UtxoContext } from '@/src/store/context/utxoProvider';
import { buyerDepositFee, splitUtxos } from '@/src/store/escrow';
import { Escrow, EscrowBuyerDepositFee, EscrowFee } from '@/src/store/escrow/script';
import {
  convertXECAndCurrency,
  convertXECToSatoshi,
  estimatedFee,
  formatAmountFor1MXEC,
  formatAmountForGoodsServices,
  formatNumber,
  getNumberFromFormatNumber,
  getOrderLimitText,
  hexEncode,
  isConvertGoodsServices,
  showPriceInfo
} from '@/src/store/util';
import {
  BankInfoInput,
  COIN,
  CreateEscrowOrderInput,
  PAYMENT_METHOD,
  coinInfo,
  getTickerText
} from '@bcpros/lixi-models';
import {
  OfferType,
  PostQueryItem,
  UtxoInNodeInput,
  WalletContextNode,
  accountsApi,
  closeModal,
  convertEscrowScriptHashToEcashAddress,
  escrowOrderApi,
  fiatCurrencyApi,
  getModals,
  getSelectedWalletPath,
  showToast,
  useSliceDispatch as useLixiSliceDispatch,
  useSliceSelector as useLixiSliceSelector
} from '@bcpros/redux-store';
import { ChevronLeft } from '@mui/icons-material';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  FormHelperText,
  Grid,
  IconButton,
  InputLabel,
  Modal,
  NativeSelect,
  Radio,
  RadioGroup,
  Slide,
  TextField,
  Typography,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { TransitionProps } from '@mui/material/transitions';
import { Script, fromHex, shaRmd160 } from 'ecash-lib';
import _ from 'lodash';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import React, { useContext, useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { NumericFormat } from 'react-number-format';
import { FormControlWithNativeSelect } from '../FilterOffer/FilterOfferModal';
import CustomToast from '../Toast/CustomToast';
import ConfirmDepositModal from './ConfirmDepositModal';

interface PlaceAnOrderModalProps {
  isOpen: boolean;
  post: any;
}

const StyledDialog = styled(Dialog)(({ theme }) => ({
  '.MuiPaper-root': {
    background: theme.palette.background.default,
    backgroundRepeat: 'no-repeat',
    backgroundSize: 'cover',
    width: 500,
    height: '100vh',
    maxHeight: '100%',
    margin: 0,
    [theme.breakpoints.down('sm')]: {
      width: '100%' // Media query for small screens
    }
  },

  '.MuiIconButton-root': {
    width: 'fit-content',
    svg: {
      fontSize: 32
    }
  },

  '.MuiDialogTitle-root': {
    padding: '16px',
    fontSize: 26,
    textAlign: 'center'
  },

  '.MuiDialogContent-root': {
    padding: 0
  },

  '.MuiDialogActions-root': {
    justifyContent: 'space-evenly',
    padding: '16px',
    paddingBottom: '32px',
    button: {
      textTransform: 'math-auto',
      width: '100%',
      '&.confirm-btn': {
        color: theme.palette.common.white // Use theme color
      }
    }
  },

  '.back-btn': {
    padding: 0,
    position: 'absolute',
    left: 8,
    top: 20,
    borderRadius: 12,
    svg: {
      fontSize: 32
    }
  },

  '.offer-info': {
    color: 'rgba(255, 255, 255, 0.6)',
    padding: 16,
    '&:before': {
      position: 'absolute',
      content: "''",
      width: 4,
      height: 33,
      background: '#2bb6f6',
      borderTopRightRadius: 16,
      borderBottomRightRadius: 16,
      filter: 'drop-shadow(0 0 3px #2bb6f6)'
    },
    span: {
      fontSize: '12px !important',
      marginLeft: 16
    }
  }
}));

const PlaceAnOrderWrap = styled('div')(({ theme }) => ({
  padding: 16,

  '.form-input': {
    width: '100%'
  },

  '.payment-method-wrap': {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    margin: '16px 0',
    '.MuiFormControlLabel-root': {
      '.MuiTypography-root': {
        fontSize: 14
      }
    },

    '.label-coinOthers': {
      height: 30
    }
  },

  '.disclaim-wrap': {
    '.lable': {
      textAlign: 'center',
      borderBottom: `1px solid rgba(255, 255, 255, 0.2)`,
      paddingBottom: 12,
      marginBottom: 16,
      color: 'rgba(255, 255, 255, 0.5)'
    },

    '.title': {
      fontSize: 13
    },

    '.MuiFormControlLabel-label': {
      fontSize: 14
    }
  },

  '.deposit-wrap': {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    marginTop: 16,
    '.deposit-info': {
      alignSelf: 'center',
      p: {
        '&::first-of-type': {
          marginBottom: 6
        },
        '&.deposit-status': {
          color: '#66bb6a'
        }
      }
    },

    '.address-code': {
      '.qr-code': {
        padding: 0,
        svg: {
          width: '100%',
          height: '100%'
        }
      }
    },

    '.address-string': {
      borderRadius: 12,
      border: `1px solid rgba(255, 255, 255, 0.2)`,
      padding: '2px 12px',
      textAlign: 'center',
      gridColumnStart: 1,
      gridColumnEnd: 4,
      button: {
        svg: {
          fontSize: 21
        }
      }
    }
  },

  '.text-receive-amount': {
    marginTop: 10,
    '.amount-receive': {
      fontWeight: 'bold'
    }
  }
}));

const StyledBox = styled(Box)`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 400px;
  border: 2px solid #000;
  text-align: center;

  .group-button-wrap {
    width: 100%;
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
    padding-bottom: 16px;

    button {
      text-transform: none;
      color: white;
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
  const currentModal = useLixiSliceSelector(getModals);

  const { post }: { post: PostQueryItem } = props;
  const isBuyOffer = post.postOffer.type === OfferType.Buy;
  const { data } = useSession();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));
  const { allSettings } = useContext(SettingContext);
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
  const [escrowFeeScript, setEscrowFeeScript] = useState<EscrowFee>(null);
  const [escrowBuyerDepositFeeScript, setEscrowBuyerDepositFeeScript] = useState<EscrowBuyerDepositFee>(null);
  const [nonce, setNonce] = useState<string>(null);
  const [confirm, setConfirm] = useState(false);
  const [openConfirmDeposit, setOpenConfirmDeposit] = useState(false);
  const [amountXECGoodsServices, setAmountXECGoodsServices] = useState(0);
  const [amountXECPerUnitGoodsServices, setAmountXECPerUnitGoodsServices] = useState(0);
  const [isGoodsServices, setIsGoodsServices] = useState(
    post?.postOffer?.paymentMethods[0]?.paymentMethod?.id === PAYMENT_METHOD.GOODS_SERVICES
  );
  const [isGoodsServicesConversion, setIsGoodsServicesConversion] = useState(() =>
    isConvertGoodsServices(post?.postOffer?.priceGoodsServices, post?.postOffer?.tickerPriceGoodsServices)
  );
  const selectedWalletPath = useLixiSliceSelector(getSelectedWalletPath);

  const { useCreateEscrowOrderMutation, useGetModeratorAccountQuery, useGetRandomArbitratorAccountQuery } =
    escrowOrderApi;
  const [createOrderTrigger] = useCreateEscrowOrderMutation();

  const { currentData: moderatorCurrentData, isError: moderatorIsError } = useGetModeratorAccountQuery(
    {},
    { skip: !data, refetchOnMountOrArgChange: true }
  );
  const { currentData: arbitratorCurrentData, isError: arbitratorIsError } = useGetRandomArbitratorAccountQuery(
    { offerId: post.id },
    { skip: !data, refetchOnMountOrArgChange: true }
  );

  const { useGetAllFiatRateQuery } = fiatCurrencyApi;
  const { data: fiatData } = useGetAllFiatRateQuery();

  const { useGetAccountByAddressQuery } = accountsApi;
  const { currentData: accountQueryData } = useGetAccountByAddressQuery(
    { address: selectedWalletPath?.xAddress },
    { skip: !selectedWalletPath?.xAddress }
  );

  const {
    handleSubmit,
    formState: { errors },
    clearErrors,
    control,
    trigger,
    watch
  } = useForm({
    mode: 'onChange'
  });
  const amountValue = watch('amount');

  const calEscrowScript = () => {
    const sellerPk = isBuyOffer ? fromHex(selectedWalletPath?.publicKey ?? '') : fromHex(post.account.publicKey);
    const buyerPk = isBuyOffer ? fromHex(post.account.publicKey) : fromHex(selectedWalletPath?.publicKey ?? '');
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
    const escrowFeeScript = new EscrowFee({
      sellerPk: sellerPk,
      buyerPk: buyerPk,
      arbiPk: arbitratorPk,
      modPk: moderatorPk,
      nonce
    });
    const escrowBuyerDepositFeeScript = new EscrowBuyerDepositFee({
      sellerPk: sellerPk,
      buyerPk: buyerPk,
      arbiPk: arbitratorPk,
      modPk: moderatorPk,
      nonce
    });

    setEscrowScript(escrowScript);
    setEscrowFeeScript(escrowFeeScript);
    setEscrowBuyerDepositFeeScript(escrowBuyerDepositFeeScript);
    setNonce(nonce);
  };

  const handleCreateEscrowOrder = async (data, isDepositFee) => {
    setLoading(true);
    if (moderatorIsError || arbitratorIsError) {
      setArbiDataError(true);

      return;
    }

    const bankInfo: BankInfoInput = {
      bankName: data?.bankName ?? null,
      accountNameBank: data?.bankName ? data?.accountName : null,
      accountNumberBank: data?.bankName ? data?.accountNumber : null,
      appName: post.postOffer?.paymentApp ?? null,
      accountNameApp: post.postOffer?.paymentApp ? data?.accountName : null,
      accountNumberApp: post.postOffer?.paymentApp ? data?.accountNumber : null
    };

    const { amount, message }: { amount: string; message: string } = data;
    const parseAmount = getNumberFromFormatNumber(amount);
    const offerAccountId = post.accountId;
    const moderatorId = moderatorCurrentData.getModeratorAccount.id;
    const arbitratorId = arbitratorCurrentData.getRandomArbitratorAccount.id;

    const buyerPk = fromHex(selectedWalletPath?.publicKey);
    const buyerSk = fromHex(selectedWalletPath?.privateKey);

    try {
      const scriptSmartContract = escrowScript.script();
      const scriptFeeSmartContract = escrowFeeScript.script();
      const scriptBuyerDepositFeeSmartContract = escrowBuyerDepositFeeScript.script();

      //split utxos is here and broadcast. Then build tx
      let hexTxBuyerDeposit = null;
      let escrowBuyerDepositFeeAddress = null;
      let foundUtxo: UtxoInNodeInput;
      const depositFeeSats = convertXECToSatoshi(calDisputeFee);

      if (isDepositFee) {
        const utxosToSplit = [];
        let totalAmount = 0;
        for (let i = 0; i < totalValidUtxos.length; i++) {
          totalAmount += totalValidUtxos[i].value;
          utxosToSplit.push(totalValidUtxos[i]);
          const feeSats =
            XPI.BitcoinCash.getByteCount({ P2PKH: utxosToSplit.length }, { P2PKH: 2 }) * coinInfo[COIN.XEC].defaultFee;
          if (totalAmount >= depositFeeSats + feeSats) break;
        }
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

        const totalAmountBuyerDepositFee = escrowCalculations.totalAmount;
        const scriptEscrow = new Script(scriptBuyerDepositFeeSmartContract.bytecode);
        hexTxBuyerDeposit = buyerDepositFee(foundUtxo, buyerSk, buyerPk, totalAmountBuyerDepositFee, scriptEscrow);
      }

      const escrowAddress = convertEscrowScriptHashToEcashAddress(shaRmd160(scriptSmartContract.bytecode));
      const escrowFeeAddress = convertEscrowScriptHashToEcashAddress(shaRmd160(scriptFeeSmartContract.bytecode));
      escrowBuyerDepositFeeAddress = convertEscrowScriptHashToEcashAddress(
        shaRmd160(scriptBuyerDepositFeeSmartContract.bytecode)
      );

      const data: CreateEscrowOrderInput = {
        amount: isGoodsServices ? amountXECGoodsServices : amountXEC,
        amountCoinOrCurrency: parseAmount,
        offerAccountId,
        arbitratorId,
        moderatorId,
        escrowAddress,
        escrowFeeAddress,
        escrowBuyerDepositFeeAddress,
        nonce,
        escrowScript: hexEncode(scriptSmartContract.bytecode),
        escrowFeeScript: hexEncode(scriptFeeSmartContract.bytecode),
        escrowBuyerDepositFeeScript: hexEncode(scriptBuyerDepositFeeSmartContract.bytecode),
        price: isGoodsServices ? formatAmountForGoodsServices(amountXECPerUnitGoodsServices) : textAmountPer1MXEC,
        paymentMethodId: post.postOffer.paymentMethods[0].paymentMethod.id,
        postId: post.id,
        message: message,
        buyerDepositTx: hexTxBuyerDeposit,
        utxoInProcess: foundUtxo,
        bankInfoInput: bankInfo
      };

      const result = await createOrderTrigger({ input: data }).unwrap();

      dispatch(
        showToast('success', {
          message: 'Success',
          description: 'Order created successfully!'
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

  const escrowCalculations = useMemo(() => {
    // Default values for calculations
    const defaultValues = {
      feeBuyerDepositFee: 0,
      totalAmount: 0
    };

    // Check if escrowBuyerDepositFeeScript is available
    if (!escrowBuyerDepositFeeScript) {
      return defaultValues;
    }

    const buyerDepositFeeScript = escrowBuyerDepositFeeScript.script();
    const feeBuyerDepositFee = estimatedFee(hexEncode(buyerDepositFeeScript?.bytecode || ''));

    // Calculate total amount
    const totalAmount = parseFloat((calDisputeFee + feeBuyerDepositFee).toFixed(2));

    return {
      feeBuyerDepositFee,
      totalAmount
    };
  }, [calDisputeFee, escrowBuyerDepositFeeScript]);

  const checkBuyerEnoughFund = () => {
    return totalValidAmount > escrowCalculations.totalAmount;
  };

  const InfoPaymentDetail = () => {
    const paymentMethodId = post?.postOffer?.paymentMethods[0]?.paymentMethod?.id;
    if (paymentMethodId !== PAYMENT_METHOD.BANK_TRANSFER && paymentMethodId !== PAYMENT_METHOD.PAYMENT_APP) return;

    const aufoFillData = (propertyName: string) => {
      //check bank
      if (
        post.postOffer.paymentMethods[0]?.paymentMethod?.id === PAYMENT_METHOD.BANK_TRANSFER &&
        accountQueryData?.getAccountByAddress?.bankInfo?.bankName
      )
        return accountQueryData?.getAccountByAddress?.bankInfo[`${propertyName}Bank`];

      //check app
      if (
        post.postOffer.paymentMethods[0]?.paymentMethod?.id === PAYMENT_METHOD.PAYMENT_APP &&
        accountQueryData?.getAccountByAddress?.bankInfo?.appName
      )
        return accountQueryData?.getAccountByAddress?.bankInfo[`${propertyName}App`];
    };

    return (
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Typography variant="h6">Payment Details</Typography>
        </Grid>
        {paymentMethodId === PAYMENT_METHOD.BANK_TRANSFER &&
          (post.postOffer.localCurrency === 'VND' ? (
            <Grid item xs={12} style={{ paddingTop: 0, marginBottom: '10px' }}>
              <Controller
                name="bankName"
                control={control}
                defaultValue={accountQueryData?.getAccountByAddress?.bankInfo?.bankName}
                rules={{
                  validate: value => {
                    if (!value) return 'Bank-name is required';

                    return true;
                  }
                }}
                render={({ field: { onChange, onBlur, value, ref } }) => (
                  <FormControlWithNativeSelect>
                    <InputLabel variant="outlined" htmlFor="select-bankName">
                      Bank-name
                    </InputLabel>
                    <NativeSelect
                      id="select-bankName"
                      value={value ?? ''}
                      onBlur={onBlur}
                      ref={ref}
                      onChange={e => {
                        onChange(e);
                      }}
                    >
                      <option aria-label="None" value="" />
                      {LIST_BANK.sort((a, b) => {
                        if (a.shortName < b.shortName) return -1;
                        if (a.shortName > b.shortName) return 1;

                        return 0;
                      }).map(item => {
                        return (
                          <option key={item.id} value={`${item.shortName}`}>
                            {item.shortName}
                          </option>
                        );
                      })}
                    </NativeSelect>
                    {errors && errors?.bankName && (
                      <FormHelperText error={true}>{errors.bankName.message as string}</FormHelperText>
                    )}
                  </FormControlWithNativeSelect>
                )}
              />
            </Grid>
          ) : (
            <Grid item xs={12}>
              <Controller
                name="bankName"
                control={control}
                defaultValue={accountQueryData?.getAccountByAddress?.bankInfo?.bankName ?? ''}
                rules={{
                  validate: value => {
                    return _.isEmpty(value) ? 'Bank-name is required' : true;
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
                    id="bank-name"
                    label="Bank Name"
                    variant="outlined"
                    error={errors.bankName ? true : false}
                    multiline={true}
                    maxRows={2}
                    helperText={errors.bankName && (errors.bankName?.message as string)}
                  />
                )}
              />
            </Grid>
          ))}
        <Grid item xs={6}>
          <Controller
            name="accountName"
            control={control}
            defaultValue={aufoFillData('accountName')}
            rules={{
              validate: value => {
                return _.isEmpty(value) ? 'Account-name is required' : true;
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
                id="account-name"
                label="Account Name"
                variant="outlined"
                error={errors.accountName ? true : false}
                multiline={true}
                maxRows={2}
                helperText={errors.accountName && (errors.accountName?.message as string)}
              />
            )}
          />
        </Grid>
        <Grid item xs={6}>
          <Controller
            name="accountNumber"
            control={control}
            defaultValue={aufoFillData('accountNumber')}
            rules={{
              validate: value => {
                return _.isEmpty(value) ? 'Account-number is required' : true;
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
                id="account-number"
                label="Account Number"
                variant="outlined"
                error={errors.accountName ? true : false}
                inputProps={{ maxLength: 20 }}
                multiline={true}
                maxRows={2}
                helperText={errors.accountNumber && (errors.accountNumber?.message as string)}
              />
            )}
          />
        </Grid>
      </Grid>
    );
  };

  const convertToAmountXEC = async () => {
    if (!rateData) return 0;

    const amountNumber = getNumberFromFormatNumber(amountValue);

    const { amountXEC: xec, amountCoinOrCurrency: coinOrCurrency } = convertXECAndCurrency({
      rateData: rateData,
      paymentInfo: post?.postOffer,
      inputAmount: amountNumber
    });

    let amountXEC = xec;
    let amountCoinOrCurrency = coinOrCurrency;

    //cals fee
    const feeSats = XPI.BitcoinCash.getByteCount({ P2PKH: 5 }, { P2PKH: 1, P2SH: 1 }) * coinInfo[COIN.XEC].defaultFee; // assume worst case input is 5, because we estimate from buyer, so we don't know input of seller
    const feeAmount = parseFloat((feeSats / Math.pow(10, coinInfo[COIN.XEC].cashDecimals)).toFixed(2));
    const feeWithdraw = estimatedFee(Buffer.from(escrowScript.script().bytecode).toString('hex'));
    const amountMargin = (amountXEC * post.postOffer.marginPercentage) / 100;

    //whoever place an order bears the fee
    if (isBuyOffer) {
      //seller pays the fee
      amountXEC = amountXEC + amountMargin;
    } else {
      //buyer pays the fee
      amountXEC = amountXEC - amountMargin - feeAmount - feeWithdraw;
    }
    const amountXecRounded = parseFloat(amountXEC.toFixed(2));
    if (amountXecRounded > 5.46) {
      clearErrors('amount');
    }
    amountXecRounded > 0 ? setAmountXEC(amountXecRounded) : setAmountXEC(0);

    const xecPerUnit = isGoodsServicesConversion ? amountXEC / amountNumber : post?.postOffer?.priceGoodsServices;
    setAmountXECPerUnitGoodsServices(xecPerUnit);
    setAmountXECGoodsServices(xecPerUnit * amountNumber);
    setTextAmountPer1MXEC(formatAmountFor1MXEC(amountCoinOrCurrency, post?.postOffer?.marginPercentage, coinCurrency));
  };

  const handleCreateOrderBeforeConfirm = async () => {
    const isValid = await trigger();
    if (!isValid) return;

    if (checkBuyerEnoughFund() && !isBuyOffer) {
      setOpenConfirmDeposit(true);
    } else {
      handleSubmit(data => {
        handleCreateEscrowOrder(data, false);
      })();
    }
  };

  // // Handle browser history to manage the modal
  useEffect(() => {
    // Function to handle the popstate event (when back button is clicked)
    const handlePopState = event => {
      if (currentModal.length > 0) {
        // Prevent the default back action
        event.preventDefault();

        // Close the modal instead
        dispatch(closeModal());
      }
    };

    // When modal opens, add a new history entry
    if (currentModal.length > 0) {
      // Push a new entry to the history stack
      window.history.pushState({ modal: true }, '');

      // Add event listener for popstate (back button)
      window.addEventListener('popstate', handlePopState);
    }

    // Cleanup
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [currentModal]);

  const handleCloseModal = () => {
    dispatch(closeModal());
    window.history.go(1);
  };

  const showPrice = useMemo(() => {
    return (
      showPriceInfo(
        post?.postOffer?.paymentMethods[0]?.paymentMethod?.id,
        post?.postOffer?.coinPayment,
        post?.postOffer?.priceCoinOthers,
        post?.postOffer?.priceGoodsServices,
        post?.postOffer?.tickerPriceGoodsServices
      ) || isGoodsServices
    );
  }, [post?.postOffer]);

  const coinCurrency = useMemo(() => {
    return getTickerText(
      post?.postOffer?.localCurrency,
      post?.postOffer?.coinPayment,
      post?.postOffer?.coinOthers,
      post?.postOffer?.priceCoinOthers
    );
  }, [post?.postOffer]);

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
    if (showPrice) {
      convertToAmountXEC();
    } else {
      setAmountXEC(getNumberFromFormatNumber(amountValue) ?? 0);
    }
  }, [amountValue, showPrice]);

  //get rate data
  useEffect(() => {
    const rateData = fiatData?.getAllFiatRate?.find(
      item => item.currency === (post?.postOffer?.localCurrency ?? 'USD')
    );
    setRateData(rateData?.fiatRates);
  }, [post?.postOffer?.localCurrency, fiatData?.getAllFiatRate]);

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
          <Typography component="span" variant="body1">{`Offer Id: ${post.id}`}</Typography>
          <br />
          <Typography component="span">{`By: ${allSettings?.[`${post.account.id.toString()}`]?.usePublicLocalUserName ? post.account.anonymousUsernameLocalecash : post.account.telegramUsername} • posted on: ${new Date(post.createdAt).toLocaleString('vi-VN')}`}</Typography>
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
                    validate: value => {
                      const numberValue = getNumberFromFormatNumber(value);
                      const minValue = post?.postOffer?.orderLimitMin;
                      const maxValue = post?.postOffer?.orderLimitMax;
                      if (numberValue < 0) return 'XEC amount must be greater than 0!';
                      if (amountXEC < 5.46) return `You need to buy amount greater than 5.46 XEC`;

                      if (minValue || maxValue) {
                        if (numberValue < minValue || numberValue > maxValue)
                          return `Amount must between ${formatNumber(minValue)} - ${formatNumber(maxValue)}`;
                      }

                      return true;
                    }
                  }}
                  render={({ field: { onChange, onBlur, value, name, ref } }) => (
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
                      placeholder={getOrderLimitText(
                        post?.postOffer?.orderLimitMin,
                        post?.postOffer?.orderLimitMax,
                        ''
                      )}
                      className="form-input"
                      id="amount-place-order"
                      label="Amount"
                      variant="outlined"
                      error={errors.amount ? true : false}
                      helperText={errors.amount && (errors.amount?.message as string)}
                      InputProps={{
                        endAdornment: <Typography variant="subtitle1">{coinCurrency}</Typography>
                      }}
                    />
                  )}
                />
                <Typography component={'div'} className="text-receive-amount">
                  {amountXEC < 5.46
                    ? 'You need to buy amount greater than 5.46 XEC'
                    : showPrice && (
                        <div>
                          You will {isBuyOffer ? 'send' : 'receive'}{' '}
                          <span className="amount-receive">
                            {formatNumber(isGoodsServices ? amountXECGoodsServices : amountXEC)}
                          </span>{' '}
                          {COIN.XEC} {isBuyOffer && '(estimated)'}
                          <div>
                            Price:{' '}
                            {isGoodsServices ? (
                              // Goods/Services display
                              <>{formatAmountForGoodsServices(amountXECPerUnitGoodsServices)}</>
                            ) : (
                              // Show regular price
                              <>{textAmountPer1MXEC}</>
                            )}
                          </div>
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
                      multiline={true}
                      maxRows={2}
                      placeholder="Private message to the seller. E.g. I want to buy XEC via bank transfer."
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
              {post.postOffer?.coinOthers && (
                <Button size="small" color="success" variant="contained" className="label-coinOthers">
                  {post.postOffer.coinOthers}
                </Button>
              )}
              {post.postOffer?.paymentApp && (
                <Button size="small" color="success" variant="contained" className="label-coinOthers">
                  {post.postOffer.paymentApp}
                </Button>
              )}
              {errors.paymentMethod && (
                <Typography color="error">{errors?.paymentMethod?.message as string}</Typography>
              )}
            </RadioGroup>
            {isBuyOffer && InfoPaymentDetail()}
          </PlaceAnOrderWrap>
        </DialogContent>
        <DialogActions>
          <Button
            className="confirm-btn"
            color="info"
            variant="contained"
            onClick={() => {
              if (post?.account?.telegramUsername.startsWith('@')) {
                handleCreateOrderBeforeConfirm();
              } else {
                setConfirm(true);
              }
            }}
            autoFocus
            disabled={loading}
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

      <Modal
        open={confirm}
        onClose={() => setConfirm(false)}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <StyledBox sx={{ bgcolor: 'background.paper', boxShadow: 24, p: 4 }}>
          <h4 id="modal-modal-title" style={{ color: 'white', marginTop: '0' }}>
            The seller does not have a Telegram username so it will be difficult to communicate.
            <br />
            <br />
            Are you sure you want to continue?
          </h4>
          <div className="group-button-wrap">
            <Button variant="contained" fullWidth onClick={() => setConfirm(false)}>
              Cancel
            </Button>
            <Button
              variant="contained"
              fullWidth
              color="warning"
              onClick={() => {
                handleCreateOrderBeforeConfirm();
              }}
            >
              Continue
            </Button>
          </div>
        </StyledBox>
      </Modal>

      <ConfirmDepositModal
        isOpen={openConfirmDeposit}
        depositSecurity={calDisputeFee}
        escrowCalculations={escrowCalculations}
        isLoading={loading}
        onDismissModal={value => setOpenConfirmDeposit(value)}
        depositFee={isDeposit => {
          handleSubmit(data => {
            handleCreateEscrowOrder(data, isDeposit);
          })();
        }}
      />
    </React.Fragment>
  );
};

export default PlaceAnOrderModal;
