import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    // Read the customer data file
    const filePath = path.join(process.cwd(), 'data', 'geocoded_customers.json');
    const fileContents = fs.readFileSync(filePath, 'utf8');
    const customerData = JSON.parse(fileContents);

    return NextResponse.json(customerData);
  } catch (error) {
    console.error('Error reading customer data:', error);
    return NextResponse.json(
      { error: 'Failed to load customer data' },
      { status: 500 }
    );
  }
} 