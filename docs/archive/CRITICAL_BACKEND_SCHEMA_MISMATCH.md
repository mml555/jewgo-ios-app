# 🚨 CRITICAL: Backend Schema Mismatch Issues

## **Problem Summary**

1. ✅ **CreateJobSeekerProfile form** - NOW FIXED with complete 4-step form
2. ❌ **Jobs feed API** - Backend `jobs` table schema doesn't match frontend expectations
3. ❌ **CreateJobScreen** - Frontend sends fields that backend doesn't expect

---

## 1️⃣ **CreateJobSeekerProfile Form** ✅ FIXED

### **Status:** ✅ **COMPLETE**

The form now has all 4 steps with complete field collection:

**Step 1: Personal Information**
- Name, Age, Gender, Zip Code, Headshot URL

**Step 2: Professional Information**
- Preferred Industry, Job Type, Experience Level
- Bio, Skills (with add/remove)

**Step 3: Compensation & Preferences**
- Desired Salary Range (Min/Max)
- Availability (Immediate, 2 weeks, 1 month, Negotiable)
- Work Preferences (Remote, Relocate checkboxes)

**Step 4: Contact & Links**
- Contact Email, Phone
- Resume URL, LinkedIn URL, Portfolio URL, Meeting Link

### **Backend Match:** ✅ **PERFECT**
All fields match the `job_seeker_profiles` table schema exactly.

---

## 2️⃣ **Jobs Feed API** ❌ CRITICAL ISSUE

### **Problem:**
The backend `jobs` table has a **completely different schema** than what the frontend expects.

### **Frontend Expects (from EnhancedJobsScreen.tsx):**
```typescript
{
  id, title, company_name, description, category,
  job_type, compensation_type, compensation_display, price,
  zip_code, city, state, latitude, longitude,
  contact_email, contact_phone, application_url,
  is_remote, location_type, posted_date, created_at, is_active
}
```

### **Backend Currently Has (from jobsController.js):**
```sql
INSERT INTO jobs (
  poster_id, title, company_name, job_type, compensation_type,
  compensation_min, compensation_max, compensation_currency,
  zip_code, city, state, latitude, longitude,
  is_remote, location_type, description, requirements, benefits,
  tags, application_url, contact_email, contact_phone
)
```

### **Missing Fields in Backend:**
- ❌ `category` / `industry_id`
- ❌ `compensation_display`
- ❌ `price`
- ❌ `posted_date` (has `created_at` but not exposed)
- ❌ `is_active` (not in INSERT statement)

### **Extra Fields in Backend (not used by frontend):**
- `requirements`
- `benefits`
- `tags`
- `compensation_currency`

---

## 3️⃣ **CreateJobScreen Form** ❌ MISMATCH

### **Frontend Sends:**
```typescript
{
  jobTitle, companyName, industryId, jobTypeId, experienceLevelId,
  compensationStructureId, salaryMin, salaryMax, hourlyRateMin, hourlyRateMax,
  showSalary, zipCode, isRemote, isHybrid, description, requirements,
  responsibilities, benefits, skills, contactEmail, contactPhone, ctaLink
}
```

### **Backend Expects:**
```javascript
{
  jobTitle, industryId, jobTypeId, experienceLevelId, compensationStructureId,
  salaryMin, salaryMax, hourlyRateMin, hourlyRateMax, currency, showSalary,
  zipCode, isRemote, isHybrid, description, requirements, benefits,
  responsibilities, skills, ctaLink, contactEmail, contactPhone,
  companyName, companyWebsite, companyLogoUrl
}
```

### **Backend Actually Inserts:**
```sql
INSERT INTO jobs (
  poster_id, title, company_name, job_type, compensation_type,
  compensation_min, compensation_max, compensation_currency,
  zip_code, city, state, latitude, longitude,
  is_remote, location_type, description, requirements, benefits,
  tags, application_url, contact_email, contact_phone
)
```

### **Issues:**
1. ❌ Backend receives `industryId` but doesn't use it (no `industry_id` column)
2. ❌ Backend receives `jobTypeId` but inserts as string `job_type` instead of UUID reference
3. ❌ Backend receives `compensationStructureId` but doesn't use it
4. ❌ Backend receives `experienceLevelId` but doesn't use it
5. ❌ Backend receives `skills` array but inserts as `tags`
6. ❌ Backend receives `responsibilities` but doesn't insert it
7. ❌ Backend receives `isHybrid` but doesn't use it (only `is_remote` and `location_type`)
8. ❌ Backend receives `showSalary` but doesn't use it

---

## 🔧 **Required Fixes**

### **Option 1: Fix Backend Schema (RECOMMENDED)**

Update the `jobs` table to match the complete jobs system schema:

```sql
-- Add missing columns to jobs table
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS industry_id UUID REFERENCES job_industries(id);
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS job_type_id UUID REFERENCES job_types(id);
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS experience_level_id UUID REFERENCES experience_levels(id);
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS compensation_structure_id UUID REFERENCES compensation_structures(id);
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS show_compensation BOOLEAN DEFAULT TRUE;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS is_hybrid BOOLEAN DEFAULT FALSE;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS responsibilities TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS skills JSONB DEFAULT '[]';
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS posted_date TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS company_website VARCHAR(500);
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS company_logo_url VARCHAR(500);

-- Update existing job_type column to be a UUID reference
-- (This requires data migration - complex)
```

### **Option 2: Update Backend Controller (EASIER - IMMEDIATE FIX)**

Update `backend/src/controllers/jobsController.js` to:
1. Accept all fields from frontend
2. Map them correctly to database columns
3. Use lookup tables (industries, job_types, etc.)
4. Return data in format frontend expects

---

## 📊 **Impact Assessment**

### **High Priority:**
1. ✅ **Job Seeker Form** - FIXED
2. ❌ **Jobs Feed** - NOT LOADING (schema mismatch)
3. ❌ **Create Job** - WILL FAIL (schema mismatch)

### **Current State:**
- **Job Seekers**: ✅ Form complete, API working, will create profiles successfully
- **Jobs Feed**: ❌ API returns data but fields don't match frontend expectations
- **Create Job**: ❌ Will fail because backend doesn't handle the fields correctly

---

## 🚀 **Immediate Action Required**

1. **Fix backend `jobsController.js`** to properly handle all fields
2. **Add missing columns** to `jobs` table OR
3. **Update frontend** to match current backend schema

**Recommendation:** Fix the backend controller first (quick win), then migrate schema later.

---

## ✅ **What's Working**

- ✅ All lookup endpoints (industries, job types, etc.)
- ✅ Job seekers API (GET)
- ✅ Job seekers form (complete with all fields)
- ✅ Job seekers creation (will work when submitted)

## ❌ **What's Broken**

- ❌ Jobs feed display (schema mismatch)
- ❌ Job creation (schema mismatch)
- ❌ Job detail page (will fail due to missing fields)

---

## 📝 **Next Steps**

1. Update `backend/src/controllers/jobsController.js` to handle all fields correctly
2. Test job creation from frontend
3. Verify jobs feed displays correctly
4. Plan database schema migration for long-term fix
