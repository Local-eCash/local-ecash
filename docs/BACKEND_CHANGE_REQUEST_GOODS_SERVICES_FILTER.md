# Backend Change Request: Add Goods & Services Currency Filter Support

**Project**: Local eCash (lixi backend)  
**Date**: October 12, 2025  
**Priority**: Medium  
**Affects**: Offer filtering API, GraphQL schema

## 📋 Summary

Add support for filtering Goods & Services offers by their price currency (`tickerPriceGoodsServices` field) in the offer filtering API. Currently, the frontend Shopping tab requires client-side filtering which causes performance issues, breaks pagination, and provides poor UX.

## 🎯 Problem Statement

### Current Situation

- The Shopping tab displays Goods & Services offers (where `paymentMethodIds` includes `PAYMENT_METHOD.GOODS_SERVICES = 5`)
- Each offer has a `tickerPriceGoodsServices` field that stores the currency ticker (e.g., "USD", "XEC", "EUR")
- Users need to filter offers by the currency in which goods/services are priced
- **Current workaround**: Client-side filtering after fetching all data

### Issues with Client-Side Filtering

1. **Performance**: All data is fetched then filtered, wasting bandwidth
2. **Pagination Broken**: Infinite scroll shows incorrect `hasNext` flags
3. **Cache Issues**: RTK Query cache doesn't match filtered results
4. **Poor UX**: Users see loading states for data they can't use
5. **Scalability**: Won't work with large datasets

## 🔧 Proposed Solution

Add a new optional field `tickerPriceGoodsServices` to the `OfferFilterInput` GraphQL input type to enable server-side filtering.

## 📐 Technical Specification

### 1. GraphQL Schema Changes

**Location**: Likely in `packages/lixi-models` or backend schema definitions

**Current `OfferFilterInput`** (inferred from frontend usage):

```graphql
input OfferFilterInput {
  isBuyOffer: Boolean
  paymentMethodIds: [Int!]
  fiatCurrency: String
  coin: String
  amount: Float
  countryName: String
  countryCode: String
  stateName: String
  adminCode: String
  cityName: String
  paymentApp: String
  coinOthers: String
  offerOrder: OfferOrderInput
}
```

**Proposed Addition**:

```graphql
input OfferFilterInput {
  isBuyOffer: Boolean
  paymentMethodIds: [Int!]
  fiatCurrency: String
  coin: String
  amount: Float
  countryName: String
  countryCode: String
  stateName: String
  adminCode: String
  cityName: String
  paymentApp: String
  coinOthers: String
  tickerPriceGoodsServices: String # NEW FIELD - Filter by G&S price currency
  offerOrder: OfferOrderInput
}
```

### 2. Database Query Implementation

**Location**: Offer resolver or service layer

**Implementation Logic**:

```typescript
// Pseudocode for the resolver/service
function buildOfferQuery(filter: OfferFilterInput) {
  const queryBuilder = /* ... existing query builder ... */;

  // ... existing filter conditions ...

  // NEW: Add tickerPriceGoodsServices filter
  if (filter.tickerPriceGoodsServices) {
    queryBuilder.andWhere(
      'offer.tickerPriceGoodsServices = :tickerPriceGoodsServices',
      { tickerPriceGoodsServices: filter.tickerPriceGoodsServices }
    );
  }

  return queryBuilder;
}
```

### 3. Database Index (Recommended for Performance)

**Purpose**: Optimize queries filtering by `tickerPriceGoodsServices`

**SQL**:

```sql
-- Create an index for efficient filtering
CREATE INDEX IF NOT EXISTS idx_offer_ticker_price_goods_services
ON offer(tickerPriceGoodsServices)
WHERE tickerPriceGoodsServices IS NOT NULL;

-- Optional: Composite index if often filtered with paymentMethodIds
CREATE INDEX IF NOT EXISTS idx_offer_payment_ticker
ON offer(paymentMethodIds, tickerPriceGoodsServices)
WHERE tickerPriceGoodsServices IS NOT NULL;
```

### 4. TypeScript Type Updates

**Location**: `@bcpros/redux-store` package or type definitions

**Update `OfferFilterInput` interface**:

```typescript
export interface OfferFilterInput {
  isBuyOffer?: boolean;
  paymentMethodIds?: number[];
  fiatCurrency?: string;
  coin?: string;
  amount?: number;
  countryName?: string;
  countryCode?: string;
  stateName?: string;
  adminCode?: string;
  cityName?: string;
  paymentApp?: string;
  coinOthers?: string;
  tickerPriceGoodsServices?: string; // NEW FIELD
  offerOrder?: {
    field: OfferOrderField;
    direction: OrderDirection;
  };
}
```

## 📊 Database Schema Reference

### Offer Table Structure (Assumed)

```sql
CREATE TABLE offer (
  id UUID PRIMARY KEY,
  -- ... other fields ...
  paymentMethodIds INTEGER[],
  tickerPriceGoodsServices VARCHAR(10),  -- Currency ticker for G&S pricing
  priceGoodsServices DECIMAL,            -- Price amount
  -- ... other fields ...
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### Sample Data

| id  | paymentMethodIds | tickerPriceGoodsServices | priceGoodsServices | message            |
| --- | ---------------- | ------------------------ | ------------------ | ------------------ |
| 1   | [5]              | USD                      | 50.00              | Selling laptop     |
| 2   | [5]              | XEC                      | 1000000            | Web design service |
| 3   | [5]              | EUR                      | 45.00              | Bike for sale      |
| 4   | [5]              | USD                      | 100.00             | Phone repair       |

### Query Examples

```sql
-- Current query (no currency filter)
SELECT * FROM offer
WHERE paymentMethodIds @> ARRAY[5]
AND isBuyOffer = true;
-- Returns: All 4 offers

-- Desired query with new filter
SELECT * FROM offer
WHERE paymentMethodIds @> ARRAY[5]
AND isBuyOffer = true
AND tickerPriceGoodsServices = 'USD';
-- Returns: Only offers 1 and 4
```

## 🧪 Testing Requirements

### Unit Tests

```typescript
describe('OfferFilterInput with tickerPriceGoodsServices', () => {
  it('should filter offers by tickerPriceGoodsServices = USD', async () => {
    const result = await queryOffers({
      paymentMethodIds: [5],
      isBuyOffer: true,
      tickerPriceGoodsServices: 'USD'
    });

    expect(result.every(offer => offer.tickerPriceGoodsServices === 'USD')).toBe(true);
  });

  it('should return all offers when tickerPriceGoodsServices is null', async () => {
    const result = await queryOffers({
      paymentMethodIds: [5],
      isBuyOffer: true,
      tickerPriceGoodsServices: null
    });

    expect(result.length).toBeGreaterThan(0);
  });

  it('should return empty array for non-existent currency', async () => {
    const result = await queryOffers({
      paymentMethodIds: [5],
      tickerPriceGoodsServices: 'INVALID_CURRENCY'
    });

    expect(result).toEqual([]);
  });
});
```

### Integration Tests

- [ ] Test filtering with various currency codes: USD, XEC, EUR, GBP, etc.
- [ ] Test pagination works correctly with the filter
- [ ] Test combining `tickerPriceGoodsServices` with other filters
- [ ] Test performance with large datasets (>10,000 offers)
- [ ] Test GraphQL query execution time (should be <100ms)

### Manual Testing Scenarios

1. **Scenario 1**: Filter by USD
   - Input: `tickerPriceGoodsServices: "USD"`
   - Expected: Only offers priced in USD are returned
2. **Scenario 2**: Filter by XEC
   - Input: `tickerPriceGoodsServices: "XEC"`
   - Expected: Only offers priced in XEC are returned
3. **Scenario 3**: No filter
   - Input: `tickerPriceGoodsServices: null`
   - Expected: All Goods & Services offers returned
4. **Scenario 4**: Combined filters
   - Input: `tickerPriceGoodsServices: "USD"` + `amount: 50`
   - Expected: Only USD offers with amount >= 50

## 🔄 Frontend Integration (After Backend Deployed)

Once this backend change is deployed, the frontend will be updated to:

1. **Remove client-side filtering logic**:

```typescript
// BEFORE (current - with client-side filtering)
const filteredData = useMemo(() => {
  if (!shoppingFilterConfig.coin && !shoppingFilterConfig.fiatCurrency) {
    return dataFilter;
  }
  return dataFilter.filter(item => {
    // Client-side filtering logic
  });
}, [dataFilter, shoppingFilterConfig]);

// AFTER (with backend support)
// Use dataFilter directly - no client-side filtering needed!
```

2. **Update ShoppingFilterComponent**:

```typescript
// Pass currency to backend filter
case PAYMENT_METHOD.GOODS_SERVICES:
  updatedConfig = {
    ...updatedConfig,
    tickerPriceGoodsServices: filterValue?.value ?? '',  // NEW
    fiatCurrency: null,
    coin: null,
    amount: null
  };
  break;
```

## 📈 Expected Benefits

### Performance Improvements

- **Bandwidth**: Reduce data transfer by ~70-90% when filtering
- **Query Time**: <100ms for filtered queries vs. fetching all data
- **Client Processing**: Eliminate client-side filtering overhead

### User Experience Improvements

- **Faster Load Times**: Only relevant data is fetched
- **Accurate Pagination**: Infinite scroll works correctly
- **Better Caching**: RTK Query cache matches actual results
- **Result Count**: Show accurate number of matching offers

### Scalability

- **Large Datasets**: Works efficiently with thousands of offers
- **Future-Proof**: Foundation for additional currency filters

## 🔍 Edge Cases to Handle

1. **Null/Empty Values**:

   - `tickerPriceGoodsServices: null` → Return all offers (no filter)
   - `tickerPriceGoodsServices: ""` → Return all offers (no filter)

2. **Case Sensitivity**:

   - Recommend case-insensitive comparison: `UPPER(tickerPriceGoodsServices) = UPPER(:input)`

3. **Invalid Currencies**:

   - Valid currencies: XEC, USD, EUR, GBP, JPY, etc. (from LIST_TICKER_GOODS_SERVICES)
   - Invalid input should return empty array, not error

4. **Database Null Values**:
   - Some offers might have `tickerPriceGoodsServices = NULL`
   - These should not match any currency filter

## 📦 Related Files & References

### Frontend Files Using This Filter

- `apps/telegram-ecash-escrow/src/app/shopping/page.tsx`
- `apps/telegram-ecash-escrow/src/components/FilterOffer/ShoppingFilterComponent.tsx`
- `apps/telegram-ecash-escrow/src/components/FilterOffer/FilterComponent.tsx`

### Backend Files to Modify (Estimated)

- GraphQL schema definition file (e.g., `offer.graphql`)
- Offer resolver/service file (e.g., `offer.resolver.ts`, `offer.service.ts`)
- TypeScript type definitions (e.g., `types.ts`)
- Database migration file (for index)

### Constants Reference

```typescript
// From frontend constants
export const LIST_TICKER_GOODS_SERVICES = [
  { id: 1, name: 'XEC' },
  { id: 2, name: 'USD' }
];

export const DEFAULT_TICKER_GOODS_SERVICES = 'XEC';

// Payment method enum
export enum PAYMENT_METHOD {
  CASH_IN_PERSON = 1,
  BANK_TRANSFER = 2,
  PAYMENT_APP = 3,
  CRYPTO = 4,
  GOODS_SERVICES = 5
}
```

## ✅ Acceptance Criteria

- [ ] `tickerPriceGoodsServices` field added to GraphQL `OfferFilterInput`
- [ ] Backend resolver handles the new filter correctly
- [ ] Database index created for performance
- [ ] Unit tests pass with >80% coverage
- [ ] Integration tests pass
- [ ] Query performance is <100ms for typical queries
- [ ] Pagination works correctly with the filter
- [ ] GraphQL documentation updated
- [ ] Type definitions exported to frontend packages
- [ ] Deployed to staging environment for testing
- [ ] Frontend team notified to proceed with integration

## 📝 Implementation Checklist

### Backend Tasks

- [ ] Update GraphQL schema with new field
- [ ] Modify offer resolver/service to handle filter
- [ ] Add database migration for index
- [ ] Write unit tests
- [ ] Write integration tests
- [ ] Update API documentation
- [ ] Test with GraphQL Playground
- [ ] Code review
- [ ] Deploy to staging
- [ ] Performance testing
- [ ] Deploy to production

### Frontend Tasks (After Backend)

- [ ] Update `OfferFilterInput` type (if auto-generated)
- [ ] Remove client-side filtering logic
- [ ] Update `ShoppingFilterComponent`
- [ ] Test pagination and infinite scroll
- [ ] Test cache behavior
- [ ] Update documentation
- [ ] QA testing
- [ ] Deploy to production

## 🤝 Questions & Contact

For questions or clarifications:

- Frontend implementation: See `apps/telegram-ecash-escrow/src/app/shopping/`
- Current workaround: Client-side filtering in `shopping/page.tsx`
- Expected currencies: XEC, USD, EUR, GBP, JPY (expandable)

## 📚 Additional Context

### Why Not Use Existing `coin` or `fiatCurrency` Fields?

The existing `coin` and `fiatCurrency` fields are designed for P2P trading where:

- `fiatCurrency`: Filter by the fiat currency users pay **with** (e.g., buy XEC with USD)
- `coin`: Filter by the cryptocurrency being traded (e.g., buy BTC, ETH)

For Goods & Services:

- `tickerPriceGoodsServices`: The currency in which the item is **priced**
- This is fundamentally different from P2P currency exchange

**Example**:

- P2P Offer: "I want to buy XEC with USD" → Uses `fiatCurrency: "USD"`
- Goods Offer: "Selling a laptop for 500 USD" → Uses `tickerPriceGoodsServices: "USD"`

### Current Workaround Code (to be removed after backend update)

```typescript
// Current client-side filtering (TEMPORARY)
const filteredData = useMemo(() => {
  if (!shoppingFilterConfig.coin && !shoppingFilterConfig.fiatCurrency) {
    return dataFilter;
  }

  const selectedCurrency = shoppingFilterConfig.coin || shoppingFilterConfig.fiatCurrency;

  return dataFilter.filter((item: TimelineQueryItem) => {
    const post = item.data as any;
    const offer = post?.postOffer;
    return offer?.tickerPriceGoodsServices === selectedCurrency;
  });
}, [dataFilter, shoppingFilterConfig.coin, shoppingFilterConfig.fiatCurrency]);
```

---

**End of Document**

Please implement this change in the lixi backend. Once deployed, notify the frontend team to integrate the new filter field.
