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

/** Convert .NET DayOfWeek number (0=Sun) → UI index (0=Mon). */
export function dotNetNumberToUiDay(n: number): number {
  const truncated = Math.trunc(n);
  if (truncated < 0 || truncated > 6) return 0;
  return (truncated + 6) % 7;
}

/** Convert UI index (0=Mon) → .NET DayOfWeek number (0=Sun). */
export function uiDayToDotNetNumber(ui: number): number {
  const truncated = Math.trunc(ui);
  if (truncated < 0 || truncated > 6) return 1;
  return (truncated + 1) % 7;
}

/** Prefer for PUT/POST bodies. */
export function uiDayToDotNetName(ui: number): (typeof UI_TO_DOTNET_NAME)[number] {
  const truncated = Math.trunc(ui);
  if (truncated < 0 || truncated > 6) return 'Monday';
  return UI_TO_DOTNET_NAME[truncated];
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
