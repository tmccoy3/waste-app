#!/usr/bin/env node

/**
 * Customer Data Migration Script
 * Migrates customer data from geocoded_customers.json to the database
 */

const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('../src/generated/prisma');

const prisma = new PrismaClient();

// Helper function to parse monetary values
function parseMonetaryValue(value) {
  if (!value || typeof value !== 'string') return 0;
  return parseFloat(value.replace(/[$,]/g, '')) || 0;
}

// Helper function to extract city, state, zip from full address
function parseAddress(fullAddress) {
  const match = fullAddress.match(/^(.+?)\s+([A-Z]{2})\s+(\d{5}(?:-\d{4})?)$/);
  if (match) {
    return {
      city: match[1].split(' ').pop(),
      state: match[2],
      zipCode: match[3]
    };
  }
  return { city: null, state: null, zipCode: null };
}

// Helper function to map customer type
function mapCustomerType(type) {
  switch (type?.toUpperCase()) {
    case 'HOA':
      return 'HOA';
    case 'SUBSCRIPTION':
      return 'SUBSCRIPTION';
    case 'COMMERCIAL':
      return 'COMMERCIAL';
    default:
      return 'HOA';
  }
}

// Helper function to map unit type
function mapUnitType(unitType) {
  switch (unitType?.toLowerCase()) {
    case 'townhomes':
    case 'townhome':
      return 'TOWNHOMES';
    case 'single family':
    case 'single-family':
      return 'SINGLE_FAMILY_HOMES';
    case 'condo':
    case 'condos':
      return 'CONDOS';
    case 'apartment':
    case 'apartments':
      return 'MIXED_RESIDENTIAL';
    case 'commercial':
    case 'gas station':
      return 'COMMERCIAL';
    default:
      return 'SINGLE_FAMILY_HOMES';
  }
}

// Helper function to map service status
function mapServiceStatus(status) {
  switch (status?.toLowerCase()) {
    case 'serviced':
    case 'active':
      return 'SERVICED';
    case 'pending':
      return 'PENDING';
    case 'inactive':
    case 'cancelled':
      return 'CANCELLED';
    default:
      return 'SERVICED';
  }
}

async function migrateCustomers() {
  try {
    console.log('🚀 Starting customer data migration...');
    
    // Read the JSON file
    const dataPath = path.join(process.cwd(), 'data', 'geocoded_customers.json');
    if (!fs.existsSync(dataPath)) {
      throw new Error('geocoded_customers.json not found in data directory');
    }
    
    const rawData = fs.readFileSync(dataPath, 'utf8');
    const customers = JSON.parse(rawData);
    
    console.log(`📊 Found ${customers.length} customers to migrate`);
    
    // Create a default user for the migration (admin user)
    let defaultUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    });
    
    if (!defaultUser) {
      console.log('👤 Creating default admin user for migration...');
      defaultUser = await prisma.user.create({
        data: {
          email: 'admin@wasteops.com',
          username: 'admin',
          firstName: 'System',
          lastName: 'Admin',
          role: 'ADMIN',
          isActive: true
        }
      });
    }
    
    // Clear existing customers
    console.log('🗑️  Clearing existing customers...');
    await prisma.customer.deleteMany({});
    
    // Migrate customers
    console.log('📝 Migrating customers...');
    let successCount = 0;
    let errorCount = 0;
    
    for (const customer of customers) {
      try {
        const addressInfo = parseAddress(customer['Full Address'] || '');
        
        const customerData = {
          hoaName: customer['HOA Name'] || 'Unknown',
          fullAddress: customer['Full Address'] || '',
          city: addressInfo.city,
          state: addressInfo.state,
          zipCode: addressInfo.zipCode,
          latitude: parseFloat(customer.latitude) || null,
          longitude: parseFloat(customer.longitude) || null,
          monthlyRevenue: parseMonetaryValue(customer['Monthly Revenue']),
          avgCompletionTime: parseFloat(customer['Average Completion Time in Minutes']) || 0,
          serviceStatus: mapServiceStatus(customer['Service Status']),
          unitType: mapUnitType(customer['Unit Type']),
          customerType: mapCustomerType(customer['Type']),
          numberOfUnits: parseInt(customer['Number of Units']) || null,
          contactEmail: customer['Contact Email'] || null,
          contactPhone: customer['Contact Phone'] || null,
          contractStartDate: customer['Contract Start Date'] ? new Date(customer['Contract Start Date']) : null,
          contractEndDate: customer['Contract End Date'] ? new Date(customer['Contract End Date']) : null,
          isActive: customer['Service Status']?.toLowerCase() === 'serviced' || customer['Service Status']?.toLowerCase() === 'active',
          createdById: defaultUser.id
        };
        
        await prisma.customer.create({
          data: customerData
        });
        
        successCount++;
        
        if (successCount % 10 === 0) {
          console.log(`   📈 Migrated ${successCount} customers...`);
        }
        
      } catch (error) {
        console.error(`❌ Error migrating customer ${customer['HOA Name']}:`, error.message);
        errorCount++;
      }
    }
    
    console.log(`\n✅ Migration completed!`);
    console.log(`   📊 Total customers: ${customers.length}`);
    console.log(`   ✅ Successfully migrated: ${successCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    
    // Verify the migration
    const migratedCount = await prisma.customer.count();
    console.log(`   🔍 Verification: ${migratedCount} customers in database`);
    
    if (migratedCount !== successCount) {
      console.warn(`⚠️  Warning: Expected ${successCount} customers, found ${migratedCount}`);
    }
    
  } catch (error) {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
migrateCustomers(); 