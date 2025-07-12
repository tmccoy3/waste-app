import { NextRequest, NextResponse } from 'next/server';
import { parseContractWithGPT, convertGPTDataToRFPFormat, formatGPTDataForDisplay } from '../../../lib/gpt-contract-parser';

export async function POST(req: NextRequest) {
  try {
    console.log('🚀 Starting GPT contract parsing API...');
    
    const { contractText, source } = await req.json();

    if (!contractText) {
      return NextResponse.json(
        { success: false, error: 'No contract text provided' },
        { status: 400 }
      );
    }

    console.log(`📄 Processing contract text from ${source || 'unknown source'} (${contractText.length} characters)`);

    // Parse the contract using GPT
    const gptResult = await parseContractWithGPT(contractText);

    if (!gptResult.success) {
      console.error('❌ GPT parsing failed:', gptResult.error);
      return NextResponse.json(
        { 
          success: false, 
          error: gptResult.error || 'Failed to parse contract with GPT'
        },
        { status: 400 }
      );
    }

    // Convert GPT data to RFP format for analysis
    const rfpData = convertGPTDataToRFPFormat(gptResult.data!);
    
    // Format for display in UI
    const displayText = formatGPTDataForDisplay(gptResult.data!);

    console.log('✅ GPT contract parsing completed successfully');
    console.log(`📊 Extracted ${gptResult.data!.units} units from ${gptResult.data!.community_name}`);

    return NextResponse.json({
      success: true,
      gptData: gptResult.data,
      rfpData: rfpData,
      displayText: displayText,
      confidenceScore: gptResult.data!.confidence_score,
      parseMethod: 'gpt-3.5-turbo',
      stats: {
        characterCount: contractText.length,
        wordCount: contractText.split(/\s+/).length,
        confidenceScore: gptResult.data!.confidence_score,
        extractedUnits: gptResult.data!.units,
        method: 'gpt-parsing'
      },
      message: `Successfully parsed contract using AI (${gptResult.data!.confidence_score}% confidence)`
    });

  } catch (error) {
    console.error('💥 GPT parsing API error:', error);
    
    // Handle specific error types
    let errorMessage = 'Failed to parse contract with GPT';
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        errorMessage = 'OpenAI API key not configured. Please check your environment settings.';
      } else if (error.message.includes('quota') || error.message.includes('billing')) {
        errorMessage = 'OpenAI API quota exceeded. Please check your billing and usage limits.';
      } else if (error.message.includes('rate limit')) {
        errorMessage = 'OpenAI API rate limit exceeded. Please wait a moment and try again.';
      } else {
        errorMessage = error.message;
      }
    }

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
} 