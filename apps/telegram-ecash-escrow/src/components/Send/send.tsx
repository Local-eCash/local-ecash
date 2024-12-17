'use client';

import { withdrawFund } from '@/src/store/escrow';
import { COIN, coinInfo } from '@bcpros/lixi-models';
import {
  UtxoInNode,
  WalletContextNode,
  getSelectedWalletPath,
  isValidCoinAddress,
  parseCashAddressToPrefix,
  useSliceSelector as useLixiSliceSelector
} from '@bcpros/redux-store';
import styled from '@emotion/styled';
import { QrCodeScanner } from '@mui/icons-material';
import { Button, Checkbox, FormControl, FormControlLabel, IconButton, TextField, Typography } from '@mui/material';
import { fromHex } from 'ecash-lib';
import cashaddr from 'ecashaddrjs';
import React, { useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import ScanQRcode from '../QRcode/ScanQRcode';
import CustomToast from '../Toast/CustomToast';

const WrapComponent = styled.div`
  .address-input {
    display: flex;
    button {
      border-radius: 0;
      border: 1px solid rgba(255, 255, 255, 0.09);
      background-color: rgba(255, 255, 255, 0.09);
    }
  }
  .amount-input {
    margin-top: 10px;
  }
  .btn-send {
    width: 100%;
    margin-top: 10px;
    color: #fff;
  }
`;
interface SendComponentProps {
  totalValidAmount: number;
  totalValidUtxos: Array<UtxoInNode>;
}

const SendComponent: React.FC<SendComponentProps> = props => {
  const { totalValidAmount, totalValidUtxos } = props;

  const selectedWallet = useLixiSliceSelector(getSelectedWalletPath);
  const Wallet = React.useContext(WalletContextNode);
  const { chronik, XPI } = Wallet;

  const {
    handleSubmit,
    control,
    setValue,
    reset,
    watch,
    formState: { errors }
  } = useForm({
    defaultValues: {
      address: '',
      amount: 0,
      isDonateGNC: true
    }
  });

  const amountValue = watch('amount');
  const isDonateGNC = watch('isDonateGNC');

  const [myAddress, setMyAddress] = useState(parseCashAddressToPrefix(COIN.XEC, selectedWallet?.cashAddress));
  const [feeSats, setFeeSats] = useState(
    XPI.BitcoinCash.getByteCount({ P2PKH: totalValidUtxos.length }, { P2PKH: 1, P2SH: 1 }) *
      coinInfo[COIN.XEC].defaultFee
  );
  const [estimatedTxFee, setEstimatedTxFee] = useState(
    parseFloat((feeSats / Math.pow(10, coinInfo[COIN.XEC].cashDecimals)).toFixed(2))
  );

  const [openScan, setOpenScan] = useState(false);
  const [openToastSendSuccess, setOpenToastSendSuccess] = useState(false);
  const [linkSend, setLinkSend] = useState('');

  const handleSendCoin = async data => {
    const { address, amount, isDonateGNC } = data;
    const { hash: hashXEC } = cashaddr.decode(address, false);
    const recipientHash = Buffer.from(hashXEC).toString('hex');

    const myPk = fromHex(selectedWallet?.publicKey);
    const mySk = fromHex(selectedWallet?.privateKey);

    let GNCAddress = '';
    if (isDonateGNC) {
      GNCAddress = process.env.NEXT_PUBLIC_ADDRESS_GNC;
    }

    const txBuild = withdrawFund(
      totalValidUtxos,
      mySk,
      myPk,
      recipientHash,
      'P2PKH',
      Number(amount),
      GNCAddress,
      calFee1Percent
    );
    try {
      const txid = (await chronik.broadcastTx(txBuild)).txid;
      const link = `${coinInfo[COIN.XEC].blockExplorerUrl}/tx/${txid}`;
      if (link) {
        setLinkSend(link);
        setOpenToastSendSuccess(true);
        reset();
      }
    } catch (err) {
      console.log('Error when broadcast tx');
    }
  };

  const checkEnoughFund = () => {
    return isDonateGNC
      ? totalValidAmount > calFee1Percent + Number(amountValue) + estimatedTxFee
      : totalValidAmount > Number(amountValue) + estimatedTxFee;
  };

  const calFee1Percent = useMemo(() => {
    const fee1Percent = parseFloat((Number(amountValue || 0) / 100).toFixed(2));
    const dustXEC = coinInfo[COIN.XEC].dustSats / Math.pow(10, coinInfo[COIN.XEC].cashDecimals);
    return Math.max(fee1Percent, dustXEC);
  }, [amountValue]);

  return (
    <WrapComponent>
      <div className="address-input">
        <Controller
          name="address"
          control={control}
          rules={{
            required: {
              value: true,
              message: 'Address is required!'
            },
            validate: {
              addressValid: addr => {
                if (!isValidCoinAddress(COIN.XEC, addr)) return 'Invalid address!';
              },
              notSendMySelf: addr => {
                if (addr === myAddress) return 'Cannot send to yourself!';
              }
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
                id="address"
                label="Address"
                error={errors.address && true}
                helperText={errors.address && (errors.address?.message as string)}
                variant="filled"
              />
            </FormControl>
          )}
        />
        <IconButton onClick={() => setOpenScan(true)}>
          <QrCodeScanner width={50} />
        </IconButton>
      </div>

      <div className="amount-input">
        <Controller
          name="amount"
          control={control}
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
              if (value <= 5.46) return 'Amount must be greater than 5.46 XEC';
            }
          }}
          render={({ field: { onChange, onBlur, value, name, ref } }) => (
            <FormControl fullWidth={true}>
              <TextField
                id="amount"
                label="Amount"
                onChange={onChange}
                color="info"
                onBlur={onBlur}
                value={value}
                name={name}
                inputRef={ref}
                error={errors.amount ? true : false}
                helperText={errors.amount && (errors.amount?.message as string)}
                variant="filled"
                onFocus={() => {
                  if (Number(value) === 0) {
                    onChange(''); // Clear the value
                  }
                }}
              />
            </FormControl>
          )}
        />
        <Controller
          name="isDonateGNC"
          control={control}
          render={({ field }) => (
            <FormControlLabel
              control={<Checkbox {...field} checked={field.value} onChange={e => field.onChange(e.target.checked)} />}
              label="Donate 1% to keep this service running"
            />
          )}
        />
        {isDonateGNC && (
          <Typography>
            {calFee1Percent.toLocaleString('de-DE')} {COIN.XEC} will be sent to GNC to maintains this app
          </Typography>
        )}
      </div>
      <Button
        className="btn-send"
        variant="contained"
        onClick={handleSubmit(handleSendCoin)}
        disabled={!checkEnoughFund()}
      >
        Send
      </Button>
      <ScanQRcode
        isOpen={openScan}
        onDissmissModal={value => {
          setOpenScan(value);
        }}
        setAddress={value => {
          setValue('address', value);
        }}
      />

      <CustomToast
        isOpen={openToastSendSuccess}
        handleClose={() => setOpenToastSendSuccess(false)}
        content="Transaction successful. Click to view in block explorer."
        isLink={true}
        linkDescription={linkSend}
        type="success"
      />
    </WrapComponent>
  );
};

export default SendComponent;
