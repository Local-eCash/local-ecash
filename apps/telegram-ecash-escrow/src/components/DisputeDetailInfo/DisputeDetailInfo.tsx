'use client';

import { DisputeQueryItem, TimelineQueryItem } from '@bcpros/redux-store';
import styled from '@emotion/styled';
import { Typography } from '@mui/material';
import { useRouter } from 'next/navigation';

const DisputeDetailInfoWrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  cursor: pointer;

  background: linear-gradient(rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.05));
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
  const disputeData = timelineItem?.data as DisputeQueryItem;
  const orderOfDispute = disputeData?.escrowOrder;
  const offerOfDispute = orderOfDispute?.offer;
  const countryName = offerOfDispute?.location?.country;
  const stateName = offerOfDispute?.location?.adminNameAscii;
  const cityName = offerOfDispute?.location?.cityAscii;

  return (
    <DisputeDetailInfoWrap onClick={() => router.push(`/dispute-detail?id=${disputeData.id}`)}>
      <Typography variant="body1">
        <span className="prefix">Offer: </span> {offerOfDispute.message}
      </Typography>
      {(stateName || countryName) && (
        <Typography variant="body1">
          <span className="prefix">Location: </span>
          {[cityName, stateName, countryName].filter(Boolean).join(', ')}
        </Typography>
      )}
      <Typography variant="body1">
        <span className="prefix">Posted: </span> {new Date(disputeData.createdAt).toLocaleString('en-US')}
      </Typography>
      <Typography variant="body1" className="amount-escrowed">
        {orderOfDispute.amount} XEC escrowed!
      </Typography>
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
