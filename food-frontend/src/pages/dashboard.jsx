import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon } from 'lucide-react'; // Make sure to: npm install lucide-react

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });
  const navigate = useNavigate();

  useEffect(() => {
    const data = localStorage.getItem('user');
    if (!data) return navigate('/');
    setUser(JSON.parse(data));
    
    // Apply theme to document
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [navigate, darkMode]);

  if (!user) return null;

  // --- LUXURY ANIMATION VARIANTS ---
  const containerVariants = {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: { staggerChildren: 0.3, delayChildren: 0.2 } }
  };

  const slowSlideUp = {
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0, transition: { duration: 1.5, ease: [0.16, 1, 0.3, 1] } }
  };

  return (
    <div className={`min-h-screen transition-colors duration-700 font-sans selection:bg-[#588157]/20 
      ${darkMode ? 'bg-[#0D0F0D] text-[#E1E3DE]' : 'bg-[#FDFEFC] text-[#344E41]'} 
      bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')] p-8 flex gap-8`}>
      
      {/* --- THEME TOGGLE BUTTON --- */}
      <button 
        onClick={() => setDarkMode(!darkMode)}
        className={`fixed top-8 right-8 z-50 p-4 rounded-full border transition-all duration-500 
          ${darkMode ? 'bg-[#1A1C19] border-white/10 text-yellow-200 shadow-2xl' : 'bg-white border-[#344E41]/10 text-[#344E41] shadow-lg'}`}
      >
        {darkMode ? <Sun size={20} /> : <Moon size={20} />}
      </button>

      {/* --- SIDEBAR SECTION --- */}
      <aside className="w-[360px] flex flex-col gap-8">
        {/* Profile Card */}
        <div className={`backdrop-blur-2xl border rounded-[2.5rem] p-10 transition-all duration-700 group hover:shadow-2xl
          ${darkMode ? 'bg-black/40 border-white/5 shadow-black/20' : 'bg-white/70 border-[#A3B18A]/30 shadow-[0_20px_50px_rgba(52,78,65,0.05)]'}`}>
          <div className="relative w-32 h-32 mb-8 mx-auto">
            <div className={`absolute inset-0 rounded-full scale-110 group-hover:scale-125 transition-transform duration-700 animate-pulse
              ${darkMode ? 'bg-[#588157]/20' : 'bg-[#A3B18A]/20'}`}></div>
            <img 
              src={user.profilePic || `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=500`} 
              alt="Profile" 
              className="relative w-full h-full object-cover rounded-full border-4 border-white dark:border-[#1A1C19] shadow-lg"
            />
          </div>
          <div className="text-center">
            <span className={`text-[10px] font-bold tracking-[0.4em] uppercase mb-2 block ${darkMode ? 'text-[#588157]' : 'text-[#A3B18A]'}`}>Verified Profile</span>
            <h2 className="text-2xl font-bold tracking-tighter">{user.username}</h2>
          </div>
          
          <div className={`mt-8 pt-8 border-t w-full flex justify-around ${darkMode ? 'border-white/5' : 'border-[#A3B18A]/20'}`}>
            <Stat label="Goal" value="92%" darkMode={darkMode} />
            <div className={`w-[1px] h-10 ${darkMode ? 'bg-white/5' : 'bg-[#A3B18A]/20'}`}></div>
            <Stat label="Streak" value="14d" darkMode={darkMode} />
          </div>
        </div>

        {/* Focus Card (Stays Dark for contrast) */}
        <div className="relative bg-[#1A2E24] rounded-[2.5rem] p-10 shadow-2xl flex flex-col justify-between flex-1 overflow-hidden group">
          <img 
            src="https://images.unsplash.com/photo-1470058869958-2a77a67117a8?auto=format&fit=crop&q=80&w=1000" 
            className="absolute inset-0 w-full h-full object-cover opacity-20 grayscale group-hover:scale-110 transition-all duration-1000"
            alt="Nature"
          />
          <div className="relative z-10">
            <span className="text-[10px] font-bold tracking-[0.4em] uppercase text-[#A3B18A]/80 mb-4 block">Target Focus</span>
            <h3 className="text-3xl font-bold tracking-tighter text-[#FDFEFC] leading-tight mb-10">Nourishment & <br/> Cellular Repair</h3>
            <div className="bg-white/5 backdrop-blur-md rounded-3xl p-6 border border-white/10">
              <div className="flex justify-between items-end mb-4">
                <div className="text-[10px] font-bold tracking-[0.2em] text-[#A3B18A]">HYDRATION</div>
                <div className="text-xl font-bold text-white">2.4 <span className="text-sm opacity-50 font-normal">/ 3L</span></div>
              </div>
              <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                <div className="bg-[#588157] h-full rounded-full transition-all duration-1000" style={{width: '80%'}}></div>
              </div>
            </div>
          </div>
          <button onClick={() => { localStorage.clear(); navigate('/'); }} className="relative z-10 w-full py-4 mt-8 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-bold uppercase tracking-[0.3em] text-[#A3B18A] hover:bg-white/10 transition-all duration-300">
            End Daily Session
          </button>
        </div>
      </aside>

      {/* --- MAIN CONTENT AREA --- */}
      <main className="flex-1 flex flex-col gap-8 overflow-hidden">
        
        {/* Banner Section */}
        <motion.div variants={containerVariants} initial="initial" animate="animate" className="h-[340px] relative rounded-[3rem] p-16 flex flex-col justify-center overflow-hidden shadow-2xl group">
           <img 
             src="https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&q=80&w=2000" 
             className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
             alt="Vibrant Greens"
           />
           <div className={`absolute inset-0 bg-gradient-to-r transition-colors duration-700 ${darkMode ? 'from-black/90 via-black/40' : 'from-[#1a2e24]/90 via-[#344E41]/50'} to-transparent`}></div>
           
           <div className="relative z-20 max-w-lg text-white">
             <motion.span variants={slowSlideUp} className="text-[10px] font-bold tracking-[0.5em] uppercase text-[#A3B18A] mb-6 block">Curated Nutrition</motion.span>
             <motion.h1 variants={slowSlideUp} className="text-5xl font-bold tracking-tighter leading-[1.1] mb-10 drop-shadow-md">Sophisticated <br/> organic wellness.</motion.h1>
             <motion.button variants={slowSlideUp} onClick={() => navigate('/generate-weekly')} className={`px-10 py-5 rounded-2xl text-[10px] font-bold uppercase tracking-[0.3em] transition-all duration-500 shadow-2xl ${darkMode ? 'bg-white text-black hover:bg-[#A3B18A]' : 'bg-white text-[#344E41] hover:bg-[#A3B18A]'}`}>
                Generate Weekly Diet Plan
             </motion.button>
           </div>
        </motion.div>

        {/* Tracking Grid */}
        <motion.div variants={containerVariants} initial="initial" animate="animate" className={`flex-1 backdrop-blur-2xl border rounded-[3rem] p-12 transition-all duration-700 flex flex-col
          ${darkMode ? 'bg-black/40 border-white/5 shadow-black/20' : 'bg-white/60 border-[#A3B18A]/20 shadow-[0_30px_60px_rgba(52,78,65,0.03)]'}`}>
          <header className="flex justify-between items-center mb-10">
            <motion.div variants={slowSlideUp}>
              <span className={`text-[10px] font-bold tracking-[0.4em] uppercase mb-2 block ${darkMode ? 'text-[#588157]' : 'text-[#A3B18A]'}`}>Progression Log</span>
              <h4 className="text-2xl font-bold tracking-tighter">Active Protocols</h4>
            </motion.div>
            <motion.button variants={slowSlideUp} className={`px-6 py-3 rounded-full text-[10px] font-bold tracking-[0.2em] uppercase transition-all ${darkMode ? 'bg-white/5 text-white hover:bg-white/10' : 'bg-[#344E41]/5 text-[#344E41] hover:bg-[#344E41]/10'}`}>See Full History</motion.button>
          </header>
          
          <div className="grid grid-cols-2 gap-8 flex-1">
            <ProgressCard week="Week 01" title="Metabolic Priming" img="https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80&w=500" active={false} animation={slowSlideUp} darkMode={darkMode} />
            <ProgressCard week="Week 02" title="Phytonutrient Integration" img="https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&q=80&w=500" active={true} animation={slowSlideUp} darkMode={darkMode} />
          </div>
        </motion.div>
      </main>
    </div>
  );
};

// --- SUB-COMPONENTS ---
const Stat = ({ label, value, darkMode }) => (
  <div className="text-center">
    <p className={`text-[10px] font-bold tracking-[0.3em] uppercase mb-1 ${darkMode ? 'text-[#588157]' : 'text-[#A3B18A]'}`}>{label}</p>
    <p className="text-2xl font-bold tracking-tighter">{value}</p>
  </div>
);

const ProgressCard = ({ week, title, img, active, animation, darkMode }) => (
  <motion.div variants={animation} className={`relative h-full rounded-[2.5rem] p-10 border transition-all duration-700 overflow-hidden group cursor-pointer flex flex-col justify-end shadow-sm hover:shadow-2xl hover:-translate-y-2 
    ${active ? (darkMode ? 'border-white/10' : 'border-[#344E41]/20') : 'border-transparent opacity-70 hover:opacity-100'}`}>
    <img src={img} className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" alt={title} />
    <div className={`absolute inset-0 bg-gradient-to-t transition-opacity duration-700 ${active ? (darkMode ? 'from-black via-black/20' : 'from-[#344E41] via-[#344E41]/40') : 'from-black/80'} to-transparent`}></div>
    <div className="relative z-10">
      <div className="flex items-center gap-3 mb-4">
        <span className="bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold tracking-[0.2em] uppercase text-white border border-white/20">{week}</span>
        {active && (
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#A3B18A] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#A3B18A]"></span>
          </span>
        )}
      </div>
      <h4 className="text-xl font-bold tracking-tight text-white group-hover:translate-x-2 transition-transform duration-500">{title}</h4>
    </div>
  </motion.div>
);

export default Dashboard;