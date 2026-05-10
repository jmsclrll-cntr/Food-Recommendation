import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, User, Droplets, ArrowRight, CheckCircle2, Circle, Loader2, Utensils, Eye } from 'lucide-react';
import axios from 'axios';

// Animation Variants for a high-end feel
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.1 }
  },
  exit: { opacity: 0, y: 20, transition: { duration: 0.3 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100, damping: 15 } }
};

const sidebarVariants = {
  hidden: { opacity: 0, x: -30 },
  visible: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 80, damping: 20 } }
};

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [dailyDiet, setDailyDiet] = useState(null);
  const [loadingDiet, setLoadingDiet] = useState(true);
  const [completedMeals, setCompletedMeals] = useState({
    breakfast: false,
    lunch: false,
    dinner: false
  });
  const navigate = useNavigate();

  const today = useMemo(() => new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(new Date()), []);

  useEffect(() => {
    const data = localStorage.getItem('user');
    if (!data) return navigate('/');
    const parsedUser = JSON.parse(data);
    setUser(parsedUser);

    // Fetch daily diet from the new backend endpoint
    const userId = parsedUser.id || parsedUser.uid || parsedUser._id;
    axios.get(`http://localhost:5000/api/diets/day/${today}/${userId}`)
      .then(res => {
        setDailyDiet(res.data.meals);
        setLoadingDiet(false);
      })
      .catch(err => {
        console.error("No plan for today:", err);
        setLoadingDiet(false);
      });
      
    // Load local progress if available
    const savedProgress = localStorage.getItem(`progress_${today}_${userId}`);
    if (savedProgress) setCompletedMeals(JSON.parse(savedProgress));
  }, [navigate, today]);

  const toggleMeal = (mealType) => {
    const nextState = { ...completedMeals, [mealType]: !completedMeals[mealType] };
    setCompletedMeals(nextState);
    const userId = user.id || user.uid || user._id;
    localStorage.setItem(`progress_${today}_${userId}`, JSON.stringify(nextState));
  };

  const progressPercentage = useMemo(() => {
    const completed = Object.values(completedMeals).filter(Boolean).length;
    return Math.round((completed / 3) * 100);
  }, [completedMeals]);

  // Handler for smooth navigation
  const handleNav = (path) => {
    navigate(path);
  };

  if (!user) return null;

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="h-screen w-full bg-[#f5faf4] text-[#1c3a1c] font-sans antialiased p-10 overflow-hidden flex gap-10"
    >
      
      {/* --- SIDEBAR SECTION --- */}
      <motion.aside variants={sidebarVariants} className="w-[380px] flex flex-col gap-6 h-full">
        
        <header className="flex items-center gap-4 mb-4 flex-shrink-0">
          <div className="text-left">
            <h2 className="font-serif text-2xl italic">NutriFind</h2>
            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[#6a9966]">User Dashboard</p>
          </div>
        </header>

        {/* Profile Card */}
        <motion.div 
          whileHover={{ y: -5, borderColor: '#8ecb84' }}
          whileTap={{ scale: 0.98 }}
          onClick={() => handleNav('/profile')}
          className="bg-white rounded-xl p-8 border border-[#ddd8ce] shadow-sm flex flex-col items-center cursor-pointer group transition-all duration-300"
        >
          <div className="relative w-24 h-24 mb-6">
            <motion.div 
              initial={{ scale: 0.8 }} animate={{ scale: 1 }}
              className="absolute inset-0 bg-[#8ecb84]/20 rounded-full scale-110 group-hover:scale-125 transition-transform duration-700"
            />
            <img 
              src={user.profilePic || `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=500`} 
              alt="Profile" 
              className="relative w-full h-full object-cover rounded-full border-2 border-white shadow-sm"
            />
            <div className="absolute bottom-0 right-0 bg-[#2d5a27] p-1.5 rounded-full text-white border-2 border-white">
                <User size={12} />
            </div>
          </div>
          <span className="text-[9px] font-bold tracking-[0.3em] uppercase text-[#6a9966] mb-1 text-center">Authenticated Member</span>
          <h2 className="font-serif text-xl italic mb-6">{user.username}</h2>
          
          <div className="pt-6 border-t border-[#f5faf4] w-full flex justify-around">
            <div className="text-center">
                <p className="text-[8px] font-black uppercase tracking-widest text-[#5a7054] mb-1">Today's Focus</p>
                <p className="text-sm font-bold">{progressPercentage}%</p>
            </div>
            <div className="text-center">
                <p className="text-[8px] font-black uppercase tracking-widest text-[#5a7054] mb-1">Streak</p>
                <p className="text-sm font-bold">14 Days</p>
            </div>
          </div>
        </motion.div>

        {/* Hydration Card */}
        <motion.div variants={itemVariants} className="bg-[#1c3a1c] rounded-xl p-8 text-[#e8f4e5] shadow-lg flex-1 flex flex-col justify-between relative overflow-hidden group">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4">
                <Droplets size={14} className="text-[#8ecb84]" />
                <span className="text-[9px] font-bold tracking-[0.3em] uppercase text-[#6a9966]">Daily Hydration</span>
            </div>
            <h3 className="font-serif text-2xl italic leading-tight mb-4">Nourishment & <br/> Cellular Repair</h3>
            
            <div className="space-y-3 mt-8">
              <div className="flex justify-between text-[9px] font-bold tracking-[0.2em] text-[#8ecb84]">
                <span>PROGRESS</span>
                <span>2.4 / 3.0 L</span>
              </div>
              <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                <motion.div 
                    initial={{ width: 0 }} 
                    animate={{ width: '80%' }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className="bg-[#8ecb84] h-full rounded-full"
                />
              </div>
            </div>
          </div>

          <button 
            onClick={() => { localStorage.clear(); navigate('/'); }}
            className="relative z-10 w-full py-4 border border-white/10 rounded-lg text-[9px] font-bold uppercase tracking-[0.3em] text-[#6a9966] hover:text-white hover:bg-white/5 transition-all flex items-center justify-center gap-2"
          >
            <LogOut size={12} />
            Sign Out
          </button>
        </motion.div>
      </motion.aside>

      {/* --- MAIN CONTENT AREA --- */}
      <motion.main variants={containerVariants} className="flex-1 flex flex-col gap-8 h-full">
        
        {/* Banner Section */}
        <motion.div 
          variants={itemVariants}
          className="h-[300px] relative rounded-xl overflow-hidden shadow-sm group"
        >
           <img 
             src="https://images.unsplash.com/photo-1543332164-6e82f3553c46?auto=format&fit=crop&q=80&w=2000" 
             className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
             alt="Vibrant Greens"
           />
           <div className="absolute inset-0 bg-gradient-to-r from-[#1c3a1c]/90 via-[#1c3a1c]/40 to-transparent"></div>
           
           <div className="relative z-10 h-full flex flex-col justify-center px-12">
             <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[9px] font-bold tracking-[0.4em] uppercase text-[#8ecb84] mb-4 block">Curated Nutrition</motion.span>
             <h1 className="font-serif text-5xl italic text-white leading-[1.1] mb-8">
               Sophisticated <br/> organic wellness.
             </h1>
                <div className="flex gap-4">
                  <motion.button 
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleNav('/generate-weekly')}
                      className="w-fit bg-[#2d5a27] text-white px-8 py-4 rounded-lg text-[10px] font-bold uppercase tracking-[0.3em] hover:bg-[#1c3a1c] transition-all flex items-center gap-3 shadow-xl"
                  >
                      Generate Weekly Diet Plan
                      <ArrowRight size={14} />
                  </motion.button>

                  <motion.button 
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleNav('/view-weekly')}
                      className="w-fit bg-white/10 backdrop-blur-md text-white border border-white/20 px-8 py-4 rounded-lg text-[10px] font-bold uppercase tracking-[0.3em] hover:bg-white/20 transition-all flex items-center gap-3 shadow-xl"
                  >
                      View Weekly Diet Plan
                      <Eye size={14} className="text-[#8ecb84]" />
                  </motion.button>
                </div>
           </div>
        </motion.div>

        {/* Daily Diet Tracking Section */}
        <motion.div 
          variants={itemVariants}
          className="flex-1 bg-white rounded-xl p-10 border border-[#ddd8ce] shadow-sm flex flex-col overflow-hidden"
        >
          <header className="flex justify-between items-end mb-8">
            <div>
              <span className="text-[9px] font-black uppercase tracking-[0.3em] text-[#6a9966] mb-2 block">{today} Protocol</span>
              <h4 className="font-serif text-3xl italic text-[#1c3a1c]">Daily Intake Tracking</h4>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-[8px] font-black uppercase tracking-widest text-gray-400 mb-1">Daily Completion</p>
                <p className="text-sm font-bold text-[#2d5a27]">{progressPercentage}%</p>
              </div>
              <div className="w-32 bg-[#f5faf4] h-2 rounded-full overflow-hidden border border-[#ddd8ce]">
                 <motion.div 
                    initial={{ width: 0 }} 
                    animate={{ width: `${progressPercentage}%` }}
                    className="h-full bg-[#8ecb84]"
                 />
              </div>
            </div>
          </header>
          
          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
            {loadingDiet ? (
                <div className="h-full flex flex-col items-center justify-center opacity-40">
                    <Loader2 className="animate-spin mb-4" />
                    <p className="text-xs uppercase font-bold tracking-widest">Synchronizing Plan...</p>
                </div>
            ) : dailyDiet ? (
                <div className="grid grid-cols-3 gap-6">
                    {['breakfast', 'lunch', 'dinner'].map((meal) => (
                        <div key={meal} className={`p-6 rounded-2xl border-2 transition-all duration-500 flex flex-col ${completedMeals[meal] ? 'border-[#8ecb84] bg-[#fbfdfa]' : 'border-[#f5faf4] bg-[#fdfdfc]'}`}>
                            <div className="flex justify-between items-start mb-6">
                                <div className="p-3 bg-white rounded-xl border shadow-sm text-[#2d5a27]">
                                    <Utensils size={18} />
                                </div>
                                <button onClick={() => toggleMeal(meal)} className="transition-transform active:scale-90">
                                    {completedMeals[meal] ? (
                                        <CheckCircle2 size={24} className="text-[#2d5a27]" />
                                    ) : (
                                        <Circle size={24} className="text-gray-200" />
                                    )}
                                </button>
                            </div>
                            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#6a9966] mb-2">{meal}</span>
                            <div className="flex-1 space-y-3">
                                {dailyDiet[meal].map((item, idx) => (
                                    <div key={idx} className="flex flex-col">
                                        <p className="text-xs font-bold text-[#1c3a1c] truncate">{item.name}</p>
                                        <p className="text-[10px] text-gray-400">{item.calories} kcal</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-12 bg-[#fbfdfa] rounded-2xl border-2 border-dashed">
                    <p className="font-serif text-xl italic mb-4">No diet plan active for today.</p>
                    <button onClick={() => handleNav('/generate-weekly')} className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#2d5a27] hover:underline transition-all">Generate your first plan →</button>
                </div>
            )}
          </div>
        </motion.div>
      </motion.main>
    </motion.div>
  );
};

export default Dashboard;