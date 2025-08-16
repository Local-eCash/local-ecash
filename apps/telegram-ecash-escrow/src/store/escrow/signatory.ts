import {
  ALL_BIP143,
  Ecc,
  OP_1,
  OP_2,
  OP_3,
  OP_4,
  OP_5,
  OP_6,
  Script,
  UnsignedTxInput,
  flagSignature,
  fromHex,
  pushBytesOp,
  sha256,
  sha256d,
  strToBytes,
  toHex
} from 'ecash-lib';
import { ACTION } from './constant';

export const SignOracleSignatory = (oracleSk: Uint8Array, action: ACTION, nonce: string): Uint8Array => {
  const ecc = new Ecc();
  const hexNonce = toHex(strToBytes(nonce));
  const message = action + hexNonce; // ACTION BYTE - 01 + NONCE - 48656c6c6f

  const oracleMessage = sha256(fromHex(message));

  return ecc.ecdsaSign(oracleSk, oracleMessage);
};

export const SellerReleaseSignatory = (
  sellerPk: Uint8Array,
  buyerPk: Uint8Array,
  buyerSk: Uint8Array,
  oracleSig: Uint8Array
) => {
  return (ecc: Ecc, input: UnsignedTxInput): Script => {
    const preimage = input.sigHashPreimage(ALL_BIP143);
    const sighash = sha256d(preimage.bytes);
    const buyerSig = flagSignature(ecc.schnorrSign(buyerSk, sighash), ALL_BIP143);

    return Script.fromOps([
      pushBytesOp(buyerSig),
      pushBytesOp(buyerPk),
      pushBytesOp(oracleSig),
      pushBytesOp(sellerPk),
      OP_1,
      pushBytesOp(preimage.redeemScript.bytecode)
    ]);
  };
};

export const ArbiReleaseSignatory = (
  arbiPk: Uint8Array,
  buyerPk: Uint8Array,
  buyerSk: Uint8Array,
  oracleSig: Uint8Array
) => {
  return (ecc: Ecc, input: UnsignedTxInput): Script => {
    const preimage = input.sigHashPreimage(ALL_BIP143);
    const sighash = sha256d(preimage.bytes);
    const buyerSig = flagSignature(ecc.schnorrSign(buyerSk, sighash), ALL_BIP143);

    return Script.fromOps([
      pushBytesOp(buyerSig),
      pushBytesOp(buyerPk),
      pushBytesOp(oracleSig),
      pushBytesOp(arbiPk),
      OP_2,
      pushBytesOp(preimage.redeemScript.bytecode)
    ]);
  };
};

export const BuyerReturnSignatory = (
  buyerPk: Uint8Array,
  sellerPk: Uint8Array,
  sellerSk: Uint8Array,
  oracleSig: Uint8Array
) => {
  return (ecc: Ecc, input: UnsignedTxInput): Script => {
    const preimage = input.sigHashPreimage(ALL_BIP143);
    const sighash = sha256d(preimage.bytes);
    const sellerSig = flagSignature(ecc.schnorrSign(sellerSk, sighash), ALL_BIP143);

    return Script.fromOps([
      pushBytesOp(sellerSig),
      pushBytesOp(sellerPk),
      pushBytesOp(oracleSig),
      pushBytesOp(buyerPk),
      OP_3,
      pushBytesOp(preimage.redeemScript.bytecode)
    ]);
  };
};

export const ArbiReturnSignatory = (
  arbiPk: Uint8Array,
  sellerPk: Uint8Array,
  sellerSk: Uint8Array,
  oracleSig: Uint8Array
) => {
  return (ecc: Ecc, input: UnsignedTxInput): Script => {
    const preimage = input.sigHashPreimage(ALL_BIP143);
    const sighash = sha256d(preimage.bytes);
    const sellerSig = flagSignature(ecc.schnorrSign(sellerSk, sighash), ALL_BIP143);

    return Script.fromOps([
      pushBytesOp(sellerSig),
      pushBytesOp(sellerPk),
      pushBytesOp(oracleSig),
      pushBytesOp(arbiPk),
      OP_4,
      pushBytesOp(preimage.redeemScript.bytecode)
    ]);
  };
};

export const ModReleaseSignatory = (
  modPk: Uint8Array,
  buyerPk: Uint8Array,
  buyerSk: Uint8Array,
  oracleSig: Uint8Array
) => {
  return (ecc: Ecc, input: UnsignedTxInput): Script => {
    const preimage = input.sigHashPreimage(ALL_BIP143);
    const sighash = sha256d(preimage.bytes);
    const buyerSig = flagSignature(ecc.schnorrSign(buyerSk, sighash), ALL_BIP143);

    return Script.fromOps([
      pushBytesOp(buyerSig),
      pushBytesOp(buyerPk),
      pushBytesOp(oracleSig),
      pushBytesOp(modPk),
      OP_5,
      pushBytesOp(preimage.redeemScript.bytecode)
    ]);
  };
};

export const ModReturnSignatory = (
  modPk: Uint8Array,
  sellerPk: Uint8Array,
  sellerSk: Uint8Array,
  oracleSig: Uint8Array
) => {
  return (ecc: Ecc, input: UnsignedTxInput): Script => {
    const preimage = input.sigHashPreimage(ALL_BIP143);
    const sighash = sha256d(preimage.bytes);
    const sellerSig = flagSignature(ecc.schnorrSign(sellerSk, sighash), ALL_BIP143);

    return Script.fromOps([
      pushBytesOp(sellerSig),
      pushBytesOp(sellerPk),
      pushBytesOp(oracleSig),
      pushBytesOp(modPk),
      OP_6,
      pushBytesOp(preimage.redeemScript.bytecode)
    ]);
  };
};

export const ArbTakeFeeSignatory = (arbSk: Uint8Array, arbPk: Uint8Array) => {
  return (ecc: Ecc, input: UnsignedTxInput): Script => {
    const preimage = input.sigHashPreimage(ALL_BIP143);
    const sighash = sha256d(preimage.bytes);
    const arbSig = flagSignature(ecc.schnorrSign(arbSk, sighash), ALL_BIP143);

    return Script.fromOps([pushBytesOp(arbSig), pushBytesOp(arbPk), pushBytesOp(preimage.redeemScript.bytecode)]);
  };
};
