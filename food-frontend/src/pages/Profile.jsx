import { useState, useEffect } from 'react'; // FIX 1: Removed unused 'React' import
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Mail,
  ShieldCheck,
  Calendar,
  Weight,
  Ruler,
  Activity,
  Moon,
  Sun,
  Edit2
} from 'lucide-react';

const Profile = () => {
  const navigate = useNavigate();

  // FIX 2: Initialize state directly from localStorage (Lazy Initializer)
  // This fixes the "cascading renders" error.
  const [user] = useState(() => {
    const data = localStorage.getItem('user');
    return data ? JSON.parse(data) : null;
  });

  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });

  // Simplified useEffect to only handle redirection
  useEffect(() => {
    if (!user) {
      navigate('/');
    }
  }, [user, navigate]);

  useEffect(() => {
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
    // SYNC DARK MODE GLOBALLY
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Prevent crashing if user isn't found
  if (!user) return null;

  // THEME HELPERS
  const cardBg = darkMode ? 'bg-[#121212]/90' : 'bg-white/90';
  const border = darkMode ? 'border-white/10' : 'border-[#ddd8ce]';
  const textMain = darkMode ? 'text-white' : 'text-[#1c3a1c]';
  const textSub = darkMode ? 'text-white/60' : 'text-[#5a7054]';
  
  // FIX 3: Removed 'accentGreen' as it was unused (clears lint warning)

  return (
    <div
      className={`relative min-h-screen w-full flex flex-col p-6 md:p-10 bg-cover bg-center transition-colors duration-500 ${
        darkMode ? 'text-white' : 'text-[#1c3a1c]'
      }`}
      style={{ backgroundImage: "url('/bg3.png')" }}
    >
      {/* Dynamic Overlay */}
      <div
        className={`absolute inset-0 z-0 transition-opacity duration-500 ${
          darkMode ? 'bg-black/75' : 'bg-black/20'
        }`}
      />

      <div className="relative z-10 flex flex-col h-full max-w-6xl mx-auto w-full">

        {/* HEADER */}
        <header className="flex items-center justify-between mb-10 flex-shrink-0">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.3em] text-white/80 hover:text-white transition-all group"
          >
            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> 
            Back to Hub
          </button>

          <div className="text-right text-white">
            <h2 className="font-serif text-2xl italic leading-none">NutriFind</h2>
            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[#8ecb84] mt-1">
              Member Identity
            </p>
          </div>

          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`p-2.5 rounded-xl backdrop-blur-md transition-all ${
              darkMode ? 'bg-white/10 text-yellow-400 hover:bg-white/20' : 'bg-black/10 text-white hover:bg-black/20'
            }`}
          >
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </header>

        <div className="flex-1 grid grid-cols-12 gap-8 overflow-y-auto pr-2 custom-scrollbar">

          {/* LEFT: PROFILE CARD */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="col-span-12 lg:col-span-4 space-y-6"
          >
            <div className={`${cardBg} backdrop-blur-xl rounded-[2rem] p-10 ${border} border shadow-2xl text-center transition-colors duration-500`}>
              
              <div className="relative w-36 h-36 mx-auto mb-6">
                <div className={`absolute inset-0 rounded-full scale-110 blur-md transition-opacity ${darkMode ? 'bg-[#8ecb84]/20 opacity-100' : 'bg-[#8ecb84]/40 opacity-0'}`}></div>
                <img
                  src={user.profilePic || `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=500`}
                  alt="Profile"
                  className="relative w-full h-full object-cover rounded-full border-4 border-white shadow-lg"
                />
                <button className="absolute bottom-1 right-1 p-2 bg-[#2d5a27] text-white rounded-full border-2 border-white hover:scale-110 transition-transform">
                    <Edit2 size={12} />
                </button>
              </div>

              <h1 className={`font-serif text-3xl italic mb-1 ${textMain} transition-colors`}>
                {user.username || user.name}
              </h1>

              <p className="text-[10px] font-bold text-[#6a9966] uppercase tracking-[0.25em] mb-8">
                Premium Member
              </p>

              <div className={`flex flex-col gap-4 text-left border-t ${border} pt-8 transition-colors`}>
                <div className={`flex items-center gap-4 ${textSub}`}>
                  <div className={`p-2 rounded-lg ${darkMode ? 'bg-white/5' : 'bg-black/5'}`}>
                    <Mail size={14} className="text-[#8ecb84]" />
                  </div>
                  <span className="text-xs font-medium tracking-wide">
                    {user.email || 'user@nutrifind.com'}
                  </span>
                </div>

                <div className={`flex items-center gap-4 ${textSub}`}>
                  <div className={`p-2 rounded-lg ${darkMode ? 'bg-white/5' : 'bg-black/5'}`}>
                    <ShieldCheck size={14} className="text-[#8ecb84]" />
                  </div>
                  <span className="text-xs font-medium tracking-wide">Verified Account</span>
                </div>

                <div className={`flex items-center gap-4 ${textSub}`}>
                  <div className={`p-2 rounded-lg ${darkMode ? 'bg-white/5' : 'bg-black/5'}`}>
                    <Calendar size={14} className="text-[#8ecb84]" />
                  </div>
                  <span className="text-xs font-medium tracking-wide">Joined Jan 2024</span>
                </div>
              </div>
            </div>

            <button className="w-full bg-[#1c3a1c] text-white py-4 rounded-2xl text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-[#2d5a27] transition-all shadow-xl active:scale-[0.98]">
              Edit Detailed Profile
            </button>
          </motion.div>

          {/* RIGHT: CONTENT */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="col-span-12 lg:col-span-8 space-y-8"
          >
            <section className={`${cardBg} backdrop-blur-xl rounded-[2rem] p-8 ${border} border shadow-2xl transition-colors duration-500`}>
              <h3 className={`font-serif text-xl italic mb-4 ${textMain}`}>
                Personal Narrative
              </h3>
              <p className={`text-sm leading-relaxed italic ${textSub} opacity-80`}>
                "No Personal Narative yet... "
              </p>
            </section>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <InfoCard darkMode={darkMode} icon={<Weight size={20} />} label="Latest Weight" value="72.5 kg" />
              <InfoCard darkMode={darkMode} icon={<Ruler size={20} />} label="Last Height" value="178 cm" />
              <InfoCard darkMode={darkMode} icon={<Activity size={20} />} label="Avg. BMI" value="22.8" />
            </div>

            <div className={`${cardBg} backdrop-blur-xl rounded-[2rem] overflow-hidden ${border} border shadow-2xl transition-colors duration-500`}>
              <div className={`px-8 py-5 border-b ${border} bg-black/5`}>
                <h4 className="text-[10px] font-black uppercase tracking-[0.25em] text-[#6a9966]">
                  Security & Preferences
                </h4>
              </div>

              <div className="p-8 space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <p className={`text-sm font-bold ${textMain}`}>Email Notifications</p>
                    <p className={`text-[10px] ${textSub}`}>Weekly reports and alerts</p>
                  </div>
                  <div className={`w-11 h-6 ${darkMode ? 'bg-white/10' : 'bg-gray-200'} rounded-full relative cursor-pointer p-1`}>
                    <div className="absolute right-1 top-1 w-4 h-4 bg-[#8ecb84] rounded-full shadow-sm"></div>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <div>
                    <p className={`text-sm font-bold ${textMain}`}>Public Profile</p>
                    <p className={`text-[10px] ${textSub}`}>Allow others to see your badges</p>
                  </div>
                  <div className={`w-11 h-6 ${darkMode ? 'bg-white/10' : 'bg-gray-200'} rounded-full relative cursor-pointer p-1`}>
                    <div className={`absolute left-1 top-1 w-4 h-4 ${darkMode ? 'bg-white/20' : 'bg-white'} rounded-full shadow-sm`}></div>
                  </div>
                </div>

                <div className={`pt-6 border-t ${border} flex justify-between items-center`}>
                  <span className={`text-sm font-medium ${darkMode ? 'text-red-400' : 'text-red-700'}`}>
                    Danger Zone
                  </span>
                  <button className={`text-[9px] font-bold uppercase tracking-widest px-4 py-2 rounded-xl transition-all border ${
                    darkMode ? 'text-red-400 border-red-400/30 hover:bg-red-400/10' : 'text-red-700 border-red-200 hover:bg-red-50'
                  }`}>
                    Delete Account
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

const InfoCard = ({ icon, label, value, darkMode }) => (
  <div
    className={`backdrop-blur-xl rounded-[2rem] p-7 border transition-all duration-500 hover:translate-y-[-4px] ${
      darkMode
        ? 'bg-[#121212]/90 border-white/10 shadow-2xl'
        : 'bg-white/90 border-[#ddd8ce] shadow-xl'
    }`}
  >
    <div className={`mb-5 transition-colors ${darkMode ? 'text-[#8ecb84]' : 'text-[#2d5a27]'}`}>
      {icon}
    </div>
    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#6a9966] mb-1">
      {label}
    </p>
    <p className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-[#1c3a1c]'}`}>
      {value}
    </p>
  </div>
);

export default Profile;