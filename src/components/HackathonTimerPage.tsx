import React, { useEffect, useMemo, useRef, useState } from 'react';
import backgroundImage from '../assets/branding/anvation-2026-poster.png';
import backgroundLogo from '../assets/branding/anvation-navbar-logo.png';
import collegeLogo from '../assets/branding/college_logo_transparent.png';
import anvationEmblem from '../assets/branding/Anvation_emblem.png';
import {
  clearHackathonStartTime,
  formatCountdown,
  getHackathonTimerState,
  getStoredHackathonStartTime,
  saveHackathonStartTime,
  TOTAL_HACKATHON_DURATION_MS,
} from '../utils/hackathonTimer';

export const HackathonTimerPage: React.FC = () => {
  const [nowMs, setNowMs] = useState(Date.now());
  const [startedAt, setStartedAt] = useState<number | null>(() => getStoredHackathonStartTime());
  const [isTabHidden, setIsTabHidden] = useState(false);
  const [floatingClockError, setFloatingClockError] = useState<string | null>(null);
  const pipWindowRef = useRef<Window | null>(null);
  const pipCleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const syncNow = () => {
      setNowMs(Date.now());
      setStartedAt(getStoredHackathonStartTime());
    };

    const updateTabState = () => {
      setIsTabHidden(document.visibilityState === 'hidden');
      if (document.visibilityState === 'visible') {
        syncNow();
      }
    };

    const intervalId = window.setInterval(() => {
      syncNow();
    }, 1000);

    const handleVisibilityChange = () => {
      updateTabState();
    };

    const handleFocus = () => syncNow();

    updateTabState();
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('pageshow', handleFocus);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('pageshow', handleFocus);
    };
  }, []);

  useEffect(() => {
    setStartedAt(getStoredHackathonStartTime());
  }, [nowMs]);

  const devResetEnabled = import.meta.env.VITE_TIMER_TEST_MODE === 'true';

  const timer = useMemo(
    () => getHackathonTimerState(startedAt, nowMs),
    [startedAt, nowMs],
  );

  const countdownValue = useMemo(() => formatCountdown(timer.timeRemainingMs), [timer.timeRemainingMs]);
  const totalClockValue = useMemo(() => formatCountdown(TOTAL_HACKATHON_DURATION_MS - timer.elapsedMs), [timer.elapsedMs]);
  const progressPct = Math.min(100, Math.max(0, timer.progress || 0));
  const isLive = timer.status === 'round_1' || timer.status === 'round_2';

  const pipRoundLabel = timer.status === 'completed'
    ? 'HACKATHON COMPLETED'
    : timer.status === 'before_start'
      ? 'HACKATHON READY'
      : timer.roundLabel === 'ROUND 1'
        ? 'ROUND 1 — THINK + PROVE'
        : 'ROUND 2 — BUILD + DEPLOY';

  useEffect(() => {
    const previousTitle = document.title;
    const nextTitle = timer.status === 'completed'
      ? 'Hackathon Completed'
      : `${countdownValue} • ANVATION 2026`;

    document.title = nextTitle;

    return () => {
      document.title = previousTitle;
    };
  }, [countdownValue, timer.status]);

  useEffect(() => {
    syncFloatingTimerWindow();
  }, [countdownValue, totalClockValue, timer.status, timer.roundLabel]);

  const minimizedBadgeText = timer.status === 'completed'
    ? 'COMPLETED'
    : timer.status === 'before_start'
      ? 'READY'
      : 'LIVE';

  const syncFloatingTimerWindow = () => {
    const pipWindow = pipWindowRef.current;
    if (!pipWindow || !pipWindow.document || !pipWindow.document.body) {
      return;
    }

    const pipBody = pipWindow.document.body;
    const timeNode = pipBody.querySelector('[data-role="pip-time"]');
    const totalTimeNode = pipBody.querySelector('[data-role="pip-total-time"]');
    const roundNode = pipBody.querySelector('[data-role="pip-round"]');
    const statusNode = pipBody.querySelector('[data-role="pip-status"]');

    if (timeNode) {
      timeNode.textContent = countdownValue;
    }

    if (totalTimeNode) {
      totalTimeNode.textContent = totalClockValue;
    }

    if (roundNode) {
      roundNode.textContent = pipRoundLabel;
    }

    if (statusNode) {
      statusNode.textContent = timer.status === 'completed' ? 'COMPLETED' : timer.status === 'before_start' ? 'READY' : 'LIVE';
    }
  };

  const openFloatingClock = async () => {
    const pipApi = (window as Window & { documentPictureInPicture?: { requestWindow: (options?: { width?: number; height?: number }) => Promise<Window> } }).documentPictureInPicture;

    if (!pipApi || typeof pipApi.requestWindow !== 'function') {
      setFloatingClockError('Floating Clock is not supported in this browser. Please use the latest Google Chrome or a supported browser.');
      return;
    }

    if (pipWindowRef.current && !pipWindowRef.current.closed) {
      pipWindowRef.current.focus();
      return;
    }

    try {
      const pipWindow = await pipApi.requestWindow({ width: 360, height: 230 });
      pipWindowRef.current = pipWindow;
      setFloatingClockError(null);

      const cleanup = () => {
        pipWindowRef.current = null;
        if (pipCleanupRef.current) {
          pipCleanupRef.current = null;
        }
      };

      pipCleanupRef.current = cleanup;
      pipWindow.document.title = 'ANVATION 2026 Timer';
      pipWindow.document.body.innerHTML = `
        <div style="margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:linear-gradient(180deg, rgba(6,10,22,0.96), rgba(8,11,29,0.92));color:#eaf8ff;font-family:Inter,Segoe UI,sans-serif;overflow:hidden;">
          <div style="width:100%;max-width:360px;padding:16px 18px;border:1px solid rgba(78,204,255,0.48);border-radius:18px;background:rgba(15,23,42,0.72);box-shadow:0 0 28px rgba(34,211,238,0.17),0 0 18px rgba(168,85,247,0.12);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);text-align:center;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
              <div style="font-size:10px;font-weight:800;letter-spacing:0.35em;color:#8fe7ff;text-transform:uppercase;opacity:0.85;">ANVATION 2026</div>
              <button id="pip-close" type="button" style="border:1px solid rgba(148,163,184,0.5);background:rgba(15,23,42,0.5);color:#e2e8f0;border-radius:999px;padding:6px 10px;font-size:11px;font-weight:700;cursor:pointer;">Close</button>
            </div>

            <div style="margin-bottom:10px;padding:8px 10px;border-radius:12px;border:1px solid rgba(94,234,212,0.25);background:rgba(15,118,110,0.08);">
              <div style="font-size:9px;font-weight:800;letter-spacing:0.35em;color:#8fe7ff;text-transform:uppercase;opacity:0.8;">24H CLOCK</div>
              <div data-role="pip-total-time" style="margin-top:4px;font-size:24px;line-height:1.1;font-weight:900;letter-spacing:-0.06em;color:#f8fbff;text-shadow:0 0 18px rgba(34,211,238,0.65);">${totalClockValue}</div>
            </div>

            <div data-role="pip-time" style="font-size:38px;line-height:1.1;font-weight:900;letter-spacing:-0.06em;color:#f8fbff;text-shadow:0 0 18px rgba(34,211,238,0.65);">${countdownValue}</div>
            <div data-role="pip-status" style="margin-top:10px;font-size:10px;letter-spacing:0.4em;text-transform:uppercase;color:#8fe7ff;font-weight:800;">LIVE</div>
            <div data-role="pip-round" style="margin-top:12px;font-size:12px;letter-spacing:0.14em;text-transform:uppercase;color:#dbeafe;font-weight:700;">${pipRoundLabel}</div>
          </div>
        </div>
      `;

      const closeButton = pipWindow.document.getElementById('pip-close');
      closeButton?.addEventListener('click', () => {
        pipWindow.close();
      });

      pipWindow.addEventListener('pagehide', () => {
        cleanup();
      });

      syncFloatingTimerWindow();
    } catch {
      setFloatingClockError('Floating Clock is not supported in this browser. Please use the latest Google Chrome or a supported browser.');
    }
  };

  const startHackathon = async () => {
    const startTime = Date.now();
    saveHackathonStartTime(startTime);
    setStartedAt(startTime);
  };

  const resetHackathon = () => {
    clearHackathonStartTime();
    setStartedAt(null);
  };

  const timerStatusText = timer.status === 'before_start'
    ? 'HACKATHON READY'
    : timer.status === 'completed'
      ? '✓ HACKATHON COMPLETED'
      : '● HACKATHON LIVE';

  return (
    <div
      className="relative min-h-screen overflow-hidden bg-[#020b17] text-white isolate"
      style={{
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center center',
        backgroundSize: 'contain',
        backgroundColor: '#020b17',
      }}
    >
      <div className="absolute inset-0 z-0 bg-[#020b17]/40" />
      <div className="absolute inset-0 z-[1] bg-[radial-gradient(circle_at_center,rgba(2,6,23,0.04),rgba(2,6,23,0.20),rgba(2,6,23,0.56))]" />
      <div className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center opacity-25" aria-hidden="true">
        <img
          src={backgroundLogo}
          alt=""
          className="h-[70vmin] w-[70vmin] max-h-[820px] max-w-[820px] object-contain drop-shadow-[0_0_45px_rgba(96,165,250,0.38)]"
        />
      </div>

      {isTabHidden && (
        <div className="pointer-events-none fixed bottom-4 right-4 z-50 rounded-2xl border border-cyan-300/40 bg-slate-950/80 px-4 py-3 shadow-[0_0_24px_rgba(34,211,238,0.18)] backdrop-blur-md">
          <div className="flex items-center gap-3">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.9)]" />
            <div>
              <div className="text-[9px] font-black uppercase tracking-[0.3em] text-cyan-200/80">ANVATION</div>
              <div className="text-lg font-black tracking-[-0.06em] text-white">{countdownValue}</div>
            </div>
          </div>
          <div className="mt-1 text-[8px] font-black uppercase tracking-[0.28em] text-slate-200/75">{minimizedBadgeText}</div>
        </div>
      )}

      <div className="relative z-10 mx-auto flex min-h-screen max-w-[1700px] flex-col px-4 pb-10 pt-4 sm:px-6 lg:px-10">
        <header className="relative z-10 mt-2 flex items-start justify-between gap-6 px-2 text-white/95">
          <div className="flex-1 text-left">
            <div className="flex items-center gap-3 sm:gap-4">
              <img
                src={collegeLogo}
                alt="College logo"
                className="h-[4.25rem] w-auto object-contain drop-shadow-[0_0_18px_rgba(96,165,250,0.35)] sm:h-[5.25rem] lg:h-[6.5rem]"
              />
              <img
                src={anvationEmblem}
                alt="Anvation emblem"
                className="h-[3.2rem] w-auto object-contain drop-shadow-[0_0_18px_rgba(34,211,238,0.4)] sm:h-[4rem] lg:h-[5rem]"
              />
            </div>
          </div>

          <div className="flex-shrink-0 text-center">
            <img
              src={backgroundLogo}
              alt="Anvation logo"
              className="mx-auto h-[4.5rem] w-auto object-contain drop-shadow-[0_0_28px_rgba(96,165,250,0.76)] sm:h-[6.25rem] lg:h-[8.25rem]"
            />
            <div className="mt-1 text-[0.72rem] font-black uppercase tracking-[0.55em] text-cyan-100 drop-shadow-[0_0_12px_rgba(34,211,238,0.5)] sm:text-sm lg:text-base">
              HACKATHON 2026
            </div>
            <div className="mt-2 text-[0.62rem] font-semibold uppercase tracking-[0.45em] text-cyan-100/90 sm:text-xs lg:text-sm">
              EXPLORE • INNOVATE • TRANSFORM
            </div>
            <div className="mt-4 rounded-full border border-cyan-300/60 bg-slate-950/20 px-4 py-2 text-[0.58rem] font-black uppercase tracking-[0.25em] text-cyan-100 shadow-[0_0_18px_rgba(34,211,238,0.18)]">
              COLLABORATION • PYGENIC ARC
            </div>
          </div>

          <div className="flex flex-1 flex-col items-end justify-start text-right">
            <div className="text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-white sm:text-[0.9rem] lg:text-[1.05rem]">
              DEPARTMENT OF
            </div>
            <div className="mt-1 text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-white sm:text-[0.9rem] lg:text-[1.05rem]">
              COMPUTER SCIENCE & ENGINEERING
            </div>
            <div className="mt-3 text-[0.55rem] font-semibold uppercase tracking-[0.2em] text-cyan-100/80 sm:text-[0.65rem]">
              IN ASSOCIATION WITH
            </div>
            <div className="mt-2 flex gap-2">
              <div className="rounded-xl border border-cyan-300/60 bg-cyan-500/10 px-3 py-1 text-[0.58rem] font-black uppercase tracking-[0.12em] text-cyan-100 shadow-[0_0_16px_rgba(34,211,238,0.2)] sm:text-xs">
                AI&DS
              </div>
              <div className="rounded-xl border border-cyan-300/60 bg-cyan-500/10 px-3 py-1 text-[0.58rem] font-black uppercase tracking-[0.12em] text-cyan-100 shadow-[0_0_16px_rgba(34,211,238,0.2)] sm:text-xs">
                CSBS
              </div>
            </div>
          </div>
        </header>

        <div className="relative z-10 mt-2 flex flex-1 flex-col items-center justify-center">
          <div className="mb-4 inline-flex items-center justify-center rounded-full border border-cyan-300/60 bg-slate-950/20 px-5 py-2 backdrop-blur-sm shadow-[0_0_18px_rgba(34,211,238,0.2)]">
            <span className="text-[0.7rem] font-black uppercase tracking-[0.35em] text-cyan-100 sm:text-xs">
              24-HOUR HACKATHON LIVE
            </span>
          </div>

          <div className="w-full max-w-[1200px] rounded-[32px] border border-cyan-400/40 bg-[rgba(6,15,28,0.64)] px-6 py-5 shadow-[0_0_35px_rgba(34,211,238,0.15),0_0_55px_rgba(168,85,247,0.12)] backdrop-blur-md sm:px-8 lg:px-10">
            <div className="mb-4 flex items-center justify-center">
              <div className="inline-flex items-center gap-3 rounded-full border border-cyan-300/40 bg-slate-950/25 px-4 py-2 shadow-[0_0_18px_rgba(34,211,238,0.15)]">
                <span className="text-[0.6rem] font-black uppercase tracking-[0.35em] text-cyan-100 sm:text-[0.7rem]">
                  24H COUNTDOWN
                </span>
                <span className="text-lg font-black tracking-[-0.06em] text-white drop-shadow-[0_0_18px_rgba(34,211,238,0.8)] sm:text-2xl">
                  {totalClockValue}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <button
                type="button"
                onClick={openFloatingClock}
                className="inline-flex items-center justify-center gap-2 self-center rounded-full border border-cyan-300/60 bg-slate-900/45 px-4 py-2 text-[0.65rem] font-black uppercase tracking-[0.2em] text-cyan-100 shadow-[0_0_18px_rgba(34,211,238,0.18)] transition hover:bg-slate-800/70 focus:outline-none focus:ring-2 focus:ring-cyan-300/60"
              >
                <span>↗</span>
                <span>FLOAT CLOCK</span>
              </button>
            </div>

            <div className="mt-6 flex flex-col items-center justify-center">
              <div className="flex items-end justify-center gap-3 sm:gap-4 lg:gap-5">
                {[countdownValue.split(':')[0], countdownValue.split(':')[1], countdownValue.split(':')[2]].map((value, index, values) => (
                  <React.Fragment key={index}>
                    <div className="rounded-2xl border border-cyan-300/40 bg-[rgba(8,21,35,0.72)] px-3 py-3 shadow-[inset_0_0_18px_rgba(34,211,238,0.12),0_0_18px_rgba(34,211,238,0.08)] sm:px-4 lg:px-5">
                      <div className="text-[2.3rem] font-black leading-none tracking-[-0.06em] text-white drop-shadow-[0_0_20px_rgba(34,211,238,0.8)] sm:text-[3.7rem] lg:text-[5.5rem]">
                        {value}
                      </div>
                    </div>
                    {index < values.length - 1 && (
                      <span className="pb-4 text-[2.2rem] font-black text-cyan-200 drop-shadow-[0_0_18px_rgba(34,211,238,0.6)] sm:text-[3.2rem] lg:text-[5rem]">:</span>
                    )}
                  </React.Fragment>
                ))}
              </div>

              <div className="mt-4 flex w-full max-w-[760px] items-center justify-between gap-4 text-center text-[0.52rem] font-black uppercase tracking-[0.25em] text-cyan-100/85 sm:text-[0.62rem] lg:text-[0.7rem]">
                <span>HOURS</span>
                <span>MINUTES</span>
                <span>SECONDS</span>
              </div>

              <div className="mt-5 text-center text-[0.8rem] font-black uppercase tracking-[0.18em] text-amber-300 sm:text-base lg:text-xl" style={{ textShadow: '0 0 14px rgba(251,191,36,0.7)' }}>
                {timer.roundLabel === 'ROUND 1' ? 'ROUND 1 — THINK + PROVE' : 'ROUND 2 — BUILD + DEPLOY'}
              </div>

              <div className="mt-2 text-center text-[0.56rem] font-semibold uppercase tracking-[0.32em] text-cyan-100/80 sm:text-[0.66rem] lg:text-xs">
                {timer.status === 'completed' ? 'HACKATHON COMPLETED' : timer.roundLabel === 'ROUND 1' ? 'ENDS AT 01:30 PM (4 HOURS)' : 'ROUND 2 IN PROGRESS'}
              </div>
            </div>

            <div className="mt-6">
              <div className="mb-2 flex items-center justify-between text-[0.55rem] font-black uppercase tracking-[0.28em] text-cyan-100/85 sm:text-[0.65rem]">
                <span>0%</span>
                <span>24H PROGRESS</span>
                <span>100%</span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full border border-cyan-300/30 bg-slate-900/45 shadow-[inset_0_0_12px_rgba(34,211,238,0.08)]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-400 via-cyan-400 to-violet-500 shadow-[0_0_16px_rgba(34,211,238,0.55)] transition-all duration-700 ease-linear"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          </div>

          <div className="mt-7 flex w-full max-w-[1200px] flex-col gap-4 lg:flex-row lg:items-stretch lg:justify-center">
            <div className="flex-1 rounded-[24px] border border-amber-400/60 bg-[rgba(14,15,18,0.52)] px-5 py-4 shadow-[0_0_20px_rgba(251,191,36,0.15)] backdrop-blur-sm">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border border-amber-300/60 bg-amber-500/10 text-xl text-amber-200 shadow-[0_0_16px_rgba(251,191,36,0.2)]">💡</div>
                  <div className="text-left">
                    <div className="text-[0.58rem] font-black uppercase tracking-[0.22em] text-amber-200">ROUND 1</div>
                    <div className="mt-1 text-[0.92rem] font-bold text-white">09:30 AM — 01:30 PM</div>
                  </div>
                </div>
                <div className="text-[0.66rem] font-black uppercase tracking-[0.18em] text-amber-200">4 HOURS</div>
              </div>
              <div className="mt-3 text-center text-[0.9rem] font-black uppercase tracking-[0.16em] text-amber-100">THINK + PROVE</div>
            </div>

            <div className="flex-1 rounded-[24px] border border-cyan-300/60 bg-[rgba(12,16,28,0.52)] px-5 py-4 shadow-[0_0_20px_rgba(34,211,238,0.15)] backdrop-blur-sm">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border border-cyan-300/60 bg-cyan-500/10 text-xl text-cyan-200 shadow-[0_0_16px_rgba(34,211,238,0.2)]">⚙</div>
                  <div className="text-left">
                    <div className="text-[0.58rem] font-black uppercase tracking-[0.22em] text-cyan-200">ROUND 2</div>
                    <div className="mt-1 text-[0.92rem] font-bold text-white">01:30 PM — 09:30 AM</div>
                  </div>
                </div>
                <div className="text-[0.66rem] font-black uppercase tracking-[0.18em] text-cyan-200">20 HOURS</div>
              </div>
              <div className="mt-3 text-center text-[0.9rem] font-black uppercase tracking-[0.16em] text-cyan-100">BUILD + DEPLOY</div>
            </div>

            <div className="flex-1 rounded-[24px] border border-violet-300/60 bg-[rgba(18,12,26,0.55)] px-5 py-4 shadow-[0_0_20px_rgba(168,85,247,0.18)] backdrop-blur-sm">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border border-violet-300/60 bg-violet-500/10 text-xl text-violet-200 shadow-[0_0_16px_rgba(168,85,247,0.2)]">🏆</div>
                  <div className="text-left">
                    <div className="text-[0.58rem] font-black uppercase tracking-[0.22em] text-violet-200">TOTAL</div>
                    <div className="mt-1 text-[0.92rem] font-bold text-white">24 HOURS</div>
                  </div>
                </div>
                <div className="text-[0.66rem] font-black uppercase tracking-[0.18em] text-violet-200">24H</div>
              </div>
              <div className="mt-3 text-center text-[0.9rem] font-black uppercase tracking-[0.16em] text-violet-100">INNOVATE TO IMPACT</div>
            </div>
          </div>

          {timer.status === 'before_start' && (
            <div className="mt-8 flex flex-col items-center justify-center gap-3">
              <button
                type="button"
                onClick={startHackathon}
                className="inline-flex items-center justify-center rounded-full border border-cyan-300/60 bg-cyan-500/10 px-7 py-3 text-sm font-black uppercase tracking-[0.22em] text-cyan-50 shadow-[0_0_18px_rgba(34,211,238,0.28)] transition-transform hover:scale-[1.02] hover:bg-cyan-500/15 focus:outline-none focus:ring-2 focus:ring-cyan-300/70 sm:px-9 sm:py-4 sm:text-base"
              >
                START HACKATHON
              </button>
            </div>
          )}

          {floatingClockError && (
            <div className="mt-4 rounded-2xl border border-amber-300/40 bg-amber-500/10 px-4 py-3 text-center text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-100">
              {floatingClockError}
            </div>
          )}

          {devResetEnabled && (
            <div className="mt-6 flex justify-center">
              <button
                type="button"
                onClick={resetHackathon}
                className="inline-flex items-center justify-center rounded-full border border-rose-500/50 bg-rose-500/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.28em] text-rose-100 shadow-[0_0_14px_rgba(244,63,94,0.2)] transition hover:bg-rose-500/15 focus:outline-none focus:ring-2 focus:ring-rose-400/60"
              >
                DEV MODE ONLY • RESET TIMER
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
