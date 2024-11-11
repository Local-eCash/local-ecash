'use client';

import MiniAppBackdrop from '@/src/components/Common/MiniAppBackdrop';
import OfferDetailInfo from '@/src/components/DetailInfo/OfferDetailInfo';
import OrderDetailInfo from '@/src/components/DetailInfo/OrderDetailInfo';
import MobileLayout from '@/src/components/layout/MobileLayout';
import TickerHeader from '@/src/components/TickerHeader/TickerHeader';
import {
  EscrowOrderQueryItem,
  EscrowOrderStatus,
  Offer,
  offerApi,
  useInfiniteEscrowOrderByOfferIdQuery
} from '@bcpros/redux-store';
import styled from '@emotion/styled';
import { Backdrop, Button, CircularProgress, Skeleton, Stack, Typography } from '@mui/material';
import _ from 'lodash';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';

const OfferDetailPage = styled.div`
  min-height: 100vh;
  background-image: url('/bg-dialog.svg');
  background-repeat: no-repeat;
  background-size: cover;

  .list-item {
    div:not(.payment-group-btns) {
      border-bottom: 2px dashed rgba(255, 255, 255, 0.3);
      padding-bottom: 16px;
      margin: 10px 5px;

      &:last-of-type {
        border-bottom: 0;
      }
    }

    .btn-timeline {
      color: white !important;
      text-transform: math-auto;
      border-color: rgba(255, 255, 255, 0.2);
    }
    .active {
      border: 1px solid rgba(255, 255, 255, 1);
    }
  }
`;

const OfferDetail = () => {
  const token = sessionStorage.getItem('Authorization');
  const search = useSearchParams();
  const id = search!.get('id');
  const [orderStatus, setOrderStatus] = useState<EscrowOrderStatus>(EscrowOrderStatus.Pending);
  const { useOfferQuery } = offerApi;
  const { isLoading, currentData, isError, isUninitialized } = useOfferQuery({ id: id! }, { skip: !id || !token });
  const {
    data: escrowOrdersData,
    hasNext: hasNextEscrowOrders,
    isFetching: isFetchingEscrowOrders,
    fetchNext: fetchNextEscrowOrders
  } = useInfiniteEscrowOrderByOfferIdQuery({ offerId: id!, escrowOrderStatus: orderStatus, first: 10 });

  const loadMoreEscrowOrders = () => {
    if (hasNextEscrowOrders && !isFetchingEscrowOrders) {
      fetchNextEscrowOrders();
    } else if (hasNextEscrowOrders) {
      fetchNextEscrowOrders();
    }
  };

  if (_.isEmpty(id) || _.isNil(id) || isError) {
    return <div style={{ color: 'white' }}>Invalid order id</div>;
  }

  const ButtonTimeline = (escrowStatus: EscrowOrderStatus) => {
    return (
      <Button
        onClick={() => setOrderStatus(escrowStatus)}
        className={`btn-timeline ${orderStatus === EscrowOrderStatus.Pending ? 'active' : ''}`}
        color="info"
        variant="contained"
      >
        {escrowStatus}
      </Button>
    );
  };

  return (
    <MobileLayout>
      {(isLoading || isUninitialized) && (
        <Backdrop sx={theme => ({ color: '#fff', zIndex: theme.zIndex.drawer + 1 })} open={true}>
          <CircularProgress color="inherit" />
        </Backdrop>
      )}
      <MiniAppBackdrop />
      <OfferDetailPage>
        <TickerHeader title="Offer Detail" />
        {currentData?.offer && <OfferDetailInfo offer={currentData.offer as Offer} isItemTimeline={false} />}
        <hr />
        <div className="list-item">
          <Stack direction="row" gap="20px" justifyContent="center">
            <Button
              onClick={() => setOrderStatus(EscrowOrderStatus.Pending)}
              className={`btn-timeline ${orderStatus === EscrowOrderStatus.Pending ? 'active' : ''}`}
              color="info"
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
              color="info"
              variant="contained"
            >
              {EscrowOrderStatus.Complete}
            </Button>
            <Button
              onClick={() => setOrderStatus(EscrowOrderStatus.Cancel)}
              className={`btn-timeline ${orderStatus === EscrowOrderStatus.Cancel ? 'active' : ''}`}
              color="info"
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
            <Typography style={{ textAlign: 'center', marginTop: '2rem' }}>It&apos;s so empty here</Typography>
          )}
        </div>
      </OfferDetailPage>
    </MobileLayout>
  );
};

export default OfferDetail;
