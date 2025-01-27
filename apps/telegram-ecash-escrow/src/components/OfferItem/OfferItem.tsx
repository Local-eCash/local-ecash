'use client';

import { COIN_OTHERS, COIN_USD_STABLECOIN_TICKER } from '@/src/store/constants';
import { SettingContext } from '@/src/store/context/settingProvider';
import { formatNumber } from '@/src/store/util';
import {
  OfferStatus,
  PostQueryItem,
  Role,
  TimelineQueryItem,
  accountsApi,
  fiatCurrencyApi,
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
import React, { useContext, useEffect, useState } from 'react';
import useAuthorization from '../Auth/use-authorization.hooks';
import { BackupModalProps } from '../Common/BackupModal';

const CardWrapper = styled(Card)(({ theme }) => ({
  marginTop: 16,
  backgroundColor: theme.custom.bgItem,
  borderRadius: 16,

  '.prefix': {
    fontSize: '12px',
    color: '#79869b'
  },

  '.MuiCardContent-root': {
    padding: '16px 16px 0 16px'
  },

  '.MuiCollapse-root': {
    '.MuiCardContent-root': {
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      padding: '8px 16px 0'
    },

    '.payment-group-btns': {
      display: 'flex',
      flexWrap: 'wrap',
      gap: 10,
      '& button': {
        borderRadius: '10px'
      }
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

export const BuyButtonStyled = styled(Button)(({ theme }) => ({
  display: 'flex',
  gap: 8,
  fontWeight: 600,
  margin: 0,
  background: '#0076c4',
  width: 'fit-content',
  filter: 'drop-shadow(0px 0px 3px #0076c4)',
  color: 'white',
  boxShadow: 'none',
  borderRadius: '12px',
  fontSize: '13px',

  '&:disabled': {
    backgroundColor: theme.palette.action.disabledBackground,
    color: theme.palette.action.disabled
  }
}));

const OfferShowWrapItem = styled('div')(({ theme }) => ({
  backdropFilter: 'blur(4px)',
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
  '.push-offer-wrap, .minmax-collapse-wrap': {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
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

  const [coinCurrency, setCoinCurrency] = useState('XEC');
  const [rateData, setRateData] = useState(null);
  const [amountPer1MXEC, setAmountPer1MXEC] = useState('');

  const { useGetFiatRateQuery } = fiatCurrencyApi;
  const { data: fiatData } = useGetFiatRateQuery();

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

  const convertXECToAmount = async () => {
    if (!rateData) return 0;
    let amountXEC = 1000000;
    let amountCoinOrCurrency = 0;
    //if payment is crypto, we convert from coin => USD
    if (post?.postOffer?.coinPayment && post?.postOffer?.coinPayment !== COIN_USD_STABLECOIN_TICKER) {
      const coinPayment = post.postOffer.coinPayment.toLowerCase();
      const rateArrayCoin = rateData.find(item => item.coin === coinPayment);
      const rateArrayXec = rateData.find(item => item.coin === 'xec');
      const latestRateCoin = rateArrayCoin?.rates?.reduce((max, item) => (item.ts > max.ts ? item : max));
      const latestRateXec = rateArrayXec?.rates?.reduce((max, item) => (item.ts > max.ts ? item : max));

      amountCoinOrCurrency = (latestRateXec?.rate * amountXEC) / latestRateCoin?.rate; //1M XEC (USD) / rateCoin (USD)
    } else {
      //convert from currency to XEC
      const rateArrayXec = rateData.find(item => item.coin === 'xec');
      const latestRateXec = rateArrayXec?.rates?.reduce((max, item) => (item.ts > max.ts ? item : max));
      amountCoinOrCurrency = amountXEC * latestRateXec?.rate;
    }

    const compactNumberFormatter = new Intl.NumberFormat('en-GB', {
      notation: 'compact',
      compactDisplay: 'short'
    });

    const amountWithPercentage = amountCoinOrCurrency * (1 + post?.postOffer?.marginPercentage / 100);
    const amountFormatted = compactNumberFormatter.format(amountWithPercentage);
    setAmountPer1MXEC(amountFormatted);
  };

  useEffect(() => {
    setCoinCurrency(
      post?.postOffer?.localCurrency ??
        (post?.postOffer?.coinPayment?.includes(COIN_OTHERS) ? 'XEC' : post?.postOffer?.coinPayment) ??
        'XEC'
    );
  }, []);

  //convert to XEC
  useEffect(() => {
    convertXECToAmount();
  }, [rateData]);

  //get rate data
  useEffect(() => {
    const rateData = fiatData?.getFiatRate?.find(item => item.currency === (post?.postOffer?.localCurrency ?? 'USD'));
    setRateData(rateData?.fiatRates);
  }, [post?.postOffer?.localCurrency, fiatData?.getFiatRate]);

  //open placeAnOrderModal if offerId is in url
  useEffect(() => {
    if (searchParams.get('offerId') === post.id) {
      dispatch(openModal('PlaceAnOrderModal', { post }));
    }
  }, []);

  const OfferItem = (
    <OfferShowWrapItem>
      <div className="push-offer-wrap">
        <Typography variant="body2">
          <span className="prefix">By: </span> {post?.account?.telegramUsername ?? ''}
        </Typography>
        {(accountQueryData?.getAccountByAddress.role === Role.Moderator ||
          post?.account.hash160 === selectedWalletPath?.hash160) && (
          <IconButton onClick={e => handleBoost(e)}>
            <ArrowCircleUpRoundedIcon />
          </IconButton>
        )}
      </div>
      <Typography variant="body2">
        <span className="prefix">Headline: </span>
        {offerData?.message}
      </Typography>
      <div className="minmax-collapse-wrap" onClick={e => handleExpandClick(e)}>
        <Typography variant="body2">
          <span className="prefix">Min / max: </span>
          {formatNumber(offerData?.orderLimitMin)} {coinCurrency} - {formatNumber(offerData?.orderLimitMax)}{' '}
          {coinCurrency}
        </Typography>
        {expanded ? <ExpandLessIcon style={{ cursor: 'pointer' }} /> : <ExpandMoreIcon style={{ cursor: 'pointer' }} />}
      </div>
    </OfferShowWrapItem>
  );

  if (offerData?.status == OfferStatus.Archive) return <div></div>;
  if (offerData?.hideFromHome) return <div></div>;
  //hide item have negative score
  if (post?.boostScore?.boostScore < 0) return <div></div>;

  return (
    <React.Fragment>
      <CardWrapper onClick={handleItemClick}>
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
            </div>
          </CardContent>
        </Collapse>

        <Typography component={'div'} className="action-section">
          {offerData?.paymentMethods[0]?.paymentMethod?.id !== 5 && offerData?.coinPayment !== COIN_OTHERS ? (
            <Typography variant="body2">
              <span className="prefix">Price: </span>Market price +{post?.postOffer?.marginPercentage ?? 0}%{' '}
              {coinCurrency !== 'XEC' && (
                <span>
                  (~ {amountPer1MXEC} {coinCurrency} / 1M XEC)
                </span>
              )}
            </Typography>
          ) : (
            <Typography variant="body2">
              <span className="prefix">Price: </span>Market price
            </Typography>
          )}
          <BuyButtonStyled variant="contained" onClick={e => handleBuyClick(e)}>
            Buy
            <Image width={25} height={25} src="/eCash.svg" alt="" />
          </BuyButtonStyled>
        </Typography>
      </CardWrapper>
    </React.Fragment>
  );
}
