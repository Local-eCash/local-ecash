'use client';
import MiniAppBackdrop from '@/src/components/Common/MiniAppBackdrop';
import MobileLayout from '@/src/components/layout/MobileLayout';
import { TabPanel } from '@/src/components/Tab/Tab';
import TickerHeader from '@/src/components/TickerHeader/TickerHeader';
import CustomToast from '@/src/components/Toast/CustomToast';
import { TabType } from '@/src/store/constants';
import {
  ArbiReleaseSignatory,
  ArbiReturnSignatory,
  buildReleaseTx,
  ModReleaseSignatory,
  ModReturnSignatory
} from '@/src/store/escrow';
import { COIN, coinInfo } from '@bcpros/lixi-models';
import {
  disputeApi,
  DisputeStatus,
  escrowOrderApi,
  EscrowOrderStatus,
  getSelectedWalletPath,
  parseCashAddressToPrefix,
  SocketContext,
  useSliceDispatch as useLixiSliceDispatch,
  useSliceSelector as useLixiSliceSelector,
  userSubcribeEscrowOrderChannel,
  WalletContextNode
} from '@bcpros/redux-store';
import styled from '@emotion/styled';
import { ChevronLeft } from '@mui/icons-material';
import {
  Backdrop,
  Button,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Slide,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { TransitionProps } from '@mui/material/transitions';
import { fromHex, Script, shaRmd160 } from 'ecash-lib';
import _ from 'lodash';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import React, { useContext, useEffect, useState } from 'react';
import SwipeableViews from 'react-swipeable-views';

const DisputeDetailInfoWrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;

  .prefix {
    font-size: 14px;
    color: #79869b;
  }

  .amount-escrowed {
    color: #66bb6a;
  }

  .amount-seller {
    color: #29b6f6;
  }

  .amount-buyer {
    color: #f44336;
  }
`;

const ResolveDisputeWrap = styled.div`
  padding: 16px;

  .group-btn-chat {
    display: flex;
    justify-content: space-between;
    gap: 8px;
    border-top: 1px dashed gray;
    padding-top: 8px;
    margin-top: 16px;

    .chat-btn {
      width: fit-content;
      justify-content: flex-start;
      text-transform: none;
      gap: 8px;
      padding: 10px;
      color: #fff;
      font-weight: 600;
    }
  }

  .resolve-btn {
    margin-top: 15px;
    color: #fff;
    font-weight: 600;
  }
`;

const StyledReleaseDialog = styled(Dialog)`
  .MuiPaper-root {
    background-image: url('/bg-dialog.svg');
    background-repeat: no-repeat;
    background-size: cover;
    width: 500px;
    height: 100vh;
    max-height: 100%;
    margin: 0;
    @media (max-width: 576px) {
      width: 100%;
    }
  }

  .MuiIconButton-root {
    width: fit-content;
    svg {
      font-size: 32px;
    }
  }

  .MuiDialogTitle-root {
    padding: 0 16px;
    padding-top: 16px;
    font-size: 26px;
    text-align: center;
  }

  .MuiDialogContent-root {
    padding: 0;
  }

  .back-btn {
    padding: 0;
    position: absolute;
    left: 8px;
    top: 20px;
    border-radius: 12px;

    svg {
      font-size: 32px;
    }
  }
`;

const ReleaseDisputeWrap = styled.div`
  padding: 16px;

  .seller-release,
  .buyer-release {
    text-align: center;
    display: flex;
    flex-direction: column;
    gap: 16px;
    margin-bottom: 32px;

    button {
      color: white;
      text-transform: none;
    }

    .disclaim-buyer {
      color: #f57c00;
    }

    .disclaim-seller {
      color: #29b6f6;
    }
  }
`;

const Transition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement;
  },
  ref: React.Ref<unknown>
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

export default function DisputeDetail() {
  const dispatch = useLixiSliceDispatch();
  const search = useSearchParams();
  const id = search!.get('id');
  const theme = useTheme();
  const token = sessionStorage.getItem('Authorization');
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));
  const selectedWalletPath = useLixiSliceSelector(getSelectedWalletPath);
  const Wallet = useContext(WalletContextNode);
  const socket = useContext(SocketContext);
  const { chronik } = Wallet;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [releaseByArb, setReleaseByArb] = useState(false);
  const [returnByArb, setReturnByArb] = useState(false);
  const [request, setRequest] = useState(false);
  const [requestFail, setRequestFail] = useState(false);
  const [openReleaseModal, setOpenReleaseModal] = useState<boolean>(false);
  const [validTextToRelease, setValidTextToRelease] = useState('');
  const [validTextToReturn, setValidTextToReturn] = useState('');
  const [valueTab, setValueTab] = useState(0);

  const { useDisputeQuery } = disputeApi;
  const { useEscrowOrderQuery, useUpdateEscrowOrderStatusMutation, useLazyArbiRequestTelegramChatQuery } =
    escrowOrderApi;
  const {
    isLoading: isLoadingDispute,
    currentData: disputeQueryData,
    isUninitialized: isUninitializedDispute,
    isError
  } = useDisputeQuery({ id: id! }, { skip: !id || !token });
  const { currentData: escrowOrderQueryData, isSuccess: isEscrowOrderSuccess } = useEscrowOrderQuery(
    { id: disputeQueryData?.dispute.escrowOrder.id },
    { skip: !disputeQueryData?.dispute.escrowOrder.id }
  );
  const { escrowOrder } = { ...escrowOrderQueryData };
  const [updateOrderTrigger] = useUpdateEscrowOrderStatusMutation();
  const [trigger, { isFetching, isLoading }] = useLazyArbiRequestTelegramChatQuery();

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValueTab(newValue);
  };

  const handleChangeIndex = (index: number) => {
    setValueTab(index);
  };

  const handleArbModReleaseReturn = async (spenderPkStr: string, status: EscrowOrderStatus) => {
    setLoading(true);

    const id = disputeQueryData?.dispute.escrowOrder.id;
    const escrowTxids = escrowOrder?.escrowTxids;
    const isArbi = selectedWalletPath?.hash160 === escrowOrder.arbitratorAccount.hash160;

    const nonce = escrowOrder.nonce as string;
    const script = Buffer.from(escrowOrder.escrowScript as string, 'hex') as unknown as Uint8Array;
    const escrowScript = new Script(script);
    const spenderPk = fromHex(spenderPkStr);
    const spenderPkh = shaRmd160(spenderPk);
    const spenderP2pkh = Script.p2pkh(spenderPkh);

    const { amount } = escrowOrder;
    const arbModAddress = parseCashAddressToPrefix(COIN.XEC, selectedWalletPath?.cashAddress);
    const disputeFee = calDisputeFee(amount);
    const isBuyerDeposit = escrowOrder.buyerDepositTx ? true : false;

    if (isArbi) {
      try {
        const arbiSk = fromHex(selectedWalletPath?.privateKey);
        const arbiPk = fromHex(selectedWalletPath?.publicKey);

        let arbiSignatory;
        switch (status) {
          case EscrowOrderStatus.Complete:
            arbiSignatory = ArbiReleaseSignatory(arbiSk, arbiPk, spenderPk, nonce);
            break;
          case EscrowOrderStatus.Cancel:
            arbiSignatory = ArbiReturnSignatory(arbiSk, arbiPk, spenderPk, nonce);
            break;
        }

        const txBuild = buildReleaseTx(
          escrowTxids,
          amount,
          escrowScript,
          arbiSignatory,
          spenderP2pkh,
          arbModAddress,
          disputeFee,
          isBuyerDeposit
        );

        const txid = (await chronik.broadcastTx(txBuild)).txid;

        // update order status to escrow
        await updateOrderTrigger({ input: { orderId: id, status, txid } })
          .unwrap()
          .then(() => {
            switch (status) {
              case EscrowOrderStatus.Complete:
                setReleaseByArb(true);
                break;
              case EscrowOrderStatus.Cancel:
                setReturnByArb(true);
                break;
            }
          })
          .catch(() => setError(true));
      } catch (e) {
        console.log(e);
      }
    } else {
      try {
        const modSk = fromHex(selectedWalletPath?.privateKey);
        const modPk = fromHex(selectedWalletPath?.publicKey);

        let modSignatory;
        switch (status) {
          case EscrowOrderStatus.Complete:
            modSignatory = ModReleaseSignatory(modSk, modPk, spenderPk, nonce);
            break;
          case EscrowOrderStatus.Cancel:
            modSignatory = ModReturnSignatory(modSk, modPk, spenderPk, nonce);
            break;
        }

        const txBuild = buildReleaseTx(
          escrowTxids,
          amount,
          escrowScript,
          modSignatory,
          spenderP2pkh,
          arbModAddress,
          disputeFee,
          isBuyerDeposit
        );

        const txid = (await chronik.broadcastTx(txBuild)).txid;

        // update order status to escrow
        await updateOrderTrigger({ input: { orderId: id, status, txid } })
          .unwrap()
          .then(() => {
            switch (status) {
              case EscrowOrderStatus.Complete:
                setReleaseByArb(true);
                break;
              case EscrowOrderStatus.Cancel:
                setReturnByArb(true);
                break;
            }
          })
          .catch(() => setError(true));
      } catch (e) {
        console.log(e);
      }
    }

    setOpenReleaseModal(false);
    setLoading(false);
  };

  const handleArbiModReleaseEscrow = async () => {
    const status = EscrowOrderStatus.Complete;
    const buyerPk = escrowOrder?.buyerAccount.publicKey;

    handleArbModReleaseReturn(buyerPk, status);
  };

  const handleArbiModReturnEscrow = async () => {
    const status = EscrowOrderStatus.Cancel;
    const sellerPk = escrowOrder?.sellerAccount.publicKey;

    handleArbModReleaseReturn(sellerPk, status);
  };

  const handleTelegramClick = async (username, publicKey) => {
    if (username && username.includes('@')) {
      const url = `https://t.me/${username.substring(1)}`;
      window.open(url, '_blank');
    } else {
      await trigger({ escrowOrderId: escrowOrder?.id, requestChatPublicKey: publicKey })
        .then(() => setRequest(true))
        .catch(() => setRequestFail(true));
    }
  };

  const calDisputeFee = (amount: number) => {
    const fee1Percent = parseFloat((amount / 100).toFixed(2));
    const dustXEC = coinInfo[COIN.XEC].dustSats / Math.pow(10, coinInfo[COIN.XEC].cashDecimals);

    return Math.max(fee1Percent, dustXEC);
  };

  useEffect(() => {
    escrowOrder?.escrowOrderStatus !== EscrowOrderStatus.Complete &&
      isEscrowOrderSuccess &&
      socket &&
      dispatch(userSubcribeEscrowOrderChannel(escrowOrder.id));
  }, [socket, isEscrowOrderSuccess]);

  if (
    escrowOrder?.arbitratorAccount.hash160 !== selectedWalletPath?.hash160 &&
    escrowOrder?.moderatorAccount.hash160 !== selectedWalletPath?.hash160
  ) {
    return <div>Not allowed to view this dispute</div>;
  }

  if (_.isEmpty(id) || _.isNil(id) || isError) {
    return <div>Invalid dispute id</div>;
  }

  if (isLoadingDispute) return <div>Loading...</div>;

  return (
    <MobileLayout>
      {(isLoadingDispute || isUninitializedDispute) && (
        <Backdrop sx={theme => ({ color: '#fff', zIndex: theme.zIndex.drawer + 1 })} open={true}>
          <CircularProgress color="inherit" />
        </Backdrop>
      )}
      <MiniAppBackdrop />
      <TickerHeader title="Dispute detail" />
      {disputeQueryData?.dispute && (
        <ResolveDisputeWrap>
          <DisputeDetailInfoWrap>
            <Typography variant="body1">
              <span className="prefix">Dispute by: </span>
              {disputeQueryData?.dispute.createdBy === escrowOrder.sellerAccount.publicKey ? 'Seller' : 'Buyer'}
            </Typography>
            {disputeQueryData?.dispute?.reason && (
              <Typography variant="body1">
                <span className="prefix">Reason: </span>
                {disputeQueryData.dispute.reason}
              </Typography>
            )}
            <Typography variant="body1">
              <span className="prefix">Order Id: </span>
              {escrowOrder?.id}
            </Typography>
            <Typography variant="body1">
              <span className="prefix">Created At: </span>
              {new Date(escrowOrder?.createdAt).toLocaleString()}
            </Typography>
            <Typography variant="body1">
              <span className="prefix">Seller: </span>
              {escrowOrder.sellerAccount.telegramUsername}
            </Typography>
            <Typography variant="body1">
              <span className="prefix">Buyer: </span>
              {escrowOrder.buyerAccount.telegramUsername}
            </Typography>
            <Typography>
              <span className="prefix">Escrow Address: </span>
              <a
                style={{
                  color: 'cornflowerblue',
                  wordWrap: 'break-word',
                  maxWidth: '100%',
                  display: 'inline-block'
                }}
                href={`${coinInfo[COIN.XEC].blockExplorerUrl}/address/${escrowOrder.escrowAddress}`}
                target="_blank"
              >
                <span>{escrowOrder.escrowAddress}</span>
              </a>
            </Typography>
            <Typography variant="body1" className="amount-escrowed">
              <span className="prefix">Escrowed amount: </span>
              {escrowOrder.amount} {COIN.XEC}
            </Typography>
            <Typography variant="body1" className="amount-seller">
              <span className="prefix">Dispute fee by seller: </span>
              {calDisputeFee(escrowOrder.amount)} {COIN.XEC}
            </Typography>
            {escrowOrder?.buyerDepositTx && (
              <Typography variant="body1" className="amount-buyer">
                <span className="prefix">Dispute fee by buyer: </span>
                {calDisputeFee(escrowOrder.amount)} {COIN.XEC}
              </Typography>
            )}
          </DisputeDetailInfoWrap>
          <div className="group-btn-chat">
            <Button
              className="chat-btn"
              color="info"
              variant="contained"
              onClick={() =>
                handleTelegramClick(escrowOrder.sellerAccount.telegramUsername, escrowOrder.sellerAccount.publicKey)
              }
              disabled={isLoading || isFetching}
            >
              Chat with seller
              <Image width={32} height={32} alt="" src={'/ico-telegram.svg'} />
            </Button>
            <Button
              className="chat-btn"
              color="info"
              variant="contained"
              onClick={() =>
                handleTelegramClick(escrowOrder.buyerAccount.telegramUsername, escrowOrder.buyerAccount.publicKey)
              }
              disabled={isLoading || isFetching}
            >
              Chat with buyer
              <Image width={32} height={32} alt="" src={'/ico-telegram.svg'} />
            </Button>
          </div>
          <Button
            className="resolve-btn"
            color="primary"
            variant="contained"
            fullWidth
            onClick={() => setOpenReleaseModal(true)}
            disabled={escrowOrder?.dispute.status === DisputeStatus.Resolved}
          >
            {escrowOrder?.dispute.status === DisputeStatus.Resolved ? 'The dispute has been resolved' : 'Resolve'}
          </Button>
        </ResolveDisputeWrap>
      )}

      <StyledReleaseDialog
        fullScreen={fullScreen}
        open={openReleaseModal}
        onClose={() => setOpenReleaseModal(false)}
        TransitionComponent={Transition}
      >
        <IconButton className="back-btn" onClick={() => setOpenReleaseModal(false)}>
          <ChevronLeft />
        </IconButton>
        <DialogTitle>Resolve Dispute</DialogTitle>
        <DialogContent>
          <ReleaseDisputeWrap>
            <Tabs
              value={valueTab}
              onChange={handleChange}
              indicatorColor="secondary"
              textColor="inherit"
              variant="fullWidth"
            >
              <Tab
                label={TabType.BUYER}
                id={`full-width-tab-${TabType.BUYER}`}
                aria-controls={`full-width-tabpanel-${TabType.BUYER}`}
              />
              <Tab
                label={TabType.SELLER}
                id={`full-width-tab-${TabType.SELLER}`}
                aria-controls={`full-width-tabpanel-${TabType.SELLER}`}
              />
            </Tabs>
            <SwipeableViews index={valueTab} onChangeIndex={handleChangeIndex}>
              <TabPanel value={valueTab} index={0}>
                <div className="buyer-release">
                  <Typography textAlign="center" variant="body1">
                    Are you sure you want to release {escrowOrder?.amount} XEC to Buyer:{' '}
                    {escrowOrder?.buyerAccount?.telegramUsername} ?
                  </Typography>
                  <TextField
                    id="input-buyer"
                    placeholder={`Type ${escrowOrder?.buyerAccount?.telegramUsername} to release`}
                    onChange={e => {
                      setValidTextToRelease(e?.target?.value);
                    }}
                    variant="outlined"
                  />
                  <Button
                    variant="contained"
                    color="warning"
                    onClick={() => handleArbiModReleaseEscrow()}
                    autoFocus
                    disabled={loading || validTextToRelease !== escrowOrder?.buyerAccount?.telegramUsername}
                  >
                    Release to Buyer
                  </Button>
                  <Typography className="disclaim-buyer" textAlign="center" variant="body2">
                    *You will collect {calDisputeFee(escrowOrder?.amount)} {COIN.XEC} (dispute fees) from seller
                  </Typography>
                </div>
              </TabPanel>
              <TabPanel value={valueTab} index={1}>
                <div className="seller-release">
                  <Typography textAlign="center" variant="body1">
                    Are you sure you want to return {escrowOrder?.amount} XEC to Seller:{' '}
                    {escrowOrder?.sellerAccount?.telegramUsername} ?
                  </Typography>
                  <TextField
                    id="input-seller"
                    placeholder={`Type ${escrowOrder?.sellerAccount?.telegramUsername} to return`}
                    onChange={e => {
                      setValidTextToReturn(e?.target?.value);
                    }}
                    variant="outlined"
                  />
                  <Button
                    variant="contained"
                    color="info"
                    onClick={() => handleArbiModReturnEscrow()}
                    autoFocus
                    disabled={loading || validTextToReturn !== escrowOrder?.sellerAccount?.telegramUsername}
                  >
                    Return to Seller
                  </Button>
                  <Typography className="disclaim-seller" textAlign="center" variant="body2">
                    *You will collect {calDisputeFee(escrowOrder?.amount)} {COIN.XEC} (dispute fees) from{' '}
                    {escrowOrder?.buyerDepositTx ? 'buyer' : 'seller'}
                  </Typography>
                </div>
              </TabPanel>
            </SwipeableViews>
          </ReleaseDisputeWrap>
        </DialogContent>
      </StyledReleaseDialog>

      <Stack zIndex={999}>
        <CustomToast
          isOpen={error}
          content="Order's status update failed"
          handleClose={() => setError(false)}
          type="error"
          autoHideDuration={3500}
        />

        <CustomToast
          isOpen={releaseByArb}
          content="Order release to buyer successfully. Click here to see transaction!"
          handleClose={() => setReleaseByArb(false)}
          type="success"
          autoHideDuration={3500}
          isLink={true}
          linkDescription={`${coinInfo[COIN.XEC].blockExplorerUrl}/tx/${escrowOrder?.releaseTxid}`}
        />

        <CustomToast
          isOpen={returnByArb}
          content="Order return to seller successfully. Click here to see transaction!"
          handleClose={() => setReturnByArb(false)}
          type="success"
          autoHideDuration={3500}
          isLink={true}
          linkDescription={`${coinInfo[COIN.XEC].blockExplorerUrl}/tx/${escrowOrder?.returnTxid}`}
        />

        <CustomToast
          isOpen={request}
          content="Chat requested!"
          handleClose={() => setRequest(false)}
          type="info"
          autoHideDuration={3500}
        />
        <CustomToast
          isOpen={requestFail}
          content="Failed to request chat..."
          handleClose={() => setRequestFail(false)}
          type="info"
          autoHideDuration={3500}
        />
      </Stack>
    </MobileLayout>
  );
}
