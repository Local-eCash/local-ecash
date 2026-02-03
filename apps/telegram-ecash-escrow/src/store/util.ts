import { COIN, coinInfo, GOODS_SERVICES_UNIT, PAYMENT_METHOD } from '@bcpros/lixi-models';
import { cashMethodsNode, OfferFilterInput } from '@bcpros/redux-store';
import { Script, Tx } from 'ecash-lib';
import * as _ from 'lodash';
import { COIN_OTHERS, COIN_USD_STABLECOIN_TICKER, DEFAULT_TICKER_GOODS_SERVICES } from './constants';

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
  return !!offerFilterConfig?.fiatCurrency || (offerFilterConfig?.coin && offerFilterConfig.coin !== COIN_OTHERS);
};

export const capitalizeStr = (str: string) => {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

export const getNumberFromFormatNumber = (value: string) => {
  if (!value) return 0;
  if (typeof value === 'number') {
    return value;
  }
  if (value?.includes(',')) {
    return parseFloat(value.replace(/,/g, ''));
  } else {
    return parseFloat(value);
  }
};

export const getOrderLimitText = (min: number | null, max: number | null, ticket: string) => {
  if (!_.isNil(min) || !_.isNil(max)) {
    return ` ${formatNumber(min)} ${ticket} - ${formatNumber(max)} ${ticket}`;
  }
  return 'No limit';
};

export function showPriceInfo(
  paymentId: number,
  coinPayment: string | null,
  priceCoinOthers: number | null,
  priceGoodsServices: number | null,
  tickerPriceGoodsServices: string | null
) {
  // Case 1: If payment method is GOODS_SERVICES, ticker is XEC, don't show
  if (
    paymentId === PAYMENT_METHOD.GOODS_SERVICES &&
    !isConvertGoodsServices(priceGoodsServices, tickerPriceGoodsServices)
  ) {
    return false;
  }

  // Case 2: If it's COIN_OTHERS with no price or zero price, don't show
  // Note: Compare case-insensitively for robustness
  if (coinPayment?.toUpperCase() === COIN_OTHERS.toUpperCase() && (!priceCoinOthers || priceCoinOthers === 0)) {
    return false;
  }

  // In all other cases, show the price info
  return true;
}

export function isConvertGoodsServices(priceGoodsServices: number | null, tickerPriceGoodsServices: string | null) {
  return (
    tickerPriceGoodsServices !== DEFAULT_TICKER_GOODS_SERVICES && priceGoodsServices !== null && priceGoodsServices > 0
  );
}

export interface GetCoinRateOptions {
  isGoodsServicesConversion: boolean;
  coinPayment: string;
  priceGoodsServices: number | null;
  priceCoinOthers: number | null;
  tickerPriceGoodsServices: string | null;
  rateData: Array<{ coin?: string; rate?: number }>;
}

export const getCoinRate = ({
  isGoodsServicesConversion,
  coinPayment,
  priceGoodsServices,
  priceCoinOthers,
  tickerPriceGoodsServices,
  rateData
}: GetCoinRateOptions): any | null => {
  // For Goods & Services: priceGoodsServices is the PRICE (e.g., 1 USD)
  // We need to find the USD (or tickerPriceGoodsServices) rate from rateData
  if (isGoodsServicesConversion && tickerPriceGoodsServices) {
    // Find the rate for the ticker currency (e.g., USD rate)
    const tickerPriceGoodsServicesUpper = tickerPriceGoodsServices.toUpperCase();
    const tickerRate = rateData.find(
      (item: { coin?: string; rate?: number }) => item.coin?.toUpperCase() === tickerPriceGoodsServicesUpper
    )?.rate;
    if (tickerRate && priceGoodsServices && priceGoodsServices > 0) {
      // Return the fiat currency rate multiplied by the price
      // E.g., if 1 USD = 68027 XEC and item costs 1 USD, return 68027
      return tickerRate * priceGoodsServices;
    }
  }

  // COIN_OTHERS: priceCoinOthers is the price per token in USD (e.g., 1 USD per EAT)
  // We need to convert this USD price to XEC using the USD rate
  // Note: coinPayment might be uppercased, so compare case-insensitively
  if (coinPayment?.toUpperCase() === COIN_OTHERS.toUpperCase() && priceCoinOthers && priceCoinOthers > 0) {
    // Find the USD rate to convert priceCoinOthers (which is in USD) to XEC
    const usdRate = rateData.find((item: { coin?: string; rate?: number }) => item.coin?.toUpperCase() === 'USD')?.rate;
    if (usdRate) {
      // priceCoinOthers = 1 USD per EAT, usdRate = 68027 XEC per USD
      // Return: 1 * 68027 = 68027 XEC per EAT
      return usdRate * priceCoinOthers;
    }
    // If no USD rate is found, return undefined so callers can handle the missing rate safely
    return undefined;
  }

  // Case-insensitive comparison to handle both uppercase and lowercase coin codes
  if (!coinPayment) return undefined;
  return rateData.find(item => item.coin?.toLowerCase() === coinPayment.toLowerCase())?.rate;
};

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

  const { coinPayment, priceGoodsServices, tickerPriceGoodsServices, priceCoinOthers, localCurrency } = paymentInfo;

  const CONST_AMOUNT_XEC = 1000000; // 1M XEC
  let amountXEC = 0;
  let amountCoinOrCurrency = 0;
  const isGoodsServicesConversion = isConvertGoodsServices(priceGoodsServices, tickerPriceGoodsServices);

  // Find XEC rate data (case-insensitive to handle both 'XEC' and 'xec')
  const rateArrayXec = rateData.find(item => item.coin?.toLowerCase() === 'xec');
  const latestRateXec = rateArrayXec?.rate;

  if (!latestRateXec) return { amountXEC: 0, amountCoinOrCurrency: 0 };

  // For P2P offers, null/undefined coinPayment means XEC (default)
  const effectiveCoinPayment = coinPayment?.toUpperCase() || 'XEC';

  // Determine if we need fiat conversion based on the display currency
  // For XEC P2P offers with fiat localCurrency, user enters fiat amount
  const isXecPaymentWithFiatDisplay =
    effectiveCoinPayment === 'XEC' && localCurrency && localCurrency.toUpperCase() !== 'XEC';

  // If payment is cryptocurrency (not USD stablecoin) AND not XEC with fiat display
  if (
    (isGoodsServicesConversion || (effectiveCoinPayment && effectiveCoinPayment !== COIN_USD_STABLECOIN_TICKER)) &&
    !isXecPaymentWithFiatDisplay
  ) {
    const coinRate = getCoinRate({
      isGoodsServicesConversion,
      coinPayment: effectiveCoinPayment,
      priceGoodsServices,
      priceCoinOthers,
      tickerPriceGoodsServices,
      rateData
    });
    if (!coinRate) return { amountXEC: 0, amountCoinOrCurrency: 0 };

    // Calculate XEC amount
    const rateCoinPerXec = coinRate / latestRateXec;
    amountXEC = inputAmount * rateCoinPerXec;

    // Calculate coin amount for 1M XEC
    amountCoinOrCurrency = (latestRateXec * CONST_AMOUNT_XEC) / coinRate;
  } else {
    // Convert between XEC and fiat currency
    // For XEC P2P with fiat display: use localCurrency rate for conversion
    if (isXecPaymentWithFiatDisplay) {
      const localCurrencyRate = rateData.find(item => item.coin?.toUpperCase() === localCurrency.toUpperCase())?.rate;
      if (localCurrencyRate && localCurrencyRate > 0) {
        amountXEC = inputAmount * localCurrencyRate; // amount fiat to XEC
        amountCoinOrCurrency = CONST_AMOUNT_XEC / localCurrencyRate; // amount fiat from 1M XEC
      } else {
        // Fallback to generic conversion
        amountXEC = inputAmount / latestRateXec;
        amountCoinOrCurrency = CONST_AMOUNT_XEC * latestRateXec;
      }
    } else {
      amountXEC = inputAmount / latestRateXec; // amount currency to XEC
      amountCoinOrCurrency = CONST_AMOUNT_XEC * latestRateXec; // amount currency from 1M XEC
    }
  }

  return { amountXEC, amountCoinOrCurrency };
};

export function formatAmountFor1MXEC(amount, marginPercentage = 0, coinCurrency = '', isBuyOffer = true) {
  if (amount === undefined || amount === null) return '';

  // Apply margin percentage based on offer type
  // For BUY offers (maker buys XEC): Positive margin = maker pays MORE per XEC = price per 1M XEC is LOWER (taker receives less)
  //   Formula: amount / (1 + margin/100)
  // For SELL offers (maker sells XEC): Positive margin = maker wants MORE per XEC = price per 1M XEC is HIGHER
  //   Formula: amount * (1 + margin/100)
  let amountWithMargin;
  if (isBuyOffer) {
    // BUY offer: Higher margin = lower price display (taker gets less per XEC they sell)
    // Guard against divide-by-zero when marginPercentage === -100
    const divisor = 1 + marginPercentage / 100;
    amountWithMargin = divisor !== 0 ? amount / divisor : amount;
  } else {
    // SELL offer: Higher margin = higher price display (taker pays more per XEC they buy)
    amountWithMargin = amount * (1 + marginPercentage / 100);
  }

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

export function formatAmountForGoodsServices(amount) {
  return `${formatNumber(amount)} XEC / ${GOODS_SERVICES_UNIT}`;
}

/**
 * Transforms fiat rate data from backend format to frontend format.
 *
 * Backend returns: {coin: 'USD', rate: 0.0000147} meaning "1 XEC = 0.0000147 USD"
 * Frontend needs: {coin: 'USD', rate: 68027.21} meaning "1 USD = 68027.21 XEC"
 *
 * This function:
 * 1. Filters out zero/invalid rates
 * 2. Inverts all rates (rate = 1 / originalRate)
 * 3. Adds XEC entries with rate 1 for self-conversion
 *
 * @param fiatRates - Array of fiat rates from backend API
 * @returns Transformed rate array ready for conversion calculations, or null if input is invalid
 */
export function transformFiatRates(fiatRates: any[]): any[] | null {
  if (!fiatRates || fiatRates.length === 0) {
    return null;
  }

  const transformedRates = fiatRates
    .filter(item => item.rate && item.rate > 0) // Filter out zero/invalid rates
    .map(item => ({
      coin: item.coin, // Keep coin as-is (e.g., 'USD', 'EUR')
      rate: 1 / item.rate, // INVERT: If 1 XEC = 0.0000147 USD, then 1 USD = 68027 XEC
      ts: item.ts
    }));

  // Add XEC itself with rate 1 (1 XEC = 1 XEC)
  transformedRates.push({ coin: 'xec', rate: 1, ts: Date.now() });
  transformedRates.push({ coin: 'XEC', rate: 1, ts: Date.now() });

  return transformedRates;
}

/**
 * Constructs XEC fiat rates from fiat currency entries when XEC entry is missing from API.
 *
 * API may return: [
 *   { currency: 'USD', fiatRates: [{ coin: 'XEC', rate: 0.0000147 }] },
 *   { currency: 'EUR', fiatRates: [{ coin: 'XEC', rate: 0.0000135 }] }
 * ]
 *
 * But we need: { currency: 'XEC', fiatRates: [{ coin: 'USD', rate: 0.0000147 }, { coin: 'EUR', rate: 0.0000135 }] }
 *
 * This function constructs the XEC entry by collecting XEC rates from all fiat currencies.
 *
 * @param getAllFiatRate - The full getAllFiatRate array from the API
 * @returns Constructed fiat rates for XEC currency, or null if no valid data found
 */
export function constructXECRatesFromFiatCurrencies(getAllFiatRate: any[]): any[] | null {
  if (!getAllFiatRate || getAllFiatRate.length === 0) {
    return null;
  }

  const xecRates: any[] = [];

  // Iterate through each fiat currency entry
  for (const currencyEntry of getAllFiatRate) {
    if (!currencyEntry?.currency || !currencyEntry?.fiatRates) continue;

    // Find the XEC rate in this fiat currency's rates
    const xecRate = currencyEntry.fiatRates.find((rate: any) => rate.coin?.toUpperCase() === 'XEC');

    if (xecRate && xecRate.rate && xecRate.rate > 0) {
      // Add this fiat currency with its XEC rate
      xecRates.push({
        coin: currencyEntry.currency,
        rate: xecRate.rate,
        ts: xecRate.ts || Date.now()
      });
    }
  }

  // Return null if we couldn't find any valid XEC rates
  if (xecRates.length === 0) {
    return null;
  }

  return xecRates;
}

export function hexToUint8Array(hexString) {
  if (!hexString) throw Error('Must have string');
  return Buffer.from(hexString ?? '', 'hex') as unknown as Uint8Array;
}

export const hexDecode = hexStr => Buffer.from(hexStr, 'hex').toString();
export const hexEncode = data => Buffer.from(data).toString('hex');

// --- URL helpers (shared) --------------------------------------------------
// Keep pure JS/TS helpers here (no JSX) so other non-React code can reuse them.

const IMAGE_EXT_REGEX = /\.(png|jpe?g|gif|bmp|webp)(?:[?#].*)?$/i;
const DANGEROUS_SCHEMES = /^(javascript|data|vbscript|file|blob):/i;

export function sanitizeUrl(raw?: string): string | null {
  if (!raw || typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (DANGEROUS_SCHEMES.test(trimmed)) return null;
  try {
    const u = new URL(trimmed);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
    // Reconstruct URL from URL object parts to avoid double-encoding. Use hostname + port + pathname + search + hash.
    return `${u.protocol}//${u.hostname}${u.port ? ':' + u.port : ''}${u.pathname}${u.search}${u.hash}`;
  } catch (e) {
    return null;
  }
}

export const parseSafeHttpUrl = (urlStr: string): URL | null => {
  if (!urlStr || typeof urlStr !== 'string') return null;
  const trimmed = urlStr.trim();
  if (trimmed.toLowerCase().startsWith('data:')) return null;
  try {
    const u = new URL(trimmed);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
    return u;
  } catch {
    return null;
  }
};

export const isSafeImageUrl = (url: URL): boolean => {
  if (!url) return false;
  if (/\.svg(?:[?#].*)?$/i.test(url.pathname)) return false;
  // Only check the pathname for image file extensions. Query string or hash should not be considered.
  return IMAGE_EXT_REGEX.test(url.pathname);
};
