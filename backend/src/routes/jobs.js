const express = require('express');
const JobsController = require('../controllers/jobsController');

const router = express.Router();

// GET /api/v5/jobs - Get all jobs
router.get('/', JobsController.getAllJobs);

// GET /api/v5/jobs/categories - Get job categories
router.get('/categories', JobsController.getJobCategories);

// GET /api/v5/jobs/:id - Get single job
router.get('/:id', JobsController.getJobById);

// POST /api/v5/jobs - Create new job
router.post('/', JobsController.createJob);

// PUT /api/v5/jobs/:id - Update job
router.put('/:id', JobsController.updateJob);

// DELETE /api/v5/jobs/:id - Delete job
router.delete('/:id', JobsController.deleteJob);

// POST /api/v5/jobs/:id/apply - Apply for job
router.post('/:id/apply', JobsController.applyForJob);

// GET /api/v5/jobs/:id/applications - Get job applications
router.get('/:id/applications', JobsController.getJobApplications);

module.exports = router;
