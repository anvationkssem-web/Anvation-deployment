import React, { useState } from 'react';
import { COLLEGE_INFO } from '../data/mockData';
import { MapPin, Target, Eye } from 'lucide-react';
import campusBgImage from '../assets/images/kssem_campus_real_1788194089427.jpg';
import hodimage from '../assets/images/hod.jpeg';
import labimg from '../assets/images/lab.jpeg';
import deptimg from '../assets/images/dept.jpeg';


export const AboutSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'college' | 'dept' | 'campus'>('college');

  return (
    <section id="about" className="py-24 px-4 sm:px-6 lg:px-8 bg-transparent relative overflow-hidden">
      {/* Dynamic Section Aura */}
      <div className="absolute top-1/3 -right-20 w-[500px] h-[500px] bg-gradient-to-bl from-pink-600/20 via-purple-600/15 to-transparent rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 -left-20 w-[450px] h-[450px] bg-gradient-to-tr from-cyan-600/20 to-transparent rounded-full blur-[130px] pointer-events-none" />

      <div className="max-w-7xl mx-auto space-y-12">
        {/* Editorial Section Header */}
        



        {/* Tab Selector */}
        <div className="flex justify-center">
          <div className="bg-slate-900/90 p-1.5 rounded-2xl border border-slate-700/80 flex flex-wrap justify-center gap-1 max-w-2xl w-full">
            <button
              onClick={() => setActiveTab('college')}
              className={`flex-1 min-w-[130px] px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeTab === 'college'
                  ? 'bg-gradient-to-r from-pink-600 via-fuchsia-600 to-orange-500 text-white shadow'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
              id="about-tab-college-btn"
            >
              About College
            </button>
            <button
              onClick={() => setActiveTab('dept')}
              className={`flex-1 min-w-[130px] px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeTab === 'dept'
                  ? 'bg-gradient-to-r from-pink-600 via-fuchsia-600 to-orange-500 text-white shadow'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
              id="about-tab-dept-btn"
            >
              Dept of CSE
            </button>
            
            <button
              onClick={() => setActiveTab('campus')}
              className={`flex-1 min-w-[130px] px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeTab === 'campus'
                  ? 'bg-gradient-to-r from-pink-600 via-fuchsia-600 to-orange-500 text-white shadow'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
              id="about-tab-campus-btn"
            >
              Campus Gallery
            </button>

          </div>
        </div>

        {/* Content Box */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-3xl p-6 sm:p-10 backdrop-blur-xl shadow-2xl">
{activeTab === 'college' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div className="space-y-5">
                <div className="space-y-1 border-l-2 border-cyan-500/50 pl-4">
                  <p className="text-cyan-300 font-black text-[11px] uppercase tracking-widest">Kammavari Sangham (R) 1952</p>
                  <p className="font-black text-white text-base leading-tight">K. S. GROUP OF INSTITUTIONS</p>
                  <p className="font-bold text-white text-xl leading-snug">K. S. SCHOOL OF ENGINEERING AND MANAGEMENT</p>
                  <p className="text-slate-400 text-[11px] leading-relaxed">Affiliated to VTU | Approved by AICTE | Accredited by NAAC &amp; NBA (CSE, ECE, ME &amp; CV)</p>
                  <p className="text-slate-400 text-[11px]">No. 15, Mallasandra, off. Kanakapura Road, Bengaluru - 560109</p>
                  <p className="text-cyan-400 text-[11px] font-semibold"><a href="https://kssem.edu.in/" target="_blank" rel="noopener noreferrer">www.kssem.edu.in</a></p>
                </div>
              
                <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                K.S. School of Engineering and Management (KSSEM) is a premier institution under the umbrella of the Kammavari Sangham Group of Institutions (KSGI), which is run by the Kammavari Sangham, a voluntary, non-profit organization established in 1952 with a vision to serve society through impactful and inclusive education. With a rich heritage of philanthropic service, the Sangham has, over the decades, expanded its presence in the field of education by nurturing institutions that are committed to academic excellence and societal progress.
                </p>
              </div>

              {/* Real Campus Building Photo Illustration */}
              <div className="relative rounded-2xl overflow-hidden border border-cyan-500/30 group shadow-2xl">
                <img
                  src={campusBgImage}
                  alt="KSSEM Campus Main Building"
                  referrerPolicy="no-referrer"
                  className="w-full h-72 sm:h-96 object-cover transform group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0b192c] via-transparent to-transparent opacity-90"></div>
                <div className="absolute bottom-4 left-4 right-4 p-4 rounded-xl bg-slate-900/90 backdrop-blur-md border border-slate-700 text-xs text-slate-200">
                  <div className="font-bold text-white text-sm">
                    <span>KSSEM Campus, Kanakapura Road, Bengaluru</span>
                  </div>
                  <p className="text-slate-300 mt-1"></p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'dept' && (
            <div className="space-y-8">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 p-6 rounded-2xl bg-gradient-to-r from-slate-800/90 via-slate-800/50 to-slate-800/90 border border-cyan-500/30">
                <div className="flex items-center gap-4">
                  <img
                    src={hodimage}
                   
                    className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl object-cover shadow-lg border border-cyan-300/40"
                  />
                  <div>
                    <h4 className="text-2xl sm:text-3xl font-black text-white">{COLLEGE_INFO.hodName}</h4>
                    <p className="text-sm sm:text-base text-slate-300 font-medium">{COLLEGE_INFO.hodTitle}</p>
                  </div>
                </div>
               
              </div>

              <div>
                <h3 className="text-2xl font-bold text-white">Department of Computer Science & Engineering</h3>
                <p className="text-xs text-amber-400 font-semibold">Accredited by National Board of Accreditation (NBA)</p>
              </div>
              <p className="text-slate-300 leading-relaxed text-sm sm:text-base">
                The Department of Computer Science and Engineering (CSE) at KSSEM, under the visionary leadership of Dr. K. Venkata Rao, is committed to delivering quality education that develops strong technical knowledge, practical skills, and professional competence among students. The department is supported by state-of-the-art AI and Cloud laboratories, active IEEE Computational Intelligence Society and IEEE Robotics and Automation Society student chapters, and a strong track record of placements in top-tier MNCs and product unicorns. Through academic rigor, industry–academia interaction, interdisciplinary projects, research-oriented learning, and emphasis on soft skills, the department provides students with a well-rounded learning experience and prepares them to address evolving global challenges and excel as responsible Computer Science professionals.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700">
                  <div className="text-amber-400 font-bold text-lg mb-1">State-of-the-Art Labs</div>
   
                </div>
                <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700">
                  <div className="text-cyan-400 font-bold text-lg mb-1">Research & Innovations</div>
                </div>
                <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700">
                  <div className="text-emerald-400 font-bold text-lg mb-1">Industry Mentorship</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'vision' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="p-6 rounded-2xl bg-slate-800/60 border border-cyan-500/30 space-y-3">
                <div className="flex items-center gap-2 text-cyan-400 font-bold text-xl">
                  <Target className="w-6 h-6" />
                  <span>Our Vision</span>
                </div>
                <p className="text-slate-300 text-sm leading-relaxed">
                  "To emerge as a center of excellence in computer science education and research, nurturing technically competent, ethical, and socially responsible software engineering leaders."
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-slate-800/60 border border-amber-500/30 space-y-3">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-xl">
                  <Eye className="w-6 h-6" />
                  <span>Our Mission</span>
                </div>
                <ul className="text-slate-300 text-xs sm:text-sm space-y-2 list-disc list-inside">
                  <li>Impart strong foundational knowledge in software design, AI, and systems engineering.</li>
                  <li>Promote collaborative industry-driven research and open-source innovation.</li>
                  <li>Inculcate leadership skills, hackathon spirit, and social consciousness.</li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'campus' && (
            <div className="space-y-6">
              <h3 className="text-2xl sm:text-3xl font-bold text-white">KSSEM Infrastructure </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div className="group relative rounded-xl overflow-hidden border border-slate-700 h-48">
                  <img src={deptimg} referrerPolicy="no-referrer" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent p-4 flex flex-col justify-end">
                    <span className="font-bold text-white text-sm">Dept. of Computer Science & Engineering</span>
                    <span className="text-xs text-pink-300">The CSE Department at KSSEM blends academic excellence, innovation, and industry exposure to nurture future-ready professionals.</span>
                  </div>
                </div>

                <div className="group relative rounded-xl overflow-hidden border border-slate-700 h-48">
                  <img src="https://kssem.edu.in/img/new_slider/slide1.jpg" alt="Auditorium" referrerPolicy="no-referrer" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent p-4 flex flex-col justify-end">
                    <span className="font-bold text-white text-sm">KSSEM Modern Academic Campus</span>
                    <span className="text-xs text-cyan-300">A state-of-the-art educational facility featuring contemporary architectural design and vibrant infrastructure built to inspire learning and innovation.</span>
                  </div>
                </div>

                <div className="group relative rounded-xl overflow-hidden border border-slate-700 h-48">
                  <img src={labimg} alt="Dining Hall" referrerPolicy="no-referrer" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent p-4 flex flex-col justify-end">
                    <span className="font-bold text-white text-sm">Hi-Tech Computer Laboratory</span>
                    <span className="text-xs text-emerald-300">A state-of-the-art computer facility equipped with high-performance systems and modern infrastructure designed to support hands-on learning and practical workshops.</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
