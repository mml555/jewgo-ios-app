// Fallback data for when API calls fail
export const FALLBACK_INDUSTRIES = [
  {
    id: '1',
    key: 'technology',
    name: 'Technology',
    icon_name: '💻',
    sort_order: 1,
  },
  {
    id: '2',
    key: 'healthcare',
    name: 'Healthcare',
    icon_name: '🏥',
    sort_order: 2,
  },
  { id: '3', key: 'finance', name: 'Finance', icon_name: '💰', sort_order: 3 },
  {
    id: '4',
    key: 'education',
    name: 'Education',
    icon_name: '🎓',
    sort_order: 4,
  },
  {
    id: '5',
    key: 'marketing',
    name: 'Marketing',
    icon_name: '📢',
    sort_order: 5,
  },
  { id: '6', key: 'sales', name: 'Sales', icon_name: '💼', sort_order: 6 },
  {
    id: '7',
    key: 'nonprofit',
    name: 'Non-profit',
    icon_name: '🤝',
    sort_order: 7,
  },
  { id: '8', key: 'other', name: 'Other', icon_name: '🏢', sort_order: 8 },
];

export const FALLBACK_JOB_TYPES = [
  { id: '1', key: 'full-time', name: 'Full-time', sort_order: 1 },
  { id: '2', key: 'part-time', name: 'Part-time', sort_order: 2 },
  { id: '3', key: 'contract', name: 'Contract', sort_order: 3 },
  { id: '4', key: 'remote', name: 'Remote', sort_order: 4 },
  { id: '5', key: 'hybrid', name: 'Hybrid', sort_order: 5 },
];

export const FALLBACK_COMPENSATION_STRUCTURES = [
  { id: '1', name: 'Salary' },
  { id: '2', name: 'Hourly' },
  { id: '3', name: 'Commission' },
  { id: '4', name: 'Freelance' },
];

export const FALLBACK_EXPERIENCE_LEVELS = [
  { id: '1', name: 'Entry Level (0-2 years)' },
  { id: '2', name: 'Mid Level (3-5 years)' },
  { id: '3', name: 'Senior Level (6-10 years)' },
  { id: '4', name: 'Executive Level (10+ years)' },
];
