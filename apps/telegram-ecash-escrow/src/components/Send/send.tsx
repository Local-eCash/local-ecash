'use client';

import { withdrawFund } from '@/src/store/escrow';
import { COIN, coinInfo } from '@bcpros/lixi-models';
import {
  UtxoInNode,
  WalletContextNode,
  getSelectedWalletPath,
  isValidCoinAddress,
  parseCashAddressToPrefix,
  showToast,
  useSliceDispatch as useLixiSliceDispatch,
  useSliceSelector as useLixiSliceSelector
} from '@bcpros/redux-store';
import styled from '@emotion/styled';
import { QrCodeScanner } from '@mui/icons-material';
import { Button, FormControl, IconButton, TextField } from '@mui/material';
import { fromHex } from 'ecash-lib';
import cashaddr from 'ecashaddrjs';
import React, { useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import ScanQRcode from '../QRcode/ScanQRcode';

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

  .MuiFormControlLabel-root {
    margin-top: 7px;
  }

  .amount-donate-gnc {
    font-size: 14px;
  }

  .bold {
    font-weight: bold;
  }
`;
interface SendComponentProps {
  totalValidAmount: number;
  totalValidUtxos: Array<UtxoInNode>;
}

const SendComponent: React.FC<SendComponentProps> = props => {
  const dispatch = useLixiSliceDispatch();
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
      amount: 0
    }
  });

  const amountValue = watch('amount');

  const [myAddress, setMyAddress] = useState(parseCashAddressToPrefix(COIN.XEC, selectedWallet?.cashAddress));
  const [feeSats, setFeeSats] = useState(
    XPI.BitcoinCash.getByteCount({ P2PKH: totalValidUtxos.length }, { P2PKH: 1, P2SH: 1 }) *
      coinInfo[COIN.XEC].defaultFee
  );
  const [estimatedTxFee, setEstimatedTxFee] = useState(
    parseFloat((feeSats / Math.pow(10, coinInfo[COIN.XEC].cashDecimals)).toFixed(2))
  );

  const [openScan, setOpenScan] = useState(false);

  const handleSendCoin = async data => {
    const { address, amount } = data;
    const { hash: hashXEC } = cashaddr.decode(address, false);
    const recipientHash = Buffer.from(hashXEC).toString('hex');

    const myPk = fromHex(selectedWallet?.publicKey);
    const mySk = fromHex(selectedWallet?.privateKey);

    const txBuild = withdrawFund(
      totalValidUtxos,
      mySk,
      myPk,
      recipientHash,
      'P2PKH',
      Number(amount),
      '',
      calFee1Percent
    );
    try {
      const txid = (await chronik.broadcastTx(txBuild)).txid;
      const link = `${coinInfo[COIN.XEC].blockExplorerUrl}/tx/${txid}`;
      if (link) {
        dispatch(
          showToast(
            'success',
            {
              message: 'success',
              description: 'Transaction successful. Click to view in block explorer.'
            },
            true,
            link
          )
        );
        reset();
      }
    } catch (err) {
      console.log('Error when broadcast tx');
    }
  };

  const checkEnoughFund = () => {
    return totalValidAmount > Number(amountValue) + estimatedTxFee;
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
        onDismissModal={value => {
          setOpenScan(value);
        }}
        setAddress={value => {
          setValue('address', value);
        }}
      />
    </WrapComponent>
  );
};

export default SendComponent;
