#!/usr/bin/env node

/**
 * Script to automatically add missing Alert imports to screen files
 * Fixes the systematic issue where Alert is used but not imported
 */

const fs = require('fs');
const path = require('path');

// List of files that need Alert import
const filesToFix = [
  'src/screens/AddCategoryScreen.tsx',
  'src/screens/AddMikvahScreen.tsx',
  'src/screens/AddSynagogueScreen.tsx',
  'src/screens/CategoryGridScreen.tsx',
  'src/screens/CreateJobScreen.tsx',
  'src/screens/CreateStoreScreen.tsx',
  'src/screens/DatabaseDashboard.tsx',
  'src/screens/EditSpecialScreen.tsx',
  'src/screens/EditStoreScreen.tsx',
  'src/screens/EnhancedJobsScreen.tsx',
  'src/screens/FavoritesScreen.tsx',
  'src/screens/JobDetailScreen.tsx',
  'src/screens/JobSeekerDetailScreen.tsx',
  'src/screens/JobSeekingScreen.tsx',
  'src/screens/ListingDetailScreen.tsx',
  'src/screens/ProductDetailScreen.tsx',
  'src/screens/ProductManagementScreen.tsx',
  'src/screens/SettingsScreen.tsx',
  'src/screens/SpecialDetailScreen.tsx',
  'src/screens/SpecialsScreen.tsx',
  'src/screens/StoreDetailScreen.tsx',
  'src/screens/StoreSpecialsScreen.tsx',
  'src/screens/admin/AdminDashboard.tsx',
  'src/screens/admin/FlaggedContentScreen.tsx',
  'src/screens/admin/ReviewQueueScreen.tsx',
  'src/screens/auth/ForgotPasswordScreen.tsx',
  'src/screens/auth/GuestContinueScreen.tsx',
  'src/screens/auth/LoginScreen.tsx',
  'src/screens/auth/RegisterScreen.tsx',
  'src/screens/claims/ClaimDetailScreen.tsx',
  'src/screens/claims/ClaimListingScreen.tsx',
  'src/screens/claims/MyClaimsScreen.tsx',
  'src/screens/events/CreateEventScreen.tsx',
  'src/screens/events/EventDetailScreen.tsx',
  'src/screens/events/EventsScreen.tsx',
  'src/screens/events/MyEventsScreen.tsx',
  'src/screens/jobs/CreateJobScreen.tsx',
  'src/screens/jobs/CreateJobSeekerProfileScreen.tsx',
  'src/screens/jobs/JobDetailScreen.tsx',
  'src/screens/jobs/JobListingsScreen.tsx',
  'src/screens/jobs/JobSeekerDetailScreen.tsx',
  'src/screens/jobs/JobSeekerProfilesScreen.tsx',
  'src/screens/jobs/MyJobsScreen.tsx',
];

let successCount = 0;
let skipCount = 0;
let errorCount = 0;

console.log('🔧 Fixing missing Alert imports...\n');

filesToFix.forEach(filePath => {
  const fullPath = path.join(process.cwd(), filePath);

  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  Skipping ${filePath} - file not found`);
    skipCount++;
    return;
  }

  try {
    let content = fs.readFileSync(fullPath, 'utf8');

    // Check if Alert is already imported
    if (
      content.match(/import\s+{[^}]*Alert[^}]*}\s+from\s+['"]react-native['"]/)
    ) {
      console.log(`✓ Skipping ${filePath} - Alert already imported`);
      skipCount++;
      return;
    }

    // Find the react-native import statement
    const reactNativeImportRegex =
      /(import\s+{)([^}]+)(}\s+from\s+['"]react-native['"];?)/;
    const match = content.match(reactNativeImportRegex);

    if (match) {
      const imports = match[2]
        .split(',')
        .map(i => i.trim())
        .filter(i => i);

      // Check if Alert is already in the list
      if (imports.includes('Alert')) {
        console.log(`✓ Skipping ${filePath} - Alert already in imports`);
        skipCount++;
        return;
      }

      // Add Alert to imports and sort them
      imports.push('Alert');
      imports.sort();

      const newImportStatement = `${match[1]}\n  ${imports.join(',\n  ')},\n${
        match[3]
      }`;
      content = content.replace(reactNativeImportRegex, newImportStatement);

      // Write the modified content back
      fs.writeFileSync(fullPath, content, 'utf8');
      console.log(`✅ Fixed ${filePath}`);
      successCount++;
    } else {
      console.log(`⚠️  Could not find react-native import in ${filePath}`);
      errorCount++;
    }
  } catch (error) {
    console.log(`❌ Error processing ${filePath}: ${error.message}`);
    errorCount++;
  }
});

console.log('\n📊 Summary:');
console.log(`✅ Fixed: ${successCount}`);
console.log(`⚠️  Skipped: ${skipCount}`);
console.log(`❌ Errors: ${errorCount}`);
console.log(`📝 Total: ${filesToFix.length}`);

if (successCount > 0) {
  console.log('\n✨ All Alert imports have been fixed!');
  console.log('📝 Please review the changes and run: npm run lint');
}
