'use client';

import useOfferPrice from '@/src/hooks/useOfferPrice';
import { DEFAULT_TICKER_GOODS_SERVICES } from '@/src/store/constants';
import { SettingContext } from '@/src/store/context/settingProvider';
import { formatNumber, getOrderLimitText, showPriceInfo } from '@/src/store/util';
import renderTextWithLinks from '@/src/utils/linkHelpers';
import { GOODS_SERVICES_UNIT, PAYMENT_METHOD, getTickerText } from '@bcpros/lixi-models';
import {
  OfferStatus,
  OfferType,
  PostQueryItem,
  TimelineQueryItem,
  getSeedBackupTime,
  getSelectedAccountId,
  openActionSheet,
  openModal,
  useSliceDispatch as useLixiSliceDispatch,
  useSliceSelector as useLixiSliceSelector
} from '@bcpros/redux-store';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import { Button, IconButton, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import React, { useContext, useMemo } from 'react';
import useAuthorization from '../Auth/use-authorization.hooks';
import { BackupModalProps } from '../Common/BackupModal';
import { BuyButtonStyled } from '../OfferItem/OfferItem';

const OfferDetailWrap = styled('div')(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
  cursor: 'pointer',
  background: theme.custom.bgPrimary,
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

  '.action-section': {
    display: 'flex',
    justifyContent: 'space-between',
    button: {
      borderRadius: '10px',
      textTransform: 'capitalize'
    },

    '.payment-group-btns': {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '5px',
      pointerEvents: 'none'
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

  const selectedAccountId = useLixiSliceSelector(getSelectedAccountId);
  const lastSeedBackupTimeOnDevice = useLixiSliceSelector(getSeedBackupTime);
  const settingContext = useContext(SettingContext);
  const seedBackupTime = settingContext?.setting?.lastSeedBackupTime ?? lastSeedBackupTimeOnDevice ?? '';

  const postData = timelineItem?.data as PostQueryItem;
  const offerData = postData?.postOffer ?? post?.postOffer;
  const countryName = offerData?.location?.country;
  const stateName = offerData?.location?.adminNameAscii;
  const cityName = offerData?.location?.cityAscii;

  const isOwner = (postData ?? post)?.accountId === selectedAccountId;

  // Format fiat price without decimals and with thousands separators for display
  const formatFiatPrice = (price: number | string | undefined): string => {
    if (price == null || price === '') return '';
    const num = typeof price === 'string' ? parseFloat(price) : price;
    if (isNaN(num)) return String(price);
    return new Intl.NumberFormat('en-GB', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(Math.round(num));
  };

  const handleClickAction = e => {
    e.stopPropagation();
    dispatch(openActionSheet('OfferActionSheet', { post: postData }));
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

  const shouldShowPrice = useMemo(() => {
    return showPriceInfo(
      offerData?.paymentMethods[0]?.paymentMethod?.id,
      offerData?.coinPayment,
      offerData?.priceCoinOthers,
      offerData?.priceGoodsServices,
      offerData?.tickerPriceGoodsServices
    );
  }, [offerData]);

  const coinCurrency = useMemo(() => {
    return getTickerText(
      offerData?.localCurrency,
      offerData?.coinPayment,
      offerData?.coinOthers,
      offerData?.priceCoinOthers
    );
  }, [offerData]);

  const {
    showPrice: hookShowPrice,
    amountPer1MXEC,
    amountXECGoodsServices,
    isGoodsServices: _isGoodsServices
  } = useOfferPrice({ paymentInfo: offerData, inputAmount: 1 });

  // Determine the taker-facing button label and whether to show the XEC logo. For currency to currency offers, the Buy offers are showing as Sell for the taker, and Sell offers are showing as Buy.
  // For Goods & Services offers, taker label is reversed (Buy <-> Sell).
  const takerActionLabel = useMemo(() => {
    const baseLabel = offerData?.type === OfferType.Buy ? 'Sell' : 'Buy';
    return _isGoodsServices ? (baseLabel === 'Buy' ? 'Sell' : 'Buy') : baseLabel;
  }, [offerData?.type, _isGoodsServices]);

  return (
    <OfferDetailWrap onClick={() => router.push(`/offer-detail?id=${offerData.postId}`)}>
      <div className="first-line-offer">
        <Typography variant="body1">
          <span className="prefix">Headline: </span>
          {renderTextWithLinks(offerData?.message, { loadImages: true })}
        </Typography>
        {isItemTimeline && (
          <IconButton onClick={e => handleClickAction(e)}>
            <MoreHorizIcon />
          </IconButton>
        )}
      </div>
      {shouldShowPrice && (
        <Typography variant="body1">
          <span className="prefix">Price: </span>
          {_isGoodsServices ? (
            <>
              {formatNumber(amountXECGoodsServices)} XEC / {GOODS_SERVICES_UNIT}{' '}
              {offerData?.priceGoodsServices &&
              (offerData?.tickerPriceGoodsServices ?? DEFAULT_TICKER_GOODS_SERVICES) !==
                DEFAULT_TICKER_GOODS_SERVICES ? (
                <span>
                  ({formatFiatPrice(offerData.priceGoodsServices)} {offerData.tickerPriceGoodsServices ?? 'USD'})
                </span>
              ) : null}
            </>
          ) : hookShowPrice ? (
            <>
              <span>
                ~ <span style={{ fontWeight: 'bold' }}>{amountPer1MXEC}</span>
              </span>{' '}
              ( Market price {(offerData?.marginPercentage ?? 0) >= 0 ? '+' : ''}
              {offerData?.marginPercentage ?? 0}% )
            </>
          ) : (
            <>Market price</>
          )}
        </Typography>
      )}
      <Typography variant="body1">
        <span className="prefix">Min-max: </span>
        {getOrderLimitText(offerData?.orderLimitMin, offerData?.orderLimitMax, coinCurrency)}
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
          {renderTextWithLinks(offerData.noteOffer, { loadImages: true })}
        </Typography>
      )}

      <div className="action-section">
        {postData?.postOffer.status === OfferStatus.Archive ? (
          <Button size="small" color="info" variant="contained" fullWidth disabled>
            <Typography variant="body1" style={{ fontWeight: 'bold' }}>
              <span style={{ fontSize: '14px' }}>Archived</span>
            </Typography>
          </Button>
        ) : (
          <>
            <div className="payment-group-btns">
              {isOwner && (
                <React.Fragment>
                  <Button size="small" color="info" variant="outlined">
                    <Typography variant="body1" style={{ fontWeight: 'bold' }}>
                      <span style={{ fontSize: '14px' }}>{offerData?.hideFromHome ? 'Unlisted' : 'Listed'}</span>
                    </Typography>
                  </Button>
                  <Button size="small" color="info" variant="outlined">
                    <Typography variant="body1" style={{ fontWeight: 'bold' }}>
                      <span style={{ fontSize: '14px' }}>{offerData?.type == OfferType.Buy ? 'Buy' : 'Sell'}</span>
                    </Typography>
                  </Button>
                </React.Fragment>
              )}
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
              {offerData?.paymentApp && (
                <Button size="small" color="success" variant="outlined">
                  {offerData.paymentApp}
                </Button>
              )}
            </div>
            {isShowBuyButton && (
              // Takers always see the opposite action; Goods & Services still hide the XEC logo
              <BuyButtonStyled style={{ height: 'fit-content' }} variant="contained" onClick={e => handleBuyClick(e)}>
                {takerActionLabel}
                {offerData?.paymentMethods?.[0]?.paymentMethod?.id === PAYMENT_METHOD.GOODS_SERVICES ? null : (
                  <Image width={25} height={25} src="/eCash.svg" alt="" />
                )}
              </BuyButtonStyled>
            )}
          </>
        )}
      </div>
    </OfferDetailWrap>
  );
};

export default OfferDetailInfo;
