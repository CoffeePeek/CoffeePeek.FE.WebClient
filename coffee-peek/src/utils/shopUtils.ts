/**
 * Получает текущий день недели (0 = Понедельник, 6 = Воскресенье)
 */
export function getCurrentDayOfWeek(): number {
  const today = new Date();
  // getDay() возвращает 0 (воскресенье) - 6 (суббота)
  // Преобразуем в формат: 0 (понедельник) - 6 (воскресенье)
  const day = today.getDay();
  return day === 0 ? 6 : day - 1;
}

/**
 * Нормализует день недели к 0 = Пн … 6 = Вс.
 * API может отдать число 0–6, ISO 1–7 или строку ("Monday" / .NET DayOfWeek).
 */
export function normalizeDayOfWeek(
  dayOfWeek: number | string | null | undefined
): number | null {
  if (dayOfWeek === null || dayOfWeek === undefined || dayOfWeek === '') return null;

  if (typeof dayOfWeek === 'string') {
    const named: Record<string, number> = {
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
    const key = dayOfWeek.trim().toLowerCase();
    if (key in named) return named[key];
    const asNum = Number(dayOfWeek);
    if (!Number.isFinite(asNum)) return null;
    dayOfWeek = asNum;
  }

  if (typeof dayOfWeek !== 'number' || !Number.isFinite(dayOfWeek)) return null;
  const n = Math.trunc(dayOfWeek);
  if (n >= 0 && n <= 6) return n;
  // ISO-8601: 1 = Monday … 7 = Sunday
  if (n >= 1 && n <= 7) return n === 7 ? 6 : n - 1;
  return null;
}

/**
 * Получает статус работы кофейни на основе расписания
 */
export function getCurrentStatus(shop: { schedules?: Array<{ dayOfWeek: number | string; openTime?: string; closeTime?: string }> } | null): {
  isOpen: boolean;
  openTime?: string;
  closeTime?: string;
} | null {
  if (!shop?.schedules || shop.schedules.length === 0) return null;

  const currentDay = getCurrentDayOfWeek();
  const todaySchedule = shop.schedules.find((s) => normalizeDayOfWeek(s.dayOfWeek) === currentDay);
  if (!todaySchedule || !todaySchedule.openTime || !todaySchedule.closeTime) return null;

  const openTime = parseInt(todaySchedule.openTime.split(':')[0]) * 60 + parseInt(todaySchedule.openTime.split(':')[1]);
  const closeTime = parseInt(todaySchedule.closeTime.split(':')[0]) * 60 + parseInt(todaySchedule.closeTime.split(':')[1]);
  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();

  return {
    isOpen: currentTime >= openTime && currentTime < closeTime,
    openTime: todaySchedule.openTime,
    closeTime: todaySchedule.closeTime,
  };
}

/**
 * Дефолтное расписание работы кофейни
 * Пн-Пт: 8:00-22:00, Сб-Вс: 10:00-22:00
 */
export function getDefaultSchedules(): Array<{
  dayOfWeek: number;
  openTime: string;
  closeTime: string;
}> {
  return [
    { dayOfWeek: 0, openTime: '08:00', closeTime: '22:00' }, // Понедельник
    { dayOfWeek: 1, openTime: '08:00', closeTime: '22:00' }, // Вторник
    { dayOfWeek: 2, openTime: '08:00', closeTime: '22:00' }, // Среда
    { dayOfWeek: 3, openTime: '08:00', closeTime: '22:00' }, // Четверг
    { dayOfWeek: 4, openTime: '08:00', closeTime: '22:00' }, // Пятница
    { dayOfWeek: 5, openTime: '10:00', closeTime: '22:00' }, // Суббота
    { dayOfWeek: 6, openTime: '10:00', closeTime: '22:00' }, // Воскресенье
  ];
}

/**
 * Форматирует день недели для отображения (0 = Пн … 6 = Вс)
 */
export function formatDayOfWeek(dayOfWeek: number | string): string {
  const days = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];
  const idx = normalizeDayOfWeek(dayOfWeek);
  return idx === null ? '' : days[idx];
}

/** Короткие названия: Пн, Вт, … Вс */
export function formatDayOfWeekShort(dayOfWeek: number | string): string {
  const days = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
  const idx = normalizeDayOfWeek(dayOfWeek);
  return idx === null ? '' : days[idx];
}

/** `https://instagram.com/alt.minsk` → `@alt.minsk` */
export function instagramHandle(value: string): string {
  const trimmed = value.trim();
  try {
    const href = /^https?:\/\//i.test(trimmed)
      ? trimmed
      : trimmed.includes('instagram.com')
        ? `https://${trimmed}`
        : '';
    if (href) {
      const path = new URL(href).pathname.split('/').filter(Boolean)[0] || '';
      return path ? `@${path}` : trimmed;
    }
  } catch {
    // fall through
  }
  const handle = trimmed.replace(/^@/, '').split('/')[0];
  return handle ? `@${handle}` : trimmed;
}

export function instagramUrl(value: string): string {
  const trimmed = value.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.includes('instagram.com')) return `https://${trimmed.replace(/^\/+/, '')}`;
  return `https://instagram.com/${trimmed.replace(/^@/, '')}`;
}

export function toWebsiteHref(url: string): string {
  return url.startsWith('http') ? url : `https://${url}`;
}
