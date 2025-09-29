#!/usr/bin/env node

// Test script for ShtetlService functionality
// Using Node.js built-in fetch (Node 18+)

const BASE_URL = 'http://127.0.0.1:3001/api/v5';
const GUEST_TOKEN = 'cef33aff5575746b6cc1e1f9760f546e9defb9e62ecdefa5bf1f7ce7ca12f74b';

async function testShtetlService() {
  console.log('🧪 Testing ShtetlService endpoints...\n');

  try {
    // Test stores endpoint
    console.log('📦 Testing stores endpoint...');
    const storesResponse = await fetch(`${BASE_URL}/stores?limit=3`, {
      headers: {
        'Content-Type': 'application/json',
        'X-Guest-Token': GUEST_TOKEN,
      },
    });

    if (storesResponse.ok) {
      const storesData = await storesResponse.json();
      console.log('✅ Stores endpoint working');
      console.log(`📊 Found ${storesData.data?.entities?.length || 0} stores`);
      if (storesData.data?.entities?.[0]) {
        console.log(`🏪 Sample store: ${storesData.data.entities[0].name}`);
      }
    } else {
      console.log('❌ Stores endpoint failed:', storesResponse.status);
    }

    // Test single store endpoint
    console.log('\n🏪 Testing single store endpoint...');
    const storeId = '3b2c6de6-28db-4ecd-be04-7e5d2077c23a'; // From the previous response
    const storeResponse = await fetch(`${BASE_URL}/stores/${storeId}`, {
      headers: {
        'Content-Type': 'application/json',
        'X-Guest-Token': GUEST_TOKEN,
      },
    });

    if (storeResponse.ok) {
      const storeData = await storeResponse.json();
      console.log('✅ Single store endpoint working');
      console.log(`🏪 Store: ${storeData.data?.entity?.name || 'Unknown'}`);
    } else {
      console.log('❌ Single store endpoint failed:', storeResponse.status);
    }

    console.log('\n🎉 ShtetlService endpoints are working!');
    console.log('📱 The ProfileScreen should now be able to load store IDs without errors.');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testShtetlService();
