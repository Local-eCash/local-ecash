'use client';
import OfferDetailInfo from '@/src/components/DetailInfo/OfferDetailInfo';
import { TabPanel } from '@/src/components/Tab/Tab';
import TickerHeader from '@/src/components/TickerHeader/TickerHeader';
import AuthorizationLayout from '@/src/components/layout/AuthorizationLayout';
import MobileLayout from '@/src/components/layout/MobileLayout';
import { TabType } from '@/src/store/constants';
import { OfferStatus, useInfiniteMyOffersQuery } from '@bcpros/redux-store';
import styled from '@emotion/styled';
import LocalOfferOutlinedIcon from '@mui/icons-material/LocalOfferOutlined';
import { Skeleton, Tab, Tabs, Typography } from '@mui/material';
import React, { useState } from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';
import SwipeableViews from 'react-swipeable-views';

const MyOfferPage = styled.div`
  min-height: 100vh;
  padding-bottom: 56px;

  .MuiTab-root {
    color: white;
    text-transform: none;
    font-weight: 600;
    font-size: 16px;

    &.Mui-selected {
      background-color: rgba(255, 255, 255, 0.08);
      backdrop-filter: blur(8px);
    }
  }

  .MuiTabs-indicator {
    background-color: #0076c4;
  }

  .MuiBox-root {
    padding: 16px;
  }
  }
`;

export default function MyOffer() {
  const [value, setValue] = useState(0);
  const [open, setOpen] = useState<boolean>(false);
  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  const handleChangeIndex = (index: number) => {
    setValue(index);
  };

  const {
    data: dataOfferActive,
    hasNext: hasNextOfferActive,
    isFetching: isFetchingOfferActive,
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
    hasNext: hasNextOfferArchive,
    isFetching: isFetchingOfferArchive,
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
                {dataOfferActive.length > 0 ? (
                  <InfiniteScroll
                    dataLength={dataOfferActive.length}
                    next={loadMoreItemsOfferActive}
                    hasMore={hasNextOfferActive}
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
                ) : (
                  <Typography style={{ textAlign: 'center', marginTop: '2rem' }}>No offer here</Typography>
                )}
              </div>
            </TabPanel>
            <TabPanel value={value} index={1}>
              <div className="list-item">
                {dataOfferArchive.length > 0 ? (
                  <InfiniteScroll
                    dataLength={dataOfferArchive.length}
                    next={loadMoreItemsOfferArchive}
                    hasMore={hasNextOfferArchive}
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
                ) : (
                  <Typography style={{ textAlign: 'center', marginTop: '2rem' }}>No offer archive</Typography>
                )}
              </div>
            </TabPanel>
          </SwipeableViews>
        </MyOfferPage>
      </AuthorizationLayout>
    </MobileLayout>
  );
}
