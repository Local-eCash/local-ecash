'use client';
import OrderDetailInfo from '@/src/components/DetailInfo/OrderDetailInfo';
import { TabPanel } from '@/src/components/Tab/Tab';
import TickerHeader from '@/src/components/TickerHeader/TickerHeader';
import AuthorizationLayout from '@/src/components/layout/AuthorizationLayout';
import MobileLayout from '@/src/components/layout/MobileLayout';
import { TabType } from '@/src/store/constants';
import { EscrowOrderQueryItem, EscrowOrderStatus, useInfiniteMyEscrowOrderQuery } from '@bcpros/redux-store';
import InventoryOutlinedIcon from '@mui/icons-material/InventoryOutlined';
import { Box, CircularProgress, Skeleton, Tab, Tabs, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import React, { useState } from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';
import SwipeableViews from 'react-swipeable-views';

const MyOrderPage = styled('div')(({ theme }) => ({
  minHeight: '100vh',
  background: theme.palette.background.default,
  backgroundRepeat: 'no-repeat',
  backgroundSize: 'cover',
  paddingBottom: '85px',

  '.MuiTab-root': {
    color: theme.custom.colorItem,
    textTransform: 'none',
    fontWeight: 600,
    fontSize: '16px',

    '&.Mui-selected': {
      backgroundColor: 'rgba(255, 255, 255, 0.08)',
      backdropFilter: 'blur(8px)'
    }
  },

  '.MuiTabs-indicator': {
    backgroundColor: theme.palette.primary.main || '#0076c4'
  },

  '.MuiBox-root': {
    padding: '16px'
  },

  '.MuiCircularProgress-root': {
    display: 'block',
    margin: '0 auto'
  }
}));

export default function MyOrder() {
  const [value, setValue] = useState(Number(sessionStorage.getItem('my-order-tab')) || 0);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    //store current index to local storage
    sessionStorage.setItem('my-order-tab', newValue.toString());
    setValue(newValue);
  };

  const handleChangeIndex = (index: number) => {
    //store current index to local storage
    sessionStorage.setItem('my-order-tab', index.toString());
    setValue(index);
  };

  const {
    data: dataOrderPending,
    hasNext: hasNextOrderPending,
    isFetching: isFetchingOrderPending,
    isLoading: isLoadingOrderPending,
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
    isLoading: isLoadingOrderEscrow,
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
    isLoading: isLoadingOrderUnactive,
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
                {!isFetchingOrderPending ? (
                  dataOrderPending.length > 0 ? (
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
                  )
                ) : (
                  <Box sx={{ height: '50vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CircularProgress color="primary" />
                  </Box>
                )}
              </div>
            </TabPanel>
            <TabPanel value={value} index={1}>
              <div className="list-item">
                {!isFetchingOrderEscrow ? (
                  dataOrderEscrow.length > 0 ? (
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
                  )
                ) : (
                  <Box sx={{ height: '50vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CircularProgress color="primary" />
                  </Box>
                )}
              </div>
            </TabPanel>
            <TabPanel value={value} index={2}>
              <div className="list-item">
                {!isFetchingOrderUnactive ? (
                  dataOrderUnactive.length > 0 ? (
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
                  )
                ) : (
                  <Box sx={{ height: '50vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CircularProgress color="primary" />
                  </Box>
                )}
              </div>
            </TabPanel>
          </SwipeableViews>
        </MyOrderPage>
      </AuthorizationLayout>
    </MobileLayout>
  );
}
