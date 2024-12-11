'use client';

import { SettingContext } from '@/src/store/context/settingProvider';
import {
  PostQueryItem,
  Role,
  TimelineQueryItem,
  accountsApi,
  fiatCurrencyApi,
  getSelectedWalletPath,
  openModal,
  useSliceDispatch as useLixiSliceDispatch,
  useSliceSelector as useLixiSliceSelector
} from '@bcpros/redux-store';
import styled from '@emotion/styled';
import ArrowCircleUpRoundedIcon from '@mui/icons-material/ArrowCircleUpRounded';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Button, Card, CardContent, Collapse, IconButton, Typography } from '@mui/material';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import React, { useContext, useEffect, useState } from 'react';
import useAuthorization from '../Auth/use-authorization.hooks';
import PlaceAnOrderModal from '../PlaceAnOrderModal/PlaceAnOrderModal';

const CardWrapper = styled(Card)`
  margin-top: 16px;
  background-color: rgba(255, 255, 255, 0.08);
  border-radius: 16px;

  .prefix {
    font-size: 12px;
    color: #79869b;
  }

  .MuiCardContent-root {
    padding: 16px 16px 0 16px;
  }

  .MuiCollapse-root {
    .MuiCardContent-root {
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding: 8px 16px 0;
    }

    .payment-group-btns {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      button {
        border-radius: 10px;
      }
    }
  }

  .action-section {
    display: flex;
    justify-content: space-between;
    padding: 12px 16px;
    align-items: center;
    gap: 10px;

    .place-order-btn {
      display: flex;
      gap: 8px;
      font-weight: 600;
      margin: 0;
      background: #0076c4;
      width: fit-content;
      filter: drop-shadow(0px 0px 3px #0076c4);
      color: white;
      box-shadow: none;
      border-radius: 12px;
      font-size: 13px;
    }
  }
`;

const OfferShowWrapItem = styled.div`
  backdrop-filter: blur(4px);
  display: flex;
  flex-direction: column;
  gap: 8px;
  .push-offer-wrap,
  .minmax-collapse-wrap {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
`;

type OfferItemProps = {
  timelineItem?: TimelineQueryItem;
};

export default function OfferItem({ timelineItem }: OfferItemProps) {
  const dispatch = useLixiSliceDispatch();
  const post = timelineItem?.data as PostQueryItem;
  const offerData = post?.postOffer;
  const countryName = offerData?.location?.country;
  const stateName = offerData?.location?.adminNameAscii;
  const cityName = offerData?.location?.cityAscii;
  const { status } = useSession();
  const askAuthorization = useAuthorization();
  const { useGetAccountByAddressQuery } = accountsApi;
  const selectedWalletPath = useLixiSliceSelector(getSelectedWalletPath);
  const settingContext = useContext(SettingContext);
  const seedBackupTime = settingContext?.setting?.lastSeedBackupTime ?? '';

  const { currentData: accountQueryData } = useGetAccountByAddressQuery(
    { address: selectedWalletPath?.xAddress },
    { skip: !selectedWalletPath }
  );

  const [open, setOpen] = useState<boolean>(false);
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

      if (!seedBackupTime || isGreaterThanOneMonth) {
        dispatch(openModal('BackupModal', {}));
        return;
      }
      setOpen(true);
    }
  };

  const [expanded, setExpanded] = React.useState(false);

  const handleBoost = async () => {
    if (status === 'unauthenticated') {
      askAuthorization();

      return;
    }

    const amountBoost = 100;
    dispatch(openModal('BoostModal', { amount: amountBoost, post: post }));
  };

  const handleExpandClick = () => {
    setExpanded(!expanded);
  };

  const convertXECToAmount = async () => {
    if (!rateData) return 0;
    let amountXEC = 1000000;
    let amountCoinOrCurrency = 0;
    //if payment is crypto, we convert from coin => USD
    if (post?.postOffer?.coinPayment) {
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
    setCoinCurrency(post?.postOffer?.localCurrency ?? post?.postOffer?.coinPayment ?? 'XEC');
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

  const OfferItem = (
    <OfferShowWrapItem>
      <div className="push-offer-wrap">
        <Typography variant="body2">
          <span className="prefix">By: </span> {post?.account?.telegramUsername ?? ''}
        </Typography>
        {(accountQueryData?.getAccountByAddress.role === Role.Moderator ||
          post?.account.hash160 === selectedWalletPath?.hash160) && (
          <IconButton onClick={handleBoost}>
            <ArrowCircleUpRoundedIcon />
          </IconButton>
        )}
      </div>
      <Typography variant="body2">
        <span className="prefix">Headline: </span>
        {offerData?.message}
      </Typography>
      <div className="minmax-collapse-wrap">
        <Typography variant="body2">
          <span className="prefix">Min / max: </span>
          {offerData?.orderLimitMin} {coinCurrency} - {offerData?.orderLimitMax} {coinCurrency}
        </Typography>
        {expanded ? (
          <ExpandLessIcon onClick={handleExpandClick} style={{ cursor: 'pointer' }} />
        ) : (
          <ExpandMoreIcon onClick={handleExpandClick} style={{ cursor: 'pointer' }} />
        )}
      </div>
    </OfferShowWrapItem>
  );

  return (
    <React.Fragment>
      <CardWrapper onClick={handleExpandClick}>
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
            </div>
          </CardContent>
        </Collapse>

        <Typography component={'div'} className="action-section">
          <Typography variant="body2">
            <span className="prefix">Price: </span>Market price +{post?.postOffer?.marginPercentage ?? 0}%{' '}
            {coinCurrency !== 'XEC' && (
              <span>
                (~ {amountPer1MXEC} {coinCurrency} / 1M XEC)
              </span>
            )}
          </Typography>
          <Button className="place-order-btn" color="success" variant="contained" onClick={e => handleBuyClick(e)}>
            Buy
            <Image width={25} height={25} src="/eCash.svg" alt="" />
          </Button>
        </Typography>
      </CardWrapper>

      <PlaceAnOrderModal isOpen={open} onDissmissModal={value => setOpen(value)} post={post} />
    </React.Fragment>
  );
}
