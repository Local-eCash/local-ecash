# 💬 Setting Up Telegram Group for Alerts

**Quick guide for using a Telegram GROUP instead of a channel**

---

## ✅ Why Use a Group?

**Advantages of Groups over Channels:**

- 💬 **Team discussion**: Everyone can reply and discuss issues
- 👥 **Collaboration**: Multiple people can respond and coordinate
- 🔔 **Mentions**: Can @mention team members for specific issues
- 🔄 **Real-time coordination**: Faster response and resolution
- 📱 **Better for small teams**: More interactive than one-way channels

**Channels are better for:**

- One-way announcements
- Large audiences (100+ people)
- Public notifications

---

## 🚀 Setup Steps

### Step 1: Create a Telegram Group

1. Open Telegram app
2. Click **New Group** (not New Channel!)
3. Name it: `Local eCash Alerts` or `DevOps Alerts`
4. Add team members who should receive alerts
5. Click **Create**

### Step 2: Add Your Bot to the Group

1. In your group, click the group name at the top
2. Click **Add Members**
3. Search for your bot: `@p2p_dex_bot`
4. Add the bot to the group

### Step 3: Make Bot an Admin (Important!)

1. In group settings, go to **Administrators**
2. Click **Add Administrator**
3. Select your bot (`@p2p_dex_bot`)
4. Grant these permissions:
   - ✅ **Send Messages** (required)
   - ✅ **Delete Messages** (optional, for cleanup)
   - Others are optional
5. Click **Done**

⚠️ **Important**: The bot MUST be an admin to send messages in the group!

### Step 4: Get the Group Chat ID

There are several ways to get your group's chat ID:

#### Method A: Using Built-in Helper 🚀 **EASIEST!**

We've created a helper endpoint just for this!

1. **Make sure your bot is in the group** (from Step 2)
2. **Send a test message** in your group (just type "test")
3. **Start your development server** if not already running:
   ```bash
   pnpm dev
   ```
4. **Visit this URL in your browser**:

   ```
   http://localhost:3000/api/telegram/get-chat-ids
   ```

   (or whatever port your app runs on)

5. **You'll see JSON output** like:

   ```json
   {
     "success": true,
     "message": "Chat IDs found!",
     "groups": [
       {
         "id": -123456789,  // ← This is your group ID!
         "title": "Local eCash Alerts",
         "type": "group"
       }
     ],
     "instructions": {...}
   }
   ```

6. **Copy the `id` value** from your group (e.g., `-123456789`)

7. **IMPORTANT**: After getting the ID, **delete** the helper file for security:
   ```bash
   rm apps/telegram-ecash-escrow/src/app/api/telegram/get-chat-ids/route.ts
   ```

**This is the easiest method!** The helper automatically finds all your groups/channels.

#### Method B: Using getUpdates API ⭐ **Always Works**

1. **Add your bot** to the group (from Step 2 above)
2. **Send a message** in your group (e.g., type "test" or "/start")
3. **Open in browser**:

   ```
   https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates
   ```

   Replace `<YOUR_BOT_TOKEN>` with your actual bot token from `.env`

   Example:

   ```
   https://api.telegram.org/bot7655589619:AAEqPYvim3_HPTOxuy_01_kUy0j2mNCfvQ4/getUpdates
   ```

4. **Find your group** in the JSON response:

   ```json
   {
     "ok": true,
     "result": [
       {
         "update_id": 123456,
         "message": {
           "message_id": 1,
           "from": {...},
           "chat": {
             "id": -123456789,  // ← This is your group ID!
             "title": "Local eCash Alerts",
             "type": "group"
           },
           "date": 1697123456,
           "text": "test"
         }
       }
     ]
   }
   ```

5. **Copy the `chat.id` value** (negative number like `-123456789`)

**Pro tip**: If you see multiple results, look for the one with `"type": "group"` and the title matching your group name.

#### Method C: Using @RawDataBot

1. Add **@RawDataBot** to your group
2. It will automatically send the group information including chat ID
3. Look for a line like: `Chat ID: -123456789`
4. Copy the chat ID
5. Remove @RawDataBot (optional, to keep group clean)

#### Method C: Using Web Telegram

1. Open **Telegram Web** (https://web.telegram.org)
2. Select your group
3. Look at the URL in your browser:
   ```
   https://web.telegram.org/k/#-123456789
   ```
4. The number after `#` is your group ID (with the `-` sign)

**Note**: This might show a different format, so Method A is more reliable.

#### Method D: Using @getidsbot

1. Add **@getidsbot** to your group
2. Send the command `/start@getidsbot` in the group
3. The bot will reply with the chat ID
4. Copy the ID and remove the bot

#### Method E: Manual Test with Your Bot (Easiest if you're a developer)

Since your bot is already in the group and you're running the app:

1. **Create a test endpoint** in your app temporarily:

   ```typescript
   // Add to src/app/api/test-telegram/route.ts
   import { NextRequest, NextResponse } from 'next/server';

   export async function GET(request: NextRequest) {
     const botToken = process.env.BOT_TOKEN;

     const response = await fetch(`https://api.telegram.org/bot${botToken}/getUpdates`);
     const data = await response.json();

     return NextResponse.json(data);
   }
   ```

2. **Visit**: `http://localhost:3000/api/test-telegram`
3. **Find your group ID** in the JSON response
4. **Delete the test endpoint** after getting the ID

### Step 5: Configure Environment Variable

Edit your `.env` file:

```bash
# Telegram Alert Configuration
TELEGRAM_ALERT_CHANNEL_ID="-123456789"  # Your group chat ID
```

**Important notes:**

- Group IDs are negative numbers (start with `-`)
- Use quotes if you have any special characters
- Channel IDs usually start with `-100` (like `-1001234567890`)
- Group IDs are shorter (like `-123456789`)

### Step 6: Restart Your Application

```bash
# Stop the app
# Then restart
pnpm dev
```

### Step 7: Test It!

Send a test alert from your app:

```typescript
import { sendCriticalAlert } from '@/src/utils/telegram-alerts';

await sendCriticalAlert('Test Service', 'Testing Telegram group alerts - can everyone see this?', {
  testTime: new Date().toISOString()
});
```

You should see a message in your group like:

```
🚨 CRITICAL: Test Service

Testing Telegram group alerts - can everyone see this?

Details:
{
  "testTime": "2025-10-12T10:30:00.000Z"
}

Time: 2025-10-12T10:30:00.000Z
Environment: production
```

**Now team members can reply and discuss!** 💬

---

## 💬 Using the Group

### When Alerts Arrive

1. **Acknowledge**: Someone replies "On it!" or "Investigating"
2. **Discuss**: Team discusses the issue in thread
3. **Coordinate**: Assign tasks, share findings
4. **Update**: Post updates as you investigate
5. **Resolve**: Confirm when fixed

### Example Conversation

```
🚨 Bot: CRITICAL: Fiat Currency Service
       getAllFiatRate API is down

👤 Alice: I see it. Checking the external API now.

👤 Bob: Looking at the logs. Last successful call was 10 mins ago.

👤 Alice: CoinGecko API is responding slowly. Rate limit?

👤 Bob: Yep, we hit the rate limit. Implementing caching now.

👤 Alice: Cache deployed. Service back up! ✅

🤖 Bot: INFO: Fiat Currency Service
       Service restored, all systems operational
```

### Group Features You Can Use

- **Reply to specific alerts**: Click reply on bot message
- **Pin important messages**: Pin critical issues at top
- **Mute when resolved**: Mute notifications temporarily if needed
- **Search history**: Search old alerts with Telegram search
- **Forward to others**: Forward critical alerts to management

---

## 🔧 Advanced Configuration

### Multiple Environment Groups

Create separate groups for different environments:

```bash
# Development
TELEGRAM_ALERT_CHANNEL_ID="-123456789"  # Dev Alerts group

# Staging
TELEGRAM_ALERT_CHANNEL_ID="-987654321"  # Staging Alerts group

# Production
TELEGRAM_ALERT_CHANNEL_ID="-555555555"  # Production Alerts group
```

### Custom Alert Formatting for Groups

You can customize alerts for better group interaction:

```typescript
// Add @mentions for critical alerts
await sendCriticalAlert('Database', '@alice @bob Database connection pool exhausted! Need immediate attention.', {
  activeConnections: 100
});

// Add action items
await sendErrorAlert(
  'Payment API',
  'Payment processing failed for 5 transactions\n\n' +
    '**Action Required:**\n' +
    '1. Check payment gateway logs\n' +
    '2. Verify API credentials\n' +
    '3. Retry failed transactions',
  { failedCount: 5 }
);
```

### On-Call Rotations

Set up group description with current on-call:

```
Local eCash Alerts

🚨 Current On-Call: @alice (Oct 12-18)
📞 Backup: @bob
📚 Runbooks: https://wiki.example.com/runbooks

Use /status to check system health
```

---

## 🎯 Best Practices

### Do's ✅

- ✅ Keep the group focused (alerts only, or alerts + discussion)
- ✅ Acknowledge alerts quickly ("On it!")
- ✅ Update the group with progress
- ✅ Mark resolved issues with ✅ emoji
- ✅ Pin critical unresolved issues
- ✅ Use threads/replies to keep conversations organized

### Don'ts ❌

- ❌ Don't use the group for general chat (create separate group)
- ❌ Don't mute permanently (you'll miss critical alerts)
- ❌ Don't leave alerts unacknowledged
- ❌ Don't spam @everyone unless truly critical
- ❌ Don't forget to celebrate fixes! 🎉

---

## 🔍 Troubleshooting

### "Chat not found" error

**Causes:**

- Bot is not in the group
- Bot is not an admin
- Wrong chat ID

**Fix:**

1. Verify bot is in the group and is admin
2. Double-check the chat ID (should be negative)
3. Make sure quotes are correct in `.env`

### Alerts not appearing in group

**Check:**

1. Bot is an admin with "Send Messages" permission
2. `TELEGRAM_ALERT_CHANNEL_ID` is set correctly
3. Server restarted after changing `.env`
4. No errors in server logs

**Test manually:**

```bash
curl "https://api.telegram.org/bot<BOT_TOKEN>/sendMessage" \
  -d "chat_id=<GROUP_ID>&text=Test message"
```

### Bot was kicked/left the group

**Fix:**

1. Re-add the bot to the group
2. Make it admin again
3. Test with a message

---

## 📊 Comparison: Group vs Channel

| Feature            | Group                     | Channel              |
| ------------------ | ------------------------- | -------------------- |
| **Discussion**     | ✅ Yes, everyone can chat | ❌ No, one-way only  |
| **Team Size**      | Best for 5-50 people      | Best for 50+ people  |
| **Mentions**       | ✅ Yes, @mention anyone   | ❌ No mentions       |
| **Replies**        | ✅ Yes, can reply to bot  | ❌ No replies        |
| **Admin Required** | ✅ Yes                    | ✅ Yes               |
| **Privacy**        | Private by default        | Public or private    |
| **Use Case**       | DevOps team alerts        | Public announcements |

---

## ✅ Checklist

Before going live with group alerts:

- [ ] Created Telegram group
- [ ] Added bot to group (`@p2p_dex_bot`)
- [ ] Made bot an admin with "Send Messages" permission
- [ ] Got group chat ID (negative number)
- [ ] Set `TELEGRAM_ALERT_CHANNEL_ID` in `.env`
- [ ] Restarted application
- [ ] Sent test alert successfully
- [ ] Team members can see and reply to alerts
- [ ] Established on-call rotation (if needed)
- [ ] Documented escalation procedures

---

## 🎉 You're All Set!

Your team can now:

- 📬 Receive immediate alerts
- 💬 Discuss issues in real-time
- 🤝 Coordinate response
- ✅ Track resolution

**Example group name ideas:**

- `Local eCash Alerts 🚨`
- `DevOps - Production Alerts`
- `Engineering On-Call`
- `System Monitoring Team`

---

**Happy alerting!** 🎊
