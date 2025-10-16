const express = require('express');
const JobsController = require('../controllers/jobsController');
const JobSeekersController = require('../controllers/jobSeekersController');
const JobApplicationsController = require('../controllers/jobApplicationsController');

const router = express.Router();

// Middleware (assuming these exist in your auth system)
// const { authenticate } = require('../middleware/auth');
// const { validateRequest } = require('../middleware/validation');

// ============================================================================
// JOB LISTINGS ROUTES
// ============================================================================

// Public routes
router.get('/listings', JobsController.getJobListings);
router.get('/listings/:id', JobsController.getJobListingById);
// Backwards compatibility route (mobile app uses this)
router.get('/:id', JobsController.getJobListingById);

// Protected routes (require authentication)
router.post('/listings', /* authenticate(), */ JobsController.createJobListing);
router.put(
  '/listings/:id',
  /* authenticate(), */ JobsController.updateJobListing,
);
router.delete(
  '/listings/:id',
  /* authenticate(), */ JobsController.deleteJobListing,
);
router.post(
  '/listings/:id/repost',
  /* authenticate(), */ JobsController.repostJobListing,
);
router.post(
  '/listings/:id/mark-filled',
  /* authenticate(), */ JobsController.markJobAsFilled,
);
router.get(
  '/my-listings',
  /* authenticate(), */ JobsController.getMyJobListings,
);

// ============================================================================
// JOB SEEKER PROFILE ROUTES
// ============================================================================

// Public routes
router.get('/seekers', JobSeekersController.getJobSeekerProfiles);
router.get('/seekers/:id', JobSeekersController.getJobSeekerProfileById);

// Protected routes
router.post(
  '/seekers',
  /* authenticate(), */ JobSeekersController.createJobSeekerProfile,
);
router.put(
  '/seekers/:id',
  /* authenticate(), */ JobSeekersController.updateJobSeekerProfile,
);
router.delete(
  '/seekers/:id',
  /* authenticate(), */ JobSeekersController.deleteJobSeekerProfile,
);
router.get(
  '/my-profile',
  /* authenticate(), */ JobSeekersController.getMyProfile,
);

// Contact seeker
router.post(
  '/seekers/:profileId/contact',
  /* authenticate(), */ JobSeekersController.contactJobSeeker,
);

// Save/Unsave profiles
router.post(
  '/seekers/:profileId/save',
  /* authenticate(), */ JobSeekersController.saveProfile,
);
router.delete(
  '/seekers/:profileId/save',
  /* authenticate(), */ JobSeekersController.unsaveProfile,
);
router.get(
  '/my-saved-profiles',
  /* authenticate(), */ JobSeekersController.getMySavedProfiles,
);

// ============================================================================
// JOB APPLICATIONS ROUTES
// ============================================================================

// Submit application
router.post(
  '/listings/:jobListingId/apply',
  /* authenticate(), */ JobApplicationsController.submitApplication,
);

// Get applications
router.get(
  '/listings/:jobListingId/applications',
  /* authenticate(), */ JobApplicationsController.getJobApplications,
);
router.get(
  '/my-applications',
  /* authenticate(), */ JobApplicationsController.getMyApplications,
);

// Manage applications
router.put(
  '/applications/:applicationId/status',
  /* authenticate(), */ JobApplicationsController.updateApplicationStatus,
);
router.post(
  '/applications/:applicationId/withdraw',
  /* authenticate(), */ JobApplicationsController.withdrawApplication,
);

// Statistics
router.get(
  '/listings/:jobListingId/application-stats',
  /* authenticate(), */ JobApplicationsController.getApplicationStatistics,
);

// ============================================================================
// LOOKUP DATA ROUTES (Public - no auth required)
// ============================================================================

router.get('/industries', async (req, res) => {
  try {
    const db = require('../database/connection');
    const result = await db.query(
      'SELECT * FROM job_industries WHERE is_active = true ORDER BY sort_order',
    );
    res.json({ industries: result.rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/job-types', async (req, res) => {
  try {
    const db = require('../database/connection');
    const result = await db.query(
      'SELECT * FROM job_types WHERE is_active = true ORDER BY sort_order',
    );
    res.json({ jobTypes: result.rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/compensation-structures', async (req, res) => {
  try {
    const db = require('../database/connection');
    const result = await db.query(
      'SELECT * FROM compensation_structures WHERE is_active = true ORDER BY sort_order',
    );
    res.json({ compensationStructures: result.rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/experience-levels', async (req, res) => {
  try {
    const db = require('../database/connection');
    const result = await db.query(
      'SELECT * FROM experience_levels WHERE is_active = true ORDER BY sort_order',
    );
    res.json({ experienceLevels: result.rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
