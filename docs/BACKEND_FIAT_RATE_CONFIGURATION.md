# 🔧 Backend Configuration: Fiat Rate API

**Date**: October 12, 2025  
**Priority**: 🔴 **CRITICAL**  
**Target**: Backend Development Team

---

## 📋 Overview

The frontend application (`local-ecash`) relies on the backend GraphQL API to provide fiat currency exchange rates via the `getAllFiatRate` query. Currently, this query is returning an empty array `[]`, blocking all fiat-priced Goods & Services orders.

---

## 🎯 Required Action

### Update Fiat Rate API URL

The backend GraphQL server (likely the `lixi` backend at `https://lixi.test`) needs to be configured to fetch fiat rates from the development API:

```
https://aws-dev.abcpay.cash/bws/api/v3/fiatrates/
```

---

## 🔍 Current Issue

### Frontend Query

The frontend calls:

```graphql
query GetAllFiatRate {
  getAllFiatRate {
    currency
    fiatRates {
      code
      name
      rate
    }
  }
}
```

### Current Response

```json
{
  "data": {
    "getAllFiatRate": []
  }
}
```

### Expected Response

```json
{
  "data": {
    "getAllFiatRate": [
      {
        "currency": "XEC",
        "fiatRates": [
          {
            "code": "USD",
            "name": "US Dollar",
            "rate": 0.00002345
          },
          {
            "code": "EUR",
            "name": "Euro",
            "rate": 0.00002156
          }
          // ... more currencies
        ]
      }
    ]
  }
}
```

---

## 🛠️ Backend Implementation Steps

### Step 1: Locate Fiat Rate Service Configuration

Find where the fiat rate service is configured in your backend. This is typically in:

**Option A: Environment Variable**

```bash
# .env or similar
FIAT_RATE_API_URL=https://aws-dev.abcpay.cash/bws/api/v3/fiatrates/
```

**Option B: Configuration File**

```typescript
// config/fiatRate.ts or similar
export const fiatRateConfig = {
  apiUrl: 'https://aws-dev.abcpay.cash/bws/api/v3/fiatrates/',
  cacheDuration: 60000, // 1 minute
  timeout: 5000
};
```

**Option C: GraphQL Resolver**

```typescript
// resolvers/fiatCurrency.resolver.ts or similar
async getAllFiatRate() {
  const response = await fetch('https://aws-dev.abcpay.cash/bws/api/v3/fiatrates/');
  const data = await response.json();
  return transformToSchema(data);
}
```

### Step 2: Update the URL

Change from the current (possibly incorrect) URL to:

```
https://aws-dev.abcpay.cash/bws/api/v3/fiatrates/
```

### Step 3: Test the API Endpoint

Before deploying, verify the endpoint works:

```bash
curl https://aws-dev.abcpay.cash/bws/api/v3/fiatrates/
```

Expected response should include rates for XEC and multiple fiat currencies.

### Step 4: Add Error Handling

Ensure your resolver has proper error handling:

```typescript
async getAllFiatRate() {
  try {
    const response = await fetch(FIAT_RATE_API_URL, {
      timeout: 5000,
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) {
      console.error(`Fiat rate API returned ${response.status}`);
      throw new Error('Failed to fetch fiat rates');
    }

    const data = await response.json();

    if (!data || data.length === 0) {
      console.warn('Fiat rate API returned empty data');
      return []; // or return cached data
    }

    return transformToSchema(data);
  } catch (error) {
    console.error('Error fetching fiat rates:', error);
    // Consider returning cached data or throwing
    throw error;
  }
}
```

### Step 5: Add Caching (Recommended)

To avoid hitting the API on every request:

```typescript
let cachedRates: FiatRate[] = [];
let lastFetch: number = 0;
const CACHE_DURATION = 60000; // 1 minute

async getAllFiatRate() {
  const now = Date.now();

  if (cachedRates.length > 0 && now - lastFetch < CACHE_DURATION) {
    return cachedRates;
  }

  try {
    const freshRates = await fetchFiatRates();
    cachedRates = freshRates;
    lastFetch = now;
    return freshRates;
  } catch (error) {
    // If fetch fails but we have cached data, return it
    if (cachedRates.length > 0) {
      console.warn('Using cached fiat rates due to API error');
      return cachedRates;
    }
    throw error;
  }
}
```

---

## 🧪 Testing

### Test 1: Verify GraphQL Query

```bash
curl -X POST https://lixi.test/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "query { getAllFiatRate { currency fiatRates { code name rate } } }"
  }'
```

Expected: Should return array with fiat rates, not empty array.

### Test 2: Test Frontend Integration

1. Restart backend server
2. Clear browser cache
3. Open a Goods & Services offer with fiat price (USD, EUR, etc.)
4. Enter quantity
5. Should see XEC amount calculated without error

### Test 3: Check Console Logs

Frontend should show:

```
🔍 PlaceAnOrderModal mounted - Fiat API State: {
  getAllFiatRate: Array(X),  // X > 0
  arrayLength: X,            // X > 0
  fiatRateError: false
}
```

---

## 📝 Verification Checklist

- [ ] Located fiat rate API configuration in backend code
- [ ] Updated API URL to `https://aws-dev.abcpay.cash/bws/api/v3/fiatrates/`
- [ ] Tested API endpoint directly (curl/Postman)
- [ ] Added error handling in resolver
- [ ] Added caching (recommended)
- [ ] Tested GraphQL query returns non-empty array
- [ ] Frontend no longer shows "Fiat Service Unavailable" error
- [ ] Can place orders for fiat-priced Goods & Services
- [ ] No Telegram alerts about fiat service down

---

## 🚨 If Issues Persist

### Common Problems

**Problem 1: API Returns Different Schema**

- Check the actual API response structure
- Update the transformation logic to match your GraphQL schema

**Problem 2: CORS Issues**

- Ensure backend allows requests to the fiat rate API
- Add proper CORS headers if needed

**Problem 3: Authentication Required**

- Check if the API requires API keys or tokens
- Add authentication headers if needed

**Problem 4: Network/Firewall Issues**

- Ensure backend server can reach `aws-dev.abcpay.cash`
- Check firewall rules

---

## 📞 Support

If you need frontend team assistance:

- Check `/docs/CRITICAL_FIAT_SERVICE_DOWN.md` for frontend error details
- Frontend Telegram alerts are configured in group "Local eCash Alerts" (ID: -1003006766820)
- All critical fiat service failures will be automatically reported there

---

## 🔗 Related Documentation

- [CRITICAL_FIAT_SERVICE_DOWN.md](./CRITICAL_FIAT_SERVICE_DOWN.md) - Detailed error analysis
- [TELEGRAM_ALERT_SYSTEM.md](./TELEGRAM_ALERT_SYSTEM.md) - Alert notification system
- [IMPLEMENTATION_COMPLETE.md](./IMPLEMENTATION_COMPLETE.md) - Shopping feature overview
