#!/bin/bash

echo "🔧 Setting up WasteOps Intelligence Environment Variables..."

# Create .env.local file with provided credentials
cat > .env.local << 'EOF'
# Timeero API Configuration
TIMEERO_API_KEY=GbG6jynZSYoyQYCwEVWoHuLDMHmt1sLOSTZRtSwBEvx5og7w6I4Vbwmd0FDxuUZR
TIMEERO_COMPANY_ID=your_timeero_company_id

# FreshBooks API Configuration
FRESHBOOKS_CLIENT_ID=a7e880e761f7d25ee12e138aef78c27dc32992c97782475d1f5ce58f9b69f9c4
FRESHBOOKS_CLIENT_SECRET=f785e10b31120689a18587304f3b4d54f6d8a78d304f57747c00ca4a52430e4b
FRESHBOOKS_REDIRECT_URI=https://www.cswaste.com
FRESHBOOKS_ACCESS_TOKEN=your_access_token_here
FRESHBOOKS_ACCOUNT_ID=your_account_id_here

# Google Sheets API Configuration
GOOGLE_SHEETS_API_KEY=AIzaSyDQfQRS1s3NqD3RA2j1Pvhh4XqQ5YsBWMI
GOOGLE_SPREADSHEET_ID=your_google_spreadsheet_id
GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"your-project","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"your-service-account@your-project.iam.gserviceaccount.com","client_id":"...","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"..."}

# Google Chat Webhook URL
GOOGLE_CHAT_WEBHOOK_URL=https://chat.googleapis.com/v1/spaces/AAQAde8TKcc/messages?key=AIzaSyDdI0hCZtE6vySjMm-WEfRq3CPzqKqqsHI&token=NmpE4e_1O7VL5A4xD78TxYRctHkUtQWF-4BiX2s9A9Y

# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/waste_ops_intelligence

# Next.js Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
EOF

echo "✅ Environment variables configured!"
echo "📋 Next steps:"
echo "1. Get your Timeero Company ID from https://app.timeero.com/settings"
echo "2. Complete FreshBooks OAuth to get access_token and account_id"
echo "3. Create Google Sheets and get spreadsheet ID"
echo "4. Set up Google Service Account for Sheets API"
echo ""
echo "🚀 Run 'npm run dev' to start the dashboard with live data!"

# Make the script executable
chmod +x setup-env.sh 