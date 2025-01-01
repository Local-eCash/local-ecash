'use client';

import ConfirmCancelModal from '@/src/components/Action/ConfirmCancelModal';
import ConfirmReleaseModal from '@/src/components/Action/ConfirmReleaseModal';
import OrderDetailInfo from '@/src/components/DetailInfo/OrderDetailInfo';
import MobileLayout from '@/src/components/layout/MobileLayout';
import QRCode from '@/src/components/QRcode/QRcode';
import TelegramButton from '@/src/components/TelegramButton/TelegramButton';
import TickerHeader from '@/src/components/TickerHeader/TickerHeader';
import CustomToast from '@/src/components/Toast/CustomToast';
import { UtxoContext } from '@/src/store/context/utxoProvider';
import { buildReleaseTx, BuyerReturnSignatory, sellerBuildDepositTx, SellerReleaseSignatory } from '@/src/store/escrow';
import { deserializeTransaction, estimatedFee } from '@/src/store/util';
import { COIN, coinInfo } from '@bcpros/lixi-models';
import {
  DisputeStatus,
  escrowOrderApi,
  EscrowOrderStatus,
  getSelectedWalletPath,
  openModal,
  parseCashAddressToPrefix,
  SocketContext,
  useSliceDispatch as useLixiSliceDispatch,
  useSliceSelector as useLixiSliceSelector,
  userSubcribeEscrowOrderChannel,
  WalletContextNode
} from '@bcpros/redux-store';
import CheckIcon from '@mui/icons-material/Check';
import ClearIcon from '@mui/icons-material/Clear';
import HorizontalRuleIcon from '@mui/icons-material/HorizontalRule';
import TrendingFlatIcon from '@mui/icons-material/TrendingFlat';
import { Button, CircularProgress, Stack, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import { fromHex, Script, shaRmd160, Tx } from 'ecash-lib';
import cashaddr from 'ecashaddrjs';
import _ from 'lodash';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import React, { useContext, useEffect, useMemo, useState } from 'react';

const OrderDetailPage = styled('div')(({ theme }) => ({
  minHeight: '100vh',
  background: theme.palette.background.default,
  backgroundRepeat: 'no-repeat',
  backgroundSize: 'cover',

  '.icon-rule': {
    color: theme.custom.colorItem
  }
}));

const OrderDetailContent = styled('div')(({ theme }) => ({
  padding: '0 16px',

  '.group-button-wrap': {
    width: '100%',
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '16px',
    borderBottom: `1px solid rgba(255, 255, 255, 0.2)`,
    paddingBottom: '16px',

    button: {
      textTransform: 'none',
      color: theme.palette.common.white
    }
  }
}));

const ActionStatusRelease = styled('div')(() => ({
  '.MuiFormGroup-root': {
    marginBottom: '5px'
  },
  '.MuiFormControl-root': {
    marginBottom: '5px'
  }
}));

const OrderDetail = () => {
  const dispatch = useLixiSliceDispatch();
  const token = sessionStorage.getItem('Authorization');
  const search = useSearchParams();
  const id = search!.get('id');
  const router = useRouter();
  const { socket } = useContext(SocketContext) || {};

  const selectedWalletPath = useLixiSliceSelector(getSelectedWalletPath);
  const Wallet = useContext(WalletContextNode);
  const { chronik } = Wallet;
  const { totalValidAmount, totalValidUtxos } = useContext(UtxoContext);

  const [error, setError] = useState(false);
  const [escrow, setEscrow] = useState(false);
  const [release, setRelease] = useState(false);
  const [cancel, setCancel] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notEnoughFund, setNotEnoughFund] = useState(false);
  const [openCancelModal, setOpenCancelModal] = useState(false);
  const [openReleaseModal, setOpenReleaseModal] = useState(false);
  const [alreadyRelease, setAlreadyRelease] = useState(false);
  const [alreadyCancel, setAlreadyCancel] = useState(false);

  const { useEscrowOrderQuery, useUpdateEscrowOrderStatusMutation } = escrowOrderApi;
  const { currentData, isError, isSuccess } = useEscrowOrderQuery({ id: id! }, { skip: !id || !token });
  const [updateOrderTrigger] = useUpdateEscrowOrderStatusMutation();

  useEffect(() => {
    currentData?.escrowOrder.escrowOrderStatus !== EscrowOrderStatus.Complete &&
      isSuccess &&
      !_.isNil(socket) &&
      dispatch(userSubcribeEscrowOrderChannel(id));
  }, [socket, isSuccess]);

  const updateOrderStatus = async (status: EscrowOrderStatus) => {
    setLoading(true);

    let utxoRemoved = null;
    const buyerDepositTx = currentData?.escrowOrder.buyerDepositTx;
    if (buyerDepositTx) {
      //deserialize
      const strJsonTx = Buffer.from(buyerDepositTx, 'hex').toString();
      const deserializeTx = new Tx(deserializeTransaction(strJsonTx));
      utxoRemoved = {
        txid: deserializeTx.inputs[0].prevOut.txid as string,
        outIdx: deserializeTx.inputs[0].prevOut.outIdx,
        value: deserializeTx.inputs[0].signData.value as number
      };
    }

    await updateOrderTrigger({ input: { orderId: id!, status, utxoInNodeOfBuyer: utxoRemoved, socketId: socket?.id } })
      .unwrap()
      .catch(() => setError(true));

    setLoading(false);
  };

  const handleSellerDepositEscrow = async () => {
    setLoading(true);

    try {
      const amount = totalAmountWithDepositAndEscrowFee();

      const sellerSk = fromHex(selectedWalletPath?.privateKey);
      const sellerPk = fromHex(selectedWalletPath?.publicKey);
      const script = Buffer.from(currentData?.escrowOrder.escrowScript as string, 'hex') as unknown as Uint8Array;

      const escrowScript = new Script(script);

      const { txBuild, utxoRemoved } = sellerBuildDepositTx(
        totalValidUtxos,
        sellerSk,
        sellerPk,
        amount,
        escrowScript,
        currentData?.escrowOrder.buyerDepositTx
      );

      let txid = null;
      try {
        txid = (await chronik.broadcastTx(txBuild)).txid;
      } catch (err) {
        setNotEnoughFund(true);
      }

      if (txid) {
        //update status
        const tx = await chronik.tx(txid);

        const { outputs, tokenEntries } = tx;
        const startIndex: number = tokenEntries.length !== 0 ? 1 : 0;

        // process each tx output
        for (let i = startIndex; i < outputs.length; i++) {
          const scriptHex = outputs[i].outputScript;
          const address = cashaddr.encodeOutputScript(scriptHex, 'ecash');

          if (address === currentData?.escrowOrder.escrowAddress) {
            const value = outputs[i].value;
            await updateOrderTrigger({
              input: {
                orderId: id!,
                status: EscrowOrderStatus.Escrow,
                txid,
                value,
                outIdx: i,
                utxoInNodeOfBuyer: utxoRemoved,
                socketId: socket?.id
              }
            })
              .unwrap()
              .then(() => setEscrow(true))
              .catch(() => setError(true));
          }
        }
      }
    } catch (e) {
      console.log(e);
      setNotEnoughFund(true);
    }

    setLoading(false);
  };

  const handleRelease = addressToRelease => {
    const GNCAddress = process.env.NEXT_PUBLIC_ADDRESS_GNC;

    const changeAddress = _.isEmpty(addressToRelease) || _.isNil(addressToRelease) ? GNCAddress : addressToRelease;
    const isGNCAddress = changeAddress === GNCAddress;
    handleSellerReleaseEscrow(EscrowOrderStatus.Complete, changeAddress, isGNCAddress);
  };

  const handleSellerReleaseEscrow = async (status: EscrowOrderStatus, changeAddress: string, isGNCAddress: boolean) => {
    setLoading(true);

    if (currentData?.escrowOrder.escrowOrderStatus === EscrowOrderStatus.Complete) {
      setAlreadyRelease(true);
      setOpenReleaseModal(false);

      return;
    }

    try {
      const { amount } = currentData?.escrowOrder;
      const disputeFee = calDisputeFee;
      const isBuyerDeposit = currentData?.escrowOrder.buyerDepositTx ? true : false;

      const sellerSk = fromHex(selectedWalletPath?.privateKey);
      const sellerPk = fromHex(selectedWalletPath?.publicKey);
      const escrowTxids = currentData?.escrowOrder.escrowTxids;
      const buyerPk = fromHex(currentData?.escrowOrder.buyerAccount.publicKey as string);
      const buyerPkh = shaRmd160(buyerPk);
      const buyerP2pkh = Script.p2pkh(buyerPkh);
      const nonce = currentData?.escrowOrder.nonce as string;
      const script = Buffer.from(currentData?.escrowOrder.escrowScript as string, 'hex') as unknown as Uint8Array;

      const escrowScript = new Script(script);
      const sellerSignatory = SellerReleaseSignatory(sellerSk, sellerPk, buyerPk, nonce);

      const txBuild = buildReleaseTx(
        escrowTxids,
        amount,
        escrowScript,
        sellerSignatory,
        buyerP2pkh,
        changeAddress,
        disputeFee,
        isBuyerDeposit,
        isGNCAddress
      );

      const txid = (await chronik.broadcastTx(txBuild)).txid;

      // update order status to escrow
      await updateOrderTrigger({ input: { orderId: id!, status, txid, socketId: socket?.id } })
        .unwrap()
        .then(() => setRelease(true))
        .catch(() => setError(true));
    } catch (e) {
      console.log(e);
    }

    setLoading(false);
  };

  const handleBuyerReturnEscrow = async (status: EscrowOrderStatus) => {
    setLoading(true);

    if (currentData?.escrowOrder.escrowOrderStatus === EscrowOrderStatus.Cancel) {
      setAlreadyCancel(true);
      setOpenCancelModal(false);

      return;
    }

    try {
      const { amount } = currentData?.escrowOrder;
      const buyerAddress = parseCashAddressToPrefix(COIN.XEC, selectedWalletPath?.cashAddress);
      const disputeFee = calDisputeFee;
      const isBuyerDeposit = currentData?.escrowOrder.buyerDepositTx ? true : false;

      const buyerSk = fromHex(selectedWalletPath?.privateKey);
      const buyerPk = fromHex(selectedWalletPath?.publicKey);
      const escrowTxid = currentData?.escrowOrder.escrowTxids;
      const sellerPk = fromHex(currentData?.escrowOrder.sellerAccount.publicKey as string);
      const sellerPkh = shaRmd160(sellerPk);
      const sellerP2pkh = Script.p2pkh(sellerPkh);
      const nonce = currentData?.escrowOrder.nonce as string;
      const script = Buffer.from(currentData?.escrowOrder.escrowScript as string, 'hex') as unknown as Uint8Array;

      const escrowScript = new Script(script);
      const buyerSignatory = BuyerReturnSignatory(buyerSk, buyerPk, sellerPk, nonce);

      const txBuild = buildReleaseTx(
        escrowTxid,
        amount,
        escrowScript,
        buyerSignatory,
        sellerP2pkh,
        isBuyerDeposit ? buyerAddress : null,
        disputeFee,
        isBuyerDeposit
      );

      const txid = (await chronik.broadcastTx(txBuild)).txid;

      // update order status to escrow
      await updateOrderTrigger({ input: { orderId: id!, status, txid, socketId: socket?.id } })
        .unwrap()
        .then(() => setCancel(true))
        .catch(() => setError(true));
    } catch (e) {
      console.log(e);
    }

    setLoading(false);
  };

  const handleCreateDispute = () => {
    dispatch(openModal('ReasonDisputeModal', { id: id! }));
  };

  const escrowStatus = () => {
    const isSeller = selectedWalletPath?.hash160 === currentData?.escrowOrder.sellerAccount.hash160;
    const isArbiOrMod =
      selectedWalletPath?.hash160 === currentData?.escrowOrder.arbitratorAccount.hash160 ||
      selectedWalletPath?.hash160 === currentData?.escrowOrder.moderatorAccount.hash160;

    if (currentData?.escrowOrder.escrowOrderStatus === EscrowOrderStatus.Cancel) {
      return (
        <Typography variant="body1" color="#FFBF00" align="center">
          Order has been cancelled
        </Typography>
      );
    }

    if (currentData?.escrowOrder.escrowOrderStatus === EscrowOrderStatus.Complete) {
      return (
        <Typography variant="body1" color="#FFBF00" align="center">
          Order has been completed
        </Typography>
      );
    }

    if (!currentData?.escrowOrder.dispute && isArbiOrMod) {
      return (
        <Typography variant="body1" color="#FFBF00" align="center">
          The order is currently in progress.
        </Typography>
      );
    }

    if (currentData?.escrowOrder.escrowOrderStatus === EscrowOrderStatus.Pending) {
      return isSeller ? (
        <Typography variant="body1" color="#FFBF00" align="center" component={'div'}>
          {checkSellerEnoughFund() && !notEnoughFund ? (
            <div>
              Please escrow the order
              {InfoEscrow()}
            </div>
          ) : (
            <div>
              Not enough fund!! Please deposit money to your wallet
              {InfoEscrow()}
              {DepositQRCode()}
            </div>
          )}
        </Typography>
      ) : (
        <React.Fragment>
          <Typography variant="body1" color="#FFBF00" align="center">
            Pending Escrow!
          </Typography>
          <Stack direction="row" spacing={2} justifyContent="center" margin="20px">
            <Image width={50} height={50} src="/safebox-open.svg" alt="" />
            <Stack direction="row" spacing={0} justifyContent="center" color="white" alignItems="center">
              <HorizontalRuleIcon className="icon-rule" />
              <HorizontalRuleIcon className="icon-rule" />
              <ClearIcon color="error" />
              <HorizontalRuleIcon className="icon-rule" />
              <TrendingFlatIcon className="icon-rule" />
            </Stack>
            <Image width={50} height={50} src="/safebox-close.svg" alt="" />
          </Stack>
          <Typography variant="body1" color="#FFBF00" align="center">
            Once the order is escrowed, the status will turn green with a closed safe icon. Do not send money or goods
            until the order is escrowed, or you risk losing money.
          </Typography>
        </React.Fragment>
      );
    }

    if (currentData?.escrowOrder.dispute && currentData?.escrowOrder.dispute.status === DisputeStatus.Active) {
      return isArbiOrMod ? (
        <Typography variant="body1" color="#FFBF00" align="center">
          Please resolve the dispute
        </Typography>
      ) : (
        <Typography variant="body1" color="#FFBF00" align="center">
          Awating arbitrator/moderator to resolve the dispute
        </Typography>
      );
    }

    if (currentData?.escrowOrder.escrowOrderStatus === EscrowOrderStatus.Escrow) {
      return isSeller ? (
        <Typography variant="body1" color="#FFBF00" align="center">
          Only release the escrow when you have received the goods
        </Typography>
      ) : (
        <React.Fragment>
          <Typography variant="body1" color="#66bb6a" align="center">
            Successfully Escrowed!
          </Typography>
          <Stack direction="row" spacing={0} justifyContent="center" color="white" alignItems="center" margin="20px">
            <Image width={50} height={50} src="/safebox-close.svg" alt="" />
            <CheckIcon color="success" style={{ fontSize: '50px' }} />
          </Stack>
          <Typography variant="body1" color="#66bb6a" align="center">
            {`${currentData.escrowOrder.amount} XEC has been safely locked. You are now safe to send payments or goods to settle the order.`}
          </Typography>
        </React.Fragment>
      );
    }
  };

  const escrowActionButtons = () => {
    const isSeller = selectedWalletPath?.hash160 === currentData?.escrowOrder.sellerAccount.hash160;
    const isArbiOrMod =
      selectedWalletPath?.hash160 === currentData?.escrowOrder.arbitratorAccount.hash160 ||
      selectedWalletPath?.hash160 === currentData?.escrowOrder.moderatorAccount.hash160;

    if (!currentData?.escrowOrder.dispute && isArbiOrMod) {
      return;
    }

    if (
      isArbiOrMod &&
      currentData?.escrowOrder.dispute &&
      currentData?.escrowOrder.dispute.status === DisputeStatus.Active
    ) {
      return (
        <Button
          color="warning"
          variant="contained"
          onClick={() => router.push(`/dispute-detail?id=${currentData?.escrowOrder.dispute.id}`)}
          fullWidth={true}
        >
          Go to dispute
        </Button>
      );
    }

    if (currentData?.escrowOrder.escrowOrderStatus === EscrowOrderStatus.Pending) {
      return isSeller ? (
        <div className="group-button-wrap">
          <Button
            style={{ backgroundColor: '#a41208' }}
            variant="contained"
            onClick={() => updateOrderStatus(EscrowOrderStatus.Cancel)}
            disabled={loading}
          >
            Decline
          </Button>
          <Button
            disabled={!checkSellerEnoughFund()}
            color="success"
            variant="contained"
            onClick={() => handleSellerDepositEscrow()}
          >
            Escrow
          </Button>
        </div>
      ) : (
        <Button
          style={{ backgroundColor: '#a41208' }}
          variant="contained"
          fullWidth
          onClick={() => updateOrderStatus(EscrowOrderStatus.Cancel)}
          disabled={loading}
        >
          Cancel
        </Button>
      );
    }

    if (currentData?.escrowOrder.escrowOrderStatus === EscrowOrderStatus.Escrow) {
      if (currentData?.escrowOrder.dispute || isArbiOrMod) {
        return;
      }

      return isSeller ? (
        <div className="group-button-wrap">
          <Button color="warning" variant="contained" disabled={loading} onClick={() => handleCreateDispute()}>
            Dispute
          </Button>
          <Button color="success" variant="contained" onClick={() => setOpenReleaseModal(true)} disabled={loading}>
            Release
          </Button>
        </div>
      ) : (
        <div>
          {telegramButton(true, 'Chat with seller for payment details')}

          <div className="group-button-wrap">
            <Button color="warning" variant="contained" disabled={loading} onClick={() => handleCreateDispute()}>
              Dispute
            </Button>
            <Button
              style={{ backgroundColor: '#a41208' }}
              variant="contained"
              onClick={() => setOpenCancelModal(true)}
              disabled={loading}
            >
              Cancel
            </Button>
          </div>
        </div>
      );
    }
  };

  const telegramButton = (alwaysShow = false, content?: string) => {
    const isSeller = selectedWalletPath?.hash160 === currentData?.escrowOrder.sellerAccount.hash160;
    const isArbiOrMod =
      selectedWalletPath?.hash160 === currentData?.escrowOrder.arbitratorAccount.hash160 ||
      selectedWalletPath?.hash160 === currentData?.escrowOrder.moderatorAccount.hash160;

    //remove bottom button when buyer in status escrow
    if (
      !isSeller &&
      currentData?.escrowOrder?.escrowOrderStatus === EscrowOrderStatus.Escrow &&
      !alwaysShow &&
      !currentData?.escrowOrder?.dispute
    ) {
      return;
    }

    return (
      !isArbiOrMod && (
        <React.Fragment>
          <TelegramButton
            escrowOrderId={id}
            username={
              isSeller
                ? currentData?.escrowOrder.buyerAccount.telegramUsername
                : currentData?.escrowOrder.sellerAccount.telegramUsername
            }
            content={content ? content : isSeller ? `Chat with buyer` : `Chat with seller`}
          />
        </React.Fragment>
      )
    );
  };

  const totalAmountWithDepositAndEscrowFee = () => {
    const actualFee1Percent = calDisputeFee;

    return currentData?.escrowOrder.amount + actualFee1Percent + estimatedFee(currentData?.escrowOrder.escrowScript);
  };

  const DepositQRCode = () => {
    const isSeller = selectedWalletPath?.hash160 === currentData?.escrowOrder.sellerAccount.hash160;

    return (
      isSeller && (
        <QRCode
          address={parseCashAddressToPrefix(COIN.XEC, selectedWalletPath?.cashAddress)}
          amount={totalAmountWithDepositAndEscrowFee()}
          width="60%"
        />
      )
    );
  };

  const checkSellerEnoughFund = () => {
    return totalValidAmount > totalAmountWithDepositAndEscrowFee();
  };

  const calDisputeFee = useMemo(() => {
    const fee1Percent = parseFloat((currentData?.escrowOrder.amount / 100).toFixed(2));
    const dustXEC = coinInfo[COIN.XEC].dustSats / Math.pow(10, coinInfo[COIN.XEC].cashDecimals);

    return Math.max(fee1Percent, dustXEC);
  }, [currentData?.escrowOrder.amount]);

  const InfoEscrow = () => {
    const fee1Percent = calDisputeFee;
    const totalBalanceFormat = totalValidAmount.toLocaleString('de-DE');

    return (
      <div style={{ color: 'white' }}>
        {currentData?.escrowOrder.buyerDepositTx && (
          <Typography style={{ fontWeight: 'bold' }}>
            *Buyer deposited the fee ({calDisputeFee} {COIN.XEC})
          </Typography>
        )}
        <Typography>
          Your wallet: {totalBalanceFormat} {COIN.XEC}
        </Typography>
        <Typography>
          Security deposit (1%): {fee1Percent.toLocaleString('de-DE')} {COIN.XEC}
        </Typography>
        <Typography>
          Withdraw fee: {estimatedFee(currentData?.escrowOrder.escrowScript).toLocaleString('de-DE')} {COIN.XEC}
        </Typography>
        <Typography style={{ fontWeight: 'bold' }}>
          Total: {totalAmountWithDepositAndEscrowFee().toLocaleString('de-DE')} {COIN.XEC}
          <span style={{ fontSize: '14px', color: 'gray' }}> (Excluding miner&apos;s fees)</span>
        </Typography>
      </div>
    );
  };

  useEffect(() => {
    checkSellerEnoughFund && setNotEnoughFund(false);
  }, [totalValidAmount]);

  if (_.isEmpty(id) || _.isNil(id) || isError) {
    return <div style={{ color: 'white' }}>Invalid order id</div>;
  }

  return (
    <MobileLayout>
      <OrderDetailPage>
        <TickerHeader title="Order Detail" />
        {currentData?.escrowOrder ? (
          <OrderDetailContent>
            <OrderDetailInfo item={currentData?.escrowOrder} />
            <br />
            {escrowStatus()}
            <br />
            {escrowActionButtons()}
            {telegramButton()}
          </OrderDetailContent>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'center', height: '100vh' }}>
            <CircularProgress style={{ color: 'white', margin: 'auto' }} />
          </div>
        )}

        <ConfirmCancelModal
          isOpen={openCancelModal}
          returnAction={() => handleBuyerReturnEscrow(EscrowOrderStatus.Cancel)}
          onDissmissModal={value => setOpenCancelModal(value)}
        />

        <ConfirmReleaseModal
          isOpen={openReleaseModal}
          disputeFee={calDisputeFee}
          returnAction={value => handleRelease(value)}
          onDissmissModal={value => setOpenReleaseModal(value)}
        />

        <Stack zIndex={999}>
          <CustomToast
            isOpen={error}
            content="  Order's status update failed"
            handleClose={() => setError(false)}
            type="error"
            autoHideDuration={3500}
          />

          <CustomToast
            isOpen={escrow}
            content="Order escrowed successfully. Click here to see transaction!"
            handleClose={() => setEscrow(false)}
            type="success"
            autoHideDuration={3500}
            isLink={true}
            linkDescription={`${coinInfo[COIN.XEC].blockExplorerUrl}/tx/${currentData?.escrowOrder.escrowTxids[currentData?.escrowOrder.escrowTxids.length - 1]?.txid}`}
          />

          <CustomToast
            isOpen={release}
            content="Order released successfully. Click here to see transaction!"
            handleClose={() => setRelease(false)}
            type="success"
            autoHideDuration={3500}
            isLink={true}
            linkDescription={`${coinInfo[COIN.XEC].blockExplorerUrl}/tx/${currentData?.escrowOrder.releaseTxid}`}
          />

          <CustomToast
            isOpen={cancel}
            content="Order cancelled successfully. Funds have been returned to the seller. Click here to see transaction!"
            handleClose={() => setCancel(false)}
            type="success"
            autoHideDuration={3500}
            isLink={true}
            linkDescription={`${coinInfo[COIN.XEC].blockExplorerUrl}/tx/${currentData?.escrowOrder.returnTxid}`}
          />

          <CustomToast
            isOpen={alreadyRelease}
            content="Order has already been released. Click here to see transaction!"
            handleClose={() => setAlreadyRelease(false)}
            type="warning"
            autoHideDuration={3500}
            isLink={true}
            linkDescription={`${coinInfo[COIN.XEC].blockExplorerUrl}/tx/${currentData?.escrowOrder.releaseTxid}`}
          />

          <CustomToast
            isOpen={alreadyCancel}
            content="Order has already been canceled!"
            handleClose={() => setAlreadyCancel(false)}
            type="warning"
            autoHideDuration={3500}
          />
        </Stack>
      </OrderDetailPage>
    </MobileLayout>
  );
};

export default OrderDetail;
