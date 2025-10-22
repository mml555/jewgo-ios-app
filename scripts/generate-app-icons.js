#!/usr/bin/env node

/**
 * Jewgo App Icon Generator (Node.js)
 *
 * This script provides instructions for generating iOS and Android app icons
 * using online tools or manual methods.
 *
 * For automated generation, you would need additional npm packages like:
 * - sharp (image processing)
 * - jimp (JavaScript image manipulation)
 */

const fs = require('fs');
const path = require('path');

console.log('🎨 Jewgo App Icon Generator (Node.js)');
console.log('=====================================\n');

// Check if SVG source exists
const svgSource = path.join(__dirname, '..', 'jewgo brand concept.svg.svg');

if (!fs.existsSync(svgSource)) {
  console.error('❌ Source SVG file not found:', svgSource);
  process.exit(1);
}

console.log('✅ Source SVG found:', svgSource);
console.log('');

// iOS icon requirements
const iosIcons = [
  { name: 'Icon-App-20x20@2x.png', size: '40x40' },
  { name: 'Icon-App-20x20@3x.png', size: '60x60' },
  { name: 'Icon-App-29x29@2x.png', size: '58x58' },
  { name: 'Icon-App-29x29@3x.png', size: '87x87' },
  { name: 'Icon-App-40x40@2x.png', size: '80x80' },
  { name: 'Icon-App-40x40@3x.png', size: '120x120' },
  { name: 'Icon-App-60x60@2x.png', size: '120x120' },
  { name: 'Icon-App-60x60@3x.png', size: '180x180' },
  { name: 'Icon-App-1024x1024@1x.png', size: '1024x1024' },
];

// Android icon requirements
const androidIcons = {
  'mipmap-mdpi': '48x48',
  'mipmap-hdpi': '72x72',
  'mipmap-xhdpi': '96x96',
  'mipmap-xxhdpi': '144x144',
  'mipmap-xxxhdpi': '192x192',
};

console.log('📱 iOS Icon Requirements:');
console.log('=========================');
console.log(
  'Location: ios/JewgoAppFinal/Images.xcassets/AppIcon.appiconset/\n',
);
iosIcons.forEach(icon => {
  console.log(`  - ${icon.name.padEnd(30)} → ${icon.size}`);
});

console.log('\n🤖 Android Icon Requirements:');
console.log('============================');
console.log('Location: android/app/src/main/res/\n');
Object.entries(androidIcons).forEach(([folder, size]) => {
  console.log(
    `  - ${folder.padEnd(
      20,
    )} → ic_launcher.png & ic_launcher_round.png (${size})`,
  );
});

console.log('\n📋 Recommended Methods for Icon Generation:');
console.log('===========================================\n');

console.log('Option 1: Online Icon Generators (Easiest)');
console.log('-------------------------------------------');
console.log('1. Convert SVG to 1024x1024 PNG first:');
console.log('   - Open "jewgo brand concept.svg.svg" in browser');
console.log('   - Take screenshot or export as PNG');
console.log('   - Or use https://cloudconvert.com/svg-to-png');
console.log('');
console.log('2. Generate iOS icons:');
console.log('   → https://appicon.co (upload 1024x1024 PNG)');
console.log('   → https://makeappicon.com');
console.log('');
console.log('3. Generate Android icons:');
console.log(
  '   → https://romannurik.github.io/AndroidAssetStudio/icons-launcher.html',
);
console.log('   → https://icon.kitchen');
console.log('');

console.log('Option 2: Using Figma/Sketch/Adobe XD (Designers)');
console.log('--------------------------------------------------');
console.log('1. Import "jewgo brand concept.svg.svg"');
console.log('2. Export as PNG at each required size');
console.log('3. Manually place files in iOS and Android directories');
console.log('');

console.log('Option 3: Using ImageMagick (Command Line)');
console.log('-------------------------------------------');
console.log('1. Install ImageMagick:');
console.log('   macOS:   brew install imagemagick');
console.log('   Ubuntu:  sudo apt-get install imagemagick');
console.log('   Windows: Download from https://imagemagick.org/');
console.log('');
console.log('2. Run the shell script:');
console.log('   ./scripts/generate-app-icons.sh');
console.log('');

console.log('Option 4: Using Node.js with Sharp (Developers)');
console.log('------------------------------------------------');
console.log('1. Install sharp: npm install --save-dev sharp');
console.log('2. Create a custom script (see docs/APP_ICON_UPDATE_GUIDE.md)');
console.log('');

console.log('⚠️  Important Notes:');
console.log('===================');
console.log('• Background color: #c6ffd1 (light mint green)');
console.log('• Icon color: #292b2d (dark charcoal)');
console.log('• iOS icons: No transparency, square (iOS adds rounded corners)');
console.log('• Android icons: Need both square and round versions');
console.log('• Always test on real devices after updating');
console.log('');

console.log('📚 For detailed instructions, see:');
console.log('   docs/APP_ICON_UPDATE_GUIDE.md');
console.log('');

// Check if icons exist
const iosDir = path.join(
  __dirname,
  '..',
  'ios',
  'JewgoAppFinal',
  'Images.xcassets',
  'AppIcon.appiconset',
);
const androidBase = path.join(
  __dirname,
  '..',
  'android',
  'app',
  'src',
  'main',
  'res',
);

let existingIosIcons = 0;
let existingAndroidIcons = 0;

if (fs.existsSync(iosDir)) {
  iosIcons.forEach(icon => {
    if (fs.existsSync(path.join(iosDir, icon.name))) {
      existingIosIcons++;
    }
  });
}

Object.keys(androidIcons).forEach(folder => {
  const folderPath = path.join(androidBase, folder);
  if (fs.existsSync(folderPath)) {
    if (fs.existsSync(path.join(folderPath, 'ic_launcher.png'))) {
      existingAndroidIcons++;
    }
  }
});

console.log('📊 Current Status:');
console.log('==================');
console.log(
  `iOS icons:     ${existingIosIcons}/${iosIcons.length} files exist`,
);
console.log(
  `Android icons: ${existingAndroidIcons}/${
    Object.keys(androidIcons).length
  } densities exist`,
);
console.log('');

if (
  existingIosIcons === iosIcons.length &&
  existingAndroidIcons === Object.keys(androidIcons).length
) {
  console.log('✅ All icon files exist. Replace them with new versions.');
} else {
  console.log('⚠️  Some icon files are missing. Generate complete sets.');
}
console.log('');
