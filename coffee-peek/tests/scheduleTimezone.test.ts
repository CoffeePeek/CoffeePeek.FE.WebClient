import { localTimeToUtc, utcTimeToLocal } from '../src/utils/shopUtils';

// offsetMinutes follows Date.getTimezoneOffset(): negative = ahead of UTC (e.g. Minsk UTC+3 = -180).
const MINSK = -180;

test('converts local time to UTC without crossing midnight', () => {
  expect(localTimeToUtc(0, '08:00', MINSK)).toEqual({ dayOfWeek: 0, time: '05:00' });
  expect(localTimeToUtc(0, '22:00', MINSK)).toEqual({ dayOfWeek: 0, time: '19:00' });
});

test('shifts dayOfWeek back when conversion crosses midnight', () => {
  expect(localTimeToUtc(0, '02:00', MINSK)).toEqual({ dayOfWeek: 6, time: '23:00' });
});

test('shifts dayOfWeek forward for timezones behind UTC', () => {
  expect(localTimeToUtc(3, '23:00', 300)).toEqual({ dayOfWeek: 4, time: '04:00' });
});

test('utcTimeToLocal reverses localTimeToUtc', () => {
  for (const [dayOfWeek, time] of [[0, '08:00'], [0, '02:00'], [6, '23:30']] as const) {
    const utc = localTimeToUtc(dayOfWeek, time, MINSK);
    expect(utcTimeToLocal(utc.dayOfWeek, utc.time, MINSK)).toEqual({ dayOfWeek, time });
  }
});
