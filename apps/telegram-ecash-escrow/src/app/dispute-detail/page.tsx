'use client';
import { EscrowAddressLink } from '@/src/components/DetailInfo/OrderDetailInfo';
import MobileLayout from '@/src/components/layout/MobileLayout';
import { TabPanel } from '@/src/components/Tab/Tab';
import TickerHeader from '@/src/components/TickerHeader/TickerHeader';
import { TabType } from '@/src/store/constants';
import { buildArbModTakeFeeTx } from '@/src/store/escrow';
import { ACTION } from '@/src/store/escrow/constant';
import { ArbTakeFeeSignatory, SignOracleSignatory } from '@/src/store/escrow/signatory';
import { hexEncode, hexToUint8Array } from '@/src/store/util';
import { COIN, coinInfo } from '@bcpros/lixi-models';
import {
  disputeApi,
  DisputeStatus,
  EscrowOrderAction,
  escrowOrderApi,
  EscrowOrderStatus,
  getSelectedWalletPath,
  showToast,
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
  Tab,
  Tabs,
  TextField,
  Typography,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { TransitionProps } from '@mui/material/transitions';
import { fromHex, Script, shaRmd160 } from 'ecash-lib';
import _ from 'lodash';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import React, { useContext, useEffect, useMemo, useState } from 'react';
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
  const [updateOrderTrigger] = useUpdateEscrowOrderStatusMutation();
  const [updateEscrowOrderSignatoryTrigger] = useUpdateEscrowOrderSignatoryMutation();
  const [updateDisputeTrigger] = useUpdateDisputeMutation();
  const [trigger, { isFetching, isLoading }] = useLazyArbiRequestTelegramChatQuery();

  useEffect(() => {
    if (
      escrowOrderQueryData?.escrowOrder?.escrowOrderStatus !== EscrowOrderStatus.Complete &&
      escrowOrderQueryData?.escrowOrder?.escrowOrderStatus !== EscrowOrderStatus.Cancel
    ) {
      // Handle the beforeunload event
      const handleBeforeUnload = e => {
        // Cancel the event
        e.preventDefault();

        // Chrome requires returnValue to be set
        e.returnValue = '';

        // Native browser alert will be shown automatically
        // The message below might be shown, but most modern browsers
        // display their own standardized message for security reasons
        return 'Are you sure you want to leave this page?';
      };

      window.addEventListener('beforeunload', handleBeforeUnload);

      return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
      };
    }
  }, [escrowOrderQueryData?.escrowOrder?.escrowOrderStatus]);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValueTab(newValue);
  };

  const handleChangeIndex = (index: number) => {
    setValueTab(index);
  };

  const showError = () => {
    dispatch(
      showToast('error', {
        message: 'Error',
        description: "Order's status update failed."
      })
    );
  };

  // Common helper function for both release and return operations
  const handleDisputeResolution = async (isRelease: boolean) => {
    setLoading(true);

    try {
      const escrowOrder = escrowOrderQueryData?.escrowOrder;
      const wallet = selectedWalletPath;

      if (!escrowOrder || !wallet) {
        throw new Error('Missing required data');
      }

      // Extract wallet data once
      const walletData = {
        sk: fromHex(wallet.privateKey),
        pk: fromHex(wallet.publicKey),
        pkh: shaRmd160(fromHex(wallet.publicKey))
      };

      const isArbi = wallet.hash160 === escrowOrder.arbitratorAccount.hash160;
      const arbModP2pkh = Script.p2pkh(walletData.pkh);

      // Different scripts based on operation type
      const escrowFeeScript = new Script(
        hexToUint8Array(isRelease ? escrowOrder.escrowFeeScript : escrowOrder.escrowBuyerDepositFeeScript)
      );

      // Handle fee collection
      // If release, arb take fee of seller, else if return arb take fee of buyer (if have)
      const isReturnAndHaveBuyerDeposit = !isRelease && Boolean(escrowOrder.buyerDepositTx);
      if (isRelease || isReturnAndHaveBuyerDeposit) {
        const isBuyerDeposit = isReturnAndHaveBuyerDeposit;
        const arbTakeFeeSig = ArbTakeFeeSignatory(walletData.sk, walletData.pk);
        const txBuild = buildArbModTakeFeeTx(
          escrowOrder.escrowTxids[0],
          calDisputeFee,
          escrowFeeScript,
          arbTakeFeeSig,
          arbModP2pkh,
          isBuyerDeposit
        );

        const { txid } = await chronik.broadcastTx(txBuild);

        if (txid) {
          const link = `${coinInfo[COIN.XEC].blockExplorerUrl}/tx/${txid}`;
          const description = isRelease
            ? 'Order was released to the buyer successfully, and the fee has been collected!'
            : 'Order was returned to the seller successfully, and the fee has been collected!';

          dispatch(
            showToast(
              'success',
              {
                message: 'success',
                description
              },
              true,
              link
            )
          );
        }
      }

      // Update signatory based on role and operation
      const action = isArbi
        ? isRelease
          ? ACTION.ARBI_RELEASE
          : ACTION.ARBI_RETURN
        : isRelease
          ? ACTION.MOD_RELEASE
          : ACTION.MOD_RETURN;

      const signatory = SignOracleSignatory(walletData.sk, action, escrowOrder.nonce);
      const arbModHash = hexEncode(walletData.pkh);

      await updateEscrowOrderSignatoryTrigger({
        input: {
          orderId: escrowOrder.id,
          action: isRelease ? EscrowOrderAction.Release : EscrowOrderAction.Return,
          signatory: hexEncode(signatory),
          signatoryOwnerHash160: arbModHash,
          // signatoryOwner of fee: if release, release fee for buyer, else return fee for seller
          ...(isRelease
            ? { signatoryOwnerBuyerDepositFeeHash160: arbModHash }
            : { signatoryOwnerFeeHash160: arbModHash })
        }
      }).unwrap();

      // Update dispute status
      await updateDisputeTrigger({
        input: {
          id: id!,
          escrowOrderId: escrowOrder.id,
          status: DisputeStatus.Resolved
        }
      }).unwrap();
    } catch (error) {
      console.error(isRelease ? 'Release failed:' : 'Return failed:', error);
      showError();
    } finally {
      setOpenReleaseModal(false);
      setLoading(false);
    }
  };

  const handleArbModRelease = async () => {
    await handleDisputeResolution(true);
  };

  const handleArbModReturn = async () => {
    await handleDisputeResolution(false);
  };

  const handleTelegramClick = async (username, publicKey) => {
    if (username?.includes('@')) {
      window.open(`https://t.me/${username.substring(1)}`, '_blank');
      return;
    }

    try {
      await trigger({
        escrowOrderId: escrowOrderQueryData?.escrowOrder?.id,
        requestChatPublicKey: publicKey
      });

      dispatch(
        showToast('info', {
          message: 'info',
          description: 'Chat requested!'
        })
      );
    } catch (error) {
      dispatch(
        showToast('info', {
          message: 'info',
          description: 'Failed to request chat...'
        })
      );
    }
  };

  const calDisputeFee = useMemo(() => {
    const amountOrder = escrowOrderQueryData?.escrowOrder.amount;

    const fee1Percent = parseFloat((amountOrder / 100).toFixed(2));
    const dustXEC = coinInfo[COIN.XEC].dustSats / Math.pow(10, coinInfo[COIN.XEC].cashDecimals);

    return Math.max(fee1Percent, dustXEC);
  }, [escrowOrderQueryData?.escrowOrder.amount]);

  // join room
  useEffect(() => {
    escrowOrderQueryData?.escrowOrder?.escrowOrderStatus !== EscrowOrderStatus.Complete &&
      isEscrowOrderSuccess &&
      socket &&
      dispatch(userSubcribeEscrowOrderChannel(escrowOrderQueryData?.escrowOrder?.id));
  }, [socket, isEscrowOrderSuccess]);

  if (
    isEscrowOrderSuccess &&
    escrowOrderQueryData?.escrowOrder?.arbitratorAccount.hash160 !== selectedWalletPath?.hash160 &&
    escrowOrderQueryData?.escrowOrder?.moderatorAccount.hash160 !== selectedWalletPath?.hash160
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
              {disputeQueryData?.dispute.createdBy === escrowOrderQueryData?.escrowOrder?.sellerAccount.publicKey
                ? 'Seller'
                : 'Buyer'}
            </Typography>
            {disputeQueryData?.dispute?.reason && (
              <Typography variant="body1">
                <span className="prefix">Reason: </span>
                {disputeQueryData?.dispute.reason}
              </Typography>
            )}
            <Typography variant="body1">
              <span className="prefix">Order Id: </span>
              {escrowOrderQueryData?.escrowOrder?.id}
            </Typography>
            <Typography variant="body1">
              <span className="prefix">Created At: </span>
              {new Date(escrowOrderQueryData?.escrowOrder?.createdAt).toLocaleString('vi-VN')}
            </Typography>
            <Typography variant="body1">
              <span className="prefix">Seller: </span>
              {escrowOrderQueryData?.escrowOrder?.sellerAccount.telegramUsername}
            </Typography>
            <Typography variant="body1">
              <span className="prefix">Buyer: </span>
              {escrowOrderQueryData?.escrowOrder?.buyerAccount.telegramUsername}
            </Typography>
            {EscrowAddressLink('Escrow Address', escrowOrderQueryData?.escrowOrder?.escrowAddress)}
            {EscrowAddressLink('Seller security deposit address', escrowOrderQueryData?.escrowOrder?.escrowFeeAddress)}
            {escrowOrderQueryData?.escrowOrder?.buyerDepositTx &&
              EscrowAddressLink(
                'Buyer security deposit address',
                escrowOrderQueryData?.escrowOrder?.escrowBuyerDepositFeeAddress
              )}
            <Typography variant="body1" className="amount-escrowed">
              <span className="prefix">Escrowed amount: </span>
              {escrowOrderQueryData?.escrowOrder?.amount} {COIN.XEC}
            </Typography>
            <Typography variant="body1" className="amount-seller">
              <span className="prefix">Security fee by seller: </span>
              {calDisputeFee} {COIN.XEC}
            </Typography>
            {escrowOrderQueryData?.escrowOrder?.buyerDepositTx && (
              <Typography variant="body1" className="amount-buyer">
                <span className="prefix">Security fee by buyer: </span>
                {calDisputeFee} {COIN.XEC}
              </Typography>
            )}
          </DisputeDetailInfoWrap>
          {escrowOrderQueryData?.escrowOrder?.dispute.status === DisputeStatus.Resolved ? (
            <Alert icon={<InfoOutlined fontSize="inherit" />} severity="info" sx={{ borderRadius: '8px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <AlertTitle>
                  <b>Resolved at: {new Date(escrowOrderQueryData?.escrowOrder?.updatedAt).toLocaleString('vi-VN')}</b>
                </AlertTitle>
                <Typography style={{ fontSize: '15px' }} fontWeight="bold">
                  {escrowOrderQueryData?.escrowOrder?.escrowOrderStatus === EscrowOrderStatus.Complete
                    ? 'The funds have been forwarded to the buyer. '
                    : 'The funds have been returned to the seller. '}
                </Typography>
                <Link
                  target="_blank"
                  rel="noopener"
                  href={
                    escrowOrderQueryData?.escrowOrder?.releaseTxid
                      ? `${coinInfo[COIN.XEC].blockExplorerUrl}/tx/${escrowOrderQueryData?.escrowOrder?.releaseTxid}`
                      : `${coinInfo[COIN.XEC].blockExplorerUrl}/tx/${escrowOrderQueryData?.escrowOrder?.returnTxid}`
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
                handleTelegramClick(
                  escrowOrderQueryData?.escrowOrder?.sellerAccount.telegramUsername,
                  escrowOrderQueryData?.escrowOrder?.sellerAccount.publicKey
                )
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
                handleTelegramClick(
                  escrowOrderQueryData?.escrowOrder?.buyerAccount.telegramUsername,
                  escrowOrderQueryData?.escrowOrder?.buyerAccount.publicKey
                )
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
                    Are you sure you want to release {escrowOrderQueryData?.escrowOrder?.amount} XEC to Buyer:{' '}
                    {escrowOrderQueryData?.escrowOrder?.buyerAccount?.telegramUsername} ?
                  </Typography>
                  <TextField
                    id="input-buyer"
                    placeholder={`Type ${escrowOrderQueryData?.escrowOrder?.buyerAccount?.telegramUsername} to release`}
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
                    disabled={
                      loading ||
                      validTextToRelease !== escrowOrderQueryData?.escrowOrder?.buyerAccount?.telegramUsername
                    }
                  >
                    Release to Buyer
                  </Button>
                </div>
              </TabPanel>
              <TabPanel value={valueTab} index={1}>
                <div className="seller-release">
                  <Typography textAlign="center" variant="body1">
                    Are you sure you want to return {escrowOrderQueryData?.escrowOrder?.amount} XEC to Seller:{' '}
                    {escrowOrderQueryData?.escrowOrder?.sellerAccount?.telegramUsername} ?
                  </Typography>
                  <TextField
                    id="input-seller"
                    placeholder={`Type ${escrowOrderQueryData?.escrowOrder?.sellerAccount?.telegramUsername} to return`}
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
                    disabled={
                      loading ||
                      validTextToReturn !== escrowOrderQueryData?.escrowOrder?.sellerAccount?.telegramUsername
                    }
                  >
                    Return to Seller
                  </Button>
                </div>
              </TabPanel>
            </SwipeableViews>
          </ReleaseDisputeWrap>
        </DialogContent>
      </StyledReleaseDialog>
    </MobileLayout>
  );
}
