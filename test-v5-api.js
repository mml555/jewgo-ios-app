// Test script for Jewgo V5 API endpoints
const API_BASE_URL = 'https://api.jewgo.app/api/v5';

async function testV5ApiConnection() {
  console.log('🧪 Testing Jewgo V5 API connection...\n');

  try {
    // Test health check
    console.log('1. Testing health check...');
    const healthResponse = await fetch('https://api.jewgo.app/health');
    const healthText = await healthResponse.text();
    if (healthText.includes('healthy')) {
      console.log('✅ Health check: API is healthy');
      console.log('   Response:', healthText.trim());
    } else {
      console.log('❌ Health check failed:', healthText);
    }

    // Test restaurants endpoint
    console.log('\n2. Testing restaurants endpoint...');
    try {
      const restaurantsResponse = await fetch(`${API_BASE_URL}/restaurants`);
      const restaurantsData = await restaurantsResponse.json();
      if (restaurantsResponse.ok) {
        console.log('✅ Restaurants endpoint working');
        console.log('   Status:', restaurantsResponse.status);
        console.log('   Response keys:', Object.keys(restaurantsData));
        if (restaurantsData.entities) {
          console.log('   Entities count:', restaurantsData.entities.length);
        }
      } else {
        console.log('❌ Restaurants failed:', restaurantsData.error || 'Unknown error');
      }
    } catch (error) {
      console.log('❌ Restaurants failed:', error.message);
    }

    // Test synagogues endpoint
    console.log('\n3. Testing synagogues endpoint...');
    try {
      const synagoguesResponse = await fetch(`${API_BASE_URL}/synagogues`);
      const synagoguesData = await synagoguesResponse.json();
      if (synagoguesResponse.ok) {
        console.log('✅ Synagogues endpoint working');
        console.log('   Status:', synagoguesResponse.status);
        console.log('   Response keys:', Object.keys(synagoguesData));
        if (synagoguesData.entities) {
          console.log('   Entities count:', synagoguesData.entities.length);
        }
      } else {
        console.log('❌ Synagogues failed:', synagoguesData.error || 'Unknown error');
      }
    } catch (error) {
      console.log('❌ Synagogues failed:', error.message);
    }

    // Test mikvahs endpoint
    console.log('\n4. Testing mikvahs endpoint...');
    try {
      const mikvahsResponse = await fetch(`${API_BASE_URL}/mikvahs`);
      const mikvahsData = await mikvahsResponse.json();
      if (mikvahsResponse.ok) {
        console.log('✅ Mikvahs endpoint working');
        console.log('   Status:', mikvahsResponse.status);
        console.log('   Response keys:', Object.keys(mikvahsData));
        if (mikvahsData.entities) {
          console.log('   Entities count:', mikvahsData.entities.length);
        }
      } else {
        console.log('❌ Mikvahs failed:', mikvahsData.error || 'Unknown error');
      }
    } catch (error) {
      console.log('❌ Mikvahs failed:', error.message);
    }

    // Test stores endpoint
    console.log('\n5. Testing stores endpoint...');
    try {
      const storesResponse = await fetch(`${API_BASE_URL}/stores`);
      const storesData = await storesResponse.json();
      if (storesResponse.ok) {
        console.log('✅ Stores endpoint working');
        console.log('   Status:', storesResponse.status);
        console.log('   Response keys:', Object.keys(storesData));
        if (storesData.entities) {
          console.log('   Entities count:', storesData.entities.length);
        }
      } else {
        console.log('❌ Stores failed:', storesData.error || 'Unknown error');
      }
    } catch (error) {
      console.log('❌ Stores failed:', error.message);
    }

    // Test search endpoint
    console.log('\n6. Testing search endpoint...');
    try {
      const searchResponse = await fetch(`${API_BASE_URL}/search?q=kosher`);
      const searchData = await searchResponse.json();
      if (searchResponse.ok) {
        console.log('✅ Search endpoint working');
        console.log('   Status:', searchResponse.status);
        console.log('   Response keys:', Object.keys(searchData));
        if (searchData.entities) {
          console.log('   Search results count:', searchData.entities.length);
        }
      } else {
        console.log('❌ Search failed:', searchData.error || 'Unknown error');
      }
    } catch (error) {
      console.log('❌ Search failed:', error.message);
    }

    // Test reviews endpoint
    console.log('\n7. Testing reviews endpoint...');
    try {
      const reviewsResponse = await fetch(`${API_BASE_URL}/reviews`);
      const reviewsData = await reviewsResponse.json();
      if (reviewsResponse.ok) {
        console.log('✅ Reviews endpoint working');
        console.log('   Status:', reviewsResponse.status);
        console.log('   Response keys:', Object.keys(reviewsData));
        if (reviewsData.reviews) {
          console.log('   Reviews count:', reviewsData.reviews.length);
        }
      } else {
        console.log('❌ Reviews failed:', reviewsData.error || 'Unknown error');
      }
    } catch (error) {
      console.log('❌ Reviews failed:', error.message);
    }

    // Test monitoring endpoint
    console.log('\n8. Testing monitoring endpoint...');
    try {
      const monitoringResponse = await fetch(`${API_BASE_URL}/monitoring/health`);
      const monitoringData = await monitoringResponse.json();
      if (monitoringResponse.ok) {
        console.log('✅ Monitoring endpoint working');
        console.log('   Status:', monitoringResponse.status);
        console.log('   Response keys:', Object.keys(monitoringData));
      } else {
        console.log('❌ Monitoring failed:', monitoringData.error || 'Unknown error');
      }
    } catch (error) {
      console.log('❌ Monitoring failed:', error.message);
    }

    console.log('\n🎉 V5 API connection test completed!');
    console.log('\n📱 Your React Native app can now connect to the V5 API.');
    console.log('   Update your app to use the new apiV5Service');

  } catch (error) {
    console.error('❌ V5 API connection test failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Check if the V5 API is deployed and accessible');
    console.log('   2. Verify the endpoint URLs are correct');
    console.log('   3. Check for any authentication requirements');
    console.log('   4. Ensure the API is not rate limiting requests');
  }
}

// Run the test
testV5ApiConnection();
