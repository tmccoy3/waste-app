# 🎭 Google Chat Demo Mode

## Current Status
Your Google Chat integration is currently running in **Demo Mode**. This means:

✅ **What Works:**
- Company Alerts dialog opens and functions normally
- Messages can be composed and "sent" 
- Success feedback is provided
- No errors or crashes occur

🔧 **What's Missing:**
- Messages are not actually sent to Google Chat
- Messages are logged to the console instead
- Real Google Chat notifications are disabled

## Why Demo Mode?

Demo Mode activates when the `GOOGLE_CHAT_WEBHOOK_URL` environment variable is not configured. This prevents:
- API errors and crashes
- Failed message sending attempts
- Confusing error messages for users

## How to Enable Real Google Chat Integration

### Step 1: Set up Google Chat Webhook
1. Go to your Google Chat space
2. Click on the space name → "Manage webhooks"
3. Create a new webhook and copy the URL

### Step 2: Configure Environment Variable
Create a `.env.local` file in your project root with:

```bash
# Google Chat Webhook URL
GOOGLE_CHAT_WEBHOOK_URL=https://chat.googleapis.com/v1/spaces/YOUR_SPACE/messages?key=YOUR_KEY&token=YOUR_TOKEN
```

### Step 3: Restart Development Server
```bash
npm run dev
```

## Testing Demo Mode

You can test the current demo mode by:

1. Opening the dashboard at `http://localhost:3001/dashboard`
2. Clicking "Send Alert" button
3. Composing a message
4. Clicking "Send Message"
5. Checking the browser console for demo logs

## Demo Mode Console Output

When messages are sent in demo mode, you'll see:
```
📢 Google Chat Demo Mode: Would send message: Your message here
ℹ️  To enable real Google Chat integration, set GOOGLE_CHAT_WEBHOOK_URL in your environment variables
```

## Full Setup Guide

For complete Google Chat setup instructions, see:
- `GOOGLE_CHAT_SETUP.md` - Detailed configuration guide
- `env.example` - Example environment variables

---

**Note:** Demo mode ensures your application remains fully functional even without Google Chat configuration. This is perfect for development and testing! 