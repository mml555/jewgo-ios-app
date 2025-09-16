// Test script to verify LiveMap data integration
const https = require('https');
const http = require('http');

// Function to make HTTP request
function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    
    client.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve(jsonData);
        } catch (error) {
          reject(error);
        }
      });
    }).on('error', (error) => {
      reject(error);
    });
  });
}

// Test the LiveMap data integration
async function testLiveMapData() {
  try {
    console.log('🗺️ Testing LiveMap data integration...\n');
    
    // Test different categories that LiveMap uses
    const categories = ['mikvah', 'eatery', 'shul', 'stores'];
    
    for (const category of categories) {
      console.log(`\n📊 Testing category: ${category}`);
      
      const response = await makeRequest(`http://localhost:3001/api/v5/${category}s?limit=3`);
      
      if (response.success && response.data?.entities) {
        const entities = response.data.entities;
        console.log(`   ✅ Found ${entities.length} entities`);
        
        if (entities.length > 0) {
          const firstEntity = entities[0];
          console.log(`   📍 Name: ${firstEntity.name}`);
          console.log(`   📍 Has coordinates: ${!!firstEntity.latitude && !!firstEntity.longitude}`);
          console.log(`   🖼️ Images count: ${firstEntity.images?.length || 0}`);
          console.log(`   🕒 Business hours count: ${firstEntity.business_hours?.length || 0}`);
          console.log(`   ⭐ Rating: ${firstEntity.rating}`);
          console.log(`   📝 Reviews count: ${firstEntity.recent_reviews?.length || 0}`);
          
          // Check if first image exists for LiveMap
          const firstImage = firstEntity.images?.[0]?.url;
          console.log(`   🖼️ First image URL: ${firstImage ? '✅ Available' : '❌ Missing'}`);
        }
      } else {
        console.log(`   ❌ No data found for ${category}`);
      }
    }
    
    console.log('\n✅ LiveMap data integration test completed!');
    
  } catch (error) {
    console.error('❌ Error testing LiveMap data:', error.message);
  }
}

// Run the test
testLiveMapData();
