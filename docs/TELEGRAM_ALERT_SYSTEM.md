# 📢 Telegram Alert System - Setup & Usage

**Date**: October 12, 2025  
**Status**: ✅ **IMPLEMENTED**  
**Purpose**: Send critical service failure alerts to Telegram channel or group for immediate notification

---

## 🎯 Overview

The Telegram Alert System automatically sends notifications to a designated Telegram **channel** or **group** when critical errors occur, such as:

- Fiat service down (getAllFiatRate API failures)
- Backend API errors
- Service unavailability
- Database connection issues
- External API failures

This ensures the team gets **immediate notifications** of critical issues without needing to monitor logs constantly.

### 💬 Channel vs Group

- **Channel**: One-way broadcast, good for announcements (50+ people)
- **Group**: Two-way discussion, perfect for team collaboration (5-50 people) ✅ **Recommended**

> **👉 For team alerts with discussion, use a GROUP!**  
> See [TELEGRAM_GROUP_SETUP.md](./TELEGRAM_GROUP_SETUP.md) for detailed group setup instructions.

---

## 🔧 Setup Instructions

### Option A: Quick Setup with Telegram Group (Recommended)

See **[TELEGRAM_GROUP_SETUP.md](./TELEGRAM_GROUP_SETUP.md)** for complete group setup with team discussion features.

**Quick steps:**

1. Create a Telegram group
2. Add bot `@p2p_dex_bot` to the group
3. Make bot an admin with "Send Messages" permission
4. Get group chat ID (use @userinfobot)
5. Set `TELEGRAM_ALERT_CHANNEL_ID` in `.env`

### Option B: Channel Setup (One-way announcements)

### Step 1: Create a Telegram Channel

1. Open Telegram and create a new channel (public or private)
2. Name it something like "Local eCash Alerts" or "Production Alerts"
3. Add your bot (`@p2p_dex_bot`) as an administrator to the channel

### Step 2: Get the Channel ID

There are two ways to get your channel ID:

#### Method A: Using @userinfobot

1. Forward a message from your channel to **@userinfobot**
2. It will reply with the channel ID (format: `-100xxxxxxxxxx`)
3. Copy this ID

#### Method B: Using API

1. Send a message to your channel
2. Visit: `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates`
3. Look for your channel in the response, find the `chat` object
4. Copy the `id` field (it will be negative, e.g., `-1001234567890`)

### Step 3: Configure Environment Variable

Edit your `.env` file and add:

```bash
# Telegram Alert Configuration
TELEGRAM_ALERT_CHANNEL_ID="-1001234567890"  # Replace with your actual channel/group ID
```

**Important Notes**:

- Channel IDs usually start with `-100` (like `-1001234567890`)
- Group IDs are negative but shorter (like `-123456789`)
- Keep the quotes if the ID has special characters
- Do NOT commit the real ID to version control
- Use different channels/groups for dev/staging/production

### Step 4: Verify Configuration

Test the alert system:

```typescript
import { sendCriticalAlert } from '@/src/utils/telegram-alerts';

// Send a test alert
await sendCriticalAlert('Test Service', 'This is a test alert - system is working correctly!', {
  timestamp: new Date().toISOString()
});
```

You should receive a message in your Telegram channel that looks like:

```
🚨 CRITICAL: Test Service

This is a test alert - system is working correctly!

Details:
{
  "timestamp": "2025-10-12T10:30:00.000Z"
}

Time: 2025-10-12T10:30:00.000Z
Environment: production
```

---

## 📁 Files Created

### 1. API Route: `src/app/api/alerts/telegram/route.ts`

**Purpose**: Server-side endpoint to send Telegram messages securely

**Features**:

- Validates bot token and channel ID from environment
- Formats messages with severity levels
- Uses Telegram Bot API
- Includes error handling and logging
- Keeps bot token secure (server-side only)

**Endpoint**: `POST /api/alerts/telegram`

**Request Body**:

```json
{
  "message": "Service failure description",
  "severity": "critical",
  "service": "Service Name",
  "details": {
    "any": "additional",
    "context": "information"
  }
}
```

**Response** (success):

```json
{
  "success": true,
  "messageSent": true,
  "messageId": 12345
}
```

**Response** (error):

```json
{
  "error": "Failed to send Telegram alert",
  "details": {...}
}
```

### 2. Utility: `src/utils/telegram-alerts.ts`

**Purpose**: Helper functions to send alerts from anywhere in the app

**Functions**:

#### `sendTelegramAlert(payload)`

Generic function to send any alert

```typescript
await sendTelegramAlert({
  message: 'Description of the issue',
  severity: 'critical', // 'critical' | 'error' | 'warning' | 'info'
  service: 'Service Name',
  details: { any: 'context' }
});
```

#### `sendCriticalAlert(service, message, details?)`

Shorthand for critical alerts (🚨 emoji)

```typescript
await sendCriticalAlert('Fiat Currency Service', 'API is returning null', {
  endpoint: '/graphql',
  error: 'getAllFiatRate'
});
```

#### `sendErrorAlert(service, message, details?)`

For error-level alerts (❌ emoji)

```typescript
await sendErrorAlert('Database', 'Connection pool exhausted', { activeConnections: 100 });
```

#### `sendWarningAlert(service, message, details?)`

For warning-level alerts (⚠️ emoji)

```typescript
await sendWarningAlert('Cache Service', 'Cache hit rate below 50%', { hitRate: 0.45 });
```

#### `sendInfoAlert(service, message, details?)`

For informational alerts (ℹ️ emoji)

```typescript
await sendInfoAlert('Deployment', 'New version deployed successfully', { version: '1.2.3' });
```

### 3. Integration: `PlaceAnOrderModal.tsx`

**Purpose**: Automatically alert when fiat service fails

**Added**:

- Import of `sendCriticalAlert` utility
- useEffect hook that triggers when `fiatRateError` is detected
- Sends alert with offer context and error details
- Non-blocking (doesn't break UI if alert fails)

**Code**:

```typescript
useEffect(() => {
  if (fiatRateError && isGoodsServicesConversion) {
    sendCriticalAlert(
      'Fiat Currency Service',
      'getAllFiatRate API is returning null - fiat-priced orders are blocked',
      {
        offerId: post.id,
        offerCurrency: post?.postOffer?.tickerPriceGoodsServices,
        offerPrice: post?.postOffer?.priceGoodsServices,
        error: 'Cannot return null for non-nullable field Query.getAllFiatRate',
        impact: 'All USD/EUR/GBP priced Goods & Services orders are blocked'
      }
    ).catch(err => console.error('Failed to send alert:', err));
  }
}, [fiatRateError, isGoodsServicesConversion]);
```

---

## 🎨 Alert Message Format

Alerts are formatted with Markdown for readability:

```
🚨 CRITICAL: Fiat Currency Service

getAllFiatRate API is returning null - fiat-priced orders are blocked

Details:
{
  "offerId": "cmgn0lvij000cgwl6tszmc9ac",
  "offerCurrency": "USD",
  "offerPrice": 50,
  "error": "Cannot return null for non-nullable field Query.getAllFiatRate",
  "impact": "All USD/EUR/GBP priced Goods & Services orders are blocked",
  "timestamp": "2025-10-12T10:30:00.000Z"
}

Time: 2025-10-12T10:30:00.000Z
Environment: production
```

### Severity Levels

| Severity   | Emoji | Use Case                       | Example                         |
| ---------- | ----- | ------------------------------ | ------------------------------- |
| `critical` | 🚨    | Service down, blocking users   | Fiat API down, database offline |
| `error`    | ❌    | Errors affecting functionality | Failed transactions, API errors |
| `warning`  | ⚠️    | Degraded performance           | High latency, cache misses      |
| `info`     | ℹ️    | Informational updates          | Deployments, config changes     |

---

## 🔒 Security Considerations

### 1. Bot Token Protection

- ✅ Stored in `.env` (server-side only)
- ✅ Never exposed to client
- ✅ Used only in API route
- ❌ Never commit to Git

### 2. Channel ID Protection

- ✅ Stored in environment variable
- ⚠️ Less sensitive than bot token
- ✅ Can be different per environment

### 3. Rate Limiting

Consider adding rate limiting to prevent:

- Alert spam (e.g., max 1 alert per minute for same error)
- Excessive API calls to Telegram
- Channel flooding

**Example implementation**:

```typescript
const alertCache = new Map<string, number>();
const ALERT_COOLDOWN = 60000; // 1 minute

function shouldSendAlert(key: string): boolean {
  const lastSent = alertCache.get(key);
  if (lastSent && Date.now() - lastSent < ALERT_COOLDOWN) {
    return false; // Too soon, skip
  }
  alertCache.set(key, Date.now());
  return true;
}

// Usage
if (shouldSendAlert('fiat-service-down')) {
  await sendCriticalAlert(...);
}
```

---

## 🧪 Testing

### Test 1: Manual API Call

```bash
curl -X POST https://localecash.test/api/alerts/telegram \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Test alert from curl",
    "severity": "info",
    "service": "Test Service",
    "details": {"test": true}
  }'
```

### Test 2: From Browser Console

```javascript
fetch('/api/alerts/telegram', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: 'Test alert from browser',
    severity: 'info',
    service: 'Browser Test'
  })
})
  .then(r => r.json())
  .then(console.log);
```

### Test 3: Trigger Real Error

1. Stop the fiat service or backend
2. Try to place an order on a USD-priced offer
3. Check your Telegram channel for the alert

---

## 📊 Monitoring & Best Practices

### Best Practices

1. **Use Appropriate Severity Levels**

   - Don't overuse `critical` - save for truly blocking issues
   - Use `warning` for degraded but functional services
   - Use `info` for successful deployments or non-urgent updates

2. **Include Relevant Context**

   - Always include timestamps
   - Add user IDs, offer IDs, or other identifiers
   - Include error messages and stack traces when relevant

3. **Avoid Alert Fatigue**

   - Implement cooldown periods for repeated errors
   - Aggregate similar errors
   - Send summary reports for non-critical issues

4. **Test Regularly**
   - Test alert system monthly
   - Update channel members as team changes
   - Verify bot permissions remain correct

### Recommended Alerts to Add

```typescript
// Database connection issues
await sendCriticalAlert('Database', 'Connection pool exhausted', {...});

// High error rates
await sendWarningAlert('API', 'Error rate > 5%', { errorRate: 0.08 });

// Slow response times
await sendWarningAlert('Performance', 'P95 latency > 2s', { p95: 2.3 });

// Successful deployments
await sendInfoAlert('Deployment', 'v1.2.3 deployed', { version: '1.2.3' });

// External API failures
await sendErrorAlert('CoinGecko API', 'Rate limit exceeded', {...});
```

---

## 🐛 Troubleshooting

### Problem: Alerts not being sent

**Check**:

1. ✅ `TELEGRAM_ALERT_CHANNEL_ID` is set in `.env`
2. ✅ Channel ID is correct (starts with `-100`)
3. ✅ Bot is added as admin to the channel
4. ✅ Bot token is valid
5. ✅ Server has internet access to reach Telegram API

**Debug**:

```bash
# Check environment variables
echo $BOT_TOKEN
echo $TELEGRAM_ALERT_CHANNEL_ID

# Test bot token
curl https://api.telegram.org/bot<BOT_TOKEN>/getMe

# Test sending message
curl https://api.telegram.org/bot<BOT_TOKEN>/sendMessage \
  -d "chat_id=<CHANNEL_ID>&text=Test"
```

### Problem: Getting "Chat not found"

**Solution**: Make sure:

- Bot is added as administrator to the channel
- Channel ID is correct (including the `-` sign)
- If private channel, bot must be added before sending

### Problem: Alerts working but not formatted

**Solution**:

- Telegram requires `parse_mode: 'Markdown'` for formatting
- Check that special characters are escaped properly
- Try `parse_mode: 'HTML'` as alternative

---

## ✅ Summary

**Implemented**:

- ✅ API route for sending Telegram alerts
- ✅ Utility functions for easy usage
- ✅ Automatic fiat service error detection
- ✅ Security (bot token server-side only)
- ✅ Error handling and logging
- ✅ Markdown-formatted messages with severity levels

**Configuration Needed**:

1. Create Telegram channel
2. Add bot as admin
3. Get channel ID
4. Set `TELEGRAM_ALERT_CHANNEL_ID` in `.env`
5. Test with a manual alert

**Benefits**:

- 📱 Immediate notification of critical issues
- 🚨 No need to monitor logs constantly
- 📊 Centralized alert channel for team
- 🔍 Rich context in each alert
- ⚡ Fast response to incidents

---

**Ready to use!** Configure the channel ID and start receiving alerts for critical service failures.
