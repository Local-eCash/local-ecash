'use client';

import FiatRateErrorBanner from '@/src/components/Common/FiatRateErrorBanner';
import ShoppingFilterComponent from '@/src/components/FilterOffer/ShoppingFilterComponent';
import Header from '@/src/components/Header/Header';
import OfferItem from '@/src/components/OfferItem/OfferItem';
import { ShoppingFilterConfig } from '@/src/shared/models/shoppingFilterConfig';
import { PAYMENT_METHOD } from '@bcpros/lixi-models';
import {
  OfferOrderField,
  OrderDirection,
  TimelineQueryItem,
  fiatCurrencyApi,
  getNewPostAvailable,
  offerApi,
  openModal,
  setNewPostAvailable,
  useInfiniteOfferFilterDatabaseQuery,
  useSliceDispatch as useLixiSliceDispatch,
  useSliceSelector as useLixiSliceSelector
} from '@bcpros/redux-store';
import styled from '@emotion/styled';
import CachedRoundedIcon from '@mui/icons-material/CachedRounded';
import SortIcon from '@mui/icons-material/Sort';
import { Badge, Box, CircularProgress, Skeleton, Slide, Typography } from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';
import MobileLayout from '../../components/layout/MobileLayout';
import { isShowAmountOrSortFilter } from '../../store/util';

const { useGetAllFiatRateQuery } = fiatCurrencyApi;

const WrapShopping = styled.div``;

const ShoppingPage = styled.div`
  position: relative;
  padding: 1rem;
  padding-bottom: 85px;
  min-height: 100svh;

  .MuiButton-root {
    text-transform: none;
  }

  .MuiIconButton-root {
    padding: 0 !important;

    &:hover {
      background: none;
      opacity: 0.8;
    }
  }
`;

const Section = styled.div`
  .title-offer {
    display: flex;
    justify-content: space-between;
    font-weight: 600;
  }
`;

const StyledBadge = styled(Badge)`
  background: #0f98f2;
  position: absolute;
  z-index: 1;
  left: 40%;
  top: 1rem;
  cursor: pointer;
  padding: 8px 13px;
  border-radius: 50px;
  display: flex;
  align-items: center;
  color: white;
  gap: 3px;

  .refresh-text {
    font-size: 14px;
    font-weight: bold;
  }
`;

export default function Shopping() {
  const newPostAvailable = useLixiSliceSelector(getNewPostAvailable);
  const [visible, setVisible] = useState(true);
  const dispatch = useLixiSliceDispatch();

  // Prefetch fiat rates in the background for better modal performance
  // This will cache the data so PlaceAnOrderModal can use it immediately
  const {
    data: fiatData,
    isError: fiatRateError,
    isLoading: isFiatRateLoading
  } = useGetAllFiatRateQuery(undefined, {
    // Polling disabled for performance - only fetch once on mount
    pollingInterval: 0,
    // Refetch on mount to ensure fresh data
    refetchOnMountOrArgChange: true
  });

  // Fixed filter config for shopping: only Goods & Services sell offers
  const [shoppingFilterConfig, setShoppingFilterConfig] = useState({
    isBuyOffer: true, // Buy offers (users wanting to buy XEC by selling goods/services - so shoppers can buy the goods)
    paymentMethodIds: [PAYMENT_METHOD.GOODS_SERVICES],
    tickerPriceGoodsServices: null, // NEW: Backend filter for G&S currency
    fiatCurrency: null,
    coin: null,
    amount: null,
    countryName: null,
    countryCode: null,
    stateName: null,
    adminCode: null,
    cityName: null,
    paymentApp: null,
    coinOthers: null,
    offerOrder: {
      field: OfferOrderField.Relevance,
      direction: OrderDirection.Desc
    }
  });

  const isShowSortIcon = isShowAmountOrSortFilter(shoppingFilterConfig);

  const {
    data: dataFilter,
    hasNext: hasNextFilter,
    isFetching: isFetchingFilter,
    fetchNext: fetchNextFilter,
    isLoading: isLoadingFilter,
    refetch
  } = useInfiniteOfferFilterDatabaseQuery({ first: 20, offerFilterInput: shoppingFilterConfig }, false);

  const loadMoreItemsFilter = () => {
    if (hasNextFilter && !isFetchingFilter) {
      fetchNextFilter();
    }
  };

  const handleRefresh = () => {
    dispatch(offerApi.api.util.resetApiState());
    refetch();
    dispatch(setNewPostAvailable(false));
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  };

  //reset flag for new-post when reload
  useEffect(() => {
    dispatch(setNewPostAvailable(false));
  }, []);

  const openSortDialog = () => {
    dispatch(openModal('SortOfferModal', {}));
  };

  const handleConfigChange = (config: ShoppingFilterConfig) => {
    setShoppingFilterConfig(prev => ({
      ...prev,
      ...config
    }));
  };

  const isSorted = useMemo(
    () =>
      shoppingFilterConfig?.offerOrder?.direction !== OrderDirection.Desc ||
      shoppingFilterConfig?.offerOrder?.field !== OfferOrderField.Relevance,
    [shoppingFilterConfig?.offerOrder]
  );

  return (
    <MobileLayout>
      <WrapShopping>
        <Slide direction="down" in={newPostAvailable && visible}>
          <StyledBadge className="badge-new-offer" color="info" onClick={handleRefresh}>
            <CachedRoundedIcon color="action" /> <span className="refresh-text">Refresh</span>
          </StyledBadge>
        </Slide>
        <ShoppingPage>
          <Header />

          <ShoppingFilterComponent filterConfig={shoppingFilterConfig} setFilterConfig={handleConfigChange} />

          {/* Show fiat rate error banner if service is down */}
          <FiatRateErrorBanner fiatData={fiatData} fiatRateError={fiatRateError} isLoading={isFiatRateLoading} />

          <Section>
            <Typography className="title-offer" variant="body1" component="div">
              <span>Goods & Services</span>
              {isShowSortIcon && (
                <SortIcon
                  style={{ cursor: 'pointer', color: `${isSorted ? '#0076C4' : ''}` }}
                  onClick={openSortDialog}
                />
              )}
              {(shoppingFilterConfig.stateName ||
                shoppingFilterConfig.countryName ||
                shoppingFilterConfig.cityName) && (
                <span>
                  {[shoppingFilterConfig.cityName, shoppingFilterConfig.stateName, shoppingFilterConfig.countryName]
                    .filter(Boolean)
                    .join(', ')}
                </span>
              )}
            </Typography>
            <div
              id="scrollableDiv"
              className="offer-list"
              style={{ overflow: 'auto', maxHeight: 'calc(100vh - 250px)' }}
            >
              {!isLoadingFilter ? (
                <InfiniteScroll
                  dataLength={dataFilter.length}
                  next={loadMoreItemsFilter}
                  hasMore={hasNextFilter}
                  loader={
                    <>
                      <Skeleton variant="text" />
                      <Skeleton variant="text" />
                    </>
                  }
                  scrollableTarget="scrollableDiv"
                  scrollThreshold={'100px'}
                >
                  {dataFilter.map(item => {
                    return <OfferItem key={item.id} timelineItem={item as TimelineQueryItem} />;
                  })}
                </InfiniteScroll>
              ) : (
                <Box sx={{ height: '50vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CircularProgress color="primary" />
                </Box>
              )}
            </div>
          </Section>
        </ShoppingPage>
      </WrapShopping>
    </MobileLayout>
  );
}
