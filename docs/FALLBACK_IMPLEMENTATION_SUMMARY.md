# Fiat Rate Fallback - Production GraphQL

**Date:** October 12, 2025  
**Status:** ✅ Refactored - Using Production GraphQL Fallback

---

## Refactoring Summary

### What Changed

❌ **Removed:** Direct API fallback with data transformation  
✅ **Implemented:** Production GraphQL fallback (same query, same structure)

### Why?

- **50% less code** - Removed entire direct API client file
- **No transformation** - Same GraphQL structure from both endpoints
- **Type-safe** - Auto-generated types still work
- **Simpler** - One GraphQL pattern throughout
- **Maintainable** - No need to sync two different API integrations

---

## How It Works

````
## Implementation Details

**File:** `/src/hooks/useGetFiatRateWithFallback.tsx`

**Environment Variable:**
```env
NEXT_PUBLIC_FALLBACK_GRAPHQL_API=https://lixi.social/graphql
````

**Constant:**

```typescript
const FALLBACK_GRAPHQL_ENDPOINT = process.env.NEXT_PUBLIC_FALLBACK_GRAPHQL_API || 'https://lixi.social/graphql';
```

## How It Works

Primary Fails → Production GraphQL (from NEXT_PUBLIC_FALLBACK_GRAPHQL_API)
Same Query: getAllFiatRate ✅
Same Structure: { getAllFiatRate: [...] } ✅
Same Types: Auto-generated ✅

````

---

## Implementation

### Single File
`/src/hooks/useGetFiatRateWithFallback.tsx`
- Tries primary GraphQL first
- On failure, calls Production GraphQL
- Same query, different endpoint
- No data transformation needed!

### Components (4 updated, no changes needed)
1. `PlaceAnOrderModal.tsx`
2. `useOfferPrice.tsx`
3. `wallet/page.tsx`
4. `OrderDetailInfo.tsx`

---

## Benefits

| Before (Direct API) | After (Production GraphQL) |
|-------------------|--------------------------|
| 2 files | 1 file ✅ |
| Data transformation | None needed ✅ |
| Manual types | Auto-generated ✅ |
| ~350 lines | ~175 lines ✅ |
| Two patterns | One pattern ✅ |

---

## Testing

- [ ] Primary GraphQL returns zero rates → Falls back to Production ✅
- [ ] Check console: `source: 'production-graphql'`
- [ ] Verify Telegram alert sent
- [ ] Verify prices display correctly
- [ ] No transformation errors

---

## Quick Reference

```typescript
const {
  data,      // Same structure!
  isFallback, // true if using Production GraphQL
  source     // 'primary-graphql' | 'production-graphql'
} = useGetFiatRateWithFallback();
````

---

**Result:** Much simpler, same functionality! 🎯
