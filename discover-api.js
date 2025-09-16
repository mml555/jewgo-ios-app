// Script to discover API endpoints on api.jewgo.app
const API_BASE_URL = 'https://api.jewgo.app';

const endpointsToTry = [
  '/health',
  '/status',
  '/api',
  '/api/health',
  '/api/status',
  '/api/categories',
  '/api/listings',
  '/api/businesses',
  '/api/restaurants',
  '/api/locations',
  '/api/search',
  '/api/data',
  '/v1',
  '/v1/health',
  '/v1/categories',
  '/v1/listings',
  '/graphql',
  '/api/graphql',
  '/swagger',
  '/api/docs',
  '/docs',
  '/api-docs',
  '/openapi.json',
  '/api/openapi.json'
];

async function discoverEndpoints() {
  console.log('🔍 Discovering API endpoints on api.jewgo.app...\n');
  
  const results = [];
  
  for (const endpoint of endpointsToTry) {
    try {
      const url = `${API_BASE_URL}${endpoint}`;
      const response = await fetch(url);
      const text = await response.text();
      
      const result = {
        endpoint,
        status: response.status,
        contentType: response.headers.get('content-type'),
        response: text.substring(0, 200) + (text.length > 200 ? '...' : ''),
        isJson: false
      };
      
      // Try to parse as JSON
      try {
        JSON.parse(text);
        result.isJson = true;
      } catch (e) {
        // Not JSON
      }
      
      results.push(result);
      
      if (response.ok) {
        console.log(`✅ ${endpoint} (${response.status}) - ${result.isJson ? 'JSON' : 'Text'}`);
        if (result.isJson) {
          console.log(`   Response: ${text.substring(0, 100)}...`);
        } else {
          console.log(`   Response: ${text.substring(0, 50)}...`);
        }
      } else {
        console.log(`❌ ${endpoint} (${response.status})`);
      }
      
    } catch (error) {
      console.log(`❌ ${endpoint} - Error: ${error.message}`);
    }
  }
  
  console.log('\n📊 Summary:');
  const workingEndpoints = results.filter(r => r.status === 200);
  console.log(`✅ Working endpoints: ${workingEndpoints.length}`);
  console.log(`❌ Failed endpoints: ${results.length - workingEndpoints.length}`);
  
  if (workingEndpoints.length > 0) {
    console.log('\n🎯 Working endpoints:');
    workingEndpoints.forEach(endpoint => {
      console.log(`   - ${endpoint.endpoint} (${endpoint.isJson ? 'JSON' : 'Text'})`);
    });
  }
  
  // Check for common API patterns
  console.log('\n🔍 API Pattern Analysis:');
  const jsonEndpoints = workingEndpoints.filter(r => r.isJson);
  if (jsonEndpoints.length > 0) {
    console.log('📄 JSON endpoints found - likely REST API');
    jsonEndpoints.forEach(ep => {
      console.log(`   - ${ep.endpoint}`);
    });
  }
  
  const hasHealth = workingEndpoints.some(r => r.endpoint.includes('health'));
  if (hasHealth) {
    console.log('💚 Health endpoint confirmed - API is responsive');
  }
  
  const hasApiPrefix = workingEndpoints.some(r => r.endpoint.startsWith('/api'));
  if (hasApiPrefix) {
    console.log('🔗 API endpoints use /api prefix');
  }
}

// Run discovery
discoverEndpoints().catch(console.error);
