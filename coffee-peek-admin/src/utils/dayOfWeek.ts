/**
 * UI / ScheduleEditor: 0 = Monday … 6 = Sunday.
 * .NET DayOfWeek: 0 = Sunday … 6 = Saturday (JSON often "Monday").
 */

const UI_TO_DOTNET_NAME = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
] as const;

const NAME_TO_UI: Record<string, number> = {
  monday: 0,
  mon: 0,
  tuesday: 1,
  tue: 1,
  wednesday: 2,
  wed: 2,
  thursday: 3,
  thu: 3,
  friday: 4,
  fri: 4,
  saturday: 5,
  sat: 5,
  sunday: 6,
  sun: 6,
};

const TIME_24_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

/** Normalize a complete wall-clock value to strict HH:mm, or return null. */
export function normalizeTime24(value: string): string | null {
  const match = value.trim().match(TIME_24_PATTERN);
  if (!match) return null;
  return `${match[1]}:${match[2]}`;
}

/** Device IANA timezone plus its current UTC offset. */
export function getDeviceTimezoneLabel(date = new Date()): string {
  const zone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Локальное время';
  const offsetMinutes = -date.getTimezoneOffset();
  const sign = offsetMinutes >= 0 ? '+' : '-';
  const absolute = Math.abs(offsetMinutes);
  const hours = String(Math.floor(absolute / 60)).padStart(2, '0');
  const minutes = String(absolute % 60).padStart(2, '0');
  return `${zone} (UTC${sign}${hours}:${minutes})`;
}

/** Convert .NET DayOfWeek number (0=Sun) → UI index (0=Mon). */
export function dotNetNumberToUiDay(n: number): number {
  const truncated = Math.trunc(n);
  if (truncated < 0 || truncated > 6) return 0;
  return (truncated + 6) % 7;
}

/** Prefer for PUT/POST bodies. */
export function uiDayToDotNetName(ui: number): (typeof UI_TO_DOTNET_NAME)[number] {
  const truncated = Math.trunc(ui);
  if (truncated < 0 || truncated > 6) return 'Monday';
  return UI_TO_DOTNET_NAME[truncated];
}

/** Convert a local wall-clock schedule time to UTC, shifting the UI day if it crosses midnight. */
export function localTimeToUtc(
  dayOfWeek: number,
  time: string,
  offsetMinutes = new Date().getTimezoneOffset()
): { dayOfWeek: number; time: string } {
  return shiftScheduleTime(dayOfWeek, time, offsetMinutes);
}

/** Reverse of {@link localTimeToUtc}. */
export function utcTimeToLocal(
  dayOfWeek: number,
  time: string,
  offsetMinutes = new Date().getTimezoneOffset()
): { dayOfWeek: number; time: string } {
  return shiftScheduleTime(dayOfWeek, time, -offsetMinutes);
}

function shiftScheduleTime(
  dayOfWeek: number,
  time: string,
  offsetMinutes: number
): { dayOfWeek: number; time: string } {
  const normalized = normalizeTime24(time);
  if (!normalized) return { dayOfWeek, time };
  const [hours, minutes] = normalized.split(':').map(Number);
  const raw = hours * 60 + minutes + offsetMinutes;
  const dayDelta = Math.floor(raw / 1440);
  const totalMinutes = ((raw % 1440) + 1440) % 1440;
  return {
    dayOfWeek: ((dayOfWeek + dayDelta) % 7 + 7) % 7,
    time: `${String(Math.floor(totalMinutes / 60)).padStart(2, '0')}:${String(totalMinutes % 60).padStart(2, '0')}`,
  };
}

/**
 * Normalize API dayOfWeek (string name or .NET number) to UI 0=Mon…6=Sun.
 */
export function apiDayOfWeekToUi(dayOfWeek: number | string | null | undefined): number {
  if (dayOfWeek === null || dayOfWeek === undefined || dayOfWeek === '') return 0;

  if (typeof dayOfWeek === 'string') {
    const key = dayOfWeek.trim().toLowerCase();
    if (key in NAME_TO_UI) return NAME_TO_UI[key];
    const asNum = Number(dayOfWeek);
    if (!Number.isFinite(asNum)) return 0;
    return dotNetNumberToUiDay(asNum);
  }

  if (typeof dayOfWeek === 'number' && Number.isFinite(dayOfWeek)) {
    return dotNetNumberToUiDay(dayOfWeek);
  }

  return 0;
}
