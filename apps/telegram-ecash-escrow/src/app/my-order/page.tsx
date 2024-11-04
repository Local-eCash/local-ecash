'use client';
import OrderDetailInfo from '@/src/components/DetailInfo/OrderDetailInfo';
import AuthorizationLayout from '@/src/components/layout/AuthorizationLayout';
import MobileLayout from '@/src/components/layout/MobileLayout';
import { TabPanel } from '@/src/components/Tab/Tab';
import TickerHeader from '@/src/components/TickerHeader/TickerHeader';
import { TabType } from '@/src/store/constants';
import { EscrowOrderQueryItem, EscrowOrderStatus, useInfiniteMyEscrowOrderQuery } from '@bcpros/redux-store';
import styled from '@emotion/styled';
import { Skeleton, Tab, Tabs, Typography } from '@mui/material';
import React, { useState } from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';
import SwipeableViews from 'react-swipeable-views';

const MyOrderPage = styled.div`
  min-height: 100vh;
  background-image: url('/bg-dialog.svg');
  background-repeat: no-repeat;
  background-size: cover;
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

  .list-item {
    div:not(.payment-group-btns) {
      border-bottom: 2px dashed rgba(255, 255, 255, 0.3);
      padding-bottom: 16px;
      margin-bottom: 16px;

      &:last-of-type {
        border-bottom: 0;
      }
    }
  }
`;

export default function MyOrder() {
  const [value, setValue] = useState(0);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  const handleChangeIndex = (index: number) => {
    setValue(index);
  };

  const {
    data: dataOrderActive,
    hasNext: hasNextOrderActive,
    isFetching: isFetchingOrderActive,
    fetchNext: fetchNextOrderActive
  } = useInfiniteMyEscrowOrderQuery(
    {
      first: 20,
      escrowOrderStatus: EscrowOrderStatus.Active
    },
    false
  );
  const {
    data: dataOrderUnactive,
    hasNext: hasNextOrderUnactive,
    isFetching: isFetchingOrderUnactive,
    fetchNext: fetchNextOrderUnactive
  } = useInfiniteMyEscrowOrderQuery({ escrowOrderStatus: EscrowOrderStatus.Complete, first: 20 }, false);

  const loadMoreItemsOrderActive = () => {
    if (hasNextOrderActive && !isFetchingOrderActive) {
      fetchNextOrderActive();
    } else if (hasNextOrderActive) {
      fetchNextOrderActive();
    }
  };

  const loadMoreItemsOrderUnactive = () => {
    if (hasNextOrderUnactive && !isFetchingOrderUnactive) {
      fetchNextOrderUnactive();
    } else if (hasNextOrderUnactive) {
      fetchNextOrderUnactive();
    }
  };

  return (
    <MobileLayout>
      <AuthorizationLayout>
        <MyOrderPage>
          <TickerHeader hideIcon={true} title="My orders" />

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
                {dataOrderActive.length > 0 ? (
                  <InfiniteScroll
                    dataLength={dataOrderActive.length}
                    next={loadMoreItemsOrderActive}
                    hasMore={hasNextOrderActive}
                    loader={
                      <>
                        <Skeleton variant="text" />
                        <Skeleton variant="text" />
                      </>
                    }
                    scrollableTarget="scrollableDiv"
                  >
                    {dataOrderActive.map(item => {
                      return <OrderDetailInfo item={item.data as EscrowOrderQueryItem} key={item.id} />;
                    })}
                  </InfiniteScroll>
                ) : (
                  <Typography style={{ textAlign: 'center', marginTop: '2rem' }}>No order here</Typography>
                )}
              </div>
            </TabPanel>
            <TabPanel value={value} index={1}>
              <div className="list-item">
                {dataOrderUnactive.length > 0 ? (
                  <InfiniteScroll
                    dataLength={dataOrderUnactive.length}
                    next={loadMoreItemsOrderUnactive}
                    hasMore={hasNextOrderUnactive}
                    loader={
                      <>
                        <Skeleton variant="text" />
                        <Skeleton variant="text" />
                      </>
                    }
                    scrollableTarget="scrollableDiv"
                    scrollThreshold={'100px'}
                  >
                    {dataOrderUnactive.map(item => {
                      return <OrderDetailInfo item={item.data as EscrowOrderQueryItem} key={item.id} />;
                    })}
                  </InfiniteScroll>
                ) : (
                  <Typography style={{ textAlign: 'center', marginTop: '2rem' }}>No order here</Typography>
                )}
              </div>
            </TabPanel>
          </SwipeableViews>

          {/* <Fab route="/my-order/new" icon={<AddCircleOutline />} /> */}
        </MyOrderPage>
      </AuthorizationLayout>
    </MobileLayout>
  );
}
