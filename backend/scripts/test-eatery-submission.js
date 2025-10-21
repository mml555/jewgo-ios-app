/**
 * Test script for eatery submission endpoint
 * Run with: node backend/scripts/test-eatery-submission.js
 */

const axios = require('axios');

const API_URL = process.env.API_URL || 'http://localhost:3001';

const testEateryData = {
  type: 'eatery',
  name: 'Test Kosher Restaurant',
  address: '123 Main Street, Brooklyn, NY 11201',
  phone: '(718) 555-1234',
  email: 'test@restaurant.com',
  website: 'https://testrestaurant.com',
  hours_of_operation: 'monday: 9:00 AM-5:00 PM, tuesday: 9:00 AM-5:00 PM, wednesday: 9:00 AM-5:00 PM, thursday: 9:00 AM-5:00 PM, friday: 9:00 AM-3:00 PM, saturday: Closed, sunday: 10:00 AM-5:00 PM',
  business_images: [
    'https://example.com/image1.jpg',
    'https://example.com/image2.jpg'
  ],
  kosher_type: 'meat',
  hechsher: 'orb',
  kosher_tags: ['pas yisroel', 'glatt kosher'],
  short_description: 'A delicious kosher meat restaurant in Brooklyn',
  price_range: '$20-$30',
  amenities: ['Free Wi-Fi', 'Parking Available', 'Dine-In'],
  services: ['dine_in'],
  google_reviews_link: 'https://maps.google.com/test',
  is_owner_submission: true,
  user_id: null
};

async function testSubmission() {
  try {
    console.log('🧪 Testing eatery submission endpoint...\n');
    console.log('📤 Sending test data:', JSON.stringify(testEateryData, null, 2));
    
    const response = await axios.post(
      `${API_URL}/api/v5/eatery-submit`,
      testEateryData,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('\n✅ Success!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    console.log('\n📊 Entity ID:', response.data.data.entity_id);
    console.log('📊 Status:', response.data.data.status);
    console.log('📊 Submitted at:', response.data.data.submitted_at);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

async function testGetSubmissions() {
  try {
    console.log('\n\n🧪 Testing get submissions endpoint...\n');
    
    const response = await axios.get(
      `${API_URL}/api/v5/eatery-submissions?status=pending_review&limit=5`
    );

    console.log('✅ Success!');
    console.log('Pending submissions:', response.data.data.submissions.length);
    console.log('Submissions:', JSON.stringify(response.data.data.submissions, null, 2));

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

// Run tests
(async () => {
  await testSubmission();
  await testGetSubmissions();
  console.log('\n✅ All tests completed!');
})();
