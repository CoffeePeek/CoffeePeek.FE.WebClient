import { z } from 'zod';
import type { AdminShopSchedule } from '../api/admin';
import { localTimeToUtc, normalizeTime24, utcTimeToLocal } from './dayOfWeek';

// Shared helpers for the shop edit forms (moderation / published / owner).
// Everything here is pure (timezone offset is injectable) so it can be unit-tested once a runner is set up.

export const DAY_NAMES = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];

// ==================== Numbers / coordinates ====================

/** '' → null, undefined → undefined. Callers must validate first (see coordinate fields) — invalid input also yields null. */
export function parseOptionalNumber(value?: string): number | null | undefined {
  if (value === undefined) return undefined;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const num = Number(trimmed.replace(',', '.'));
  return Number.isFinite(num) ? num : null;
}

function coordinateField(limit: number, message: string) {
  return z
    .string()
    .optional()
    .refine((value) => {
      const trimmed = value?.trim();
      if (!trimmed) return true;
      const num = Number(trimmed.replace(',', '.'));
      return Number.isFinite(num) && Math.abs(num) <= limit;
    }, message);
}

export const latitudeField = coordinateField(90, 'Широта — число от -90 до 90');
export const longitudeField = coordinateField(180, 'Долгота — число от -180 до 180');

// ==================== Contacts ====================

/** Only http(s) — z.string().url() alone accepts javascript:, data:, etc. */
export function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value.trim());
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

const HAS_SCHEME = /^[a-z][a-z0-9+.-]*:/i;

const phoneField = z.string().optional();
const emailField = z.string().email('Некорректный email').optional().or(z.literal(''));
const websiteField = z
  .string()
  .optional()
  .refine((value) => !value?.trim() || isHttpUrl(value), 'Некорректный URL (нужен http:// или https://)');
/** Instagram may be a handle (@coffeeshop) or a link; a link must be http(s). */
const instagramField = z
  .string()
  .optional()
  .refine(
    (value) => !value?.trim() || !HAS_SCHEME.test(value.trim()) || isHttpUrl(value),
    'Ссылка должна начинаться с http:// или https://'
  );

/** Moderation form field names. */
export const moderationContactShape = {
  phone: phoneField,
  email: emailField,
  website: websiteField,
  instagram: instagramField,
};

/** Published / owner form field names. */
export const publishedContactShape = {
  phoneNumber: phoneField,
  email: emailField,
  siteLink: websiteField,
  instagramLink: instagramField,
};

// ==================== Schedules ====================

/** One backend schedule entry; dayOfWeek is the UI index (0=Mon) of the UTC day, times are UTC HH:mm. */
export interface UtcScheduleEntry {
  dayOfWeek: number;
  isClosed: boolean;
  openTime?: string;
  closeTime?: string;
}

/** Returns a Russian error message if an open day has missing/invalid times, else null. */
export function validateSchedules(schedules: AdminShopSchedule[]): string | null {
  for (const schedule of schedules) {
    if (schedule.isClosed) continue;
    if (!normalizeTime24(schedule.openTime ?? '') || !normalizeTime24(schedule.closeTime ?? '')) {
      return `${DAY_NAMES[schedule.dayOfWeek] ?? 'Расписание'}: укажите время открытия и закрытия в формате HH:mm`;
    }
  }
  return null;
}

/**
 * Local week (UI state) → backend entries in UTC.
 * Open days are shifted to UTC (the day follows the opening time); closed entries are then added only
 * for UTC days not already covered, so the backend never receives duplicate days.
 * Throws (Russian message) on invalid times or when two open days land on the same UTC day.
 */
export function schedulesToUtc(
  schedules: AdminShopSchedule[],
  offsetMinutes = new Date().getTimezoneOffset()
): UtcScheduleEntry[] {
  if (schedules.length === 0) return [];
  const invalid = validateSchedules(schedules);
  if (invalid) throw new Error(invalid);

  const byDay = new Map<number, UtcScheduleEntry>();
  for (const schedule of schedules) {
    if (schedule.isClosed) continue;
    const open = localTimeToUtc(schedule.dayOfWeek, normalizeTime24(schedule.openTime)!, offsetMinutes);
    const close = localTimeToUtc(schedule.dayOfWeek, normalizeTime24(schedule.closeTime)!, offsetMinutes);
    if (byDay.has(open.dayOfWeek)) {
      throw new Error(
        `Два рабочих дня попадают на один день в UTC (${DAY_NAMES[open.dayOfWeek]}). Измените время открытия.`
      );
    }
    byDay.set(open.dayOfWeek, { dayOfWeek: open.dayOfWeek, isClosed: false, openTime: open.time, closeTime: close.time });
  }

  return Array.from({ length: 7 }, (_, dayOfWeek) => byDay.get(dayOfWeek) ?? { dayOfWeek, isClosed: true });
}

/**
 * Backend entries (UTC) → local week. Only open days are converted; every other local day becomes closed,
 * mirroring {@link schedulesToUtc}. Returns [] when the shop has no schedule at all.
 */
export function schedulesFromUtc(
  entries: UtcScheduleEntry[],
  offsetMinutes = new Date().getTimezoneOffset()
): AdminShopSchedule[] {
  if (entries.length === 0) return [];

  const byDay = new Map<number, AdminShopSchedule>();
  for (const entry of entries) {
    const openUtc = normalizeTime24(entry.openTime ?? '');
    const closeUtc = normalizeTime24(entry.closeTime ?? '');
    if (entry.isClosed || !openUtc || !closeUtc) continue;
    const open = utcTimeToLocal(entry.dayOfWeek, openUtc, offsetMinutes);
    const close = utcTimeToLocal(entry.dayOfWeek, closeUtc, offsetMinutes);
    if (byDay.has(open.dayOfWeek)) continue;
    byDay.set(open.dayOfWeek, {
      dayOfWeek: open.dayOfWeek,
      isClosed: false,
      openTime: open.time,
      closeTime: close.time,
      utcDayOfWeek: entry.dayOfWeek,
      openTimeUtc: openUtc,
      closeTimeUtc: closeUtc,
    });
  }

  return Array.from(
    { length: 7 },
    (_, dayOfWeek) => byDay.get(dayOfWeek) ?? { dayOfWeek, isClosed: true, openTime: '', closeTime: '' }
  );
}
