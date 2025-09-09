const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Define the required icon sizes for iOS
const iconSizes = [
  { size: 40, scale: '2x', filename: 'Icon-App-20x20@2x.png' },    // 20x20@2x
  { size: 60, scale: '3x', filename: 'Icon-App-20x20@3x.png' },    // 20x20@3x
  { size: 58, scale: '2x', filename: 'Icon-App-29x29@2x.png' },    // 29x29@2x
  { size: 87, scale: '3x', filename: 'Icon-App-29x29@3x.png' },    // 29x29@3x
  { size: 80, scale: '2x', filename: 'Icon-App-40x40@2x.png' },    // 40x40@2x
  { size: 120, scale: '3x', filename: 'Icon-App-40x40@3x.png' },   // 40x40@3x
  { size: 120, scale: '2x', filename: 'Icon-App-60x60@2x.png' },   // 60x60@2x
  { size: 180, scale: '3x', filename: 'Icon-App-60x60@3x.png' },   // 60x60@3x
  { size: 1024, scale: '1x', filename: 'Icon-App-1024x1024@1x.png' } // 1024x1024@1x
];

const inputSvg = path.join(__dirname, 'logo-dark.svg');
const outputDir = path.join(__dirname, 'ios', 'JewgoAppFinal', 'Images.xcassets', 'AppIcon.appiconset');

async function generateIcons() {
  try {
    console.log('Generating app icons from logo-dark.svg...');
    
    // Read the SVG file
    const svgBuffer = fs.readFileSync(inputSvg);
    
    for (const icon of iconSizes) {
      const outputPath = path.join(outputDir, icon.filename);
      
      console.log(`Generating ${icon.filename} (${icon.size}x${icon.size})...`);
      
      await sharp(svgBuffer)
        .resize(icon.size, icon.size)
        .png()
        .toFile(outputPath);
      
      console.log(`✓ Created ${icon.filename}`);
    }
    
    console.log('\n🎉 All app icons generated successfully!');
    console.log('📱 Your app will now use the JEWGO logo on the iPhone home screen');
    
  } catch (error) {
    console.error('Error generating icons:', error);
  }
}

generateIcons();
