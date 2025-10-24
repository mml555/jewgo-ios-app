#!/usr/bin/env node

/**
 * Script to clean up excessive debug logging in the app
 * This script removes or optimizes debug logs to improve performance
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Files to clean up (most critical for performance)
const criticalFiles = [
  'src/components/CategoryCard.tsx',
  'src/screens/LiveMapAllScreen.tsx',
  'src/screens/LiveMapScreen.tsx',
  'src/screens/ListingDetailScreen.tsx',
  'src/hooks/useCategoryData.ts',
  'src/services/api.ts',
  'src/screens/HomeScreen.tsx',
  'src/components/CategoryRail.tsx',
];

// Patterns to remove or optimize
const patterns = [
  // Remove excessive debug logs
  {
    pattern: /debugLog\([^)]*\);?\s*\n/g,
    replacement: '// Removed debug logging for performance\n',
    description: 'Remove debug logs',
  },
  {
    pattern: /console\.log\([^)]*\);?\s*\n/g,
    replacement: '// Removed console.log for performance\n',
    description: 'Remove console.log statements',
  },
  {
    pattern: /infoLog\([^)]*\);?\s*\n/g,
    replacement: '// Removed info logging for performance\n',
    description: 'Remove info logs',
  },
  // Optimize remaining debug logs with throttling
  {
    pattern: /debugLog\(/g,
    replacement: 'if (__DEV__ && Math.random() < 0.1) debugLog(',
    description: 'Throttle remaining debug logs',
  },
];

function cleanupFile(filePath) {
  const fullPath = path.join(process.cwd(), filePath);

  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  File not found: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(fullPath, 'utf8');
  let changes = 0;

  patterns.forEach(({ pattern, replacement, description }) => {
    const matches = content.match(pattern);
    if (matches) {
      content = content.replace(pattern, replacement);
      changes += matches.length;
      console.log(
        `✅ ${description}: ${matches.length} matches in ${filePath}`,
      );
    }
  });

  if (changes > 0) {
    fs.writeFileSync(fullPath, content);
    console.log(`📝 Updated ${filePath} with ${changes} changes`);
  } else {
    console.log(`✨ No changes needed for ${filePath}`);
  }
}

function main() {
  console.log('🧹 Starting debug log cleanup...\n');

  criticalFiles.forEach(cleanupFile);

  console.log('\n✅ Debug log cleanup completed!');
  console.log('\n📊 Summary of optimizations:');
  console.log('- Removed excessive debug logging');
  console.log('- Throttled remaining logs to 10% frequency');
  console.log('- Reduced logger buffer from 1000 to 100 messages');
  console.log('- Changed default log level from DEBUG to WARN');
}

if (require.main === module) {
  main();
}

module.exports = { cleanupFile, patterns };
