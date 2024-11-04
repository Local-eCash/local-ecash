'use client';

import MiniAppBackdrop from '@/src/components/Common/MiniAppBackdrop';
import OrderDetailInfo from '@/src/components/DetailInfo/OrderDetailInfo';
import MobileLayout from '@/src/components/layout/MobileLayout';
import TickerHeader from '@/src/components/TickerHeader/TickerHeader';
import {
  EscrowOrderQueryItem,
  EscrowOrderStatus,
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
      margin: 10px;

      &:last-of-type {
        border-bottom: 0;
      }
    }

    button {
      color: white;
      text-transform: math-auto;
      border-color: rgba(255, 255, 255, 0.2);

      &.active {
        border-color: rgba(255, 255, 255, 1);
      }
    }
  }
`;

const OfferDetailContent = styled.div`
  padding: 0 16px;

  .group-button-wrap {
    width: 100%;
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.2);
    padding-bottom: 16px;

    button {
      text-transform: none;
      color: white;
    }
  }

  .payment-group-btns {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    button {
      border-radius: 10px;
      text-transform: capitalize;
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
        {currentData?.offer && (
          <OfferDetailContent>
            <Typography variant="body1">
              <span className="prefix">Price: {currentData?.offer.price}</span>
            </Typography>
            <Typography variant="body1">
              <span className="prefix">
                Order limit: {currentData?.offer.orderLimitMin} XEC - {currentData?.offer.orderLimitMax} XEC
              </span>
            </Typography>
            <Typography variant="body1">
              <span className="prefix">Message: {currentData?.offer.message}</span>
            </Typography>
            <Typography variant="body1">
              <span className="prefix">State: {currentData?.offer.state.name}</span>
            </Typography>
            <Typography variant="body1">
              <span className="prefix">Country: {currentData?.offer.country.name}</span>
            </Typography>
            <div className="payment-group-btns">
              {currentData.offer.paymentMethods.map(data => {
                return (
                  <Button size="small" color="success" variant="outlined" key={data.paymentMethod.name}>
                    {data.paymentMethod.name}
                  </Button>
                );
              })}
            </div>
          </OfferDetailContent>
        )}
        <hr />
        <div className="list-item">
          <Stack direction="row" gap="20px" justifyContent="center">
            <Button
              onClick={() => setOrderStatus(EscrowOrderStatus.Pending)}
              className={orderStatus === EscrowOrderStatus.Pending ? 'active' : ''}
              color="inherit"
              variant="outlined"
            >
              {EscrowOrderStatus.Pending}
            </Button>

            <Button
              onClick={() => setOrderStatus(EscrowOrderStatus.Escrow)}
              className={orderStatus === EscrowOrderStatus.Escrow ? 'active' : ''}
              color="inherit"
              variant="outlined"
            >
              {EscrowOrderStatus.Escrow}
            </Button>

            <Button
              onClick={() => setOrderStatus(EscrowOrderStatus.Complete)}
              className={orderStatus === EscrowOrderStatus.Complete ? 'active' : ''}
              color="inherit"
              variant="outlined"
            >
              {EscrowOrderStatus.Complete}
            </Button>

            <Button
              onClick={() => setOrderStatus(EscrowOrderStatus.Cancel)}
              className={orderStatus === EscrowOrderStatus.Cancel ? 'active' : ''}
              color="inherit"
              variant="outlined"
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
