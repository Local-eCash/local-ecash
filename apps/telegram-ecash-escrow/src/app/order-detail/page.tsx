'use client';

import ConfirmCancelModal from '@/src/components/Action/ConfirmCancelModal';
import ConfirmReleaseModal from '@/src/components/Action/ConfirmReleaseModal';
import OrderDetailInfo from '@/src/components/DetailInfo/OrderDetailInfo';
import MobileLayout from '@/src/components/layout/MobileLayout';
import QRCode from '@/src/components/QRcode/QRcode';
import TelegramButton from '@/src/components/TelegramButton/TelegramButton';
import TickerHeader from '@/src/components/TickerHeader/TickerHeader';
import { securityDepositPercentage } from '@/src/store/constants';
import { SettingContext } from '@/src/store/context/settingProvider';
import { UtxoContext } from '@/src/store/context/utxoProvider';
import { buildReleaseTx, buildReturnFeeTx, buildReturnTx, sellerBuildDepositTx } from '@/src/store/escrow';
import { ACTION } from '@/src/store/escrow/constant';
import {
  ArbiReleaseSignatory,
  ArbiReturnSignatory,
  BuyerReturnSignatory,
  ModReleaseSignatory,
  ModReturnSignatory,
  SellerReleaseSignatory,
  SignOracleSignatory
} from '@/src/store/escrow/signatory';
import {
  deserializeTransaction,
  estimatedFee,
  formatNumber,
  hexDecode,
  hexEncode,
  hexToUint8Array,
  showPriceInfo
} from '@/src/store/util';
import { COIN, coinInfo } from '@bcpros/lixi-models';
import {
  DisputeStatus,
  EscrowOrderAction,
  escrowOrderApi,
  EscrowOrderStatus,
  getSelectedWalletPath,
  OfferType,
  openModal,
  parseCashAddressToPrefix,
  showToast,
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
import { CopyToClipboard } from 'react-copy-to-clipboard';

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
    gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
    gap: '16px',
    borderBottom: `1px solid rgba(255, 255, 255, 0.2)`,
    paddingBottom: '16px',

    button: {
      textTransform: 'none',
      color: theme.palette.common.white
    }
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
  const { allSettings } = useContext(SettingContext);
  const Wallet = useContext(WalletContextNode);
  const { chronik } = Wallet;
  const { totalValidAmount, totalValidUtxos } = useContext(UtxoContext);

  const CLAIM_BACK_WALLET = {
    label: `💼 Claim my security deposit (${securityDepositPercentage}%) back to my wallet`,
    value: 1
  };

  const DONATE_ARBITRATOR = {
    label: `⚖️ Donate my security deposit (${securityDepositPercentage}%) to Arbitrator`,
    value: 2
  };

  const DONATE_LOCAL_ECASH = {
    label: `💙 Donate my security deposit (${securityDepositPercentage}%) to Local eCash`,
    value: 3
  };

  const [amountXEC, setAmountXEC] = useState(0);
  const [textAmountPer1MXEC, setTextAmountPer1MXEC] = useState('');

  const [isDisabled, setIsDisabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [openCancelModal, setOpenCancelModal] = useState(false);
  const [openReleaseModal, setOpenReleaseModal] = useState(false);
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
    useAllowOfferTakerChatMutation,
    useMarkAsPaidOrderMutation
  } = escrowOrderApi;
  const { currentData, isError, isSuccess } = useEscrowOrderQuery({ id: id! }, { skip: !id || !token });
  const [updateOrderTrigger] = useUpdateEscrowOrderStatusMutation();
  const [updateEscrowOrderSignatoryTrigger] = useUpdateEscrowOrderSignatoryMutation();
  const [markAsPaidOrderTrigger] = useMarkAsPaidOrderMutation();
  const [allowOfferTakerChatTrigger] = useAllowOfferTakerChatMutation();

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
      const strJsonTx = hexDecode(buyerDepositTx);
      const deserializeTx = new Tx(deserializeTransaction(strJsonTx));
      utxoRemoved = {
        txid: deserializeTx.inputs[0].prevOut.txid as string,
        outIdx: deserializeTx.inputs[0].prevOut.outIdx,
        value: deserializeTx.inputs[0].signData.value as number
      };
    }

    await updateOrderTrigger({ input: { orderId: id!, status, utxoInNodeOfBuyer: utxoRemoved, socketId: socket?.id } })
      .unwrap()
      .catch(() => showError());

    setLoading(false);
  };

  const handleSellerDepositEscrow = async () => {
    setLoading(true);

    try {
      // Prepare transaction data
      const txData = {
        sellerSk: fromHex(selectedWalletPath?.privateKey),
        sellerPk: fromHex(selectedWalletPath?.publicKey),
        amount: escrowCalculations.totalAmountEscrow,
        escrowFeeAmount: escrowCalculations.totalAmountFee,
        escrowScript: new Script(hexToUint8Array(currentData?.escrowOrder.escrowScript)),
        escrowFeeScript: new Script(hexToUint8Array(currentData?.escrowOrder.escrowFeeScript))
      };

      // Build and broadcast transaction
      const { txBuild, utxoRemoved } = sellerBuildDepositTx(
        totalValidUtxos,
        txData.sellerSk,
        txData.sellerPk,
        txData.amount,
        txData.escrowFeeAmount,
        txData.escrowScript,
        txData.escrowFeeScript,
        currentData?.escrowOrder.buyerDepositTx
      );

      let txid;
      try {
        txid = (await chronik.broadcastTx(txBuild)).txid;
      } catch {
        dispatch(
          showToast('error', {
            message: 'error',
            description: 'Not enough funds to escrow!'
          })
        );
        return;
      }

      // Process transaction outputs
      const tx = await chronik.tx(txid);
      const startIndex = tx.tokenEntries.length > 0 ? 1 : 0;

      let orderUpdateInput: UpdateEscrowOrderInput = {
        orderId: id!,
        status: EscrowOrderStatus.Escrow,
        socketId: socket?.id,
        utxoInNodeOfBuyer: utxoRemoved,
        txid
      };

      // Find escrow and fee outputs
      for (let i = startIndex; i < tx.outputs.length; i++) {
        const address = cashaddr.encodeOutputScript(tx.outputs[i].outputScript, 'ecash');

        if (address === currentData?.escrowOrder.escrowAddress) {
          orderUpdateInput.value = tx.outputs[i].value;
          orderUpdateInput.outIdx = i;
        } else if (address === currentData?.escrowOrder.escrowFeeAddress) {
          orderUpdateInput.feeValue = tx.outputs[i].value;
          orderUpdateInput.feeOutIdx = i;
        } else if (address === currentData?.escrowOrder.escrowBuyerDepositFeeAddress) {
          orderUpdateInput.buyerDepositFeeValue = tx.outputs[i].value;
          orderUpdateInput.buyerDepositFeeOutIdx = i;
        }
      }

      // Add buy offer specific data
      if (isBuyOffer && showPrice) {
        orderUpdateInput.amount = amountXEC;
        orderUpdateInput.price = textAmountPer1MXEC;
      }

      // Update order
      await updateOrderTrigger({ input: orderUpdateInput }).unwrap();

      dispatch(
        showToast(
          'success',
          {
            message: 'Success',
            description: 'Order escrowed successfully. Click here to see transaction!'
          },
          true,
          `${coinInfo[COIN.XEC].blockExplorerUrl}/tx/${txid}`
        )
      );
    } catch (error) {
      console.error('Escrow deposit failed:', error);
      showError();
    } finally {
      setLoading(false);
    }
  };

  const handleSellerReleaseEscrow = async () => {
    setLoading(true);

    // early return if the order is already complete
    if (currentData?.escrowOrder.escrowOrderStatus === EscrowOrderStatus.Complete) {
      dispatch(
        showToast('warning', {
          message: 'warning',
          description: 'Order already released!'
        })
      );
      setOpenReleaseModal(false);
      return;
    }

    try {
      const sellerSk = fromHex(selectedWalletPath?.privateKey);
      const sellerPk = fromHex(selectedWalletPath?.publicKey);
      const sellerPkh = shaRmd160(sellerPk);
      const nonce = currentData?.escrowOrder.nonce as string;
      const sellerSignatory = SignOracleSignatory(sellerSk, ACTION.SELLER_RELEASE, nonce);

      await updateEscrowOrderSignatoryTrigger({
        input: {
          orderId: id!,
          action: EscrowOrderAction.Release,
          signatory: hexEncode(sellerSignatory),
          signatoryOwnerHash160: hexEncode(sellerPkh)
        }
      }).unwrap();

      dispatch(
        showToast('success', {
          message: 'success',
          description: 'Order released successfully!'
        })
      );
    } catch (e) {
      console.log(e);
      showError();
    }

    setLoading(false);
  };

  const handleBuyerReturnEscrow = async () => {
    setLoading(true);

    if (currentData?.escrowOrder.escrowOrderStatus === EscrowOrderStatus.Cancel) {
      dispatch(
        showToast('warning', {
          message: 'warning',
          description: 'Order has already been canceled!'
        })
      );
      setOpenCancelModal(false);

      return;
    }

    try {
      const buyerSk = fromHex(selectedWalletPath?.privateKey);
      const buyerPk = fromHex(selectedWalletPath.publicKey as string);
      const buyerPkh = shaRmd160(buyerPk);
      const nonce = currentData?.escrowOrder.nonce as string;
      const buyerSignatory = SignOracleSignatory(buyerSk, ACTION.BUYER_RETURN, nonce);

      await updateEscrowOrderSignatoryTrigger({
        input: {
          orderId: id!,
          action: EscrowOrderAction.Return,
          signatory: hexEncode(buyerSignatory),
          signatoryOwnerHash160: hexEncode(buyerPkh)
        }
      }).unwrap();

      dispatch(
        showToast('success', {
          message: 'success',
          description: 'Order cancelled successfully!'
        })
      );
    } catch (e) {
      console.log(e);
      showError();
    }

    setLoading(false);
  };

  const handleBuyerClaimEscrow = async () => {
    setLoading(true);
    try {
      const { amount, dispute, nonce } = currentData?.escrowOrder || {};
      const disputeFee = calDisputeFee;
      const isBuyerDeposit = currentData?.escrowOrder.buyerDepositTx ? true : false;
      const isDispute = !_.isNil(dispute);
      const escrowTxids = currentData?.escrowOrder.escrowTxids;

      const sellerPk = fromHex(currentData?.escrowOrder.sellerAccount.publicKey);

      const buyerPk = fromHex(selectedWalletPath.publicKey as string);
      const buyerPkh = shaRmd160(buyerPk);
      const buyerP2pkh = Script.p2pkh(buyerPkh);
      const buyerSk = fromHex(selectedWalletPath?.privateKey);

      const script = hexToUint8Array(currentData?.escrowOrder.escrowScript);
      const buyerDepositFeeScript = hexToUint8Array(currentData?.escrowOrder.escrowBuyerDepositFeeScript);
      const escrowScript = new Script(script);
      const escrowBuyerDepositFeeScript = new Script(buyerDepositFeeScript);

      const releaseSignatory = hexToUint8Array(currentData?.escrowOrder.releaseSignatory);

      let signatory = null;
      let returnFeeSignatory = null;
      let arbModP2pkh: Script | null = null;

      if (!isDispute) {
        signatory = SellerReleaseSignatory(sellerPk, buyerPk, buyerSk, releaseSignatory);
        returnFeeSignatory = SignOracleSignatory(buyerSk, ACTION.BUYER_RETURN, nonce);
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
        escrowTxids[0],
        amount,
        disputeFee,
        escrowScript,
        escrowBuyerDepositFeeScript,
        signatory,
        buyerP2pkh,
        isBuyerDeposit,
        buyerDonateOption,
        arbModP2pkh
      );

      const txid = (await chronik.broadcastTx(txBuild)).txid;

      // update order status to complete
      await updateOrderTrigger({
        input: {
          orderId: id!,
          status: EscrowOrderStatus.Complete,
          txid,
          socketId: socket?.id,
          buyerDonateAmount: buyerDonateOption && isBuyerDeposit ? calDisputeFee : null
        }
      }).unwrap();

      if (!dispute) {
        //update escrow fee signatory for seller to claim back fee
        await updateEscrowOrderSignatoryTrigger({
          input: {
            orderId: id!,
            action: EscrowOrderAction.ReturnFee,
            signatory: hexEncode(returnFeeSignatory),
            signatoryOwnerFeeHash160: hexEncode(buyerPkh),
            socketId: socket?.id
          }
        }).unwrap();
      }
      dispatch(
        showToast(
          'success',
          {
            message: 'success',
            description: 'Escrow fund claim successful. Click here to see transaction!'
          },
          true,
          `${coinInfo[COIN.XEC].blockExplorerUrl}/tx/${txid}`
        )
      );
    } catch (e) {
      console.log(e);
      showError();
    }

    setLoading(false);
  };

  const handleSellerClaimEscrowFee = async () => {
    setLoading(true);
    try {
      const disputeFee = calDisputeFee;
      const escrowTxids = currentData?.escrowOrder.escrowTxids;

      const isDispute = !_.isNil(currentData?.escrowOrder.dispute);

      const buyerPk = fromHex(currentData?.escrowOrder.buyerAccount.publicKey);

      const sellerPk = fromHex(selectedWalletPath.publicKey as string);
      const sellerPkh = shaRmd160(sellerPk);
      const sellerP2pkh = Script.p2pkh(sellerPkh);
      const sellerSk = fromHex(selectedWalletPath?.privateKey);

      const feeScript = hexToUint8Array(currentData?.escrowOrder.escrowFeeScript);
      const escrowFeeScript = new Script(feeScript);

      const returnFeeSignatory = hexToUint8Array(currentData?.escrowOrder.returnFeeSignatory);

      let signatory;
      let arbModP2pkh: Script | null = null;

      if (!isDispute) {
        signatory = BuyerReturnSignatory(buyerPk, sellerPk, sellerSk, returnFeeSignatory);
      } else {
        const { signatoryOwnerFeeHash160 } = currentData.escrowOrder;
        const { hash160: arbHash160, publicKey: arbPk } = currentData.escrowOrder.arbitratorAccount;
        const { hash160: modHash160, publicKey: modPk } = currentData.escrowOrder.moderatorAccount;
        const arbSignedSignatory = signatoryOwnerFeeHash160 === arbHash160;

        signatory = arbSignedSignatory
          ? ArbiReturnSignatory(fromHex(arbPk), sellerPk, sellerSk, returnFeeSignatory)
          : ModReturnSignatory(fromHex(modPk), sellerPk, sellerSk, returnFeeSignatory);

        arbModP2pkh = arbSignedSignatory ? Script.p2pkh(fromHex(arbHash160)) : Script.p2pkh(fromHex(modHash160));
      }

      const txBuild = buildReturnFeeTx(
        escrowTxids[0],
        disputeFee,
        escrowFeeScript,
        signatory,
        sellerP2pkh,
        sellerDonateOption,
        arbModP2pkh
      );

      const txid = (await chronik.broadcastTx(txBuild)).txid;

      await updateOrderTrigger({
        input: {
          orderId: id!,
          returnFeeTxid: txid,
          socketId: socket?.id,
          sellerDonateAmount: sellerDonateOption ? calDisputeFee : null
        }
      }).unwrap();

      dispatch(
        showToast(
          'success',
          {
            message: 'success',
            description: 'Escrow fund claim successful. Click here to see transaction!'
          },
          true,
          `${coinInfo[COIN.XEC].blockExplorerUrl}/tx/${txid}`
        )
      );
    } catch (e) {
      console.log(e);
      showError();
    }

    setLoading(false);
  };

  const handleBuyerClaimEscrowBuyerDepositFee = async () => {
    setLoading(true);
    try {
      const disputeFee = calDisputeFee;
      const escrowTxids = currentData?.escrowOrder.escrowTxids;

      const sellerPk = fromHex(currentData?.escrowOrder.sellerAccount.publicKey);

      const buyerPk = fromHex(selectedWalletPath.publicKey as string);
      const buyerPkh = shaRmd160(buyerPk);
      const buyerP2pkh = Script.p2pkh(buyerPkh);
      const buyerSk = fromHex(selectedWalletPath?.privateKey);

      const feeScript = hexToUint8Array(currentData?.escrowOrder.escrowBuyerDepositFeeScript);
      const escrowFeeScript = new Script(feeScript);

      const returnBuyerDepositFeeSignatory = hexToUint8Array(currentData?.escrowOrder.returnBuyerDepositFeeSignatory);

      let signatory = SellerReleaseSignatory(sellerPk, buyerPk, buyerSk, returnBuyerDepositFeeSignatory);
      let arbP2pkh: Script | null = null;

      const isBuyerDeposit = currentData?.escrowOrder.buyerDepositTx ? true : false;
      const txBuild = buildReturnFeeTx(
        escrowTxids[0],
        disputeFee,
        escrowFeeScript,
        signatory,
        buyerP2pkh,
        buyerDonateOption,
        arbP2pkh,
        isBuyerDeposit
      );

      const txid = (await chronik.broadcastTx(txBuild)).txid;

      await updateOrderTrigger({
        input: {
          orderId: id!,
          returnBuyerDepositFeeTxid: txid,
          socketId: socket?.id,
          buyerDonateAmount: buyerDonateOption ? calDisputeFee : null
        }
      }).unwrap();

      dispatch(
        showToast(
          'success',
          {
            message: 'success',
            description: 'Escrow fund claim successful. Click here to see transaction!'
          },
          true,
          `${coinInfo[COIN.XEC].blockExplorerUrl}/tx/${txid}`
        )
      );
    } catch (e) {
      console.log(e);
      showError();
    }

    setLoading(false);
  };

  const handleSellerClaimEscrow = async () => {
    setLoading(true);
    try {
      const { amount, dispute, nonce } = currentData?.escrowOrder || {};
      const isBuyerDeposit = currentData?.escrowOrder.buyerDepositTx ? true : false;
      const escrowTxids = currentData?.escrowOrder.escrowTxids;
      const isDispute = !_.isNil(currentData?.escrowOrder.dispute);

      const buyerPk = fromHex(currentData?.escrowOrder.buyerAccount.publicKey);

      const sellerPk = fromHex(selectedWalletPath.publicKey as string);
      const sellerPkh = shaRmd160(sellerPk);
      const sellerP2pkh = Script.p2pkh(sellerPkh);
      const sellerSk = fromHex(selectedWalletPath?.privateKey);

      const script = hexToUint8Array(currentData?.escrowOrder.escrowScript);
      const escrowScript = new Script(script);

      const returnSignatory = hexToUint8Array(currentData?.escrowOrder.returnSignatory);

      let signatory;
      let returnBuyerDepositFeeSignatory;

      if (!isDispute) {
        signatory = BuyerReturnSignatory(buyerPk, sellerPk, sellerSk, returnSignatory);
        returnBuyerDepositFeeSignatory = SignOracleSignatory(sellerSk, ACTION.SELLER_RELEASE, nonce);
      } else {
        const { signatoryOwnerHash160 } = currentData.escrowOrder;
        const { hash160: arbHash160, publicKey: arbPk } = currentData.escrowOrder.arbitratorAccount;
        const { hash160: modHash160, publicKey: modPk } = currentData.escrowOrder.moderatorAccount;
        const arbSignedSignatory = signatoryOwnerHash160 === arbHash160;

        signatory = arbSignedSignatory
          ? ArbiReturnSignatory(fromHex(arbPk), sellerPk, sellerSk, returnSignatory)
          : ModReturnSignatory(fromHex(modPk), sellerPk, sellerSk, returnSignatory);
      }

      const txBuild = buildReturnTx(escrowTxids[0], amount, escrowScript, signatory, sellerP2pkh);

      const txid = (await chronik.broadcastTx(txBuild)).txid;

      //update order status to escrow
      await updateOrderTrigger({
        input: {
          orderId: id!,
          status: EscrowOrderStatus.Cancel,
          txid,
          socketId: socket?.id
        }
      }).unwrap();

      if (!dispute && isBuyerDeposit) {
        //update escrow fee signatory for buyer to claim back fee
        await updateEscrowOrderSignatoryTrigger({
          input: {
            orderId: id!,
            action: EscrowOrderAction.ReturnBuyerFee,
            signatory: hexEncode(returnBuyerDepositFeeSignatory),
            signatoryOwnerBuyerDepositFeeHash160: hexEncode(sellerPkh),
            socketId: socket?.id
          }
        }).unwrap();
      }

      dispatch(
        showToast(
          'success',
          {
            message: 'success',
            description: 'Escrow fund claim successful. Click here to see transaction!'
          },
          true,
          `${coinInfo[COIN.XEC].blockExplorerUrl}/tx/${txid}`
        )
      );
    } catch (e) {
      console.log(e);
      showError();
    }

    setLoading(false);
  };

  const handleCopyAmount = () => {
    dispatch(
      showToast('success', {
        message: 'success',
        description: 'Copy amount to clipboard'
      })
    );
  };

  const showError = () => {
    dispatch(
      showToast('error', {
        message: 'error',
        description: "Order's status update failed!"
      })
    );
  };

  const handleCreateDispute = () => {
    dispatch(openModal('ReasonDisputeModal', { id: id! }));
  };

  const handleMarkAsPaid = async () => {
    setLoading(true);
    try {
      await markAsPaidOrderTrigger({ input: { orderId: id!, markAsPaid: true } });
      setLoading(false);
      setIsDisabled(true);
      setTimeout(() => {
        setIsDisabled(false);
      }, 15000);
    } catch (e) {
      console.log(e);
      setLoading(false);
    }
  };

  const handleAllowOfferTakerChat = async () => {
    setLoading(true);
    try {
      await allowOfferTakerChatTrigger({ input: { orderId: id!, allowOfferTakerChat: true } });
      dispatch(
        showToast('success', {
          message: 'Success',
          description: "You've accepted the order! Chat is now available for the offer taker."
        })
      );
      setLoading(false);
    } catch (e) {
      console.log(e);
      setLoading(false);
    }
  };

  const safeComponent = (content: string) => {
    return (
      <React.Fragment>
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
        <Typography variant="body1" color="error" align="center">
          {content}
        </Typography>
      </React.Fragment>
    );
  };

  // Shared components
  const DonationOptions = ({ userType, setDonateOption, donateOptionSelected }) => {
    return (
      <Stack>
        <RadioGroup>
          {donateOption.map(item => {
            return (
              <FormControlLabel
                onClick={() => {
                  setDonateOption(item.value);
                }}
                key={item.label}
                value={item.value}
                control={<Radio />}
                label={item.label}
                checked={item.value === donateOptionSelected}
              />
            );
          })}
        </RadioGroup>
        <Typography sx={{ fontSize: '12px', marginTop: '10px' }} fontStyle="italic">
          Optional: This service has been brought to you free of charge. We would appreciate a donation to continue
          maintaining it.
        </Typography>
      </Stack>
    );
  };

  const ClaimButton = ({
    userType,
    handleClaimFunction,
    isDonateRequired,
    donateOptionSelected,
    buttonText = 'Claim'
  }) => {
    return (
      <Button
        color="success"
        variant="contained"
        disabled={loading || (isDonateRequired && donateOptionSelected === null)}
        onClick={handleClaimFunction}
        fullWidth
        style={{ marginTop: '10px' }}
      >
        {buttonText}
      </Button>
    );
  };

  /**
   * Get the status data for the current escrow state
   * @returns Object containing UI state data
   */
  const getEscrowStateData = () => {
    const isSeller = selectedWalletPath?.hash160 === currentData?.escrowOrder.sellerAccount.hash160;
    const isBuyer = selectedWalletPath?.hash160 === currentData?.escrowOrder.buyerAccount.hash160;
    const isArbiOrMod =
      selectedWalletPath?.hash160 === currentData?.escrowOrder.arbitratorAccount.hash160 ||
      selectedWalletPath?.hash160 === currentData?.escrowOrder.moderatorAccount.hash160;

    const orderStatus = currentData?.escrowOrder.escrowOrderStatus;
    const hasDispute = currentData?.escrowOrder.dispute;
    const disputeActive = hasDispute && currentData?.escrowOrder.dispute.status === DisputeStatus.Active;
    const hasReleaseSignatory = currentData?.escrowOrder.releaseSignatory;
    const hasReturnSignatory = currentData?.escrowOrder.returnSignatory;
    const hasReturnFeeSignatory = currentData?.escrowOrder.returnFeeSignatory;
    const hasReturnBuyerDepositFeeSignatory = currentData?.escrowOrder.returnBuyerDepositFeeSignatory;
    const hasReturnFeeTxid = currentData?.escrowOrder.returnFeeTxid;
    const hasReturnBuyerDepositFeeTxid = currentData?.escrowOrder.returnBuyerDepositFeeTxid;
    const enoughSellerFunds = checkSellerEnoughFund();

    // First determine the main state
    let state = {
      statusComponent: null,
      actionButtons: null,
      statusColor: 'error' // default color
    };

    // Handle arbitrator/moderator view
    if (isArbiOrMod) {
      if (!hasDispute) {
        state.statusComponent = (
          <Typography variant="body1" color="error" align="center">
            The order is currently in progress.
          </Typography>
        );
        return state;
      }

      if (disputeActive) {
        state.statusComponent = (
          <Typography variant="body1" color="error" align="center">
            Please resolve the dispute
          </Typography>
        );
        state.actionButtons = (
          <Button
            color="warning"
            variant="contained"
            onClick={() => router.push(`/dispute-detail?id=${currentData?.escrowOrder.dispute.id}`)}
            fullWidth={true}
          >
            Go to dispute
          </Button>
        );
        return state;
      }
    }

    // Handle different order statuses
    switch (orderStatus) {
      case EscrowOrderStatus.Cancel:
        if (isBuyer && hasReturnBuyerDepositFeeSignatory && !hasReturnBuyerDepositFeeTxid) {
          state.statusComponent = (
            <Typography variant="body1" color="error" align="center">
              You&apos;re able to reclaim the fee
            </Typography>
          );
          state.actionButtons = (
            <React.Fragment>
              <DonationOptions
                userType="buyer"
                setDonateOption={setBuyerDonateOption}
                donateOptionSelected={buyerDonateOption}
              />
              <ClaimButton
                userType="buyer"
                handleClaimFunction={async () => await handleBuyerClaimEscrowBuyerDepositFee()}
                isDonateRequired={true}
                donateOptionSelected={buyerDonateOption}
                buttonText="Claim back fee"
              />
            </React.Fragment>
          );
        } else {
          state.statusComponent = (
            <Typography variant="body1" color="error" align="center">
              Order has been cancelled
            </Typography>
          );
        }
        break;

      case EscrowOrderStatus.Complete:
        if (isSeller && hasReturnFeeSignatory && !hasReturnFeeTxid) {
          state.statusComponent = (
            <Typography variant="body1" color="error" align="center">
              You&apos;re able to reclaim the fee
            </Typography>
          );
          state.actionButtons = (
            <React.Fragment>
              <DonationOptions
                userType="seller"
                setDonateOption={setSellerDonateOption}
                donateOptionSelected={sellerDonateOption}
              />
              <ClaimButton
                userType="seller"
                handleClaimFunction={async () => await handleSellerClaimEscrowFee()}
                isDonateRequired={true}
                donateOptionSelected={sellerDonateOption}
                buttonText="Claim back fee"
              />
            </React.Fragment>
          );
        } else {
          state.statusComponent = (
            <Typography variant="body1" color="error" align="center">
              Order has been completed
            </Typography>
          );
        }
        break;

      case EscrowOrderStatus.Pending:
        if (isSeller) {
          state.statusComponent = (
            <Typography variant="body1" color="error" align="center" component={'div'}>
              {enoughSellerFunds ? (
                <React.Fragment>
                  {isBuyOffer ? (
                    <div>
                      {telegramButton()}
                      <p>
                        {COIN.XEC} in escrow will only be released when you confirm the receipt of money. You can
                        dispute to get it back if the buyer fail to deliver
                      </p>
                    </div>
                  ) : (
                    safeComponent(
                      'Payment will only be made once the order is escrowed. You may want to chat with the buyer for further agreement and details prior to escrow.'
                    )
                  )}
                  {InfoEscrow()}
                </React.Fragment>
              ) : (
                <React.Fragment>
                  Not enough funds available for this trade. Please deposit {COIN.XEC} to your wallet.
                  {InfoEscrow()}
                  {DepositQRCode()}
                </React.Fragment>
              )}
            </Typography>
          );
          state.actionButtons = (
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
                disabled={!enoughSellerFunds}
                color="success"
                variant="contained"
                onClick={async () => await handleSellerDepositEscrow()}
              >
                Escrow
              </Button>
            </div>
          );
        } else {
          state.statusComponent = (
            <React.Fragment>
              <Typography variant="body1" color="error" align="center">
                Pending Escrow!
              </Typography>
              {safeComponent(
                ' Once the order is escrowed, the status will turn green with a closed safe icon. Do not send money or goods until the order is escrowed, or you risk losing money.'
              )}
            </React.Fragment>
          );
          state.actionButtons = (
            <div className="group-button-wrap">
              <Button
                style={{ backgroundColor: '#a41208' }}
                variant="contained"
                fullWidth
                onClick={async () => await updateOrderStatus(EscrowOrderStatus.Cancel)}
                disabled={loading}
              >
                Cancel
              </Button>
              {chatButtonState?.showAcceptButtonFromOfferMaker && (
                <Button fullWidth variant="contained" color="success" onClick={handleAllowOfferTakerChat}>
                  Accept
                </Button>
              )}
            </div>
          );
        }
        break;

      case EscrowOrderStatus.Escrow:
        // First check for dispute
        if (disputeActive) {
          state.statusComponent = (
            <Typography variant="body1" color="error" align="center">
              Awating arbitrator/moderator to resolve the dispute
            </Typography>
          );
          break;
        }

        // Handle released funds
        if (hasReleaseSignatory) {
          state.statusColor = '#66bb6a';
          state.statusComponent = (
            <React.Fragment>
              <Typography variant="body1" color="#66bb6a" align="center">
                Successfully Released!
              </Typography>
              <Stack
                direction="row"
                spacing={0}
                justifyContent="center"
                color="white"
                alignItems="center"
                margin="20px"
              >
                <Image width={50} height={50} src="/safebox-open.svg" alt="" />
                <CheckIcon color="success" style={{ fontSize: '50px' }} />
              </Stack>
              <Typography variant="body1" color="#66bb6a" align="center">
                {`${currentData.escrowOrder.amount} XEC has been released.`}
                <br />
                {`${isSeller ? 'The buyer' : 'You'} can claim the funds now.`}
              </Typography>
            </React.Fragment>
          );

          // Only buyer can claim released funds
          if (!isSeller) {
            state.actionButtons = (
              <React.Fragment>
                {currentData?.escrowOrder.buyerDepositTx && (
                  <DonationOptions
                    userType="buyer"
                    setDonateOption={setBuyerDonateOption}
                    donateOptionSelected={buyerDonateOption}
                  />
                )}
                <ClaimButton
                  userType="buyer"
                  handleClaimFunction={async () => {
                    await handleBuyerClaimEscrow();
                  }}
                  isDonateRequired={currentData?.escrowOrder.buyerDepositTx ? true : false}
                  donateOptionSelected={buyerDonateOption}
                />
              </React.Fragment>
            );
          }
          break;
        }

        // Handle returned funds
        if (hasReturnSignatory) {
          state.statusColor = '#66bb6a';
          state.statusComponent = (
            <React.Fragment>
              <Typography variant="body1" color="#66bb6a" align="center">
                Successfully Returned!
              </Typography>
              <Stack
                direction="row"
                spacing={0}
                justifyContent="center"
                color="white"
                alignItems="center"
                margin="20px"
              >
                <Image width={50} height={50} src="/safebox-open.svg" alt="" />
                <KeyboardReturnIcon color="success" style={{ fontSize: '50px' }} />
              </Stack>
              <Typography variant="body1" color="#66bb6a" align="center">
                {`${currentData.escrowOrder.amount} XEC has been returned.`}
                <br />
                {`${isSeller ? 'You' : 'The seller'} can now claim the funds.`}
              </Typography>
            </React.Fragment>
          );

          // Only seller can claim returned funds
          if (isSeller) {
            state.actionButtons = (
              <React.Fragment>
                <DonationOptions
                  userType="seller"
                  setDonateOption={setSellerDonateOption}
                  donateOptionSelected={sellerDonateOption}
                />
                <ClaimButton
                  userType="seller"
                  handleClaimFunction={async () => {
                    await handleSellerClaimEscrow();
                    await handleSellerClaimEscrowFee();
                  }}
                  isDonateRequired={true}
                  donateOptionSelected={sellerDonateOption}
                />
              </React.Fragment>
            );
          }
          break;
        }

        // Default escrow state
        if (isSeller) {
          state.statusComponent = (
            <Typography variant="body1" color="error" align="center">
              Only release the escrowed funds once you have confirmed that the buyer has completed the payment or
              goods/services.
            </Typography>
          );
          state.actionButtons = (
            <div className="group-button-wrap">
              <Button color="warning" variant="contained" disabled={loading} onClick={() => handleCreateDispute()}>
                Dispute
              </Button>
              <Button color="success" variant="contained" onClick={() => setOpenReleaseModal(true)} disabled={loading}>
                Release
              </Button>
            </div>
          );
        } else {
          state.statusColor = '#66bb6a';
          state.statusComponent = (
            <React.Fragment>
              <Typography variant="body1" color="#66bb6a" align="center">
                Successfully Escrowed!
              </Typography>
              <Stack
                direction="row"
                spacing={0}
                justifyContent="center"
                color="white"
                alignItems="center"
                margin="20px"
              >
                <Image width={50} height={50} src="/safebox-close.svg" alt="" />
                <CheckIcon color="success" style={{ fontSize: '50px' }} />
              </Stack>
              <Typography variant="body1" color="#66bb6a" align="center">
                {`${currentData.escrowOrder.amount} XEC has been safely locked. You are now safe to send payments or goods to settle the order.`}
              </Typography>
            </React.Fragment>
          );
          state.actionButtons = (
            <div>
              {telegramButton('Chat with seller for payment details')}
              <div className="group-button-wrap">
                {currentData.escrowOrder?.markAsPaid ? (
                  <Button
                    color="warning"
                    variant="contained"
                    disabled={loading || isDisabled}
                    onClick={() => handleCreateDispute()}
                  >
                    Dispute
                  </Button>
                ) : (
                  <Button color="success" variant="contained" disabled={loading} onClick={() => handleMarkAsPaid()}>
                    Mark as paid
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
        break;

      default:
        // Handle any other statuses
        state.statusComponent = (
          <Typography variant="body1" color="error" align="center">
            Unknown order status
          </Typography>
        );
        break;
    }

    return state;
  };

  /**
   * Renders the escrow status component
   */
  const escrowStatus = () => {
    const { statusComponent } = getEscrowStateData();
    return statusComponent;
  };

  /**
   * Renders the action buttons for the current escrow state
   */
  const escrowActionButtons = () => {
    const { actionButtons } = getEscrowStateData();
    return actionButtons;
  };

  const chatButtonState = useMemo(() => {
    const isOfferMaker = isBuyOffer
      ? selectedWalletPath?.hash160 === currentData?.escrowOrder?.buyerAccount.hash160
      : selectedWalletPath?.hash160 === currentData?.escrowOrder?.sellerAccount.hash160;

    const offerMakerSettings = isBuyOffer
      ? allSettings?.[`${currentData?.escrowOrder?.buyerAccount.id.toString()}`]
      : allSettings?.[`${currentData?.escrowOrder?.sellerAccount.id.toString()}`];

    const hasRestrictedChat =
      !currentData?.escrowOrder?.allowOfferTakerChat &&
      currentData?.escrowOrder?.escrowOrderStatus === EscrowOrderStatus.Pending &&
      offerMakerSettings?.usePublicLocalUserName;

    return {
      disableTelegramButton: !isOfferMaker && hasRestrictedChat,
      showAcceptButtonFromOfferMaker: isOfferMaker && hasRestrictedChat
    };
  }, [isBuyOffer, selectedWalletPath?.hash160, currentData?.escrowOrder, allSettings]);

  const hiddenTelegramButton = (): boolean => {
    const isSeller = selectedWalletPath?.hash160 === currentData?.escrowOrder.sellerAccount.hash160;

    //remove bottom button when seller in buyOffer is pending
    if (isSeller && isBuyOffer && currentData?.escrowOrder?.escrowOrderStatus === EscrowOrderStatus.Pending) {
      return true;
    }

    //remove bottom button when buyer in status escrow
    if (
      !isSeller &&
      currentData?.escrowOrder?.escrowOrderStatus === EscrowOrderStatus.Escrow &&
      !currentData.escrowOrder.releaseSignatory &&
      !currentData.escrowOrder.returnSignatory &&
      !currentData?.escrowOrder?.dispute
    ) {
      return true;
    }
    return false;
  };

  const telegramButton = (content?: string) => {
    const isSeller = selectedWalletPath?.hash160 === currentData?.escrowOrder.sellerAccount.hash160;
    const isArbiOrMod =
      selectedWalletPath?.hash160 === currentData?.escrowOrder.arbitratorAccount.hash160 ||
      selectedWalletPath?.hash160 === currentData?.escrowOrder.moderatorAccount.hash160;

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
            disabled={chatButtonState?.disableTelegramButton}
          />
        </React.Fragment>
      )
    );
  };

  const DepositQRCode = () => {
    const isSeller = selectedWalletPath?.hash160 === currentData?.escrowOrder.sellerAccount.hash160;

    return (
      isSeller && (
        <QRCode
          address={parseCashAddressToPrefix(COIN.XEC, selectedWalletPath?.cashAddress)}
          amount={escrowCalculations.totalAmount}
          width="55%"
        />
      )
    );
  };

  const checkSellerEnoughFund = () => {
    return totalValidAmount > escrowCalculations.totalAmount;
  };

  const showPrice = useMemo(() => {
    return showPriceInfo(
      currentData?.escrowOrder?.paymentMethod?.id,
      currentData?.escrowOrder?.escrowOffer?.coinPayment,
      currentData?.escrowOrder?.escrowOffer?.priceCoinOthers
    );
  }, [currentData?.escrowOrder]);

  const isShowDynamicValue = useMemo(() => {
    //dynamic value only buyOffer pending and not for goods/service
    return isBuyOffer && currentData?.escrowOrder?.escrowOrderStatus === EscrowOrderStatus.Pending && showPrice;
  }, [showPrice]);

  const calDisputeFee = useMemo(() => {
    const amountOrder = isShowDynamicValue ? amountXEC : currentData?.escrowOrder.amount;

    const fee1Percent = parseFloat((amountOrder / 100).toFixed(2));
    const dustXEC = coinInfo[COIN.XEC].dustSats / Math.pow(10, coinInfo[COIN.XEC].cashDecimals);

    return Math.max(fee1Percent, dustXEC);
  }, [currentData?.escrowOrder.amount, isShowDynamicValue ? amountXEC : null]);

  const escrowCalculations = useMemo(() => {
    const escrowScriptFee = estimatedFee(currentData?.escrowOrder?.escrowScript ?? '');
    const feeScriptFee = estimatedFee(currentData?.escrowOrder?.escrowFeeScript ?? '');

    const baseEscrowAmount = isShowDynamicValue ? amountXEC : currentData?.escrowOrder?.amount ?? 0;

    const totalAmountEscrow = baseEscrowAmount + escrowScriptFee;
    const totalAmountFee = calDisputeFee + feeScriptFee;

    const totalAmount = Number((totalAmountEscrow + totalAmountFee).toFixed(2));

    return {
      escrowScriptFee,
      feeScriptFee,
      baseEscrowAmount,
      totalAmountEscrow,
      totalAmountFee,
      totalAmount
    };
  }, [
    currentData?.escrowOrder?.escrowScript,
    currentData?.escrowOrder?.escrowFeeScript,
    currentData?.escrowOrder?.amount,
    isShowDynamicValue,
    amountXEC,
    calDisputeFee
  ]);

  const InfoEscrow = () => {
    const fee1Percent = calDisputeFee;
    const totalBalanceFormat = formatNumber(totalValidAmount);

    return (
      <div style={{ color: 'white', marginBottom: '10px' }}>
        {currentData?.escrowOrder.buyerDepositTx && (
          <Typography style={{ fontWeight: 'bold' }}>
            *Buyer deposited the fee ({calDisputeFee} {COIN.XEC})
          </Typography>
        )}
        <Typography>
          Your wallet: {totalBalanceFormat} {COIN.XEC}
        </Typography>
        <Typography>
          Security deposit ({securityDepositPercentage}%): {formatNumber(fee1Percent)} {COIN.XEC}
        </Typography>
        <Typography>
          Withdraw fee (for seller’s security deposit): {formatNumber(escrowCalculations.feeScriptFee)} {COIN.XEC}
        </Typography>
        <Typography>
          Withdraw fee (for escrow funds): {formatNumber(escrowCalculations.escrowScriptFee)} {COIN.XEC}
        </Typography>
        <CopyToClipboard text={escrowCalculations.totalAmount} onCopy={handleCopyAmount}>
          <React.Fragment>
            <Typography
              style={{ fontWeight: 'bold', fontStyle: 'italic', textDecoration: 'underline', cursor: 'pointer' }}
            >
              Total: {formatNumber(escrowCalculations.totalAmount)} {COIN.XEC}
            </Typography>
            <span style={{ fontSize: '12px', color: 'gray' }}> (Excluding miner&apos;s fees)</span>
          </React.Fragment>
        </CopyToClipboard>
      </div>
    );
  };

  // join room
  useEffect(() => {
    currentData?.escrowOrder.escrowOrderStatus !== EscrowOrderStatus.Complete &&
      isSuccess &&
      !_.isNil(socket) &&
      dispatch(userSubcribeEscrowOrderChannel(id));
  }, [socket, isSuccess]);

  useEffect(() => {
    currentData?.escrowOrder.dispute && setDonateOption([CLAIM_BACK_WALLET, DONATE_ARBITRATOR, DONATE_LOCAL_ECASH]);
  }, [currentData?.escrowOrder.dispute]);

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
            {!hiddenTelegramButton() && telegramButton()}
          </OrderDetailContent>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'center', height: '100vh' }}>
            <CircularProgress style={{ color: 'white', margin: 'auto' }} />
          </div>
        )}

        <ConfirmCancelModal
          isOpen={openCancelModal}
          returnAction={handleBuyerReturnEscrow}
          onDismissModal={value => setOpenCancelModal(value)}
          isBuyerDeposit={currentData?.escrowOrder.buyerDepositTx ? true : false}
          disputeFee={calDisputeFee}
        />

        <ConfirmReleaseModal
          isOpen={openReleaseModal}
          disputeFee={calDisputeFee}
          returnAction={handleSellerReleaseEscrow}
          onDismissModal={value => setOpenReleaseModal(value)}
        />
      </OrderDetailPage>
    </MobileLayout>
  );
};

export default OrderDetail;
