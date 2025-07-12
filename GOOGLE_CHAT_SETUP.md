# Google Chat Integration Setup

## 🚨 Get Your Webhook URL

To set up Google Chat messaging, you'll need a **Google Chat webhook**:

### Step 1: Create a Webhook
1. Go to your Google Chat **space**
2. Click the **gear icon** → *Apps & integrations* → **Manage webhooks**
3. Click **Add Webhook**, give it a name like `CSW Alerts`
4. Copy the generated URL

### Step 2: Add to Environment Variables
Add the webhook URL to your `.env.local` file:

```bash
GOOGLE_CHAT_WEBHOOK_URL=https://chat.googleapis.com/v1/spaces/your_space/messages?key=your_key&token=your_token
```

### Step 3: Test the Integration
1. Start your development server: `npm run dev`
2. Go to your dashboard at `http://localhost:3003/dashboard`
3. Click the **📣 Company Alerts** button in the header
4. Send a test message to verify it works

## 🔧 Features Available

### Quick Templates
- **🚛 Missed Pick-up**: Sends formatted alerts with address and customer details
- **🗓️ Meeting Announcement**: For team meeting notifications
- **🧑‍💼 Property Manager Update**: For property manager communications
- **📢 General Alert**: For any custom message

### Message Types
- **Simple Text Messages**: Basic notifications
- **Formatted Cards**: Rich messages with structured data for missed pick-ups
- **Alert Categories**: Different formatting based on message type

### Security
- Webhook URL is protected on the server-side
- All messages are sent through secure API routes
- No sensitive data exposed to the frontend

## 🧪 Testing

Once configured, you can test with sample messages like:
- "🚛 Missed pick-up at 123 Main St"
- "🗓️ Team meeting at 2 PM today"
- "📢 New route optimization completed"

The system will format these appropriately and send them to your Google Chat space.

## 🔐 Environment Variables

Create a `.env.local` file in your project root with:

```bash
# Required for Google Chat integration
GOOGLE_CHAT_WEBHOOK_URL=your_webhook_url_here

# Optional - for other integrations
NEXT_PUBLIC_APP_URL=http://localhost:3003
DATABASE_URL="file:./dev.db"
```

## 📝 Webhook URL Format

Your webhook URL should look like:
```
https://chat.googleapis.com/v1/spaces/AAAA_SPACE_ID/messages?key=KEY&token=TOKEN
```

Make sure to keep this URL secure and never commit it to version control! 