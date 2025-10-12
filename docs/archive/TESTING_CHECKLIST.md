# ✅ Testing Checklist - Jobs System

## 🚀 **Backend Status**

✅ **Backend Server:** RUNNING on port 3001
✅ **Health Check:** Passing
✅ **Industries Endpoint:** Working (13 industries)
✅ **Job Types Endpoint:** Working (6 job types)

---

## 📱 **Frontend Testing Steps**

### **Step 1: Reload the App**

**iOS Simulator:**
1. Open the simulator
2. Press `Cmd + R` to reload
3. Wait for app to restart

**Android:**
1. Open the emulator
2. Press `R + R` (double tap R)
3. Wait for app to restart

**OR Force Fresh Start:**
1. Close the app completely
2. Kill Metro bundler: `lsof -ti:8081 | xargs kill -9`
3. Restart: `npm start`
4. Reopen app

---

### **Step 2: Test "I'm Seeking +" Button**

**Navigate to Jobs Screen:**
1. Open the app
2. Go to the Jobs tab
3. Switch to "Resume Feed" tab
4. Click the **"I'm Seeking +"** button

**Expected Result:**
✅ **New 4-step form should appear:**

**Step 1: Personal Information**
- [ ] Name field (required)
- [ ] Age field
- [ ] Gender dropdown (Male, Female, Non-binary, Prefer not to say)
- [ ] Zip Code field (required)
- [ ] Headshot URL field
- [ ] "Next" button works

**Step 2: Professional Information**
- [ ] Preferred Industry dropdown (13 options)
- [ ] Preferred Job Type dropdown (6 options)
- [ ] Experience Level dropdown
- [ ] Bio text area
- [ ] Skills input with "Add" button
- [ ] Skills show as chips with × to remove
- [ ] "Back" and "Next" buttons work

**Step 3: Compensation & Preferences**
- [ ] Desired Salary Min field
- [ ] Desired Salary Max field
- [ ] Availability dropdown (Immediate, 2 Weeks, 1 Month, Negotiable)
- [ ] "Open to remote work" checkbox
- [ ] "Willing to relocate" checkbox
- [ ] "Back" and "Next" buttons work

**Step 4: Contact & Links**
- [ ] Contact Email field (required)
- [ ] Contact Phone field
- [ ] Resume URL field
- [ ] LinkedIn URL field
- [ ] Portfolio URL field
- [ ] Meeting Link field
- [ ] "Back" and "Create Profile" buttons work

**Test Submission:**
1. Fill in required fields: Name, Zip Code, Contact Email
2. Click "Create Profile"
3. Should show success message
4. Should navigate back to Resume Feed
5. New profile should appear in the feed

---

### **Step 3: Test "I'm Hiring +" Button**

**Navigate to Jobs Screen:**
1. Go to the Jobs tab
2. Stay on "Job feed" tab
3. Click the **"I'm Hiring +"** button

**Expected Result:**
✅ **Full job creation form should appear:**

**Step 1: Basic Information**
- [ ] Job Title field (required)
- [ ] Company Name field
- [ ] Industry dropdown (13 options - should load from API)
- [ ] Job Type dropdown (6 options - should load from API)
- [ ] Experience Level dropdown (should load from API)
- [ ] "Next" button works

**Step 2: Compensation & Location**
- [ ] Compensation Structure dropdown (should load from API)
- [ ] Salary Min/Max OR Hourly Rate Min/Max fields
- [ ] Show Salary checkbox
- [ ] Zip Code field (required)
- [ ] Remote checkbox
- [ ] Hybrid checkbox
- [ ] "Back" and "Next" buttons work

**Step 3: Job Details**
- [ ] Description text area (required, min 100 characters)
- [ ] Requirements text area
- [ ] Responsibilities text area
- [ ] Benefits text area
- [ ] Skills input with add/remove
- [ ] Contact Email field (required)
- [ ] Contact Phone field
- [ ] CTA Link/Application URL field
- [ ] "Back" and "Create Job" buttons work

**Test Submission:**
1. Fill in all required fields:
   - Job Title
   - Industry
   - Job Type
   - Compensation Structure
   - Zip Code
   - Description (min 100 chars)
   - Contact Email
2. Click "Create Job"
3. Should show success message
4. Should navigate back to Job feed
5. New job should appear in the feed

---

### **Step 4: Verify Jobs Feed**

**Check Job Listings:**
1. Go to "Job feed" tab
2. Look for your newly created job

**Expected Data Display:**
- [ ] Job title visible
- [ ] Company name visible
- [ ] Industry name (e.g., "Technology") - from lookup table
- [ ] Job type (e.g., "Full Time") - from lookup table
- [ ] Salary/compensation visible
- [ ] Location (zip code or city, state)
- [ ] "Remote" or "Hybrid" badge if applicable
- [ ] Posted date visible

**Check Resume Feed:**
1. Go to "Resume Feed" tab
2. Look for your newly created profile

**Expected Data Display:**
- [ ] Name visible
- [ ] Industry preference visible
- [ ] Job type preference visible
- [ ] Skills visible
- [ ] Location (zip code)

---

## 🧪 **API Testing (Optional)**

### **Test Lookup Endpoints:**
```bash
# Industries (should return 13)
curl http://localhost:3001/api/v5/jobs/industries

# Job Types (should return 6)
curl http://localhost:3001/api/v5/jobs/job-types

# Compensation Structures
curl http://localhost:3001/api/v5/jobs/compensation-structures

# Experience Levels
curl http://localhost:3001/api/v5/jobs/experience-levels
```

### **Test Jobs Endpoints (requires auth token):**
```bash
# Get job listings (requires guest or user token)
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3001/api/v5/jobs/listings?limit=10

# Get job seekers (requires guest or user token)
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3001/api/v5/jobs/seekers?limit=10
```

---

## 🐛 **Troubleshooting**

### **If Forms Don't Show Fields:**
1. Check React Native console for errors
2. Verify backend is running: `curl http://localhost:3001/health`
3. Check if lookup data is loading (look for console logs: "🔄 Loading lookup data from API...")
4. Verify no network errors in console

### **If "Endpoint not found" Error:**
1. Backend might not have restarted
2. Try: `lsof -ti:3001 | xargs kill -9 && cd backend && npm start`
3. Wait 3-5 seconds for backend to fully start

### **If Forms Load But Dropdowns Are Empty:**
1. Check if lookup endpoints are working
2. Open browser: http://localhost:3001/api/v5/jobs/industries
3. Should return JSON with industries array
4. If 404, backend routes might be wrong

### **If Submission Fails:**
1. Check backend console for error messages
2. Verify database is running: `pg_isready -h localhost -p 5433`
3. Check if migration ran: `psql -U jewgo_user -d jewgo_dev -h localhost -p 5433 -c "\d jobs"`
4. Look for new columns in output

### **If Jobs Feed Shows No Data:**
1. Check if jobs exist in database:
   ```sql
   psql -U jewgo_user -d jewgo_dev -h localhost -p 5433 -c "SELECT COUNT(*) FROM jobs;"
   ```
2. Verify authentication is working (check for guest token)
3. Look for API errors in React Native console

---

## ✅ **Success Criteria**

All of these should work:
- [ ] "I'm Seeking +" opens 4-step form with all fields
- [ ] Job seeker profile creation succeeds
- [ ] "I'm Hiring +" opens 3-step form with all fields
- [ ] Job listing creation succeeds
- [ ] Jobs feed displays real data from database
- [ ] Resume feed displays real data from database
- [ ] All dropdowns populate from API (industries, job types, etc.)
- [ ] No "Endpoint not found" errors
- [ ] No missing fields in forms
- [ ] Both forms can be submitted successfully

---

## 📊 **Expected Console Logs**

**When Opening Forms:**
```
🔄 Loading lookup data from API...
✅ Lookup data loaded: { industries: 13, jobTypes: 6, ... }
```

**When Submitting:**
```
✅ Job listing created: [UUID] by user [UUID]
✅ Job seeker profile created: [UUID] by user [UUID]
```

**When Loading Feeds:**
```
Jobs API Response: { success: true, data: { listings: [...] } }
Job Seekers API Response: { success: true, data: { job_seekers: [...] } }
```

---

## 🎉 **Final Verification**

Once all tests pass:
1. ✅ Both forms are fully functional
2. ✅ Data is being saved to database correctly
3. ✅ Feeds display real data with proper formatting
4. ✅ All lookup tables are working
5. ✅ Schema migration is successful

**System is ready for production use!** 🚀
