'use client';
import OrderDetailInfo from '@/src/components/DetailInfo/OrderDetailInfo';
import { TabPanel } from '@/src/components/Tab/Tab';
import TickerHeader from '@/src/components/TickerHeader/TickerHeader';
import AuthorizationLayout from '@/src/components/layout/AuthorizationLayout';
import MobileLayout from '@/src/components/layout/MobileLayout';
import { TabType } from '@/src/store/constants';
import { EscrowOrderQueryItem, EscrowOrderStatus, useInfiniteMyEscrowOrderQuery } from '@bcpros/redux-store';
import styled from '@emotion/styled';
import InventoryOutlinedIcon from '@mui/icons-material/InventoryOutlined';
import { Skeleton, Tab, Tabs, Typography } from '@mui/material';
import React, { useState } from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';
import SwipeableViews from 'react-swipeable-views';

const MyOrderPage = styled.div`
  min-height: 100vh;
  background-image: url('/bg-dialog.svg');
  background-repeat: no-repeat;
  background-size: cover;
  padding-bottom: 85px;

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
    data: dataOrderPending,
    hasNext: hasNextOrderPending,
    isFetching: isFetchingOrderPending,
    fetchNext: fetchNextOrderPending
  } = useInfiniteMyEscrowOrderQuery(
    {
      first: 20,
      escrowOrderStatus: EscrowOrderStatus.Pending
    },
    false
  );
  const {
    data: dataOrderEscrow,
    hasNext: hasNextOrderEscrow,
    isFetching: isFetchingOrderEscrow,
    fetchNext: fetchNextOrderEscrow
  } = useInfiniteMyEscrowOrderQuery(
    {
      first: 20,
      escrowOrderStatus: EscrowOrderStatus.Escrow
    },
    false
  );
  const {
    data: dataOrderUnactive,
    hasNext: hasNextOrderUnactive,
    isFetching: isFetchingOrderUnactive,
    fetchNext: fetchNextOrderUnactive
  } = useInfiniteMyEscrowOrderQuery({ escrowOrderStatus: EscrowOrderStatus.Complete, first: 20 }, false);

  const loadMoreItemsOrderPending = () => {
    if (hasNextOrderPending && !isFetchingOrderPending) {
      fetchNextOrderPending();
    } else if (hasNextOrderPending) {
      fetchNextOrderPending();
    }
  };

  const loadMoreItemsOrderEscrow = () => {
    if (hasNextOrderEscrow && !isFetchingOrderEscrow) {
      fetchNextOrderEscrow();
    } else if (hasNextOrderEscrow) {
      fetchNextOrderEscrow();
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
          <TickerHeader hideIcon={true} title="My orders" iconHeader={<InventoryOutlinedIcon />} />

          <Tabs
            value={value}
            onChange={handleChange}
            indicatorColor="secondary"
            textColor="inherit"
            variant="fullWidth"
          >
            <Tab
              label={TabType.PENDING}
              id={`full-width-tab-${TabType.PENDING}`}
              aria-controls={`full-width-tabpanel-${TabType.PENDING}`}
            />
            <Tab
              label={TabType.ESCROWED}
              id={`full-width-tab-${TabType.ESCROWED}`}
              aria-controls={`full-width-tabpanel-${TabType.ESCROWED}`}
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
                {dataOrderPending.length > 0 ? (
                  <InfiniteScroll
                    dataLength={dataOrderPending.length}
                    next={loadMoreItemsOrderPending}
                    hasMore={hasNextOrderPending}
                    loader={
                      <>
                        <Skeleton variant="text" />
                        <Skeleton variant="text" />
                      </>
                    }
                    scrollableTarget="scrollableDiv"
                  >
                    {dataOrderPending.map(item => {
                      return <OrderDetailInfo item={item as EscrowOrderQueryItem} key={item.id} />;
                    })}
                  </InfiniteScroll>
                ) : (
                  <Typography style={{ textAlign: 'center', marginTop: '2rem' }}>No orders here</Typography>
                )}
              </div>
            </TabPanel>
            <TabPanel value={value} index={1}>
              <div className="list-item">
                {dataOrderEscrow.length > 0 ? (
                  <InfiniteScroll
                    dataLength={dataOrderEscrow.length}
                    next={loadMoreItemsOrderEscrow}
                    hasMore={hasNextOrderEscrow}
                    loader={
                      <>
                        <Skeleton variant="text" />
                        <Skeleton variant="text" />
                      </>
                    }
                    scrollableTarget="scrollableDiv"
                  >
                    {dataOrderEscrow.map(item => {
                      return <OrderDetailInfo item={item as EscrowOrderQueryItem} key={item.id} />;
                    })}
                  </InfiniteScroll>
                ) : (
                  <Typography style={{ textAlign: 'center', marginTop: '2rem' }}>No orders here</Typography>
                )}
              </div>
            </TabPanel>
            <TabPanel value={value} index={2}>
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
                      return <OrderDetailInfo item={item as EscrowOrderQueryItem} key={item.id} />;
                    })}
                  </InfiniteScroll>
                ) : (
                  <Typography style={{ textAlign: 'center', marginTop: '2rem' }}>No orders here</Typography>
                )}
              </div>
            </TabPanel>
          </SwipeableViews>
        </MyOrderPage>
      </AuthorizationLayout>
    </MobileLayout>
  );
}
