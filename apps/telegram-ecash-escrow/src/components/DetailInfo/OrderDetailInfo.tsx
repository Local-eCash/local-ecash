'use client';

import { COIN, coinInfo } from '@bcpros/lixi-models';
import {
  DisputeStatus,
  EscrowOrderQueryItem,
  fiatCurrencyApi,
  getSelectedAccount,
  getSelectedWalletPath,
  useSliceSelector as useLixiSliceSelector
} from '@bcpros/redux-store';
import styled from '@emotion/styled';
import { Button, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const OrderDetailWrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  cursor: pointer;

  background: linear-gradient(rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.15));
  border-radius: 10px;
  padding: 16px;
  margin-bottom: 16px;

  .prefix {
    font-size: 14px;
    color: #79869b;
  }

  .btn-payment {
    border-radius: 16px;
    font-size: 12px;
    text-transform: none;
  }

  .payment-method-wrap {
    display: flex;
    gap: 10px;
    align-items: center;
  }

  .btn-order-type {
    font-size: 12px;
    border-radius: 16px;
    text-transform: none;
  }

  .order-first-line {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
`;

type OrderItemProps = {
  item?: EscrowOrderQueryItem;
};

const OrderDetailInfo = ({ item }: OrderItemProps) => {
  const order = item;
  const router = useRouter();
  const [rateData, setRateData] = useState(null);
  const [marginCurrentPrice, setMarginCurrentPrice] = useState(0);

  const selectedWalletPath = useLixiSliceSelector(getSelectedWalletPath);
  const selectedAccount = useLixiSliceSelector(getSelectedAccount);

  const { useGetFiatRateQuery } = fiatCurrencyApi;
  const { data: fiatData } = useGetFiatRateQuery();

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
    let amountXEC = 1000000;
    let amountCoinOrCurrency = 0;
    //if payment is crypto, we convert from coin => USD
    if (order?.escrowOffer?.coinPayment) {
      const coinPayment = order?.escrowOffer.coinPayment.toLowerCase();
      const rateArrayCoin = rateData.find(item => item.coin === coinPayment);
      const rateArrayXec = rateData.find(item => item.coin === 'xec');
      const latestRateCoin = rateArrayCoin?.rates?.reduce((max, item) => (item.ts > max.ts ? item : max));
      const latestRateXec = rateArrayXec?.rates?.reduce((max, item) => (item.ts > max.ts ? item : max));

      amountCoinOrCurrency = (latestRateXec?.rate * amountXEC) / latestRateCoin?.rate; //1M XEC (USD) / rateCoin (USD)
    } else {
      //convert from currency to XEC
      const rateArrayXec = rateData.find(item => item.coin === 'xec');
      const latestRateXec = rateArrayXec?.rates?.reduce((max, item) => (item.ts > max.ts ? item : max));
      amountCoinOrCurrency = amountXEC * latestRateXec?.rate;
    }

    const compactNumber = order.price.match(/[\d.]+[BMK]?/);
    const revertPriceOrder = revertCompactNumber(compactNumber[0]);

    //to calculate margin: (b - a) / a * 100
    const marginMarketPriceAndOrderPrice = ((revertPriceOrder - amountCoinOrCurrency) / amountCoinOrCurrency) * 100;
    setMarginCurrentPrice(marginMarketPriceAndOrderPrice);
  };

  //get rate data
  useEffect(() => {
    //just set if seller
    if (selectedWalletPath?.hash160 === order?.sellerAccount?.hash160) {
      const rateData = fiatData?.getFiatRate?.find(
        item => item.currency === (order?.escrowOffer?.localCurrency ?? 'USD')
      );
      setRateData(rateData?.fiatRates);
    }
  }, [order?.escrowOffer?.localCurrency, fiatData?.getFiatRate]);

  //convert to XEC
  useEffect(() => {
    if (order.paymentMethod.id !== 5) {
      convertXECToAmount();
    }
  }, [rateData]);

  return (
    <OrderDetailWrap onClick={() => router.push(`/order-detail?id=${order.id}`)}>
      <Typography className="order-first-line" variant="body1">
        <div>
          <span className="prefix">No: </span>
          {order.id}
        </div>
        <div className="order-type">
          {order.sellerAccount.id === selectedAccount?.id && (
            <Button className="btn-order-type" size="small" color="info" variant="outlined">
              Sell Order
            </Button>
          )}
          {order.buyerAccount.id === selectedAccount?.id && (
            <Button className="btn-order-type" size="small" color="info" variant="outlined">
              Buy Order
            </Button>
          )}
        </div>
      </Typography>
      <Typography variant="body1">
        <span className="prefix">Offer: </span>
        {order.escrowOffer.message}
      </Typography>
      <Typography variant="body1">
        <span className="prefix">Ordered by: </span>
        {order.buyerAccount.telegramUsername}
      </Typography>
      <Typography variant="body1">
        <span className="prefix">Ordered at: </span>
        {new Date(order.createdAt).toLocaleString('en-US')}
      </Typography>
      {order?.paymentMethod?.id !== 5 && (
        <Typography variant="body1">
          <span className="prefix">Price: </span>
          {order.price}
        </Typography>
      )}
      <Typography variant="body1">
        <span className="prefix">Order amount:</span> {order.amount} {coinInfo[COIN.XEC].ticker}
      </Typography>
      {order.paymentMethod.id !== 5 && (
        <Typography variant="body1">
          <span className="prefix">Payment amount:</span> {order.amountCoinOrCurrency}{' '}
          {order?.escrowOffer?.coinPayment ?? order?.escrowOffer?.localCurrency ?? 'XEC'}
        </Typography>
      )}
      <Typography className="payment-method-wrap" variant="body1">
        <span className="prefix">Payment method:</span>
        <Button className="btn-payment" size="small" color="success" variant="outlined">
          {order.paymentMethod.name}
        </Button>
      </Typography>
      {selectedWalletPath?.hash160 === order?.sellerAccount?.hash160 && order.paymentMethod.id !== 5 && (
        <Typography variant="body1">
          <span className="prefix">Margin of current price:</span> {marginCurrentPrice.toFixed(2)}%
        </Typography>
      )}
      {order?.message && (
        <Typography variant="body1">
          <span className="prefix">Message: </span>
          {order.message}
        </Typography>
      )}
      <Typography variant="body1">
        <span className="prefix">Status: </span>
        {order?.dispute && order.dispute?.status === DisputeStatus.Active
          ? 'Dispute'
          : order.escrowOrderStatus?.toLowerCase()?.replace(/^./, char => char.toUpperCase())}
      </Typography>
    </OrderDetailWrap>
  );
};

export default OrderDetailInfo;
