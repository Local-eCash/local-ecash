# Session Summary: Backend Fallback Decision

**Date**: October 12, 2025  
**Decision**: Move fiat rate fallback logic from frontend to backend

---

## Quick Summary

We initially implemented a frontend fallback system where the React app would directly call the Production GraphQL API if the primary API failed. However, we encountered CORS issues and realized this approach had architectural problems. The user made the excellent decision to **move fallback logic to the backend GraphQL resolver instead**.

---

## Timeline

### 1. Initial Approach: Frontend Fallback

- Created `useGetFiatRateWithFallback` hook
- Added `NEXT_PUBLIC_FALLBACK_GRAPHQL_API` environment variable
- Hook would fallback to Production GraphQL on primary failure
- Updated 4 components to use new hook

### 2. CORS Issue Discovered

- Production GraphQL endpoint (`https://lixi.social/graphql`) has CORS restrictions
- Would not accept requests from `localhost:3000`
- Only allows requests from production domains

### 3. Architecture Question

**User's insight**: "I think let's do at the server instead. the backend graphql could simply refer to 2 rate APIs as fallback and the server would not need to do anything else. Because if the graphql failed, most other services will fail too."

**Key realization**: If the entire GraphQL backend is down, fiat rates are the least of your problems - offers, orders, disputes, authentication, everything would fail.

### 4. Decision: Backend Implementation

**Benefits**:

- ✅ No CORS issues (backend-to-backend calls)
- ✅ Centralized logic (benefits all clients)
- ✅ Simpler frontend (just calls GraphQL normally)
- ✅ Better monitoring (backend logs which source used)
- ✅ Consistent data (all users get same source)

---

## Changes Made

### Frontend Cleanup (Reverted)

**Files Deleted:**

- `/src/hooks/useGetFiatRateWithFallback.tsx` (175 lines)

**Files Restored:**

- `/src/components/PlaceAnOrderModal/PlaceAnOrderModal.tsx`
  - Removed: `import { useGetFiatRateWithFallback }`
  - Restored: Direct use of `useGetAllFiatRateQuery()`
- `/src/hooks/useOfferPrice.tsx`
  - Removed fallback hook usage
  - Restored original fiat query
- `/src/app/wallet/page.tsx`
  - Removed fallback hook usage
  - Restored original fiat query
- `/src/components/DetailInfo/OrderDetailInfo.tsx`
  - Removed fallback hook usage
  - Restored original fiat query

**Environment Variable Removed:**

```properties
# Removed from .env
NEXT_PUBLIC_FALLBACK_GRAPHQL_API=https://lixi.social/graphql
```

**Result**: Frontend code is now back to its original simple state - just calls `useGetAllFiatRateQuery()` and expects the backend to handle reliability.

### Backend Recommendation Created

**New Document**: `/docs/BACKEND_FIAT_FALLBACK_RECOMMENDATION.md`

**Contents**:

1. **Executive Summary**: Why backend fallback is better
2. **Architecture Diagram**: Flow from frontend → backend → primary/fallback APIs
3. **Implementation Pseudocode**: Complete resolver with fallback logic
4. **Error Detection**: Validation for null/empty/zero rates
5. **Monitoring & Alerts**: Telegram integration, metrics to track
6. **Testing Strategy**: Unit tests, integration tests
7. **Rollout Plan**: 5-phase implementation guide

**Key Implementation Points**:

```typescript
// Backend resolver logic
async function getAllFiatRate() {
  try {
    // Try primary API
    data = await fetchPrimaryAPI();
    if (!isValid(data)) throw error;
    return data;
  } catch (primaryError) {
    try {
      // Try fallback API
      data = await fetchFallbackAPI();
      sendTelegramAlert('fallback-activated');
      return data;
    } catch (fallbackError) {
      sendTelegramAlert('critical-both-failed');
      throw error;
    }
  }
}
```

---

## Compilation Status

✅ **Zero errors** - All files compile successfully  
✅ **All imports resolved** - RTK Query hooks properly imported  
✅ **No TypeScript errors** - Type definitions correct

---

## What Backend Team Needs to Do

### 1. Add Environment Variables

```bash
FIAT_RATE_PRIMARY_URL=https://aws-dev.abcpay.cash/bws/api/v3/fiatrates/
FIAT_RATE_FALLBACK_URL=https://aws.abcpay.cash/bws/api/v3/fiatrates/
FIAT_RATE_TIMEOUT=5000
FIAT_RATE_FALLBACK_ENABLED=true
```

### 2. Update GraphQL Resolver

- Modify `getAllFiatRate` resolver
- Add try/catch for primary API
- Add fallback logic on primary failure
- Add validation for null/empty/zero rates
- Return same structure regardless of source

### 3. Add Telegram Alerts

- Alert when fallback is used
- Critical alert when both APIs fail
- Include details: URLs, errors, timestamp

### 4. Add Monitoring

- Log which API source is used
- Track success/failure rates
- Monitor response times
- Alert if fallback used > 10% of time

### 5. Testing

- Unit tests for all scenarios
- Integration tests with real APIs
- Verify Telegram alerts sent correctly

---

## Frontend State

**Current Behavior**:

- Frontend calls `useGetAllFiatRateQuery()` as normal
- No awareness of fallback logic
- Expects backend to return valid data
- If backend returns error, shows generic error message
- Telegram alerts sent from backend (not frontend)

**Zero Changes Needed**:

- Once backend implements fallback, frontend will automatically benefit
- No code changes required in frontend
- No redeployment needed for frontend

---

## Why This Is Better

### Problem with Frontend Fallback

```
Frontend → Primary GraphQL ❌ Failed
         ↓
Frontend → Production GraphQL ❌ CORS Error
         ↓
Frontend → Direct API ❌ Different structure, need transformation
```

**Issues**:

- CORS restrictions
- Complex data transformation
- Duplicated code across clients
- Frontend needs to know about multiple endpoints
- Inconsistent data between users

### Solution with Backend Fallback

```
Frontend → Backend GraphQL → Primary API ❌ Failed
                           → Fallback API ✅ Success
                           ← Returns data to Frontend
```

**Benefits**:

- No CORS (backend-to-backend)
- Same data structure
- Centralized logic
- All clients benefit
- Consistent data

---

## Testing Checklist

### Backend Team (After Implementation)

- [ ] Primary API returns valid data → should use primary
- [ ] Primary API returns empty → should use fallback
- [ ] Primary API returns all zeros → should use fallback
- [ ] Primary API timeout → should use fallback
- [ ] Both APIs fail → should return error
- [ ] Telegram alert sent when fallback used
- [ ] Telegram critical alert sent when both fail
- [ ] Logs show which API source used

### Frontend Team (After Backend Deployment)

- [ ] Shopping page shows prices correctly
- [ ] Wallet shows balance conversion correctly
- [ ] Place order modal calculates prices correctly
- [ ] Order detail shows prices correctly
- [ ] No errors in browser console
- [ ] No CORS errors

---

## Documentation References

1. **`BACKEND_FIAT_FALLBACK_RECOMMENDATION.md`** - Complete implementation guide for backend
2. **`FIAT_SERVICE_ERROR_DETECTION.md`** - Error detection logic (still valid)
3. **`TELEGRAM_ALERT_SYSTEM.md`** - Alert system integration (still valid)
4. **`SESSION_SUMMARY_BACKEND_FALLBACK_DECISION.md`** - This document

---

## Next Steps

### Immediate (Backend Team)

1. Review `BACKEND_FIAT_FALLBACK_RECOMMENDATION.md`
2. Estimate implementation time
3. Schedule implementation
4. Implement fallback logic
5. Test in development
6. Deploy to staging
7. Deploy to production

### Future (Both Teams)

1. Monitor fallback usage rates
2. Investigate why dev API returns zeros
3. Fix dev API if possible
4. Add health check endpoint
5. Consider proactive API switching based on health

---

## Conclusion

**Decision Made**: ✅ Backend fallback is the correct architectural approach

**Frontend Status**: ✅ Cleaned up, ready for backend implementation

**Backend Status**: ⏳ Awaiting implementation (detailed guide provided)

**User Impact**: 🎯 Once backend implements fallback, fiat rate reliability will be dramatically improved with zero frontend changes needed.

---

**Document Owner**: Frontend Team  
**Action Owner**: Backend Team  
**Document Status**: ✅ Complete
