# Fiat Rate Service Architecture

## Overview

This document explains why the frontend calls the GraphQL API instead of calling the fiat rates service directly.

**Related Backend Documentation:** `/home/nghiacc/projects/lixi/docs/ARCHITECTURE_FIAT_RATE_FLOW.md`

---

## Architecture Pattern: Backend for Frontend (BFF)

### The Flow (With Fallback)

```
Frontend (React/Next.js)
    ↓ useGetFiatRateWithFallback()
    │
    ├──→ PRIMARY: GraphQL Query (getAllFiatRate)
    │    │
    │    ↓
    │    Backend GraphQL Server (/graphql endpoint)
    │    │
    │    ↓
    │    Fiat Rate Service
    │    │
    │    ↓
    │    External API
    │    │
    │    ↓
    │    ✅ Valid Data? → Return to Frontend
    │    ❌ Invalid/Error? → Trigger Fallback ↓
    │
    └──→ FALLBACK: Direct API Call
         │
         ↓ (Environment-based routing)
         │
         ├─→ Dev Env: https://aws.abcpay.cash/bws/api/v3/fiatrates/ (Prod API)
         └─→ Prod Env: https://aws-dev.abcpay.cash/bws/api/v3/fiatrates/ (Dev API)
         │
         ↓
         Validate Data
         │
         ├─→ ✅ Valid: Return to Frontend + Send Telegram Alert
         └─→ ❌ Invalid: Return Error + Send Critical Alert
```

### Failure Detection Points

1. **GraphQL Network Error** → Trigger Fallback
2. **GraphQL Empty/Null Data** → Trigger Fallback
3. **GraphQL Zero Rates** → Trigger Fallback (USD/EUR/GBP = 0)

### Recovery

- GraphQL recovers → Automatically switch back to primary
- No manual intervention needed

---

## Key Reasons for This Architecture

### 🔐 1. **Security**

- **Backend keeps API credentials secret**
- Frontend never exposes API keys or sensitive configuration
- No risk of credentials being leaked through browser dev tools or network inspection
- API authentication handled securely on server-side

### 🌐 2. **CORS Prevention**

- All frontend requests go to same domain (`/graphql`)
- No cross-origin (CORS) issues since GraphQL endpoint is on same server
- Eliminates need for CORS preflight requests
- Simpler security configuration

### 🔄 3. **Data Transformation**

- Backend normalizes different API versions and formats
- Consistent data structure returned to frontend
- Changes in external API don't break frontend
- Backend can aggregate/transform data before sending

### ⚡ 4. **Caching & Performance**

- Centralized caching strategy on backend
- Reduces external API calls (rate limiting friendly)
- Can implement Redis/memory cache for hot data
- RTK Query provides automatic frontend caching

### 🛡️ 5. **Rate Limiting Protection**

- Backend controls request frequency to external API
- Prevents frontend abuse or accidental DDoS
- Can implement queue system for high traffic
- Protects against hitting API rate limits

### 🚨 6. **Error Handling**

- Consistent error format through GraphQL
- Backend can retry failed requests
- Better error recovery strategies
- Unified monitoring and alerting

### 📊 7. **Multiple Sources**

- Can aggregate multiple APIs in one query
- Future: Can switch between providers (dev/prod)
- Can implement fallback to secondary APIs
- Flexibility to change data sources

### 📈 8. **Monitoring**

- All API calls logged on backend
- Centralized debugging and tracing
- Performance metrics collection
- Easy to track API usage patterns

---

## Implementation in Our Codebase

### Frontend (React/Next.js)

```typescript
// apps/telegram-ecash-escrow/src/app/shopping/page.tsx
const { data: fiatData, error, isLoading } = useGetAllFiatRateQuery();

// Returns: [{currency: 'XEC', fiatRates: [{coin: 'USD', rate: 0.00002}]}]
```

**Benefits:**

- Type-safe with auto-generated TypeScript types
- Automatic caching via RTK Query
- Built-in loading/error states
- No need to manage API endpoints or credentials

### Backend GraphQL

```graphql
query getAllFiatRate {
  getAllFiatRate {
    currency
    fiatRates {
      coin
      rate
      timestamp
    }
  }
}
```

**Backend Responsibilities:**

- Calls external fiat rate API
- Normalizes response format
- Handles errors and retries
- Caches results
- Logs requests for monitoring

---

## Current API Configuration

### Development API

```
https://aws-dev.abcpay.cash/bws/api/v3/fiatrates/
```

- **Status:** ⚠️ Returns all rates as 0 (service issue)
- **Issue:** Backend service down or misconfigured
- **Detection:** Frontend detects zero rates and sends Telegram alerts

### Production API

```
https://aws.abcpay.cash/bws/api/v3/fiatrates/
```

- **Status:** ✅ Working correctly with real rates
- **CORS:** Enabled (`Access-Control-Allow-Origin: *`)
- **Note:** Could be called directly, but architecture uses GraphQL layer

---

## Why Not Call API Directly?

### Could We?

**Technically Yes** - Production API has CORS enabled, so browser can call it directly.

### Should We?

**No** - Even though it's possible, keeping the GraphQL layer provides:

1. **Consistency:** Other services use same pattern
2. **Future-Proofing:** Easy to change data source or add features
3. **Security:** Backend can add auth/validation later
4. **Monitoring:** Centralized logging and alerting
5. **Flexibility:** Can switch between dev/prod/staging easily
6. **Type Safety:** GraphQL schema provides strong typing

### Exception Case

Direct API calls might be considered for:

- Emergency fallback if GraphQL layer is down
- Client-side validation/testing tools
- Development debugging

But production code should always use GraphQL layer.

---

## Error Detection & Handling

### Frontend Detects Issues

```typescript
// Check for invalid data
const isZeroRates = xecRates.every(rate => ['USD', 'EUR', 'GBP'].includes(rate.coin) && rate.rate === 0);

// Check for missing data
const noData = !fiatData?.getAllFiatRate || fiatData.getAllFiatRate.length === 0;
```

### Three-Tier Error Logging

#### 1. Users See

```
"The currency conversion service is temporarily unavailable.
Please try again later or contact support."
```

#### 2. Developers See (Console)

```javascript
{
  errorCode: "FIAT_001",
  component: "PlaceAnOrderModal",
  isGoodsServices: true,
  timestamp: "2025-10-12T04:30:00.000Z"
}
```

#### 3. Backend Team Receives (Telegram)

```json
{
  "errorType": "INVALID_DATA_ZERO_RATES",
  "errorCode": "FIAT_001",
  "severity": "CRITICAL",
  "apiResponse": {
    "xecRatesCount": 174,
    "sampleRates": [...]
  },
  "impact": {
    "userBlocked": true
  }
}
```

---

## Benefits Summary

### ✅ **Backend as BFF (Backend for Frontend)**

- Clean separation of concerns
- Backend owns external integrations
- Frontend focuses on UI/UX

### ✅ **Type-Safe GraphQL Schema**

- Auto-generated TypeScript types
- IDE autocomplete support
- Compile-time error detection

### ✅ **RTK Query Integration**

- Automatic caching and state management
- Built-in loading/error states
- Optimistic updates support

### ✅ **Frontend Never Knows About External API Changes**

- Backend handles version upgrades
- Data format changes isolated
- No frontend deployment needed for API updates

### ✅ **Better Developer Experience**

- Single endpoint to call (`/graphql`)
- Consistent error handling
- Easy to mock for testing
- Clear data contracts

---

## Architecture Decision Record (ADR)

### Decision

Use GraphQL backend as proxy/gateway for all external API calls, including fiat rate service.

### Status

✅ **Accepted** - This is the established pattern in the codebase

### Context

- Need to fetch fiat currency rates for price conversions
- External API available at `https://aws.abcpay.cash/bws/api/v3/fiatrates/`
- API has CORS enabled and could be called directly from browser

### Consequences

**Positive:**

- Security: API credentials never exposed to client
- Maintainability: Single point to update API integrations
- Performance: Backend-level caching reduces API calls
- Reliability: Backend can implement retry logic
- Monitoring: Centralized logging and alerting

**Negative:**

- Latency: Extra network hop through GraphQL layer
- Complexity: Requires backend deployment for API changes
- Dependency: Frontend blocked if GraphQL server is down

**Mitigation:**

- GraphQL layer is fast (minimal overhead)
- Backend rarely needs changes for external API updates
- Can implement frontend fallback to direct API in emergency

---

## Related Documentation

- **Backend Architecture:** `/home/nghiacc/projects/lixi/docs/ARCHITECTURE_FIAT_RATE_FLOW.md`
- **Error Detection:** `/docs/FIAT_SERVICE_ERROR_DETECTION.md`
- **Backend Configuration:** `/docs/BACKEND_FIAT_RATE_CONFIGURATION.md`
- **Telegram Alerts:** `/docs/TELEGRAM_ALERT_SYSTEM.md`

---

## Future Considerations

### Possible Improvements

1. **GraphQL Subscriptions:** Real-time rate updates
2. **Client-Side Polling:** Automatic refresh every N minutes
3. ~~**Fallback Strategy:** Direct API call if GraphQL fails~~ ✅ **IMPLEMENTED** (See `/docs/FIAT_RATE_FALLBACK_STRATEGY.md`)
4. **Rate Staleness Detection:** Alert if rates too old
5. **Multiple Provider Support:** Aggregate rates from multiple sources

### Fallback Implementation ✅

**Status:** Implemented (October 12, 2025)

The application now includes automatic fallback to direct API calls when GraphQL fails:

- **Hook:** `useGetFiatRateWithFallback()` replaces direct `useGetAllFiatRateQuery()`
- **Validation:** Detects empty, null, and zero rate responses
- **Alerting:** Sends Telegram notifications on fallback activation
- **Zero Downtime:** Seamless user experience during GraphQL failures
- **Coverage:** 4 components updated (PlaceAnOrderModal, useOfferPrice, wallet, OrderDetailInfo)

**Documentation:** See `/docs/FIAT_RATE_FALLBACK_STRATEGY.md` for complete implementation details.

### Migration Path (if needed)

If ever needed to migrate to direct API calls:

1. Create new RTK Query endpoint for direct API
2. Update fiat rate hook to use new endpoint
3. Remove GraphQL query from frontend
4. Keep backend GraphQL for backward compatibility
5. Monitor for issues before fully switching

---

**Last Updated:** October 12, 2025  
**Maintainer:** Frontend Team  
**Status:** ✅ Production Architecture
