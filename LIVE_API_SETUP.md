# 🚀 Live API Setup Guide - WasteOps Intelligence

## ✅ Current Status

### 🟢 Google Chat - CONNECTED ✅
Your Google Chat webhook is working perfectly! Test message sent successfully.

### 🟡 APIs Pending Setup:
- **Timeero** - Need Company ID
- **FreshBooks** - Need OAuth completion  
- **Google Sheets** - Need Service Account setup

---

## 🔧 Step-by-Step Setup

### 1. Timeero API Setup

**✅ API Key:** Already configured
**❌ Missing:** Company ID

**Steps:**
1. Go to https://app.timeero.com/settings
2. Look for "Company ID" or "Account Settings"
3. Copy your Company ID
4. Update `.env.local`:
   ```bash
   TIMEERO_COMPANY_ID=your_actual_company_id
   ```

**Test:** Click "🚛 View Timeero Routes" button in dashboard

---

### 2. FreshBooks OAuth Setup

**✅ Client ID & Secret:** Already configured
**❌ Missing:** Access Token & Account ID

**Steps:**

#### A. Get Access Token (OAuth Flow)
1. **Authorization URL:** Visit this link to authorize the app:
   ```
   https://my.freshbooks.com/service/auth/oauth/authorize?client_id=a7e880e761f7d25ee12e138aef78c27dc32992c97782475d1f5ce58f9b69f9c4&response_type=code&redirect_uri=https://www.cswaste.com
   ```

2. **After authorization**, you'll be redirected to `https://www.cswaste.com?code=AUTHORIZATION_CODE`
3. **Copy the authorization code** from the URL

#### B. Exchange Code for Token
Run this curl command (replace `AUTHORIZATION_CODE` with actual code):
```bash
curl -X POST https://api.freshbooks.com/auth/oauth/token \
  -H "Content-Type: application/json" \
  -d '{
    "grant_type": "authorization_code",
    "client_id": "a7e880e761f7d25ee12e138aef78c27dc32992c97782475d1f5ce58f9b69f9c4",
    "client_secret": "f785e10b31120689a18587304f3b4d54f6d8a78d304f57747c00ca4a52430e4b",
    "code": "AUTHORIZATION_CODE",
    "redirect_uri": "https://www.cswaste.com"
  }'
```

#### C. Get Account ID
With your access token, get your account ID:
```bash
curl -X GET https://api.freshbooks.com/auth/api/v1/users/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

#### D. Update Environment
Add to `.env.local`:
```bash
FRESHBOOKS_ACCESS_TOKEN=your_access_token_here
FRESHBOOKS_ACCOUNT_ID=your_account_id_here
```

**Test:** Click "📊 Sync FreshBooks" button in dashboard

---

### 3. Google Sheets Setup

**✅ API Key:** Already configured
**❌ Missing:** Service Account & Spreadsheet

#### A. Create Service Account
1. Go to https://console.cloud.google.com
2. Create new project or select existing
3. Enable Google Sheets API
4. Go to "Credentials" → "Create Credentials" → "Service Account"
5. Download JSON key file

#### B. Create Spreadsheet
1. Create new Google Sheet
2. Add tabs: "Customers", "Routes"
3. Use this template structure:

**Customers Sheet (A1:L1 headers):**
```
ID | Name | Type | Address | Zone | Email | Phone | Service Day | Monthly Rate | Status | Profitability | Notes
```

**Routes Sheet (A1:I1 headers):**
```
ID | Name | Zone | Service Day | Customer IDs | Est. Time | Actual Time | Efficiency | Driver ID
```

#### C. Share Sheet
1. Copy the service account email from JSON file
2. Share your Google Sheet with this email (Editor access)
3. Copy the Spreadsheet ID from URL: `https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit`

#### D. Update Environment
Add to `.env.local`:
```bash
GOOGLE_SPREADSHEET_ID=your_spreadsheet_id_here
GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"...","private_key":"..."}
```

**Test:** Click "📋 Import Google Sheets" button in dashboard

---

## 🎯 Quick Test Commands

### Test Google Chat (Already Working)
```bash
curl -X POST "https://chat.googleapis.com/v1/spaces/AAQAde8TKcc/messages?key=AIzaSyDdI0hCZtE6vySjMm-WEfRq3CPzqKqqsHI&token=NmpE4e_1O7VL5A4xD78TxYRctHkUtQWF-4BiX2s9A9Y" \
  -H "Content-Type: application/json" \
  -d '{"text":"Test message from WasteOps Dashboard!"}'
```

### Test Timeero (After Company ID)
```bash
curl -X GET "https://api.timeero.com/api/v1/employees" \
  -H "Authorization: Bearer GbG6jynZSYoyQYCwEVWoHuLDMHmt1sLOSTZRtSwBEvx5og7w6I4Vbwmd0FDxuUZR" \
  -H "X-Company-ID: YOUR_COMPANY_ID"
```

### Test FreshBooks (After OAuth)
```bash
curl -X GET "https://api.freshbooks.com/accounting/account/YOUR_ACCOUNT_ID/invoices/invoices" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Test Google Sheets (After Service Account)
```bash
curl -X GET "https://sheets.googleapis.com/v4/spreadsheets/YOUR_SPREADSHEET_ID/values/Customers!A1:L10?key=AIzaSyDQfQRS1s3NqD3RA2j1Pvhh4XqQ5YsBWMI"
```

---

## 🔄 Dashboard Features

### Current Status Panel
The dashboard now shows real-time API connection status:
- 🟢 **Connected:** API credentials configured and working
- 🟡 **Pending:** Missing credentials or setup incomplete
- 🔴 **Error:** API connection failed

### Smart Button Behavior
- **Connected APIs:** Attempts real API calls
- **Pending APIs:** Shows setup instructions
- **All APIs:** Falls back to demo mode with helpful error messages

### Google Chat Integration ✅
- **Daily summaries** sent automatically
- **Real-time alerts** for operational events
- **Rich card formatting** with actionable buttons

---

## 🎊 What's Working Right Now

### ✅ Immediate Features:
1. **Google Chat Notifications** - Fully functional
2. **Professional Dashboard** - Real-time status monitoring
3. **Demo Mode** - All features working with mock data
4. **API Status Tracking** - Visual connection indicators

### 🔄 After API Setup:
1. **Live Revenue Data** from FreshBooks
2. **Real Employee Tracking** from Timeero
3. **Dynamic Customer Data** from Google Sheets
4. **Automated Workflows** triggered by real events

---

## 🚀 Next Steps Priority

1. **Immediate (5 min):** Get Timeero Company ID
2. **Short-term (15 min):** Complete FreshBooks OAuth
3. **Medium-term (30 min):** Set up Google Sheets + Service Account

**Result:** Full live data integration across all business tools!

---

## 📞 Need Help?

The dashboard is designed to guide you through each step with helpful error messages and status indicators. Each API connection can be completed independently - you don't need to wait for all of them.

**Dashboard URL:** http://localhost:3000/dashboard

**Current working features:**
- ✅ Google Chat alerts
- ✅ Professional UI with live status
- ✅ Demo mode for all features
- ✅ Real-time sync capabilities

**Ready to transform your operations with live data!** 🎯 