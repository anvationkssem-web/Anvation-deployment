import React from 'react';
import { Trophy, Award, Gift, Sparkles, Medal, Briefcase, Coins, Zap, Star } from 'lucide-react';
import { motion } from 'motion/react';
import confetti from 'canvas-confetti';

export const PrizesSection: React.FC = () => {
  const triggerConfetti = () => {
    confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.6 }
    });
  };

  return (
    <section id="prizes" className="py-20 px-4 sm:px-6 lg:px-8 bg-[#040814] relative overflow-hidden">
      {/* Ambient Glows */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-cyan-500/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto space-y-12 relative z-10">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center space-y-3"
        >
          <button
            onClick={triggerConfetti}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-black uppercase tracking-widest shadow-[0_0_15px_rgba(6,182,212,0.2)] hover:scale-105 btn-tactile cursor-pointer"
            id="prizes-confetti-btn"
          >
            <span className="text-emerald-400 font-mono">//</span>
            <span>₹50,000 TOTAL PRIZE POOL & TROPHIES</span>
          </button>
          <h2 className="text-3xl sm:text-6xl font-black text-white tracking-tight font-['Orbitron',sans-serif]">
            Prizes & <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-sky-200 to-emerald-300">Accolades</span>
          </h2>
          <p className="max-w-2xl mx-auto text-sm sm:text-base text-slate-300 font-medium">
            Rewarding innovation, technical brilliance, and product execution with cash prizes, certificates, and internship opportunities.
          </p>
        </motion.div>

        {/* Rewards: Prize Pool, Certificates & Internship Opportunities */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto">
          {/* Prize Pool */}
          <div className="order-2 md:order-1 p-7 rounded-3xl bg-gradient-to-b from-emerald-950/40 via-slate-950 to-slate-950 border-2 border-emerald-400 backdrop-blur-md shadow-[0_0_40px_rgba(16,185,129,0.25)] text-center space-y-4 relative transform hover:-translate-y-2 transition-transform">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-widest shadow-md font-['Orbitron',sans-serif]">
              CASH PRIZES
            </div>
            <div className="w-20 h-20 mx-auto rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.5)]">
              <Coins className="w-10 h-10 animate-pulse text-emerald-300" />
            </div>
            <div>
              <span className="text-xs font-extrabold uppercase text-emerald-300 tracking-wider font-mono">Prize Pool</span>
              <h3 className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-emerald-100 to-cyan-300 mt-1 font-['Orbitron',sans-serif]">₹50,000</h3>
            </div>
            <p className="text-xs text-slate-200 font-medium">Total cash prize pool with trophies across the winning teams, honouring the best builds of the hackathon.</p>
          </div>

          {/* Certificates */}
          <div className="order-1 md:order-2 p-7 rounded-3xl bg-slate-950/80 border-2 border-sky-400 backdrop-blur-md shadow-[0_0_30px_rgba(56,189,248,0.2)] text-center space-y-4 relative transform hover:-translate-y-2 transition-transform">
            <div className="w-20 h-20 mx-auto rounded-full bg-sky-500/20 border-2 border-sky-400 flex items-center justify-center text-sky-300 shadow-[0_0_20px_rgba(56,189,248,0.4)]">
              <Award className="w-10 h-10 text-sky-300" />
            </div>
            <div>
              <span className="text-xs font-extrabold uppercase text-sky-300 tracking-wider font-mono">Official Recognition</span>
              <h3 className="text-3xl sm:text-4xl font-black text-white mt-1 font-['Orbitron',sans-serif]">Certificates</h3>
            </div>
            <p className="text-xs text-slate-300 font-medium">Official KSSEM certificates for every participant, plus special winner and runner-up certificates for the top teams.</p>
          </div>

          {/* Internship Opportunities */}
          <div className="order-3 p-7 rounded-3xl bg-slate-950/80 border-2 border-purple-400 backdrop-blur-md shadow-[0_0_30px_rgba(192,132,252,0.2)] text-center space-y-4 relative transform hover:-translate-y-2 transition-transform">
            <div className="w-20 h-20 mx-auto rounded-full bg-purple-500/20 border-2 border-purple-400 flex items-center justify-center text-purple-300 shadow-[0_0_20px_rgba(192,132,252,0.4)]">
              <Briefcase className="w-10 h-10 text-purple-300" />
            </div>
            <div>
              <span className="text-xs font-extrabold uppercase text-purple-300 tracking-wider font-mono">Career Boost</span>
              <h3 className="text-3xl sm:text-4xl font-black text-white mt-1 font-['Orbitron',sans-serif]">Internships</h3>
            </div>
            <p className="text-xs text-slate-300 font-medium">Direct internship and FTE interview fast-track opportunities with leading hiring partners for standout teams.</p>
          </div>
        </div>
      </div>
    </section>
  );
};

