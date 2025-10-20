import { Dimensions } from 'react-native';
import { getResponsiveLayout } from './responsiveLayout';

/**
 * Test script to verify responsive layout configuration
 * Run this to check if the layout adapts correctly to different screen sizes
 */

export const testResponsiveLayout = () => {
  console.log('🧪 Testing Responsive Layout Configuration');
  console.log('==========================================');

  // Test different screen sizes
  const testSizes = [
    { name: 'iPhone SE', width: 375, height: 667 },
    { name: 'iPhone 12', width: 390, height: 844 },
    { name: 'iPhone 12 Pro Max', width: 414, height: 896 },
    { name: 'iPad Mini', width: 768, height: 1024 },
    { name: 'iPad Pro 11"', width: 834, height: 1194 },
    { name: 'iPad Pro 12.9"', width: 1024, height: 1366 },
  ];

  testSizes.forEach(({ name, width, height }) => {
    // Mock Dimensions.get for testing
    const originalGet = Dimensions.get;
    Dimensions.get = () => ({
      window: { width, height },
      screen: { width, height },
    });

    const layout = getResponsiveLayout();

    console.log(`\n📱 ${name} (${width}x${height})`);
    console.log(`   Device Type: ${layout.deviceType}`);
    console.log(`   Screen Size: ${layout.screenSize}`);
    console.log(`   Is Tablet: ${layout.isTablet}`);
    console.log(`   Is Landscape: ${layout.isLandscape}`);
    console.log(`   Max Content Width: ${layout.maxContentWidth}`);
    console.log(`   Container Padding: ${layout.containerPadding}`);
    console.log(`   Grid Columns: ${layout.gridColumns}`);
    console.log(`   Card Width: ${Math.round(layout.cardWidth)}`);
    console.log(`   Card Height: ${Math.round(layout.cardHeight)}`);
    console.log(`   Touch Target: ${layout.touchTarget.minimum}px`);

    // Restore original Dimensions.get
    Dimensions.get = originalGet;
  });

  console.log('\n✅ Responsive Layout Test Complete');
  console.log('=====================================');
};

// Export for use in development
export default testResponsiveLayout;
