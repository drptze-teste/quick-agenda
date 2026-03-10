
export type SlotType = 'available' | 'booked' | 'break' | 'lunch';

export interface TimeSlot {
  id: string;
  time: string;
  type: SlotType;
  attendeeName?: string;
}

export interface BookingResponse {
  success: boolean;
  message: string;
}

export interface Professional {
  id: string;
  name: string;
  companyId: string;
  slotConfig?: SlotConfig;
  timeList?: string[];
}

// Maps a time string (e.g. "10:00") to its default type
export interface SlotConfig {
  [time: string]: 'available' | 'break' | 'lunch';
}

export interface Company {
  slug: string;
  name: string;
  logoUrl?: string;
  adminPassword?: string;
  availableDates?: string[];
  timeList?: string[];
  slotConfig?: SlotConfig;
  updatedAt?: string;
}
