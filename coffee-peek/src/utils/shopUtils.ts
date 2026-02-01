import { FrontendSchedule } from '../api/moderation';

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
 * Получает статус работы кофейни на основе расписания
 */
export function getCurrentStatus(shop: { schedules?: Array<{ dayOfWeek: number; openTime?: string; closeTime?: string }> } | null): {
  isOpen: boolean;
  openTime?: string;
  closeTime?: string;
} | null {
  if (!shop?.schedules || shop.schedules.length === 0) return null;

  const currentDay = getCurrentDayOfWeek();
  const todaySchedule = shop.schedules.find(s => s.dayOfWeek === currentDay);
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
export function getDefaultSchedules(): FrontendSchedule[] {
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
 * Форматирует день недели для отображения
 */
export function formatDayOfWeek(dayOfWeek: number): string {
  const days = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];
  return days[dayOfWeek] || '';
}
