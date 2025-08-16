'use client';

import { securityDepositPercentage } from '@/src/store/constants';
import { SettingContext } from '@/src/store/context/settingProvider';
import { convertXECAndCurrency, formatAmountFor1MXEC, showPriceInfo } from '@/src/store/util';
import { COIN, PAYMENT_METHOD, coinInfo, getTickerText } from '@bcpros/lixi-models';
import {
  DisputeStatus,
  EscrowOrderQueryItem,
  EscrowOrderStatus,
  OfferType,
  fiatCurrencyApi,
  getSelectedAccount,
  getSelectedWalletPath,
  useSliceSelector as useLixiSliceSelector
} from '@bcpros/redux-store';
import { Button, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import { usePathname, useRouter } from 'next/navigation';
import React, { useContext, useEffect, useMemo, useState } from 'react';

const OrderDetailWrap = styled('div')(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
  cursor: 'default',
  background: theme.custom.bgPrimary,
  borderRadius: '10px',
  padding: '16px',
  marginBottom: '16px',
  '.prefix': {
    fontSize: '14px',
    color: '#79869b'
  },
  '.btn-payment': {
    borderRadius: '16px',
    fontSize: '12px',
    textTransform: 'none'
  },

  '.payment-method-wrap': {
    display: 'flex',
    gap: '10px',
    alignItems: 'center'
  },

  '.btn-order-type': {
    fontSize: '12px',
    textTransform: 'none',
    borderRadius: '10px'
  },

  '.order-first-line': {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '5px'
  },

  '.wrap-order-id': {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    cursor: 'pointer'
  },

  '.wrap-order-amount': {
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },

  '.order-id': {
    display: 'inline-block',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },

  '.btn-view-order': {
    textTransform: 'none'
  },

  'button:not(.btn-view-order)': {
    pointerEvents: 'none'
  }
}));

export const EscrowAddressLink = (name, escrowAddress) => (
  <Typography>
    <span className="prefix">{name}: </span>
    <a
      style={{
        color: 'cornflowerblue',
        wordWrap: 'break-word',
        maxWidth: '100%',
        display: 'inline-block'
      }}
      href={`${coinInfo[COIN.XEC].blockExplorerUrl}/address/${escrowAddress}`}
      target="_blank"
    >
      <span>{escrowAddress}</span>
    </a>
  </Typography>
);

type OrderItemProps = {
  item?: EscrowOrderQueryItem;
  amountXEC?: number;
  textAmountPer1MXEC?: string;
  setAmountXEC?: (value: number) => void;
  setTextAmountPer1MXEC?: (text: string) => void;
};

const OrderDetailInfo = ({
  item,
  amountXEC,
  setAmountXEC,
  textAmountPer1MXEC,
  setTextAmountPer1MXEC
}: OrderItemProps) => {
  const order = item;
  const isBuyOffer = order?.escrowOffer?.type === OfferType.Buy;

  const router = useRouter();
  const pathname = usePathname();
  const { allSettings } = useContext(SettingContext);

  const [rateData, setRateData] = useState(null);
  const [marginCurrentPrice, setMarginCurrentPrice] = useState(0);

  // Local state for standalone mode
  const [localAmountXEC, setLocalAmountXEC] = useState(0);
  const [localTextAmountPer1MXEC, setLocalTextAmountPer1MXEC] = useState('');

  // Determine if component is in standalone mode
  const isStandalone = setAmountXEC === undefined || setTextAmountPer1MXEC === undefined;

  // Use the correct state and setter based on mode
  const effectiveAmountXEC = isStandalone ? localAmountXEC : amountXEC;
  const effectiveSetAmountXEC = isStandalone ? setLocalAmountXEC : setAmountXEC;

  const effectiveTextAmount = isStandalone ? localTextAmountPer1MXEC : textAmountPer1MXEC;
  const effectiveSetTextAmount = isStandalone ? setLocalTextAmountPer1MXEC : setTextAmountPer1MXEC;

  const selectedWalletPath = useLixiSliceSelector(getSelectedWalletPath);
  const selectedAccount = useLixiSliceSelector(getSelectedAccount);

  const { useGetAllFiatRateQuery } = fiatCurrencyApi;
  const { data: fiatData } = useGetAllFiatRateQuery();

  const revertCompactNumber = compact => {
    const regex = /([\d.]+)([MKB]?)?/; // Match number and optional suffix
    const match = compact.match(regex);

    if (!match) return null;

    const value = parseFloat(match[1]); // Numeric part
    const suffix = match[2]; // Suffix part (M, K, etc.)

    switch (suffix) {
      case 'B':
        return value * 1_000_000_000;
      case 'M':
        return value * 1_000_000;
      case 'K':
        return value * 1_000;
      default:
        return value; // No suffix
    }
  };

  const convertXECToAmount = async () => {
    if (!rateData) return 0;
    const { amountXEC: xec, amountCoinOrCurrency: coinOrCurrency } = convertXECAndCurrency({
      rateData: rateData,
      paymentInfo: order?.escrowOffer,
      inputAmount: Number(order.amountCoinOrCurrency ?? '0')
    });

    let amountXEC = xec;
    let amountCoinOrCurrency = coinOrCurrency;

    //we just need code below in buyOffer
    if (isBuyOffer) {
      //set amount XEC (plus margin amount because we just use it in buyOffer)
      const amountMargin = (amountXEC * order.escrowOffer.marginPercentage) / 100;

      //dynamic amountXEC
      amountXEC = amountXEC + amountMargin;
      const amountXecRounded = parseFloat(amountXEC.toFixed(2));
      amountXecRounded > 0 ? effectiveSetAmountXEC(amountXecRounded) : effectiveSetAmountXEC(0);

      effectiveSetTextAmount(
        formatAmountFor1MXEC(amountCoinOrCurrency, order?.escrowOffer?.marginPercentage, coinCurrency)
      );
    }

    //calculate marginPrice
    if (order?.price) {
      const compactNumber = order?.price.match(/[\d.]+[BMK]?/);
      const revertPriceOrder = revertCompactNumber(compactNumber[0]);

      //to calculate margin: (b - a) / a * 100
      const marginMarketPriceAndOrderPrice = ((revertPriceOrder - amountCoinOrCurrency) / amountCoinOrCurrency) * 100;
      setMarginCurrentPrice(marginMarketPriceAndOrderPrice);
    }
  };

  const showPrice = useMemo(() => {
    return showPriceInfo(
      order?.paymentMethod?.id,
      order?.escrowOffer?.coinPayment,
      order?.escrowOffer?.priceCoinOthers
    );
  }, [order]);

  const coinCurrency = useMemo(() => {
    return getTickerText(
      order?.escrowOffer?.localCurrency,
      order?.escrowOffer?.coinPayment,
      order?.escrowOffer?.coinOthers,
      order?.escrowOffer?.priceCoinOthers
    );
  }, [order?.escrowOffer]);

  const isShowDynamicValue = useMemo(() => {
    //dynamic value only pending and not for goods/service
    return isBuyOffer && order?.escrowOrderStatus === EscrowOrderStatus.Pending && showPrice;
  }, [showPrice]);

  const calDisputeFee = useMemo(() => {
    const amountOrder = isShowDynamicValue ? effectiveAmountXEC : order.amount;

    const fee1Percent = parseFloat((amountOrder / 100).toFixed(2));
    const dustXEC = coinInfo[COIN.XEC].dustSats / Math.pow(10, coinInfo[COIN.XEC].cashDecimals);

    return Math.max(fee1Percent, dustXEC);
  }, [order.amount, isShowDynamicValue ? effectiveAmountXEC : null]);

  const paymentDetailInfo = () => {
    if (isBuyOffer) {
      if (item.paymentMethod?.id === PAYMENT_METHOD.BANK_TRANSFER) {
        // bank
        return [order?.bankInfo?.accountNameBank, order?.bankInfo?.bankName, order?.bankInfo?.accountNumberBank]
          .filter(Boolean)
          .join(', ');
      }
      if (item.paymentMethod?.id === PAYMENT_METHOD.PAYMENT_APP) {
        // app
        return [order?.bankInfo?.accountNameApp, order?.bankInfo?.appName, order?.bankInfo?.accountNumberApp]
          .filter(Boolean)
          .join(', ');
      }
    }
    return null;
  };

  const orderStatus = () => {
    if (order?.dispute && order?.dispute?.status === DisputeStatus.Active) return 'Dispute';

    if (order?.escrowOrderStatus === EscrowOrderStatus.Escrow) {
      if (order.releaseSignatory) return 'Released';
      if (order.returnSignatory) return 'Returned';
      return 'Escrowed';
    }
    const statusTransformations = {
      [EscrowOrderStatus.Cancel]: 'Cancelled',
      [EscrowOrderStatus.Complete]: 'Completed'
    };

    if (statusTransformations[order?.escrowOrderStatus]) {
      return statusTransformations[order?.escrowOrderStatus];
    }

    const status = order?.escrowOrderStatus || '';
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  };

  //get rate data
  useEffect(() => {
    //just set if seller or buyOffer
    if (selectedWalletPath?.hash160 === order?.sellerAccount?.hash160 || isBuyOffer) {
      const rateData = fiatData?.getAllFiatRate?.find(
        item => item.currency === (order?.escrowOffer?.localCurrency ?? 'USD')
      );
      setRateData(rateData?.fiatRates);
    }
  }, [order?.escrowOffer?.localCurrency, fiatData?.getAllFiatRate]);

  //convert to XEC
  useEffect(() => {
    if (showPrice) {
      convertXECToAmount();
    }
  }, [rateData, showPrice]);

  return (
    <OrderDetailWrap>
      <Typography className="order-first-line" variant="body1" component="div">
        <div className="wrap-order-id">
          <span className="prefix">No: </span>
          <span className="order-id">{order.id}</span>
          <span className="prefix">{order?.markAsPaid && '(Mark as paid)'}</span>
        </div>
      </Typography>
      <Typography variant="body1">
        {order?.sellerAccount.id === selectedAccount?.id && (
          <React.Fragment>
            <span className="prefix">{order.escrowOffer.type === OfferType.Buy ? 'Offered' : 'Ordered'} by: </span>
            {allSettings?.[`${order?.buyerAccount.id.toString()}`]?.usePublicLocalUserName
              ? order?.buyerAccount.anonymousUsernameLocalecash
              : order?.buyerAccount.telegramUsername}
          </React.Fragment>
        )}
        {order?.buyerAccount.id === selectedAccount?.id && (
          <React.Fragment>
            <span className="prefix">{order.escrowOffer.type === OfferType.Buy ? 'Ordered' : 'Offered'} by: </span>
            {allSettings?.[`${order?.sellerAccount.id.toString()}`]?.usePublicLocalUserName
              ? order?.sellerAccount.anonymousUsernameLocalecash
              : order?.sellerAccount.telegramUsername}
          </React.Fragment>
        )}
      </Typography>
      <Typography variant="body1">
        <span className="prefix">Ordered at: </span>
        {new Date(order?.createdAt).toLocaleString('vi-VN')}
      </Typography>
      {showPrice && (
        <Typography variant="body1">
          <span className="prefix">Price: </span>
          {isShowDynamicValue ? effectiveTextAmount : order?.price}
        </Typography>
      )}
      <Typography className="wrap-order-amount" variant="body1" component={'div'}>
        <div className="order-amount">
          <span className="prefix">Order amount:</span> {isShowDynamicValue ? effectiveAmountXEC : order?.amount}{' '}
          {coinInfo[COIN.XEC].ticker}
        </div>
        <div className="order-type">
          {order?.sellerAccount.id === selectedAccount?.id && (
            <Button className="btn-order-type" size="small" color="error" variant="outlined">
              Sell
            </Button>
          )}
          {order?.buyerAccount.id === selectedAccount?.id && (
            <Button className="btn-order-type" size="small" color="success" variant="outlined">
              Buy
            </Button>
          )}
        </div>
      </Typography>
      {showPrice && (
        <Typography variant="body1">
          <span className="prefix">Payment amount:</span> {order?.amountCoinOrCurrency} {coinCurrency}
        </Typography>
      )}
      <Typography variant="body1">
        <span className="prefix">Seller security deposit ({securityDepositPercentage}%):</span> {calDisputeFee}{' '}
        {coinInfo[COIN.XEC].ticker}
      </Typography>
      {order?.buyerDepositTx && (
        <Typography variant="body1">
          <span className="prefix">Buyer security deposit ({securityDepositPercentage}%):</span> {calDisputeFee}{' '}
          {coinInfo[COIN.XEC].ticker}
        </Typography>
      )}
      <Typography className="payment-method-wrap" variant="body1">
        <span className="prefix">Payment method:</span>
        <Button className="btn-payment" size="small" color="success" variant="outlined">
          {order?.paymentMethod.name}
        </Button>
        {order?.escrowOffer?.coinOthers && (
          <Button className="btn-payment" size="small" color="success" variant="outlined">
            {order.escrowOffer.coinOthers}
          </Button>
        )}
        {order?.escrowOffer?.paymentApp && (
          <Button size="small" color="success" variant="outlined">
            {order.escrowOffer.paymentApp}
          </Button>
        )}
      </Typography>
      {selectedWalletPath?.hash160 === order?.sellerAccount?.hash160 &&
        showPrice &&
        ((order?.escrowOrderStatus === EscrowOrderStatus.Pending && !isBuyOffer) ||
          order?.escrowOrderStatus === EscrowOrderStatus.Escrow) && (
          <Typography variant="body1">
            <span className="prefix">Margin of current price:</span> {marginCurrentPrice.toFixed(2)}%
          </Typography>
        )}
      <Typography variant="body1">
        <span className="prefix">Status: </span>
        {orderStatus()}
      </Typography>
      {order?.escrowOrderStatus !== EscrowOrderStatus.Pending && (
        <React.Fragment>
          {EscrowAddressLink('Escrow address', order?.escrowAddress)}
          {EscrowAddressLink('Seller security deposit address', order?.escrowFeeAddress)}
          {order?.buyerDepositTx &&
            EscrowAddressLink('Buyer security deposit address', order?.escrowBuyerDepositFeeAddress)}
        </React.Fragment>
      )}
      {paymentDetailInfo() !== null && (
        <Typography>
          <span className="prefix">Payment-detail: </span>
          {paymentDetailInfo()}
        </Typography>
      )}
      {pathname !== '/order-detail' && (
        <Button
          className="btn-view-order"
          variant="contained"
          onClick={() => router.push(`/order-detail?id=${order.id}`)}
        >
          View
        </Button>
      )}
    </OrderDetailWrap>
  );
};

export default OrderDetailInfo;
