// Eateries-specific types and constants
// Dietary type (NOW in kosher_level field)
export type DietaryType = 'meat' | 'dairy' | 'parve';

// Common hechsher certifications (NOW standardized in kosher_certification)
export const HECHSHER_OPTIONS = ['KM', 'ORB', 'OU', 'OK', 'Star-K', 'CRC', 'Kof-K'] as const;
export type HechsherCertification = typeof HECHSHER_OPTIONS[number];

// Price bracket interface
export interface PriceRange {
  label: string;
  min: number;
  max: number | null;
}

// Spec price brackets from the specification
export const PRICE_BRACKETS: PriceRange[] = [
  { label: '$5-10', min: 5, max: 10 },
  { label: '$10-20', min: 10, max: 20 },
  { label: '$20-30', min: 20, max: 30 },
  { label: '$30-40', min: 30, max: 40 },
  { label: '$40-50', min: 40, max: 50 },
  { label: '$50-60', min: 50, max: 60 },
  { label: '$60-70', min: 60, max: 70 },
  { label: '$70-80', min: 70, max: 80 },
  { label: '$80-90', min: 80, max: 90 },
  { label: '$90-100', min: 90, max: 100 },
  { label: '$100+', min: 100, max: null },
];

// Dietary type colors from spec
export const DIETARY_COLORS: Record<DietaryType, string> = {
  meat: '#EB7777',
  dairy: '#71BBFF',
  parve: '#FFCE6D',
};

// Business hours interface
export interface BusinessHours {
  [key: string]: {
    open: string;
    close: string;
    closed?: boolean;
  };
}

// Eatery-specific status
export type EateryStatus = 'open' | 'closed';

// Open/closed status with next opening time
export interface EateryStatusInfo {
  isOpen: boolean;
  nextOpenTime?: Date;
  statusText: string;
}
