// Re-exports of shared utilities.
// Historically this project kept store-related pure helpers in `src/store/util.ts`
// and UI helpers in `src/utils/*`. To make it easier to import shared helpers
// from a consistent location, re-export the commonly used pure functions here.
// This is a low-risk first step toward consolidating utility APIs without
// changing existing implementations or breaking imports.

export {
  convertXECAndCurrency,
  formatAmountFor1MXEC,
  formatAmountForGoodsServices,
  showPriceInfo,
  isConvertGoodsServices,
  parseSafeHttpUrl,
  isSafeImageUrl,
  sanitizeUrl
} from '@/src/store/util';

// Consumers can import from '@/src/utils' going forward. Example:
// import { formatAmountFor1MXEC } from '@/src/utils';
