#!/usr/bin/env node

/**
 * Environment Validation CLI Tool
 * Validates environment configuration and runs security audit
 */

const fs = require('fs');
const path = require('path');

// Import the secrets manager (we'll need to adjust the import path)
const secretsManagerPath = path.join(__dirname, '../src/lib/secrets-manager.ts');

// Simple color console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  reset: '\x1b[0m'
};

function log(message, color = 'white') {
  console.log(colors[color] + message + colors.reset);
}

function printHeader(title) {
  log('\n' + '='.repeat(60), 'cyan');
  log(`  ${title}`, 'cyan');
  log('='.repeat(60), 'cyan');
}

function printSection(title) {
  log(`\n${title}`, 'blue');
  log('-'.repeat(title.length), 'blue');
}

// Load environment variables
function loadEnvFile(filePath) {
  try {
    const envContent = fs.readFileSync(filePath, 'utf8');
    const lines = envContent.split('\n');
    
    lines.forEach(line => {
      // Skip comments and empty lines
      if (line.trim() && !line.trim().startsWith('#')) {
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=').replace(/^["']|["']$/g, '');
          process.env[key.trim()] = value.trim();
        }
      }
    });
    
    return true;
  } catch (error) {
    return false;
  }
}

// Manual validation (since we can't easily import the TypeScript module)
function validateEnvironment() {
  const requiredSecrets = [
    'DATABASE_URL',
    'NEXT_PUBLIC_GOOGLE_MAPS_API_KEY',
    'GOOGLE_SERVICE_ACCOUNT_KEY',
    'NEXT_PUBLIC_APP_URL'
  ];

  const optionalSecrets = [
    'GOOGLE_SHEETS_API_KEY',
    'GOOGLE_SPREADSHEET_ID',
    'GOOGLE_CHAT_WEBHOOK_URL',
    'FRESHBOOKS_CLIENT_ID',
    'FRESHBOOKS_CLIENT_SECRET',
    'FRESHBOOKS_ACCESS_TOKEN',
    'FRESHBOOKS_REFRESH_TOKEN',
    'TIMEERO_API_KEY',
    'OPENAI_API_KEY',
    'OPENROUTESERVICE_API_KEY'
  ];

  const results = {
    valid: [],
    invalid: [],
    missing: [],
    warnings: []
  };

  // Validate required secrets
  requiredSecrets.forEach(key => {
    const value = process.env[key];
    
    if (!value) {
      results.missing.push(key);
    } else if (value.includes('your_') || value.includes('...') || value === 'demo-key') {
      results.invalid.push(key);
      results.warnings.push(`${key}: Using placeholder value`);
    } else {
      // Basic validation
      let isValid = true;
      
      if (key === 'DATABASE_URL' && !value.startsWith('postgresql://')) {
        isValid = false;
        results.warnings.push(`${key}: Should start with postgresql://`);
      }
      
      if (key === 'NEXT_PUBLIC_GOOGLE_MAPS_API_KEY' && !value.startsWith('AIza')) {
        isValid = false;
        results.warnings.push(`${key}: Should start with AIza`);
      }
      
      if (key === 'GOOGLE_SERVICE_ACCOUNT_KEY') {
        try {
          JSON.parse(value);
        } catch (e) {
          isValid = false;
          results.warnings.push(`${key}: Invalid JSON format`);
        }
      }
      
      if (isValid) {
        results.valid.push(key);
      } else {
        results.invalid.push(key);
      }
    }
  });

  // Check optional secrets
  optionalSecrets.forEach(key => {
    const value = process.env[key];
    
    if (value && !value.includes('your_') && !value.includes('...')) {
      results.valid.push(key);
    }
  });

  // Calculate security score
  const totalSecrets = requiredSecrets.length + optionalSecrets.length;
  const validCount = results.valid.length;
  const requiredValidCount = requiredSecrets.filter(key => results.valid.includes(key)).length;
  
  const securityScore = Math.round(
    (validCount / totalSecrets) * 100 * 0.7 + 
    (requiredValidCount / requiredSecrets.length) * 100 * 0.3
  );

  return {
    ...results,
    securityScore,
    requiredSecrets,
    optionalSecrets
  };
}

function main() {
  printHeader('ENVIRONMENT VALIDATION & SECURITY AUDIT');
  
  // Check for environment files
  const envFiles = ['.env.local', '.env'];
  let envLoaded = false;
  
  log('\n🔍 Checking for environment files...', 'cyan');
  
  for (const file of envFiles) {
    const filePath = path.join(process.cwd(), file);
    if (fs.existsSync(filePath)) {
      log(`   ✅ Found: ${file}`, 'green');
      if (loadEnvFile(filePath)) {
        log(`   📝 Loaded environment from: ${file}`, 'green');
        envLoaded = true;
        break;
      }
    } else {
      log(`   ❌ Not found: ${file}`, 'red');
    }
  }
  
  if (!envLoaded) {
    log('\n⚠️  No environment files found. Using system environment variables.', 'yellow');
  }

  // Run validation
  printSection('VALIDATION RESULTS');
  
  const validation = validateEnvironment();
  
  // Display security score
  const scoreColor = validation.securityScore >= 80 ? 'green' : 
                    validation.securityScore >= 60 ? 'yellow' : 'red';
  
  log(`\n📊 Security Score: ${validation.securityScore}%`, scoreColor);
  log(`✅ Valid Secrets: ${validation.valid.length}`, 'green');
  log(`❌ Invalid Secrets: ${validation.invalid.length}`, 'red');
  log(`⚠️  Missing Required: ${validation.missing.length}`, 'yellow');
  
  // Show detailed results
  if (validation.missing.length > 0) {
    printSection('MISSING REQUIRED CREDENTIALS');
    validation.missing.forEach(key => {
      log(`   ❌ ${key}`, 'red');
    });
  }
  
  if (validation.invalid.length > 0) {
    printSection('INVALID CREDENTIALS');
    validation.invalid.forEach(key => {
      log(`   ⚠️  ${key}`, 'yellow');
    });
  }
  
  if (validation.warnings.length > 0) {
    printSection('WARNINGS');
    validation.warnings.forEach(warning => {
      log(`   ⚠️  ${warning}`, 'yellow');
    });
  }
  
  if (validation.valid.length > 0) {
    printSection('VALID CREDENTIALS');
    validation.valid.forEach(key => {
      log(`   ✅ ${key}`, 'green');
    });
  }
  
  // Security recommendations
  printSection('SECURITY RECOMMENDATIONS');
  
  if (validation.missing.length > 0) {
    log('   🔒 Configure missing required credentials', 'yellow');
  }
  
  if (validation.invalid.length > 0) {
    log('   🔑 Replace placeholder values with real credentials', 'yellow');
  }
  
  if (validation.securityScore < 70) {
    log('   📈 Consider adding optional credentials for enhanced functionality', 'yellow');
  }
  
  log('   🛡️  Use environment-specific credentials (dev/staging/prod)', 'cyan');
  log('   🔄 Rotate credentials regularly', 'cyan');
  log('   📝 Never commit .env files to version control', 'cyan');
  log('   🏢 Use proper secrets management in production', 'cyan');
  
  // Setup instructions
  printSection('SETUP INSTRUCTIONS');
  
  if (!envLoaded) {
    log('   1. Copy env.secure.template to .env.local:', 'cyan');
    log('      cp env.secure.template .env.local', 'white');
    log('   2. Edit .env.local with your actual credentials', 'cyan');
    log('   3. Run this validation again: npm run validate-env', 'cyan');
  } else {
    log('   1. Edit your environment file with missing credentials', 'cyan');
    log('   2. Replace any placeholder values', 'cyan');
    log('   3. Run this validation again to verify', 'cyan');
  }
  
  // Exit with appropriate code
  const exitCode = validation.missing.length > 0 ? 1 : 0;
  
  if (exitCode === 0) {
    log('\n🎉 Environment validation completed successfully!', 'green');
  } else {
    log('\n❌ Environment validation failed. Please fix the issues above.', 'red');
  }
  
  process.exit(exitCode);
}

// Run the tool
main(); 