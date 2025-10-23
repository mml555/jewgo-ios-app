# Phone Number Validation Fix

## Issue

Phone number validation was failing for valid phone numbers because:

1. The formatted number includes parentheses, spaces, and dashes (e.g., "+1 (555) 123-4567")
2. `parsePhoneNumber()` was having trouble parsing the formatted string
3. Phone number wasn't being sent to backend at all

## Root Cause

The `PhoneInput` component formats numbers for display (e.g., "+1 (555) 123-4567"), but the validation was trying to parse this formatted string directly without cleaning it first.

## Fixes Applied

### 1. RegisterScreen Validation (`src/screens/auth/RegisterScreen.tsx`)

**Before:**

```typescript
const parsed = parsePhoneNumber(value);
if (!parsed || !parsed.isValid()) {
  return 'Please enter a valid phone number';
}
```

**After:**

```typescript
// Clean the phone number - remove spaces, parentheses, dashes
// Keep only digits and the leading + sign
const cleanedValue = value.replace(/[^\d+]/g, '');

// Try to parse the cleaned phone number
const parsed = parsePhoneNumber(cleanedValue);
if (!parsed || !parsed.isValid()) {
  return 'Please enter a valid phone number';
}
```

### 2. Added Phone Number to Registration Data

**AuthService.ts - Updated Interface:**

```typescript
export interface RegisterData {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string; // ← Added
  captchaToken?: string;
  deviceInfo?: DeviceInfo;
}
```

**RegisterScreen.tsx - Send Phone to Backend:**

```typescript
const registrationData: any = {
  email: email.trim().toLowerCase(),
  password,
  firstName: firstName.trim(),
  lastName: lastName.trim(),
  captchaToken,
};

// Add phone number if provided (it's optional)
if (formattedPhoneNumber && formattedPhoneNumber.trim()) {
  // Clean the phone number - remove formatting characters
  const cleanedPhone = formattedPhoneNumber.replace(/[^\d+]/g, '');
  registrationData.phoneNumber = cleanedPhone;
}

await register(registrationData);
```

## How It Works Now

### Validation Flow

1. User types: "5551234567"
2. Component formats: "+1 (555) 123-4567"
3. User leaves field (onBlur)
4. Validation receives: "+1 (555) 123-4567"
5. Validation cleans: "+15551234567"
6. `parsePhoneNumber()` validates: ✅ Valid
7. Error cleared

### Registration Flow

1. User fills form with phone: "+1 (555) 123-4567"
2. User clicks "Create Account"
3. Phone cleaned: "+15551234567"
4. Sent to backend: `{ phoneNumber: "+15551234567", ... }`
5. Backend stores clean international format

## Cleaning Logic

The regex `/[^\d+]/g` removes everything except:

- Digits: `0-9`
- Plus sign: `+`

**Examples:**

- Input: `+1 (555) 123-4567` → Output: `+15551234567`
- Input: `+44 20 1234 5678` → Output: `+442012345678`
- Input: `+972 50-123-4567` → Output: `+972501234567`

## Testing

### Valid Phone Numbers (Should Pass)

- US: `+1 (555) 123-4567` → `+15551234567` ✅
- UK: `+44 20 1234 5678` → `+442012345678` ✅
- Israel: `+972 50-123-4567` → `+972501234567` ✅
- Empty: `` → Valid (optional field) ✅

### Invalid Phone Numbers (Should Fail)

- Too short: `+1 555` → ❌
- Invalid format: `123` → ❌
- Wrong country code: `+999 123456789` → ❌

## Backend Considerations

The backend should expect phone numbers in clean international format:

- Format: `+[country code][number]`
- No spaces, parentheses, or dashes
- Example: `+15551234567`

If the backend needs to validate phone numbers, it should:

1. Check format matches: `^\+\d{10,15}$`
2. Use a library like `libphonenumber` to validate
3. Store in international format
4. Format for display when needed

## Files Modified

- ✅ `src/services/AuthService.ts` - Added `phoneNumber` to `RegisterData` interface
- ✅ `src/screens/auth/RegisterScreen.tsx` - Fixed validation and added phone to registration
- ✅ `src/components/PhoneInput.tsx` - Already had error handling (from previous fix)

## Notes

- Phone number is **optional** - empty is valid
- Validation only runs if user enters a value
- Clean format sent to backend for consistency
- Display format remains user-friendly with formatting
- Works with all 20 supported countries in PhoneInput component
