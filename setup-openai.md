# OpenAI API Setup Guide

## Issue: Failed to connect to GPT parsing service

The GPT contract parsing feature requires an OpenAI API key to function. Here's how to set it up:

## Step 1: Get an OpenAI API Key

1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in to your account
3. Navigate to **API Keys** section
4. Click **Create new secret key**
5. Copy the generated API key (starts with `sk-`)

## Step 2: Configure the API Key

1. In your `waste-ops-intelligence` folder, create a `.env.local` file (or edit existing one)
2. Add this line:
   ```
   OPENAI_API_KEY=sk-your-actual-api-key-here
   ```

## Step 3: Restart the Development Server

After adding the API key:
```bash
cd waste-ops-intelligence
npm run dev
```

## Step 4: Test the GPT Parsing

1. Go to your RFP Intelligence page
2. Try the "Parse with AI" feature
3. You should now see successful contract parsing

## API Usage Notes

- **Cost**: GPT-3.5-turbo costs approximately $0.002 per 1K tokens
- **Typical contract parsing**: ~$0.01-0.05 per document
- **Monthly estimate**: $5-20 for moderate usage

## Troubleshooting

### Still getting 404 errors?
- Verify the API key starts with `sk-`
- Check there are no extra spaces in the `.env.local` file
- Restart the development server

### Getting rate limit errors?
- OpenAI has usage limits for new accounts
- Wait a few minutes between requests
- Consider upgrading your OpenAI plan

### Getting billing errors?
- Add a payment method to your OpenAI account
- Set usage limits to control costs

## Security Note

- Never commit `.env.local` to git (it's in .gitignore)
- The API key is server-side only (not exposed to browsers)
- Keep your API key private and secure

## Alternative: Disable GPT Parsing

If you prefer not to use OpenAI, you can:
1. Copy/paste contract text manually into the RFP Content area
2. Use the document upload feature for Word/PDF files
3. Fill out the form fields manually

The system will work fine without GPT parsing - it just makes data entry faster and more accurate. 