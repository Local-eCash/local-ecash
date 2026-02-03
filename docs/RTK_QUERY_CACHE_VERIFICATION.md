# RTK Query Cache Behavior - Test & Verification

**Date**: October 12, 2025  
**Purpose**: Verify that prefetching and cache sharing works as expected

---

## How RTK Query Caching Works

### Cache Key Generation

RTK Query creates a cache key based on:

1. **Endpoint name**: `getAllFiatRate`
2. **Arguments**: `undefined` (no args)
3. **Result**: Single cache entry for `getAllFiatRate(undefined)`

### Cache Sharing

✅ **Multiple components calling the same endpoint with same args share ONE cache entry**

```typescript
// Component A (Shopping page)
useGetAllFiatRateQuery(undefined, { ... })  // Creates cache entry

// Component B (Modal)
useGetAllFiatRateQuery(undefined, { ... })  // Uses SAME cache entry
```

---

## Current Implementation

### 1. Prefetch on Page Load (Shopping page)

```typescript
// src/app/shopping/page.tsx
useGetAllFiatRateQuery(undefined, {
  pollingInterval: 0, // Don't auto-refresh
  refetchOnMountOrArgChange: true // Fetch on page mount
});
```

**Behavior**:

- Runs when Shopping page mounts
- Fetches fiat rates from API (200-500ms)
- Stores in RTK Query cache with key: `getAllFiatRate(undefined)`
- Cache TTL: 60 seconds (RTK Query default)

### 2. Use Cache in Modal

```typescript
// src/components/PlaceAnOrderModal/PlaceAnOrderModal.tsx
const { data } = useGetAllFiatRateQuery(undefined, {
  skip: !needsFiatRates, // Skip if not needed
  refetchOnMountOrArgChange: false, // DON'T refetch, use cache
  refetchOnFocus: false // DON'T refetch on focus
});
```

**Behavior**:

- Modal mounts when user clicks offer
- Hook looks up cache with key: `getAllFiatRate(undefined)`
- **Cache hit**: Returns cached data instantly (0ms) ✅
- **Cache miss**: Fetches from API (200-500ms) ⚠️

---

## Testing Steps

### Test 1: Verify Prefetch on Page Load

**Steps**:

1. Open DevTools → Network tab
2. Navigate to Shopping page
3. Look for GraphQL request: `getAllFiatRate`

**Expected**:

- ✅ 1 API call when page loads
- ✅ Response: 174 currencies with valid rates
- ✅ Status: 200 OK

**Console Log**:

```javascript
// Should see in console
RTK Query: getAllFiatRate - Fetching
RTK Query: getAllFiatRate - Success (174 currencies)
```

### Test 2: Verify Cache Hit in Modal

**Steps**:

1. Keep Network tab open
2. Click on any Goods & Services offer
3. Modal should open
4. Check Network tab for new `getAllFiatRate` request

**Expected**:

- ✅ NO new API call (using cache)
- ✅ Modal opens instantly
- ✅ Prices display correctly

**Console Log**:

```javascript
// Should see in console
📊 Fiat rates loaded for Goods & Services: {
  transformedRatesCount: 176,
  sampleTransformed: [{coin: 'USD', rate: 68027.21}, ...]
}
✅ convertXECAndCurrency result: { xec: 68027.21, ... }
```

### Test 3: Verify Skip for Pure XEC Offers

**Steps**:

1. Find a pure XEC offer (coinPayment === 'XEC', no fiat pricing)
2. Click to open modal
3. Check Network tab

**Expected**:

- ✅ NO API call (skipped entirely)
- ✅ `needsFiatRates === false`
- ✅ Modal opens instantly

**Console Log**:

```javascript
needsFiatRates: false; // Skipped!
```

### Test 4: Verify Cache Miss Fallback

**Steps**:

1. Navigate DIRECTLY to offer detail page (bypass Shopping page)
2. Try to place order (if modal opens)
3. Check Network tab

**Expected**:

- ⚠️ API call made (cache miss, no prefetch happened)
- ✅ Modal waits for data (shows loading briefly)
- ✅ Data fetches successfully

### Test 5: Verify Cache Expiry

**Steps**:

1. Open Shopping page (prefetch happens)
2. Wait 61 seconds (cache expires after 60s)
3. Open modal
4. Check Network tab

**Expected**:

- ⚠️ API call made (cache expired)
- ✅ Fresh data fetched
- ⏱️ Brief loading state

---

## Troubleshooting

### Issue: Modal still fetches on open

**Possible Causes**:

1. **Prefetch not running**: Check if Shopping page mounted
2. **Cache expired**: Check if >60 seconds passed
3. **Different args**: Verify both use `undefined` as arg
4. **Skip condition**: Check if `needsFiatRates === true`

**Debug Steps**:

```typescript
// Add to modal component
useEffect(() => {
  console.log('🔍 Modal Debug:', {
    needsFiatRates,
    isGoodsServices,
    coinPayment: post?.postOffer?.coinPayment,
    fiatData,
    isLoading: fiatRateLoading,
    isError: fiatRateError
  });
}, [needsFiatRates, fiatData, fiatRateLoading, fiatRateError]);
```

### Issue: Prices not displaying

**Possible Causes**:

1. **Rate inversion not applied**: Check `transformedRates` in console
2. **Missing XEC entry**: Check if `{coin: 'xec', rate: 1}` exists
3. **Wrong currency lookup**: Check `tickerPriceGoodsServices` value

**Debug Steps**:

```typescript
console.log('📊 Fiat rates loaded:', {
  originalRates: xecCurrency?.fiatRates?.slice(0, 3),
  transformedRates: transformedRates?.slice(0, 3),
  lookingFor: post?.postOffer?.tickerPriceGoodsServices,
  matchedRate: transformedRates?.find(r => r.coin?.toUpperCase() === 'USD')
});
```

---

## Performance Metrics

### Baseline (No Optimization)

| Action             | API Calls | Time           |
| ------------------ | --------- | -------------- |
| Load Shopping page | 0         | 0ms            |
| Open 1st modal     | 1         | 200-500ms      |
| Open 2nd modal     | 1         | 200-500ms      |
| Open 3rd modal     | 1         | 200-500ms      |
| **Total**          | **3+**    | **600-1500ms** |

### With Prefetch (Current)

| Action             | API Calls | Time                   |
| ------------------ | --------- | ---------------------- |
| Load Shopping page | 1         | 200-500ms (background) |
| Open 1st modal     | 0 (cache) | **0ms ⚡**             |
| Open 2nd modal     | 0 (cache) | **0ms ⚡**             |
| Open 3rd modal     | 0 (cache) | **0ms ⚡**             |
| **Total**          | **1**     | **500ms (one-time)**   |

**Savings**:

- 66% fewer API calls for 3 modals
- 1000ms+ saved in user wait time
- Instant modal opening experience

---

## Browser DevTools Verification

### Redux DevTools

If Redux DevTools is installed:

1. Open Redux DevTools
2. Navigate to "RTK Query"
3. Find `fiatCurrencyApi` endpoint
4. Check `queries` → `getAllFiatRate(undefined)`

**Should see**:

```json
{
  "status": "fulfilled",
  "data": {
    "getAllFiatRate": [
      {"currency": "XEC", "fiatRates": [...]},
      ...
    ]
  },
  "requestId": "...",
  "fulfilledTimeStamp": 1697123456789
}
```

### Network Waterfall

Check Network tab waterfall:

**Expected pattern**:

```
Page load:
├─ HTML
├─ JS bundles
├─ GraphQL: getAllFiatRate ← PREFETCH (200-500ms)
└─ Images, fonts, etc.

Modal open:
└─ (no network activity) ← CACHE HIT ✅
```

---

## Recommendations

### If Cache Miss is Frequent

**Increase cache time**:

```typescript
// In RTK Query API definition
fiatCurrencyApi.endpoints.getAllFiatRate.initiate(undefined, {
  forceRefetch: false,
  // Increase from 60s to 5 minutes
  keepUnusedDataFor: 300
});
```

### If Prefetch Fails

**Add error boundary**:

```typescript
useGetAllFiatRateQuery(undefined, {
  pollingInterval: 0,
  refetchOnMountOrArgChange: true,
  // Retry 3 times on failure
  retry: 3
});
```

### If Performance Critical

**Add service worker caching**:

- Cache API responses in IndexedDB
- Survive page refreshes
- Longer cache duration (30 minutes)

---

## Conclusion

**Current Implementation**:
✅ Prefetch on page load (Shopping, P2P Trading)  
✅ Cache shared across components  
✅ Modal uses cached data (0ms load time)  
✅ Skip fetching for pure XEC offers  
✅ Fallback to lazy load if cache miss

**Key Success Criteria**:

1. Only 1 API call per page load
2. Modal opens instantly (0ms wait)
3. No redundant fetches
4. Works without prefetch (lazy load fallback)

**Status**: ✅ Ready for testing

---

**Document Updated**: October 12, 2025  
**Next Step**: Run Tests 1-5 and verify expected behavior
