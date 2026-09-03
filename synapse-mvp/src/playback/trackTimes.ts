/** Clamp and interpret track start/end against known media duration. */

export function clampTrackTimes(
  startTime: number,
  endTime: number,
  duration: number
): { startTime: number; endTime: number; duration: number } {
  const dur = duration > 0 && Number.isFinite(duration) ? duration : 0;
  let start = Number.isFinite(startTime) ? Math.max(0, startTime) : 0;
  let end = Number.isFinite(endTime) ? endTime : 0;

  if (dur > 0) {
    start = Math.min(start, dur);
    if (end > 0) end = Math.min(end, dur);
  } else {
    start = Math.max(0, start);
    end = Math.max(0, end);
  }

  const effectiveEnd = end > 0 ? end : dur;
  if (effectiveEnd > 0 && start > effectiveEnd) {
    start = effectiveEnd;
  }
  if (end > 0 && end < start) {
    end = start;
  }

  return { startTime: start, endTime: end, duration: dur };
}

/** Slider/display end: 0 means “play to duration” when duration is known. */
export function displayEndTime(endTime: number, duration: number): number {
  if (duration > 0 && !(endTime > 0)) return duration;
  return Math.max(0, endTime);
}

export function parseClock(input: string): number | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const parts = trimmed.split(':');
  if (parts.length > 3) return null;
  const nums = parts.map((p) => Number(p));
  if (nums.some((n) => !Number.isFinite(n) || n < 0)) return null;
  if (nums.length === 1) return nums[0];
  if (nums.length === 2) return nums[0] * 60 + nums[1];
  return nums[0] * 3600 + nums[1] * 60 + nums[2];
}
