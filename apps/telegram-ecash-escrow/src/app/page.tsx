'use client';

import Header from '@/src/components/Header/Header';
import OfferItem from '@/src/components/OfferItem/OfferItem';
import TopSection from '@/src/components/TopSection/TopSection';
import {
  PostQueryItem,
  TimelineQueryItem,
  getCountries,
  getNewPostAvailable,
  getOfferFilterConfig,
  getPaymenMethods,
  offerApi,
  setNewPostAvailable,
  useInfiniteOfferFilterQuery,
  useInfiniteOffersByScoreQuery,
  useSliceDispatch as useLixiSliceDispatch,
  useSliceSelector as useLixiSliceSelector
} from '@bcpros/redux-store';
import styled from '@emotion/styled';
import CachedRoundedIcon from '@mui/icons-material/CachedRounded';
import { Badge, Box, CircularProgress, Skeleton, Slide, Typography, useTheme } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';
import MobileLayout from '../components/layout/MobileLayout';

const WrapHome = styled.div``;

const HomePage = styled.div`
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
  .content-wrap {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .title-offer {
      font-weight: 600;
    }
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

export default function Home() {
  const theme = useTheme();
  const router = useRouter();
  const offerFilterConfig = useLixiSliceSelector(getOfferFilterConfig);
  const newPostAvailable = useLixiSliceSelector(getNewPostAvailable);
  const [visible, setVisible] = useState(true);
  const dispatch = useLixiSliceDispatch();

  const { data, hasNext, isFetching, fetchNext, refetch, isLoading } = useInfiniteOffersByScoreQuery(
    { first: 20 },
    false
  );
  const {
    data: dataFilter,
    hasNext: hasNextFilter,
    isFetching: isFetchingFilter,
    fetchNext: fetchNextFilter,
    isLoading: isLoadingFilter
  } = useInfiniteOfferFilterQuery({ first: 20, offerFilterInput: offerFilterConfig }, false);

  const loadMoreItems = () => {
    if (hasNext && !isFetching) {
      fetchNext();
    } else if (hasNext) {
      fetchNext();
    }
  };

  const loadMoreItemsFilter = () => {
    if (hasNextFilter && !isFetchingFilter) {
      fetchNextFilter();
    } else if (hasNextFilter) {
      fetchNextFilter();
    }
  };

  const handleRefresh = () => {
    dispatch(offerApi.api.util.resetApiState());
    refetch();
    dispatch(setNewPostAvailable(false));
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  };

  // useEffect(() => {
  //   (async () => {
  //     const country = await axiosClient
  //       .get(`/api/countries/ipaddr`)
  //       .then(result => {
  //         return result.data;
  //       })
  //       .catch(({ response }) => {
  //         console.log(response?.data.message);
  //       });

  //     if (country && country === 'US') {
  //       return router.push('/not-available');
  //     }
  //   })();
  // }, []);

  //reset flag for new-post when reload
  useEffect(() => {
    dispatch(setNewPostAvailable(false));
  }, []);

  //auto call paymentMethods and countries
  useEffect(() => {
    dispatch(getPaymenMethods());
    dispatch(getCountries());
  }, []);

  useEffect(() => {
    if (!isFetching) {
      const offerUnlisted = data.filter(item => (item.data as PostQueryItem).postOffer?.hideFromHome);
      const offerShowed = data.length - offerUnlisted.length;
      if (offerShowed < 4) {
        loadMoreItems();
      }
    }
  }, [data.length]);

  useEffect(() => {
    if (!isFetchingFilter) {
      const offerUnlistedFilter = dataFilter.filter(item => (item.data as PostQueryItem).postOffer?.hideFromHome);
      const offerShowedFilter = dataFilter.length - offerUnlistedFilter.length;
      if (offerShowedFilter < 4) {
        loadMoreItemsFilter();
      }
    }
  }, [dataFilter.length]);

  return (
    <MobileLayout>
      <WrapHome>
        <Slide direction="down" in={newPostAvailable && visible}>
          <StyledBadge className="badge-new-offer" color="info" onClick={handleRefresh}>
            <CachedRoundedIcon color="action" /> <span className="refresh-text">Refresh</span>
          </StyledBadge>
        </Slide>
        <HomePage>
          <Header />
          <TopSection />

          <Section>
            <div className="content-wrap">
              <Typography className="title-offer" variant="body1">
                Offer Watchlist
              </Typography>
            </div>
            <div className="offer-list">
              {offerFilterConfig.countryCode ||
              offerFilterConfig.stateName ||
              offerFilterConfig.cityName ||
              offerFilterConfig.coin ||
              offerFilterConfig.fiatCurrency ||
              (offerFilterConfig.paymentMethodIds?.length ?? 0) > 0 ? (
                !isLoadingFilter ? (
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
                )
              ) : !isLoading ? (
                <InfiniteScroll
                  dataLength={data.length}
                  next={loadMoreItems}
                  hasMore={hasNext}
                  loader={
                    <>
                      <Skeleton variant="text" />
                      <Skeleton variant="text" />
                    </>
                  }
                  scrollableTarget="scrollableDiv"
                  scrollThreshold={'100px'}
                >
                  {data.map(item => {
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
        </HomePage>
      </WrapHome>
    </MobileLayout>
  );
}
