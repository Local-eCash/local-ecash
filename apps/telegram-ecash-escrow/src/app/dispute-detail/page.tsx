'use client';
import MobileLayout from '@/src/components/layout/MobileLayout';
import { TabPanel } from '@/src/components/Tab/Tab';
import TickerHeader from '@/src/components/TickerHeader/TickerHeader';
import CustomToast from '@/src/components/Toast/CustomToast';
import { TabType } from '@/src/store/constants';
import { SignOracleSignatory } from '@/src/store/escrow';
import { ACTION } from '@/src/store/escrow/constant';
import { COIN, coinInfo } from '@bcpros/lixi-models';
import {
  disputeApi,
  DisputeStatus,
  EscrowOrderAction,
  escrowOrderApi,
  EscrowOrderStatus,
  getSelectedWalletPath,
  SocketContext,
  useSliceDispatch as useLixiSliceDispatch,
  useSliceSelector as useLixiSliceSelector,
  userSubcribeEscrowOrderChannel,
  WalletContextNode
} from '@bcpros/redux-store';
import { ChevronLeft, InfoOutlined } from '@mui/icons-material';
import {
  Alert,
  AlertTitle,
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
import { styled } from '@mui/material/styles';
import { TransitionProps } from '@mui/material/transitions';
import { fromHex, shaRmd160 } from 'ecash-lib';
import _ from 'lodash';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import React, { useContext, useEffect, useState } from 'react';
import SwipeableViews from 'react-swipeable-views';

const DisputeDetailInfoWrap = styled('div')(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',

  '.prefix': {
    fontSize: '14px',
    color: '#79869b'
  },

  '.amount-escrowed': {
    color: '#66bb6a'
  },

  '.amount-seller': {
    color: '#29b6f6'
  },

  '.amount-buyer': {
    color: '#f44336'
  }
}));

const ResolveDisputeWrap = styled('div')(({ theme }) => ({
  padding: '16px',

  '.group-btn-chat': {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '8px',
    borderTop: '1px dashed gray',
    paddingTop: '8px',
    marginTop: '16px',

    '.chat-btn': {
      width: 'fit-content',
      justifyContent: 'flex-start',
      textTransform: 'none',
      gap: '8px',
      padding: '10px',
      color: '#fff',
      fontWeight: 600
    }
  },

  '.resolve-btn': {
    marginTop: '15px',
    color: '#fff',
    fontWeight: 600
  }
}));

const StyledReleaseDialog = styled(Dialog)(({ theme }) => ({
  '.MuiPaper-root': {
    background: theme.palette.background.default,
    backgroundRepeat: 'no-repeat',
    backgroundSize: 'cover',
    width: '500px',
    height: '100vh',
    maxHeight: '100%',
    margin: 0,

    [theme.breakpoints.down('sm')]: {
      width: '100%'
    }
  },

  '.MuiIconButton-root': {
    width: 'fit-content',

    svg: {
      fontSize: '32px'
    }
  },

  '.MuiDialogTitle-root': {
    padding: '0 16px',
    paddingTop: '16px',
    fontSize: '26px',
    textAlign: 'center'
  },

  '.MuiDialogContent-root': {
    padding: 0
  },

  '.back-btn': {
    padding: 0,
    position: 'absolute',
    left: '8px',
    top: '20px',
    borderRadius: '12px',

    svg: {
      fontSize: '32px'
    }
  }
}));

const ReleaseDisputeWrap = styled('div')(({ theme }) => ({
  padding: '16px',

  '.seller-release, .buyer-release': {
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    marginBottom: '32px',

    button: {
      color: 'white',
      textTransform: 'none'
    },

    '.disclaim-buyer': {
      color: '#f57c00'
    },

    '.disclaim-seller': {
      color: '#29b6f6'
    }
  }
}));

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

  const { useDisputeQuery, useUpdateDisputeMutation } = disputeApi;
  const {
    useEscrowOrderQuery,
    useUpdateEscrowOrderStatusMutation,
    useLazyArbiRequestTelegramChatQuery,
    useUpdateEscrowOrderSignatoryMutation
  } = escrowOrderApi;
  const { currentData: disputeQueryData, isError } = useDisputeQuery({ id: id! }, { skip: !id || !token });
  const { currentData: escrowOrderQueryData, isSuccess: isEscrowOrderSuccess } = useEscrowOrderQuery(
    { id: disputeQueryData?.dispute.escrowOrder.id },
    { skip: !disputeQueryData?.dispute.escrowOrder.id }
  );
  const { escrowOrder } = { ...escrowOrderQueryData };
  const [updateOrderTrigger] = useUpdateEscrowOrderStatusMutation();
  const [updateEscrowOrderSignatoryTrigger] = useUpdateEscrowOrderSignatoryMutation();
  const [updateDisputeTrigger] = useUpdateDisputeMutation();
  const [trigger, { isFetching, isLoading }] = useLazyArbiRequestTelegramChatQuery();

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValueTab(newValue);
  };

  const handleChangeIndex = (index: number) => {
    setValueTab(index);
  };

  const handleArbModRelease = async () => {
    setLoading(true);

    const nonce = escrowOrder.nonce as string;
    const isArbi = selectedWalletPath?.hash160 === escrowOrder.arbitratorAccount.hash160;

    const arbiModSk = fromHex(selectedWalletPath?.privateKey);
    const arbiModPk = fromHex(selectedWalletPath?.publicKey);
    const arbiModPkh = shaRmd160(arbiModPk);

    try {
      if (isArbi) {
        const arbiSignatory = SignOracleSignatory(arbiModSk, ACTION.ARBI_RELEASE, nonce);

        await updateEscrowOrderSignatoryTrigger({
          input: {
            orderId: escrowOrder.id!,
            action: EscrowOrderAction.Release,
            signatory: Buffer.from(arbiSignatory).toString('hex'),
            signatoryOwnerHash160: Buffer.from(arbiModPkh).toString('hex')
          }
        }).unwrap();
      } else {
        const modSignatory = SignOracleSignatory(arbiModSk, ACTION.MOD_RELEASE, nonce);

        await updateEscrowOrderSignatoryTrigger({
          input: {
            orderId: escrowOrder.id!,
            action: EscrowOrderAction.Release,
            signatory: Buffer.from(modSignatory).toString('hex'),
            signatoryOwnerHash160: Buffer.from(arbiModPkh).toString('hex')
          }
        }).unwrap();
      }

      await updateDisputeTrigger({ input: { id: id!, escrowOrderId: escrowOrder.id!, status: DisputeStatus.Resolved } })
        .unwrap()
        .then(() => setReleaseByArb(true));
    } catch (e) {
      console.log(e);
      setError(true);
    }

    setOpenReleaseModal(false);
    setLoading(false);
  };

  const handleArbModReturn = async () => {
    setLoading(true);

    const nonce = escrowOrder.nonce as string;
    const isArbi = selectedWalletPath?.hash160 === escrowOrder.arbitratorAccount.hash160;

    const arbiModSk = fromHex(selectedWalletPath?.privateKey);
    const arbiModPk = fromHex(selectedWalletPath?.publicKey);
    const arbiModPkh = shaRmd160(arbiModPk);

    try {
      if (isArbi) {
        const arbiSignatory = SignOracleSignatory(arbiModSk, ACTION.ARBI_RETURN, nonce);

        await updateEscrowOrderSignatoryTrigger({
          input: {
            orderId: escrowOrder.id!,
            action: EscrowOrderAction.Return,
            signatory: Buffer.from(arbiSignatory).toString('hex'),
            signatoryOwnerHash160: Buffer.from(arbiModPkh).toString('hex')
          }
        })
          .unwrap()
          .then(() => setReturnByArb(true));
      } else {
        const modSignatory = SignOracleSignatory(arbiModSk, ACTION.MOD_RETURN, nonce);

        await updateEscrowOrderSignatoryTrigger({
          input: {
            orderId: escrowOrder.id!,
            action: EscrowOrderAction.Return,
            signatory: Buffer.from(modSignatory).toString('hex'),
            signatoryOwnerHash160: Buffer.from(arbiModPkh).toString('hex')
          }
        }).unwrap();
      }

      await updateDisputeTrigger({
        input: { id: id!, escrowOrderId: escrowOrder.id!, status: DisputeStatus.Resolved }
      })
        .unwrap()
        .then(() => setReleaseByArb(true));
    } catch (e) {
      console.log(e);
      setError(true);
    }

    setOpenReleaseModal(false);
    setLoading(false);
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
      dispatch(userSubcribeEscrowOrderChannel(escrowOrder?.id));
  }, [socket, isEscrowOrderSuccess]);

  if (
    isEscrowOrderSuccess &&
    escrowOrder?.arbitratorAccount.hash160 !== selectedWalletPath?.hash160 &&
    escrowOrder?.moderatorAccount.hash160 !== selectedWalletPath?.hash160
  ) {
    return <div style={{ color: 'white' }}>Not allowed to view this dispute</div>;
  }

  if (_.isEmpty(id) || _.isNil(id) || isError) {
    return <div style={{ color: 'white' }}>Invalid dispute id</div>;
  }

  return (
    <MobileLayout>
      <TickerHeader title="Dispute detail" />
      {disputeQueryData?.dispute ? (
        <ResolveDisputeWrap>
          <DisputeDetailInfoWrap>
            <Typography variant="body1">
              <span className="prefix">Dispute by: </span>
              {disputeQueryData?.dispute.createdBy === escrowOrder?.sellerAccount.publicKey ? 'Seller' : 'Buyer'}
            </Typography>
            {disputeQueryData?.dispute?.reason && (
              <Typography variant="body1">
                <span className="prefix">Reason: </span>
                {disputeQueryData?.dispute.reason}
              </Typography>
            )}
            <Typography variant="body1">
              <span className="prefix">Order Id: </span>
              {escrowOrder?.id}
            </Typography>
            <Typography variant="body1">
              <span className="prefix">Created At: </span>
              {new Date(escrowOrder?.createdAt).toLocaleString('vi-VN')}
            </Typography>
            <Typography variant="body1">
              <span className="prefix">Seller: </span>
              {escrowOrder?.sellerAccount.telegramUsername}
            </Typography>
            <Typography variant="body1">
              <span className="prefix">Buyer: </span>
              {escrowOrder?.buyerAccount.telegramUsername}
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
                href={`${coinInfo[COIN.XEC].blockExplorerUrl}/address/${escrowOrder?.escrowAddress}`}
                target="_blank"
              >
                <span>{escrowOrder?.escrowAddress}</span>
              </a>
            </Typography>
            <Typography variant="body1" className="amount-escrowed">
              <span className="prefix">Escrowed amount: </span>
              {escrowOrder?.amount} {COIN.XEC}
            </Typography>
            <Typography variant="body1" className="amount-seller">
              <span className="prefix">Security fee by seller: </span>
              {calDisputeFee(escrowOrder?.amount)} {COIN.XEC}
            </Typography>
            {escrowOrder?.buyerDepositTx && (
              <Typography variant="body1" className="amount-buyer">
                <span className="prefix">Security fee by buyer: </span>
                {calDisputeFee(escrowOrder?.amount)} {COIN.XEC}
              </Typography>
            )}
          </DisputeDetailInfoWrap>
          {escrowOrder?.dispute.status === DisputeStatus.Resolved ? (
            <Alert icon={<InfoOutlined fontSize="inherit" />} severity="info" sx={{ borderRadius: '8px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <AlertTitle>
                  <b>Resolved at: {new Date(escrowOrder?.updatedAt).toLocaleString('vi-VN')}</b>
                </AlertTitle>
                <Typography style={{ fontSize: '15px' }} fontWeight="bold">
                  {escrowOrder?.escrowOrderStatus === EscrowOrderStatus.Complete
                    ? 'The fund have been forwarded to the buyer. '
                    : 'The fund have been returned to the seller. '}
                </Typography>
                <Link
                  target="_blank"
                  rel="noopener"
                  href={
                    escrowOrder?.releaseTxid
                      ? `${coinInfo[COIN.XEC].blockExplorerUrl}/tx/${escrowOrder?.releaseTxid}`
                      : `${coinInfo[COIN.XEC].blockExplorerUrl}/tx/${escrowOrder?.returnTxid}`
                  }
                >
                  <b>View Transaction</b>
                </Link>
              </div>
            </Alert>
          ) : (
            <Button
              className="resolve-btn"
              color="primary"
              variant="contained"
              fullWidth
              onClick={() => setOpenReleaseModal(true)}
            >
              Resolve
            </Button>
          )}
          <div className="group-btn-chat">
            <Button
              className="chat-btn"
              color="info"
              variant="contained"
              onClick={() =>
                handleTelegramClick(escrowOrder?.sellerAccount.telegramUsername, escrowOrder?.sellerAccount.publicKey)
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
                handleTelegramClick(escrowOrder?.buyerAccount.telegramUsername, escrowOrder?.buyerAccount.publicKey)
              }
              disabled={isLoading || isFetching}
            >
              Chat with buyer
              <Image width={32} height={32} alt="" src={'/ico-telegram.svg'} />
            </Button>
          </div>
        </ResolveDisputeWrap>
      ) : (
        <div style={{ display: 'flex', justifyContent: 'center', height: '100vh' }}>
          <CircularProgress style={{ color: 'white', margin: 'auto' }} />
        </div>
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
                    onClick={() => handleArbModRelease()}
                    autoFocus
                    disabled={loading || validTextToRelease !== escrowOrder?.buyerAccount?.telegramUsername}
                  >
                    Release to Buyer
                  </Button>
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
                    onClick={() => handleArbModReturn()}
                    autoFocus
                    disabled={loading || validTextToReturn !== escrowOrder?.sellerAccount?.telegramUsername}
                  >
                    Return to Seller
                  </Button>
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
