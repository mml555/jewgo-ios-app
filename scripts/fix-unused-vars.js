#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * This script fixes common unused variable patterns in TypeScript/React files
 */

// Patterns to fix
const fixes = [
  // Remove specific unused imports
  {
    pattern:
      /^import\s+.*\{\s*Text\s*,\s*TextInput\s*\}\s*from\s+'react-native';$/gm,
    replacement: match => {
      // If both are unused, remove them
      if (match.includes('Text') && match.includes('TextInput')) {
        return match
          .replace(/,\s*Text\s*,\s*TextInput/, '')
          .replace(/\{\s*Text\s*,\s*TextInput\s*\}/, '{}');
      }
      return match;
    },
  },
  // Remove useState from unused list
  {
    pattern: /import\s+React,\s+\{\s*useState\s*,/g,
    check: content => {
      // Only remove if useState is never used
      return !content.match(/useState\(/);
    },
    replacement: 'import React, {',
  },
  // Prefix unused parameters with underscore
  {
    pattern: /\(\s*([a-zA-Z][a-zA-Z0-9]*)\s*:\s*[^)]+\)\s*=>\s*\{/g,
    check: (content, param) => {
      // Check if parameter is used in the function body
      const regex = new RegExp(`\\b${param}\\b`, 'g');
      const matches = content.match(regex);
      return matches && matches.length === 1; // Only declaration, no usage
    },
    replacement: (match, param) => match.replace(param, `_${param}`),
  },
];

function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Apply fixes
    fixes.forEach(fix => {
      const originalContent = content;

      if (fix.check) {
        // Apply check before replacement
        if (fix.check(content)) {
          content = content.replace(fix.pattern, fix.replacement);
        }
      } else if (typeof fix.replacement === 'function') {
        content = content.replace(fix.pattern, fix.replacement);
      } else {
        content = content.replace(fix.pattern, fix.replacement);
      }

      if (content !== originalContent) {
        modified = true;
      }
    });

    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Fixed: ${filePath}`);
      return true;
    }

    return false;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return false;
  }
}

function walkDir(dir, callback) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      if (!file.includes('node_modules') && !file.startsWith('.')) {
        walkDir(filePath, callback);
      }
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      callback(filePath);
    }
  });
}

// Main execution
const srcDir = path.join(__dirname, '..', 'src');
let fixedCount = 0;

console.log('🔧 Scanning and fixing unused variables...\n');

walkDir(srcDir, filePath => {
  if (processFile(filePath)) {
    fixedCount++;
  }
});

console.log(`\n✨ Done! Fixed ${fixedCount} files.`);
