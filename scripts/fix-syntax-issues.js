#!/usr/bin/env node

/**
 * Script to fix syntax issues caused by debug log cleanup
 * Removes orphaned comments and fixes broken syntax
 */

const fs = require('fs');
const path = require('path');

// Files that need syntax fixes
const filesToFix = [
  'src/screens/LiveMapAllScreen.tsx',
  'src/components/CategoryCard.tsx',
  'src/hooks/useCategoryData.ts',
  'src/components/CategoryRail.tsx',
];

// Patterns to fix
const fixPatterns = [
  // Remove orphaned comment lines
  {
    pattern: /^\s*\/\/ Removed console\.log for performance\s*$/gm,
    replacement: '',
    description: 'Remove orphaned console.log comments'
  },
  {
    pattern: /^\s*\/\/ Removed debug logging for performance\s*$/gm,
    replacement: '',
    description: 'Remove orphaned debug logging comments'
  },
  {
    pattern: /^\s*\/\/ \/\/ Removed debug logging for performance\s*$/gm,
    replacement: '',
    description: 'Remove double-commented debug logging'
  },
  // Fix incomplete if statements
  {
    pattern: /if \(__DEV__\) \/\/ Removed console\.log for performance\s*\n/g,
    replacement: '',
    description: 'Remove incomplete if statements'
  },
  // Remove empty comment blocks
  {
    pattern: /^\s*\/\/ Removed .* for performance\s*$/gm,
    replacement: '',
    description: 'Remove all performance comment lines'
  },
  // Clean up multiple consecutive comment lines
  {
    pattern: /(\/\/ Removed .* for performance\s*\n){2,}/g,
    replacement: '',
    description: 'Remove consecutive performance comments'
  }
];

function fixFile(filePath) {
  const fullPath = path.join(process.cwd(), filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  File not found: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(fullPath, 'utf8');
  let changes = 0;

  fixPatterns.forEach(({ pattern, replacement, description }) => {
    const matches = content.match(pattern);
    if (matches) {
      content = content.replace(pattern, replacement);
      changes += matches.length;
      console.log(`✅ ${description}: ${matches.length} matches in ${filePath}`);
    }
  });

  // Clean up extra blank lines
  content = content.replace(/\n{3,}/g, '\n\n');

  if (changes > 0) {
    fs.writeFileSync(fullPath, content);
    console.log(`📝 Updated ${filePath} with ${changes} changes`);
  } else {
    console.log(`✨ No changes needed for ${filePath}`);
  }
}

function main() {
  console.log('🔧 Fixing syntax issues from debug log cleanup...\n');

  filesToFix.forEach(fixFile);

  console.log('\n✅ Syntax fixes completed!');
  console.log('\n📊 Summary of fixes:');
  console.log('- Removed orphaned comment lines');
  console.log('- Fixed incomplete if statements');
  console.log('- Cleaned up consecutive comment blocks');
  console.log('- Removed empty comment lines');
}

if (require.main === module) {
  main();
}

module.exports = { fixFile, fixPatterns };
