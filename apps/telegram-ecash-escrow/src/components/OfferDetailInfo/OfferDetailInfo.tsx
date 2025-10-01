'use client';

import { Post } from '@bcpros/redux-store';
import styled from '@emotion/styled';
import { Button, Typography } from '@mui/material';
import renderTextWithLinks from '@/src/utils/linkHelpers';
import React from 'react';
import { formatNumber, getOrderLimitText } from '@/src/store/util';
import { GOODS_SERVICES_UNIT } from '@bcpros/lixi-models';
import { DEFAULT_TICKER_GOODS_SERVICES } from '@/src/store/constants';
import useOfferPrice from '@/src/hooks/useOfferPrice';

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
  // Price rendering logic mirrors OfferItem: handle Goods & Services and market/detailed price
  const { showPrice: _showPrice, amountPer1MXEC, amountXECGoodsServices, isGoodsServices: _isGoodsServices } =
    useOfferPrice({ paymentInfo: post?.offer, inputAmount: 1 });

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
        <span className="prefix">Price: </span>
        {_isGoodsServices ? (
          <>
            {formatNumber(amountXECGoodsServices)} XEC / {GOODS_SERVICES_UNIT}{' '}
            {post?.offer?.priceGoodsServices && (post.offer?.tickerPriceGoodsServices ?? DEFAULT_TICKER_GOODS_SERVICES) !== DEFAULT_TICKER_GOODS_SERVICES ? (
              <span>({post.offer.priceGoodsServices} {post.offer.tickerPriceGoodsServices ?? 'USD'})</span>
            ) : null}
          </>
        ) : _showPrice ? (
          <>
            <span>
              ~ <span style={{ fontWeight: 'bold' }}>{amountPer1MXEC}</span>
            </span>{' '}
            ( Market price +{post?.offer?.marginPercentage ?? 0}% )
          </>
        ) : (
          <>Market price</>
        )}
      </Typography>
      <Typography variant="body1">
        <span className="prefix">Amount: </span>
        {getOrderLimitText(post.offer?.orderLimitMin, post.offer?.orderLimitMax, '')}
      </Typography>
      <Typography variant="body1">
        <span className="prefix">Message: </span>
        {renderTextWithLinks(post.offer?.message)}
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
