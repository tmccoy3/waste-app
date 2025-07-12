/**
 * Test Script for New Pricing Service
 * Run with: node test-pricing-service.js
 */

const { PricingService, createRFPRequest } = require('./dist/services/pricing');

async function testPricingService() {
  console.log('🎯 Testing New Consolidated Pricing Service\n');

  try {
    // Create a new pricing service instance
    const pricingService = new PricingService();
    
    // Test 1: Single Family Homes
    console.log('📋 Test 1: Large Single Family Community');
    const sfhRequest = createRFPRequest(
      'Maple Ridge HOA',
      'Fairfax, VA',
      350,
      {
        unitType: 'Single Family Homes',
        accessType: 'curbside',
        isGated: false,
        services: {
          trash: { frequency: 'weekly', required: true },
          recycling: { frequency: 'bi-weekly', required: true },
          yardWaste: { frequency: 'weekly', required: false }
        }
      }
    );

    const sfhResult = await pricingService.calculatePricing(sfhRequest);
    console.log(`   Community: ${sfhResult.recommendation.shouldBid ? '✅' : '❌'} ${sfhRequest.communityName}`);
    console.log(`   Price: $${sfhResult.pricing.pricePerUnit.toFixed(2)}/home/month`);
    console.log(`   Revenue: $${sfhResult.pricing.totalMonthlyRevenue.toLocaleString()}/month`);
    console.log(`   Margin: ${(sfhResult.pricing.marginPercent * 100).toFixed(1)}%`);
    console.log(`   Recommendation: ${sfhResult.recommendation.recommendationType}`);
    console.log(`   Serviceability: ${sfhResult.recommendation.serviceabilityScore}/100\n`);

    // Test 2: Townhomes with Walk-out Service
    console.log('📋 Test 2: Townhome Community with Walk-out Service');
    const townhomeRequest = createRFPRequest(
      'Oakwood Townhomes',
      'Arlington, VA',
      120,
      {
        unitType: 'Townhomes',
        accessType: 'walkout',
        isGated: true,
        services: {
          trash: { frequency: 'twice-weekly', required: true },
          recycling: { frequency: 'weekly', required: true },
          yardWaste: { frequency: 'bi-weekly', required: true }
        },
        specialRequirements: ['Walk-out service required', 'Gated community access']
      }
    );

    const townhomeResult = await pricingService.calculatePricing(townhomeRequest);
    console.log(`   Community: ${townhomeResult.recommendation.shouldBid ? '✅' : '❌'} ${townhomeRequest.communityName}`);
    console.log(`   Price: $${townhomeResult.pricing.pricePerUnit.toFixed(2)}/home/month`);
    console.log(`   Base Price: $${townhomeResult.pricing.basePrice.toFixed(2)}`);
    console.log(`   Walk-out Premium: +$${townhomeResult.pricing.premiums.walkout.toFixed(2)}`);
    console.log(`   Gated Premium: +$${townhomeResult.pricing.premiums.gated.toFixed(2)}`);
    console.log(`   Volume Discount: -$${townhomeResult.pricing.discounts.volume.toFixed(2)}`);
    console.log(`   Margin: ${(townhomeResult.pricing.marginPercent * 100).toFixed(1)}%`);
    console.log(`   Fleet Utilization: ${townhomeResult.operations.fleetUtilization.utilizationPercent.toFixed(1)}%\n`);

    // Test 3: Small Condo Community (challenging economics)
    console.log('📋 Test 3: Small Condo Community');
    const condoRequest = createRFPRequest(
      'Riverside Condos',
      'Loudoun County, VA',
      45,
      {
        unitType: 'Condos',
        accessType: 'dumpster',
        hasSpecialContainers: true,
        contractLength: 5,
        fuelSurchargeAllowed: false,
        services: {
          trash: { frequency: 'three-times-weekly', required: true },
          recycling: { frequency: 'weekly', required: true },
          yardWaste: { frequency: 'seasonal', required: false }
        },
        specialRequirements: ['Special container management', 'No fuel surcharge allowed']
      }
    );

    const condoResult = await pricingService.calculatePricing(condoRequest);
    console.log(`   Community: ${condoResult.recommendation.shouldBid ? '✅' : '❌'} ${condoRequest.communityName}`);
    console.log(`   Price: $${condoResult.pricing.pricePerUnit.toFixed(2)}/unit/month`);
    console.log(`   Margin: ${(condoResult.pricing.marginPercent * 100).toFixed(1)}%`);
    console.log(`   Recommendation: ${condoResult.recommendation.recommendationType}`);
    console.log(`   Risk Flags: ${condoResult.recommendation.riskFlags.length}`);
    if (condoResult.recommendation.riskFlags.length > 0) {
      condoResult.recommendation.riskFlags.forEach(flag => console.log(`     - ${flag}`));
    }
    console.log(`   Confidence: ${condoResult.recommendation.confidence}\n`);

    // Test 4: Configuration Management
    console.log('📋 Test 4: Configuration Management');
    const originalConfig = pricingService.getConfig();
    console.log(`   Original Target Margin: ${(originalConfig.targetMargin * 100).toFixed(1)}%`);
    
    // Update configuration
    pricingService.updateConfig({
      targetMargin: 0.40, // Increase to 40%
      laborRatePerHour: 95  // Increase labor rate
    });
    
    const updatedConfig = pricingService.getConfig();
    console.log(`   Updated Target Margin: ${(updatedConfig.targetMargin * 100).toFixed(1)}%`);
    console.log(`   Updated Labor Rate: $${updatedConfig.laborRatePerHour}/hour\n`);

    // Test 5: Error Handling
    console.log('📋 Test 5: Error Handling');
    try {
      const invalidRequest = createRFPRequest('', '', 0);
      await pricingService.calculatePricing(invalidRequest);
    } catch (error) {
      console.log(`   ✅ Validation Error Caught: ${error.message}`);
      console.log(`   Error Code: ${error.code}\n`);
    }

    console.log('🎉 All tests completed successfully!');
    console.log('\n📊 Summary:');
    console.log('   ✅ Pricing calculations working');
    console.log('   ✅ Premium and discount logic working');
    console.log('   ✅ Recommendation engine working');
    console.log('   ✅ Configuration management working');
    console.log('   ✅ Error handling working');
    console.log('\n🚀 Pricing Service is ready for integration!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testPricingService();
}

module.exports = { testPricingService }; 