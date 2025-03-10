'use client';

import OfferDetailInfo from '@/src/components/DetailInfo/OfferDetailInfo';
import OrderDetailInfo from '@/src/components/DetailInfo/OrderDetailInfo';
import MobileLayout from '@/src/components/layout/MobileLayout';
import TickerHeader from '@/src/components/TickerHeader/TickerHeader';
import {
  EscrowOrderQueryItem,
  EscrowOrderStatus,
  getSelectedAccount,
  useInfiniteEscrowOrderByOfferIdQuery,
  useSliceSelector as useLixiSliceSelector
} from '@bcpros/redux-store';
import { usePostQuery } from '@bcpros/redux-store/build/main/store/post/posts.api';
import { Button, CircularProgress, Skeleton, Stack, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import _ from 'lodash';
import { useSearchParams } from 'next/navigation';
import React, { useState } from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';

const OfferDetailPage = styled('div')(({ theme }) => ({
  minHeight: '100vh',
  background: theme.palette.background.default,
  backgroundRepeat: 'no-repeat',
  backgroundSize: 'cover',

  '.list-item': {
    '.group-btn-order': {
      borderBottom: `2px dashed ${theme.custom.borderColor}`,
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
  }
}));
const OfferDetail = () => {
  const token = sessionStorage.getItem('Authorization');
  const search = useSearchParams();
  const id = search!.get('id');

  const selectedAccount = useLixiSliceSelector(getSelectedAccount);

  const [orderStatus, setOrderStatus] = useState<EscrowOrderStatus>(EscrowOrderStatus.Pending);

  const { currentData, isError } = usePostQuery({ id: id! }, { skip: !id });
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

  if (_.isEmpty(id) || _.isNil(id) || isError) {
    return <div style={{ color: 'white' }}>Invalid offer id</div>;
  }

  const ListButtonComponent = () => {
    const isAccountOffer = currentData && currentData?.post?.accountId === selectedAccount?.id;
    if (!token || !isAccountOffer) {
      return;
    }

    return (
      <>
        <div className="list-item">
          <hr />
          <Stack className="group-btn-order" direction="row" gap="20px" justifyContent="center">
            <Button
              onClick={() => setOrderStatus(EscrowOrderStatus.Pending)}
              className={`btn-timeline ${orderStatus === EscrowOrderStatus.Pending ? 'active' : ''}`}
              color="warning"
              variant="contained"
            >
              {EscrowOrderStatus.Pending}
            </Button>
            <Button
              onClick={() => setOrderStatus(EscrowOrderStatus.Escrow)}
              className={`btn-timeline ${orderStatus === EscrowOrderStatus.Escrow ? 'active' : ''}`}
              color="info"
              variant="contained"
            >
              {EscrowOrderStatus.Escrow}
            </Button>
            <Button
              onClick={() => setOrderStatus(EscrowOrderStatus.Complete)}
              className={`btn-timeline ${orderStatus === EscrowOrderStatus.Complete ? 'active' : ''}`}
              color="success"
              variant="contained"
            >
              {EscrowOrderStatus.Complete}
            </Button>
            <Button
              onClick={() => setOrderStatus(EscrowOrderStatus.Cancel)}
              className={`btn-timeline ${orderStatus === EscrowOrderStatus.Cancel ? 'active' : ''}`}
              color="error"
              variant="contained"
            >
              {EscrowOrderStatus.Cancel}
            </Button>
          </Stack>
          {escrowOrdersData?.length > 0 ? (
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
            <Typography style={{ textAlign: 'center', marginTop: '2rem' }}>
              No {orderStatus?.toLowerCase()} orders here
            </Typography>
          )}
        </div>
      </>
    );
  };

  return (
    <MobileLayout>
      <OfferDetailPage>
        <TickerHeader title="Offer Detail" showShareIcon={true} postData={currentData?.post} />
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
