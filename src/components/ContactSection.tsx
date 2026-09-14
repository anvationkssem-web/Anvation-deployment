import React from 'react';
import { COLLEGE_INFO } from '../data/mockData';
import { MapPin, Phone, Instagram, Linkedin, Youtube, Twitter } from 'lucide-react';

export const ContactSection: React.FC = () => {

  return (
    <section id="contact" className="py-20 px-4 sm:px-6 lg:px-8 bg-[#0b192c] relative">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center space-y-3">
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-fuchsia-400 to-amber-400">Organizing Team</span>
          </h2>
          <div className="flex items-center justify-center gap-3">
            <span className="h-px w-16 bg-gradient-to-r from-transparent to-cyan-400" />
            <span className="w-2 h-2 rounded-full bg-fuchsia-400 animate-pulse" />
            <span className="h-px w-16 bg-gradient-to-l from-transparent to-amber-400" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* LEFT: Coordinators */}
          <div className="space-y-5">

              {/* Student Coordinators */}
              <div>
                <div className="flex items-center justify-center gap-2 mb-2.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  <h4 className="text-sm font-black uppercase text-amber-300 tracking-wider font-mono">Student Co-ordinators</h4>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-amber-500/30 space-y-1 shadow-lg">
                    <h5 className="font-bold text-white text-sm">Bhaskar S</h5>
                    <a href="tel:+919663949447" className="text-xs text-amber-300 font-mono hover:underline flex items-center gap-1 font-bold">
                      <Phone className="w-3 h-3 text-amber-400" />
                      <span>+91 9663949447</span>
                    </a>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-amber-500/30 space-y-1 shadow-lg">
                    <h5 className="font-bold text-white text-sm">K Vennela</h5>
                    <a href="tel:+919019302077" className="text-xs text-amber-300 font-mono hover:underline flex items-center gap-1 font-bold">
                      <Phone className="w-3 h-3 text-amber-400" />
                      <span>+91 9019302077</span>
                    </a>
                  </div>
                </div>
              </div>

              {/* Faculty Coordinators */}
              <div>
                <div className="flex items-center justify-center gap-2 mb-2.5">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                  <h4 className="text-sm font-black uppercase text-cyan-300 tracking-wider font-mono">Faculty Co-ordinators</h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-700 space-y-1">
                    <h5 className="font-bold text-white text-xs leading-snug">Dr. Sivasubramanyam Medasani</h5>
                    <p className="text-[11px] text-slate-400">Professor, Dept. of CSE</p>
                    <a href="tel:+918309763125" className="text-xs text-slate-300 font-mono hover:underline flex items-center gap-1">
                      <Phone className="w-3 h-3 text-cyan-400" />
                      <span>+91 8309763125</span>
                    </a>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-700 space-y-1">
                    <h5 className="font-bold text-white text-xs leading-snug">Prof. Harshavardhan J R</h5>
                    <p className="text-[11px] text-slate-400">Associate Professor, Dept. of CSE</p>
                    <a href="tel:+919448612519" className="text-xs text-slate-300 font-mono hover:underline flex items-center gap-1">
                      <Phone className="w-3 h-3 text-cyan-400" />
                      <span>+91 9448612519</span>
                    </a>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-700 space-y-1">
                    <h5 className="font-bold text-white text-xs leading-snug">Prof. Vidyasre N</h5>
                    <p className="text-[11px] text-slate-400">Assistant Professor, Dept. of CSE</p>
                    <a href="tel:+917975940301" className="text-xs text-slate-300 font-mono hover:underline flex items-center gap-1">
                      <Phone className="w-3 h-3 text-cyan-400" />
                      <span>+91 7975940301</span>
                    </a>
                  </div>
                </div>
              </div>

              {/* HODs & Leadership */}
              <div>
                <div className="flex items-center justify-center gap-2 mb-2.5">
                  <span className="w-2 h-2 rounded-full bg-fuchsia-400 animate-pulse" />
                  <h4 className="text-sm font-black uppercase text-fuchsia-300 tracking-wider font-mono">Department Heads</h4>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { name: 'Dr. K Venkata Rao', role: 'Professor & Head, CSE' },
                    { name: 'Dr. Manjunath T K', role: 'Professor & Head, AI&DS' },
                    { name: 'Prof. Ramesh Babu N', role: 'Professor & Head, CS&BS' },
                  ].map((p) => (
                    <div key={p.name} className="p-3.5 rounded-2xl bg-slate-900/90 border border-fuchsia-500/20 space-y-0.5">
                      <h5 className="font-bold text-white text-xs leading-snug">{p.name}</h5>
                      <p className="text-[11px] text-slate-400">{p.role}</p>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-center gap-2 mb-2.5 mt-4">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  <h4 className="text-sm font-black uppercase text-amber-300 tracking-wider font-mono">Leadership</h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { name: 'Prof. Suresh RamaswwamyReddy', role: 'Principal & Director, KSSEM' },
                    { name: 'Dr. K Channakeshavalu', role: 'Executive Director, KSGI' },
                  ].map((p) => (
                    <div key={p.name} className="p-3.5 rounded-2xl bg-gradient-to-br from-slate-900/90 to-amber-950/30 border border-amber-400/40 space-y-0.5 shadow-[0_0_12px_rgba(251,191,36,0.12)]">
                      <h5 className="font-bold text-white text-xs">{p.name}</h5>
                      <p className="text-[11px] text-amber-300">{p.role}</p>
                    </div>
                  ))}
                </div>
              </div>

          </div>

          {/* RIGHT: Venue + Map */}
          <div className="space-y-5">
            <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <MapPin className="w-5 h-5 text-red-400" />
                <span>Venue Address</span>
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {COLLEGE_INFO.name}<br />
                {COLLEGE_INFO.department}<br />
                {COLLEGE_INFO.address}
              </p>
            </div>

            {/* Map */}
            <div className="rounded-2xl overflow-hidden border border-slate-700 h-80 relative shadow-lg">
              <iframe
                title="KSSEM Campus Location Map"
                src="https://maps.google.com/maps?width=588&amp;height=377&amp;hl=en&amp;q=k s school of engineering and management&amp;t=&amp;z=16&amp;ie=UTF8&amp;iwloc=B&amp;output=embed"
                className="w-full h-full border-0 filter grayscale opacity-90 contrast-125 hover:grayscale-0 transition-all duration-500"
                allowFullScreen={false}
                loading="lazy"
              ></iframe>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
