'use client';

import ConfirmCancelModal from '@/src/components/Action/ConfirmCancelModal';
import ConfirmReleaseModal from '@/src/components/Action/ConfirmReleaseModal';
import OrderDetailInfo from '@/src/components/DetailInfo/OrderDetailInfo';
import MobileLayout from '@/src/components/layout/MobileLayout';
import QRCode from '@/src/components/QRcode/QRcode';
import TelegramButton from '@/src/components/TelegramButton/TelegramButton';
import TickerHeader from '@/src/components/TickerHeader/TickerHeader';
import CustomToast from '@/src/components/Toast/CustomToast';
import { COIN_OTHERS } from '@/src/store/constants';
import { UtxoContext } from '@/src/store/context/utxoProvider';
import {
  ArbiReleaseSignatory,
  ArbiReturnSignatory,
  buildReleaseTx,
  buildReturnTx,
  BuyerReturnSignatory,
  ModReleaseSignatory,
  ModReturnSignatory,
  sellerBuildDepositTx,
  SellerReleaseSignatory,
  SignOracleSignatory
} from '@/src/store/escrow';
import { ACTION } from '@/src/store/escrow/constant';
import { deserializeTransaction, estimatedFee } from '@/src/store/util';
import { COIN, coinInfo, PAYMENT_METHOD } from '@bcpros/lixi-models';
import {
  DisputeStatus,
  EscrowOrderAction,
  escrowOrderApi,
  EscrowOrderStatus,
  getSelectedWalletPath,
  OfferType,
  openModal,
  parseCashAddressToPrefix,
  SocketContext,
  UpdateEscrowOrderInput,
  useSliceDispatch as useLixiSliceDispatch,
  useSliceSelector as useLixiSliceSelector,
  userSubcribeEscrowOrderChannel,
  WalletContextNode
} from '@bcpros/redux-store';
import CheckIcon from '@mui/icons-material/Check';
import ClearIcon from '@mui/icons-material/Clear';
import HorizontalRuleIcon from '@mui/icons-material/HorizontalRule';
import KeyboardReturnIcon from '@mui/icons-material/KeyboardReturn';
import TrendingFlatIcon from '@mui/icons-material/TrendingFlat';
import { Button, CircularProgress, FormControlLabel, Radio, RadioGroup, Stack, Typography } from '@mui/material';
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
    color: theme.custom.colorPrimary
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

  const CLAIM_BACK_WALLET = {
    label: '💼 Claim my security deposit back to my wallet',
    value: 1
  };

  const DONATE_ARBITRATOR = {
    label: '⚖️ Donate my security deposit to Arbitrator',
    value: 2
  };

  const DONATE_LOCAL_ECASH = {
    label: '💙 Donate my security deposit to Local eCash',
    value: 3
  };

  const [amountXEC, setAmountXEC] = useState(0);
  const [textAmountPer1MXEC, setTextAmountPer1MXEC] = useState('');

  const [error, setError] = useState(false);
  const [escrow, setEscrow] = useState(false);
  const [release, setRelease] = useState(false);
  const [cancel, setCancel] = useState(false);
  const [loading, setLoading] = useState(false);
  const [claim, setClaim] = useState(false);
  const [notEnoughFund, setNotEnoughFund] = useState(false);
  const [openCancelModal, setOpenCancelModal] = useState(false);
  const [openReleaseModal, setOpenReleaseModal] = useState(false);
  const [alreadyRelease, setAlreadyRelease] = useState(false);
  const [alreadyCancel, setAlreadyCancel] = useState(false);
  const [buyerDonateOption, setBuyerDonateOption] = useState<number>(null);
  const [sellerDonateOption, setSellerDonateOption] = useState<number>(null);
  const [donateOption, setDonateOption] = useState<{ label: string; value: number }[]>([
    CLAIM_BACK_WALLET,
    DONATE_LOCAL_ECASH
  ]);

  const {
    useEscrowOrderQuery,
    useUpdateEscrowOrderStatusMutation,
    useUpdateEscrowOrderSignatoryMutation,
    useMarkAsPaidOrderMutation
  } = escrowOrderApi;
  const { currentData, isError, isSuccess } = useEscrowOrderQuery({ id: id! }, { skip: !id || !token });
  const [updateOrderTrigger] = useUpdateEscrowOrderStatusMutation();
  const [updateEscrowOrderSignatoryTrigger] = useUpdateEscrowOrderSignatoryMutation();
  const [markAsPaidOrderTrigger] = useMarkAsPaidOrderMutation();

  const isBuyOffer = currentData?.escrowOrder?.escrowOffer?.type === OfferType.Buy;

  useEffect(() => {
    if (
      currentData?.escrowOrder.escrowOrderStatus !== EscrowOrderStatus.Complete &&
      currentData?.escrowOrder.escrowOrderStatus !== EscrowOrderStatus.Cancel
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
  }, [currentData?.escrowOrder.escrowOrderStatus]);

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
            let sampleInput: UpdateEscrowOrderInput = {
              orderId: id!,
              status: EscrowOrderStatus.Escrow,
              txid,
              value,
              outIdx: i,
              utxoInNodeOfBuyer: utxoRemoved,
              socketId: socket?.id
            };
            //buy offer will change amount only when escrow, so we need to update right here (not for goods/service)
            if (isBuyOffer && showMargin()) {
              sampleInput = {
                ...sampleInput,
                amount: amountXEC,
                price: textAmountPer1MXEC
              };
            }
            await updateOrderTrigger({
              input: {
                ...sampleInput
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

  const handleSellerReleaseEscrow = async (sellerDonate: boolean) => {
    setLoading(true);

    if (currentData?.escrowOrder.escrowOrderStatus === EscrowOrderStatus.Complete) {
      setAlreadyRelease(true);
      setOpenReleaseModal(false);

      return;
    }

    try {
      const sellerSk = fromHex(selectedWalletPath?.privateKey);
      const sellerPk = fromHex(selectedWalletPath.publicKey as string);
      const sellerPkh = shaRmd160(sellerPk);
      const nonce = currentData?.escrowOrder.nonce as string;
      const sellerSignatory = SignOracleSignatory(sellerSk, ACTION.SELLER_RELEASE, nonce);

      await updateEscrowOrderSignatoryTrigger({
        input: {
          orderId: id!,
          action: EscrowOrderAction.Release,
          signatory: Buffer.from(sellerSignatory).toString('hex'),
          signatoryOwnerHash160: Buffer.from(sellerPkh).toString('hex'),
          sellerDonateAmount: sellerDonate ? calDisputeFee : null
        }
      })
        .unwrap()
        .then(() => setRelease(true));
    } catch (e) {
      console.log(e);
      setError(true);
    }

    setLoading(false);
  };

  const handleBuyerReturnEscrow = async (buyerDonate: boolean) => {
    setLoading(true);

    if (currentData?.escrowOrder.escrowOrderStatus === EscrowOrderStatus.Cancel) {
      setAlreadyCancel(true);
      setOpenCancelModal(false);

      return;
    }

    try {
      const buyerSk = fromHex(selectedWalletPath?.privateKey);
      const buyerPk = fromHex(selectedWalletPath.publicKey as string);
      const buyerPkh = shaRmd160(buyerPk);
      const nonce = currentData?.escrowOrder.nonce as string;
      const buyerSignatory = SignOracleSignatory(buyerSk, ACTION.BUYER_RETURN, nonce);
      const isBuyerDeposit = currentData?.escrowOrder.buyerDepositTx ? true : false;

      await updateEscrowOrderSignatoryTrigger({
        input: {
          orderId: id!,
          action: EscrowOrderAction.Return,
          signatory: Buffer.from(buyerSignatory).toString('hex'),
          signatoryOwnerHash160: Buffer.from(buyerPkh).toString('hex'),
          buyerDonateAmount: buyerDonate && isBuyerDeposit ? calDisputeFee : null
        }
      })
        .unwrap()
        .then(() => setCancel(true));
    } catch (e) {
      console.log(e);
      setError(true);
    }

    setLoading(false);
  };

  const handleCreateDispute = () => {
    dispatch(openModal('ReasonDisputeModal', { id: id! }));
  };

  const handleMarkAsPaid = async () => {
    setLoading(true);
    try {
      await markAsPaidOrderTrigger({ input: { orderId: id!, markAsPaid: true } });
      setLoading(false);
    } catch (e) {
      console.log(e);
      setLoading(false);
    }
  };

  const handleBuyerClaimEscrow = async () => {
    setLoading(true);
    try {
      const { amount, sellerDonateAmount, dispute } = currentData?.escrowOrder || {};
      const disputeFee = calDisputeFee;
      const isBuyerDeposit = currentData?.escrowOrder.buyerDepositTx ? true : false;
      const isDispute = !_.isNil(dispute);
      const escrowTxids = currentData?.escrowOrder.escrowTxids;

      const sellerPk = fromHex(currentData?.escrowOrder.sellerAccount.publicKey);
      const sellerPkh = shaRmd160(sellerPk);
      const sellerP2pkh = Script.p2pkh(sellerPkh);

      const buyerPk = fromHex(selectedWalletPath.publicKey as string);
      const buyerPkh = shaRmd160(buyerPk);
      const buyerP2pkh = Script.p2pkh(buyerPkh);
      const buyerSk = fromHex(selectedWalletPath?.privateKey);

      const script = Buffer.from(currentData?.escrowOrder.escrowScript as string, 'hex') as unknown as Uint8Array;
      const escrowScript = new Script(script);

      const releaseSignatory = Buffer.from(
        currentData?.escrowOrder.releaseSignatory as string,
        'hex'
      ) as unknown as Uint8Array;

      let signatory = null;
      let arbModP2pkh: Script | null = null;

      if (!isDispute) {
        signatory = SellerReleaseSignatory(sellerPk, buyerPk, buyerSk, releaseSignatory);
      } else {
        const { signatoryOwnerHash160 } = currentData.escrowOrder;
        const { hash160: arbHash160, publicKey: arbPk } = currentData.escrowOrder.arbitratorAccount;
        const { hash160: modHash160, publicKey: modPk } = currentData.escrowOrder.moderatorAccount;
        const arbSignedSignatory = signatoryOwnerHash160 === arbHash160;

        signatory = arbSignedSignatory
          ? ArbiReleaseSignatory(fromHex(arbPk), buyerPk, buyerSk, releaseSignatory)
          : ModReleaseSignatory(fromHex(modPk), buyerPk, buyerSk, releaseSignatory);

        arbModP2pkh = arbSignedSignatory ? Script.p2pkh(fromHex(arbHash160)) : Script.p2pkh(fromHex(modHash160));
      }

      const txBuild = buildReleaseTx(
        escrowTxids,
        amount,
        disputeFee,
        escrowScript,
        signatory,
        buyerP2pkh,
        sellerP2pkh,
        isBuyerDeposit,
        buyerDonateOption,
        sellerDonateAmount,
        isDispute,
        arbModP2pkh
      );

      const txid = (await chronik.broadcastTx(txBuild)).txid;

      // update order status to escrow
      await updateOrderTrigger({
        input: {
          orderId: id!,
          status: EscrowOrderStatus.Complete,
          txid,
          socketId: socket?.id,
          buyerDonateAmount: buyerDonateOption && isBuyerDeposit ? calDisputeFee : null
        }
      })
        .unwrap()
        .then(() => setClaim(true));
    } catch (e) {
      console.log(e);
      setError(true);
    }

    setLoading(false);
  };

  const handleSellerClaimEscrow = async () => {
    setLoading(true);
    try {
      const { amount, buyerDonateAmount } = currentData?.escrowOrder || {};
      const disputeFee = calDisputeFee;
      const isBuyerDeposit = currentData?.escrowOrder.buyerDepositTx ? true : false;
      const escrowTxids = currentData?.escrowOrder.escrowTxids;
      const isDispute = !_.isNil(currentData?.escrowOrder.dispute);

      const buyerPk = fromHex(currentData?.escrowOrder.buyerAccount.publicKey);
      const buyerPkh = shaRmd160(buyerPk);
      const buyerP2pkh = Script.p2pkh(buyerPkh);

      const sellerPk = fromHex(selectedWalletPath.publicKey as string);
      const sellerPkh = shaRmd160(sellerPk);
      const sellerP2pkh = Script.p2pkh(sellerPkh);
      const sellerSk = fromHex(selectedWalletPath?.privateKey);

      const script = Buffer.from(currentData?.escrowOrder.escrowScript as string, 'hex') as unknown as Uint8Array;
      const escrowScript = new Script(script);

      const returnSignatory = Buffer.from(
        currentData?.escrowOrder.returnSignatory as string,
        'hex'
      ) as unknown as Uint8Array;

      let signatory;
      let arbModP2pkh: Script | null = null;

      if (!isDispute) {
        signatory = BuyerReturnSignatory(buyerPk, sellerPk, sellerSk, returnSignatory);
      } else {
        const { signatoryOwnerHash160 } = currentData.escrowOrder;
        const { hash160: arbHash160, publicKey: arbPk } = currentData.escrowOrder.arbitratorAccount;
        const { hash160: modHash160, publicKey: modPk } = currentData.escrowOrder.moderatorAccount;
        const arbSignedSignatory = signatoryOwnerHash160 === arbHash160;

        signatory =
          signatoryOwnerHash160 === arbHash160
            ? ArbiReturnSignatory(fromHex(arbPk), sellerPk, sellerSk, returnSignatory)
            : ModReturnSignatory(fromHex(modPk), sellerPk, sellerSk, returnSignatory);

        arbModP2pkh = arbSignedSignatory ? Script.p2pkh(fromHex(arbHash160)) : Script.p2pkh(fromHex(modHash160));
      }

      const txBuild = buildReturnTx(
        escrowTxids,
        amount,
        disputeFee,
        escrowScript,
        signatory,
        buyerP2pkh,
        sellerP2pkh,
        isBuyerDeposit,
        sellerDonateOption,
        buyerDonateAmount,
        isDispute,
        arbModP2pkh
      );

      const txid = (await chronik.broadcastTx(txBuild)).txid;

      //update order status to escrow
      await updateOrderTrigger({
        input: {
          orderId: id!,
          status: EscrowOrderStatus.Cancel,
          txid,
          socketId: socket?.id,
          sellerDonateAmount: sellerDonateOption !== 1 ? calDisputeFee : null
        }
      })
        .unwrap()
        .then(() => setClaim(true));
    } catch (e) {
      console.log(e);
      setError(true);
    }

    setLoading(false);
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
              {isBuyOffer ? (
                <div>
                  {telegramButton(true)}
                  <p>
                    Xec in escrow will only be released when you confirm the receipt of money. You can dispute to get it
                    back if the buyer fail to deliver
                  </p>
                </div>
              ) : (
                'Please escrow the order'
              )}
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

    //ReleaseSignatory or ReturnSignatory only available after escrow so we check logic here
    if (currentData?.escrowOrder.escrowOrderStatus === EscrowOrderStatus.Escrow) {
      if (currentData.escrowOrder.releaseSignatory) {
        return (
          <React.Fragment>
            <Typography variant="body1" color="#66bb6a" align="center">
              Successfully Released!
            </Typography>
            <Stack direction="row" spacing={0} justifyContent="center" color="white" alignItems="center" margin="20px">
              <Image width={50} height={50} src="/safebox-open.svg" alt="" />
              <CheckIcon color="success" style={{ fontSize: '50px' }} />
            </Stack>
            <Typography variant="body1" color="#66bb6a" align="center">
              {`${currentData.escrowOrder.amount} XEC has been released.`}
              <br />
              {`${isSeller ? 'The buyer' : 'You'} can claim the fund now.`}
            </Typography>
          </React.Fragment>
        );
      }

      if (currentData.escrowOrder.returnSignatory) {
        return (
          <React.Fragment>
            <Typography variant="body1" color="#66bb6a" align="center">
              Successfully Returned!
            </Typography>
            <Stack direction="row" spacing={0} justifyContent="center" color="white" alignItems="center" margin="20px">
              <Image width={50} height={50} src="/safebox-open.svg" alt="" />
              <KeyboardReturnIcon color="success" style={{ fontSize: '50px' }} />
            </Stack>
            <Typography variant="body1" color="#66bb6a" align="center">
              {`${currentData.escrowOrder.amount} XEC has been returned.`}
              <br />
              {`${isSeller ? 'You' : 'The seller'} can now claim the fund.`}
            </Typography>
          </React.Fragment>
        );
      }

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
            onClick={async () => await updateOrderStatus(EscrowOrderStatus.Cancel)}
            disabled={loading}
          >
            Decline
          </Button>
          <Button
            disabled={!checkSellerEnoughFund()}
            color="success"
            variant="contained"
            onClick={async () => await handleSellerDepositEscrow()}
          >
            Escrow
          </Button>
        </div>
      ) : (
        <Button
          style={{ backgroundColor: '#a41208' }}
          variant="contained"
          fullWidth
          onClick={async () => await updateOrderStatus(EscrowOrderStatus.Cancel)}
          disabled={loading}
        >
          Cancel
        </Button>
      );
    }

    if (currentData?.escrowOrder.escrowOrderStatus === EscrowOrderStatus.Escrow) {
      if (currentData?.escrowOrder.dispute?.status === DisputeStatus.Active || isArbiOrMod) {
        return;
      }

      //We use tenary operator here instead of && because we want to the code to stop executing
      if (currentData.escrowOrder.releaseSignatory) {
        return isSeller ? null : (
          <React.Fragment>
            {currentData?.escrowOrder.buyerDepositTx && (
              <Stack>
                <RadioGroup>
                  {donateOption.map(item => {
                    return (
                      <FormControlLabel
                        onClick={() => {
                          setBuyerDonateOption(item.value);
                        }}
                        key={item.label}
                        value={item.value}
                        control={<Radio />}
                        label={item.label}
                        checked={item.value === buyerDonateOption}
                      />
                    );
                  })}
                </RadioGroup>
                <Typography sx={{ fontSize: '12px', marginTop: '10px' }} fontStyle="italic">
                  Optional: This service has been brought to you free of charge. We would appreciate a donation to
                  continue maintaining it.
                </Typography>
              </Stack>
            )}
            <Button
              color="success"
              variant="contained"
              disabled={loading || (currentData?.escrowOrder.buyerDepositTx && buyerDonateOption === null)}
              onClick={async () => await handleBuyerClaimEscrow()}
              fullWidth
              style={{ marginTop: '10px' }}
            >
              Claim
            </Button>
          </React.Fragment>
        );
      }

      if (currentData.escrowOrder.returnSignatory) {
        return isSeller ? (
          <React.Fragment>
            <Stack>
              <RadioGroup>
                {donateOption.map(item => {
                  return (
                    <FormControlLabel
                      onClick={() => {
                        setSellerDonateOption(item.value);
                      }}
                      key={item.label}
                      value={item.value}
                      control={<Radio />}
                      label={item.label}
                      checked={item.value === sellerDonateOption}
                    />
                  );
                })}
              </RadioGroup>
              <Typography sx={{ fontSize: '12px', marginTop: '10px' }} fontStyle="italic">
                Optional: This service has been brought to you free of charge. We would appreciate a donation to
                continue maintaining it.
              </Typography>
            </Stack>
            <Button
              color="success"
              variant="contained"
              disabled={loading || sellerDonateOption === null}
              onClick={async () => await handleSellerClaimEscrow()}
              fullWidth
            >
              Claim
            </Button>
          </React.Fragment>
        ) : null;
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
            {isBuyOffer ? (
              currentData.escrowOrder?.markAsPaid ? (
                <Button color="warning" variant="contained" disabled={loading} onClick={() => handleCreateDispute()}>
                  Dispute
                </Button>
              ) : (
                <Button color="warning" variant="contained" disabled={loading} onClick={() => handleMarkAsPaid()}>
                  Mark as paid
                </Button>
              )
            ) : (
              <Button color="warning" variant="contained" disabled={loading} onClick={() => handleCreateDispute()}>
                Dispute
              </Button>
            )}
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

    //remove bottom button when seller in buyOffer is pending
    if (
      isSeller &&
      isBuyOffer &&
      !alwaysShow &&
      currentData?.escrowOrder?.escrowOrderStatus === EscrowOrderStatus.Pending
    ) {
      return;
    }

    //remove bottom button when buyer in status escrow
    if (
      !isSeller &&
      currentData?.escrowOrder?.escrowOrderStatus === EscrowOrderStatus.Escrow &&
      !currentData.escrowOrder.releaseSignatory &&
      !currentData.escrowOrder.returnSignatory &&
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
    const amountOrder = isShowDynamicValue() ? amountXEC : currentData?.escrowOrder.amount;

    return amountOrder + actualFee1Percent + estimatedFee(currentData?.escrowOrder.escrowScript);
  };

  const DepositQRCode = () => {
    const isSeller = selectedWalletPath?.hash160 === currentData?.escrowOrder.sellerAccount.hash160;

    return (
      isSeller && (
        <QRCode
          address={parseCashAddressToPrefix(COIN.XEC, selectedWalletPath?.cashAddress)}
          amount={Number(totalAmountWithDepositAndEscrowFee().toFixed(2))}
          width="60%"
        />
      )
    );
  };

  const checkSellerEnoughFund = () => {
    return totalValidAmount > totalAmountWithDepositAndEscrowFee();
  };

  const showMargin = () => {
    return (
      currentData?.escrowOrder?.paymentMethod?.id !== PAYMENT_METHOD.GOODS_SERVICES &&
      currentData?.escrowOrder?.escrowOffer?.coinPayment !== COIN_OTHERS
    );
  };

  const isShowDynamicValue = () => {
    //dynamic value only pending and not for goods/service
    return isBuyOffer && currentData?.escrowOrder?.escrowOrderStatus === EscrowOrderStatus.Pending && showMargin();
  };

  const calDisputeFee = useMemo(() => {
    const amountOrder = isShowDynamicValue() ? amountXEC : currentData?.escrowOrder.amount;

    const fee1Percent = parseFloat((amountOrder / 100).toFixed(2));
    const dustXEC = coinInfo[COIN.XEC].dustSats / Math.pow(10, coinInfo[COIN.XEC].cashDecimals);

    return Math.max(fee1Percent, dustXEC);
  }, [currentData?.escrowOrder.amount, isShowDynamicValue() ? amountXEC : null]);

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
    currentData?.escrowOrder.escrowOrderStatus !== EscrowOrderStatus.Complete &&
      isSuccess &&
      !_.isNil(socket) &&
      dispatch(userSubcribeEscrowOrderChannel(id));
  }, [socket, isSuccess]);

  useEffect(() => {
    currentData?.escrowOrder.dispute && setDonateOption([CLAIM_BACK_WALLET, DONATE_ARBITRATOR, DONATE_LOCAL_ECASH]);
  }, [currentData?.escrowOrder.dispute]);

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
            <OrderDetailInfo
              item={currentData?.escrowOrder}
              amountXEC={amountXEC}
              textAmountPer1MXEC={textAmountPer1MXEC}
              setAmountXEC={value => setAmountXEC(value)}
              setTextAmountPer1MXEC={text => setTextAmountPer1MXEC(text)}
            />
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
          returnAction={value => handleBuyerReturnEscrow(value)}
          onDismissModal={value => setOpenCancelModal(value)}
          isBuyerDeposit={currentData?.escrowOrder.buyerDepositTx ? true : false}
          disputeFee={calDisputeFee}
        />

        <ConfirmReleaseModal
          isOpen={openReleaseModal}
          disputeFee={calDisputeFee}
          returnAction={value => handleSellerReleaseEscrow(value)}
          onDismissModal={value => setOpenReleaseModal(value)}
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
            content="Order released successfully!"
            handleClose={() => setRelease(false)}
            type="success"
            autoHideDuration={3500}
          />

          <CustomToast
            isOpen={cancel}
            content="Order cancelled successfully!"
            handleClose={() => setCancel(false)}
            type="success"
            autoHideDuration={3500}
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

          <CustomToast
            isOpen={claim}
            content="Escrow fund claim successful. Click here to see transaction!"
            handleClose={() => setClaim(false)}
            type="success"
            autoHideDuration={3500}
            isLink={true}
            linkDescription={
              currentData?.escrowOrder.releaseTxid
                ? `${coinInfo[COIN.XEC].blockExplorerUrl}/tx/${currentData?.escrowOrder.releaseTxid}`
                : `${coinInfo[COIN.XEC].blockExplorerUrl}/tx/${currentData?.escrowOrder.returnTxid}`
            }
          />
        </Stack>
      </OrderDetailPage>
    </MobileLayout>
  );
};

export default OrderDetail;
