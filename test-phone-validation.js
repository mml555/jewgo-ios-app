// Quick test to check if the phone number is valid
const { parsePhoneNumber } = require('libphonenumber-js');

const testNumbers = ['+1 (564) 556-4854', '+15645564854', '5645564854'];

testNumbers.forEach(num => {
  try {
    const cleaned = num.replace(/[^\d+]/g, '');
    console.log(`\nTesting: ${num}`);
    console.log(`Cleaned: ${cleaned}`);

    const parsed = parsePhoneNumber(cleaned);
    console.log(`Valid: ${parsed.isValid()}`);
    console.log(`Country: ${parsed.country}`);
    console.log(`National: ${parsed.nationalNumber}`);
  } catch (error) {
    console.log(`Error: ${error.message}`);
  }
});
