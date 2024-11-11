'use client';

import { COIN, coinInfo } from '@bcpros/lixi-models';
import {
  EscrowOrderQueryItem,
  getSelectedWalletPath,
  useSliceSelector as useLixiSliceSelector
} from '@bcpros/redux-store';
import styled from '@emotion/styled';
import { Button, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';

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

  .cash-in-btn {
    margin-right: 8px;
    border-radius: 16px;
    font-size: 12px;
    text-transform: none;
  }

  .bank-transfer-btn {
    border-radius: 16px;
    font-size: 12px;
    text-transform: none;
  }
`;

type OrderItemProps = {
  item?: EscrowOrderQueryItem;
};

const OrderDetailInfo = ({ item }: OrderItemProps) => {
  const order = item;
  const router = useRouter();

  const selectedWalletPath = useLixiSliceSelector(getSelectedWalletPath);

  return (
    <OrderDetailWrap onClick={() => router.push(`/order-detail?id=${order.id}`)}>
      <Typography variant="body1">
        <span className="prefix">No: </span>
        {order.id}
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
      <Typography variant="body1">
        <span className="prefix">Price: </span>
        {order.price}
      </Typography>
      <Typography variant="body1">
        <span className="prefix">
          {selectedWalletPath?.hash160 === order?.sellerAccount?.hash160 ? 'Amount sending: ' : 'Amount receiving: '}
        </span>
        {order.amount} {coinInfo[COIN.XEC].ticker}
      </Typography>
      <Typography variant="body1">
        <span className="prefix">
          {selectedWalletPath?.hash160 === order?.sellerAccount?.hash160 ? 'Amount receiving: ' : 'Amount sending: '}{' '}
        </span>
        {order.amountCoinOrCurrency} {order?.escrowOffer?.coinPayment ?? order?.escrowOffer?.localCurrency ?? 'XEC'}
      </Typography>
      {order?.message && (
        <Typography variant="body1">
          <span className="prefix">Message: </span>
          {order.message}
        </Typography>
      )}
      <div className="payment-group-btns">
        <Button className="cash-in-btn" size="small" color="success" variant="outlined">
          {order.paymentMethod.name}
        </Button>
      </div>
    </OrderDetailWrap>
  );
};

export default OrderDetailInfo;
