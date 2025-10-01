import React from 'react';
import { fiatCurrencyApi } from '@bcpros/redux-store';
import { getTickerText, PAYMENT_METHOD } from '@bcpros/lixi-models';
import { convertXECAndCurrency, formatAmountFor1MXEC, isConvertGoodsServices, showPriceInfo } from '@/src/utils';

type UseOfferPriceOpts = {
  paymentInfo: any; // PostOffer-like object
  inputAmount?: number; // amount to feed into convertXECAndCurrency (default 1)
};

export default function useOfferPrice({ paymentInfo, inputAmount = 1 }: UseOfferPriceOpts) {
  const { useGetAllFiatRateQuery } = fiatCurrencyApi;
  const { data: fiatData } = useGetAllFiatRateQuery();

  const [rateData, setRateData] = React.useState<any>(null);
  const [amountPer1MXEC, setAmountPer1MXEC] = React.useState('');
  const [amountXECGoodsServices, setAmountXECGoodsServices] = React.useState(0);

  const coinCurrency = React.useMemo(() => {
    return getTickerText(
      paymentInfo?.localCurrency,
      paymentInfo?.coinPayment,
      paymentInfo?.coinOthers,
      paymentInfo?.priceCoinOthers
    );
  }, [paymentInfo]);

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

  const isGoodsServicesConversion = React.useMemo(() =>
    isConvertGoodsServices(paymentInfo?.priceGoodsServices, paymentInfo?.tickerPriceGoodsServices),
    [paymentInfo]
  );

  // Whether this offer uses the Goods & Services payment method.
  // We compute this from the PAYMENT_METHOD enum instead of using a magic number.
  const isGoodsServices = React.useMemo(
    () => paymentInfo?.paymentMethods?.[0]?.paymentMethod?.id === PAYMENT_METHOD.GOODS_SERVICES,
    [paymentInfo]
  );

  React.useEffect(() => {
    const rate = fiatData?.getAllFiatRate?.find(item => item.currency === (paymentInfo?.localCurrency ?? 'USD'));
    setRateData(rate?.fiatRates);
  }, [paymentInfo?.localCurrency, fiatData]);

  React.useEffect(() => {
    if (!rateData) return;
    const { amountXEC, amountCoinOrCurrency } = convertXECAndCurrency({
      rateData: rateData,
      paymentInfo: paymentInfo,
      inputAmount: inputAmount
    });

    setAmountXECGoodsServices(isGoodsServicesConversion ? amountXEC : paymentInfo?.priceGoodsServices);
    setAmountPer1MXEC(formatAmountFor1MXEC(amountCoinOrCurrency, paymentInfo?.marginPercentage, coinCurrency));
  }, [rateData, paymentInfo, inputAmount, isGoodsServicesConversion, coinCurrency]);

  return {
    showPrice,
    coinCurrency,
    amountPer1MXEC,
    amountXECGoodsServices,
    isGoodsServices
  };
}
