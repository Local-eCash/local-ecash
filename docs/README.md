# Documentation Index

This folder contains all technical documentation for the Local eCash project.

## 📚 Table of Contents

### 🎯 Feature Implementation

- **[IMPLEMENTATION_COMPLETE.md](./IMPLEMENTATION_COMPLETE.md)**
  - Complete summary of Shopping filter implementation
  - Status: ✅ Ready for testing
  - Backend integration with `tickerPriceGoodsServices` field

### 🔧 Backend Changes

- **[BACKEND_CHANGE_REQUEST_GOODS_SERVICES_FILTER.md](./BACKEND_CHANGE_REQUEST_GOODS_SERVICES_FILTER.md)**

  - Comprehensive backend API specification
  - GraphQL schema changes for currency filtering
  - Database queries and indexing requirements
  - Performance expectations and testing requirements

- **[BACKEND_CHANGE_QUICK_REFERENCE.md](./BACKEND_CHANGE_QUICK_REFERENCE.md)**

  - Quick reference guide for backend team
  - Step-by-step implementation checklist
  - Code examples and testing procedures

- **[BACKEND_FIAT_RATE_CONFIGURATION.md](./BACKEND_FIAT_RATE_CONFIGURATION.md)** ⚠️ **ACTION REQUIRED**
  - Fiat rate API configuration guide
  - How to configure development API URL
  - Required: `https://aws-dev.abcpay.cash/bws/api/v3/fiatrates/`
  - Caching and error handling recommendations

### 🐛 Bug Fixes

- **[BUGFIX_GOODS_SERVICES_VALIDATION.md](./BUGFIX_GOODS_SERVICES_VALIDATION.md)**

  - Initial validation bug fix (V1)
  - Fixed incorrect "5.46 XEC" error for unit-based offers
  - Changed validation logic to check unit quantity

- **[BUGFIX_GOODS_SERVICES_VALIDATION_V2.md](./BUGFIX_GOODS_SERVICES_VALIDATION_V2.md)**
  - Enhanced validation fix (V2)
  - Addresses all 3 issues: validation, fiat conversion, and display
  - Smart 5.46 XEC minimum validation
  - XEC per unit price display
  - Complete with examples and test scenarios

### 🚨 Critical Issues

- **[CRITICAL_FIAT_SERVICE_DOWN.md](./CRITICAL_FIAT_SERVICE_DOWN.md)**
  - **STATUS**: 🔴 CRITICAL - Requires backend fix
  - Fiat rate service returning null
  - Impact: All USD/EUR/GBP priced offers blocked
  - Frontend error handling added
  - Backend troubleshooting guide included

### 📱 Infrastructure

- **[TELEGRAM_ALERT_SYSTEM.md](./TELEGRAM_ALERT_SYSTEM.md)**

  - Telegram alert system implementation
  - API reference and usage examples
  - Security considerations
  - Automatic alerts for critical service failures
  - Works with both channels and groups

- **[TELEGRAM_GROUP_SETUP.md](./TELEGRAM_GROUP_SETUP.md)** ⭐ **Recommended**
  - Quick setup guide for Telegram **groups** (team discussion)
  - Step-by-step with screenshots
  - Why groups are better for team collaboration
  - Troubleshooting common issues
  - Best practices for alert management

### 🧪 Testing

- **[TESTING_PLAN_SHOPPING_FILTER.md](./TESTING_PLAN_SHOPPING_FILTER.md)**
  - Comprehensive testing plan for Shopping filter
  - 10 test scenarios with expected results
  - GraphQL verification steps
  - Performance benchmarks
  - Bug report template

---

## 🚀 Quick Start Guides

### For Frontend Developers

1. Read [IMPLEMENTATION_COMPLETE.md](./IMPLEMENTATION_COMPLETE.md) for feature overview
2. Check [BUGFIX_GOODS_SERVICES_VALIDATION_V2.md](./BUGFIX_GOODS_SERVICES_VALIDATION_V2.md) for validation logic
3. Review [TESTING_PLAN_SHOPPING_FILTER.md](./TESTING_PLAN_SHOPPING_FILTER.md) for testing

### For Backend Developers

1. Start with [BACKEND_CHANGE_QUICK_REFERENCE.md](./BACKEND_CHANGE_QUICK_REFERENCE.md)
2. Detailed specs in [BACKEND_CHANGE_REQUEST_GOODS_SERVICES_FILTER.md](./BACKEND_CHANGE_REQUEST_GOODS_SERVICES_FILTER.md)
3. Fix fiat service using [CRITICAL_FIAT_SERVICE_DOWN.md](./CRITICAL_FIAT_SERVICE_DOWN.md)

### For DevOps

1. Setup alerts: [TELEGRAM_ALERT_SYSTEM.md](./TELEGRAM_ALERT_SYSTEM.md)
2. Monitor critical issues: [CRITICAL_FIAT_SERVICE_DOWN.md](./CRITICAL_FIAT_SERVICE_DOWN.md)

---

## 📊 Current Status Summary

### ✅ Completed

- Shopping tab with cart icon
- Backend API filtering by currency
- Frontend integration with `tickerPriceGoodsServices`
- Unit quantity validation for Goods & Services
- Smart 5.46 XEC minimum validation
- XEC per unit price display
- Error handling for fiat service failures
- Telegram alert system

### 🔴 Blocked/Critical

- **Fiat Rate Service Down** - See [CRITICAL_FIAT_SERVICE_DOWN.md](./CRITICAL_FIAT_SERVICE_DOWN.md)
  - All fiat-priced offers (USD/EUR/etc.) are blocked
  - Backend team needs to fix `getAllFiatRate` resolver

### ⏳ Pending

- Configure Telegram alert channel (channel ID needed)
- Test currency filtering (blocked by fiat service)
- Test pagination and infinite scroll
- Full end-to-end testing

---

## 🔗 Related Files in Codebase

### Frontend

- **Shopping Page**: `apps/telegram-ecash-escrow/src/app/shopping/page.tsx`
- **Filter Component**: `apps/telegram-ecash-escrow/src/components/FilterOffer/ShoppingFilterComponent.tsx`
- **Order Modal**: `apps/telegram-ecash-escrow/src/components/PlaceAnOrderModal/PlaceAnOrderModal.tsx`
- **Footer Navigation**: `apps/telegram-ecash-escrow/src/components/Footer/Footer.tsx`
- **Alert Utility**: `apps/telegram-ecash-escrow/src/utils/telegram-alerts.ts`

### API Routes

- **Telegram Alerts**: `apps/telegram-ecash-escrow/src/app/api/alerts/telegram/route.ts`

### Backend (Reference)

- GraphQL Schema: `tickerPriceGoodsServices` field in `OfferFilterInput`
- Resolver: Offer filtering by currency ticker

---

## 📝 Document Maintenance

### Adding New Documentation

1. Create markdown file in this folder
2. Follow naming convention: `[TYPE]_[NAME].md`
3. Add entry to this README
4. Link from related documents

### Document Types

- `IMPLEMENTATION_` - Feature implementation summaries
- `BACKEND_` - Backend specifications and guides
- `BUGFIX_` - Bug fix documentation
- `CRITICAL_` - Critical issues requiring immediate attention
- `TESTING_` - Test plans and procedures
- `[FEATURE]_` - Feature-specific documentation

---

**Last Updated**: October 12, 2025
