import {
  constructXECRatesFromFiatCurrencies,
  convertXECAndCurrency,
  formatAmountFor1MXEC,
  isConvertGoodsServices,
  showPriceInfo,
  transformFiatRates
} from '@/src/utils';
import { PAYMENT_METHOD, getTickerText } from '@bcpros/lixi-models';
import { OfferType, fiatCurrencyApi } from '@bcpros/redux-store';
import React from 'react';

const { useGetAllFiatRateQuery } = fiatCurrencyApi;

type UseOfferPriceOpts = {
  paymentInfo: any; // PostOffer-like object
  inputAmount?: number; // amount to feed into convertXECAndCurrency (default 1)
};

export default function useOfferPrice({ paymentInfo, inputAmount = 1 }: UseOfferPriceOpts) {
  // Get fiat rates from GraphQL API with cache reuse
  // We need rates for: Goods & Services, XEC offers (coinPayment null + localCurrency set), or crypto offers
  const needsFiatRates = React.useMemo(() => {
    const isGoodsServicesCheck = paymentInfo?.paymentMethods?.[0]?.paymentMethod?.id === PAYMENT_METHOD.GOODS_SERVICES;
    if (isGoodsServicesCheck) return true;
    // For XEC offers: coinPayment is null but localCurrency is set
    if (!paymentInfo?.coinPayment && paymentInfo?.localCurrency) return true;
    // For crypto offers: coinPayment is set
    return !!paymentInfo?.coinPayment;
  }, [paymentInfo]);

  const { data: fiatData } = useGetAllFiatRateQuery(undefined, {
    skip: !needsFiatRates,
    refetchOnMountOrArgChange: false,
    refetchOnFocus: false
  });

  const [rateData, setRateData] = React.useState<any>(null);
  const [amountPer1MXEC, setAmountPer1MXEC] = React.useState('');
  const [amountXECGoodsServices, setAmountXECGoodsServices] = React.useState(0);

  // Whether this offer uses the Goods & Services payment method.
  // We compute this from the PAYMENT_METHOD enum instead of using a magic number.
  const isGoodsServices = React.useMemo(
    () => paymentInfo?.paymentMethods?.[0]?.paymentMethod?.id === PAYMENT_METHOD.GOODS_SERVICES,
    [paymentInfo]
  );

  // Determine if this is a BUY offer (maker wants to buy XEC) or SELL offer (maker wants to sell XEC)
  const isBuyOffer = React.useMemo(() => paymentInfo?.type === OfferType.Buy, [paymentInfo]);

  // An "XEC offer" is when someone trades XEC for fiat currency.
  // In this case, coinPayment is null/undefined (XEC is the base currency) and localCurrency is set.
  const isXECOffer = React.useMemo(() => {
    const hasNoCoinPayment = !paymentInfo?.coinPayment || paymentInfo?.coinPayment?.toUpperCase() === 'XEC';
    const hasLocalCurrency = !!paymentInfo?.localCurrency;
    return hasNoCoinPayment && hasLocalCurrency && !isGoodsServices;
  }, [paymentInfo, isGoodsServices]);

  const coinCurrency = React.useMemo(() => {
    // For XEC offers, show price in local currency (VND, EUR, etc.)
    if (isXECOffer) {
      return paymentInfo?.localCurrency ?? 'USD';
    }
    return getTickerText(
      paymentInfo?.localCurrency,
      paymentInfo?.coinPayment,
      paymentInfo?.coinOthers,
      paymentInfo?.priceCoinOthers
    );
  }, [paymentInfo, isXECOffer]);

  const showPrice = React.useMemo(() => {
    const paymentId = paymentInfo?.paymentMethods?.[0]?.paymentMethod?.id ?? paymentInfo?.paymentMethod?.id;
    return showPriceInfo(
      paymentId,
      paymentInfo?.coinPayment,
      paymentInfo?.priceCoinOthers,
      paymentInfo?.priceGoodsServices,
      paymentInfo?.tickerPriceGoodsServices
    );
  }, [paymentInfo]);

  const isGoodsServicesConversion = React.useMemo(
    () => isConvertGoodsServices(paymentInfo?.priceGoodsServices, paymentInfo?.tickerPriceGoodsServices),
    [paymentInfo]
  );

  React.useEffect(() => {
    // For Goods & Services: Always use XEC fiat rates (XEC has rates to all fiats)
    // For XEC Offers: Use the local currency rates directly (no inversion needed)
    // For COIN_OTHERS: Use XEC currency entry (same as Goods & Services since price is in USD)
    // For other Crypto Offers: Use the selected fiat currency from localCurrency (user's choice)

    if (isGoodsServices) {
      // Goods & Services: Find XEC currency and transform its fiat rates
      const xecCurrency = fiatData?.getAllFiatRate?.find(item => item.currency === 'XEC');

      if (xecCurrency?.fiatRates) {
        const transformedRates = transformFiatRates(xecCurrency.fiatRates);
        setRateData(transformedRates);
      } else {
        // FALLBACK: If XEC entry is missing, construct it from fiat currencies
        const constructedRates = constructXECRatesFromFiatCurrencies(fiatData?.getAllFiatRate);
        if (constructedRates) {
          const transformedRates = transformFiatRates(constructedRates);
          setRateData(transformedRates);
        } else {
          setRateData(null);
        }
      }
    } else if (paymentInfo?.coinPayment?.toLowerCase() === 'others' && paymentInfo?.priceCoinOthers) {
      // COIN_OTHERS (custom crypto like EAT): priceCoinOthers is in USD
      // Use XEC currency entry to get USD→XEC conversion rate (same as Goods & Services)
      const xecCurrency = fiatData?.getAllFiatRate?.find(item => item.currency === 'XEC');

      if (xecCurrency?.fiatRates) {
        const transformedRates = transformFiatRates(xecCurrency.fiatRates);
        setRateData(transformedRates);
      } else {
        // FALLBACK: If XEC entry is missing, construct it from fiat currencies
        const constructedRates = constructXECRatesFromFiatCurrencies(fiatData?.getAllFiatRate);
        if (constructedRates) {
          const transformedRates = transformFiatRates(constructedRates);
          setRateData(transformedRates);
        } else {
          setRateData(null);
        }
      }
    } else if (isXECOffer) {
      // XEC Offers: Use the local currency data directly WITHOUT transformation
      // API returns: { coin: 'xec', rate: 0.3 } meaning "1 XEC = 0.3 VND"
      // So for 1M XEC: 0.3 * 1,000,000 = 300,000 VND
      // We do NOT invert because the rate is already "XEC -> local currency"
      const currency = (paymentInfo?.localCurrency ?? 'USD').toUpperCase();
      const currencyData = fiatData?.getAllFiatRate?.find(item => item.currency?.toUpperCase() === currency);

      if (currencyData?.fiatRates) {
        // Find XEC rate directly - DO NOT transform/invert
        const xecRateEntry = currencyData.fiatRates.find(r => r.coin?.toLowerCase() === 'xec');

        if (xecRateEntry && xecRateEntry.rate > 0) {
          // Store just the XEC rate entry for calculation (no inversion needed)
          setRateData([{ ...xecRateEntry, isRawRate: true }]);
        } else {
          setRateData(null);
        }
      } else {
        setRateData(null);
      }
    } else {
      // Other Crypto Offers: transform rates as before
      const currency = (paymentInfo?.localCurrency ?? 'USD').toUpperCase();
      const currencyData = fiatData?.getAllFiatRate?.find(item => item.currency?.toUpperCase() === currency);

      if (currencyData?.fiatRates) {
        const transformedRates = transformFiatRates(currencyData.fiatRates);
        setRateData(transformedRates);
      } else {
        setRateData(null);
      }
    }
  }, [
    paymentInfo?.localCurrency,
    paymentInfo?.coinPayment,
    paymentInfo?.priceCoinOthers,
    fiatData,
    isGoodsServices,
    isXECOffer
  ]);

  React.useEffect(() => {
    if (!rateData) {
      return;
    }

    // Special handling for XEC offers to show Fiat price
    if (isXECOffer) {
      // For XEC offers, we stored the raw (non-inverted) XEC rate
      // API returns: { coin: 'xec', rate: 0.3 } meaning "1 XEC = 0.3 VND"
      // So for 1M XEC: 0.3 * 1,000,000 = 300,000 VND

      const xecRateEntry = rateData.find(item => item.coin?.toLowerCase() === 'xec');

      if (xecRateEntry && xecRateEntry.rate && xecRateEntry.rate > 0) {
        // Rate is already "1 XEC = X local currency" - just multiply by 1M
        const priceOf1XECInLocalCurrency = xecRateEntry.rate;
        const priceOf1MXECInLocalCurrency = priceOf1XECInLocalCurrency * 1000000;

        // Round to 2 decimal places for XEC display
        const roundedXEC = Math.round(1 * 100) / 100;
        setAmountXECGoodsServices(roundedXEC);
        setAmountPer1MXEC(
          formatAmountFor1MXEC(priceOf1MXECInLocalCurrency, paymentInfo?.marginPercentage, coinCurrency, isBuyOffer)
        );
        return;
      }
    }

    // For all other cases (Goods & Services, COIN_OTHERS, and regular crypto offers):
    // Use the standard convertXECAndCurrency function
    const { amountXEC, amountCoinOrCurrency } = convertXECAndCurrency({
      rateData: rateData,
      paymentInfo: paymentInfo,
      inputAmount: inputAmount
    });

    // For Goods & Services:
    // - If priceGoodsServices is set and tickerPriceGoodsServices is not XEC: use converted amountXEC
    // - Otherwise (legacy offers or XEC-priced): use priceGoodsServices or default to 1 XEC
    const displayPrice = isGoodsServicesConversion
      ? amountXEC
      : paymentInfo?.priceGoodsServices && paymentInfo?.priceGoodsServices > 0
        ? paymentInfo.priceGoodsServices
        : 1; // Default to 1 XEC for legacy offers without price

    // Round XEC to maximum 2 decimal places
    const roundedPrice = Math.round(displayPrice * 100) / 100;

    setAmountXECGoodsServices(roundedPrice);
    setAmountPer1MXEC(
      formatAmountFor1MXEC(amountCoinOrCurrency, paymentInfo?.marginPercentage, coinCurrency, isBuyOffer)
    );
  }, [rateData, paymentInfo, inputAmount, isGoodsServicesConversion, coinCurrency, isXECOffer, isBuyOffer]);

  return {
    showPrice,
    coinCurrency,
    amountPer1MXEC,
    amountXECGoodsServices,
    isGoodsServices
  };
}
