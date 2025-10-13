#!/usr/bin/env node

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function convertSvgToPng() {
  const svgPath = path.join(__dirname, '..', 'jewgo brand concept.svg.svg');
  const outputPath = path.join(__dirname, '..', 'jewgo-icon-1024.png');
  
  console.log('🎨 Converting SVG to PNG...');
  console.log(`📁 Input: ${svgPath}`);
  console.log(`📁 Output: ${outputPath}`);
  
  if (!fs.existsSync(svgPath)) {
    console.error('❌ SVG file not found!');
    process.exit(1);
  }
  
  try {
    // Read SVG file
    const svgBuffer = fs.readFileSync(svgPath);
    
    // Convert to PNG at 1024x1024
    await sharp(svgBuffer, { density: 300 })
      .resize(1024, 1024, {
        fit: 'contain',
        background: { r: 198, g: 255, b: 209, alpha: 1 } // #c6ffd1
      })
      .png()
      .toFile(outputPath);
    
    console.log('✅ Successfully converted to PNG!');
    console.log(`📦 Output file: ${outputPath}`);
    console.log('');
    console.log('📋 Next steps:');
    console.log('1. Upload jewgo-icon-1024.png to https://appicon.co for iOS icons');
    console.log('2. Upload jewgo-icon-1024.png to https://romannurik.github.io/AndroidAssetStudio for Android icons');
    console.log('3. Download and replace the generated icon files');
    
  } catch (error) {
    console.error('❌ Error converting SVG to PNG:', error.message);
    process.exit(1);
  }
}

convertSvgToPng();

