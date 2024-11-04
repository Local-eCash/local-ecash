'use client';

import {
  OfferStatus,
  openActionSheet,
  PostQueryItem,
  TimelineQueryItem,
  useSliceDispatch as useLixiSliceDispatch
} from '@bcpros/redux-store';
import styled from '@emotion/styled';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import { Button, IconButton, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';

const OfferDetailWrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  cursor: pointer;

  background: linear-gradient(rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.05));
  border-radius: 10px;
  padding: 16px;
  margin-bottom: 16px;

  .first-line-offer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin: 0;
    padding-bottom: 0px;
    height: 1.5rem;
  }

  .prefix {
    font-size: 14px;
    color: #79869b;
  }

  .payment-group-btns {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    button {
      border-radius: 10px;
      text-transform: capitalize;
    }
  }
`;

type OfferItemProps = {
  timelineItem?: TimelineQueryItem;
};

const OfferDetailInfo = ({ timelineItem }: OfferItemProps) => {
  const dispatch = useLixiSliceDispatch();
  const router = useRouter();
  const postData = timelineItem?.data as PostQueryItem;
  const offerData = postData?.postOffer;
  const countryName = offerData?.country?.name;
  const stateName = offerData?.state?.name;

  const handleClickAction = e => {
    e.stopPropagation();
    dispatch(openActionSheet('OfferActionSheet', { offer: offerData }));
  };

  return (
    <OfferDetailWrap onClick={() => router.push(`/offer-detail?id=${offerData.postId}`)}>
      <div className="first-line-offer">
        <Typography variant="body1">
          <span className="prefix">Headline: </span>
          {offerData?.message}
        </Typography>
        {offerData?.status === OfferStatus.Active && (
          <IconButton onClick={e => handleClickAction(e)}>
            <MoreHorizIcon />
          </IconButton>
        )}
      </div>
      <Typography variant="body1">
        <span className="prefix">Price: </span>
        Market price +{offerData?.marginPercentage}%
      </Typography>
      <Typography variant="body1">
        <span className="prefix">Min-max: </span>
        {offerData?.orderLimitMin} {offerData?.coinPayment ?? offerData?.localCurrency ?? 'XEC'} -{' '}
        {offerData?.orderLimitMax} {offerData?.coinPayment ?? offerData?.localCurrency ?? 'XEC'}
      </Typography>
      {(stateName || countryName) && (
        <Typography variant="body2">
          <span className="prefix">Location: </span>
          {[stateName, countryName].filter(Boolean).join(', ')}
        </Typography>
      )}
      {offerData?.noteOffer && (
        <Typography variant="body1">
          <span className="prefix">Note: </span>
          {offerData.noteOffer}
        </Typography>
      )}
      <div className="payment-group-btns">
        {offerData?.paymentMethods &&
          offerData.paymentMethods?.length > 0 &&
          offerData.paymentMethods.map(item => {
            return (
              <Button size="small" color="success" variant="outlined" key={item.paymentMethod.name}>
                {item.paymentMethod.name}
              </Button>
            );
          })}
      </div>
    </OfferDetailWrap>
  );
};

export default OfferDetailInfo;
