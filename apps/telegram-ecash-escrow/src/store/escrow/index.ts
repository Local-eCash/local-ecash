import { COIN, coinInfo } from '@bcpros/lixi-models';
import { UtxoInNode, UtxoInNodeInput } from '@bcpros/redux-store';
import { Utxo_InNode } from 'chronik-client';
import {
  ALL_BIP143,
  Ecc,
  OP_1,
  OP_2,
  OP_3,
  OP_4,
  OP_5,
  OP_6,
  OP_CAT,
  OP_CHECKDATASIGVERIFY,
  OP_DUP,
  OP_ELSE,
  OP_ENDIF,
  OP_EQUAL,
  OP_EQUALVERIFY,
  OP_FROMALTSTACK,
  OP_HASH160,
  OP_IF,
  OP_SWAP,
  OP_TOALTSTACK,
  P2PKHSignatory,
  SINGLE_ANYONECANPAY_BIP143,
  Script,
  Signatory,
  Tx,
  TxBuilder,
  TxBuilderInput,
  TxBuilderOutput,
  TxOutput,
  UnsignedTxInput,
  fromHex,
  pushBytesOp,
  sha256,
  shaRmd160,
  strToBytes,
  toHex
} from 'ecash-lib';
import cashaddr from 'ecashaddrjs';
import { convertXECToSatoshi, deserializeTransaction, serializeTransaction } from '../util';
import { ACTION } from './constant';

export class Escrow {
  public sellerPk: Uint8Array;
  public buyerPk: Uint8Array;
  public arbiPk: Uint8Array;
  public modPk: Uint8Array;
  public nonce: string;

  constructor({
    sellerPk,
    buyerPk,
    arbiPk,
    modPk,
    nonce
  }: {
    sellerPk: Uint8Array;
    buyerPk: Uint8Array;
    arbiPk: Uint8Array;
    modPk: Uint8Array;
    nonce: string;
  }) {
    this.sellerPk = sellerPk;
    this.buyerPk = buyerPk;
    this.arbiPk = arbiPk;
    this.modPk = modPk;
    this.nonce = nonce;
  }

  /** Build the Script enforcing the Agora offer covenant. */
  public script(): Script {
    const sellerPkh = shaRmd160(this.sellerPk);
    const buyerPkh = shaRmd160(this.buyerPk);
    const arbiPkh = shaRmd160(this.arbiPk);
    const modPkh = shaRmd160(this.modPk);
    const nonce = strToBytes(this.nonce);

    return Script.fromOps([
      OP_DUP, // We need to use the byte again afterwards
      //Get the hashed public keys we need to compare against (ours, and the oracle)
      OP_1,
      OP_EQUAL,
      OP_IF,
      pushBytesOp(sellerPkh), //<hash160(SellerPubKey)> # Oracle pub key
      pushBytesOp(buyerPkh), //<hash160(BuyerPubKey)> # Spender pub key
      OP_ELSE,
      OP_DUP,
      OP_2, //# = release to buyer from arbitrator
      OP_EQUAL,
      OP_IF,
      pushBytesOp(arbiPkh), //<hash160(ArbPubKey)> # Oracle pub key
      pushBytesOp(buyerPkh), //<hash160(BuyerPubKey)> # Spender pub key
      OP_ELSE,
      OP_DUP,
      OP_3, //# = return to seller from buyer
      OP_EQUAL,
      OP_IF,
      pushBytesOp(buyerPkh), //<hash160(BuyerPubKey)> # Oracle pub key
      pushBytesOp(sellerPkh), //<hash160(SellerPubKey)> # Spender pub key
      OP_ELSE,
      OP_DUP,
      OP_4, //# = return to seller from arbitrator
      OP_EQUAL,
      OP_IF,
      pushBytesOp(arbiPkh), //<hash160(ArbPubKey)> # Oracle pub key
      pushBytesOp(sellerPkh), //<hash160(SellerPubKey)> # Spender pub key
      OP_ELSE,
      OP_DUP,
      OP_5, //# = release to buyer from moderator
      OP_EQUAL,
      OP_IF,
      pushBytesOp(modPkh), //<hash160(ArbPubKey)> # Oracle pub key
      pushBytesOp(buyerPkh), //<hash160(SellerPubKey)> # Spender pub key
      OP_ELSE,
      OP_DUP,
      OP_6, //# = return to seller from moderator
      OP_EQUALVERIFY,
      pushBytesOp(modPkh), //<hash160(ArbPubKey)> # Oracle pub key
      pushBytesOp(sellerPkh), //<hash160(SellerPubKey)> # Spender pub key
      OP_ENDIF,
      OP_ENDIF,
      OP_ENDIF,
      OP_ENDIF,
      OP_ENDIF,
      //# Put the hashed public keys on the alt stack
      OP_TOALTSTACK,
      OP_TOALTSTACK, //# Stack is effectively reset to the input
      //# On the alt stack we have: [ hash160(SpenderPubKey), hash160(OraclePubKey) ]
      pushBytesOp(nonce), //<EscrowKey> # Append the nonce to the escrow key to make the message
      OP_CAT, //# Stack is [ ..., <OraclePubKey>, <0x01 || EscrowKey> ]
      OP_SWAP, //# Use this later; verify the oracle public key hash first
      OP_DUP,
      OP_HASH160,
      OP_FROMALTSTACK, //# Grab hashed pub key from alt stack
      OP_EQUALVERIFY, //# Public key checks out; now verify the oracle signature
      OP_CHECKDATASIGVERIFY, //# Now verify the sender
      OP_HASH160,
      OP_FROMALTSTACK,
      OP_EQUAL
    ]);
  }
}

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

  const feeInSatsPerKByte = coinInfo[COIN.XEC].defaultFee * 1000;
  const roundedFeeInSatsPerKByte = parseInt(feeInSatsPerKByte.toFixed(0));

  return txBuild.sign(ecc, roundedFeeInSatsPerKByte, coinInfo[COIN.XEC].etokenSats).ser();
};

export const buildReleaseTx = (
  txids: { txid: string; value: number; outIdx: number }[],
  amountToSend: number,
  escrowScript: Script,
  scriptSignatory: Signatory,
  receiverP2pkh: Script,
  changeAddress: string,
  disputeFee: number,
  isBuyerDeposit: boolean,
  isGNCAddress = false
) => {
  const ecc = new Ecc();
  const amountSatoshi = convertXECToSatoshi(amountToSend);
  const disputeSatoshi = convertXECToSatoshi(disputeFee);

  const utxos = txids.map(({ txid, value, outIdx }) => {
    return {
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
    };
  });

  let changeP2pkhHOrP2sh;
  if (changeAddress) {
    const { type: typeXEC, hash: hashXEC } = cashaddr.decode(changeAddress, false);
    const changeHash = Buffer.from(hashXEC).toString('hex');
    changeP2pkhHOrP2sh = Script.p2pkh(fromHex(changeHash));

    //process for GNC address
    if (isGNCAddress && typeXEC.toUpperCase() === 'P2SH') {
      changeP2pkhHOrP2sh = Script.p2sh(fromHex(changeHash));
    }
  }

  let txBuild;

  if (isBuyerDeposit) {
    txBuild = new TxBuilder({
      inputs: utxos,
      outputs: [
        {
          value: amountSatoshi + disputeSatoshi,
          script: receiverP2pkh
        },
        {
          value: disputeSatoshi,
          script: changeAddress ? changeP2pkhHOrP2sh : receiverP2pkh
        }
      ]
    });
  } else {
    txBuild = new TxBuilder({
      inputs: utxos,
      outputs: [
        {
          value: amountSatoshi,
          script: receiverP2pkh
        },
        {
          value: disputeSatoshi,
          script: changeAddress ? changeP2pkhHOrP2sh : receiverP2pkh
        }
      ]
    });
  }

  const feeInSatsPerKByte = coinInfo[COIN.XEC].defaultFee * 1000;
  const roundedFeeInSatsPerKByte = parseInt(feeInSatsPerKByte.toFixed(0));
  return txBuild.sign(ecc, roundedFeeInSatsPerKByte, 546).ser();
};

export const SellerReleaseSignatory = (
  sellerSk: Uint8Array,
  sellerPk: Uint8Array,
  buyerPk: Uint8Array,
  nonce: string
) => {
  return (ecc: Ecc, input: UnsignedTxInput): Script => {
    const preimage = input.sigHashPreimage(ALL_BIP143);
    const hexNonce = toHex(strToBytes(nonce));
    const message = ACTION.SELLER_RELEASE + hexNonce;

    const oracleMessage = sha256(fromHex(message)); // ACTION BYTE - 01 + NONCE - 48656c6c6f
    const oracleSig = ecc.ecdsaSign(sellerSk, oracleMessage);

    return Script.fromOps([
      pushBytesOp(buyerPk),
      pushBytesOp(oracleSig),
      pushBytesOp(sellerPk),
      OP_1,
      pushBytesOp(preimage.redeemScript.bytecode)
    ]);
  };
};

export const ArbiReleaseSignatory = (arbiSk: Uint8Array, arbiPk: Uint8Array, buyerPk: Uint8Array, nonce: string) => {
  return (ecc: Ecc, input: UnsignedTxInput): Script => {
    const preimage = input.sigHashPreimage(ALL_BIP143);
    const hexNonce = Buffer.from(nonce, 'utf-8').toString('hex');
    const message = ACTION.ARBI_RELEASE + hexNonce;

    const oracleMessage = sha256(fromHex(message)); // ACTION BYTE - 01 + NONCE - 48656c6c6f
    const oracleSig = ecc.ecdsaSign(arbiSk, oracleMessage);

    return Script.fromOps([
      pushBytesOp(buyerPk),
      pushBytesOp(oracleSig),
      pushBytesOp(arbiPk),
      OP_2,
      pushBytesOp(preimage.redeemScript.bytecode)
    ]);
  };
};

export const BuyerReturnSignatory = (buyerSk: Uint8Array, buyerPk: Uint8Array, sellerPk: Uint8Array, nonce: string) => {
  return (ecc: Ecc, input: UnsignedTxInput): Script => {
    const preimage = input.sigHashPreimage(ALL_BIP143);
    const hexNonce = Buffer.from(nonce, 'utf-8').toString('hex');
    const message = ACTION.BUYER_RETURN + hexNonce;

    const oracleMessage = sha256(fromHex(message)); // ACTION BYTE - 01 + NONCE - 48656c6c6f
    const oracleSig = ecc.ecdsaSign(buyerSk, oracleMessage);

    return Script.fromOps([
      pushBytesOp(sellerPk),
      pushBytesOp(oracleSig),
      pushBytesOp(buyerPk),
      OP_3,
      pushBytesOp(preimage.redeemScript.bytecode)
    ]);
  };
};

export const ArbiReturnSignatory = (arbiSk: Uint8Array, arbiPk: Uint8Array, sellerPk: Uint8Array, nonce: string) => {
  return (ecc: Ecc, input: UnsignedTxInput): Script => {
    const preimage = input.sigHashPreimage(ALL_BIP143);
    const hexNonce = Buffer.from(nonce, 'utf-8').toString('hex');
    const message = ACTION.ARBI_RETURN + hexNonce;

    const oracleMessage = sha256(fromHex(message)); // ACTION BYTE - 01 + NONCE - 48656c6c6f
    const oracleSig = ecc.ecdsaSign(arbiSk, oracleMessage);

    return Script.fromOps([
      pushBytesOp(sellerPk),
      pushBytesOp(oracleSig),
      pushBytesOp(arbiPk),
      OP_4,
      pushBytesOp(preimage.redeemScript.bytecode)
    ]);
  };
};

export const ModReleaseSignatory = (modSk: Uint8Array, modPk: Uint8Array, buyerPk: Uint8Array, nonce: string) => {
  return (ecc: Ecc, input: UnsignedTxInput): Script => {
    const preimage = input.sigHashPreimage(ALL_BIP143);
    const hexNonce = Buffer.from(nonce, 'utf-8').toString('hex');
    const message = ACTION.MOD_RELEASE + hexNonce;

    const oracleMessage = sha256(fromHex(message)); // ACTION BYTE - 01 + NONCE - 48656c6c6f
    const oracleSig = ecc.ecdsaSign(modSk, oracleMessage);

    return Script.fromOps([
      pushBytesOp(buyerPk),
      pushBytesOp(oracleSig),
      pushBytesOp(modPk),
      OP_5,
      pushBytesOp(preimage.redeemScript.bytecode)
    ]);
  };
};

export const ModReturnSignatory = (modSk: Uint8Array, modPk: Uint8Array, sellerPk: Uint8Array, nonce: string) => {
  return (ecc: Ecc, input: UnsignedTxInput): Script => {
    const preimage = input.sigHashPreimage(ALL_BIP143);
    const hexNonce = Buffer.from(nonce, 'utf-8').toString('hex');
    const message = ACTION.MOD_RETURN + hexNonce;

    const oracleMessage = sha256(fromHex(message)); // ACTION BYTE - 01 + NONCE - 48656c6c6f
    const oracleSig = ecc.ecdsaSign(modSk, oracleMessage);

    return Script.fromOps([
      pushBytesOp(sellerPk),
      pushBytesOp(oracleSig),
      pushBytesOp(modPk),
      OP_6,
      pushBytesOp(preimage.redeemScript.bytecode)
    ]);
  };
};

export const sellerBuildDepositTx = (
  sellerUtxos: Array<UtxoInNode>,
  sellerSk: Uint8Array,
  sellerPk: Uint8Array,
  amountToSend: number,
  escrowScript: Script,
  buyerDepositTx: string
): { txBuild: Uint8Array; utxoRemoved: UtxoInNodeInput } => {
  const ecc = new Ecc();
  const sellerP2pkh = Script.p2pkh(shaRmd160(sellerPk));
  const escrowP2sh = Script.p2sh(shaRmd160(escrowScript.bytecode));

  const feeInSatsPerKByte = coinInfo[COIN.XEC].defaultFee * 1000;
  const roundedFeeInSatsPerKByte = parseInt(feeInSatsPerKByte.toFixed(0));

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
    const sellerInputs = sellerUtxos.map(utxo => {
      return {
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
      outputs: [...buyerOutpus, sellerP2pkh]
    });
    const txBuildFinalSign = txBuildFinal.sign(ecc, roundedFeeInSatsPerKByte, coinInfo[COIN.XEC].etokenSats);

    return {
      txBuild: txBuildFinalSign.ser(),
      utxoRemoved: {
        txid: deserializeTx.inputs[0].prevOut.txid as string,
        outIdx: deserializeTx.inputs[0].prevOut.outIdx,
        value: deserializeTx.inputs[0].signData.value as number
      }
    };
  } else {
    const utxos = sellerUtxos.map(utxo => {
      return {
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
      };
    });

    const amountSats = convertXECToSatoshi(amountToSend);

    const txBuild = new TxBuilder({
      inputs: utxos,
      outputs: [
        {
          value: amountSats,
          script: escrowP2sh
        },
        sellerP2pkh
      ]
    });

    return {
      txBuild: txBuild.sign(ecc, roundedFeeInSatsPerKByte, coinInfo[COIN.XEC].etokenSats).ser(),
      utxoRemoved: null
    };
  }
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

  const feeInSatsPerKByte = coinInfo[COIN.XEC].defaultFee * 1000;
  const roundedFeeInSatsPerKByte = parseInt(feeInSatsPerKByte.toFixed(0));

  return txBuild.sign(ecc, roundedFeeInSatsPerKByte, coinInfo[COIN.XEC].etokenSats).ser();
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

  const feeInSatsPerKByte = coinInfo[COIN.XEC].defaultFee * 1000;
  const roundedFeeInSatsPerKByte = parseInt(feeInSatsPerKByte.toFixed(0));

  const txAfterSign = txBuild.sign(ecc, roundedFeeInSatsPerKByte, coinInfo[COIN.XEC].etokenSats);

  //convert to json string
  const JsonTxAfterSign = serializeTransaction(txAfterSign);
  //convert it to hex
  const hexJsonStr = Buffer.from(JsonTxAfterSign).toString('hex');
  return hexJsonStr;
};

export const sellerDepositAndBuildTx = (
  sellerUtxos: Array<Utxo_InNode & { address: string }>,
  sellerSk: Uint8Array,
  sellerPk: Uint8Array,
  depositAmount: number,
  txBuild: TxBuilder,
  escrowScript: Script
): Uint8Array => {
  const ecc = new Ecc();
  const sellerP2pkh = Script.p2pkh(shaRmd160(sellerPk));
  const escrowP2sh = Script.p2sh(shaRmd160(escrowScript.bytecode));

  const utxos = sellerUtxos.map(utxo => {
    return {
      input: {
        prevOut: {
          outIdx: utxo.outpoint.outIdx,
          txid: utxo.outpoint.txid
        },
        signData: {
          value: Number(utxo.value),
          outputScript: sellerP2pkh
        }
      },
      signatory: P2PKHSignatory(sellerSk, sellerPk, ALL_BIP143)
    };
  });

  txBuild.inputs = [...txBuild.inputs, ...utxos];

  txBuild.outputs = [
    ...txBuild.outputs,
    {
      value: depositAmount,
      script: escrowP2sh
    },
    sellerP2pkh
  ];

  return txBuild.sign(ecc, 1000, 546).ser();
};
