import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Droplet, 
  Leaf, 
  Activity, 
  LogOut, 
  ChevronRight, 
  FlaskConical,
  Wind
} from 'lucide-react';

// --- SUB-COMPONENTS ---

const Stat = ({ label, value, subtitle }) => (
  <div className="flex flex-col gap-1.5">
    <p className="text-[8px] font-black tracking-[0.5em] uppercase text-wellness-sage/40">{label}</p>
    <p className="text-4xl font-serif text-wellness-dark leading-none tracking-tight">{value}</p>
    <p className="text-[7px] font-bold tracking-[0.3em] uppercase text-wellness-sage/25 mt-1">{subtitle}</p>
  </div>
);

const ProgressCard = ({ week, title, desc, img, active }) => (
  <motion.div 
    whileHover={{ y: -10, transition: { duration: 0.5, ease: [0.23, 1, 0.32, 1] } }}
    className={`relative flex-1 rounded-[2.5rem] p-8 border transition-all duration-700 overflow-hidden group cursor-pointer flex flex-col justify-end ${active ? 'border-wellness-sage/40 shadow-[0_50px_100px_-20px_rgba(26,47,35,0.45)] scale-[1.01] ring-1 ring-wellness-sage/20' : 'border-white/10 opacity-50 hover:opacity-90 shadow-[0_20px_60px_-15px_rgba(26,47,35,0.2)]'}`}
  >
    <img src={img} className="absolute inset-0 w-full h-full object-cover transition-transform duration-[4s] group-hover:scale-115" alt={title} />
    <div className={`absolute inset-0 bg-gradient-to-t ${active ? 'from-wellness-dark/98 via-wellness-dark/30 to-wellness-dark/5' : 'from-wellness-dark/90 via-wellness-dark/20 to-transparent'} transition-opacity duration-700`}></div>
    
    {active && (
      <div className="absolute top-6 right-6 w-2 h-2 bg-wellness-sage rounded-full shadow-[0_0_12px_rgba(163,177,138,0.8)] animate-pulse"></div>
    )}

    <div className="relative z-10 transform translate-y-3 group-hover:translate-y-0 transition-transform duration-500 ease-out">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-[8px] font-black tracking-[0.6em] uppercase text-wellness-sage/80 bg-wellness-sage/10 px-3 py-1.5 rounded-full backdrop-blur-sm border border-wellness-sage/20">{week}</span>
        {active && (
          <span className="px-3 py-1.5 rounded-full bg-wellness-sage text-wellness-dark text-[7px] font-black uppercase tracking-widest shadow-[0_4px_20px_rgba(163,177,138,0.4)]">
            Active
          </span>
        )}
      </div>
      <h4 className="text-2xl font-serif text-white mb-3 leading-tight drop-shadow-lg">{title}</h4>
      <p className="text-[11px] text-white/50 leading-relaxed font-sans opacity-0 group-hover:opacity-100 transition-opacity duration-500 max-w-[85%]">
        {desc}
      </p>
    </div>
  </motion.div>
);

const Dashboard = () => {
  const [user] = useState(() => {
    try {
      const data = localStorage.getItem('user');
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.error("Error parsing user from localStorage:", e);
      return null;
    }
  });

  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/');
    }
  }, [user, navigate]);

  if (!user) return null;

  return (
    <div className="h-screen overflow-hidden transition-all duration-1000 bg-[#F5F3EF] bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')] selection:bg-wellness-sage/20 relative">
      {/* Ambient background glow */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-wellness-sage/5 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-5%] w-[400px] h-[400px] rounded-full bg-wellness-accent/5 blur-[100px] pointer-events-none"></div>

      <div className="w-full h-full max-w-[1600px] mx-auto p-3 md:p-6 relative z-10 flex flex-col">
        <div className="flex flex-col lg:flex-row gap-4 h-full min-h-0">
          
          {/* --- SIDEBAR SECTION --- */}
          <aside className="w-full lg:w-[360px] xl:w-[400px] flex flex-col gap-4 h-full min-h-0">
            
            {/* Profile Card */}
            <motion.div 
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, ease: [0.23, 1, 0.32, 1] }}
              whileHover={{ y: -8, transition: { duration: 0.5, ease: [0.23, 1, 0.32, 1] } }}
              className="bg-white/90 backdrop-blur-xl border border-wellness-sage/15 rounded-[2.5rem] p-7 shadow-[0_30px_80px_-15px_rgba(26,47,35,0.12),0_0_0_1px_rgba(163,177,138,0.08)] flex flex-col items-center relative overflow-hidden group flex-shrink-0"
            >
              {/* Decorative corner gradient */}
              <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-wellness-sage/8 to-transparent rounded-bl-full pointer-events-none"></div>
              <div className="absolute top-0 right-0 p-7 flex gap-4 items-center">
                <Leaf className="w-4 h-4 text-wellness-sage/25 rotate-12" />
              </div>

              <div className="relative w-28 h-28 mb-5">
                <motion.div
                  animate={{ 
                    rotate: 360,
                    borderColor: ['#A3B18A', '#588157', '#344E41', '#A3B18A'] 
                  }}
                  transition={{ 
                    rotate: { duration: 14, repeat: Infinity, ease: "linear" },
                    borderColor: { duration: 5, repeat: Infinity, ease: "linear" }
                  }}
                  className="absolute inset-[-14px] rounded-full border-[1.5px] border-dashed opacity-40 shadow-[0_0_20px_rgba(163,177,138,0.15)]"
                />
                <motion.div
                  animate={{ 
                    rotate: -360,
                    borderColor: ['#344E41', '#A3B18A', '#5A5A40', '#344E41']
                  }}
                  transition={{ 
                    rotate: { duration: 22, repeat: Infinity, ease: "linear" },
                    borderColor: { duration: 6, repeat: Infinity, ease: "linear" }
                  }}
                  className="absolute inset-[-6px] rounded-full border border-wellness-sage/30 opacity-50"
                />

                <div className="absolute inset-0 bg-gradient-to-br from-wellness-sage/15 to-transparent rounded-full scale-110 group-hover:scale-125 transition-transform duration-1000"></div>
                <img 
                  src={user.profilePic || `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=500`} 
                  alt="Profile" 
                  className="relative w-full h-full object-cover rounded-full border-[5px] border-white ring-2 ring-wellness-sage/15 shadow-[0_20px_60px_rgba(26,47,35,0.2)]"
                />
              </div>

              <span className="text-[8px] font-black tracking-[0.55em] uppercase text-wellness-sage/50 mb-3 bg-wellness-sage/8 px-5 py-2 rounded-full border border-wellness-sage/10">
                Verified Profile
              </span>
              <h2 className="text-3xl font-serif text-wellness-dark tracking-tight mb-2 drop-shadow-sm">
                {user.username}
              </h2>
              
              <div className="mt-7 pt-7 border-t border-wellness-sage/8 w-full flex justify-between px-6">
                <Stat label="Goal" value="92%" subtitle="Adherence" />
                <div className="w-[1px] h-14 bg-gradient-to-b from-transparent via-wellness-sage/15 to-transparent self-center"></div>
                <Stat label="Streak" value="14d" subtitle="Consistency" />
              </div>
            </motion.div>

            {/* Target Focus */}
            <motion.div 
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.15, ease: [0.23, 1, 0.32, 1] }}
              whileHover={{ y: -8, transition: { duration: 0.5, ease: [0.23, 1, 0.32, 1] } }}
              className="relative bg-wellness-dark border border-wellness-sage/15 rounded-[2.5rem] p-8 shadow-[0_40px_100px_-20px_rgba(26,47,35,0.5)] flex flex-col flex-1 min-h-0 overflow-hidden group"
            >
              <img 
                src="https://images.unsplash.com/photo-1547514701-42782101795e?auto=format&fit=crop&q=80&w=1000" 
                className="absolute inset-0 w-full h-full object-cover opacity-[0.07] grayscale group-hover:scale-110 transition-transform duration-[4s]"
                alt="Organic Nourishment"
              />
              {/* Subtle gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-wellness-sage/10 via-transparent to-wellness-dark/40 pointer-events-none"></div>
              
              <div className="relative z-10 flex flex-col h-full uppercase">
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <span className="text-[9px] font-bold tracking-[0.5em] uppercase text-wellness-sage/70 mb-4 block">Target Focus</span>
                    <h3 className="text-[1.65rem] font-serif text-white leading-tight tracking-tight">Nourishment & <br/> <i className="italic text-wellness-sage/90">Cellular</i> Repair</h3>
                  </div>
                  <div className="w-10 h-10 rounded-2xl bg-wellness-sage/10 border border-wellness-sage/20 flex items-center justify-center">
                    <FlaskConical className="w-5 h-5 text-wellness-sage/60" />
                  </div>
                </div>
                
                <div className="mt-auto space-y-4">
                  <div className="bg-white/5 backdrop-blur-xl rounded-[1.75rem] p-6 border border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                    <div className="flex justify-between items-end mb-5">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-xl bg-wellness-sage/15 flex items-center justify-center">
                          <Droplet className="w-3.5 h-3.5 text-wellness-sage" />
                        </div>
                        <span className="text-[9px] font-bold tracking-[0.25em] text-wellness-sage/70 uppercase">Hydration Level</span>
                      </div>
                      <span className="text-xl font-serif text-white">2.4 <span className="text-xs text-white/30">/ 3L</span></span>
                    </div>
                    <div className="w-full bg-white/10 h-1 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: '80%' }}
                        transition={{ duration: 1.8, delay: 0.6, ease: [0.23, 1, 0.32, 1] }}
                        className="bg-gradient-to-r from-wellness-sage/70 to-wellness-sage h-full rounded-full shadow-[0_0_20px_rgba(163,177,138,0.6)]"
                      ></motion.div>
                    </div>
                  </div>

                  <button 
                    onClick={() => { localStorage.clear(); navigate('/'); }}
                    className="w-full flex items-center justify-between py-5 px-7 border border-white/8 rounded-2xl group/btn hover:bg-white/5 hover:border-white/15 transition-all duration-500"
                  >
                    <span className="text-[9px] font-bold uppercase tracking-[0.5em] text-white/30 group-hover/btn:text-white/60 transition-colors">End Session</span>
                    <LogOut className="w-4 h-4 text-white/20 group-hover/btn:text-white/50 group-hover/btn:translate-x-1 transition-all" />
                  </button>
                </div>
              </div>
            </motion.div>
          </aside>

          {/* --- MAIN CONTENT AREA --- */}
          <main className="flex-1 flex flex-col gap-4 h-full min-h-0">
            
            {/* Banner Section */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.99 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.1, ease: [0.23, 1, 0.32, 1] }}
              whileHover={{ y: -10, transition: { duration: 0.5, ease: [0.23, 1, 0.32, 1] } }}
              className="flex-[0.7] min-h-0 relative rounded-[3rem] p-10 md:p-14 flex flex-col justify-center overflow-hidden shadow-[0_60px_120px_-30px_rgba(26,47,35,0.35)] group"
            >
               <img 
                 src="https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&q=80&w=2000" 
                 className="absolute inset-0 w-full h-full object-cover transition-transform duration-[5s] group-hover:scale-110"
                 alt="Gourmet Organic Meal"
               />
               {/* Multi-layered gradient for depth */}
               <div className="absolute inset-0 bg-gradient-to-r from-wellness-dark via-wellness-dark/65 to-transparent"></div>
               <div className="absolute inset-0 bg-gradient-to-t from-wellness-dark/40 via-transparent to-transparent"></div>
               {/* Top edge shimmer */}
               <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-wellness-sage/30 via-wellness-sage/10 to-transparent"></div>
               
               <div className="relative z-10 max-w-lg">
                 <motion.div
                   initial="hidden"
                   animate="visible"
                   variants={{
                     hidden: { opacity: 0 },
                     visible: {
                       opacity: 1,
                       transition: {
                         staggerChildren: 0.2
                       }
                     }
                   }}
                 >
                   <motion.span 
                     variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}
                     className="text-[9px] font-black tracking-[0.6em] uppercase text-wellness-sage/80 mb-6 block bg-wellness-sage/10 inline-flex px-4 py-2 rounded-full border border-wellness-sage/20 backdrop-blur-sm w-fit"
                   >
                     Curated Nutrients
                   </motion.span>
                   
                   <h1 className="text-5xl md:text-6xl font-serif text-white leading-[0.88] tracking-tight mb-10">
                     <motion.div
                       animate={{ y: [0, -4, 0] }}
                       transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
                     >
                       <motion.span
                          variants={{ hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0 } }}
                          className="block mb-2 text-white/85"
                       >
                         Sophisticated
                       </motion.span>
                     </motion.div>
                     <motion.div
                       animate={{ y: [0, 5, 0] }}
                       transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
                     >
                       <motion.span
                          variants={{ hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0 } }}
                          className="block"
                       >
                         <i className="font-serif italic shimmer-text drop-shadow-[0_0_30px_rgba(163,177,138,0.5)]">organic</i>
                         <span className="text-white ml-4">wellness.</span>
                       </motion.span>
                     </motion.div>
                   </h1>

                   <motion.div 
                     variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
                     className="flex items-center gap-6"
                   >
                      <button 
                        onClick={() => navigate('/generate-weekly')}
                        className="bg-white text-wellness-dark px-10 py-4 rounded-2xl text-[9px] font-black uppercase tracking-[0.45em] hover:bg-wellness-sage hover:text-white transition-all duration-500 shadow-[0_20px_60px_rgba(0,0,0,0.3)] flex items-center gap-4 group/btn"
                      >
                        Plan Weekly
                        <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                      </button>
                      <div className="flex items-center gap-3 text-white/35 bg-white/5 backdrop-blur-sm px-5 py-3 rounded-2xl border border-white/10">
                        <Wind className="w-4 h-4" />
                        <span className="text-[8px] uppercase tracking-widest font-bold">Oxygenated Intake</span>
                      </div>
                   </motion.div>
                 </motion.div>
               </div>
            </motion.div>

            {/* Tracking Grid */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.35, ease: [0.23, 1, 0.32, 1] }}
              whileHover={{ y: -6, transition: { duration: 0.4 } }}
              className="flex-1 bg-white/80 backdrop-blur-xl border border-wellness-sage/10 rounded-[3rem] p-8 md:p-10 shadow-[0_30px_80px_-15px_rgba(26,47,35,0.1),0_0_0_1px_rgba(163,177,138,0.05)] flex flex-col min-h-0 overflow-hidden"
            >
              <header className="flex justify-between items-end mb-8 px-4">
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-7 h-7 rounded-xl bg-wellness-sage/10 flex items-center justify-center">
                      <Activity className="w-3.5 h-3.5 text-wellness-sage" />
                    </div>
                    <span className="text-[9px] font-black tracking-[0.45em] uppercase text-wellness-sage/70">Progression Registry</span>
                  </div>
                  <h4 className="text-3xl font-serif text-wellness-dark tracking-tight">Active Protocols</h4>
                </div>
                <button className="group flex items-center gap-4 text-[9px] font-black tracking-[0.45em] uppercase text-wellness-sage/50 hover:text-wellness-dark transition-all duration-300">
                  see full history
                  <div className="w-6 h-[1px] bg-wellness-sage/30 group-hover:w-10 group-hover:bg-wellness-dark transition-all duration-300"></div>
                </button>
              </header>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 flex-1 min-h-0">
                <ProgressCard 
                  week="Batch 01" 
                  title="Metabolic Priming" 
                  desc="Initializing insulin sensitivity through specific enzymatic triggers."
                  img="https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80&w=500" 
                  active={false}
                />
                <ProgressCard 
                  week="Batch 02" 
                  title="Phytonutrient Intake" 
                  desc="High-density antioxidant absorption and vascular optimization."
                  img="https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&q=80&w=500" 
                  active={true}
                />
              </div>
            </motion.div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;