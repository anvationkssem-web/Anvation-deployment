export type HackathonTimerStatus = 'before_start' | 'round_1' | 'round_2' | 'completed';

export interface HackathonTimerState {
  status: HackathonTimerStatus;
  roundLabel: string;
  statusLabel: string;
  badgeLabel: string;
  message: string;
  timeRemainingMs: number;
  totalDurationMs: number;
  progress: number;
  startedAtMs: number | null;
  elapsedMs: number;
}

export const HACKATHON_START_STORAGE_KEY = 'hackathonStartTime';
export const ROUND_1_DURATION_MS = 4 * 60 * 60 * 1000;
export const ROUND_2_DURATION_MS = 20 * 60 * 60 * 1000;
export const TOTAL_HACKATHON_DURATION_MS = ROUND_1_DURATION_MS + ROUND_2_DURATION_MS;

export function clampDuration(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(value, TOTAL_HACKATHON_DURATION_MS));
}

export function formatCountdown(totalMs: number): string {
  const safeMs = Math.max(0, Math.floor(totalMs));
  const hours = Math.floor(safeMs / (1000 * 60 * 60));
  const minutes = Math.floor((safeMs % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((safeMs % (1000 * 60)) / 1000);
  return [hours, minutes, seconds].map((value) => String(value).padStart(2, '0')).join(':');
}

export function getStoredHackathonStartTime(): number | null {
  try {
    const value = window.localStorage.getItem(HACKATHON_START_STORAGE_KEY);
    if (!value) return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function saveHackathonStartTime(timestampMs: number): number {
  const safeMs = Number.isFinite(timestampMs) ? timestampMs : Date.now();
  try {
    window.localStorage.setItem(HACKATHON_START_STORAGE_KEY, String(safeMs));
  } catch {
    // Ignore storage failure in restricted browser contexts.
  }
  return safeMs;
}

export function clearHackathonStartTime(): void {
  try {
    window.localStorage.removeItem(HACKATHON_START_STORAGE_KEY);
  } catch {
    // Ignore storage failure in restricted browser contexts.
  }
}

export function getHackathonTimerState(startTimestampMs: number | null | undefined, nowMs: number): HackathonTimerState {
  const safeNow = Number.isFinite(nowMs) ? nowMs : Date.now();
  const safeStart = typeof startTimestampMs === 'number' && Number.isFinite(startTimestampMs) ? startTimestampMs : null;

  if (!safeStart) {
    return {
      status: 'before_start',
      roundLabel: 'HACKATHON READY',
      statusLabel: 'HACKATHON READY',
      badgeLabel: 'HACKATHON READY',
      message: 'TIME REMAINING',
      timeRemainingMs: TOTAL_HACKATHON_DURATION_MS,
      totalDurationMs: TOTAL_HACKATHON_DURATION_MS,
      progress: 0,
      startedAtMs: null,
      elapsedMs: 0,
    };
  }

  if (safeNow < safeStart) {
    const timeRemainingMs = Math.max(0, safeStart - safeNow);
    return {
      status: 'before_start',
      roundLabel: 'HACKATHON READY',
      statusLabel: 'HACKATHON READY',
      badgeLabel: 'HACKATHON READY',
      message: 'TIME REMAINING',
      timeRemainingMs,
      totalDurationMs: TOTAL_HACKATHON_DURATION_MS,
      progress: 0,
      startedAtMs: safeStart,
      elapsedMs: 0,
    };
  }

  const elapsedMs = Math.max(0, safeNow - safeStart);

  if (elapsedMs < ROUND_1_DURATION_MS) {
    const timeRemainingMs = clampDuration(ROUND_1_DURATION_MS - elapsedMs);
    return {
      status: 'round_1',
      roundLabel: 'ROUND 1',
      statusLabel: '● LIVE',
      badgeLabel: '● LIVE',
      message: 'TIME REMAINING',
      timeRemainingMs,
      totalDurationMs: TOTAL_HACKATHON_DURATION_MS,
      progress: Math.min(100, (elapsedMs / TOTAL_HACKATHON_DURATION_MS) * 100),
      startedAtMs: safeStart,
      elapsedMs,
    };
  }

  if (elapsedMs < TOTAL_HACKATHON_DURATION_MS) {
    const timeRemainingMs = clampDuration(TOTAL_HACKATHON_DURATION_MS - elapsedMs);
    return {
      status: 'round_2',
      roundLabel: 'ROUND 2',
      statusLabel: '● LIVE',
      badgeLabel: '● LIVE',
      message: 'TIME REMAINING',
      timeRemainingMs,
      totalDurationMs: TOTAL_HACKATHON_DURATION_MS,
      progress: Math.min(100, (elapsedMs / TOTAL_HACKATHON_DURATION_MS) * 100),
      startedAtMs: safeStart,
      elapsedMs,
    };
  }

  return {
    status: 'completed',
    roundLabel: 'HACKATHON COMPLETED',
    statusLabel: '✓ HACKATHON COMPLETED',
    badgeLabel: '✓ HACKATHON COMPLETED',
    message: '00:00:00',
    timeRemainingMs: 0,
    totalDurationMs: TOTAL_HACKATHON_DURATION_MS,
    progress: 100,
    startedAtMs: safeStart,
    elapsedMs: TOTAL_HACKATHON_DURATION_MS,
  };
}
