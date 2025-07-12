import { NextRequest, NextResponse } from 'next/server';
import { sendGoogleChatMessage, sendGoogleChatAlert } from '@/lib/api/google-chat';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, type, address, customerName } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required and must be a string' },
        { status: 400 }
      );
    }

    // Check if webhook URL is configured
    if (!process.env.GOOGLE_CHAT_WEBHOOK_URL) {
      return NextResponse.json(
        { error: 'Google Chat webhook is not configured' },
        { status: 500 }
      );
    }

    // Send different types of messages based on the type parameter
    if (type && ['missed-pickup', 'meeting', 'property-manager', 'general'].includes(type)) {
      await sendGoogleChatAlert(type, message, address, customerName);
    } else {
      await sendGoogleChatMessage(message);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to send Google Chat message:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to send message',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 