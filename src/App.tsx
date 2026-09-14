import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { AboutSection } from './components/AboutSection';
import { ThemesSection } from './components/ThemesSection';
import { LiveSchedule24Hour } from './components/LiveSchedule24Hour';
import { PrizesSection } from './components/PrizesSection';
import { SponsorsSection } from './components/SponsorsSection';
import { FAQSection } from './components/FAQSection';
import { ContactSection } from './components/ContactSection';
import { RegistrationModal } from './components/RegistrationModal';
import { RulebookModal } from './components/RulebookModal';
import { ParticipantPortal } from './components/ParticipantPortal';
import { AdminPortal } from './components/AdminPortal';
import { CyberAtmosphereBackground } from './components/CyberAtmosphereBackground';
import { COLLEGE_INFO, HACKATHON_SCHEDULE } from './data/mockData';
import { PortalView } from './types';
import { Globe, ArrowUp } from 'lucide-react';

const REGISTRATION_FORM_URL =
  'https://docs.google.com/forms/d/e/1FAIpQLSe3t8qwKOL4RFlVk_z7VWdZ8IBmEuIrqPgEWWFestI9Q-5MLA/viewform?usp=dialog';

export default function App() {
  const getViewFromPath = (path: string): PortalView => {
    const normalizedPath = path.toLowerCase().replace(/\/+$/, '') || '/';
    if (normalizedPath === '/admin' || normalizedPath.startsWith('/admin/')) return 'admin';
    if (normalizedPath === '/participant' || normalizedPath.startsWith('/participant/')) return 'participant';
    return 'landing';
  };

  const [currentView, setCurrentView] = useState<PortalView>(() => getViewFromPath(window.location.pathname));
  const [adminSessionState, setAdminSessionState] = useState<'checking' | 'anonymous' | 'participant' | 'admin'>('checking');
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isRulebookModalOpen, setIsRulebookModalOpen] = useState(false);
  const [liveStats, setLiveStats] = useState<{ registeredCount: number; collegesCount: number; seatsLeft: number; totalSeats: number } | undefined>(undefined);
  const [homeSections, setHomeSections] = useState<{
    hero: boolean; about: boolean; themes: boolean; schedule: boolean;
    prizes: boolean; sponsors: boolean; faq: boolean; contact: boolean;
  }>({ hero: true, about: true, themes: true, schedule: false, prizes: true, sponsors: false, faq: true, contact: true });
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const navigateToView = (view: PortalView) => {
    const path = view === 'admin' ? '/admin' : view === 'participant' ? '/participant' : '/';
    if (window.location.pathname !== path) {
      window.history.pushState({}, '', path);
    }
    setCurrentView(view);
  };

  useEffect(() => {
    const handlePopState = () => setCurrentView(getViewFromPath(window.location.pathname));
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    if (currentView !== 'admin') {
      setAdminSessionState('anonymous');
      return;
    }

    let cancelled = false;
    setAdminSessionState('checking');
    fetch('/api/session')
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (!data.authenticated) setAdminSessionState('anonymous');
        else if (data.user?.type === 'participant') setAdminSessionState('participant');
        else if (data.user?.type === 'admin') setAdminSessionState('admin');
        else setAdminSessionState('anonymous');
      })
      .catch(() => {
        if (!cancelled) setAdminSessionState('anonymous');
      });
    return () => { cancelled = true; };
  }, [currentView]);

  const fetchLiveStats = async () => {
    try {
      const res = await fetch('/api/teams');
      const data = await res.json();
      if (data.success && data.stats) {
        setLiveStats(data.stats);
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  const fetchHomeSections = async () => {
    try {
      const res = await fetch('/api/cms-config');
      const data = await res.json();
      if (data.success && data.config && data.config.homeSections) {
        const s = data.config.homeSections;
        setHomeSections({
          hero: s.hero !== false,
          about: s.about !== false,
          themes: s.themes !== false,
          schedule: s.schedule !== false,
          prizes: s.prizes !== false,
          sponsors: s.sponsors !== false,
          faq: s.faq !== false,
          contact: s.contact !== false
        });
      }
    } catch (err) {
      console.error('Failed to fetch home sections:', err);
    }
  };

  useEffect(() => {
    fetchLiveStats();
    fetchHomeSections();
    const sectionsTimer = setInterval(() => {
      fetchHomeSections();
    }, 4000);

    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        const currentProgress = (window.scrollY / totalHeight) * 100;
        setScrollProgress(currentProgress);
      }
      setShowScrollTop(window.scrollY > 400);
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearInterval(sectionsTimer);
    };
  }, []);

  const handleRegistrationSuccess = () => {
    fetchLiveStats();
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openRegistration = () => {
    window.location.assign(REGISTRATION_FORM_URL);
  };

  return (
    <div className="min-h-screen bg-app text-app font-sans selection:bg-pink-500 selection:text-white relative">
      {/* Global Dynamic Cyber Atmosphere & Particle Aurora Background */}
      <CyberAtmosphereBackground />

      

      {/* Top Reading Scroll Progress Indicator Bar */}
      <div 
        className="fixed top-0 left-0 h-1 bg-gradient-to-r from-pink-500 via-fuchsia-500 to-orange-500 z-50 transition-all duration-150 shadow-[0_0_12px_rgba(236,72,153,0.8)]"
        style={{ width: `${scrollProgress}%` }}
      />

      {/* Top Institutional Header — removed per request */}
      {/* Primary Sticky Navbar */}
      <Navbar
        currentView={currentView}
        setCurrentView={navigateToView}
        onOpenRegister={openRegistration}
        onOpenRulebook={() => setIsRulebookModalOpen(true)}
      />

      {/* VIEW RENDERER */}
      {currentView === 'landing' && (
        <main className="space-y-0 relative z-10">
          {homeSections.hero && (
            <>
              {/* Institution Header */}
              <div className="relative z-10 w-full overflow-hidden flex flex-col items-center justify-center gap-1 text-center px-4 sm:px-6 py-4 sm:py-5"
                style={{
                  background: 'linear-gradient(135deg, rgba(2,8,28,0.98) 0%, rgba(4,18,48,0.97) 40%, rgba(6,12,36,0.98) 70%, rgba(2,8,28,0.98) 100%)',
                  borderTop: '1px solid rgba(34,211,238,0.5)',
                  borderBottom: '1px solid rgba(34,211,238,0.5)',
                  boxShadow: '0 0 60px rgba(34,211,238,0.12), 0 4px 32px rgba(0,0,0,0.6), inset 0 1px 0 rgba(34,211,238,0.15), inset 0 -1px 0 rgba(168,85,247,0.1)',
                }}>
                {/* Animated shimmer sweep */}
                <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(105deg, transparent 30%, rgba(34,211,238,0.06) 50%, transparent 70%)', animation: 'shimmer 4s ease-in-out infinite' }} />
                {/* Left accent line */}
                <div className="absolute left-0 top-0 bottom-0 w-[3px]" style={{ background: 'linear-gradient(180deg, transparent, rgba(34,211,238,0.8), rgba(168,85,247,0.6), transparent)' }} />
                {/* Right accent line */}
                <div className="absolute right-0 top-0 bottom-0 w-[3px]" style={{ background: 'linear-gradient(180deg, transparent, rgba(168,85,247,0.6), rgba(34,211,238,0.8), transparent)' }} />
                {/* Top glow bar */}
                <div className="absolute top-0 left-0 right-0 h-[1px]" style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(34,211,238,0.9) 30%, rgba(168,85,247,0.9) 70%, transparent 100%)' }} />
                {/* Bottom glow bar */}
                <div className="absolute bottom-0 left-0 right-0 h-[1px]" style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(168,85,247,0.9) 30%, rgba(34,211,238,0.9) 70%, transparent 100%)' }} />
                {/* Corner dots */}
                <div className="absolute top-2 left-4 w-1.5 h-1.5 rounded-full bg-cyan-400/70" />
                <div className="absolute top-2 right-4 w-1.5 h-1.5 rounded-full bg-fuchsia-400/70" />
                <div className="absolute bottom-2 left-4 w-1.5 h-1.5 rounded-full bg-fuchsia-400/70" />
                <div className="absolute bottom-2 right-4 w-1.5 h-1.5 rounded-full bg-cyan-400/70" />
                <span
                  className="relative text-[16px] sm:text-[22px] lg:text-[26px] xl:text-[30px] font-black uppercase tracking-[0.12em] sm:tracking-[0.18em] text-transparent bg-clip-text"
                  style={{ backgroundImage: 'linear-gradient(90deg, #67e8f9 0%, #ffffff 40%, #e0f2fe 60%, #c4b5fd 100%)', textShadow: 'none', filter: 'drop-shadow(0 0 18px rgba(34,211,238,0.55))' }}
                >K. S. SCHOOL OF ENGINEERING AND MANAGEMENT</span>
                <span className="relative text-[11px] sm:text-[13px] lg:text-[14px] font-bold tracking-[6px] uppercase mt-0.5" style={{ color: 'rgba(103,232,249,0.85)', letterSpacing: '0.35em' }}>✦ Bengaluru ✦</span>
              </div>
              <Hero
                onOpenRegister={openRegistration}
                onOpenRulebook={() => setIsRulebookModalOpen(true)}
                liveStats={liveStats}
              />
              <div className="cyber-section-divider" />
            </>
          )}
          {homeSections.themes && (
            <>
              <ThemesSection onOpenRegister={openRegistration} />
              <div className="cyber-section-divider" />
            </>
          )}
          {homeSections.about && (
            <>
              <AboutSection />
              <div className="cyber-section-divider" />
            </>
          )}
          {homeSections.schedule && (
            <>
              <LiveSchedule24Hour schedule={HACKATHON_SCHEDULE} />
              <div className="cyber-section-divider" />
            </>
          )}
          {homeSections.prizes && (
            <>
              <PrizesSection />
              <div className="cyber-section-divider" />
            </>
          )}
          {homeSections.sponsors && (
            <>
              <SponsorsSection />
              <div className="cyber-section-divider" />
            </>
          )}
          {homeSections.faq && (
            <>
              <FAQSection />
              <div className="cyber-section-divider" />
            </>
          )}
          {homeSections.contact && <ContactSection />}
        </main>
      )}

      {currentView === 'participant' && (
        <div className="relative z-10">
          <ParticipantPortal onOpenRulebook={() => setIsRulebookModalOpen(true)} />
        </div>
      )}

      {currentView === 'admin' && (
        <div className="relative z-10">
          {adminSessionState === 'checking' ? (
            <div className="min-h-[80vh] flex items-center justify-center text-cyan-300 font-mono text-sm">Checking admin session...</div>
          ) : (
            <AdminPortal />
          )}
        </div>
      )}

      {/* Global Modals */}
      <RegistrationModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        onSuccess={handleRegistrationSuccess}
      />

      <RulebookModal
        isOpen={isRulebookModalOpen}
        onClose={() => setIsRulebookModalOpen(false)}
      />

      {/* Floating CTA & Scroll-To-Top Control Group */}
      {currentView === 'landing' && (
        <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3">
          {/* Scroll To Top Button */}
          {showScrollTop && (
            <button
              onClick={scrollToTop}
              className="p-3 rounded-full bg-slate-900/90 text-pink-400 hover:text-white hover:bg-pink-600 border border-pink-500/40 shadow-[0_0_20px_rgba(236,72,153,0.3)] btn-tactile backdrop-blur-md"
              title="Back to top"
              id="scroll-to-top-btn"
            >
              <ArrowUp className="w-5 h-5" />
            </button>
          )}

        </div>
      )}

      {/* Footer */}
      <footer className="relative z-10 bg-[var(--surface-nav-solid)] border-t border-slate-800/80 py-12 px-4 sm:px-6 lg:px-8 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-10 text-center md:text-left">

          {/* Branding & Tagline */}
          <div className="space-y-3">
            <p className="font-black text-base tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-white to-violet-300">
              Anvation
            </p>
            <p className="text-slate-300 text-xs font-medium">National Level 24-Hr Hackathon</p>
            <p className="text-sm text-slate-400 flex items-center justify-center md:justify-start gap-1 font-mono">
              <Globe className="w-4 h-4 text-cyan-500" />
              <span>Bengaluru, Karnataka, India</span>
            </p>
          </div>

          {/* Venue & Contact */}
          <div className="space-y-2 text-slate-300 text-sm leading-relaxed">
            <p className="font-black text-white text-base mb-1">Venue Address</p>
            <p>
              <a href="https://www.kssem.edu.in" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline font-semibold">K. S. School of Engineering &amp; Management</a>
            </p>
            <p>Department of Computer Science and Engineering</p>
            <p>No. 15, Mallasandra, off. Kanakapura Road,<br />Bengaluru - 560109, Karnataka, India</p>
            <p className="pt-1">📞 +91 9900710055 / +91 80 28425012</p>
            <p>✉ <a href="mailto:anvation2026@kssem.edu.in" className="text-cyan-400 hover:underline">anvation2026@kssem.edu.in</a></p>
          </div>

          {/* Links & Copyright */}
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-6 font-semibold text-slate-400">
              <button onClick={() => { navigateToView('landing'); scrollToTop(); }} className="hover:text-pink-300 transition-colors">Home</button>
            </div>
            <div className="text-xs text-slate-400 space-y-1">
              <p>© 2026 KSSEM CSE Department. All rights reserved.</p>
              <p>Crafted by the Anvation Technical Team</p>
            </div>
          </div>

        </div>
      </footer>
    </div>
  );
}
