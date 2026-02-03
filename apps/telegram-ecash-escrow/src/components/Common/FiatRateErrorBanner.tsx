import { Box, Typography } from '@mui/material';
import { useMemo } from 'react';

interface FiatRateErrorBannerProps {
  fiatData: any;
  fiatRateError: boolean;
  isLoading: boolean;
  /**
   * If true, only show banner for Goods & Services conversion offers
   * If false/undefined, show banner for all cases where fiat rates are needed
   */
  goodsServicesOnly?: boolean;
  /**
   * Ticker for Goods & Services offers (e.g., 'USD', 'EUR')
   * Only used when goodsServicesOnly is true
   */
  tickerPriceGoodsServices?: string;
  /**
   * Variant of the banner: 'warning' (yellow) or 'error' (red)
   * Default: 'warning'
   */
  variant?: 'warning' | 'error';
}

/**
 * Reusable error banner component for displaying fiat rate service errors.
 * Shows a warning when:
 * 1. The fiat rate API returns an error
 * 2. The API returns no data
 * 3. The API returns data but all major currency rates are zero (invalid data)
 */
export default function FiatRateErrorBanner({
  fiatData,
  fiatRateError,
  isLoading,
  goodsServicesOnly = false,
  tickerPriceGoodsServices,
  variant = 'warning'
}: FiatRateErrorBannerProps) {
  const showErrorBanner = useMemo(() => {
    // Don't show banner while loading
    if (isLoading) return false;

    // If goodsServicesOnly is true, don't show banner for non-G&S offers
    if (goodsServicesOnly && !tickerPriceGoodsServices) return false;

    // Don't show banner for XEC-priced offers (no conversion needed)
    if (tickerPriceGoodsServices?.toUpperCase() === 'XEC') return false;

    // Check for no data
    const hasNoData = fiatRateError || !fiatData?.getAllFiatRate || fiatData?.getAllFiatRate?.length === 0;
    if (hasNoData) return true;

    // Check if all rates are zero (invalid data)
    // Try to find XEC currency first
    let xecCurrency = fiatData?.getAllFiatRate?.find((item: any) => item.currency === 'XEC');

    // FALLBACK: If XEC entry is missing, try to construct rates from fiat currencies
    if (!xecCurrency?.fiatRates) {
      // Check if we can construct XEC rates from fiat currencies
      const hasValidFiatData = fiatData?.getAllFiatRate?.some((item: any) => {
        if (!item?.currency || !item?.fiatRates) return false;
        const xecRate = item.fiatRates.find((rate: any) => rate.coin?.toUpperCase() === 'XEC');
        return xecRate && xecRate.rate && xecRate.rate > 0;
      });

      // If we can't construct rates from any fiat currency, show error
      if (!hasValidFiatData) return true;

      // If we can construct rates, don't show error
      return false;
    }

    if (xecCurrency?.fiatRates && xecCurrency.fiatRates.length > 0) {
      const majorCurrencies = ['USD', 'EUR', 'GBP'];
      const majorRates = xecCurrency.fiatRates.filter((r: any) => majorCurrencies.includes(r.coin?.toUpperCase()));

      if (majorRates.length > 0) {
        return majorRates.every((r: any) => r.rate === 0);
      }
    }

    return false;
  }, [fiatRateError, fiatData?.getAllFiatRate, isLoading, goodsServicesOnly, tickerPriceGoodsServices]);

  if (!showErrorBanner) return null;

  // Determine colors based on variant
  const colors =
    variant === 'error'
      ? {
          backgroundColor: '#d32f2f',
          color: '#ffffff',
          border: '1px solid #b71c1c'
        }
      : {
          backgroundColor: '#fff3cd',
          color: '#856404',
          border: '1px solid #ffeaa7'
        };

  return (
    <Box
      sx={{
        ...colors,
        padding: 2,
        borderRadius: 1,
        marginBottom: 2
      }}
    >
      <Typography variant="body2" sx={{ fontWeight: 'bold', marginBottom: 0.5 }}>
        ⚠️ {variant === 'error' ? 'Fiat Service Unavailable' : 'Currency Conversion Service Unavailable'}
      </Typography>
      <Typography variant="body2">
        {goodsServicesOnly && tickerPriceGoodsServices ? (
          <>
            Cannot calculate XEC amount for {tickerPriceGoodsServices}-priced offers. The currency conversion service is
            temporarily unavailable. Please try again later or contact support.
          </>
        ) : (
          <>
            Some prices may not display correctly. The currency conversion service is temporarily unavailable. Please
            try again later.
          </>
        )}
      </Typography>
    </Box>
  );
}
