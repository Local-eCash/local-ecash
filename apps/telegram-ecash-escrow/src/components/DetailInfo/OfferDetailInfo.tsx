'use client';

import { COIN_OTHERS } from '@/src/store/constants';
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
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import { Button, IconButton, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useContext } from 'react';
import useAuthorization from '../Auth/use-authorization.hooks';
import { BackupModalProps } from '../Common/BackupModal';
import { BuyButtonStyled } from '../OfferItem/OfferItem';

const OfferDetailWrap = styled('div')(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
  cursor: 'pointer',
  background: theme.custom.bgItem,
  borderRadius: '10px',
  padding: '16px',
  marginBottom: '16px',

  '.first-line-offer': {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    margin: 0,
    paddingBottom: '0px',
    height: '1.5rem'
  },

  '.prefix': {
    fontSize: '14px',
    color: '#79869b'
  },

  '.payment-group-btns': {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '10px',
    button: {
      borderRadius: '10px',
      textTransform: 'capitalize'
    }
  }
}));

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

  const getCoinCurrency = () => {
    return (
      offerData?.localCurrency ??
      (offerData?.coinPayment?.includes(COIN_OTHERS) ? 'XEC' : offerData?.coinPayment) ??
      'XEC'
    );
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
      {offerData?.paymentMethods[0]?.paymentMethod?.id !== 5 && !offerData?.coinOthers && (
        <Typography variant="body1">
          <span className="prefix">Price: </span>
          Market price +{offerData?.marginPercentage}%
        </Typography>
      )}
      <Typography variant="body1">
        <span className="prefix">Min-max: </span>
        {formatNumber(offerData?.orderLimitMin)} {getCoinCurrency()} - {''}
        {formatNumber(offerData?.orderLimitMax)} {getCoinCurrency()}
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
        {offerData?.coinOthers && (
          <Button size="small" color="success" variant="outlined">
            {offerData.coinOthers}
          </Button>
        )}
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
