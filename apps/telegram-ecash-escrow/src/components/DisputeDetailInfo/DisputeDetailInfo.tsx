'use client';

import { DisputeQueryItem, TimelineQueryItem } from '@bcpros/redux-store';
import styled from '@emotion/styled';
import { Typography } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

const DisputeDetailInfoWrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  cursor: pointer;

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

  .amount-escrowed {
    color: #66bb6a;
  }

  .amount-seller {
    color: #29b6f6;
  }

  .amount-buyer {
    color: #f44336;
  }
`;

type DisputeItemProps = {
  timelineItem?: TimelineQueryItem;
};

const DisputeDetailInfo = ({ timelineItem }: DisputeItemProps) => {
  const router = useRouter();
  const [isOpenModal, setIsOpenModal] = useState<boolean>(false);
  const disputeData = timelineItem?.data as DisputeQueryItem;
  const orderOfDispute = disputeData?.escrowOrder;
  const offerOfDispute = orderOfDispute?.offer;
  const countryName = offerOfDispute?.country.name;
  const stateName = offerOfDispute?.state.name;

  return (
    <DisputeDetailInfoWrap onClick={() => router.push(`/dispute-detail?id=${disputeData.id}`)}>
      {/* <Typography variant="body1">
          <span className="prefix">Dispute by seller: </span>No show
        </Typography> */}
      <Typography variant="body1">
        <span className="prefix">Offer: </span> {offerOfDispute.message}
      </Typography>
      {/* <Typography variant="body1">
          <span className="prefix">Price: </span>USD 50/ 1M XEC
        </Typography> */}
      {/* <div className="payment-group-btns">
          <Button className="cash-in-btn" size="small" color="success" variant="outlined">
            Cash in person
          </Button>
          <Button className="bank-transfer-btn" size="small" color="warning" variant="outlined">
            Bank transfer
          </Button>
        </div> */}
      <Typography variant="body1">
        <span className="prefix">Location: </span>
        {[stateName, countryName].filter(Boolean).join(', ')}
      </Typography>
      <Typography variant="body1">
        <span className="prefix">Posted: </span> {offerOfDispute.createdAt}
      </Typography>
      <Typography variant="body1" className="amount-escrowed">
        {orderOfDispute.amount} XEC escrowed!
      </Typography>
      {/* <Typography variant="body1" className="amount-seller">
          200k XEC dispute fees by seller
        </Typography>
        <Typography variant="body1" className="amount-buyer">
          200k XEC dispute fees by buyer
        </Typography> */}
      <Typography variant="body1">
        <span className="prefix">Seller: </span> {orderOfDispute.sellerAccount.telegramUsername}
      </Typography>
      <Typography variant="body1">
        <span className="prefix">Buyer: </span> {orderOfDispute.buyerAccount.telegramUsername}
      </Typography>
    </DisputeDetailInfoWrap>
  );
};

export default DisputeDetailInfo;
