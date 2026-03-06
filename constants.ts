import { TimeSlot, SlotConfig, Professional } from './types';

export const TIME_LIST = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
  '15:00', '15:30', '16:00', '16:30', '17:00', '17:30'
];

export const DEFAULT_SLOT_CONFIG: SlotConfig = {
  '12:00': 'lunch',
  '12:30': 'lunch',
  '13:00': 'lunch',
  '13:30': 'lunch',
};

export const DEFAULT_PROFESSIONAL: Professional = {
  id: 'pro-1',
  name: 'Massoterapeuta 1',
  slotConfig: {}
};

export const generateScheduleFromConfig = (config: SlotConfig, timeList: string[]): TimeSlot[] => {
  const safeConfig = config || {};
  const safeTimeList = timeList || [];
  return safeTimeList.map((time, index) => ({
    id: `slot-${index}`,
    time,
    type: (safeConfig[time] as any) || 'available',
    attendeeName: safeConfig[time] === 'lunch' ? 'Almoço' : safeConfig[time] === 'break' ? 'Intervalo' : undefined
  }));
};

export const INITIAL_SLOTS = generateScheduleFromConfig(DEFAULT_SLOT_CONFIG, TIME_LIST);
