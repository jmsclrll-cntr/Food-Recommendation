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
  <div className="flex flex-col gap-1">
    <p className="text-[9px] font-black tracking-[0.4em] uppercase text-wellness-sage/50">{label}</p>
    <p className="text-3xl font-serif text-wellness-dark leading-none">{value}</p>
    <p className="text-[8px] font-bold tracking-[0.2em] uppercase text-wellness-sage/30 mt-1">{subtitle}</p>
  </div>
);

const ProgressCard = ({ week, title, desc, img, active }) => (
  <motion.div 
    whileHover={{ y: -8, transition: { duration: 0.4 } }}
    className={`relative flex-1 rounded-[3rem] p-8 border transition-all duration-1000 overflow-hidden group cursor-pointer flex flex-col justify-end shadow-xl ${active ? 'border-wellness-sage/30 shadow-[0_40px_80px_-15px_rgba(26,47,35,0.3)] scale-[1.02]' : 'border-wellness-sage/10 opacity-60 hover:opacity-100 shadow-wellness-dark/5'}`}
  >
    <img src={img} className="absolute inset-0 w-full h-full object-cover transition-transform duration-[3s] group-hover:scale-110" alt={title} />
    <div className={`absolute inset-0 bg-gradient-to-t ${active ? 'from-wellness-dark via-wellness-dark/20' : 'from-wellness-dark/80'} to-transparent opacity-90`}></div>
    
    <div className="relative z-10 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-700">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-[9px] font-black tracking-[0.5em] uppercase text-wellness-sage">{week}</span>
        {active && <span className="px-2 py-0.5 rounded-full bg-wellness-sage text-wellness-dark text-[8px] font-black uppercase tracking-widest">Active</span>}
      </div>
      <h4 className="text-2xl font-serif text-white mb-3">{title}</h4>
      <p className="text-[11px] text-white/40 leading-relaxed font-sans opacity-0 group-hover:opacity-100 transition-opacity duration-700 max-w-[80%]">
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
    <div className="h-screen overflow-hidden transition-all duration-1000 bg-white bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')] selection:bg-wellness-sage/20 relative">
      <div className="w-full h-full max-w-[1600px] mx-auto p-3 md:p-6 relative z-10 flex flex-col">
        <div className="flex flex-col lg:flex-row gap-4 h-full min-h-0">
          
          {/* --- SIDEBAR SECTION --- */}
          <aside className="w-full lg:w-[360px] xl:w-[400px] flex flex-col gap-4 h-full min-h-0">
            
            {/* Profile Card */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              whileHover={{ y: -8, transition: { duration: 0.4 } }}
              className="bg-white border border-wellness-sage/20 rounded-[2.5rem] p-6 shadow-[0_50px_100px_-20px_rgba(26,47,35,0.12)] flex flex-col items-center relative overflow-hidden group flex-shrink-0"
            >
              <div className="absolute top-0 right-0 p-8 flex gap-4 items-center">
                <Leaf className="w-4 h-4 text-wellness-sage/30 rotate-12" />
              </div>

              <div className="relative w-32 h-32 mb-6">
                <motion.div
                  animate={{ 
                    rotate: 360,
                    borderColor: ['#A3B18A', '#588157', '#344E41', '#A3B18A'] 
                  }}
                  transition={{ 
                    rotate: { duration: 12, repeat: Infinity, ease: "linear" },
                    borderColor: { duration: 4, repeat: Infinity, ease: "linear" }
                  }}
                  className="absolute inset-[-12px] rounded-full border-2 border-dashed opacity-50 shadow-[0_0_15px_rgba(163,177,138,0.2)]"
                />
                <motion.div
                  animate={{ 
                    rotate: -360,
                    borderColor: ['#344E41', '#A3B18A', '#5A5A40', '#344E41']
                  }}
                  transition={{ 
                    rotate: { duration: 20, repeat: Infinity, ease: "linear" },
                    borderColor: { duration: 5, repeat: Infinity, ease: "linear" }
                  }}
                  className="absolute inset-[-6px] rounded-full border-[1.5px] opacity-40 shadow-[0_0_10px_rgba(52,78,65,0.1)]"
                />

                <div className="absolute inset-0 bg-wellness-sage/10 rounded-full scale-110 group-hover:scale-125 transition-transform duration-1000"></div>
                <img 
                  src={user.profilePic || `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=500`} 
                  alt="Profile" 
                  className="relative w-full h-full object-cover rounded-full border-[6px] border-white ring-1 ring-wellness-sage/20 shadow-2xl"
                />
              </div>

              <span className="text-[9px] font-black tracking-[0.5em] uppercase text-wellness-sage/60 mb-3 bg-wellness-sage/5 px-4 py-1.5 rounded-full">
                Verified Profile
              </span>
              <h2 className="text-3xl font-serif text-wellness-dark tracking-tight mb-2">
                {user.username}
              </h2>
              
              <div className="mt-8 pt-8 border-t border-wellness-sage/10 w-full flex justify-between px-4">
                <Stat label="Goal" value="92%" subtitle="Adherence" />
                <div className="w-[1px] h-12 bg-wellness-sage/10 self-center"></div>
                <Stat label="Streak" value="14d" subtitle="Consistency" />
              </div>
            </motion.div>

            {/* Target Focus */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              whileHover={{ y: -8, transition: { duration: 0.4 } }}
              className="relative bg-white border border-wellness-sage/20 rounded-[2.5rem] p-8 shadow-[0_60px_120px_-30px_rgba(26,47,35,0.15)] flex flex-col flex-1 min-h-0 overflow-hidden group"
            >
              <img 
                src="https://images.unsplash.com/photo-1547514701-42782101795e?auto=format&fit=crop&q=80&w=1000" 
                className="absolute inset-0 w-full h-full object-cover opacity-5 grayscale group-hover:scale-110 transition-transform duration-[3s]"
                alt="Organic Nourishment"
              />
              
              <div className="relative z-10 flex flex-col h-full uppercase">
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <span className="text-[10px] font-bold tracking-[0.4em] uppercase text-wellness-sage mb-4 block">Target Focus</span>
                    <h3 className="text-2xl font-serif text-wellness-dark leading-tight">Nourishment & <br/> <i className="italic">Cellular</i> Repair</h3>
                  </div>
                  <FlaskConical className="w-6 h-6 text-wellness-sage/40" />
                </div>
                
                <div className="mt-auto space-y-6">
                  <div className="bg-wellness-sage/5 backdrop-blur-xl rounded-[2rem] p-6 border border-wellness-sage/10">
                    <div className="flex justify-between items-end mb-4">
                      <div className="flex items-center gap-3">
                        <Droplet className="w-4 h-4 text-wellness-sage" />
                        <span className="text-[10px] font-bold tracking-[0.2em] text-wellness-sage uppercase">Hydration Level</span>
                      </div>
                      <span className="text-xl font-serif text-wellness-dark">2.4 <span className="text-xs text-wellness-sage/40">/ 3L</span></span>
                    </div>
                    <div className="w-full bg-wellness-sage/10 h-1.5 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: '80%' }}
                        transition={{ duration: 1.5, delay: 0.5 }}
                        className="bg-wellness-sage h-full rounded-full shadow-[0_0_15px_rgba(163,177,138,0.4)]"
                      ></motion.div>
                    </div>
                  </div>

                  <button 
                    onClick={() => { localStorage.clear(); navigate('/'); }}
                    className="w-full flex items-center justify-between py-5 px-8 border border-wellness-sage/10 rounded-2xl group/btn hover:bg-wellness-sage/5 transition-all duration-500"
                  >
                    <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-wellness-sage/60 group-hover/btn:text-wellness-dark">End Session</span>
                    <LogOut className="w-4 h-4 text-wellness-sage/40 group-hover/btn:text-wellness-dark group-hover/btn:translate-x-1 transition-all" />
                  </button>
                </div>
              </div>
            </motion.div>
          </aside>

          {/* --- MAIN CONTENT AREA --- */}
          <main className="flex-1 flex flex-col gap-4 h-full min-h-0">
            
            {/* Banner Section */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1 }}
              whileHover={{ y: -10, transition: { duration: 0.5 } }}
              className="flex-[0.7] min-h-0 relative rounded-[3rem] p-10 md:p-12 flex flex-col justify-center overflow-hidden shadow-[0_80px_150px_-40px_rgba(26,47,35,0.25)] group"
            >
               <img 
                 src="https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&q=80&w=2000" 
                 className="absolute inset-0 w-full h-full object-cover transition-transform duration-[4s] group-hover:scale-110"
                 alt="Gourmet Organic Meal"
               />
               <div className="absolute inset-0 bg-gradient-to-r from-wellness-dark/95 via-wellness-dark/60 to-transparent"></div>
               
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
                     className="text-[10px] font-bold tracking-[0.5em] uppercase text-wellness-sage mb-6 block"
                   >
                     Curated Nutrients
                   </motion.span>
                   
                   <h1 className="text-4xl md:text-6xl font-serif text-white leading-[0.9] tracking-tight mb-10">
                     <motion.div
                       animate={{ y: [0, -5, 0] }}
                       transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                     >
                       <motion.span
                          variants={{ hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0 } }}
                          className="block mb-2 text-white/90"
                       >
                         Sophisticated
                       </motion.span>
                     </motion.div>
                     <motion.div
                       animate={{ y: [0, 5, 0] }}
                       transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                     >
                       <motion.span
                          variants={{ hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0 } }}
                          className="block"
                       >
                         <i className="font-serif italic shimmer-text drop-shadow-[0_0_20px_rgba(163,177,138,0.4)]">organic</i>
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
                        className="bg-wellness-bg text-wellness-dark px-10 py-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.4em] hover:bg-wellness-accent hover:text-white transition-all duration-700 shadow-2xl flex items-center gap-4"
                      >
                        Plan Weekly
                        <ChevronRight className="w-4 h-4" />
                      </button>
                      <div className="flex items-center gap-4 text-white/40">
                        <Wind className="w-5 h-5" />
                        <span className="text-[9px] uppercase tracking-widest font-bold">Oxygenated Intake</span>
                      </div>
                   </motion.div>
                 </motion.div>
               </div>
            </motion.div>

            {/* Tracking Grid */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.4 }}
              whileHover={{ y: -6, transition: { duration: 0.4 } }}
              className="flex-1 bg-white border border-wellness-sage/10 rounded-[3rem] p-8 md:p-10 shadow-[0_40px_120px_-20px_rgba(26,47,35,0.1)] flex flex-col min-h-0 overflow-hidden"
            >
              <header className="flex justify-between items-end mb-8 px-4">
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <Activity className="w-4 h-4 text-wellness-sage" />
                    <span className="text-[10px] font-black tracking-[0.4em] uppercase text-wellness-sage">Progression Registry</span>
                  </div>
                  <h4 className="text-3xl font-serif text-wellness-dark tracking-tighter">Active Protocols</h4>
                </div>
                <button className="group flex items-center gap-4 text-[10px] font-black tracking-[0.4em] uppercase text-wellness-accent hover:text-wellness-dark transition-all">
                  see full history
                  <div className="w-8 h-[1px] bg-wellness-accent group-hover:w-12 transition-all"></div>
                </button>
              </header>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 min-h-0">
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