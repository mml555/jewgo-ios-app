import React from 'react';
import JobListingsScreen from './jobs/JobListingsScreen';

// Legacy routing still points to EnhancedJobsScreen; reuse the new
// sticky jobs layout while keeping the existing entry point.
const EnhancedJobsScreen = () => {
  return <JobListingsScreen />;
};

export default EnhancedJobsScreen;
