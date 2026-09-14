import React from 'react';
import { COLLEGE_INFO } from '../data/mockData';
import { Mail, Phone, MapPin, Instagram, Linkedin, Youtube, Twitter } from 'lucide-react';

export const ContactSection: React.FC = () => {

  return (
    <section id="contact" className="py-20 px-4 sm:px-6 lg:px-8 bg-[#0b192c] relative">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-bold uppercase tracking-wider">
            <Mail className="w-3.5 h-3.5" />
            <span>Organizing Team</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Contact <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-amber-400">Coordinators</span>
          </h2>
          <p className="max-w-2xl mx-auto text-sm sm:text-base text-slate-300">
            Have questions regarding registration, travel guidelines, or sponsorships? Reach out to our team.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Contact Details & Coordinators */}
          <div className="space-y-6">
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
              <div className="pt-2 flex flex-col gap-2 text-xs text-slate-300 font-medium">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-cyan-400" />
                  <span>{COLLEGE_INFO.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-amber-400" />
                  <span>{COLLEGE_INFO.email}</span>
                </div>
              </div>
            </div>

            {/* Coordinators hierarchy */}
            <div className="space-y-4">

              {/* Student Coordinators */}
              <div>
                <div className="flex items-center gap-2 mb-2.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  <h4 className="text-xs font-black uppercase text-amber-300 tracking-wider font-mono">Student Co-ordinators</h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                <div className="flex items-center gap-2 mb-2.5">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                  <h4 className="text-xs font-black uppercase text-cyan-300 tracking-wider font-mono">Faculty Co-ordinators</h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-cyan-500/30 space-y-1 shadow-lg">
                    <h5 className="font-bold text-white text-xs leading-snug">Dr. Sivasubramanyam Medasani</h5>
                    <a href="tel:+918309763125" className="text-xs text-cyan-300 font-mono hover:underline flex items-center gap-1 font-bold">
                      <Phone className="w-3 h-3 text-cyan-400" />
                      <span>+91 8309763125</span>
                    </a>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1">
                    <h5 className="font-bold text-white text-xs leading-snug">Prof. Harshavardhan J R</h5>
                    <a href="tel:+919448612519" className="text-xs text-slate-300 font-mono hover:underline flex items-center gap-1">
                      <Phone className="w-3 h-3 text-cyan-400" />
                      <span>+91 9448612519</span>
                    </a>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1">
                    <h5 className="font-bold text-white text-xs leading-snug">Prof. Vidyasre N</h5>
                    <a href="tel:+917975940301" className="text-xs text-slate-300 font-mono hover:underline flex items-center gap-1">
                      <Phone className="w-3 h-3 text-cyan-400" />
                      <span>+91 7975940301</span>
                    </a>
                  </div>
                </div>
              </div>

              {/* HODs & Leadership */}
              <div>
                <div className="flex items-center gap-2 mb-2.5">
                  <span className="w-2 h-2 rounded-full bg-fuchsia-400 animate-pulse" />
                  <h4 className="text-xs font-black uppercase text-fuchsia-300 tracking-wider font-mono">Department Heads &amp; Leadership</h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { name: 'Dr. K Venkata Rao', role: 'Professor & Head, CSE' },
                    { name: 'Dr. Manjunath T K', role: 'Professor & Head, AI&DS' },
                    { name: 'Prof. Ramesh Babu. N', role: 'Professor & Head, CS&BS' },
                    { name: 'Prof. Suresh RamaswwamyReddy', role: 'Principal & Director, KSSEM' },
                    { name: 'Dr. K Channakeshavalu', role: 'Executive Director, KSGI' },
                  ].map((p) => (
                    <div key={p.name} className="p-3.5 rounded-2xl bg-slate-900/90 border border-fuchsia-500/20 space-y-0.5">
                      <h5 className="font-bold text-white text-xs">{p.name}</h5>
                      <p className="text-[11px] text-slate-400">{p.role}</p>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Map Preview */}
            <div className="rounded-2xl overflow-hidden border border-slate-700 h-52 relative shadow-lg">
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
