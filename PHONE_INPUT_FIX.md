# Phone Number Input Fix

## Issues Found

1. **Validation Logic Mismatch**: The validation was trying to parse phone numbers without proper error handling
2. **State Management**: Confusion between `phoneNumber` (raw digits) and `formattedPhoneNumber` (with country code)
3. **Formatting Issues**: The AsYouType formatter could fail without proper error handling
4. **Country Change**: When changing countries, the formatted value wasn't being updated

## Fixes Applied

### 1. PhoneInput Component (`src/components/PhoneInput.tsx`)

**handleTextChange - Added Error Handling:**

```typescript
try {
  const formatter = new AsYouType(selectedCountry.code);
  const formatted = formatter.input(digitsOnly);
  setFormattedValue(formatted);
  // ... rest of logic
} catch (error) {
  // Fallback if formatting fails
  setFormattedValue(digitsOnly);
}
```

**handleCountrySelect - Reformat on Country Change:**

```typescript
// Reformat the current value with the new country
if (value) {
  const formatter = new AsYouType(country.code);
  const formatted = formatter.input(value);
  setFormattedValue(formatted);

  if (onChangeFormattedText) {
    const fullNumber = `${country.dialCode}${value}`;
    onChangeFormattedText(fullNumber);
  }
}
```

### 2. RegisterScreen (`src/screens/auth/RegisterScreen.tsx`)

**Improved Phone Validation:**

```typescript
case 'phoneNumber':
  // Phone number is optional, so empty is valid
  if (!value || !value.trim()) {
    return '';
  }

  try {
    // Try to parse the phone number
    const parsed = parsePhoneNumber(value);
    if (!parsed || !parsed.isValid()) {
      return 'Please enter a valid phone number';
    }
  } catch (error) {
    // If parsing fails, it's invalid
    return 'Please enter a valid phone number';
  }
  return '';
```

**Clearer State Updates:**

```typescript
<PhoneInput
  value={phoneNumber}
  onChangeText={text => {
    setPhoneNumber(text);
  }}
  onChangeFormattedText={formatted => {
    setFormattedPhoneNumber(formatted);
  }}
  disabled={isLoading}
  placeholder="Phone"
  textInputProps={{
    onBlur: () => {
      // Validate using the formatted number (includes country code)
      handleFieldBlur('phoneNumber', formattedPhoneNumber);
    },
  }}
/>
```

## How It Works Now

### State Management

- **`phoneNumber`**: Raw digits only (e.g., "5551234567")
- **`formattedPhoneNumber`**: Full international format (e.g., "+15551234567")

### Validation Flow

1. User types digits → `phoneNumber` state updates
2. Component formats digits → `formattedPhoneNumber` state updates
3. User leaves field (onBlur) → Validation runs on `formattedPhoneNumber`
4. `parsePhoneNumber()` validates the full international number

### Country Selection

1. User selects new country
2. Component reformats existing digits with new country code
3. Both `phoneNumber` and `formattedPhoneNumber` update
4. Display shows properly formatted number for selected country

## Testing Checklist

- [ ] Enter US phone number (e.g., 555-123-4567)
- [ ] Change country and verify number reformats
- [ ] Leave field empty (should be valid - optional field)
- [ ] Enter invalid number (should show error)
- [ ] Enter valid number (should clear error)
- [ ] Submit form with valid phone number
- [ ] Submit form without phone number (should work - optional)

## Common Phone Formats Supported

- **US/Canada**: +1 (555) 123-4567
- **UK**: +44 20 1234 5678
- **Israel**: +972 50-123-4567
- **Australia**: +61 4 1234 5678
- **Germany**: +49 30 12345678

## Notes

- Phone number is **optional** (marked as "Recommended" in UI)
- Validation only runs if user enters a value
- Empty phone number is considered valid
- Full international format is sent to backend
- Component handles 20 major countries with proper formatting

## Files Modified

- ✅ `src/components/PhoneInput.tsx` - Added error handling and country change logic
- ✅ `src/screens/auth/RegisterScreen.tsx` - Improved validation and state management
