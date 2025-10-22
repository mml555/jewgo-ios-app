import { DietaryType, DIETARY_COLORS, PRICE_BRACKETS, BusinessHours, EateryStatusInfo } from '../types/eatery';

// kosher_level now IS the dietary type
export function getDietaryColor(kosherLevel?: string): string {
  if (!kosherLevel) return '#B8B8B8';
  return DIETARY_COLORS[kosherLevel as DietaryType] || '#B8B8B8';
}

export function getDietaryLabel(kosherLevel?: string): string {
  if (!kosherLevel) return '';
  return kosherLevel.charAt(0).toUpperCase() + kosherLevel.slice(1);
}

export function formatPriceRange(min?: number, max?: number): string {
  if (!min && !max) return '';
  if (!max) return `$${min}+`;
  if (min === max) return `$${min}`;
  return `$${min}-${max}`;
}

export function getPriceRangeFromBracket(bracket: string): { min: number; max: number | null } | null {
  const found = PRICE_BRACKETS.find(b => b.label === bracket);
  return found ? { min: found.min, max: found.max } : null;
}

// Convert multiple price brackets to min/max for API
export function convertPriceRangesToMinMax(priceRanges?: string[]): { priceMin?: number; priceMax?: number } {
  if (!priceRanges || priceRanges.length === 0) return {};
  
  const ranges = priceRanges
    .map(br => getPriceRangeFromBracket(br))
    .filter(Boolean);
  
  if (ranges.length === 0) return {};
  
  const priceMin = Math.min(...ranges.map(r => r!.min));
  const priceMax = Math.max(...ranges.map(r => r!.max || 999));
  
  return { priceMin, priceMax };
}

// Check if eatery is currently open
export function isOpenNow(operatingHours?: BusinessHours): boolean {
  if (!operatingHours) return false;
  
  const now = new Date();
  const currentDay = now.toLocaleLowerCase().substring(0, 3); // 'mon', 'tue', etc.
  const currentTime = now.getHours() * 100 + now.getMinutes(); // HHMM format
  
  const todayHours = operatingHours[currentDay];
  if (!todayHours || todayHours.closed) return false;
  
  const openTime = parseTimeToMinutes(todayHours.open);
  const closeTime = parseTimeToMinutes(todayHours.close);
  
  return currentTime >= openTime && currentTime <= closeTime;
}

// Get eatery status with next opening time
export function getEateryStatus(operatingHours?: BusinessHours): EateryStatusInfo {
  const isOpen = isOpenNow(operatingHours);
  
  if (isOpen) {
    return {
      isOpen: true,
      statusText: 'Open Now',
    };
  }
  
  // Find next opening time
  const nextOpenTime = getNextOpenTime(operatingHours);
  
  return {
    isOpen: false,
    nextOpenTime,
    statusText: 'Closed',
  };
}

// Helper to parse time string to minutes since midnight
function parseTimeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

// Get next opening time
function getNextOpenTime(operatingHours?: BusinessHours): Date | undefined {
  if (!operatingHours) return undefined;
  
  const now = new Date();
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  
  // Check next 7 days
  for (let i = 0; i < 7; i++) {
    const checkDate = new Date(now);
    checkDate.setDate(now.getDate() + i);
    
    const dayName = days[checkDate.getDay()];
    const dayHours = operatingHours[dayName];
    
    if (dayHours && !dayHours.closed) {
      const [hours, minutes] = dayHours.open.split(':').map(Number);
      const openTime = new Date(checkDate);
      openTime.setHours(hours, minutes, 0, 0);
      
      if (openTime > now) {
        return openTime;
      }
    }
  }
  
  return undefined;
}
