# 🚨 CRITICAL: Fiat Service Down - Backend Issue

**Date**: October 12, 2025  
**Status**: 🔴 **BACKEND ERROR - REQUIRES IMMEDIATE FIX**  
**Impact**: HIGH - Blocks all fiat-priced Goods & Services orders

---

## 🔍 Error Details

### GraphQL Error Response

```http
POST //graphql HTTP/1.1
Host: lixi.test
Content-Type: application/json

Response:
{
  "errors": [
    {
      "message": "Cannot return null for non-nullable field Query.getAllFiatRate.",
      "locations": [{"line": 3, "column": 3}],
      "path": ["getAllFiatRate"]
    }
  ],
  "data": null
}
```

### Root Cause

The `getAllFiatRate` GraphQL query is returning empty array `[]` instead of populated fiat rates, indicating:

- The fiat rate service is down or misconfigured
- Database query is failing
- External API (e.g., CoinGecko, CryptoCompare) is unavailable or not configured
- Backend schema mismatch (field marked as non-nullable but returning null/empty)
- **Fiat rate API URL might be pointing to wrong environment**

### 🔧 Temporary Fix: Use Development Fiat Rate API

**Backend Configuration Required:**

Update the fiat rate service to use the development API:

```
https://aws-dev.abcpay.cash/bws/api/v3/fiatrates/
```

This should be configured in your backend GraphQL server (likely in `lixi` backend) where the `getAllFiatRate` resolver fetches data.

---

## 💥 Impact Analysis

### Affected Features

#### 1. ❌ Goods & Services Orders (USD, EUR, etc.)

**Severity**: CRITICAL

- Cannot place orders for fiat-priced offers
- No XEC calculation possible
- Users see error message or stuck loading state

**Example Scenario**:

```
Offer: Laptop repair @ 50 USD/unit
User: Enters 2 units
Expected: Calculate 50 USD → XEC using rate
Actual: ❌ Rate data is null, conversion fails
```

#### 2. ❌ P2P Trading (Buy/Sell XEC)

**Severity**: CRITICAL

- Cannot calculate XEC amounts for fiat currencies
- Buy/Sell orders in USD, EUR, etc. are blocked

#### 3. ❌ Wallet Display

**Severity**: MEDIUM

- Cannot show fiat values for XEC balance
- Portfolio view incomplete

#### 4. ✅ XEC-Priced Offers Still Work

**Severity**: NONE

- Offers priced directly in XEC don't need conversion
- Can still trade XEC-to-XEC

---

## 🛠️ Frontend Changes (Temporary Mitigation)

We've added error handling to improve user experience while the backend is fixed:

### Change 1: Capture Error State

**File**: `PlaceAnOrderModal.tsx` (Line 335)

```typescript
const { data: fiatData, isError: fiatRateError, isLoading: fiatRateLoading } = useGetAllFiatRateQuery();
```

### Change 2: Enhanced Logging

**File**: `PlaceAnOrderModal.tsx` (Line 710)

```typescript
const convertToAmountXEC = async () => {
  if (!rateData) {
    // Show error if fiat rate is needed but not available
    if (isGoodsServicesConversion || (post?.postOffer?.coinPayment && post?.postOffer?.coinPayment !== 'XEC')) {
      console.error('Fiat rate data is not available. Cannot convert currency.');
    }
    return 0;
  }
  // ... rest of conversion
};
```

### Change 3: User-Facing Error Message

**File**: `PlaceAnOrderModal.tsx` (Line 872)

```tsx
<DialogContent>
  <PlaceAnOrderWrap>
    {/* Show error when fiat service is down for fiat-priced offers */}
    {fiatRateError && isGoodsServicesConversion && (
      <Box sx={{
        backgroundColor: 'error.light',
        color: 'error.contrastText',
        padding: 2,
        borderRadius: 1,
        marginBottom: 2
      }}>
        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
          ⚠️ Fiat Service Unavailable
        </Typography>
        <Typography variant="body2">
          Cannot calculate XEC amount for {post?.postOffer?.tickerPriceGoodsServices}-priced offers.
          The currency conversion service is temporarily unavailable. Please try again later or contact support.
        </Typography>
      </Box>
    )}
    <Grid container spacing={2}>
```

**User sees**:

```
┌──────────────────────────────────────────────────┐
│ ⚠️ Fiat Service Unavailable                      │
│                                                   │
│ Cannot calculate XEC amount for USD-priced       │
│ offers. The currency conversion service is       │
│ temporarily unavailable. Please try again        │
│ later or contact support.                        │
└──────────────────────────────────────────────────┘
```

---

## 🔧 Backend Fix Required

### Checklist for Backend Team

#### 1. Check GraphQL Schema

```graphql
type Query {
  # Make sure this is correct
  getAllFiatRate: [FiatRate!]! # Non-nullable array of non-nullable items
}

type FiatRate {
  currency: String!
  fiatRates: [CoinRate!]!
}

type CoinRate {
  coin: String!
  rate: Float!
}
```

**Issue**: If `getAllFiatRate` is marked as non-nullable (`!`) but the resolver returns `null`, GraphQL throws this error.

**Fix Options**:

1. Make field nullable: `getAllFiatRate: [FiatRate]` (allows null return)
2. Fix resolver to always return an array (even if empty): `return []`
3. Add default/fallback data when external service is down

#### 2. Check Resolver Implementation

**File**: `lixi-backend/src/resolvers/fiat-currency.resolver.ts` (or similar)

```typescript
@Query(() => [FiatRate])
async getAllFiatRate() {
  try {
    const rates = await this.fiatCurrencyService.getAllRates();

    // ❌ BAD: Returns null/undefined on error
    if (!rates) return null;

    // ✅ GOOD: Returns empty array on error
    if (!rates) return [];

    return rates;
  } catch (error) {
    console.error('Fiat rate fetch failed:', error);

    // ❌ BAD: Throws error or returns null
    throw new Error('Fiat service unavailable');

    // ✅ GOOD: Returns empty array or cached data
    return this.getCachedRates() || [];
  }
}
```

#### 3. Check External API Integration

Common issues:

- **API Key expired**: Check CoinGecko/CryptoCompare API credentials
- **Rate limit exceeded**: Implement caching (Redis) with TTL
- **Network timeout**: Add timeout handling (5-10 seconds)
- **API endpoint changed**: Verify external API URL

**Example Service Fix**:

```typescript
class FiatCurrencyService {
  private cache = new Map();
  private CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  async getAllRates() {
    // Check cache first
    if (this.cache.has('rates') && !this.isCacheExpired('rates')) {
      return this.cache.get('rates');
    }

    try {
      // Fetch from external API with timeout
      const response = await fetch('https://api.coingecko.com/...', {
        timeout: 5000
      });

      if (!response.ok) {
        throw new Error(`API returned ${response.status}`);
      }

      const data = await response.json();

      // Cache the result
      this.cache.set('rates', data);
      this.cache.set('rates_timestamp', Date.now());

      return data;
    } catch (error) {
      console.error('External API failed:', error);

      // Return cached data if available (even if expired)
      const cachedData = this.cache.get('rates');
      if (cachedData) {
        console.warn('Using stale cached data');
        return cachedData;
      }

      // Return empty array as last resort
      return [];
    }
  }
}
```

#### 4. Add Health Check Endpoint

```typescript
@Get('/health/fiat-rates')
async checkFiatRates() {
  try {
    const rates = await this.fiatCurrencyService.getAllRates();
    return {
      status: 'ok',
      ratesCount: rates.length,
      timestamp: Date.now()
    };
  } catch (error) {
    return {
      status: 'error',
      error: error.message,
      timestamp: Date.now()
    };
  }
}
```

#### 5. Database Query Check

If using database for rate storage:

```sql
-- Check if fiat_rates table exists
SELECT * FROM fiat_rates LIMIT 10;

-- Check last update time
SELECT currency, MAX(updated_at)
FROM fiat_rates
GROUP BY currency;

-- Check for missing currencies
SELECT currency FROM fiat_rates WHERE currency IN ('USD', 'EUR', 'GBP', 'JPY');
```

---

## 🧪 Testing the Fix

### 1. Manual Test in GraphQL Playground

```graphql
query TestFiatRates {
  getAllFiatRate {
    currency
    fiatRates {
      coin
      rate
    }
  }
}
```

**Expected Response**:

```json
{
  "data": {
    "getAllFiatRate": [
      {
        "currency": "USD",
        "fiatRates": [
          { "coin": "xec", "rate": 0.00003 },
          { "coin": "btc", "rate": 98000.0 }
        ]
      },
      {
        "currency": "EUR",
        "fiatRates": [
          { "coin": "xec", "rate": 0.000028 },
          { "coin": "btc", "rate": 92000.0 }
        ]
      }
    ]
  }
}
```

### 2. Test Frontend Integration

1. Fix backend (resolve null issue)
2. Restart backend server
3. Reload frontend
4. Navigate to Shopping tab
5. Try to place order on USD-priced offer
6. Verify:
   - ✅ No error banner appears
   - ✅ XEC calculation works
   - ✅ "You will receive X XEC" displays correctly
   - ✅ Price shows: "X XEC / unit (50 USD)"

### 3. Test Error Recovery

1. Stop external API or break connection
2. Verify:
   - ✅ Backend returns empty array (not null)
   - ✅ Frontend shows error message
   - ✅ XEC-priced offers still work
3. Restore connection
4. Verify:
   - ✅ Rates refresh automatically
   - ✅ Error message disappears
   - ✅ USD-priced offers work again

---

## 📊 Monitoring & Alerts

### Add Monitoring

1. **Rate Fetch Success Rate**: Track % of successful API calls
2. **Cache Hit Rate**: Monitor cache effectiveness
3. **Last Successful Update**: Alert if > 10 minutes old
4. **Error Count**: Alert if > 5 errors in 1 minute

### Recommended Alerts

```yaml
- alert: FiatRateServiceDown
  expr: fiat_rate_fetch_errors > 5
  for: 1m
  annotations:
    summary: 'Fiat rate service is experiencing errors'
    description: '{{ $value }} errors in the last minute'

- alert: FiatRateStale
  expr: (time() - fiat_rate_last_update_timestamp) > 600
  annotations:
    summary: "Fiat rates haven't updated in 10 minutes"
```

---

## ✅ Verification Checklist

Before marking as resolved:

- [ ] Backend GraphQL query returns data (not null)
- [ ] External API connection working
- [ ] Cache implemented with fallback
- [ ] Health check endpoint added
- [ ] Frontend error handling working
- [ ] USD-priced Goods & Services orders work
- [ ] P2P Trading with fiat currencies works
- [ ] Monitoring/alerts configured
- [ ] Documentation updated

---

## 📞 Next Steps

### Immediate (Backend Team)

1. ⚠️ **Check external API status** (CoinGecko/CryptoCompare)
2. ⚠️ **Review resolver code** for null returns
3. ⚠️ **Add/fix caching** to prevent future outages
4. ⚠️ **Deploy fix** to production

### Short-term (Both Teams)

1. Add health monitoring for fiat service
2. Implement automatic retry logic
3. Add fallback to cached/stale data
4. Create runbook for future incidents

### Long-term (Architecture)

1. Consider multiple fiat data sources (redundancy)
2. Implement circuit breaker pattern
3. Add rate limiting and quotas
4. Store historical rates in database

---

## 🎯 Summary

**Problem**: Fiat rate service returning null, breaking all fiat-priced offers

**Impact**: Users cannot place orders for USD/EUR/etc. priced items

**Frontend**: ✅ Added error handling and user messaging (completed)

**Backend**: 🔴 REQUIRES FIX - Check resolver, external API, and add caching

**Priority**: **CRITICAL** - Core functionality broken for fiat-priced offers

---

**Status**: Waiting for backend fix to restore fiat service functionality
