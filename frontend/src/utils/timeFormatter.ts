type TimeFormat = 'auto' | 'minutes' | 'hours' | 'days' | 'months' | 'compact';

interface TimeBreakdown {
  months: number;
  days: number;
  hours: number;
  minutes: number;
}

export const TIME_FORMATS: Record<TimeFormat, TimeFormat> = {
  auto: 'auto',
  minutes: 'minutes',
  hours: 'hours',
  days: 'days',
  months: 'months',
  compact: 'compact',
};

const breakdownTime = (totalMinutes: number): TimeBreakdown => {
  const MINUTES_IN_HOUR = 60;
  const MINUTES_IN_DAY = 1440;
  const MINUTES_IN_MONTH = 43200; // 30 days

  const months = Math.floor(totalMinutes / MINUTES_IN_MONTH);
  let remaining = totalMinutes % MINUTES_IN_MONTH;

  const days = Math.floor(remaining / MINUTES_IN_DAY);
  remaining = remaining % MINUTES_IN_DAY;

  const hours = Math.floor(remaining / MINUTES_IN_HOUR);
  const minutes = remaining % MINUTES_IN_HOUR;

  return { months, days, hours, minutes };
};

export const formatTime = (format: TimeFormat, timeInMinutes: number): string => {
  if (timeInMinutes <= 0) return '0 min';

  const validFormat = TIME_FORMATS[format] || 'auto';
  const breakdown = breakdownTime(timeInMinutes);

  switch (validFormat) {
    case 'minutes':
      return `${timeInMinutes} min`;

    case 'hours':
      const totalHours = (timeInMinutes / 60).toFixed(1);
      return `${totalHours} h`;

    case 'days':
      const totalDays = (timeInMinutes / 1440).toFixed(1);
      return `${totalDays} j`;

    case 'months':
      const totalMonths = (timeInMinutes / 43200).toFixed(1);
      return `${totalMonths} mois`;

    case 'compact':
      const parts: string[] = [];
      if (breakdown.months > 0) parts.push(`${breakdown.months}mois`);
      if (breakdown.days > 0) parts.push(`${breakdown.days}j`);
      if (breakdown.hours > 0) parts.push(`${breakdown.hours}h`);
      if (breakdown.minutes > 0) parts.push(`${breakdown.minutes}min`);
      return parts.join(' ');

    case 'auto':
    default:
      const autoParts: string[] = [];
      if (breakdown.months > 0) {
        autoParts.push(`${breakdown.months} mois`);
      }
      if (breakdown.days > 0) {
        autoParts.push(`${breakdown.days} jour${breakdown.days > 1 ? 's' : ''}`);
      }
      if (breakdown.hours > 0) {
        autoParts.push(`${breakdown.hours} h`);
      }
      if (breakdown.minutes > 0 || autoParts.length === 0) {
        autoParts.push(`${breakdown.minutes} min`);
      }
      return autoParts.join(' ');
  }
};