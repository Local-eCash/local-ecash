# Fiat Service Error Detection & Alert System

## Current Status (October 12, 2025)

### Issue Discovered

The development fiat rate API at `https://aws-dev.abcpay.cash/bws/api/v3/fiatrates/` is returning all rates as `0`, making Goods & Services orders impossible to place.

### Production API Status

- **URL**: `https://aws.abcpay.cash/bws/api/v3/fiatrates/`
- **Status**: ✅ Working correctly with real rate data
- **CORS**: ✅ Enabled (`Access-Control-Allow-Origin: *`)
- **Caching**: ✅ 5-minute cache (`max-age=300`)
- **Structure**: Same as dev, but with actual rate values

### API Structure Comparison

**Both APIs return the same structure:**

```json
{
  "xec": [
    { "ts": 1760242081173, "rate": 0.000052738, "code": "USD", "name": "United States Dollar" },
    { "ts": 1760242081173, "rate": 0.000947552, "code": "EUR", "name": "Euro" }
  ],
  "btc": [...],
  "eth": [...]
}
```

**The Issue:**

- **Production**: `rate: 0.000052738` (real value) ✅
- **Development**: `rate: 0` (all currencies) ❌

## Error Detection System

### 1. Frontend Detection (PlaceAnOrderModal.tsx)

The system now detects **two types of errors**:

#### A. No Data

- API returns null/undefined
- API returns empty array
- RTK Query reports error

#### B. Invalid Data (NEW)

- API returns data but all major currency rates (USD, EUR, GBP) are `0`
- Indicates backend service failure

### 2. Error Display

**Error Banner:**

- Shows at top of PlaceAnOrderModal
- High contrast red background (#d32f2f)
- White text for visibility
- **Generic user-friendly message**: "The currency conversion service is temporarily unavailable. Please try again later or contact support."
- Does NOT expose technical details to end users

**Example:**

```
┌─────────────────────────────────────────────────────────┐
│ ⚠️ Fiat Service Unavailable                            │
│                                                         │
│ Cannot calculate XEC amount for USD-priced offers.     │
│ The currency conversion service is temporarily         │
│ unavailable. Please try again later or contact         │
│ support.                                                │
└─────────────────────────────────────────────────────────┘
```

**Design Philosophy:**

- Users see simple, actionable message
- Technical details are logged to console (for developers)
- Comprehensive diagnostics sent to Telegram (for backend team)

### 3. Telegram Alert System

**When triggered:**

- Sends alert to Telegram group: `-1003006766820`
- Bot: `@p2p_dex_bot`
- Only for Goods & Services offers (`isGoodsServicesConversion === true`)

**Alert Content (Enhanced with Technical Details):**

```json
{
  "service": "Fiat Currency Service",
  "message": "getAllFiatRate API returning zero rates - fiat conversion data invalid",
  "details": {
    // Error Classification
    "errorType": "INVALID_DATA_ZERO_RATES",
    "errorCode": "FIAT_001",
    "severity": "CRITICAL",

    // API Response Details
    "apiResponse": {
      "isError": false,
      "dataReceived": true,
      "arrayLength": 20,
      "xecCurrencyFound": true,
      "xecRatesCount": 174,
      "sampleRates": [
        { "coin": "AED", "rate": 0, "timestamp": 1760242021434 },
        { "coin": "AFN", "rate": 0, "timestamp": 1760242021434 },
        { "coin": "USD", "rate": 0, "timestamp": 1760242021434 }
      ]
    },

    // Request Context
    "requestContext": {
      "offerId": "cmgn0lvij000cgwl6tszmc9ac",
      "offerType": "GOODS_SERVICES",
      "offerCurrency": "USD",
      "offerPrice": 1,
      "component": "PlaceAnOrderModal"
    },

    // Impact Assessment
    "impact": {
      "affectedFeature": "Goods & Services Orders",
      "affectedCurrencies": ["USD", "EUR", "GBP", "All Fiat Currencies"],
      "userBlocked": true,
      "workaround": "None - requires backend fix"
    },

    // Technical Details
    "technical": {
      "graphqlQuery": "getAllFiatRate",
      "expectedStructure": "[{currency: 'XEC', fiatRates: [{coin: 'USD', rate: 0.00002}]}]",
      "detectedIssue": "All major currency rates = 0",
      "checkPerformed": "USD/EUR/GBP rate validation"
    },

    // Timestamps
    "detectedAt": "2025-10-12T04:30:00.000Z",
    "timezone": "America/Los_Angeles",

    // Environment
    "environment": {
      "url": "https://example.com/offer/...",
      "userAgent": "Mozilla/5.0..."
    }
  }
}
```

**Error Codes:**

- `FIAT_001`: Invalid data (all rates are zero)
- `FIAT_002`: No data (empty/null response)
- `CONV_001`: Rate data unavailable during conversion
- `CONV_002`: Conversion returned zero (likely zero rates)

## Files Modified

### Core Detection Logic

1. **PlaceAnOrderModal.tsx** (lines 912-1009)
   - `hasNoData`: Checks for null/undefined/empty array
   - `hasInvalidRates`: Checks if USD/EUR/GBP rates are all 0
   - `showErrorBanner`: Combined check using `useMemo`
   - `errorBannerMessage`: Dynamic message based on error type

### Conversion Logic

2. **util.ts** (convertXECAndCurrency)

   - Fixed case-insensitive coin code matching
   - Fixed Goods & Services rate calculation
   - Uses `tickerPriceGoodsServices` to find correct fiat rate

3. **Other Components Updated:**
   - `useOfferPrice.tsx` - Conditional rate data selection
   - `wallet/page.tsx` - Uses user-selected currency
   - `OrderDetailInfo.tsx` - Conditional rate data selection

## Architecture Question

### Why GraphQL Middleman?

The backend transforms the fiat rate API through GraphQL instead of direct frontend calls.

**Current Flow:**

```
Frontend → GraphQL (getAllFiatRate) → Backend → Fiat Rate API → Backend → GraphQL → Frontend
```

**Possible Direct Flow:**

```
Frontend → Fiat Rate API → Frontend
```

**Benefits of Direct API:**

- ✅ No transformation issues
- ✅ Real-time data
- ✅ Reduced complexity
- ✅ No sync issues between dev/prod

**Why Backend Proxy Might Exist:**

- Centralized caching
- Rate limiting protection
- Data aggregation from multiple sources
- Business logic application
- Historical reasons (legacy)

**Current Status:**

- CORS is enabled (`Access-Control-Allow-Origin: *`)
- No authentication required
- Fast response times
- **Frontend CAN call directly if needed**

## Recommendations

### Immediate (Development)

1. ⚠️ **Backend Team**: Fix dev API to return real rate values
2. ✅ **Frontend**: Error detection and alerts working
3. ✅ **Frontend**: Error banner shows clear messages

### Short Term

1. Consider implementing direct API calls as fallback
2. Document why GraphQL transformation layer exists
3. Add monitoring for rate freshness (stale data detection)

### Long Term

1. Evaluate if GraphQL transformation is still needed
2. Consider simplifying architecture if proxy adds no value
3. Implement automated tests for rate data validity

## Testing

### How to Test Error Detection

1. **With Current Broken Dev API:**

   - Navigate to any Goods & Services offer
   - Click "Place an Order"
   - ✅ Should see red error banner
   - ✅ Should receive Telegram alert
   - ✅ Console shows `hasInvalidRates: true`

2. **With Working API:**

   - Rates show correctly
   - No error banner
   - No alerts sent
   - Normal order flow works

3. **Test Different Error Types:**
   - **No data**: Mock RTK Query to return null
   - **Empty array**: Mock RTK Query to return `[]`
   - **Zero rates**: Current dev API state
   - **Mixed rates**: Some 0, some real (should NOT trigger if USD/EUR/GBP have values)

## Debug Logging

**Console Logs Available:**

```javascript
// Alert detection
"📊 Alert useEffect triggered:" {
  hasNoData: false,
  hasInvalidRates: true,  // ← Key indicator
  hasError: true,
  fiatRateError: false,
  getAllFiatRate: Array(20),
  arrayLength: 20,
  isGoodsServicesConversion: true,
  isFiatServiceDown: true,
  willSendAlert: true
}

// Fiat rate loading
"📊 Fiat rates loaded for Goods & Services:" {
  currency: 'XEC',
  fiatRatesCount: 174,
  priceInCurrency: 'USD',
  hasRate: true  // ← Has USD in array, but rate is 0
}

// Conversion attempt
"🔍 convertToAmountXEC called with:" {
  rateDataLength: 174,
  hasXecRate: true,  // ← Found "XEC" in rates
  inputAmount: 1
}

"✅ convertXECAndCurrency result:" {
  xec: 0,  // ← Returns 0 because rate is 0
  coinOrCurrency: 0,
  isGoodsServicesConversion: true
}
```

## Related Documentation

- [Backend Change Request: Goods & Services Filter](./BACKEND_CHANGE_REQUEST_GOODS_SERVICES_FILTER.md)
- [Telegram Alert System](./TELEGRAM_ALERT_SYSTEM.md)
- [Backend Fiat Rate Configuration](./BACKEND_FIAT_RATE_CONFIGURATION.md)
