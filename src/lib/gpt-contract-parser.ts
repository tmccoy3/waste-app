// GPT Contract Parser - Uses OpenAI API to extract structured data from RFP documents
// Provides intelligent parsing of contract language into actionable business data

interface ParsedContractData {
  community_name: string;
  address: string;
  units: number;
  customer_type: 'Single Family Home' | 'Condo/Townhome' | 'HOA' | 'Commercial' | 'Mixed Use' | 'Unknown';
  service_schedule: {
    trash: string;
    recycling: string;
    yard_waste: string;
  };
  special_requirements: string[];
  contract_duration: string;
  pricing_constraints: string[];
  access_notes: string[];
  notes: string;
  confidence_score: number; // 0-100
}

interface GPTParsingResult {
  success: boolean;
  data?: ParsedContractData;
  error?: string;
  raw_response?: string;
}

/**
 * Create the GPT prompt for contract parsing
 */
function createContractParsingPrompt(contractText: string): string {
  return `You are an expert waste management contract analyst specializing in HOA (Homeowners Association) and multi-family residential contracts. Parse the following RFP/contract document and extract key information into a structured JSON format.

DOCUMENT TO ANALYZE:
"""
${contractText}
"""

Extract the following information and return ONLY a valid JSON object with these exact fields:

{
  "community_name": "Name of the community/property/HOA",
  "address": "Full address including city, state, zip if available", 
  "units": 0,
  "customer_type": "Single Family Homes|Townhomes|Condos|Mixed Residential|Commercial|Unknown",
  "service_schedule": {
    "trash": "frequency (e.g., '2x/week', '1x/week', 'None')",
    "recycling": "frequency (e.g., '1x/week', 'Bi-weekly', 'None')",
    "yard_waste": "frequency (e.g., '1x/week', 'Seasonal', 'None')"
  },
  "special_requirements": ["list", "of", "special", "requirements"],
  "contract_duration": "contract length (e.g., '3 years', '1 year', 'Unknown')",
  "pricing_constraints": ["any", "pricing", "restrictions", "or", "requirements"],
  "access_notes": ["gated", "rear alley", "compactor access", "etc"],
  "notes": "Any important additional information",
  "confidence_score": 85
}

HOA-SPECIFIC PARSING GUIDELINES:
- For units: Look for "homes", "units", "residences", "dwellings", "townhomes", "condos"
- For customer_type: Focus on residential classifications (Single Family Homes, Townhomes, Condos, Mixed Residential)
- For service_schedule: 
  * HOAs typically have "2x/week" or "twice weekly" trash service
  * Recycling is usually "1x/week" or "weekly" 
  * Yard waste is often "Seasonal" or "1x/week"
- For special_requirements: Look for:
  * Container specifications (96-gallon carts, special bins)
  * Walk-out service requirements
  * Gated community access coordination
  * Rear alley or garage access needs
  * Contamination policies and penalties
  * Zero tolerance for missed pickups
- For access_notes: Prioritize:
  * "Gated community" or "access coordination required"
  * "Rear alley access" or "walk-out service"
  * "Garage pickup" or "special access requirements"
- For pricing_constraints: Note HOA-specific restrictions:
  * Fuel surcharge limitations (HOA bylaws often restrict these)
  * Fixed pricing requirements
  * Volume discount expectations for large communities
- Set confidence_score based on how clear and complete the HOA information is (0-100)

Return ONLY the JSON object, no additional text or explanation.`;
}

/**
 * Call OpenAI GPT API to parse contract
 */
async function callGPTAPI(prompt: string): Promise<any> {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error('OpenAI API key not found. Please add OPENAI_API_KEY to your .env.local file.');
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a precise contract analysis assistant. Always return valid JSON and nothing else.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 1000,
      temperature: 0.1, // Low temperature for consistent, factual extraction
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`OpenAI API error: ${response.status} ${response.statusText}. ${errorData.error?.message || ''}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || '';
}

/**
 * Validate and clean the parsed JSON response
 */
function validateParsedData(rawData: any): ParsedContractData {
  // Provide defaults for missing fields
  const defaultData: ParsedContractData = {
    community_name: 'Unknown Community',
    address: 'Unknown Location',
    units: 0,
    customer_type: 'Unknown',
    service_schedule: {
      trash: 'Unknown',
      recycling: 'Unknown',
      yard_waste: 'Unknown'
    },
    special_requirements: [],
    contract_duration: 'Unknown',
    pricing_constraints: [],
    access_notes: [],
    notes: 'Parsed from document',
    confidence_score: 50
  };

  // Merge with parsed data, keeping defaults for missing fields
  const validatedData = {
    ...defaultData,
    ...rawData,
    service_schedule: {
      ...defaultData.service_schedule,
      ...(rawData.service_schedule || {})
    }
  };

  // Ensure arrays are arrays
  validatedData.special_requirements = Array.isArray(validatedData.special_requirements) 
    ? validatedData.special_requirements : [];
  validatedData.pricing_constraints = Array.isArray(validatedData.pricing_constraints) 
    ? validatedData.pricing_constraints : [];
  validatedData.access_notes = Array.isArray(validatedData.access_notes) 
    ? validatedData.access_notes : [];

  // Ensure units is a number
  validatedData.units = parseInt(String(validatedData.units)) || 0;
  
  // Ensure confidence score is within range
  validatedData.confidence_score = Math.max(0, Math.min(100, validatedData.confidence_score || 50));

  return validatedData;
}

/**
 * Main function to parse contract using GPT
 */
export async function parseContractWithGPT(contractText: string): Promise<GPTParsingResult> {
  try {
    console.log('🤖 Starting GPT contract parsing...');
    
    // Check if we have enough text to parse
    if (!contractText || contractText.trim().length < 50) {
      return {
        success: false,
        error: 'Contract text is too short or empty for meaningful analysis.'
      };
    }

    // Create the parsing prompt
    const prompt = createContractParsingPrompt(contractText);
    
    // Call GPT API
    console.log('📡 Calling OpenAI API...');
    const rawResponse = await callGPTAPI(prompt);
    
    console.log('📄 GPT Response received:', rawResponse);

    // Try to parse the JSON response
    let parsedData;
    try {
      // Clean the response (remove any markdown formatting)
      const cleanedResponse = rawResponse.replace(/```json\n?|\n?```/g, '').trim();
      parsedData = JSON.parse(cleanedResponse);
    } catch (parseError) {
      console.error('❌ JSON parsing error:', parseError);
      return {
        success: false,
        error: 'GPT returned invalid JSON format. Please try again with a clearer document.',
        raw_response: rawResponse
      };
    }

    // Validate and clean the parsed data
    const validatedData = validateParsedData(parsedData);
    
    console.log('✅ Contract parsing completed successfully');
    console.log('📊 Extracted data:', validatedData);

    return {
      success: true,
      data: validatedData,
      raw_response: rawResponse
    };

  } catch (error) {
    console.error('💥 GPT parsing error:', error);
    
    // Check for specific error types
    if (error instanceof Error) {
      if (error.message.includes('API key') || error.message.includes('404')) {
        return {
          success: false,
          error: 'OpenAI API key not configured. Please add OPENAI_API_KEY to your .env.local file.'
        };
      } else if (error.message.includes('quota') || error.message.includes('billing')) {
        return {
          success: false,
          error: 'OpenAI API quota exceeded. Please check your billing and usage limits.'
        };
      } else if (error.message.includes('rate limit')) {
        return {
          success: false,
          error: 'OpenAI API rate limit exceeded. Please wait a moment and try again.'
        };
      }
    }

    return {
      success: false,
      error: 'Could not parse contract details. Please try again with a clearer document.'
    };
  }
}

/**
 * Convert parsed GPT data to RFP analysis format
 */
export function convertGPTDataToRFPFormat(gptData: ParsedContractData): any {
  // Convert service frequencies to numeric values
  const parseFrequency = (freq: string): number => {
    const lower = freq.toLowerCase();
    if (lower.includes('2x') || lower.includes('twice') || lower.includes('two times')) return 2;
    if (lower.includes('1x') || lower.includes('once') || lower.includes('weekly')) return 1;
    if (lower.includes('bi-weekly') || lower.includes('biweekly') || lower.includes('every other')) return 0.5;
    if (lower.includes('none') || lower.includes('no ') || lower.includes('not required')) return 0;
    return 1; // Default to once per week
  };

  return {
    communityName: gptData.community_name,
    location: gptData.address,
    homes: gptData.units,
    serviceType: 'Residential Waste & Recycling',
    pickupFrequency: gptData.service_schedule.trash,
    specialRequirements: [
      ...gptData.special_requirements,
      ...gptData.access_notes,
      ...gptData.pricing_constraints
    ],
    contractLength: gptData.contract_duration === 'Unknown' ? 12 : parseInt(gptData.contract_duration) || 12,
    startDate: new Date().toISOString().split('T')[0],
    fuelSurchargeAllowed: !gptData.pricing_constraints.some(c => 
      c.toLowerCase().includes('no fuel') || c.toLowerCase().includes('fuel surcharge not allowed')
    ),
    timeWindows: gptData.access_notes.some(note => 
      note.toLowerCase().includes('morning') || note.toLowerCase().includes('8am')
    ) ? '8AM-12PM' : 'Flexible',
    recyclingRequired: parseFrequency(gptData.service_schedule.recycling) > 0,
    yardWasteRequired: parseFrequency(gptData.service_schedule.yard_waste) > 0,
    // Enhanced data for fleet analysis
    trashFrequency: parseFrequency(gptData.service_schedule.trash),
    recyclingFrequency: parseFrequency(gptData.service_schedule.recycling),
    yardwasteFrequency: parseFrequency(gptData.service_schedule.yard_waste),
    customerType: gptData.customer_type,
    confidenceScore: gptData.confidence_score
  };
}

/**
 * Format GPT data for display in the UI
 */
export function formatGPTDataForDisplay(gptData: ParsedContractData): string {
  return `GPT Contract Analysis (Confidence: ${gptData.confidence_score}%)

COMMUNITY: ${gptData.community_name}
LOCATION: ${gptData.address}
CUSTOMER TYPE: ${gptData.customer_type}
UNITS: ${gptData.units} ${gptData.customer_type.toLowerCase().includes('commercial') ? 'businesses' : 'homes'}

SERVICE SCHEDULE:
• Trash Collection: ${gptData.service_schedule.trash}
• Recycling Collection: ${gptData.service_schedule.recycling}
• Yard Waste Collection: ${gptData.service_schedule.yard_waste}

CONTRACT DETAILS:
• Duration: ${gptData.contract_duration}
${gptData.special_requirements.length > 0 ? `• Special Requirements: ${gptData.special_requirements.join(', ')}` : ''}
${gptData.access_notes.length > 0 ? `• Access Notes: ${gptData.access_notes.join(', ')}` : ''}
${gptData.pricing_constraints.length > 0 ? `• Pricing Constraints: ${gptData.pricing_constraints.join(', ')}` : ''}

ANALYSIS NOTES:
${gptData.notes}

This analysis was generated using AI interpretation of the contract document. Please review for accuracy before proceeding with bid calculations.`;
} 