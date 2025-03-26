'use client';
import OfferDetailInfo from '@/src/components/DetailInfo/OfferDetailInfo';
import { TabPanel } from '@/src/components/Tab/Tab';
import TickerHeader from '@/src/components/TickerHeader/TickerHeader';
import AuthorizationLayout from '@/src/components/layout/AuthorizationLayout';
import MobileLayout from '@/src/components/layout/MobileLayout';
import { TabType } from '@/src/store/constants';
import {
  OfferStatus,
  openModal,
  useInfiniteMyOffersQuery,
  useSliceDispatch as useLixiSliceDispatch
} from '@bcpros/redux-store';
import LocalOfferOutlinedIcon from '@mui/icons-material/LocalOfferOutlined';
import { Button, CircularProgress, Skeleton, Tab, Tabs, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useSession } from 'next-auth/react';
import React, { useState } from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';
import SwipeableViews from 'react-swipeable-views';

const MyOfferPage = styled('div')(({ theme }) => ({
  minHeight: '100vh',
  paddingBottom: '85px',
  '.MuiTab-root': {
    color: theme.custom.colorPrimary,
    textTransform: 'none',
    fontWeight: 600,
    fontSize: '16px',
    '&.Mui-selected': {
      backgroundColor: 'rgba(255, 255, 255, 0.08)',
      backdropFilter: 'blur(8px)'
    }
  },

  '.MuiTabs-indicator': {
    backgroundColor: '#0076c4'
  },

  '.MuiBox-root': {
    padding: '16px'
  },

  '.MuiCircularProgress-root': {
    display: 'block',
    margin: '0 auto'
  },

  '.end-message': {
    textAlign: 'center',
    marginTop: '1rem',
    button: {
      width: '100%',
      marginTop: '1rem',
      textTransform: 'none'
    }
  }
}));

export default function MyOffer() {
  const dispatch = useLixiSliceDispatch();
  const { data } = useSession();
  const [value, setValue] = useState(0);
  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  const handleChangeIndex = (index: number) => {
    setValue(index);
  };

  const {
    data: dataOfferActive,
    totalCount: totalCountOfferActive,
    hasNext: hasNextOfferActive,
    isFetching: isFetchingOfferActive,
    isLoading: isLoadingOfferActive,
    fetchNext: fetchNextOfferActive
  } = useInfiniteMyOffersQuery({
    first: 20,
    offerStatus: OfferStatus.Active
  });

  const loadMoreItemsOfferActive = () => {
    if (hasNextOfferActive && !isFetchingOfferActive) {
      fetchNextOfferActive();
    } else if (hasNextOfferActive) {
      fetchNextOfferActive();
    }
  };

  const {
    data: dataOfferArchive,
    totalCount: totalCountOfferArchive,
    hasNext: hasNextOfferArchive,
    isFetching: isFetchingOfferArchive,
    isLoading: isLoadingOfferArchive,
    fetchNext: fetchNextOfferArchive
  } = useInfiniteMyOffersQuery({
    first: 20,
    offerStatus: OfferStatus.Archive
  });

  const loadMoreItemsOfferArchive = () => {
    if (hasNextOfferArchive && !isFetchingOfferArchive) {
      fetchNextOfferArchive();
    } else if (hasNextOfferArchive) {
      fetchNextOfferArchive();
    }
  };

  const handleOpenCreateOffer = () => {
    if (data?.user?.name.startsWith('@')) {
      dispatch(openModal('CreateOfferModal', {}));
    } else {
      dispatch(openModal('RequiredUsernameModal', {}));
    }
  };

  return (
    <MobileLayout>
      <AuthorizationLayout>
        <MyOfferPage>
          <TickerHeader
            hideIcon={true}
            title="My offers"
            showBtnCreateOffer={true}
            iconHeader={<LocalOfferOutlinedIcon />}
          />
          <Tabs
            value={value}
            onChange={handleChange}
            indicatorColor="secondary"
            textColor="inherit"
            variant="fullWidth"
          >
            <Tab
              label={TabType.ACTIVE}
              id={`full-width-tab-${TabType.ACTIVE}`}
              aria-controls={`full-width-tabpanel-${TabType.ACTIVE}`}
            />
            <Tab
              label={TabType.ARCHIVED}
              id={`full-width-tab-${TabType.ARCHIVED}`}
              aria-controls={`full-width-tabpanel-${TabType.ARCHIVED}`}
            />
          </Tabs>
          <SwipeableViews index={value} onChangeIndex={handleChangeIndex}>
            <TabPanel value={value} index={0}>
              <div className="list-item">
                {isLoadingOfferActive ? (
                  <CircularProgress />
                ) : (
                  dataOfferActive && (
                    <InfiniteScroll
                      dataLength={dataOfferActive.length}
                      next={loadMoreItemsOfferActive}
                      hasMore={hasNextOfferActive}
                      endMessage={
                        // Need to improve! (just for pilot this time)
                        // Issue: All custom useInfinite hooks have a mismatch between loading state and data.
                        // When loading state is false, data should have but it not available shortly afterward,
                        // leading to a delay in synchronization.
                        // use totalCount because data is not available immediately
                        totalCountOfferActive === 0 && totalCountOfferArchive === 0 ? (
                          <Typography className="end-message" component={'div'}>
                            <Typography> You haven't created any offer yet</Typography>
                            <Button variant="contained" onClick={() => handleOpenCreateOffer()}>
                              Create my first offer
                            </Button>
                          </Typography>
                        ) : (
                          <Typography style={{ textAlign: 'center', marginTop: '2rem' }}>
                            No active offer here
                          </Typography>
                        )
                      }
                      loader={
                        <>
                          <Skeleton variant="text" />
                          <Skeleton variant="text" />
                        </>
                      }
                      scrollableTarget="scrollableDiv"
                      scrollThreshold={'100px'}
                    >
                      {dataOfferActive.map(item => {
                        return <OfferDetailInfo timelineItem={item} key={item.id} />;
                      })}
                    </InfiniteScroll>
                  )
                )}
              </div>
            </TabPanel>
            <TabPanel value={value} index={1}>
              <div className="list-item">
                {isLoadingOfferArchive ? (
                  <CircularProgress />
                ) : (
                  dataOfferArchive && (
                    <InfiniteScroll
                      dataLength={dataOfferArchive.length}
                      next={loadMoreItemsOfferArchive}
                      hasMore={hasNextOfferArchive}
                      endMessage={
                        <Typography style={{ textAlign: 'center', marginTop: '2rem' }}>
                          No archived offer here
                        </Typography>
                      }
                      loader={
                        <>
                          <Skeleton variant="text" />
                          <Skeleton variant="text" />
                        </>
                      }
                      scrollableTarget="scrollableDiv"
                      scrollThreshold={'100px'}
                    >
                      {dataOfferArchive.map(item => {
                        return <OfferDetailInfo timelineItem={item} key={item.id} />;
                      })}
                    </InfiniteScroll>
                  )
                )}
              </div>
            </TabPanel>
          </SwipeableViews>
        </MyOfferPage>
      </AuthorizationLayout>
    </MobileLayout>
  );
}
