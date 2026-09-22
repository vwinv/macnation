export const SLOT_STEP_MIN = 15;
export const DEFAULT_DURATION_MIN = 30;

export type OpeningHourInput = {
  weekday: number;
  closed: boolean;
  openTime: string;
  closeTime: string;
  pauseStart?: string | null;
  pauseEnd?: string | null;
};

export const WEEKDAY_LABELS = [
  'Dimanche',
  'Lundi',
  'Mardi',
  'Mercredi',
  'Jeudi',
  'Vendredi',
  'Samedi',
] as const;

export const WEEKDAY_ORDER = [1, 2, 3, 4, 5, 6, 0] as const;

export const DEFAULT_OPENING_HOURS: OpeningHourInput[] = [0, 1, 2, 3, 4, 5, 6].map(
  (weekday) =>
    weekday === 0
      ? { weekday, closed: false, openTime: '12:00', closeTime: '20:00' }
      : { weekday, closed: false, openTime: '10:00', closeTime: '21:00' },
);

export function durationMinutes(
  raw: string | number | null | undefined,
): number {
  if (typeof raw === 'number' && Number.isFinite(raw) && raw > 0) {
    return Math.max(5, Math.round(raw));
  }
  const nums = [...String(raw || '').matchAll(/(\d+)/g)]
    .map((match) => Number(match[1]))
    .filter((n) => n > 0);
  if (!nums.length) return DEFAULT_DURATION_MIN;
  return Math.max(...nums);
}

export function isHhmm(value: string) {
  return /^\d{2}:\d{2}$/.test(value);
}

export function toMinutes(hhmm: string) {
  const [h, m] = hhmm.split(':').map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return NaN;
  return h * 60 + m;
}

export function fromMinutes(total: number) {
  const wrapped = ((Math.round(total) % (24 * 60)) + 24 * 60) % (24 * 60);
  const h = Math.floor(wrapped / 60);
  const m = wrapped % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function rangesOverlap(
  aStart: number,
  aEnd: number,
  bStart: number,
  bEnd: number,
) {
  return aStart < bEnd && bStart < aEnd;
}

export function weekdayFromIso(iso: string) {
  return new Date(`${iso.slice(0, 10)}T12:00:00`).getDay();
}

export function slotRange(start: string, durationMin: number) {
  const end = fromMinutes(toMinutes(start) + durationMin);
  return { end, label: `${start} – ${end}` };
}

export function generateStarts(
  openTime: string,
  closeTime: string,
  durationMin: number,
  step = SLOT_STEP_MIN,
  pause?: { start?: string | null; end?: string | null } | null,
) {
  const out: string[] = [];
  for (const [open, close] of openingWindows(openTime, closeTime, pause)) {
    const lastStart = close - durationMin;
    if (lastStart < open) continue;
    for (let t = open; t <= lastStart; t += step) out.push(fromMinutes(t));
  }
  return out;
}

export function openingWindows(
  openTime: string,
  closeTime: string,
  pause?: { start?: string | null; end?: string | null } | null,
) {
  const open = toMinutes(openTime);
  const close = toMinutes(closeTime);
  if (!Number.isFinite(open) || !Number.isFinite(close) || close <= open) {
    return [] as [number, number][];
  }
  const pauseStart =
    pause?.start && isHhmm(pause.start) ? toMinutes(pause.start) : NaN;
  const pauseEnd =
    pause?.end && isHhmm(pause.end) ? toMinutes(pause.end) : NaN;
  if (
    !Number.isFinite(pauseStart) ||
    !Number.isFinite(pauseEnd) ||
    pauseEnd <= pauseStart
  ) {
    return [[open, close] as [number, number]];
  }
  if (pauseEnd <= open || pauseStart >= close) {
    return [[open, close] as [number, number]];
  }
  const windows: [number, number][] = [];
  const morningEnd = Math.min(close, pauseStart);
  if (morningEnd > open) windows.push([open, morningEnd]);
  const afternoonStart = Math.max(open, pauseEnd);
  if (close > afternoonStart) windows.push([afternoonStart, close]);
  return windows;
}

export function normalizePause(
  pauseStart?: string | null,
  pauseEnd?: string | null,
) {
  const start = pauseStart?.trim() || '';
  const end = pauseEnd?.trim() || '';
  if (!start && !end) return { pauseStart: null, pauseEnd: null };
  if (!isHhmm(start) || !isHhmm(end) || toMinutes(end) <= toMinutes(start)) {
    return { pauseStart: null, pauseEnd: null, invalid: true as const };
  }
  return { pauseStart: start, pauseEnd: end };
}

export function leadMinutes(iso: string, bufferMin = 30) {
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  if (iso.slice(0, 10) !== today) return null;
  return now.getHours() * 60 + now.getMinutes() + bufferMin;
}
