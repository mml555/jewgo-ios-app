import { BusinessHours, EateryStatusInfo } from '../types/eatery';

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

// Format time for display
export function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

// Get status text with next opening time
export function getStatusText(status: EateryStatusInfo): string {
  if (status.isOpen) {
    return 'Open Now';
  }
  
  if (status.nextOpenTime) {
    const nextOpen = formatTime(status.nextOpenTime);
    return `Opens ${nextOpen}`;
  }
  
  return 'Closed';
}
