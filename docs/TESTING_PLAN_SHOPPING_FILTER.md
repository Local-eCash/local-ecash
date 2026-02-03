# Testing Plan: Goods & Services Currency Filter

**Date**: October 12, 2025  
**Feature**: Backend-powered currency filtering for Shopping tab  
**Status**: Ready for Testing ✅

## 🎯 What Was Changed

### Backend Changes (Completed by Backend Team)

- ✅ Added `tickerPriceGoodsServices` field to `OfferFilterInput` GraphQL type
- ✅ Implemented server-side filtering in offer resolver
- ✅ Database query now filters by `tickerPriceGoodsServices`

### Frontend Changes (Just Completed)

- ✅ Removed client-side filtering logic from `shopping/page.tsx`
- ✅ Updated `ShoppingFilterComponent` to use `tickerPriceGoodsServices` field
- ✅ Filter config now passes `tickerPriceGoodsServices` to backend API
- ✅ All TypeScript errors resolved

## 🧪 Manual Testing Checklist

### Test 1: No Currency Filter (Show All)

**Steps:**

1. Navigate to Shopping tab
2. Ensure no currency is selected
3. Scroll through the list

**Expected Results:**

- ✅ All Goods & Services offers are displayed
- ✅ Offers with different currencies (USD, XEC, EUR, etc.) are visible
- ✅ Infinite scroll loads more items
- ✅ No console errors

---

### Test 2: Filter by USD

**Steps:**

1. Navigate to Shopping tab
2. Click on the currency filter field
3. Select "USD" from the currency list
4. Observe the results

**Expected Results:**

- ✅ Only offers priced in USD are shown
- ✅ All displayed offers show USD in their price
- ✅ No XEC or EUR priced offers are visible
- ✅ Infinite scroll works (if there are >20 USD offers)
- ✅ Result count is accurate

**Verification:**

- Check that each offer displays: `X XEC / unit (Y USD)`
- The USD amount should be visible in parentheses

---

### Test 3: Filter by XEC

**Steps:**

1. Navigate to Shopping tab
2. Click on the currency filter field
3. Select "XEC" from the currency list
4. Observe the results

**Expected Results:**

- ✅ Only offers priced in XEC are shown
- ✅ All displayed offers show only XEC price (no currency in parentheses)
- ✅ No USD or EUR priced offers are visible
- ✅ Infinite scroll works

**Verification:**

- Check that each offer displays: `X XEC / unit` (without additional currency)

---

### Test 4: Switch Between Currencies

**Steps:**

1. Navigate to Shopping tab
2. Select "USD" filter
3. Wait for results to load
4. Switch to "XEC" filter
5. Wait for results to load
6. Switch back to "USD"

**Expected Results:**

- ✅ Results update immediately on filter change
- ✅ No duplicate items appear
- ✅ Previous filter is cleared when switching
- ✅ Loading indicators appear during fetch
- ✅ No console errors

---

### Test 5: Clear Currency Filter

**Steps:**

1. Navigate to Shopping tab
2. Select "USD" filter
3. Click the X button to clear the filter
4. Observe the results

**Expected Results:**

- ✅ All Goods & Services offers are displayed again
- ✅ Offers with all currencies are visible
- ✅ Filter field shows placeholder text
- ✅ Results refresh correctly

---

### Test 6: Pagination with Filter

**Steps:**

1. Navigate to Shopping tab
2. Select a popular currency (e.g., "USD")
3. Scroll to the bottom of the list
4. Continue scrolling to trigger infinite scroll
5. Verify more items load

**Expected Results:**

- ✅ Additional USD-priced offers load
- ✅ `hasMore` flag is accurate
- ✅ No items repeat
- ✅ Loading indicator appears at bottom
- ✅ Scroll position is maintained

---

### Test 7: Filter with No Results

**Steps:**

1. Navigate to Shopping tab
2. If possible, select a currency with no offers (e.g., "JPY")
3. Observe the results

**Expected Results:**

- ✅ Empty state is displayed
- ✅ No error messages
- ✅ "No offers found" or similar message
- ✅ Can still change filters

---

### Test 8: Performance Check

**Steps:**

1. Open browser DevTools > Network tab
2. Navigate to Shopping tab
3. Select "USD" filter
4. Check the GraphQL query

**Expected Results:**

- ✅ GraphQL query includes `tickerPriceGoodsServices: "USD"`
- ✅ Response time < 500ms
- ✅ Response contains only USD offers
- ✅ Page size is reasonable (e.g., 20 items)

**Check Network Request:**

```json
{
  "query": "...",
  "variables": {
    "filter": {
      "isBuyOffer": true,
      "paymentMethodIds": [5],
      "tickerPriceGoodsServices": "USD"
    }
  }
}
```

---

### Test 9: Cache Behavior

**Steps:**

1. Navigate to Shopping tab
2. Select "USD" filter
3. Navigate to another tab (e.g., "My Offers")
4. Return to Shopping tab
5. Verify filter state

**Expected Results:**

- ✅ USD filter is still active
- ✅ Results are cached and display instantly
- ✅ No unnecessary refetch
- ✅ Can still change filters

---

### Test 10: Amount + Currency Filter

**Steps:**

1. Navigate to Shopping tab
2. Select "USD" filter
3. Enter an amount (e.g., "50")
4. Observe results

**Expected Results:**

- ✅ Only USD offers are shown
- ✅ Only offers >= $50 USD are shown
- ✅ Both filters work together
- ✅ Clear button removes both filters

---

## 🔍 GraphQL Query Verification

### Expected Query Structure

```graphql
query InfiniteOfferFilterDatabase($first: Int!, $after: String, $offerFilterInput: OfferFilterInput) {
  offers(first: $first, after: $after, filter: $offerFilterInput) {
    edges {
      node {
        id
        tickerPriceGoodsServices
        priceGoodsServices
        message
        # ... other fields
      }
    }
    pageInfo {
      hasNextPage
      endCursor
    }
  }
}
```

### Expected Variables (USD Filter)

```json
{
  "first": 20,
  "offerFilterInput": {
    "isBuyOffer": true,
    "paymentMethodIds": [5],
    "tickerPriceGoodsServices": "USD"
  }
}
```

### Expected Response

```json
{
  "data": {
    "offers": {
      "edges": [
        {
          "node": {
            "id": "...",
            "tickerPriceGoodsServices": "USD",
            "priceGoodsServices": 50.0,
            "message": "Selling laptop"
          }
        }
        // All items should have tickerPriceGoodsServices: "USD"
      ],
      "pageInfo": {
        "hasNextPage": true,
        "endCursor": "..."
      }
    }
  }
}
```

## 🚨 Common Issues to Watch For

### Issue 1: Filter Not Working

**Symptoms**: All offers shown regardless of currency selection  
**Check**:

- ✅ Verify `tickerPriceGoodsServices` is in GraphQL variables
- ✅ Check backend logs for query execution
- ✅ Verify database has the field populated

### Issue 2: Pagination Broken

**Symptoms**: Duplicate items or incorrect `hasMore` flag  
**Check**:

- ✅ Ensure client-side filtering is completely removed
- ✅ Verify `dataFilter.length` matches backend response
- ✅ Check cursor-based pagination logic

### Issue 3: Cache Stale Data

**Symptoms**: Old results show when switching filters  
**Check**:

- ✅ Verify different filters create different cache keys
- ✅ Check RTK Query cache invalidation
- ✅ Clear cache and test again

### Issue 4: Filter Not Cleared

**Symptoms**: Filter persists when it shouldn't  
**Check**:

- ✅ Verify `handleResetFilterCurrency` sets `tickerPriceGoodsServices: null`
- ✅ Check state updates correctly
- ✅ Verify UI reflects the reset

## ✅ Acceptance Criteria

All of these must pass:

- [ ] **Functionality**: Currency filter shows only matching offers
- [ ] **Performance**: Query response time < 500ms
- [ ] **Pagination**: Infinite scroll loads correct items
- [ ] **Cache**: Filters create separate cache entries
- [ ] **UX**: Filter changes are immediate and smooth
- [ ] **No Errors**: Console is clean, no TypeScript/runtime errors
- [ ] **Compatibility**: Works on Chrome, Firefox, Safari
- [ ] **Mobile**: Works on mobile devices (responsive)

## 🐛 Bug Report Template

If you find issues, report using this format:

```
**Bug**: [Brief description]

**Steps to Reproduce**:
1. ...
2. ...
3. ...

**Expected**: [What should happen]

**Actual**: [What actually happens]

**Currency**: [USD/XEC/EUR/etc.]

**Browser**: [Chrome/Firefox/etc.]

**Console Errors**: [Copy any errors]

**Network Request**: [GraphQL query variables]

**Screenshots**: [If applicable]
```

## 🚀 Next Steps After Testing

1. **If All Tests Pass**:

   - ✅ Mark feature as complete
   - ✅ Update documentation
   - ✅ Deploy to production
   - ✅ Monitor performance metrics

2. **If Issues Found**:
   - 🔴 Document bugs with details above
   - 🔴 Prioritize critical issues
   - 🔴 Fix and retest
   - 🔴 Repeat until all tests pass

## 📞 Support

- **Frontend Issues**: Check `shopping/page.tsx` and `ShoppingFilterComponent.tsx`
- **Backend Issues**: Check GraphQL resolver and database query
- **Network Issues**: Check browser DevTools > Network tab
- **Type Issues**: Verify `OfferFilterInput` type includes `tickerPriceGoodsServices`

---

**Ready to Test!** Start with Test 1 and work through the checklist. 🎉
