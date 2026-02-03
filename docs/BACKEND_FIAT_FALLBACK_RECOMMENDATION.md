# Backend Fiat Rate Fallback - Implementation Recommendation

## Executive Summary

This document provides recommendations for implementing fiat rate API fallback logic at the **backend GraphQL layer** rather than in the frontend application.

## Context

### Current Issue

- Development fiat rate API (`https://aws-dev.abcpay.cash/bws/api/v3/fiatrates/`) returns all rates as `0`
- Frontend applications cannot calculate prices for Goods & Services offers
- Users see "Currency rate unavailable" errors

### Why Backend Fallback is Better Than Frontend Fallback

1. **Single Point of Failure**: If GraphQL backend is completely down, fiat rates are the least of your problems - offers, orders, disputes, authentication, and all other services will also fail.

2. **Centralized Logic**: All clients (web, mobile, future apps) benefit from the fallback without duplicating code.

3. **No CORS Issues**: Backend-to-backend API calls don't face browser CORS restrictions.

4. **Simpler Frontend**: Frontend just calls `getAllFiatRate` GraphQL query as usual - no special handling needed.

5. **Better Monitoring**: Backend can log which API source is being used, track failure rates, and send alerts.

6. **Consistent Data**: All users get the same data source at any given time, preventing inconsistencies.

## Recommended Implementation

### Architecture

```
┌─────────────────┐
│   Frontend      │
│  (Web/Mobile)   │
└────────┬────────┘
         │ getAllFiatRate GraphQL query
         ▼
┌─────────────────────────────────────┐
│   GraphQL Backend Resolver          │
│                                     │
│   1. Try Primary Fiat API           │
│      ↓                              │
│   2. Validate Response              │
│      - Check for null/empty         │
│      - Check for all zeros          │
│      ↓                              │
│   3. On Failure: Try Fallback API   │
│      ↓                              │
│   4. Return Unified Response        │
│      - Same structure regardless    │
│      - Include metadata (source)    │
│      ↓                              │
└─────────────────────────────────────┘
         │
         ▼
┌─────────────────┐
│   Frontend      │
│ (Receives data) │
└─────────────────┘
```

### Backend Configuration

**Environment Variables**

```bash
# Primary fiat rate API (environment-specific)
FIAT_RATE_PRIMARY_URL=https://aws-dev.abcpay.cash/bws/api/v3/fiatrates/

# Fallback fiat rate API (production API)
FIAT_RATE_FALLBACK_URL=https://aws.abcpay.cash/bws/api/v3/fiatrates/

# Timeout for API calls (milliseconds)
FIAT_RATE_TIMEOUT=5000

# Enable/disable fallback
FIAT_RATE_FALLBACK_ENABLED=true
```

### Pseudocode Implementation

```typescript
// Backend GraphQL Resolver: getAllFiatRate

async function getAllFiatRate() {
  const primaryUrl = process.env.FIAT_RATE_PRIMARY_URL;
  const fallbackUrl = process.env.FIAT_RATE_FALLBACK_URL;
  const timeout = parseInt(process.env.FIAT_RATE_TIMEOUT || '5000');
  const fallbackEnabled = process.env.FIAT_RATE_FALLBACK_ENABLED === 'true';

  let source = 'primary';
  let data = null;
  let error = null;

  try {
    // Step 1: Try primary API
    console.log('[FIAT_RATE] Fetching from primary API:', primaryUrl);

    const primaryResponse = await fetch(primaryUrl, {
      timeout,
      headers: { 'Content-Type': 'application/json' }
    });

    if (!primaryResponse.ok) {
      throw new Error(`Primary API HTTP ${primaryResponse.status}`);
    }

    data = await primaryResponse.json();

    // Step 2: Validate response
    const isValid = validateFiatRateResponse(data);

    if (!isValid) {
      console.warn('[FIAT_RATE] Primary API returned invalid data (null/empty/zero rates)');
      throw new Error('Invalid data from primary API');
    }

    console.log('[FIAT_RATE] ✅ Primary API successful');
  } catch (primaryError) {
    console.error('[FIAT_RATE] ❌ Primary API failed:', primaryError.message);
    error = primaryError;

    // Step 3: Try fallback if enabled
    if (fallbackEnabled && fallbackUrl) {
      try {
        console.log('[FIAT_RATE] Attempting fallback API:', fallbackUrl);

        const fallbackResponse = await fetch(fallbackUrl, {
          timeout,
          headers: { 'Content-Type': 'application/json' }
        });

        if (!fallbackResponse.ok) {
          throw new Error(`Fallback API HTTP ${fallbackResponse.status}`);
        }

        data = await fallbackResponse.json();

        const isValid = validateFiatRateResponse(data);

        if (!isValid) {
          throw new Error('Invalid data from fallback API');
        }

        source = 'fallback';
        console.log('[FIAT_RATE] ✅ Fallback API successful');

        // Send alert to Telegram
        await sendTelegramAlert({
          type: 'FIAT_FALLBACK',
          message: 'Fiat rate service using fallback API',
          details: {
            primaryUrl,
            fallbackUrl,
            primaryError: error.message,
            timestamp: new Date().toISOString()
          }
        });
      } catch (fallbackError) {
        console.error('[FIAT_RATE] ❌ Fallback API also failed:', fallbackError.message);

        // Send critical alert
        await sendTelegramAlert({
          type: 'FIAT_CRITICAL',
          message: '🚨 CRITICAL: Both fiat rate APIs failed',
          details: {
            primaryError: error.message,
            fallbackError: fallbackError.message,
            timestamp: new Date().toISOString()
          }
        });

        throw new Error('Both primary and fallback fiat rate APIs failed');
      }
    } else {
      throw error; // No fallback configured
    }
  }

  // Step 4: Transform and return
  return transformToGraphQLFormat(data, source);
}

function validateFiatRateResponse(data: any): boolean {
  // Check for null/undefined
  if (!data || !Array.isArray(data)) {
    return false;
  }

  // Check for empty array
  if (data.length === 0) {
    return false;
  }

  // Check for all zero rates (sample first 5 currencies)
  const samplesToCheck = Math.min(5, data.length);
  let nonZeroCount = 0;

  for (let i = 0; i < samplesToCheck; i++) {
    const currency = data[i];
    if (currency.rate && parseFloat(currency.rate) > 0) {
      nonZeroCount++;
    }
  }

  // At least 80% of samples should have non-zero rates
  const validPercentage = (nonZeroCount / samplesToCheck) * 100;
  return validPercentage >= 80;
}

function transformToGraphQLFormat(apiData: any[], source: string) {
  // Transform API response to GraphQL getAllFiatRate format
  // Group by currency and structure fiatRates

  const currencyMap = new Map();

  apiData.forEach(item => {
    if (!currencyMap.has(item.currency)) {
      currencyMap.set(item.currency, {
        currency: item.currency,
        fiatRates: []
      });
    }

    currencyMap.get(item.currency).fiatRates.push({
      coin: item.coin || 'xec',
      rate: parseFloat(item.rate),
      ts: item.ts || Date.now()
    });
  });

  const result = Array.from(currencyMap.values());

  // Log source for monitoring
  console.log(`[FIAT_RATE] Returning ${result.length} currencies from ${source} API`);

  return result;
}
```

### Error Detection Logic

```typescript
function validateFiatRateResponse(data: any): boolean {
  // 1. Check structure
  if (!data || !Array.isArray(data)) {
    console.warn('[FIAT_RATE] Invalid structure: not an array');
    return false;
  }

  // 2. Check for empty
  if (data.length === 0) {
    console.warn('[FIAT_RATE] Invalid: empty array');
    return false;
  }

  // 3. Check for zero rates
  // Sample first 5 currencies to avoid processing large arrays
  const samplesToCheck = Math.min(5, data.length);
  let zeroRateCount = 0;

  for (let i = 0; i < samplesToCheck; i++) {
    const currency = data[i];
    const rate = parseFloat(currency.rate || '0');

    if (rate === 0) {
      zeroRateCount++;
    }
  }

  // If more than 80% have zero rates, consider it invalid
  const zeroPercentage = (zeroRateCount / samplesToCheck) * 100;

  if (zeroPercentage > 80) {
    console.warn(`[FIAT_RATE] Invalid: ${zeroPercentage}% of rates are zero`);
    return false;
  }

  return true;
}
```

## Monitoring & Alerts

### Metrics to Track

1. **Primary API Success Rate**

   - Track successful calls vs failures
   - Alert if below 95% over 5 minutes

2. **Fallback Activation Rate**

   - How often fallback is used
   - Alert if > 10% of requests use fallback

3. **Response Time**

   - Track both primary and fallback response times
   - Alert if > 3 seconds

4. **Data Quality**
   - Track zero rate detection
   - Alert if zero rates detected

### Telegram Alerts

**When to Send Alerts:**

1. **Info Alert**: Fallback activated (first occurrence in 5 minutes)
2. **Warning Alert**: Fallback used > 5 times in 5 minutes
3. **Critical Alert**: Both APIs failed
4. **Recovery Alert**: Primary API recovered after using fallback

**Alert Format:**

```json
{
  "level": "WARNING",
  "service": "fiat-rate",
  "event": "fallback-activated",
  "message": "Fiat rate service switched to fallback API",
  "details": {
    "primaryUrl": "https://aws-dev.abcpay.cash/bws/api/v3/fiatrates/",
    "fallbackUrl": "https://aws.abcpay.cash/bws/api/v3/fiatrates/",
    "primaryError": "All rates are zero",
    "timestamp": "2025-10-12T10:30:00.000Z",
    "environment": "development"
  }
}
```

## Testing Strategy

### Unit Tests

```typescript
describe('getAllFiatRate resolver', () => {
  it('should return data from primary API when available', async () => {
    // Mock primary API success
    // Assert data returned with source='primary'
  });

  it('should fallback when primary returns empty data', async () => {
    // Mock primary API returning []
    // Mock fallback API success
    // Assert data returned with source='fallback'
  });

  it('should fallback when primary returns all zero rates', async () => {
    // Mock primary API returning all zeros
    // Mock fallback API success
    // Assert data returned with source='fallback'
  });

  it('should throw error when both APIs fail', async () => {
    // Mock both APIs failing
    // Assert error thrown
  });

  it('should send Telegram alert when fallback is used', async () => {
    // Mock primary failure, fallback success
    // Assert Telegram alert sent
  });
});
```

### Integration Tests

1. **Test with real dev API** (currently returning zeros)

   - Should automatically use fallback
   - Should send Telegram alert

2. **Test with simulated primary failure**

   - Temporarily point primary to invalid URL
   - Should use fallback seamlessly

3. **Test with both APIs down**
   - Should return appropriate error to frontend
   - Should send critical Telegram alert

## Rollout Plan

### Phase 1: Implementation (Backend Team)

- [ ] Add environment variables
- [ ] Implement fallback logic in resolver
- [ ] Add validation function
- [ ] Add Telegram alert integration
- [ ] Write unit tests

### Phase 2: Testing (Backend Team)

- [ ] Test in development environment
- [ ] Verify fallback activates when dev API returns zeros
- [ ] Verify Telegram alerts sent
- [ ] Test error handling

### Phase 3: Frontend Cleanup (Frontend Team)

- [x] Remove `useGetFiatRateWithFallback` hook
- [x] Restore original `useGetAllFiatRateQuery` usage in 4 files
- [x] Remove environment variable `NEXT_PUBLIC_FALLBACK_GRAPHQL_API`
- [x] Update documentation

### Phase 4: Monitoring (DevOps)

- [ ] Set up metrics dashboard
- [ ] Configure alerting rules
- [ ] Monitor fallback usage rates

### Phase 5: Production Rollout

- [ ] Deploy backend changes to staging
- [ ] Verify fallback works in staging
- [ ] Deploy to production
- [ ] Monitor for 24 hours

## Benefits

✅ **Simpler Architecture**: Frontend has no fallback logic, just calls GraphQL as normal

✅ **Single Source of Truth**: All clients get same data from same source

✅ **No CORS Issues**: Backend-to-backend calls bypass browser restrictions

✅ **Centralized Monitoring**: Backend logs and alerts for all API usage

✅ **Future-Proof**: Easy to add more fallback sources or switch APIs

✅ **Consistency**: All users see same rates at same time

✅ **Resilient**: If GraphQL is up, fiat rates will be available (via fallback)

## Conclusion

**Recommendation: Implement fallback logic at the backend GraphQL resolver level.**

The frontend fallback approach was a good temporary solution, but backend implementation provides:

- Better architecture (single responsibility)
- Simpler frontend code
- No CORS complications
- Centralized monitoring and alerting
- Benefits all clients (web, mobile, etc.)

If the entire GraphQL backend is down, fiat rates are not the critical issue - the entire application is unavailable. Backend fallback ensures that as long as GraphQL is running, fiat rates will be available from either primary or fallback API.

---

**Document Status**: ✅ Ready for Backend Team Review  
**Last Updated**: October 12, 2025  
**Author**: AI Assistant (based on user decision)
