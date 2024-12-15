'use client';

import { SettingContext } from '@/src/store/context/settingProvider';
import { formatNumber } from '@/src/store/util';
import {
  OfferStatus,
  openActionSheet,
  openModal,
  PostQueryItem,
  TimelineQueryItem,
  useSliceDispatch as useLixiSliceDispatch
} from '@bcpros/redux-store';
import styled from '@emotion/styled';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import { Button, IconButton, Typography } from '@mui/material';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useContext } from 'react';
import useAuthorization from '../Auth/use-authorization.hooks';
import { BackupModalProps } from '../Common/BackupModal';
import { BuyButtonStyled } from '../OfferItem/OfferItem';

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
    justify-content: space-between;
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
  post?: PostQueryItem;
  isShowBuyButton?: boolean;
  isItemTimeline?: boolean;
};

const OfferDetailInfo = ({ timelineItem, post, isShowBuyButton = false, isItemTimeline = true }: OfferItemProps) => {
  const dispatch = useLixiSliceDispatch();
  const router = useRouter();
  const { status } = useSession();
  const askAuthorization = useAuthorization();

  const settingContext = useContext(SettingContext);
  const seedBackupTime = settingContext?.setting?.lastSeedBackupTime ?? '';

  const postData = timelineItem?.data as PostQueryItem;
  const offerData = postData?.postOffer ?? post?.postOffer;
  const countryName = offerData?.location?.country;
  const stateName = offerData?.location?.adminNameAscii;
  const cityName = offerData?.location?.cityAscii;

  const handleClickAction = e => {
    e.stopPropagation();
    dispatch(openActionSheet('OfferActionSheet', { offer: offerData }));
  };

  const handleBuyClick = e => {
    e.stopPropagation();

    if (status === 'loading') return;

    if (status === 'unauthenticated') {
      askAuthorization();
    } else {
      //check backup
      const oneMonthLater = new Date(seedBackupTime);
      oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);
      const currentDate = new Date();
      const isGreaterThanOneMonth = currentDate > oneMonthLater;

      const backupModalProps: BackupModalProps = {
        isFromHome: false,
        offerId: offerData?.postId
      };
      if (!seedBackupTime || isGreaterThanOneMonth) {
        dispatch(openModal('BackupModal', backupModalProps));
        return;
      }
      dispatch(openModal('PlaceAnOrderModal', { post: post }));
    }
  };

  return (
    <OfferDetailWrap onClick={() => router.push(`/offer-detail?id=${offerData.postId}`)}>
      <div className="first-line-offer">
        <Typography variant="body1">
          <span className="prefix">Headline: </span>
          {offerData?.message}
        </Typography>
        {offerData?.status === OfferStatus.Active && isItemTimeline && (
          <IconButton onClick={e => handleClickAction(e)}>
            <MoreHorizIcon />
          </IconButton>
        )}
      </div>
      {offerData?.paymentMethods[0]?.paymentMethod?.id !== 5 && (
        <Typography variant="body1">
          <span className="prefix">Price: </span>
          Market price +{offerData?.marginPercentage}%
        </Typography>
      )}
      <Typography variant="body1">
        <span className="prefix">Min-max: </span>
        {formatNumber(offerData?.orderLimitMin)} {offerData?.coinPayment ?? offerData?.localCurrency ?? 'XEC'} - {''}
        {formatNumber(offerData?.orderLimitMax)} {offerData?.coinPayment ?? offerData?.localCurrency ?? 'XEC'}
      </Typography>
      {(stateName || countryName) && (
        <Typography variant="body2">
          <span className="prefix">Location: </span>
          {[cityName, stateName, countryName].filter(Boolean).join(', ')}
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
        {isShowBuyButton && (
          <BuyButtonStyled variant="contained" onClick={e => handleBuyClick(e)}>
            Buy
            <Image width={25} height={25} src="/eCash.svg" alt="" />
          </BuyButtonStyled>
        )}
      </div>
    </OfferDetailWrap>
  );
};

export default OfferDetailInfo;
