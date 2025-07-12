import { NextRequest, NextResponse } from 'next/server';
import { DEFAULT_PRICING_CONFIG, type PricingEngineConfig } from '../../../lib/smart-pricing-engine';

// In a real application, this would be stored in a database
let currentConfig: PricingEngineConfig = { ...DEFAULT_PRICING_CONFIG };

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      config: currentConfig,
      defaults: DEFAULT_PRICING_CONFIG,
      metadata: {
        lastUpdated: new Date().toISOString(),
        version: '1.0'
      }
    });
  } catch (error) {
    console.error('Error fetching pricing config:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch pricing configuration' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { config } = await request.json();

    // Validate configuration
    if (!config || typeof config !== 'object') {
      return NextResponse.json(
        { success: false, error: 'Invalid configuration format' },
        { status: 400 }
      );
    }

    // Validate individual fields
    const validationErrors: string[] = [];

    if (typeof config.targetMargin !== 'number' || config.targetMargin < 0.1 || config.targetMargin > 0.8) {
      validationErrors.push('Target margin must be between 10% and 80%');
    }

    if (typeof config.maxMargin !== 'number' || config.maxMargin < config.targetMargin || config.maxMargin > 0.9) {
      validationErrors.push('Max margin must be greater than target margin and less than 90%');
    }

    if (typeof config.outlierThreshold !== 'number' || config.outlierThreshold < 0.1 || config.outlierThreshold > 1.0) {
      validationErrors.push('Outlier threshold must be between 10% and 100%');
    }

    if (typeof config.maxReasonablePrice !== 'number' || config.maxReasonablePrice < 20 || config.maxReasonablePrice > 100) {
      validationErrors.push('Max reasonable price must be between $20 and $100');
    }

    if (validationErrors.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', errors: validationErrors },
        { status: 400 }
      );
    }

    // Update configuration
    currentConfig = {
      targetMargin: config.targetMargin,
      maxMargin: config.maxMargin,
      outlierThreshold: config.outlierThreshold,
      maxReasonablePrice: config.maxReasonablePrice
    };

    console.log('🎯 Pricing configuration updated:', currentConfig);

    return NextResponse.json({
      success: true,
      config: currentConfig,
      message: 'Pricing configuration updated successfully'
    });

  } catch (error) {
    console.error('Error updating pricing config:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update pricing configuration' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Reset to defaults
    currentConfig = { ...DEFAULT_PRICING_CONFIG };

    console.log('🔄 Pricing configuration reset to defaults');

    return NextResponse.json({
      success: true,
      config: currentConfig,
      message: 'Pricing configuration reset to defaults'
    });

  } catch (error) {
    console.error('Error resetting pricing config:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to reset pricing configuration' },
      { status: 500 }
    );
  }
} 