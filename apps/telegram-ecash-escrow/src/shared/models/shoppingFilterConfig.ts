export interface ShoppingFilterConfig {
  coin?: string | null;
  coinOthers?: string | null;
  tickerPriceGoodsServices?: string | null;
  fiatCurrency?: string | null;
  amount?: number | string | null; // Often a formatted string in input, but converted to number in handlers
}
