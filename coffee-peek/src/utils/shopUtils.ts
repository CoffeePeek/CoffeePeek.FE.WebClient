import { DetailedCoffeeShop } from '../api/coffeeshop';

export function formatDayOfWeek(dayOfWeek: number): string {
  const days = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];
  return days[dayOfWeek] || '';
}

export function formatDayOfWeekShort(dayOfWeek: number): string {
  const days = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
  return days[dayOfWeek] || '';
}

export function getCurrentStatus(shop: DetailedCoffeeShop | null) {
  if (!shop?.schedules || shop.schedules.length === 0) return null;
  
  const now = new Date();
  const currentDay = now.getDay() === 0 ? 6 : now.getDay() - 1;
  const currentTime = now.getHours() * 60 + now.getMinutes();
  
  const todaySchedule = shop.schedules.find(s => s.dayOfWeek === currentDay);
  if (!todaySchedule || !todaySchedule.openTime || !todaySchedule.closeTime) return null;
  
  const openTime = parseInt(todaySchedule.openTime.split(':')[0]) * 60 + parseInt(todaySchedule.openTime.split(':')[1]);
  const closeTime = parseInt(todaySchedule.closeTime.split(':')[0]) * 60 + parseInt(todaySchedule.closeTime.split(':')[1]);
  
  const isOpen = currentTime >= openTime && currentTime < closeTime;
  
  return {
    isOpen,
    openTime: todaySchedule.openTime,
    closeTime: todaySchedule.closeTime,
  };
}

