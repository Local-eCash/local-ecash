import { COIN, coinInfo } from '@bcpros/lixi-models';
import { OfferFilterInput, cashMethodsNode } from '@bcpros/redux-store';
import { Script, Tx } from 'ecash-lib';
import * as _ from 'lodash';
import { COIN_OTHERS } from './constants';

export function serializeTransaction(tx: Tx): string {
  return JSON.stringify(tx, (key, value) => {
    if (typeof value === 'bigint') {
      return value.toString(); // Convert BigInt to string
    }
    if (value instanceof Uint8Array) {
      return Buffer.from(value).toString('hex'); // Convert Uint8Array to string  because json.stringify not support uint8Array
    }
    return value;
  });
}

export function deserializeTransaction(str: string): Tx {
  return JSON.parse(str, (key, value) => {
    if (typeof value === 'string' && /^\d+n?$/.test(value)) {
      return BigInt(value); // Convert string back to BigInt
    }
    if (typeof value === 'string' && /^[A-Fa-f0-9]+$/.test(value) && key.toLocaleLowerCase().includes('bytecode')) {
      // Assuming hex string for Uint8Array data
      return Uint8Array.from(Buffer.from(value, 'hex')); // Convert hex string back to Uint8Array
    }
    return value;
  });
}

export const estimatedFee = (escrowScriptData: string | Uint8Array) => {
  const { calcFeeEscrow } = cashMethodsNode;
  let scriptByte = escrowScriptData;
  if (typeof escrowScriptData === 'string') {
    const script = Buffer.from(escrowScriptData, 'hex') as unknown as Uint8Array;
    scriptByte = new Script(script).bytecode;
  }
  const feeInSatoshi = calcFeeEscrow(
    1, // just use 1 input p2sh
    2, // always 2 for worst case scenerio
    coinInfo[COIN.XEC].defaultFee,
    undefined,
    scriptByte.length
  );
  const estimatedFee = feeInSatoshi / Math.pow(10, coinInfo[COIN.XEC].cashDecimals);
  return estimatedFee;
};

export const convertXECToSatoshi = (amount: number) => {
  return parseInt((amount * Math.pow(10, coinInfo[COIN.XEC].cashDecimals)).toFixed(0));
};

export const formatNumber = (number: number) => {
  if (!number) return '0';

  return number.toLocaleString('en-US');
};

export const isShowAmountOrSortFilter = (offerFilterConfig: OfferFilterInput) => {
  return offerFilterConfig?.fiatCurrency || (offerFilterConfig?.coin && offerFilterConfig.coin !== COIN_OTHERS);
};

export const capitalizeStr = (str: string) => {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

export const getNumberFromFormatNumber = (value: string) => {
  if (!value) return 0;
  return parseFloat(value.replace(/,/g, ''));
};

export const getOrderLimitText = (min: number | null, max: number | null, ticket: string) => {
  if (!_.isNil(min) || !_.isNil(max)) {
    return ` ${formatNumber(min)} ${ticket} - ${formatNumber(max)} ${ticket}`;
  }
  return 'No limit';
};
