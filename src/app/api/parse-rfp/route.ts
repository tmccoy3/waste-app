import { NextRequest, NextResponse } from 'next/server';
import * as mammoth from 'mammoth';

interface ParseResult {
  filename: string;
  fileType: 'docx' | 'doc' | 'txt';
  rawText: string;
  error: null | 'EMPTY_FILE' | 'UNSUPPORTED_FORMAT';
  confidence: 'high' | 'low';
  wordCount: number;
}

async function parseDocx(fileBuffer: Buffer): Promise<{ text: string; confidence: 'high' | 'low' }> {
  try {
    console.log('📄 Starting DOCX parsing with mammoth...');
    const result = await mammoth.extractRawText({ buffer: fileBuffer });
    const text = result.value.trim();
    console.log(`✅ DOCX parsed: ${text.length} characters extracted`);
    return { text, confidence: 'high' };
  } catch (error) {
    console.error('❌ DOCX parsing failed:', error);
    throw new Error('Failed to parse DOCX file');
  }
}

async function parseTxt(fileBuffer: Buffer): Promise<{ text: string; confidence: 'high' | 'low' }> {
  try {
    console.log('📄 Starting TXT parsing...');
    const text = fileBuffer.toString('utf-8').trim();
    console.log(`✅ TXT parsed: ${text.length} characters extracted`);
    return { text, confidence: 'high' };
  } catch (error) {
    console.error('❌ TXT parsing failed:', error);
    throw new Error('Failed to parse TXT file');
  }
}

function validateRfpContent(text: string): boolean {
  const rfpKeywords = [
    'community', 'homes', 'services', 'frequency', 'pricing', 'waste', 'trash', 
    'recycling', 'collection', 'pickup', 'proposal', 'bid', 'contract'
  ];
  
  const lowerText = text.toLowerCase();
  const foundKeywords = rfpKeywords.filter(keyword => lowerText.includes(keyword));
  
  console.log(`🔍 RFP validation: Found ${foundKeywords.length}/${rfpKeywords.length} keywords:`, foundKeywords);
  return foundKeywords.length >= 2; // At least 2 RFP-related keywords
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 10MB.' },
        { status: 400 }
      );
    }

    console.log(`📁 Processing file: ${file.name} (${file.type}, ${file.size} bytes)`);

    const fileBuffer = Buffer.from(await file.arrayBuffer());
    let result: ParseResult;

    // Handle different file types
    switch (file.type) {
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        const docxResult = await parseDocx(fileBuffer);
        result = {
          filename: file.name,
          fileType: 'docx',
          rawText: docxResult.text,
          error: null,
          confidence: docxResult.confidence,
          wordCount: docxResult.text.split(/\s+/).length
        };
        break;

      case 'text/plain':
        const txtResult = await parseTxt(fileBuffer);
        result = {
          filename: file.name,
          fileType: 'txt',
          rawText: txtResult.text,
          error: null,
          confidence: txtResult.confidence,
          wordCount: txtResult.text.split(/\s+/).length
        };
        break;

      case 'application/pdf':
        return NextResponse.json({
          filename: file.name,
          fileType: 'pdf',
          rawText: '',
          error: 'PDF files are not currently supported. Please convert your PDF to a DOCX or TXT file and try again.',
          confidence: 'low',
          wordCount: 0
        }, { status: 400 });

      default:
        return NextResponse.json({
          filename: file.name,
          fileType: 'unknown',
          rawText: '',
          error: 'UNSUPPORTED_FORMAT',
          confidence: 'low',
          wordCount: 0
        }, { status: 400 });
    }

    // Validate content
    if (!result.rawText || result.rawText.length < 50) {
      result.error = 'EMPTY_FILE';
      return NextResponse.json(result, { status: 400 });
    }

    // Validate RFP content
    if (!validateRfpContent(result.rawText)) {
      console.log('⚠️ Warning: File may not contain valid RFP content');
      result.confidence = 'low';
    }

    console.log(`✅ Successfully parsed ${result.filename}: ${result.wordCount} words, ${result.confidence} confidence`);
    
    return NextResponse.json(result);

  } catch (error) {
    console.error('❌ API Error:', error);
    return NextResponse.json(
      { error: `Failed to process file: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
} 