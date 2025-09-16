# Troubleshooting Guide: Add Eatery Form Issues

This guide helps resolve common issues when adding an eatery to JEWGO. Issues are organized by category with step-by-step solutions.

## Quick Fixes (Try These First)

### Universal Solutions
1. **Close and reopen the app**
2. **Check your internet connection**
3. **Update to the latest app version**
4. **Restart your device**
5. **Clear app cache** (iOS: Offload and reinstall app)

---

## Form Navigation Issues

### Problem: Can't Move to Next Step
**Symptoms:**
- "Next" button is grayed out
- Error message appears when trying to proceed
- Form seems stuck on current step

**Solutions:**
1. **Check for validation errors**
   - Look for red text or error messages
   - Scroll through the entire form to find missing fields
   - Required fields are marked with a red asterisk (*)

2. **Complete all required fields**
   - Business name, address, phone number
   - Kosher certification details
   - At least one day of business hours
   - Minimum 3 photos

3. **Fix formatting issues**
   - Phone numbers: Use format (555) 123-4567
   - Email addresses: Must include @ and valid domain
   - Website URLs: Must start with http:// or https://

**Still stuck?** Contact support with a screenshot of the error.

### Problem: Form Keeps Going Back to Previous Step
**Symptoms:**
- Automatically returns to earlier step
- Progress indicator shows incorrect step
- Data seems to disappear

**Solutions:**
1. **Wait for auto-save to complete**
   - Look for "Saving..." indicator
   - Don't navigate until you see "Saved" status

2. **Check internet connection**
   - Form needs connection to save progress
   - Try switching between WiFi and cellular data

3. **Complete current step fully**
   - Form may return to incomplete steps
   - Check for any red error messages

---

## Business Hours Problems

### Problem: Time Picker Won't Open or Respond
**Symptoms:**
- Tapping time fields does nothing
- Time picker appears but won't scroll
- Selected times don't save

**Solutions:**
1. **Force close and reopen the app**
2. **Try tapping and holding the time field**
3. **Use the scroll wheels in the time picker**
4. **Make sure you're not accidentally tapping outside the picker**

**iOS Specific:**
- Make sure "Reduce Motion" is disabled in Settings > Accessibility
- Try rotating device to landscape and back to portrait

### Problem: Can't Set Correct Hours
**Symptoms:**
- Hours appear wrong after setting
- AM/PM is incorrect
- Can't set hours past midnight

**Solutions:**
1. **Check AM/PM setting carefully**
   - 12:00 PM = noon, 12:00 AM = midnight
   - 1:00 PM = 1 in the afternoon

2. **For late-night businesses:**
   - Use the "Next Day" toggle for hours past midnight
   - Example: Open 6 PM, Close 2 AM (next day)

3. **Common hour formats:**
   - Lunch: 11:00 AM - 3:00 PM
   - Dinner: 5:00 PM - 10:00 PM
   - All day: 8:00 AM - 10:00 PM

### Problem: "Copy Hours" Feature Not Working
**Symptoms:**
- Copy button doesn't respond
- Hours don't copy to selected days
- Wrong hours get copied

**Solutions:**
1. **Set the source day hours first**
2. **Tap the copy button next to the day you want to copy FROM**
3. **Select which days to copy TO in the popup**
4. **Confirm the copy action**

**Note:** Copy only works for open days. Closed days must be set individually.

### Problem: Validation Error "Invalid Business Hours"
**Common Causes & Fixes:**

**Closing before opening:**
- ❌ Open: 6:00 PM, Close: 2:00 PM
- ✅ Open: 6:00 PM, Close: 2:00 AM (next day)

**No days open:**
- ❌ All days marked as closed
- ✅ At least one day must be open

**Unrealistic hours:**
- ❌ Open 24/7 (unless truly 24-hour operation)
- ✅ Reasonable business hours for your type of restaurant

---

## Photo Upload Issues

### Problem: Photos Won't Upload
**Symptoms:**
- Upload progress bar gets stuck
- "Upload failed" error message
- Photos appear but then disappear

**Solutions:**
1. **Check photo requirements:**
   - Maximum 5MB per photo
   - JPG or PNG format only
   - Minimum 800x600 pixels

2. **Improve internet connection:**
   - Switch to WiFi if using cellular
   - Move closer to WiFi router
   - Try uploading one photo at a time

3. **Reduce photo file size:**
   - Use "Medium" or "Large" quality when taking photos
   - Avoid "Original" or "RAW" formats
   - Consider using photo compression apps

### Problem: Photos Appear Blurry or Low Quality
**Solutions:**
1. **Take new photos with better lighting**
   - Use natural daylight when possible
   - Avoid fluorescent lighting
   - Clean camera lens before taking photos

2. **Check camera settings:**
   - Use highest quality setting available
   - Avoid digital zoom
   - Hold camera steady or use timer

3. **Photo composition tips:**
   - Fill the frame with your subject
   - Avoid busy backgrounds
   - Take multiple shots and choose the best

### Problem: Can't Select Photos from Gallery
**Symptoms:**
- Gallery doesn't open when tapping "Select Photos"
- Photos appear grayed out in gallery
- "Permission denied" error

**Solutions:**
1. **Check app permissions:**
   - iOS: Settings > Privacy & Security > Photos > JEWGO > All Photos
   - Allow access to photo library

2. **Free up storage space:**
   - Delete unnecessary photos/videos
   - Need at least 1GB free space

3. **Restart the app and try again**

---

## Form Validation Errors

### Problem: "Required Field" Errors
**Common Missing Fields:**
- Business name (can't be empty)
- Complete address with zip code
- Phone number in correct format
- Kosher certification agency
- At least one business hour set
- Minimum 3 photos uploaded

**Solutions:**
1. **Scroll through entire form to find empty fields**
2. **Look for red asterisks (*) marking required fields**
3. **Check that dropdown menus have selections**

### Problem: "Invalid Format" Errors
**Phone Number Issues:**
- ❌ 5551234567 (missing formatting)
- ❌ 555-123-4567 (wrong format)
- ✅ (555) 123-4567 (correct format)

**Email Address Issues:**
- ❌ Missing @ symbol
- ❌ Spaces in email address
- ❌ Invalid domain (.con instead of .com)
- ✅ business@restaurant.com

**Website URL Issues:**
- ❌ www.restaurant.com (missing protocol)
- ✅ https://www.restaurant.com
- ✅ http://restaurant.com

---

## Auto-Save and Data Recovery

### Problem: Lost Form Data
**Symptoms:**
- Form appears empty after returning
- Progress lost after app crash
- "Start over" instead of continuing

**Solutions:**
1. **Look for recovery prompt:**
   - App should offer to restore draft
   - Choose "Continue Draft" if available

2. **Check auto-save status:**
   - Look for "Saved" indicator at top of form
   - Green checkmark means data is saved
   - Red X means save failed

3. **Manual save:**
   - Navigate to next step and back to trigger save
   - Complete current step to force auto-save

### Problem: Auto-Save Not Working
**Symptoms:**
- "Save failed" message appears
- No save status indicator visible
- Data disappears when navigating

**Solutions:**
1. **Check internet connection**
2. **Free up device storage space**
3. **Close other apps to free memory**
4. **Update app to latest version**

---

## Submission Issues

### Problem: "Submit" Button Doesn't Work
**Symptoms:**
- Button is grayed out
- Nothing happens when tapping submit
- Error message appears

**Solutions:**
1. **Complete final review:**
   - Check all form sections are complete
   - Fix any remaining validation errors
   - Ensure all required photos are uploaded

2. **Check internet connection:**
   - Strong connection needed for submission
   - Try switching networks if available

3. **Wait and try again:**
   - Server may be temporarily busy
   - Wait 5 minutes and retry

### Problem: Submission Fails with Error
**Common Error Messages:**

**"Network Error"**
- Check internet connection
- Try again in a few minutes
- Contact support if persistent

**"Invalid Data"**
- Review all form fields for errors
- Check photo formats and sizes
- Verify kosher certification details

**"Server Error"**
- Temporary server issue
- Try again in 10-15 minutes
- Contact support if continues

---

## Device-Specific Issues

### iPhone Issues

**iOS 16+ Time Picker Problems:**
- Update to latest app version
- Restart device
- Check Settings > General > Date & Time

**Storage Issues:**
- Need 2GB+ free space for photo uploads
- Delete unused apps/photos
- Check Settings > General > iPhone Storage

**Permission Issues:**
- Settings > Privacy & Security > Photos > JEWGO
- Settings > Privacy & Security > Camera > JEWGO

### Older Device Issues

**Performance Problems:**
- Close other apps before using form
- Restart device before starting
- Use WiFi instead of cellular data

**Memory Issues:**
- Upload photos one at a time
- Complete form in multiple sessions
- Avoid taking photos within the app

---

## Getting Additional Help

### Before Contacting Support
1. **Try the quick fixes listed above**
2. **Note your device model and iOS version**
3. **Take screenshots of any error messages**
4. **Note which step of the form you're on**

### Contact Information
- **Email**: support@jewgo.app
- **Phone**: 1-800-JEWGO-HELP
- **Hours**: Sunday-Thursday 9 AM - 6 PM EST
- **Emergency**: Use email for fastest response

### What to Include in Support Requests
1. **Device information** (iPhone model, iOS version)
2. **App version** (found in App Store)
3. **Screenshots** of the problem
4. **Steps to reproduce** the issue
5. **Error messages** (exact text)

### Response Times
- **Email**: Within 4 hours during business hours
- **Phone**: Immediate during business hours
- **Critical issues**: Within 1 hour
- **General questions**: Within 24 hours

---

## Prevention Tips

### Avoid Common Issues
1. **Start with good internet connection**
2. **Have all information ready before starting**
3. **Take photos in advance with good lighting**
4. **Complete form in one session when possible**
5. **Double-check all information before submitting**

### Best Practices
1. **Use latest app version**
2. **Keep device updated**
3. **Maintain adequate storage space**
4. **Use WiFi for photo uploads**
5. **Save contact information for support**

---

*This guide is updated regularly. Last updated: December 2024*

**Still need help?** Contact our support team at support@jewgo.app