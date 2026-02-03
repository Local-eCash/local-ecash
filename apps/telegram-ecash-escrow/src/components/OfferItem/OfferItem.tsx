'use client';

import useOfferPrice from '@/src/hooks/useOfferPrice';
import {
  COIN_OTHERS,
  COIN_USD_STABLECOIN,
  COIN_USD_STABLECOIN_TICKER,
  DEFAULT_TICKER_GOODS_SERVICES
} from '@/src/store/constants';
import { SettingContext } from '@/src/store/context/settingProvider';
import { formatNumber, getOrderLimitText } from '@/src/store/util';
import renderTextWithLinks from '@/src/utils/linkHelpers';
import { GOODS_SERVICES_UNIT } from '@bcpros/lixi-models';
import {
  OfferStatus,
  OfferType,
  PostQueryItem,
  Role,
  TimelineQueryItem,
  accountsApi,
  getSeedBackupTime,
  getSelectedWalletPath,
  openModal,
  useSliceDispatch as useLixiSliceDispatch,
  useSliceSelector as useLixiSliceSelector
} from '@bcpros/redux-store';
import ArrowCircleUpRoundedIcon from '@mui/icons-material/ArrowCircleUpRounded';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Button, Card, CardContent, Collapse, IconButton, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import React, { useContext, useEffect } from 'react';
import useAuthorization from '../Auth/use-authorization.hooks';
import { BackupModalProps } from '../Common/BackupModal';

const CardWrapper = styled(Card)(({ theme }) => ({
  marginTop: 16,
  backgroundColor: theme.custom.bgPrimary,
  borderRadius: 16,

  '.prefix': {
    fontSize: '12px',
    color: '#79869b'
  },

  '.MuiCardContent-root': {
    padding: '16px 16px 0 16px',

    '.payment-group-btns': {
      display: 'flex',
      flexWrap: 'wrap',
      gap: 5,
      '& button': {
        borderRadius: '10px'
      },
      pointerEvents: 'none'
    }
  },

  '.MuiCollapse-root': {
    '.MuiCardContent-root': {
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      padding: '8px 16px 0'
    }
  },

  '.action-section': {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '12px 16px',
    alignItems: 'center',
    gap: '10px'
  }
}));

export const BuyButtonStyled = styled(Button, {
  shouldForwardProp: prop => prop !== 'actionType'
})<{ actionType?: 'buy' | 'sell' }>(({ theme, actionType }) => {
  let bgColor = '#0076c4';
  let shadowColor = '#0076c4';
  let hoverColor = '#005c99';

  if (actionType === 'sell') {
    bgColor = theme.palette.error.main;
    shadowColor = theme.palette.error.main;
    hoverColor = theme.palette.error.dark;
  } else if (actionType === 'buy') {
    bgColor = theme.palette.success.main;
    shadowColor = theme.palette.success.main;
    hoverColor = theme.palette.success.dark;
  }

  return {
    display: 'flex',
    gap: 8,
    fontWeight: 600,
    margin: 0,
    background: bgColor,
    width: 'fit-content',
    filter: `drop-shadow(0px 0px 3px ${shadowColor})`,
    color: 'white',
    boxShadow: 'none',
    borderRadius: '12px',
    fontSize: '13px',

    '&:hover': {
      backgroundColor: hoverColor
    },

    '&:disabled': {
      backgroundColor: theme.palette.action.disabledBackground,
      color: theme.palette.action.disabled
    }
  };
});

const OfferShowWrapItem = styled('div')(({ theme }) => ({
  backdropFilter: 'blur(4px)',
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
  '.push-offer-wrap, .minmax-collapse-wrap': {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  '.username, .push-offer-wrap': {
    cursor: 'pointer',
    textDecoration: 'underline'
  },

  '.reputation-account': {
    fontSize: '11px',
    color: theme.custom.colorSecondary
  }
}));

type OfferItemProps = {
  timelineItem?: TimelineQueryItem;
};

export default function OfferItem({ timelineItem }: OfferItemProps) {
  const { status } = useSession();
  const askAuthorization = useAuthorization();
  const searchParams = useSearchParams();
  const router = useRouter();

  const dispatch = useLixiSliceDispatch();

  const post = timelineItem?.data as PostQueryItem;
  const offerData = post?.postOffer;
  const isBuyOffer = offerData?.type === OfferType.Buy;
  const countryName = offerData?.location?.country ?? offerData?.country?.name;
  const stateName = offerData?.location?.adminNameAscii;
  const cityName = offerData?.location?.cityAscii;

  const selectedWalletPath = useLixiSliceSelector(getSelectedWalletPath);
  const lastSeedBackupTimeOnDevice = useLixiSliceSelector(getSeedBackupTime);
  const settingContext = useContext(SettingContext);
  const seedBackupTime = settingContext?.setting?.lastSeedBackupTime ?? lastSeedBackupTimeOnDevice ?? '';

  const { useGetAccountByAddressQuery } = accountsApi;
  const { currentData: accountQueryData } = useGetAccountByAddressQuery(
    { address: selectedWalletPath?.xAddress },
    { skip: !selectedWalletPath }
  );

  // Offer price values from centralized hook
  const { showPrice, coinCurrency, amountPer1MXEC, amountXECGoodsServices, isGoodsServices } = useOfferPrice({
    paymentInfo: post?.postOffer,
    inputAmount: 1
  });

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
        isFromHome: true,
        offerId: post.id
      };
      if (!seedBackupTime || isGreaterThanOneMonth) {
        dispatch(openModal('BackupModal', backupModalProps));
        return;
      }
      dispatch(openModal('PlaceAnOrderModal', { post: post }));
    }
  };

  const [expanded, setExpanded] = React.useState(false);

  const handleBoost = async e => {
    e.stopPropagation();

    if (status === 'unauthenticated') {
      askAuthorization();

      return;
    }

    dispatch(openModal('BoostModal', { post: post }));
  };

  const handleExpandClick = e => {
    e.stopPropagation();
    setExpanded(!expanded);
  };

  const handleItemClick = () => {
    router.push(`/offer-detail?id=${offerData.postId}`);
  };

  const handleUserNameClick = e => {
    e?.stopPropagation();
    router.push(`/profile?address=${post?.account?.address}`);
  };

  // Use shared helpers from utils/linkHelpers

  //open placeAnOrderModal if offerId is in url
  useEffect(() => {
    if (searchParams.get('offerId') === post.id) {
      dispatch(openModal('PlaceAnOrderModal', { post }));
    }
  }, []);

  // Determine the taker-facing button label and whether to show the XEC logo. For currency to currency offers, the Buy offers are showing as Sell for the taker, and Sell offers are showing as Buy.
  // For Goods & Services offers, taker label is reversed (Buy <-> Sell).
  const baseLabel = offerData?.type === OfferType.Buy ? 'Sell' : 'Buy';
  const takerButtonLabel = isGoodsServices ? (baseLabel === 'Buy' ? 'Sell' : 'Buy') : baseLabel;

  const OfferItem = (
    <OfferShowWrapItem>
      <div className="push-offer-wrap">
        <Typography variant="body2" style={{ fontWeight: 'bold' }} onClick={handleItemClick}>
          {renderTextWithLinks(offerData?.message, { loadImages: expanded }) ?? ''}
        </Typography>
        {(accountQueryData?.getAccountByAddress.role === Role.Moderator ||
          post?.account.hash160 === selectedWalletPath?.hash160) && (
          <IconButton onClick={e => handleBoost(e)}>
            <ArrowCircleUpRoundedIcon />
          </IconButton>
        )}
      </div>
      <Typography variant="body2">
        <span className="prefix">{isBuyOffer ? 'Buyer' : 'Seller'}: </span>{' '}
        <span className="username" onClick={handleUserNameClick}>
          {settingContext?.allSettings?.[`${post?.account?.id.toString()}`]?.usePublicLocalUserName
            ? post?.account?.anonymousUsernameLocalecash
            : post?.account?.telegramUsername}
        </span>
        <span className="reputation-account"> - {post?.account?.accountStatsOrder?.completedOrder} trades</span>
      </Typography>
      <div className="minmax-collapse-wrap" onClick={e => handleExpandClick(e)}>
        <Typography variant="body2">
          <span className="prefix">Min / max: </span>
          {getOrderLimitText(offerData?.orderLimitMin, offerData?.orderLimitMax, coinCurrency)}
        </Typography>
        {expanded ? <ExpandLessIcon style={{ cursor: 'pointer' }} /> : <ExpandMoreIcon style={{ cursor: 'pointer' }} />}
      </div>
    </OfferShowWrapItem>
  );

  const OfferItemPaymentMethod = (
    <div className="payment-group-btns">
      {offerData?.paymentMethods &&
        offerData.paymentMethods?.length > 0 &&
        offerData.paymentMethods.map(item => {
          return (
            <Button
              size="small"
              variant="outlined"
              key={item.paymentMethod.name}
              sx={{ color: 'text.secondary', borderColor: 'text.secondary' }}
            >
              {item.paymentMethod.name}
            </Button>
          );
        })}

      {(offerData?.coinPayment === COIN_USD_STABLECOIN_TICKER || offerData?.coinPayment === COIN_OTHERS) && (
        <Button size="small" variant="outlined" sx={{ color: 'text.secondary', borderColor: 'text.secondary' }}>
          {offerData.coinPayment === COIN_USD_STABLECOIN_TICKER ? COIN_USD_STABLECOIN : COIN_OTHERS}
        </Button>
      )}

      {offerData?.coinOthers && (
        <Button size="small" variant="outlined" sx={{ color: 'text.secondary', borderColor: 'text.secondary' }}>
          {offerData.coinOthers}
        </Button>
      )}
      {offerData?.paymentApp && (
        <Button size="small" variant="outlined" sx={{ color: 'text.secondary', borderColor: 'text.secondary' }}>
          {offerData.paymentApp}
        </Button>
      )}
    </div>
  );

  if (offerData?.status == OfferStatus.Archive) return <div></div>;
  if (offerData?.hideFromHome) return <div></div>;
  //hide item have negative score
  if (post?.boostScore?.boostScore < 0) return <div></div>;

  return (
    <React.Fragment>
      <CardWrapper>
        <CardContent>{OfferItem}</CardContent>
        <Collapse in={expanded} timeout="auto" unmountOnExit className="hidden-item-wrap">
          <CardContent>
            {(countryName || stateName) && (
              <Typography variant="body2">
                <span className="prefix">Location: </span>
                {[cityName, stateName, countryName].filter(Boolean).join(', ')}
              </Typography>
            )}
            {offerData?.noteOffer && (
              <Typography variant="body2">
                <span className="prefix">Note: </span>
                {renderTextWithLinks(offerData.noteOffer, { loadImages: true })}
              </Typography>
            )}
          </CardContent>
        </Collapse>
        <CardContent>{OfferItemPaymentMethod}</CardContent>

        <Typography component={'div'} className="action-section">
          <Typography variant="body2">
            <span className="prefix">Price: </span>
            {isGoodsServices ? (
              // Goods/Services display
              <span style={{ fontWeight: 'bold' }}>
                {formatNumber(amountXECGoodsServices)} XEC / {GOODS_SERVICES_UNIT}{' '}
                {offerData?.priceGoodsServices &&
                (offerData?.tickerPriceGoodsServices ?? DEFAULT_TICKER_GOODS_SERVICES) !==
                  DEFAULT_TICKER_GOODS_SERVICES ? (
                  <span>
                    ({offerData.priceGoodsServices} {offerData.tickerPriceGoodsServices ?? 'USD'})
                  </span>
                ) : null}
              </span>
            ) : showPrice ? (
              // Show detailed price
              <>
                <span>
                  ~ <span style={{ fontWeight: 'bold' }}>{amountPer1MXEC}</span>
                </span>{' '}
                ( Market price {(post?.postOffer?.marginPercentage ?? 0) >= 0 ? '+' : ''}
                {post?.postOffer?.marginPercentage ?? 0}% )
              </>
            ) : (
              // Show simple market price
              <>Market price</>
            )}
          </Typography>
          <BuyButtonStyled
            variant="contained"
            onClick={e => handleBuyClick(e)}
            actionType={takerButtonLabel === 'Sell' ? 'sell' : 'buy'}
          >
            {takerButtonLabel}
            {!isGoodsServices && <Image width={25} height={25} src="/eCash.svg" alt="" />}
          </BuyButtonStyled>
        </Typography>
      </CardWrapper>
    </React.Fragment>
  );
}
