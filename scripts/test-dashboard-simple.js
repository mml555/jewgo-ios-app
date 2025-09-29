#!/usr/bin/env node

/**
 * Simple test script for Database Dashboard functionality
 * Uses built-in Node.js modules only
 */

const http = require('http');
const https = require('https');

const API_BASE_URL = 'http://127.0.0.1:3001';

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    const req = client.request(requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ status: res.statusCode, data: jsonData });
        } catch (error) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }

    req.end();
  });
}

async function testDatabaseConnection() {
  console.log('🔍 Testing database connection...');
  
  try {
    const response = await makeRequest(`${API_BASE_URL}/health`);
    
    if (response.status === 200 && response.data.success) {
      console.log('✅ Database connection successful');
      console.log('📊 Status:', response.data.status);
      console.log('🕒 Timestamp:', response.data.timestamp);
      return true;
    } else {
      console.log('❌ Database connection failed');
      console.log('Status:', response.status);
      console.log('Response:', response.data);
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
    const response = await makeRequest(`${API_BASE_URL}/api/v5/dashboard/entities/stats`);
    
    if (response.status === 200 && response.data.total_entities !== undefined) {
      console.log('✅ Database statistics retrieved successfully');
      console.log('📈 Total entities:', response.data.total_entities);
      console.log('🍽️ Restaurants:', response.data.restaurants);
      console.log('🕍 Synagogues:', response.data.synagogues);
      console.log('🛁 Mikvahs:', response.data.mikvahs);
      console.log('🏪 Stores:', response.data.stores);
      console.log('✅ Verified entities:', response.data.verified_count);
      console.log('⭐ Average rating:', response.data.average_rating);
      return true;
    } else {
      console.log('❌ Failed to retrieve database statistics');
      console.log('Status:', response.status);
      console.log('Response:', response.data);
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
    const response = await makeRequest(`${API_BASE_URL}/api/v5/dashboard/entities/recent?limit=5`);
    
    if (response.status === 200 && response.data.data && Array.isArray(response.data.data)) {
      console.log('✅ Entities endpoint working');
      console.log('📝 Retrieved', response.data.data.length, 'entities');
      
      if (response.data.data.length > 0) {
        const entity = response.data.data[0];
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
      console.log('Status:', response.status);
      console.log('Response:', response.data);
      return false;
    }
  } catch (error) {
    console.log('❌ Entities endpoint error:', error.message);
    return false;
  }
}

async function testAnalyticsEndpoint() {
  console.log('\n📈 Testing analytics endpoint...');
  
  try {
    const response = await makeRequest(`${API_BASE_URL}/api/v5/dashboard/entities/analytics`);
    
    if (response.status === 200 && response.data.success && response.data.data) {
      console.log('✅ Analytics endpoint working');
      console.log('📊 Recent entities:', response.data.data.recent_entities?.length || 0);
      console.log('🏙️ Top cities:', response.data.data.top_cities?.length || 0);
      console.log('⭐ Rating distribution:', response.data.data.rating_distribution?.length || 0);
      return true;
    } else {
      console.log('❌ Failed to retrieve analytics');
      console.log('Status:', response.status);
      console.log('Response:', response.data);
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
    console.log('\n📱 To access the dashboard:');
    console.log('1. Open the Jewgo app');
    console.log('2. Go to Profile tab');
    console.log('3. Tap "Database Dashboard"');
  } else {
    console.log('⚠️ Some tests failed. Please check:');
    console.log('- Database is running: docker-compose ps');
    console.log('- Backend is running: curl http://localhost:3001/health');
    console.log('- Check backend logs for errors');
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
  testAnalyticsEndpoint,
  runAllTests
};
