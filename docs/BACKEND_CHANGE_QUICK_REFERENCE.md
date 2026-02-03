# Quick Reference: Backend Change for Shopping Filter

## TL;DR

**What**: Add `tickerPriceGoodsServices` field to `OfferFilterInput` GraphQL type  
**Why**: Enable server-side filtering of Goods & Services offers by price currency  
**Impact**: Fixes pagination, improves performance, better UX

## Quick Implementation

### 1. GraphQL Schema (Add this field)

```graphql
input OfferFilterInput {
  # ... existing fields ...
  tickerPriceGoodsServices: String
}
```

### 2. Backend Query (Add this condition)

```typescript
if (filter.tickerPriceGoodsServices) {
  queryBuilder.andWhere('offer.tickerPriceGoodsServices = :tickerPriceGoodsServices', {
    tickerPriceGoodsServices: filter.tickerPriceGoodsServices
  });
}
```

### 3. Database Index (Run this migration)

```sql
CREATE INDEX idx_offer_ticker_price_goods_services
ON offer(tickerPriceGoodsServices)
WHERE tickerPriceGoodsServices IS NOT NULL;
```

### 4. TypeScript Type (Update interface)

```typescript
export interface OfferFilterInput {
  // ... existing fields ...
  tickerPriceGoodsServices?: string; // NEW
}
```

## Test Query

```graphql
query GetGoodsServicesOffers {
  offers(
    filter: {
      paymentMethodIds: [5]
      isBuyOffer: true
      tickerPriceGoodsServices: "USD" # NEW FILTER
    }
    first: 20
  ) {
    edges {
      node {
        id
        tickerPriceGoodsServices
        priceGoodsServices
        message
      }
    }
    pageInfo {
      hasNextPage
      endCursor
    }
  }
}
```

## Valid Currency Values

- `"XEC"` - eCash (default)
- `"USD"` - US Dollar
- `"EUR"` - Euro
- `"GBP"` - British Pound
- `"JPY"` - Japanese Yen
- etc. (any valid currency ticker)

## Acceptance Test

```bash
# Should return only offers priced in USD
curl -X POST https://api.localecash.com/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "query { offers(filter: { tickerPriceGoodsServices: \"USD\" }) { edges { node { id tickerPriceGoodsServices } } } }"
  }'
```

Expected: All returned offers have `tickerPriceGoodsServices: "USD"`

## Frontend Will Use Like This (After Backend Deploy)

```typescript
// Shopping page filter
const filterConfig = {
  isBuyOffer: true,
  paymentMethodIds: [5], // GOODS_SERVICES
  tickerPriceGoodsServices: 'USD' // Filter by USD-priced items
};

// This gets passed directly to the GraphQL query
// No more client-side filtering needed!
```

---

See `BACKEND_CHANGE_REQUEST_GOODS_SERVICES_FILTER.md` for full details.
