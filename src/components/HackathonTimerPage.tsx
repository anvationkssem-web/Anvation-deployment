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

const detectFullscreenMode = () => (
  document.fullscreenElement !== null
  || window.matchMedia('(display-mode: fullscreen)').matches
  || window.screen.height - window.innerHeight <= 80
);

export const HackathonTimerPage: React.FC = () => {
  const [isFullscreenMode, setIsFullscreenMode] = useState(detectFullscreenMode);
  const [nowMs, setNowMs] = useState(Date.now());
  const [startedAt, setStartedAt] = useState<number | null>(() => getStoredHackathonStartTime());
  const [isTabHidden, setIsTabHidden] = useState(false);
  const [floatingClockError, setFloatingClockError] = useState<string | null>(null);
  const pipWindowRef = useRef<Window | null>(null);
  const pipCleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const syncFullscreenMode = () => setIsFullscreenMode(detectFullscreenMode());
    document.addEventListener('fullscreenchange', syncFullscreenMode);
    window.addEventListener('resize', syncFullscreenMode);

    return () => {
      document.removeEventListener('fullscreenchange', syncFullscreenMode);
      window.removeEventListener('resize', syncFullscreenMode);
    };
  }, []);

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
  }, [countdownValue, totalClockValue, timer.status, timer.roundLabel, progressPct]);

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
    const progressNode = pipBody.querySelector<HTMLElement>('[data-role="pip-progress"]');
    const progressValueNode = pipBody.querySelector('[data-role="pip-progress-value"]');

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

    if (progressNode) {
      progressNode.style.width = `${progressPct}%`;
    }

    if (progressValueNode) {
      progressValueNode.textContent = `${Math.round(progressPct)}%`;
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
      const pipWindow = await pipApi.requestWindow({ width: 640, height: 360 });
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
      pipWindow.document.documentElement.style.cssText = 'width:100%;height:100%;margin:0;overflow:hidden;';
      pipWindow.document.body.style.cssText = 'width:100%;height:100%;margin:0;overflow:hidden;';
      pipWindow.document.body.innerHTML = `
        <div style="box-sizing:border-box;position:fixed;inset:0;width:100%;height:100%;padding:14px;background:linear-gradient(180deg,#06101d,#080b1d);color:#eaf8ff;font-family:Inter,Segoe UI,sans-serif;overflow:hidden;">
          <div style="box-sizing:border-box;width:100%;height:100%;padding:18px 22px;border:1px solid rgba(78,204,255,0.48);border-radius:18px;background:rgba(15,23,42,0.72);box-shadow:0 0 28px rgba(34,211,238,0.17),0 0 18px rgba(168,85,247,0.12);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);display:flex;flex-direction:column;justify-content:space-between;overflow:hidden;">
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <div style="font-size:12px;font-weight:900;letter-spacing:0.28em;color:#8fe7ff;text-transform:uppercase;">ANVATION 2026</div>
              <div data-role="pip-status" style="font-size:11px;letter-spacing:0.25em;text-transform:uppercase;color:#8fe7ff;font-weight:900;">LIVE</div>
            </div>

            <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">
              <div style="min-width:0;padding:12px 16px;border-radius:14px;border:1px solid rgba(94,234,212,0.3);background:rgba(15,118,110,0.08);text-align:center;">
                <div style="font-size:10px;font-weight:800;letter-spacing:0.26em;color:#8fe7ff;text-transform:uppercase;opacity:0.85;">24H TIME LEFT</div>
                <div data-role="pip-total-time" style="margin-top:4px;font-size:clamp(26px,5vw,38px);line-height:1.1;font-weight:900;letter-spacing:-0.06em;color:#f8fbff;text-shadow:0 0 18px rgba(34,211,238,0.65);">${totalClockValue}</div>
              </div>
              <div style="min-width:0;padding:12px 16px;border-radius:14px;border:1px solid rgba(78,204,255,0.3);background:rgba(8,21,35,0.72);text-align:center;">
                <div style="font-size:10px;font-weight:800;letter-spacing:0.26em;color:#8fe7ff;text-transform:uppercase;opacity:0.85;">ROUND COUNTDOWN</div>
                <div data-role="pip-time" style="margin-top:4px;font-size:clamp(26px,5vw,38px);line-height:1.1;font-weight:900;letter-spacing:-0.06em;color:#f8fbff;text-shadow:0 0 18px rgba(34,211,238,0.65);">${countdownValue}</div>
              </div>
            </div>

            <div style="display:flex;align-items:center;justify-content:space-between;gap:16px;">
              <div data-role="pip-round" style="font-size:13px;letter-spacing:0.16em;text-transform:uppercase;color:#dbeafe;font-weight:800;">${pipRoundLabel}</div>
              <div style="font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:#9eeeff;font-weight:800;">24H PROGRESS <span data-role="pip-progress-value">${Math.round(progressPct)}%</span></div>
            </div>
            <div style="height:10px;flex:none;overflow:hidden;border:1px solid rgba(94,234,212,0.3);border-radius:999px;background:rgba(15,23,42,0.9);">
              <div data-role="pip-progress" style="width:${progressPct}%;height:100%;border-radius:999px;background:linear-gradient(90deg,#fbbf24,#22d3ee,#8b5cf6);box-shadow:0 0 14px rgba(34,211,238,0.65);transition:width 0.7s linear;"></div>
            </div>
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
      className={`hackathon-timer-page relative min-h-0 overflow-x-hidden bg-[#020b17] text-white isolate ${isFullscreenMode ? 'h-dvh overflow-y-hidden is-fullscreen' : 'min-h-dvh overflow-y-auto'}`}
      style={{
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center center',
        backgroundSize: 'contain',
        backgroundColor: '#020b17',
      }}
    >
      <style>{`
        @media (max-height: 560px) {
          .hackathon-timer-page.is-fullscreen .timer-page-header { margin-top: 0; }
          .hackathon-timer-page.is-fullscreen .timer-page-brand-logo { height: min(calc(9dvh + 2px), calc(3.25rem + 2px)); }
          .hackathon-timer-page.is-fullscreen .timer-page-tagline { margin-top: 0; font-size: clamp(0.62rem, 2.1dvh, 0.9rem); }
          .hackathon-timer-page.is-fullscreen .timer-page-collaboration { margin-top: 0.75dvh; padding-block: 0.5dvh; font-size: clamp(0.75rem, 2.2dvh, 1.05rem); }
          .hackathon-timer-page.is-fullscreen .timer-page-layout { padding-top: 0.75dvh; padding-bottom: 0.75dvh; }
          .hackathon-timer-page.is-fullscreen .timer-page-content { margin-top: 0; gap: 0.75dvh; }
          .hackathon-timer-page.is-fullscreen .timer-page-card { padding-block: 1dvh; }
          .hackathon-timer-page.is-fullscreen .timer-page-total-clock { padding-block: 0.5dvh; }
          .hackathon-timer-page.is-fullscreen .timer-page-round-clock { margin-top: 0; }
          .hackathon-timer-page.is-fullscreen .timer-page-digit { font-size: clamp(1.6rem, 9dvh, 3rem); }
          .hackathon-timer-page.is-fullscreen .timer-page-colon { padding-bottom: 1.5dvh; font-size: clamp(1.5rem, 8dvh, 2.8rem); }
          .hackathon-timer-page.is-fullscreen .timer-page-units { margin-top: 0.75dvh; }
          .hackathon-timer-page.is-fullscreen .timer-page-round-label { margin-top: 1dvh; font-size: clamp(0.7rem, 2.5dvh, 1.1rem); }
          .hackathon-timer-page.is-fullscreen .timer-page-round-caption { margin-top: 0.4dvh; font-size: clamp(0.45rem, 1.6dvh, 0.75rem); }
          .hackathon-timer-page.is-fullscreen .timer-page-progress { margin-top: 1dvh; }
          .hackathon-timer-page.is-fullscreen .timer-page-round-cards { margin-top: 1dvh; gap: 1dvh; }
          .hackathon-timer-page.is-fullscreen .timer-page-round-card { padding-block: 1dvh; }
          .hackathon-timer-page.is-fullscreen .timer-page-start { margin-top: 1dvh; }
        }
      `}</style>
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

      <div className={`timer-page-layout relative z-10 mx-auto flex max-w-[1700px] flex-col px-2 pb-2 pt-2 sm:px-4 sm:pb-3 sm:pt-3 lg:px-8 ${isFullscreenMode ? 'h-full min-h-0' : 'min-h-dvh'}`}>
        <header className="timer-page-header relative z-10 mt-0 flex shrink-0 items-start justify-between gap-2 px-1 text-white/95 sm:mt-1 sm:gap-4 sm:px-2">
          <div className="flex-1 text-left">
            <div className="flex items-center gap-1.5 sm:gap-3">
              <img
                src={collegeLogo}
                alt="College logo"
                className="h-9 w-auto object-contain drop-shadow-[0_0_18px_rgba(96,165,250,0.35)] sm:h-12 lg:h-[min(4rem,10dvh)]"
              />
              <img
                src={anvationEmblem}
                alt="Anvation emblem"
                className="h-7 w-auto object-contain drop-shadow-[0_0_18px_rgba(34,211,238,0.4)] sm:h-10 lg:h-[min(3.5rem,9dvh)]"
              />
            </div>
          </div>

          <div className="flex-shrink-0 text-center">
            <img
              src={backgroundLogo}
              alt="Anvation logo"
              className="timer-page-brand-logo mx-auto h-[calc(2.75rem+2px)] w-auto object-contain drop-shadow-[0_0_28px_rgba(96,165,250,0.76)] sm:h-[calc(3.75rem+2px)] lg:h-[min(calc(5rem+2px),calc(12dvh+2px))]"
            />
            <div className="timer-page-tagline mt-0 text-[0.6rem] font-bold uppercase tracking-[0.2em] text-cyan-100/90 sm:text-[0.8rem] lg:text-[0.9rem]">
              EXPLORE • INNOVATE • TRANSFORM
            </div>
            <div className="timer-page-collaboration mt-2 rounded-full border border-cyan-300/60 bg-slate-950/20 px-2 py-1 text-[0.72rem] font-black uppercase tracking-[0.12em] text-cyan-100 shadow-[0_0_18px_rgba(34,211,238,0.18)] sm:px-3 sm:text-[0.9rem] sm:tracking-[0.2em]">
              COLLABORATION • PYGENIC ARC
            </div>
          </div>

          <div className="flex flex-1 flex-col items-end justify-start text-right">
            <div className="text-[0.48rem] font-semibold uppercase tracking-[0.04em] text-white sm:text-[0.7rem] lg:text-[0.9rem]">
              DEPT. OF  COMPUTER SCIENCE & ENGINEERING
            </div>
            <div className="mt-1.5 text-[0.4rem] font-semibold uppercase tracking-[0.12em] text-cyan-100/80 sm:text-[0.55rem]">
              IN ASSOCIATION WITH
            </div>
            <div className="mt-1 flex gap-1 sm:gap-2">
              <div className="rounded-lg border border-cyan-300/60 bg-cyan-500/10 px-1.5 py-0.5 text-[0.45rem] font-black uppercase tracking-[0.06em] text-cyan-100 shadow-[0_0_16px_rgba(34,211,238,0.2)] sm:px-2 sm:text-[0.65rem]">
                AI&DS
              </div>
              <div className="rounded-lg border border-cyan-300/60 bg-cyan-500/10 px-1.5 py-0.5 text-[0.45rem] font-black uppercase tracking-[0.06em] text-cyan-100 shadow-[0_0_16px_rgba(34,211,238,0.2)] sm:px-2 sm:text-[0.65rem]">
                CSBS
              </div>
            </div>
          </div>
        </header>

        <div className="timer-page-content relative z-10 mt-1 flex min-h-0 flex-1 flex-col items-center justify-evenly gap-2">
          <div className="timer-page-card relative w-full max-w-[1200px] shrink-0 rounded-[24px] border border-cyan-400/40 bg-[rgba(6,15,28,0.64)] px-3 py-[clamp(0.45rem,1.6dvh,0.75rem)] shadow-[0_0_35px_rgba(34,211,238,0.15),0_0_55px_rgba(168,85,247,0.12)] backdrop-blur-md sm:rounded-[28px] sm:px-6 sm:py-[clamp(0.6rem,1.8dvh,1rem)] lg:px-8">
            <div className="mb-0 flex items-center justify-center">
              <div className="timer-page-total-clock inline-flex items-center gap-2 rounded-full border border-cyan-300/40 bg-slate-950/25 px-3 py-1 shadow-[0_0_18px_rgba(34,211,238,0.15)] sm:gap-3 sm:px-4 sm:py-1.5">
                <span className="text-[0.8rem] font-black uppercase tracking-[0.35em] text-cyan-100 sm:text-[0.9rem]">
                  24H COUNTDOWN
                </span>
                <span className="text-[1.625rem] font-black tracking-[-0.06em] text-white drop-shadow-[0_0_18px_rgba(34,211,238,0.8)] sm:text-[2rem]">
                  {totalClockValue}
                </span>
              </div>
            </div>

            <div className="absolute right-2 top-2 z-10 sm:right-3 sm:top-3">
              <button
                type="button"
                onClick={openFloatingClock}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-cyan-300/60 bg-slate-900/45 px-2.5 py-1 text-[0.58rem] font-black uppercase tracking-[0.16em] text-cyan-100 shadow-[0_0_18px_rgba(34,211,238,0.18)] transition hover:bg-slate-800/70 focus:outline-none focus:ring-2 focus:ring-cyan-300/60 sm:px-4 sm:py-1.5 sm:text-[0.65rem]"
              >
                <span>↗</span>
                <span className="hidden sm:inline">FLOAT CLOCK</span>
              </button>
            </div>

            <div className="timer-page-round-clock mt-0 flex flex-col items-center justify-center">
              <div className="flex items-end justify-center gap-2 sm:gap-4 lg:gap-5">
                {[countdownValue.split(':')[0], countdownValue.split(':')[1], countdownValue.split(':')[2]].map((value, index, values) => (
                  <React.Fragment key={index}>
                    <div className="rounded-xl border border-cyan-300/40 bg-[rgba(8,21,35,0.72)] px-2 py-2 shadow-[inset_0_0_18px_rgba(34,211,238,0.12),0_0_18px_rgba(34,211,238,0.08)] sm:rounded-2xl sm:px-4 sm:py-3 lg:px-5">
                      <div className="timer-page-digit text-[2rem] font-black leading-none tracking-[-0.06em] text-white drop-shadow-[0_0_20px_rgba(34,211,238,0.8)] sm:text-[3.4rem] lg:text-[clamp(2rem,12dvh,5.3rem)]">
                        {value}
                      </div>
                    </div>
                    {index < values.length - 1 && (
                      <span className="timer-page-colon pb-3 text-[2rem] font-black text-cyan-200 drop-shadow-[0_0_18px_rgba(34,211,238,0.6)] sm:pb-4 sm:text-[3.35rem] lg:text-[clamp(2rem,11dvh,5.15rem)]">:</span>
                    )}
                  </React.Fragment>
                ))}
              </div>

              <div className="timer-page-units mt-2 flex w-full max-w-[760px] items-center justify-between gap-2 text-center text-[0.55rem] font-black uppercase tracking-[0.18em] text-cyan-100/85 sm:mt-3 sm:gap-4 sm:text-[0.72rem] lg:text-[0.8rem]">
                <span>HOURS</span>
                <span>MINUTES</span>
                <span>SECONDS</span>
              </div>

              <div className="timer-page-round-label mt-3 text-center text-[0.75rem] font-black uppercase tracking-[0.12em] text-amber-300 sm:mt-4 sm:text-[1.125rem] lg:text-[1.375rem]" style={{ textShadow: '0 0 14px rgba(251,191,36,0.7)' }}>
                {timer.status === 'before_start' || timer.roundLabel === 'ROUND 1' ? 'ROUND 1 — THINK + PROVE' : 'ROUND 2 — BUILD + DEPLOY'}
              </div>

              <div className="timer-page-round-caption mt-1 text-center text-[0.48rem] font-semibold uppercase tracking-[0.2em] text-cyan-100/80 sm:text-[0.66rem] lg:text-xs">
                {timer.status === 'completed' ? 'HACKATHON COMPLETED' : timer.status === 'before_start' ? 'ROUND 1 READY TO START' : timer.roundLabel === 'ROUND 1' ? 'ENDS AT 01:30 PM (4 HOURS)' : 'ROUND 2 IN PROGRESS'}
              </div>
            </div>

            <div className="timer-page-progress mt-3 sm:mt-4">
              <div className="mb-1 flex items-center justify-between text-[0.48rem] font-black uppercase tracking-[0.2em] text-cyan-100/85 sm:mb-2 sm:text-[0.65rem]">
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

          <div className="timer-page-round-cards mt-1 grid w-full max-w-[1200px] shrink-0 grid-cols-3 gap-2 sm:mt-3 sm:gap-3 lg:mt-4">
            <div className="timer-page-round-card min-w-0 rounded-[18px] border border-amber-400/60 bg-[rgba(14,15,18,0.52)] px-3 py-3 shadow-[0_0_20px_rgba(251,191,36,0.15)] backdrop-blur-sm sm:rounded-[24px] sm:px-5 sm:py-4">
              <div className="flex flex-col items-center gap-1.5 text-center sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                <div className="flex min-w-0 flex-col items-center gap-1.5 sm:flex-row sm:gap-2">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-amber-300/60 bg-amber-500/10 text-base text-amber-200 shadow-[0_0_16px_rgba(251,191,36,0.2)] sm:h-10 sm:w-10 sm:text-xl">💡</div>
                  <div className="text-left">
                    <div className="text-[0.55rem] font-black uppercase tracking-[0.12em] text-amber-200 sm:text-[0.7rem] sm:tracking-[0.22em]">ROUND 1</div>
                    <div className="mt-0.5 text-[0.65rem] font-bold text-white sm:mt-1 sm:text-[0.95rem] lg:text-base">09:30 AM — 01:30 PM</div>
                  </div>
                </div>
                <div className="text-[0.55rem] font-black uppercase tracking-[0.08em] text-amber-200 sm:text-[0.72rem] sm:tracking-[0.18em]">4 HOURS</div>
              </div>
              <div className="mt-1.5 text-center text-[0.68rem] font-black uppercase tracking-[0.08em] text-amber-100 sm:mt-2.5 sm:text-[0.95rem] lg:text-base">THINK + PROVE</div>
            </div>

            <div className="timer-page-round-card min-w-0 rounded-[18px] border border-cyan-300/60 bg-[rgba(12,16,28,0.52)] px-3 py-3 shadow-[0_0_20px_rgba(34,211,238,0.15)] backdrop-blur-sm sm:rounded-[24px] sm:px-5 sm:py-4">
              <div className="flex flex-col items-center gap-1.5 text-center sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                <div className="flex min-w-0 flex-col items-center gap-1.5 sm:flex-row sm:gap-2">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-cyan-300/60 bg-cyan-500/10 text-base text-cyan-200 shadow-[0_0_16px_rgba(34,211,238,0.2)] sm:h-10 sm:w-10 sm:text-xl">⚙</div>
                  <div className="text-left">
                    <div className="text-[0.55rem] font-black uppercase tracking-[0.12em] text-cyan-200 sm:text-[0.7rem] sm:tracking-[0.22em]">ROUND 2</div>
                    <div className="mt-0.5 text-[0.65rem] font-bold text-white sm:mt-1 sm:text-[0.95rem] lg:text-base">01:30 PM — 09:30 AM</div>
                  </div>
                </div>
                <div className="text-[0.55rem] font-black uppercase tracking-[0.08em] text-cyan-200 sm:text-[0.72rem] sm:tracking-[0.18em]">20 HOURS</div>
              </div>
              <div className="mt-1.5 text-center text-[0.68rem] font-black uppercase tracking-[0.08em] text-cyan-100 sm:mt-2.5 sm:text-[0.95rem] lg:text-base">BUILD + DEPLOY</div>
            </div>

            <div className="timer-page-round-card min-w-0 rounded-[18px] border border-violet-300/60 bg-[rgba(18,12,26,0.55)] px-3 py-3 shadow-[0_0_20px_rgba(168,85,247,0.18)] backdrop-blur-sm sm:rounded-[24px] sm:px-5 sm:py-4">
              <div className="flex flex-col items-center gap-1.5 text-center sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                <div className="flex min-w-0 flex-col items-center gap-1.5 sm:flex-row sm:gap-2">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-violet-300/60 bg-violet-500/10 text-base text-violet-200 shadow-[0_0_16px_rgba(168,85,247,0.2)] sm:h-10 sm:w-10 sm:text-xl">🏆</div>
                  <div className="text-left">
                    <div className="text-[0.55rem] font-black uppercase tracking-[0.12em] text-violet-200 sm:text-[0.7rem] sm:tracking-[0.22em]">TOTAL</div>
                    <div className="mt-0.5 text-[0.65rem] font-bold text-white sm:mt-1 sm:text-[0.95rem] lg:text-base">24 HOURS</div>
                  </div>
                </div>
                <div className="text-[0.55rem] font-black uppercase tracking-[0.08em] text-violet-200 sm:text-[0.72rem] sm:tracking-[0.18em]">24H</div>
              </div>
              <div className="mt-1.5 text-center text-[0.68rem] font-black uppercase tracking-[0.08em] text-violet-100 sm:mt-2.5 sm:text-[0.95rem] lg:text-base">INNOVATE TO IMPACT</div>
            </div>
          </div>

          {timer.status === 'before_start' && (
            <div className="timer-page-start mt-2 flex flex-col items-center justify-center gap-2 sm:mt-4">
              <button
                type="button"
                onClick={startHackathon}
                className="inline-flex items-center justify-center rounded-full border border-cyan-300/60 bg-cyan-500/10 px-6 py-2 text-xs font-black uppercase tracking-[0.18em] text-cyan-50 shadow-[0_0_18px_rgba(34,211,238,0.28)] transition-transform hover:scale-[1.02] hover:bg-cyan-500/15 focus:outline-none focus:ring-2 focus:ring-cyan-300/70 sm:px-8 sm:py-3 sm:text-sm"
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
            <div className="mt-2 flex justify-center">
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
