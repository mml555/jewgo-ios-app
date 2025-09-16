#!/usr/bin/env node

/**
 * Frontend Connection Test Script
 * This script tests the connection between the React Native frontend and the backend API
 */

const https = require('https');
const http = require('http');

// Configuration
const API_BASE_URL = 'http://localhost:3001';
const TEST_TIMEOUT = 10000;

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

function colorLog(color, message) {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function makeRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
        const client = url.startsWith('https') ? https : http;
        const timeout = setTimeout(() => {
            reject(new Error('Request timeout'));
        }, TEST_TIMEOUT);

        const req = client.request(url, {
            method: options.method || 'GET',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Jewgo-Frontend-Test/1.0',
                ...options.headers
            }
        }, (res) => {
            clearTimeout(timeout);
            let data = '';
            
            res.on('data', chunk => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    const jsonData = JSON.parse(data);
                    resolve({
                        status: res.statusCode,
                        headers: res.headers,
                        data: jsonData
                    });
                } catch (error) {
                    resolve({
                        status: res.statusCode,
                        headers: res.headers,
                        data: data
                    });
                }
            });
        });

        req.on('error', (error) => {
            clearTimeout(timeout);
            reject(error);
        });

        if (options.body) {
            req.write(JSON.stringify(options.body));
        }

        req.end();
    });
}

async function testEndpoint(name, url, expectedStatus = 200) {
    try {
        colorLog('blue', `\n🔍 Testing ${name}...`);
        const response = await makeRequest(url);
        
        if (response.status === expectedStatus) {
            colorLog('green', `✅ ${name} - Status: ${response.status}`);
            return { success: true, response };
        } else {
            colorLog('yellow', `⚠️  ${name} - Unexpected status: ${response.status} (expected ${expectedStatus})`);
            return { success: false, response };
        }
    } catch (error) {
        colorLog('red', `❌ ${name} - Error: ${error.message}`);
        return { success: false, error: error.message };
    }
}

async function testAPIEndpoints() {
    colorLog('cyan', '🚀 Testing Jewgo Frontend-Backend Connection\n');
    
    const tests = [
        {
            name: 'Health Check',
            url: `${API_BASE_URL}/health`,
            expectedStatus: 200
        },
        {
            name: 'All Entities',
            url: `${API_BASE_URL}/api/v5/entities?limit=3`,
            expectedStatus: 200
        },
        {
            name: 'Restaurants',
            url: `${API_BASE_URL}/api/v5/restaurants?limit=2`,
            expectedStatus: 200
        },
        {
            name: 'Synagogues',
            url: `${API_BASE_URL}/api/v5/synagogues?limit=2`,
            expectedStatus: 200
        },
        {
            name: 'Mikvahs',
            url: `${API_BASE_URL}/api/v5/mikvahs?limit=2`,
            expectedStatus: 200
        },
        {
            name: 'Stores',
            url: `${API_BASE_URL}/api/v5/stores?limit=2`,
            expectedStatus: 200
        },
        {
            name: 'Search',
            url: `${API_BASE_URL}/api/v5/search?q=kosher&limit=3`,
            expectedStatus: 200
        },
        {
            name: 'Nearby Search',
            url: `${API_BASE_URL}/api/v5/entities/nearby?latitude=40.6782&longitude=-73.9442&radius=10&limit=3`,
            expectedStatus: 200
        }
    ];

    let passedTests = 0;
    let totalTests = tests.length;
    const results = [];

    for (const test of tests) {
        const result = await testEndpoint(test.name, test.url, test.expectedStatus);
        results.push({ ...test, result });
        
        if (result.success) {
            passedTests++;
            
            // Display sample data for successful tests
            if (result.response && result.response.data) {
                if (result.response.data.entities) {
                    const entities = result.response.data.entities;
                    if (entities.length > 0) {
                        colorLog('cyan', `   📍 Sample: ${entities[0].name} (${entities[0].entity_type})`);
                    }
                } else if (result.response.data.status) {
                    colorLog('cyan', `   📊 Status: ${result.response.data.status}`);
                }
            }
        }
    }

    // Summary
    colorLog('bright', '\n📊 Test Results Summary:');
    colorLog('green', `✅ Passed: ${passedTests}/${totalTests}`);
    
    if (passedTests < totalTests) {
        colorLog('red', `❌ Failed: ${totalTests - passedTests}/${totalTests}`);
        
        colorLog('yellow', '\n🔧 Troubleshooting:');
        results.forEach(test => {
            if (!test.result.success) {
                colorLog('red', `   • ${test.name}: ${test.result.error || 'Unexpected response'}`);
            }
        });
        
        colorLog('yellow', '\n💡 Common Solutions:');
        colorLog('yellow', '   • Ensure backend server is running: cd backend && npm start');
        colorLog('yellow', '   • Check database is running: docker-compose ps');
        colorLog('yellow', '   • Verify environment variables in backend/.env');
        colorLog('yellow', '   • Check server logs for error messages');
    }

    // Frontend Integration Instructions
    colorLog('bright', '\n📱 Frontend Integration:');
    colorLog('blue', 'To connect your React Native app to this API:');
    colorLog('cyan', '1. Update ConfigService.ts:');
    colorLog('reset', '   apiBaseUrl: __DEV__ ? \'http://localhost:3001/api/v5\' : \'https://api.jewgo.app/api/v5\'');
    
    colorLog('cyan', '2. Use the API service:');
    colorLog('reset', '   import { apiV5Service } from \'./src/services/api-v5\';');
    colorLog('reset', '   const restaurants = await apiV5Service.getEntities(\'restaurants\');');
    
    colorLog('cyan', '3. Test in your app:');
    colorLog('reset', '   // Get all restaurants');
    colorLog('reset', '   const result = await apiV5Service.getEntities(\'restaurants\', { limit: 20 });');
    colorLog('reset', '   console.log(result.data.entities);');

    // Performance Notes
    colorLog('bright', '\n⚡ Performance Notes:');
    colorLog('blue', '• API responses include proper pagination');
    colorLog('blue', '• Database queries are optimized with indexes');
    colorLog('blue', '• Rate limiting is configured (100 requests/15 minutes)');
    colorLog('blue', '• CORS is configured for localhost development');

    return passedTests === totalTests;
}

// Run the tests
if (require.main === module) {
    testAPIEndpoints()
        .then(success => {
            if (success) {
                colorLog('green', '\n🎉 All tests passed! Frontend should connect successfully.');
                process.exit(0);
            } else {
                colorLog('red', '\n❌ Some tests failed. Please check the issues above.');
                process.exit(1);
            }
        })
        .catch(error => {
            colorLog('red', `\n💥 Test suite failed: ${error.message}`);
            process.exit(1);
        });
}

module.exports = { testAPIEndpoints, makeRequest };
