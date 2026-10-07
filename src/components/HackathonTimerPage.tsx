import React, { useEffect, useMemo, useRef, useState } from 'react';
import backgroundImage from '../assets/branding/anvation-2026-poster.png';
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
        @keyframes timer-circuit-flow {
          to { stroke-dashoffset: -173; }
        }
        @keyframes timer-circuit-pulse {
          0%, 100% { opacity: 0.4; transform: scale(0.85); }
          50% { opacity: 1; transform: scale(1.3); }
        }
        @keyframes timer-neon-breathe {
          0%, 100% { opacity: 0.8; }
          50% { opacity: 1; }
        }
        .timer-circuit-trace {
          stroke: rgba(34, 211, 238, 0.82);
          stroke-width: 3;
          stroke-dasharray: 26 147;
          filter: drop-shadow(0 0 5px rgba(34, 211, 238, 0.9));
          animation: timer-circuit-flow 5s linear infinite;
        }
        .timer-circuit-node {
          transform-box: fill-box;
          transform-origin: center;
          filter: drop-shadow(0 0 6px rgba(103, 232, 249, 0.95));
          animation: timer-circuit-pulse 2.6s ease-in-out infinite;
        }
        .timer-neon-background {
          animation: timer-neon-breathe 10s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .timer-circuit-trace,
          .timer-circuit-node,
          .timer-neon-background {
            animation: none;
          }
        }
        .hackathon-timer-page.is-fullscreen .timer-page-layout {
          box-sizing: border-box;
          height: 100dvh;
          min-height: 0;
          gap: 1dvh;
          overflow: hidden;
          padding: 1dvh 1vw;
        }
        .hackathon-timer-page.is-fullscreen .timer-page-header {
          flex: 0 0 auto;
          padding: 1dvh 1vw;
        }
        .hackathon-timer-page.is-fullscreen .timer-page-header img {
          max-height: 12dvh;
        }
        .hackathon-timer-page.is-fullscreen .timer-page-tagline {
          font-size: clamp(0.75rem, 1.8dvh, 1.05rem);
        }
        .hackathon-timer-page.is-fullscreen .timer-page-collaboration {
          margin-top: 0.75dvh;
          padding: 0.5dvh 1vw;
          font-size: clamp(0.68rem, 1.4dvh, 0.9rem);
        }
        .hackathon-timer-page.is-fullscreen .timer-page-department {
          font-size: clamp(0.75rem, 1.65dvh, 1rem);
        }
        .hackathon-timer-page.is-fullscreen .timer-page-association {
          margin-top: 0.5dvh;
          font-size: clamp(0.6rem, 1.15dvh, 0.75rem);
        }
        .hackathon-timer-page.is-fullscreen .timer-page-association-badge {
          padding: 0.3dvh 0.55vw;
          font-size: clamp(0.62rem, 1.2dvh, 0.8rem);
        }
        .hackathon-timer-page.is-fullscreen .timer-page-content {
          flex: 1 1 0%;
          min-height: 0;
          justify-content: flex-start;
          gap: 0.4dvh;
        }
        .hackathon-timer-page.is-fullscreen .timer-page-card {
          flex: 1 1 0;
          min-height: 0;
          grid-template-rows: auto minmax(0, 1fr);
          gap: 1dvh;
          overflow: hidden;
          padding: 1dvh;
        }
        .hackathon-timer-page.is-fullscreen .timer-page-side-logo {
          width: min(11dvh, 11vw, 7rem);
          height: min(11dvh, 11vw, 7rem);
        }
        .hackathon-timer-page.is-fullscreen .timer-page-timer-column {
          display: flex;
          flex: 1 1 0%;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          min-height: 0;
          gap: 0.6dvh;
        }
        .hackathon-timer-page.is-fullscreen .timer-page-round-section {
          flex: 0 1 auto;
          width: 100%;
          min-height: 0;
          align-items: center;
          justify-content: center;
        }
        .hackathon-timer-page.is-fullscreen .timer-page-round-section > .mb-4 {
          margin-bottom: 0.5dvh;
        }
        .hackathon-timer-page.is-fullscreen .timer-page-total-panel {
          flex: 0 0 auto;
          gap: 0.5dvh;
          align-self: stretch;
          padding: 1dvh 1vw;
        }
        .hackathon-timer-page.is-fullscreen .timer-page-total-clock {
          padding: 0.75dvh 1vw;
          text-align: center;
        }
        .hackathon-timer-page.is-fullscreen .timer-page-total-digit {
          margin-top: 0.4dvh;
          font-size: clamp(2rem, 6dvh, 3.4rem);
        }
        .hackathon-timer-page.is-fullscreen .timer-page-round-clock {
          align-items: center;
          min-height: 0;
        }
        .hackathon-timer-page.is-fullscreen .timer-page-round-clock {
          width: fit-content;
          max-width: 100%;
        }
        .hackathon-timer-page.is-fullscreen .timer-page-clock-readout > div:first-child {
          gap: 0.75dvw;
        }
        .hackathon-timer-page.is-fullscreen .timer-page-clock-readout > div:first-child > div {
          padding: 0.75dvh 1vw;
        }
        .hackathon-timer-page.is-fullscreen .timer-page-digit {
          font-size: clamp(1.5rem, 8dvh, 3.5rem);
        }
        .hackathon-timer-page.is-fullscreen .timer-page-colon {
          padding-bottom: 1dvh;
          font-size: clamp(1.5rem, 7dvh, 3rem);
        }
        .hackathon-timer-page.is-fullscreen .timer-page-units {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          max-width: 100%;
          margin-top: 0.5dvh;
          gap: 0.75dvw;
          font-size: clamp(0.48rem, 1.2dvh, 0.7rem);
          text-align: center;
        }
        .hackathon-timer-page.is-fullscreen .timer-page-round-label,
        .hackathon-timer-page.is-fullscreen .timer-page-round-caption {
          text-align: center;
        }
        .hackathon-timer-page.is-fullscreen .timer-page-progress,
        .hackathon-timer-page.is-fullscreen .timer-page-start {
          width: 100%;
        }
        .hackathon-timer-page.is-fullscreen .timer-page-round-label {
          margin-top: 0.75dvh;
          font-size: clamp(0.8rem, 2.4dvh, 1.25rem);
        }
        .hackathon-timer-page.is-fullscreen .timer-page-round-caption {
          margin-top: 0.25dvh;
          font-size: clamp(0.48rem, 1.2dvh, 0.7rem);
        }
        .hackathon-timer-page.is-fullscreen .timer-page-progress {
          flex: 0 0 auto;
          margin-top: 0;
          font-size: clamp(0.48rem, 1.15dvh, 0.68rem);
        }
        .hackathon-timer-page.is-fullscreen .timer-page-start {
          flex: 0 0 auto;
          margin-top: 0;
        }
        .hackathon-timer-page.is-fullscreen .timer-page-start button {
          padding-block: 0.75dvh;
        }
        .hackathon-timer-page.is-fullscreen .timer-page-round-cards {
          flex: 0 0 auto;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 0.75dvw;
          min-height: clamp(7rem, 16dvh, 9rem);
        }
        .hackathon-timer-page.is-fullscreen .timer-page-round-card {
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 1.5dvh 1vw;
        }
        .hackathon-timer-page.is-fullscreen .timer-page-round-card > div:first-child {
          gap: 0.5dvw;
        }
        .hackathon-timer-page.is-fullscreen .timer-page-round-card > div:first-child > div:first-child {
          gap: 0.5dvw;
        }
        .hackathon-timer-page.is-fullscreen .timer-page-round-card > div:first-child > div:first-child > div:first-child {
          width: min(5.5dvh, 2.75rem);
          height: min(5.5dvh, 2.75rem);
          font-size: clamp(1rem, 2.7dvh, 1.35rem);
        }
        .hackathon-timer-page.is-fullscreen .timer-page-round-card > div:first-child > div:first-child > div:last-child > div:first-child {
          font-size: clamp(0.85rem, 1.7dvh, 1rem);
        }
        .hackathon-timer-page.is-fullscreen .timer-page-round-card > div:first-child > div:first-child > div:last-child > div:last-child {
          font-size: clamp(1rem, 2.1dvh, 1.25rem);
        }
        .hackathon-timer-page.is-fullscreen .timer-page-round-card > div:first-child > div:last-child {
          font-size: clamp(0.85rem, 1.7dvh, 1rem);
        }
        .hackathon-timer-page.is-fullscreen .timer-page-round-card > div:last-child {
          margin-top: 0.75dvh;
          font-size: clamp(1rem, 2dvh, 1.2rem);
        }
        @media (min-width: 640px) {
          .hackathon-timer-page.is-fullscreen .timer-page-card {
            grid-template-columns: minmax(0, 0.8fr) minmax(0, 1.2fr);
            grid-template-rows: minmax(0, 1fr);
          }
          .hackathon-timer-page.is-fullscreen .timer-page-side-logo {
            width: min(36dvh, 30vw, 24rem);
            height: min(36dvh, 30vw, 24rem);
          }
        }
        @media (max-height: 560px) {
          .hackathon-timer-page.is-fullscreen .timer-page-side-logo { width: min(29dvh, 28vw, 14rem); height: min(29dvh, 28vw, 14rem); }
          .hackathon-timer-page.is-fullscreen .timer-page-digit { font-size: clamp(1.2rem, 7dvh, 3rem); }
          .hackathon-timer-page.is-fullscreen .timer-page-colon { font-size: clamp(1.2rem, 6dvh, 2.8rem); }
          .hackathon-timer-page.is-fullscreen .timer-page-round-cards { min-height: clamp(4.75rem, 15dvh, 6.5rem); }
          .hackathon-timer-page.is-fullscreen .timer-page-total-digit { font-size: clamp(1.5rem, 5dvh, 2.5rem); }
        }
        @media (max-height: 460px) {
          .hackathon-timer-page.is-fullscreen .timer-page-layout { gap: 0.5dvh; padding: 0.5dvh 0.75vw; }
          .hackathon-timer-page.is-fullscreen .timer-page-header { gap: 0.5vw; padding: 0.25dvh 0.5vw; }
          .hackathon-timer-page.is-fullscreen .timer-page-header img { max-height: 8dvh; }
          .hackathon-timer-page.is-fullscreen .timer-page-tagline { font-size: clamp(0.62rem, 1.8dvh, 0.82rem); }
          .hackathon-timer-page.is-fullscreen .timer-page-collaboration { margin-top: 0.3dvh; padding: 0.25dvh 0.5vw; font-size: clamp(0.58rem, 1.6dvh, 0.75rem); }
          .hackathon-timer-page.is-fullscreen .timer-page-department { font-size: clamp(0.58rem, 1.55dvh, 0.75rem); }
          .hackathon-timer-page.is-fullscreen .timer-page-association { margin-top: 0.2dvh; font-size: clamp(0.48rem, 1.15dvh, 0.6rem); }
          .hackathon-timer-page.is-fullscreen .timer-page-association-badge { padding: 0.2dvh 0.4vw; font-size: clamp(0.5rem, 1.2dvh, 0.62rem); }
          .hackathon-timer-page.is-fullscreen .timer-page-header > div:last-child > div:first-child { font-size: clamp(0.58rem, 1.55dvh, 0.75rem); }
          .hackathon-timer-page.is-fullscreen .timer-page-header > div:last-child > div:nth-child(2) { margin-top: 0.2dvh; font-size: clamp(0.48rem, 1.15dvh, 0.6rem); }
          .hackathon-timer-page.is-fullscreen .timer-page-header > div:last-child > div:last-child { margin-top: 0.2dvh; }
          .hackathon-timer-page.is-fullscreen .timer-page-content { gap: 0.5dvh; }
          .hackathon-timer-page.is-fullscreen .timer-page-card { gap: 0.5dvh; padding: 0.5dvh 0.75vw; }
          .hackathon-timer-page.is-fullscreen .timer-page-side-logo { width: min(21dvh, 24vw, 8rem); height: min(21dvh, 24vw, 8rem); }
          .hackathon-timer-page.is-fullscreen .timer-page-timer-column { gap: 0.35dvh; }
          .hackathon-timer-page.is-fullscreen .timer-page-total-panel { gap: 0.25dvh; padding: 0.4dvh 0.6vw; }
          .hackathon-timer-page.is-fullscreen .timer-page-total-panel > div:first-child > div:first-child { font-size: 0.45rem; }
          .hackathon-timer-page.is-fullscreen .timer-page-total-panel > div:first-child > div:last-child { display: none; }
          .hackathon-timer-page.is-fullscreen .timer-page-total-panel button { padding: 0.35dvh 0.5vw; font-size: 0.45rem; }
          .hackathon-timer-page.is-fullscreen .timer-page-total-clock { padding: 0.35dvh 0.6vw; }
          .hackathon-timer-page.is-fullscreen .timer-page-total-clock > div:first-child { font-size: 0.45rem; }
          .hackathon-timer-page.is-fullscreen .timer-page-total-digit { margin-top: 0.15dvh; font-size: clamp(1rem, 3dvh, 1.5rem); }
          .hackathon-timer-page.is-fullscreen .timer-page-round-section > .mb-4 { margin-bottom: 0.25dvh; }
          .hackathon-timer-page.is-fullscreen .timer-page-round-section > .mb-4 > span { padding: 0.15dvh 0.5vw; font-size: 0.45rem; }
          .hackathon-timer-page.is-fullscreen .timer-page-clock-readout > div:first-child { gap: 0.5vw; }
          .hackathon-timer-page.is-fullscreen .timer-page-clock-readout > div:first-child > div { padding: 0.35dvh 0.6vw; }
          .hackathon-timer-page.is-fullscreen .timer-page-digit { font-size: clamp(1rem, 5dvh, 2rem); }
          .hackathon-timer-page.is-fullscreen .timer-page-colon { padding-bottom: 0.5dvh; font-size: clamp(1rem, 4.5dvh, 1.8rem); }
          .hackathon-timer-page.is-fullscreen .timer-page-units { margin-top: 0.25dvh; font-size: 0.45rem; }
          .hackathon-timer-page.is-fullscreen .timer-page-round-label { margin-top: 0.35dvh; font-size: clamp(0.6rem, 1.8dvh, 0.9rem); }
          .hackathon-timer-page.is-fullscreen .timer-page-round-caption { margin-top: 0; font-size: 0.45rem; }
          .hackathon-timer-page.is-fullscreen .timer-page-progress { font-size: 0.45rem; }
          .hackathon-timer-page.is-fullscreen .timer-page-progress > div:first-child { margin-bottom: 0.15dvh; }
          .hackathon-timer-page.is-fullscreen .timer-page-progress > div:last-child { height: 0.25rem; }
          .hackathon-timer-page.is-fullscreen .timer-page-start button { padding-block: 0.35dvh; font-size: 0.55rem; }
          .hackathon-timer-page.is-fullscreen .timer-page-round-cards { gap: 0.5vw; min-height: clamp(4.5rem, 13dvh, 5.5rem); }
          .hackathon-timer-page.is-fullscreen .timer-page-round-card { justify-content: center; padding: 0.6dvh 0.6vw; }
          .hackathon-timer-page.is-fullscreen .timer-page-round-card > div:first-child { gap: 0.25vw; }
          .hackathon-timer-page.is-fullscreen .timer-page-round-card > div:first-child > div:first-child { gap: 0.25vw; }
          .hackathon-timer-page.is-fullscreen .timer-page-round-card > div:first-child > div:first-child > div:first-child { width: min(4dvh, 1.5rem); height: min(4dvh, 1.5rem); font-size: 0.85rem; }
          .hackathon-timer-page.is-fullscreen .timer-page-round-card > div:first-child > div:first-child > div:last-child > div:first-child { font-size: clamp(0.65rem, 1.4dvh, 0.8rem); }
          .hackathon-timer-page.is-fullscreen .timer-page-round-card > div:first-child > div:first-child > div:last-child > div:last-child { font-size: clamp(0.75rem, 1.6dvh, 0.95rem); }
          .hackathon-timer-page.is-fullscreen .timer-page-round-card > div:first-child > div:last-child { font-size: clamp(0.65rem, 1.4dvh, 0.8rem); }
          .hackathon-timer-page.is-fullscreen .timer-page-round-card > div:last-child { margin-top: 0.4dvh; font-size: clamp(0.8rem, 1.7dvh, 1rem); }
        }
      `}</style>
      <div className="absolute inset-0 z-0 bg-[#020b17]/40" />
      <div
        className="timer-neon-background pointer-events-none absolute inset-0 z-[2]"
        aria-hidden="true"
        style={{
          backgroundImage: 'radial-gradient(ellipse at 18% 22%, rgba(34, 211, 238, 0.28), transparent 42%), radial-gradient(ellipse at 82% 78%, rgba(139, 92, 246, 0.23), transparent 44%)',
        }}
      />
      <div className="absolute inset-0 z-[1] bg-[radial-gradient(circle_at_center,rgba(2,6,23,0.04),rgba(2,6,23,0.20),rgba(2,6,23,0.56))]" />
      <svg
        className="pointer-events-none absolute inset-0 z-[3] h-full w-full"
        viewBox="0 0 1440 900"
        preserveAspectRatio="none"
        fill="none"
        aria-hidden="true"
      >
        <g stroke="rgba(34,211,238,0.3)" strokeWidth="1.5">
          <path className="timer-circuit-trace" d="M0 190H115V245H205V300H285" />
          <path className="timer-circuit-trace" d="M1440 210H1320V275H1235V330H1150" />
          <path className="timer-circuit-trace" d="M0 700H135V645H230V590H315" />
          <path className="timer-circuit-trace" d="M1440 690H1310V745H1210V790H1115" />
        </g>
        <g fill="rgba(103,232,249,0.65)">
          <circle className="timer-circuit-node" cx="115" cy="190" r="3" />
          <circle className="timer-circuit-node" cx="205" cy="300" r="3" />
          <circle className="timer-circuit-node" cx="1320" cy="210" r="3" />
          <circle className="timer-circuit-node" cx="1235" cy="330" r="3" />
          <circle className="timer-circuit-node" cx="135" cy="700" r="3" />
          <circle className="timer-circuit-node" cx="230" cy="590" r="3" />
          <circle className="timer-circuit-node" cx="1310" cy="690" r="3" />
          <circle className="timer-circuit-node" cx="1210" cy="790" r="3" />
        </g>
      </svg>
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

      <div className={`timer-page-layout relative z-10 mx-auto flex max-w-[1600px] flex-col gap-4 px-3 py-3 sm:gap-5 sm:px-6 sm:py-5 lg:px-10 ${isFullscreenMode ? 'h-full min-h-0' : 'min-h-dvh'}`}>
        <header className="timer-page-header relative z-10 grid shrink-0 grid-cols-[1fr_auto] items-center gap-3 rounded-3xl border border-cyan-200/15 bg-slate-950/45 px-3 py-3 shadow-[0_18px_60px_rgba(2,8,23,0.35)] backdrop-blur-xl sm:grid-cols-[1fr_auto_1fr] sm:gap-5 sm:px-6 sm:py-4">
          <div className="flex items-center gap-1.5 sm:gap-3">
            <img
              src={collegeLogo}
              alt="College logo"
              className="h-[calc(3.25rem+4px)] w-auto object-contain drop-shadow-[0_0_18px_rgba(34,211,238,0.4)] sm:h-[calc(4.5rem+4px)] lg:h-[min(calc(6.5rem+4px),calc(15dvh+4px))]"
            />
          </div>

          <div className="col-start-2 row-start-1 text-center sm:col-start-2 sm:row-start-auto">
            <div className="timer-page-tagline text-[0.58rem] font-bold uppercase tracking-[0.15em] text-cyan-100/90 sm:text-[0.8rem] sm:tracking-[0.2em] lg:text-[0.9rem]">
              EXPLORE • INNOVATE • TRANSFORM
            </div>
            <div className="timer-page-collaboration mt-1.5 inline-flex rounded-full border border-cyan-300/40 bg-cyan-300/[0.06] px-2.5 py-1 text-[0.56rem] font-black uppercase tracking-[0.12em] text-cyan-100 shadow-[0_0_18px_rgba(34,211,238,0.12)] sm:mt-2 sm:px-3 sm:text-[0.72rem] sm:tracking-[0.18em]">
              COLLABORATION • PYGENIC ARC
            </div>
          </div>

          <div className="col-span-2 flex flex-col items-center justify-center border-t border-white/10 pt-2 text-center sm:col-span-1 sm:items-end sm:border-0 sm:pt-0 sm:text-right">
            <div className="timer-page-department text-[0.62rem] font-bold uppercase tracking-[0.08em] text-white/90 sm:text-[0.7rem] lg:text-[0.9rem]">
              DEPT. OF COMPUTER SCIENCE & ENGINEERING
            </div>
            <div className="timer-page-association mt-1 text-[0.5rem] font-semibold uppercase tracking-[0.12em] text-cyan-100/65 sm:text-[0.55rem]">
              IN ASSOCIATION WITH
            </div>
            <div className="mt-1 flex gap-1.5 sm:gap-2">
              <div className="timer-page-association-badge rounded-lg border border-cyan-300/40 bg-cyan-500/[0.08] px-2 py-0.5 text-[0.55rem] font-black uppercase tracking-[0.06em] text-cyan-100 sm:text-[0.65rem]">
                AI&DS
              </div>
              <div className="timer-page-association-badge rounded-lg border border-cyan-300/40 bg-cyan-500/[0.08] px-2 py-0.5 text-[0.55rem] font-black uppercase tracking-[0.06em] text-cyan-100 sm:text-[0.65rem]">
                CSBS
              </div>
            </div>
          </div>
        </header>

        <main className="timer-page-content relative z-10 flex min-h-0 flex-1 flex-col justify-center gap-4 sm:gap-5">
          <section className="timer-page-card grid w-full grid-cols-1 gap-5 rounded-[28px] border border-cyan-300/20 bg-[linear-gradient(135deg,rgba(8,20,34,0.9),rgba(5,10,24,0.84))] p-3 shadow-[0_24px_80px_rgba(2,8,23,0.48),0_0_45px_rgba(34,211,238,0.08)] backdrop-blur-xl sm:rounded-[32px] sm:p-6 lg:p-8 xl:grid-cols-2">
            <div className="flex items-center justify-center">
              <img
                src={anvationEmblem}
                alt="Anvation emblem"
                className="timer-page-side-logo h-36 w-36 object-contain drop-shadow-[0_0_28px_rgba(96,165,250,0.76)] sm:h-48 sm:w-48 xl:h-[min(50dvh,24rem)] xl:w-[min(50dvh,24rem)]"
              />
            </div>
            <div className="timer-page-timer-column flex min-w-0 flex-col items-center justify-center gap-4">
            <div className="timer-page-round-section flex min-w-0 flex-col items-center justify-center">
            <div className="mb-4 flex w-full justify-center xl:mb-6">
              <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[0.58rem] font-black uppercase tracking-[0.2em] sm:text-[0.68rem] ${isLive ? 'border-emerald-300/30 bg-emerald-300/[0.08] text-emerald-200' : timer.status === 'completed' ? 'border-violet-300/30 bg-violet-300/[0.08] text-violet-200' : 'border-cyan-300/30 bg-cyan-300/[0.08] text-cyan-100'}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${isLive ? 'animate-pulse bg-emerald-300' : timer.status === 'completed' ? 'bg-violet-300' : 'bg-cyan-300'}`} />
                {timerStatusText}
              </span>
            </div>
            <div className="timer-page-round-clock mt-0 flex flex-col items-center justify-center">
              <div className="timer-page-clock-readout w-fit max-w-full">
                <div className="flex items-end justify-start gap-2 sm:gap-4 lg:gap-5">
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

                <div className="timer-page-units mt-2 flex w-full items-center justify-between gap-2 text-left text-[0.55rem] font-black uppercase tracking-[0.18em] text-cyan-100/85 sm:mt-3 sm:gap-4 sm:text-[0.72rem] lg:text-[0.8rem]">
                  <span>HOURS</span>
                  <span>MINUTES</span>
                  <span>SECONDS</span>
                </div>
              </div>

              <div className="timer-page-round-label mt-3 text-center text-[0.75rem] font-black uppercase tracking-[0.12em] text-amber-300 sm:mt-4 sm:text-[1.125rem] lg:text-[1.375rem]" style={{ textShadow: '0 0 14px rgba(251,191,36,0.7)' }}>
                {timer.status === 'before_start' || timer.roundLabel === 'ROUND 1' ? 'ROUND 1 — THINK + PROVE' : 'ROUND 2 — BUILD + DEPLOY'}
              </div>

              <div className="timer-page-round-caption mt-1 text-center text-[0.48rem] font-semibold uppercase tracking-[0.2em] text-cyan-100/80 sm:text-[0.66rem] lg:text-xs">
                {timer.status === 'completed' ? 'HACKATHON COMPLETED' : timer.status === 'before_start' ? 'ROUND 1 READY TO START' : timer.roundLabel === 'ROUND 1' ? 'ENDS AT 01:30 PM (4 HOURS)' : 'ROUND 2 IN PROGRESS'}
              </div>
            </div>
          </div>

          <aside className="timer-page-total-panel order-first flex flex-col justify-center gap-4 rounded-[24px] border border-white/10 bg-slate-950/35 p-4 sm:gap-5 sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-[0.58rem] font-black uppercase tracking-[0.22em] text-cyan-100/60 sm:text-[0.65rem]">FLOATING DISPLAY</div>
                <div className="mt-1 text-xs font-medium text-white/60">Keep the timer visible</div>
              </div>
              <button
                type="button"
                onClick={openFloatingClock}
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-cyan-300/35 bg-cyan-300/[0.08] px-3 py-2 text-[0.58rem] font-black uppercase tracking-[0.12em] text-cyan-100 transition hover:border-cyan-200/60 hover:bg-cyan-300/[0.14] focus:outline-none focus:ring-2 focus:ring-cyan-300/60 sm:text-[0.65rem]"
              >
                <span>↗</span>
                <span>FLOAT CLOCK</span>
              </button>
            </div>

            <div className="timer-page-total-clock rounded-2xl border border-cyan-300/20 bg-cyan-300/[0.05] p-4 sm:p-5">
              <div className="text-center text-[0.62rem] font-black uppercase tracking-[0.2em] text-cyan-100/65 sm:text-[0.7rem]">24H COUNTDOWN</div>
              <div className="timer-page-total-digit mt-1 text-center text-[clamp(1.8rem,4vw,2.6rem)] font-black leading-none tracking-[-0.06em] text-white drop-shadow-[0_0_18px_rgba(34,211,238,0.45)]">
                {totalClockValue}
              </div>
            </div>

          </aside>
            <div className="timer-page-progress">
              <div className="mb-2 flex items-center justify-between gap-2 text-[0.56rem] font-black uppercase tracking-[0.14em] text-cyan-100/70 sm:text-[0.62rem]">
                <span>24H PROGRESS</span>
                <span>{Math.round(progressPct)}%</span>
              </div>
              <div
                className="h-2.5 overflow-hidden rounded-full border border-cyan-300/20 bg-slate-900/80"
                role="progressbar"
                aria-label="24-hour hackathon progress"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(progressPct)}
              >
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-400 via-cyan-400 to-violet-500 shadow-[0_0_16px_rgba(34,211,238,0.55)] transition-all duration-700 ease-linear"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>

            {timer.status === 'before_start' && (
              <div className="timer-page-start">
                <button
                  type="button"
                  onClick={startHackathon}
                  className="inline-flex w-full items-center justify-center rounded-xl border border-cyan-200/50 bg-cyan-300/[0.12] px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-cyan-50 shadow-[0_0_24px_rgba(34,211,238,0.12)] transition hover:border-cyan-100/75 hover:bg-cyan-300/[0.18] focus:outline-none focus:ring-2 focus:ring-cyan-300/70 sm:text-sm"
                >
                  START HACKATHON
                </button>
              </div>
            )}
            </div>
          </section>

          <div className="timer-page-round-cards grid w-full shrink-0 grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
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
        </main>
      </div>
    </div>
  );
};
