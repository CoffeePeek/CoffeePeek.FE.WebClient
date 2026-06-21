import React from 'react';
import { AdminShopSchedule } from '../../api/admin';

const DAY_NAMES = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];

interface ScheduleEditorProps {
  value: AdminShopSchedule[];
  onChange: (schedules: AdminShopSchedule[]) => void;
}

function ensureWeek(value: AdminShopSchedule[]): AdminShopSchedule[] {
  const byDay = new Map(value.map((item) => [item.dayOfWeek, item]));
  return Array.from({ length: 7 }, (_, dayOfWeek) =>
    byDay.get(dayOfWeek) ?? {
      dayOfWeek,
      isClosed: true,
      openTime: '08:00',
      closeTime: '22:00',
    }
  );
}

export const ScheduleEditor: React.FC<ScheduleEditorProps> = ({ value, onChange }) => {
  const schedules = ensureWeek(value);

  const updateDay = (dayOfWeek: number, patch: Partial<AdminShopSchedule>) => {
    onChange(
      schedules.map((schedule) =>
        schedule.dayOfWeek === dayOfWeek ? { ...schedule, ...patch } : schedule
      )
    );
  };

  return (
    <div className="space-y-2">
      {schedules.map((schedule) => (
        <div
          key={schedule.dayOfWeek}
          className="grid grid-cols-1 sm:grid-cols-[140px_100px_1fr_1fr] gap-2 sm:gap-3 items-center rounded-lg bg-gray-50 dark:bg-white/5 px-3 py-2.5"
        >
          <p className="text-sm font-medium text-text-main dark:text-white font-body">
            {DAY_NAMES[schedule.dayOfWeek]}
          </p>
          <label className="flex items-center gap-2 text-xs text-text-muted dark:text-stone-400 font-body">
            <input
              type="checkbox"
              checked={schedule.isClosed ?? false}
              onChange={(e) => updateDay(schedule.dayOfWeek, { isClosed: e.target.checked })}
              className="rounded border-border-light dark:border-border-dark"
            />
            Выходной
          </label>
          <input
            type="time"
            value={schedule.openTime || '08:00'}
            disabled={schedule.isClosed}
            onChange={(e) => updateDay(schedule.dayOfWeek, { openTime: e.target.value, isClosed: false })}
            className="w-full border border-border-light dark:border-border-dark rounded-lg px-3 py-2 text-sm bg-white dark:bg-[#1A1412] text-text-main dark:text-white disabled:opacity-50 font-body"
          />
          <input
            type="time"
            value={schedule.closeTime || '22:00'}
            disabled={schedule.isClosed}
            onChange={(e) => updateDay(schedule.dayOfWeek, { closeTime: e.target.value, isClosed: false })}
            className="w-full border border-border-light dark:border-border-dark rounded-lg px-3 py-2 text-sm bg-white dark:bg-[#1A1412] text-text-main dark:text-white disabled:opacity-50 font-body"
          />
        </div>
      ))}
    </div>
  );
};

export function getDefaultSchedules(): AdminShopSchedule[] {
  return [
    { dayOfWeek: 0, openTime: '08:00', closeTime: '22:00' },
    { dayOfWeek: 1, openTime: '08:00', closeTime: '22:00' },
    { dayOfWeek: 2, openTime: '08:00', closeTime: '22:00' },
    { dayOfWeek: 3, openTime: '08:00', closeTime: '22:00' },
    { dayOfWeek: 4, openTime: '08:00', closeTime: '22:00' },
    { dayOfWeek: 5, openTime: '10:00', closeTime: '22:00' },
    { dayOfWeek: 6, openTime: '10:00', closeTime: '22:00' },
  ];
}
