'use client';

import OfferDetailInfo from '@/src/components/DetailInfo/OfferDetailInfo';
import OrderDetailInfo from '@/src/components/DetailInfo/OrderDetailInfo';
import MobileLayout from '@/src/components/layout/MobileLayout';
import { TabPanel } from '@/src/components/Tab/Tab';
import TickerHeader from '@/src/components/TickerHeader/TickerHeader';
import { TabType } from '@/src/store/constants';
import {
  EscrowOrderQueryItem,
  EscrowOrderStatus,
  getSelectedAccount,
  OfferStatus,
  useInfiniteEscrowOrderByOfferIdQuery,
  useSliceSelector as useLixiSliceSelector
} from '@bcpros/redux-store';
import { usePostQuery } from '@bcpros/redux-store/build/main/store/post/posts.api';
import { Box, CircularProgress, Skeleton, Tab, Tabs, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import _ from 'lodash';
import { useSearchParams } from 'next/navigation';
import React, { useState } from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';
import SwipeableViews from 'react-swipeable-views';

const OfferDetailPage = styled('div')(({ theme }) => ({
  minHeight: '100vh',
  background: theme.palette.background.default,
  backgroundRepeat: 'no-repeat',
  backgroundSize: 'cover',

  '.list-item': {
    '.group-btn-order': {
      borderBottom: `2px dashed ${theme.custom.borderPrimary}`,
      paddingBottom: '16px',
      margin: '10px 5px'
    },

    '.infinite-scroll-component': {
      padding: '16px'
    },

    '.btn-timeline': {
      color: `${theme.palette.common.white} !important`,
      textTransform: 'none',
      borderColor: 'rgba(255, 255, 255, 0.2)'
    },

    '.active': {
      border: '1px solid rgba(255, 255, 255, 1)'
    }
  },

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
    backgroundColor: theme.palette.primary.main || '#0076c4'
  }
}));

const OfferDetail = () => {
  const token = sessionStorage.getItem('Authorization');
  const search = useSearchParams();
  const id = search!.get('id');

  const selectedAccount = useLixiSliceSelector(getSelectedAccount);

  const [value, setValue] = useState<TabType>(TabType.PENDING);
  const [orderStatus, setOrderStatus] = useState<EscrowOrderStatus>(EscrowOrderStatus.Pending);

  const { currentData, isError, isFetching } = usePostQuery({ id: id! }, { skip: !id });
  const {
    data: escrowOrdersData,
    hasNext: hasNextEscrowOrders,
    isFetching: isFetchingEscrowOrders,
    fetchNext: fetchNextEscrowOrders
  } = useInfiniteEscrowOrderByOfferIdQuery({
    offerId: currentData && currentData?.post?.accountId === selectedAccount?.id && id!,
    escrowOrderStatus: orderStatus,
    first: 10
  });

  const loadMoreEscrowOrders = () => {
    if (hasNextEscrowOrders && !isFetchingEscrowOrders) {
      fetchNextEscrowOrders();
    } else if (hasNextEscrowOrders) {
      fetchNextEscrowOrders();
    }
  };

  const handleChange = (event: React.SyntheticEvent, newValue: TabType) => {
    setOrderStatus(getOrderStatus(newValue));
    setValue(newValue);
  };

  const handleChangeIndex = (index: number) => {
    const tabValues = [TabType.PENDING, TabType.ESCROWED, TabType.ARCHIVED];
    setOrderStatus(getOrderStatus(tabValues[index]));
    setValue(tabValues[index]);
  };

  const getTabIndex = (tabValue: TabType): number => {
    switch (tabValue) {
      case TabType.PENDING:
        return 0;
      case TabType.ESCROWED:
        return 1;
      case TabType.ARCHIVED:
        return 2;
      default:
        return 0;
    }
  };

  const getOrderStatus = (tabValue: TabType) => {
    switch (tabValue) {
      case TabType.PENDING:
        return EscrowOrderStatus.Pending;
      case TabType.ESCROWED:
        return EscrowOrderStatus.Escrow;
      case TabType.ARCHIVED:
        return EscrowOrderStatus.Complete;
      default:
        return EscrowOrderStatus.Pending;
    }
  };

  if (_.isEmpty(id) || _.isNil(id)) {
    return <div style={{ color: 'white' }}>Invalid offer id</div>;
  }

  if (isError || (!isFetching && !currentData?.post?.postOffer)) {
    return (
      <MobileLayout>
        <OfferDetailPage>
          <TickerHeader title="Offer Details" />
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
            <Typography style={{ color: 'white', fontSize: '18px' }}>No offer here</Typography>
          </div>
        </OfferDetailPage>
      </MobileLayout>
    );
  }

  const ListItem = () => {
    return !isFetchingEscrowOrders ? (
      escrowOrdersData.length > 0 ? (
        <InfiniteScroll
          dataLength={escrowOrdersData.length}
          next={loadMoreEscrowOrders}
          hasMore={hasNextEscrowOrders}
          loader={
            <>
              <Skeleton variant="text" />
              <Skeleton variant="text" />
            </>
          }
          scrollableTarget="scrollableDiv"
        >
          {escrowOrdersData.map(item => {
            return <OrderDetailInfo item={item.data as EscrowOrderQueryItem} key={item.id} />;
          })}
        </InfiniteScroll>
      ) : (
        <Typography style={{ textAlign: 'center', marginTop: '2rem' }}>No orders here</Typography>
      )
    ) : (
      <Box sx={{ height: '50vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress color="primary" />
      </Box>
    );
  };
  const ListButtonComponent = () => {
    const isAccountOffer = currentData && currentData?.post?.accountId === selectedAccount?.id;
    if (!token || !isAccountOffer) {
      return;
    }

    return (
      <>
        <Tabs value={value} onChange={handleChange} indicatorColor="secondary" textColor="inherit" variant="fullWidth">
          <Tab
            label={TabType.PENDING}
            value={TabType.PENDING}
            id={`full-width-tab-${TabType.PENDING}`}
            aria-controls={`full-width-tabpanel-${TabType.PENDING}`}
          />
          <Tab
            label={TabType.ESCROWED}
            value={TabType.ESCROWED}
            id={`full-width-tab-${TabType.ESCROWED}`}
            aria-controls={`full-width-tabpanel-${TabType.ESCROWED}`}
          />
          <Tab
            label={TabType.ARCHIVED}
            value={TabType.ARCHIVED}
            id={`full-width-tab-${TabType.ARCHIVED}`}
            aria-controls={`full-width-tabpanel-${TabType.ARCHIVED}`}
          />
        </Tabs>
        <SwipeableViews index={getTabIndex(value)} onChangeIndex={handleChangeIndex}>
          <TabPanel value={getTabIndex(value)} index={0}>
            {ListItem()}
          </TabPanel>
          <TabPanel value={getTabIndex(value)} index={1}>
            {ListItem()}
          </TabPanel>
          <TabPanel value={getTabIndex(value)} index={2}>
            <div className="list-item">{ListItem()}</div>
          </TabPanel>
        </SwipeableViews>
      </>
    );
  };

  return (
    <MobileLayout>
      <OfferDetailPage>
        <TickerHeader
          title="Offer Details"
          showShareIcon={currentData?.post.postOffer.status !== OfferStatus.Archive}
          postData={currentData?.post}
        />
        {currentData?.post?.postOffer ? (
          <React.Fragment>
            <OfferDetailInfo
              post={currentData?.post}
              isShowBuyButton={currentData && currentData?.post?.accountId === selectedAccount?.id ? false : true}
              isItemTimeline={false}
            />
            {ListButtonComponent()}
          </React.Fragment>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'center', height: '100vh' }}>
            <CircularProgress style={{ color: 'white', margin: 'auto' }} />
          </div>
        )}
      </OfferDetailPage>
    </MobileLayout>
  );
};

export default OfferDetail;
