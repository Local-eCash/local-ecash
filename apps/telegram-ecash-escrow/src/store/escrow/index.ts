import { COIN, coinInfo } from '@bcpros/lixi-models';
import { UtxoInNode, UtxoInNodeInput } from '@bcpros/redux-store';
import {
  ALL_BIP143,
  Ecc,
  P2PKHSignatory,
  SINGLE_ANYONECANPAY_BIP143,
  Script,
  Signatory,
  Tx,
  TxBuilder,
  TxBuilderInput,
  TxBuilderOutput,
  TxOutput,
  fromHex,
  shaRmd160
} from 'ecash-lib';
import cashaddr from 'ecashaddrjs';
import { convertXECToSatoshi, deserializeTransaction, serializeTransaction } from '../util';

interface TxInput {
  txid: string;
  value: number;
  outIdx: number;
  feeValue?: number;
  feeOutIdx?: number;
  buyerDepositFeeValue?: number;
  buyerDepositFeeOutIdx?: number;
}

const getFeeInSatsPerKByte = () => {
  return Math.floor(coinInfo[COIN.XEC].defaultFee * 1000);
};

const getGNCAddressScript = (): Script => {
  const { type: typeXEC, hash: hashXEC } = cashaddr.decode(process.env.NEXT_PUBLIC_ADDRESS_GNC, false);

  return typeXEC.toUpperCase() === 'P2SH'
    ? Script.p2sh(fromHex(Buffer.from(hashXEC).toString('hex')))
    : Script.p2pkh(fromHex(Buffer.from(hashXEC).toString('hex')));
};

export const withdrawFund = (
  myUtxos: Array<UtxoInNode>,
  mySk: Uint8Array,
  myPk: Uint8Array,
  withdrawHash: string,
  withdrawType: 'P2PKH' | 'P2SH',
  sendAmount: number,
  GNCAddress: string,
  donateAmount: number
): Uint8Array => {
  const ecc = new Ecc();
  const myP2pkh = Script.p2pkh(shaRmd160(myPk));

  let withdrawP2pkhOrP2sh;
  if (withdrawType === 'P2PKH') {
    withdrawP2pkhOrP2sh = Script.p2pkh(fromHex(withdrawHash));
  } else {
    withdrawP2pkhOrP2sh = Script.p2sh(fromHex(withdrawHash));
  }
  const sendAmountSats = convertXECToSatoshi(sendAmount);
  const donateAmountSats = convertXECToSatoshi(donateAmount);

  const utxos = myUtxos.map(utxo => {
    return {
      input: {
        prevOut: {
          outIdx: utxo.outIdx,
          txid: utxo.txid
        },
        signData: {
          value: Number(utxo.value),
          outputScript: myP2pkh
        }
      },
      signatory: P2PKHSignatory(mySk, myPk, ALL_BIP143)
    };
  });

  let donateP2pkhHOrP2sh;
  if (GNCAddress) {
    const { type: typeXEC, hash: hashXEC } = cashaddr.decode(GNCAddress, false);
    const changeHash = Buffer.from(hashXEC).toString('hex');
    donateP2pkhHOrP2sh = Script.p2pkh(fromHex(changeHash));

    //process for GNC address
    if (typeXEC.toUpperCase() === 'P2SH') {
      donateP2pkhHOrP2sh = Script.p2sh(fromHex(changeHash));
    }
  }

  const outputsToSend: TxBuilderOutput[] = donateP2pkhHOrP2sh
    ? [
        {
          value: sendAmountSats,
          script: withdrawP2pkhOrP2sh
        },
        {
          value: donateAmountSats,
          script: donateP2pkhHOrP2sh
        },
        myP2pkh
      ]
    : [
        {
          value: sendAmountSats,
          script: withdrawP2pkhOrP2sh
        },
        myP2pkh
      ];

  const txBuild = new TxBuilder({
    inputs: utxos,
    outputs: [...outputsToSend]
  });

  return txBuild.sign(ecc, getFeeInSatsPerKByte(), coinInfo[COIN.XEC].etokenSats).ser();
};

export const buildReturnTx = (
  tx: TxInput,
  amountToSend: number,
  escrowScript: Script,
  scriptSignatory: Signatory,
  sellerP2pkh: Script
) => {
  const ecc = new Ecc();
  const amountSatoshi = convertXECToSatoshi(amountToSend);

  const { txid, value, outIdx } = tx;

  const utxos = [
    {
      input: {
        prevOut: {
          txid,
          outIdx
        },
        signData: {
          value: value,
          redeemScript: escrowScript
        }
      },
      signatory: scriptSignatory
    }
  ];

  const outputs: { value: number; script: Script }[] = [
    {
      value: amountSatoshi,
      script: sellerP2pkh
    }
  ];

  const txBuild = new TxBuilder({
    inputs: utxos,
    outputs: outputs
  });

  return txBuild.sign(ecc, getFeeInSatsPerKByte(), coinInfo[COIN.XEC].etokenSats).ser();
};

export const buildReturnFeeTx = (
  tx: TxInput,
  disputeFee: number,
  escrowFeeScript: Script,
  scriptSignatory: Signatory,
  selfP2pkh: Script,
  sellerDonateOption: number,
  arbModP2pkh?: Script,
  isBuyerDeposit?: boolean
) => {
  const ecc = new Ecc();
  const GNCAddressScript = getGNCAddressScript();
  const disputeSatoshi = convertXECToSatoshi(disputeFee);

  const outIdx = isBuyerDeposit ? tx.buyerDepositFeeOutIdx : tx.feeOutIdx;
  const value = isBuyerDeposit ? tx.buyerDepositFeeValue : tx.feeValue;

  const utxos = [
    {
      input: {
        prevOut: {
          txid: tx.txid,
          outIdx
        },
        signData: {
          value,
          redeemScript: escrowFeeScript
        }
      },
      signatory: scriptSignatory
    }
  ];

  const outputs: { value: number; script: Script }[] = [];

  switch (sellerDonateOption) {
    case 1:
      outputs.push({ value: disputeSatoshi, script: selfP2pkh });
      break;
    case 2:
      outputs.push({ value: disputeSatoshi, script: arbModP2pkh });
      break;
    case 3:
      outputs.push({ value: disputeSatoshi, script: GNCAddressScript });
      break;
    default:
      outputs.push({ value: disputeSatoshi, script: selfP2pkh });
      break;
  }

  const txBuild = new TxBuilder({
    inputs: utxos,
    outputs: outputs
  });

  return txBuild.sign(ecc, getFeeInSatsPerKByte(), coinInfo[COIN.XEC].etokenSats).ser();
};

export const buildArbModTakeFeeTx = (
  tx: TxInput,
  disputeFee: number,
  escrowFeeScript: Script,
  scriptSignatory: Signatory,
  arbModP2pkh?: Script,
  isBuyerDeposit?: boolean
) => {
  const ecc = new Ecc();
  const disputeSatoshi = convertXECToSatoshi(disputeFee);

  const outIdx = isBuyerDeposit ? tx.buyerDepositFeeOutIdx : tx.feeOutIdx;
  const value = isBuyerDeposit ? tx.buyerDepositFeeValue : tx.feeValue;
  const utxos = [
    {
      input: {
        prevOut: {
          txid: tx.txid,
          outIdx
        },
        signData: {
          value,
          redeemScript: escrowFeeScript
        }
      },
      signatory: scriptSignatory
    }
  ];

  const txBuild = new TxBuilder({
    inputs: utxos,
    outputs: [
      {
        value: disputeSatoshi,
        script: arbModP2pkh
      }
    ]
  });

  return txBuild.sign(ecc, getFeeInSatsPerKByte(), coinInfo[COIN.XEC].etokenSats).ser();
};

export const buildReleaseTx = (
  tx: TxInput,
  amountToSend: number,
  disputeFee: number,
  escrowScript: Script,
  escrowBuyerDepositFeeScript: Script,
  scriptSignatory: Signatory,
  buyerP2pkh: Script,
  isBuyerDeposit: boolean,
  buyerDonateOption: number,
  arbModP2pkh?: Script
) => {
  const ecc = new Ecc();
  const GNCAddressScript = getGNCAddressScript();
  const amountSatoshi = convertXECToSatoshi(amountToSend); //Wont be enough. Need to recalculate
  const disputeSatoshi = convertXECToSatoshi(disputeFee);

  const { txid, value, outIdx, buyerDepositFeeOutIdx, buyerDepositFeeValue } = tx;

  const utxos = [
    {
      input: {
        prevOut: {
          txid,
          outIdx
        },
        signData: {
          value: value,
          redeemScript: escrowScript
        }
      },
      signatory: scriptSignatory
    }
  ];

  const outputs: { value: number; script: Script }[] = [
    {
      value: amountSatoshi,
      script: buyerP2pkh
    }
  ];

  if (isBuyerDeposit) {
    // add input first
    utxos.push({
      input: {
        prevOut: {
          txid,
          outIdx: buyerDepositFeeOutIdx
        },
        signData: {
          value: buyerDepositFeeValue,
          redeemScript: escrowBuyerDepositFeeScript
        }
      },
      signatory: scriptSignatory
    });

    // add output
    switch (buyerDonateOption) {
      case 1:
        outputs.push({ value: disputeSatoshi, script: buyerP2pkh });
        break;
      case 2:
        outputs.push({ value: disputeSatoshi, script: arbModP2pkh });
        break;
      case 3:
        outputs.push({ value: disputeSatoshi, script: GNCAddressScript });
        break;
      default:
        outputs.push({ value: disputeSatoshi, script: buyerP2pkh });
    }
  }

  const txBuild = new TxBuilder({
    inputs: utxos,
    outputs: outputs
  });

  return txBuild.sign(ecc, getFeeInSatsPerKByte(), coinInfo[COIN.XEC].etokenSats).ser();
};

export const sellerBuildDepositTx = (
  sellerUtxos: Array<UtxoInNode>,
  sellerSk: Uint8Array,
  sellerPk: Uint8Array,
  amountToSend: number,
  amountEscrowFee: number,
  escrowScript: Script,
  escrowFeeScript: Script,
  buyerDepositTx: string
): { txBuild: Uint8Array; utxoRemoved: UtxoInNodeInput } => {
  const ecc = new Ecc();
  const sellerP2pkh = Script.p2pkh(shaRmd160(sellerPk));
  const escrowP2sh = Script.p2sh(shaRmd160(escrowScript.bytecode));
  const escrowFeeP2sh = Script.p2sh(shaRmd160(escrowFeeScript.bytecode));

  const amountSats = convertXECToSatoshi(amountToSend);
  const amountEscrowFeeSats = convertXECToSatoshi(amountEscrowFee);

  // Common seller inputs creation
  const sellerInputs: TxBuilderInput[] = sellerUtxos.map(utxo => ({
    input: {
      prevOut: {
        outIdx: utxo.outIdx,
        txid: utxo.txid
      },
      signData: {
        value: Number(utxo.value),
        outputScript: sellerP2pkh
      }
    },
    signatory: P2PKHSignatory(sellerSk, sellerPk, ALL_BIP143)
  }));

  // Common outputs
  const baseOutputs = [
    { value: amountSats, script: escrowP2sh },
    { value: amountEscrowFeeSats, script: escrowFeeP2sh },
    sellerP2pkh
  ];

  if (buyerDepositTx) {
    //deserialize
    const strJsonTx = Buffer.from(buyerDepositTx, 'hex').toString();
    const deserializeTx = new Tx(deserializeTransaction(strJsonTx));

    const buyerInputs: TxBuilderInput[] = deserializeTx.inputs.map(item => {
      return {
        input: {
          prevOut: {
            outIdx: item.prevOut.outIdx,
            txid: item.prevOut.txid
          },
          script: new Script(item.script.bytecode),
          signData: {
            value: Number(item.signData.value),
            outputScript: new Script(item.signData.outputScript.bytecode)
          }
        }
      };
    });

    const buyerOutpus: TxOutput[] = deserializeTx.outputs.map(item => {
      return {
        value: item.value,
        script: new Script(item.script.bytecode)
      };
    });

    const txBuildFinal = new TxBuilder({
      inputs: [...buyerInputs, ...sellerInputs],
      outputs: [...buyerOutpus, ...baseOutputs]
    });
    const txBuildFinalSign = txBuildFinal.sign(ecc, getFeeInSatsPerKByte(), coinInfo[COIN.XEC].etokenSats);

    return {
      txBuild: txBuildFinalSign.ser(),
      utxoRemoved: {
        txid: deserializeTx.inputs[0].prevOut.txid as string,
        outIdx: deserializeTx.inputs[0].prevOut.outIdx,
        value: deserializeTx.inputs[0].signData.value as number
      }
    };
  }

  const txBuild = new TxBuilder({
    inputs: sellerInputs,
    outputs: [...baseOutputs]
  });

  return {
    txBuild: txBuild.sign(ecc, getFeeInSatsPerKByte(), coinInfo[COIN.XEC].etokenSats).ser(),
    utxoRemoved: null
  };
};

export const splitUtxos = (
  splittedUtxos: Array<UtxoInNode>,
  sk: Uint8Array,
  pk: Uint8Array,
  depositAmountSats: number
): Uint8Array => {
  const ecc = new Ecc();
  const buyerP2pkh = Script.p2pkh(shaRmd160(pk));

  const utxos = splittedUtxos.map(utxo => {
    return {
      input: {
        prevOut: {
          outIdx: utxo.outIdx,
          txid: utxo.txid
        },
        signData: {
          value: Number(utxo.value),
          outputScript: buyerP2pkh
        }
      },
      signatory: P2PKHSignatory(sk, pk, ALL_BIP143)
    };
  });

  //tx to split utxos
  const txBuild = new TxBuilder({
    inputs: utxos,
    outputs: [
      {
        value: depositAmountSats,
        script: buyerP2pkh
      },
      buyerP2pkh
    ]
  });

  return txBuild.sign(ecc, getFeeInSatsPerKByte(), coinInfo[COIN.XEC].etokenSats).ser();
};

export const buyerDepositFee = (
  buyerUtxo: UtxoInNode,
  buyerSk: Uint8Array,
  buyerPk: Uint8Array,
  amount: number,
  escrowScript: Script
): string => {
  const ecc = new Ecc();
  const buyerP2pkh = Script.p2pkh(shaRmd160(buyerPk));
  const escrowP2sh = Script.p2sh(shaRmd160(escrowScript.bytecode));

  const amountSats = convertXECToSatoshi(amount);

  const input = {
    input: {
      prevOut: {
        outIdx: buyerUtxo.outIdx,
        txid: buyerUtxo.txid
      },
      signData: {
        value: Number(buyerUtxo.value),
        outputScript: buyerP2pkh
      }
    },
    signatory: P2PKHSignatory(buyerSk, buyerPk, SINGLE_ANYONECANPAY_BIP143) // sign 1 input and 1 output
  };

  //tx to split utxos
  const txBuild = new TxBuilder({
    inputs: [input],
    outputs: [
      {
        value: amountSats,
        script: escrowP2sh
      }
    ]
  });

  const txAfterSign = txBuild.sign(ecc, getFeeInSatsPerKByte(), coinInfo[COIN.XEC].etokenSats);

  //convert to json string
  const JsonTxAfterSign = serializeTransaction(txAfterSign);
  //convert it to hex
  const hexJsonStr = Buffer.from(JsonTxAfterSign).toString('hex');

  return hexJsonStr;
};
