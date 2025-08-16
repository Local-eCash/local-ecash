import { COIN, coinInfo, PAYMENT_METHOD } from '@bcpros/lixi-models';
import { cashMethodsNode, OfferFilterInput } from '@bcpros/redux-store';
import { Script, Tx } from 'ecash-lib';
import * as _ from 'lodash';
import { COIN_OTHERS, COIN_USD_STABLECOIN_TICKER } from './constants';

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

export function showPriceInfo(paymentId: number, coinPayment: string | null, priceCoinOthers: number | null) {
  // Case 1: If payment method is GOODS_SERVICES, don't show
  if (paymentId === PAYMENT_METHOD.GOODS_SERVICES) {
    return false;
  }

  // Case 2: If it's COIN_OTHERS with no price or zero price, don't show
  if (coinPayment === COIN_OTHERS && (!priceCoinOthers || priceCoinOthers === 0)) {
    return false;
  }

  // In all other cases, show the price info
  return true;
}

/**
 * Converts between XEC and other currencies/coins
 * @param {Object} params - Conversion parameters
 * @param {Array} params.rateData - Array containing rate data for different coins
 * @param {Object} params.paymentInfo - Object containing payment details (coinPayment, priceCoinOthers, etc.)
 * @param {number} params.inputAmount - The amount to convert from
 * @returns {Object} Object containing amountXEC and amountCoinOrCurrency
 */
export const convertXECAndCurrency = ({ rateData, paymentInfo, inputAmount }) => {
  if (!rateData || !paymentInfo) return { amountXEC: 0, amountCoinOrCurrency: 0 };

  const CONST_AMOUNT_XEC = 1000000; // 1M XEC
  const coinPayment = paymentInfo?.coinPayment;
  let amountXEC = 0;
  let amountCoinOrCurrency = 0;

  // Find XEC rate data
  const rateArrayXec = rateData.find(item => item.coin === 'xec');
  const latestRateXec = rateArrayXec?.rate;

  if (!latestRateXec) return { amountXEC: 0, amountCoinOrCurrency: 0 };

  // If payment is cryptocurrency (not USD stablecoin)
  if (coinPayment && coinPayment !== COIN_USD_STABLECOIN_TICKER) {
    let coinRate; // Will hold the exchange rate for the target coin

    if (coinPayment === COIN_OTHERS && paymentInfo?.priceCoinOthers) {
      // Convert for custom coin with manual price
      coinRate = 1 / paymentInfo.priceCoinOthers;
    } else {
      // Convert for standard coin with rate data
      const coinName = coinPayment.toLowerCase();
      const rateArrayCoin = rateData?.find(item => item.coin === coinName);
      coinRate = rateArrayCoin?.rate;

      if (!coinRate) return { amountXEC: 0, amountCoinOrCurrency: 0 };
    }

    // Calculate XEC amount
    const rateCoinPerXec = coinRate / latestRateXec;
    amountXEC = inputAmount * rateCoinPerXec;

    // Calculate coin amount for 1M XEC
    amountCoinOrCurrency = (latestRateXec * CONST_AMOUNT_XEC) / coinRate;
  } else {
    // Convert between XEC and fiat currency
    amountXEC = inputAmount / latestRateXec; // amount currency to XEC
    amountCoinOrCurrency = CONST_AMOUNT_XEC * latestRateXec; // amount curreny from 1M XEC
  }

  return { amountXEC, amountCoinOrCurrency };
};

export function formatAmountFor1MXEC(amount, marginPercentage = 0, coinCurrency = '') {
  if (amount === undefined || amount === null) return '';

  // Apply margin percentage
  const amountWithMargin = amount * (1 + marginPercentage / 100);

  // Format the number according to rules
  let formattedAmount;
  if (amountWithMargin < 1) {
    formattedAmount = amountWithMargin.toFixed(5);
  } else {
    const formatter = new Intl.NumberFormat('en-GB', {
      notation: 'compact',
      compactDisplay: 'short',
      maximumFractionDigits: 2
    });
    formattedAmount = formatter.format(amountWithMargin);
  }

  // Return the full formatted text
  return `${formattedAmount} ${coinCurrency} / 1M XEC`;
}

export function hexToUint8Array(hexString) {
  if (!hexString) throw Error('Must have string');
  return Buffer.from(hexString ?? '', 'hex') as unknown as Uint8Array;
}

export const hexDecode = hexStr => Buffer.from(hexStr, 'hex').toString();
export const hexEncode = data => Buffer.from(data).toString('hex');
