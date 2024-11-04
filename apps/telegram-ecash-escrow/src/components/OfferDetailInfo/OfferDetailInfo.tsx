'use client';

import { Post } from '@bcpros/redux-store';
import styled from '@emotion/styled';
import { Button, Typography } from '@mui/material';

const OrderDetailWrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;

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

const OrderDetailInfo = ({ key, post }: { key: string; post: Post }) => {
  return (
    <OrderDetailWrap>
      <Typography variant="body1">
        <span className="prefix">No: </span> {post.id}
      </Typography>
      <Typography variant="body1">
        <span className="prefix">Offered At: </span>
        {post.createdAt}
      </Typography>
      <Typography variant="body1">
        <span className="prefix">Price: </span>Market price + 5%
      </Typography>
      <Typography variant="body1">
        <span className="prefix">Amount: </span>20M XEC
      </Typography>
      <Typography variant="body1">
        <span className="prefix">Message: </span>
        {post.offer?.message}
      </Typography>
      <div className="payment-group-btns">
        {post.offer?.paymentMethods.map(method => {
          return (
            <Button key={method.id} className="cash-in-btn" size="small" color="success" variant="outlined">
              {method.paymentMethod.name}
            </Button>
          );
        })}
      </div>
    </OrderDetailWrap>
  );
};

export default OrderDetailInfo;
