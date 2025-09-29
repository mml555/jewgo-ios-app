#!/usr/bin/env node

/**
 * Test script for Database Dashboard functionality
 * This script tests the database connection, API endpoints, and dashboard features
 */

// Using built-in fetch (Node.js 18+)

const API_BASE_URL = 'http://127.0.0.1:3001';

async function testDatabaseConnection() {
  console.log('🔍 Testing database connection...');
  
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Database connection successful');
      console.log('📊 Status:', data.status);
      console.log('🕒 Timestamp:', data.timestamp);
      return true;
    } else {
      console.log('❌ Database connection failed');
      console.log('Error:', data.error);
      return false;
    }
  } catch (error) {
    console.log('❌ Database connection error:', error.message);
    return false;
  }
}

async function testDatabaseStats() {
  console.log('\n📊 Testing database statistics...');
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/v5/entities/stats`);
    const data = await response.json();
    
    if (data.total_entities !== undefined) {
      console.log('✅ Database statistics retrieved successfully');
      console.log('📈 Total entities:', data.total_entities);
      console.log('🍽️ Restaurants:', data.restaurants);
      console.log('🕍 Synagogues:', data.synagogues);
      console.log('🛁 Mikvahs:', data.mikvahs);
      console.log('🏪 Stores:', data.stores);
      console.log('✅ Verified entities:', data.verified_count);
      console.log('⭐ Average rating:', data.average_rating);
      return true;
    } else {
      console.log('❌ Failed to retrieve database statistics');
      return false;
    }
  } catch (error) {
    console.log('❌ Database statistics error:', error.message);
    return false;
  }
}

async function testEntitiesEndpoint() {
  console.log('\n🗄️ Testing entities endpoint...');
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/v5/entities?limit=5`);
    const data = await response.json();
    
    if (data.data && Array.isArray(data.data)) {
      console.log('✅ Entities endpoint working');
      console.log('📝 Retrieved', data.data.length, 'entities');
      
      if (data.data.length > 0) {
        const entity = data.data[0];
        console.log('📋 Sample entity:', {
          id: entity.id,
          name: entity.name,
          type: entity.entity_type,
          city: entity.city,
          verified: entity.is_verified
        });
      }
      return true;
    } else {
      console.log('❌ Failed to retrieve entities');
      return false;
    }
  } catch (error) {
    console.log('❌ Entities endpoint error:', error.message);
    return false;
  }
}

async function testEntityUpdate() {
  console.log('\n✏️ Testing entity update functionality...');
  
  try {
    // First, get an entity to update
    const getResponse = await fetch(`${API_BASE_URL}/api/v5/entities?limit=1`);
    const getData = await getResponse.json();
    
    if (!getData.data || getData.data.length === 0) {
      console.log('⚠️ No entities found to test update');
      return true;
    }
    
    const entity = getData.data[0];
    const originalName = entity.name;
    const testName = `Test Update ${Date.now()}`;
    
    // Update the entity
    const updateResponse = await fetch(`${API_BASE_URL}/api/v5/entities/${entity.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: testName
      })
    });
    
    if (updateResponse.ok) {
      console.log('✅ Entity update successful');
      
      // Revert the change
      await fetch(`${API_BASE_URL}/api/v5/entities/${entity.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: originalName
        })
      });
      
      console.log('🔄 Entity reverted to original name');
      return true;
    } else {
      console.log('❌ Entity update failed');
      return false;
    }
  } catch (error) {
    console.log('❌ Entity update error:', error.message);
    return false;
  }
}

async function testAnalyticsEndpoint() {
  console.log('\n📈 Testing analytics endpoint...');
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/v5/entities/analytics`);
    const data = await response.json();
    
    if (data.success && data.data) {
      console.log('✅ Analytics endpoint working');
      console.log('📊 Recent entities:', data.data.recent_entities?.length || 0);
      console.log('🏙️ Top cities:', data.data.top_cities?.length || 0);
      console.log('⭐ Rating distribution:', data.data.rating_distribution?.length || 0);
      return true;
    } else {
      console.log('❌ Failed to retrieve analytics');
      return false;
    }
  } catch (error) {
    console.log('❌ Analytics endpoint error:', error.message);
    return false;
  }
}

async function runAllTests() {
  console.log('🚀 Starting Database Dashboard Tests\n');
  
  const tests = [
    { name: 'Database Connection', fn: testDatabaseConnection },
    { name: 'Database Statistics', fn: testDatabaseStats },
    { name: 'Entities Endpoint', fn: testEntitiesEndpoint },
    { name: 'Entity Update', fn: testEntityUpdate },
    { name: 'Analytics Endpoint', fn: testAnalyticsEndpoint }
  ];
  
  const results = [];
  
  for (const test of tests) {
    try {
      const result = await test.fn();
      results.push({ name: test.name, passed: result });
    } catch (error) {
      console.log(`❌ ${test.name} failed with error:`, error.message);
      results.push({ name: test.name, passed: false });
    }
  }
  
  console.log('\n📋 Test Results Summary:');
  console.log('========================');
  
  let passedCount = 0;
  results.forEach(result => {
    const status = result.passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} ${result.name}`);
    if (result.passed) passedCount++;
  });
  
  console.log(`\n🎯 Overall: ${passedCount}/${results.length} tests passed`);
  
  if (passedCount === results.length) {
    console.log('🎉 All tests passed! Database Dashboard is ready to use.');
  } else {
    console.log('⚠️ Some tests failed. Please check the database connection and API endpoints.');
  }
  
  return passedCount === results.length;
}

// Run the tests
if (require.main === module) {
  runAllTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('💥 Test runner error:', error);
      process.exit(1);
    });
}

module.exports = {
  testDatabaseConnection,
  testDatabaseStats,
  testEntitiesEndpoint,
  testEntityUpdate,
  testAnalyticsEndpoint,
  runAllTests
};
