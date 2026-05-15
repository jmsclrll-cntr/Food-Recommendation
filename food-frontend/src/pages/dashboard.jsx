import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LogOut,
  User,
  Droplets,
  ArrowRight,
  CheckCircle2,
  Circle,
  Loader2,
  Utensils,
  Eye,
  Moon,
  Sun,
  Trophy,
  PartyPopper // Now used in the JSX below
} from 'lucide-react';
import axios from 'axios';

// Animation Variants
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
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 100, damping: 15 }
  }
};

const sidebarVariants = {
  hidden: { opacity: 0, x: -30 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { type: 'spring', stiffness: 80, damping: 20 }
  }
};

const Dashboard = () => {
  const navigate = useNavigate();

  const today = useMemo(
    () =>
      new Intl.DateTimeFormat('en-US', {
        weekday: 'long'
      }).format(new Date()),
    []
  );

  // FIXED: Initializing directly from localStorage to solve the "cascading render" error
  // Removed 'setUser' because it is no longer used after this change
  const [user] = useState(() => {
    const data = localStorage.getItem('user');
    return data ? JSON.parse(data) : null;
  });

  const [completedItems, setCompletedItems] = useState(() => {
    const data = localStorage.getItem('user');
    if (!data) return {};
    const parsedUser = JSON.parse(data);
    const userId = parsedUser.id || parsedUser.uid || parsedUser._id;
    const savedProgress = localStorage.getItem(`progress_${today}_${userId}`);
    return savedProgress ? JSON.parse(savedProgress) : {};
  });

  const [dailyDiet, setDailyDiet] = useState(null);
  const [loadingDiet, setLoadingDiet] = useState(true);

  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });

  useEffect(() => {
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }

    const userId = user.id || user.uid || user._id;

    axios
      .get(`http://localhost:5000/api/diets/day/${today}/${userId}`)
      .then((res) => {
        setDailyDiet(res.data.meals);
        setLoadingDiet(false);
      })
      .catch((err) => {
        console.error('No plan for today:', err);
        setLoadingDiet(false);
      });
  }, [navigate, today, user]);

  const toggleItem = (mealType, index) => {
    const itemKey = `${mealType}-${index}`;
    if (completedItems[itemKey]) return;

    const nextState = {
      ...completedItems,
      [itemKey]: true
    };

    setCompletedItems(nextState);

    const userId = user.id || user.uid || user._id;

    localStorage.setItem(
      `progress_${today}_${userId}`,
      JSON.stringify(nextState)
    );
  };

  const progressPercentage = useMemo(() => {
    if (!dailyDiet) return 0;
    
    const mealCategories = ['breakfast', 'lunch', 'dinner'];
    const totalItems = mealCategories.reduce((acc, meal) => {
      return acc + (Array.isArray(dailyDiet[meal]) ? dailyDiet[meal].length : 0);
    }, 0);

    if (totalItems === 0) return 0;

    let completedCount = 0;
    mealCategories.forEach(meal => {
      if (Array.isArray(dailyDiet[meal])) {
        dailyDiet[meal].forEach((_, idx) => {
          if (completedItems[`${meal}-${idx}`]) {
            completedCount++;
          }
        });
      }
    });

    return Math.round((completedCount / totalItems) * 100);
  }, [completedItems, dailyDiet]);

  const handleNav = (path) => {
    navigate(path);
  };

  if (!user) return null;

  const cardBg = darkMode ? 'bg-[#121212]/90' : 'bg-white/90';
  const border = darkMode ? 'border-white/10' : 'border-[#ddd8ce]';
  const textMain = darkMode ? 'text-white' : 'text-[#1c3a1c]';
  const textSub = darkMode ? 'text-white/60' : 'text-[#5a7054]';

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className={`h-screen w-full font-sans antialiased p-10 overflow-hidden flex gap-10 transition-all duration-500 ${
        darkMode ? 'bg-[#0b0b0b] text-white' : 'bg-[#f5faf4] text-[#1c3a1c]'
      }`}
    >
      <motion.aside variants={sidebarVariants} className="w-[380px] flex flex-col gap-6 h-full">
        <header className="flex items-center justify-between mb-4 flex-shrink-0">
          <div className="text-left">
            <h2 className={`font-serif text-2xl italic ${textMain}`}>NutriFind</h2>
            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[#6a9966]">User Dashboard</p>
          </div>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`p-2.5 rounded-xl backdrop-blur-md transition-all ${
              darkMode ? 'bg-white/10 text-yellow-400 hover:bg-white/20' : 'bg-black/10 text-[#1c3a1c] hover:bg-black/20'
            }`}
          >
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </header>

        <motion.div
          whileHover={{ y: -5 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => handleNav('/profile')}
          className={`${cardBg} rounded-xl p-8 border ${border} shadow-sm flex flex-col items-center cursor-pointer group transition-all duration-300 backdrop-blur-xl`}
        >
          <div className="relative w-24 h-24 mb-6">
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className={`absolute inset-0 rounded-full scale-110 group-hover:scale-125 transition-transform duration-700 ${
                darkMode ? 'bg-[#8ecb84]/20' : 'bg-[#8ecb84]/10'
              }`}
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
          <span className="text-[9px] font-bold tracking-[0.3em] uppercase text-[#6a9966] mb-1 text-center"></span>
          <h2 className={`font-serif text-xl italic mb-6 ${textMain}`}>{user.username}</h2>
          <div className={`pt-6 border-t w-full flex justify-around ${border}`}>
            <div className="text-center">
              <p className={`text-[8px] font-black uppercase tracking-widest mb-1 ${textSub}`}>Today's Focus</p>
              <p className={`text-sm font-bold ${textMain}`}>{progressPercentage}%</p>
            </div>
            <div className="text-center">
              <p className={`text-[8px] font-black uppercase tracking-widest mb-1 ${textSub}`}>Streak</p>
              <p className={`text-sm font-bold ${textMain}`}>14 Days</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className={`rounded-xl p-8 shadow-lg flex-1 flex flex-col justify-between relative overflow-hidden group transition-all duration-500 ${
            darkMode ? 'bg-[#121212] text-white border border-white/10' : 'bg-[#1c3a1c] text-[#e8f4e5]'
          }`}
        >
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4">
              <Droplets size={14} className="text-[#8ecb84]" />
              <span className="text-[9px] font-bold tracking-[0.3em] uppercase text-[#6a9966]">Daily Hydration</span>
            </div>
            <h3 className="font-serif text-2xl italic leading-tight mb-4">Nourishment & <br /> Cellular Repair</h3>
            <div className="space-y-3 mt-8">
              <div className="flex justify-between text-[9px] font-bold tracking-[0.2em] text-[#8ecb84]">
                <span>PROGRESS</span>
                <span>2.4 / 3.0 L</span>
              </div>
              <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: '80%' }}
                  transition={{ duration: 1.5, ease: 'easeOut' }}
                  className="bg-[#8ecb84] h-full rounded-full"
                />
              </div>
            </div>
          </div>
          <button
            onClick={() => { localStorage.clear(); navigate('/'); }}
            className={`relative z-10 w-full py-4 rounded-lg text-[9px] font-bold uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-2 border ${
              darkMode ? 'border-white/10 text-white/70 hover:bg-white/5 hover:text-white' : 'border-white/10 text-[#6a9966] hover:text-white hover:bg-white/5'
            }`}
          >
            <LogOut size={12} /> Sign Out
          </button>
        </motion.div>
      </motion.aside>

      <motion.main variants={containerVariants} className="flex-1 flex flex-col gap-8 h-full">
        <motion.div
          variants={itemVariants}
          className={`h-[300px] relative rounded-xl overflow-hidden shadow-sm group border transition-all duration-500 ${
            darkMode ? 'border-white/10' : 'border-[#ddd8ce]'
          }`}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-[#1c3a1c]/90 via-[#1c3a1c]/40 to-transparent"></div>
          <div className="relative z-10 h-full flex flex-col justify-center px-12">
            <span className="text-[9px] font-bold tracking-[0.4em] uppercase text-[#8ecb84] mb-4 block"></span>
            <h1 className="font-serif text-5xl italic text-white leading-[1.1] mb-8">Sophisticated <br /> organic wellness.</h1>
            <div className="flex gap-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleNav('/generate-weekly')}
                className="w-fit bg-[#2d5a27] text-white px-8 py-4 rounded-lg text-[10px] font-bold uppercase tracking-[0.3em] hover:bg-[#1c3a1c] transition-all flex items-center gap-3 shadow-xl"
              >
                Generate Weekly Diet Plan <ArrowRight size={14} />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleNav('/view-weekly')}
                className="w-fit bg-white/10 backdrop-blur-md text-white border border-white/20 px-8 py-4 rounded-lg text-[10px] font-bold uppercase tracking-[0.3em] hover:bg-white/20 transition-all flex items-center gap-3 shadow-xl"
              >
                View Weekly Diet Plan <Eye size={14} className="text-[#8ecb84]" />
              </motion.button>
            </div>
          </div>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className={`${cardBg} rounded-xl p-10 border ${border} shadow-sm flex flex-col overflow-hidden backdrop-blur-xl transition-all duration-500`}
        >
          <header className="flex justify-between items-end mb-8 relative">
            <div>
              <span className="text-[9px] font-black uppercase tracking-[0.3em] text-[#6a9966]">{today} Protocol</span>
              <h4 className={`font-serif text-3xl italic ${textMain}`}>Daily Intake Tracking</h4>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className={`text-[8px] font-black uppercase tracking-widest mb-1 ${textSub}`}>Daily Completion</p>
                <p className={`text-sm font-bold ${darkMode ? 'text-[#8ecb84]' : 'text-[#2d5a27]'}`}>{progressPercentage}%</p>
              </div>
              <div className={`w-32 h-2 rounded-full overflow-hidden border ${darkMode ? 'bg-white/5 border-white/10' : 'bg-[#f5faf4] border-[#ddd8ce]'}`}>
                <motion.div initial={{ width: 0 }} animate={{ width: `${progressPercentage}%` }} className="h-full bg-[#8ecb84]" />
              </div>
            </div>
          </header>

          <div className={`flex-1 ${progressPercentage === 100 ? 'overflow-hidden' : 'overflow-y-auto'} pr-2`}>
            {loadingDiet ? (
              <div className="h-full flex flex-col items-center justify-center opacity-40">
                <Loader2 className="animate-spin mb-4" />
                <p className="text-xs uppercase font-bold tracking-widest">Synchronizing Plan...</p>
              </div>
            ) : dailyDiet ? (
              <AnimatePresence mode="wait">
                {progressPercentage === 100 ? (
                  <motion.div key="success" initial={{ x: 500, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="flex flex-col items-center justify-center py-10 text-center h-full min-h-[400px]">
                    <div className="relative mb-8">
                        <div className="relative bg-[#2d5a27] p-8 rounded-full text-white shadow-2xl">
                          <Trophy size={64} />
                        </div>
                        {/* RESTORED: PartyPopper used here to fix ESLint error */}
                        <motion.div
                          animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
                          transition={{ repeat: Infinity, duration: 4 }}
                          className="absolute -top-4 -right-4 text-[#8ecb84] bg-black/20 p-2 rounded-full backdrop-blur-md"
                        >
                          <PartyPopper size={32} />
                        </motion.div>
                    </div>
                    <h3 className={`font-serif text-6xl italic mb-6 ${textMain}`}>Daily Protocol <br /> Achieved</h3>
                    <p className={`text-base max-w-lg mx-auto mb-12 opacity-80 ${textSub}`}>Dedication to organic wellness is paving the way for superior cellular repair.</p>
                    <button onClick={() => handleNav('/view-weekly')} className="bg-[#2d5a27] text-white px-12 py-5 rounded-2xl text-[11px] font-black uppercase tracking-[0.5em] shadow-2xl hover:bg-[#1c3a1c] transition-all">
                      Review Weekly Performance <ArrowRight size={14} className="inline-block ml-3" />
                    </button>
                  </motion.div>
                ) : (
                  <motion.div key="tasks" className="grid grid-cols-3 gap-6">
                    {['breakfast', 'lunch', 'dinner'].map((meal) => (
                      <div key={meal} className={`p-8 rounded-[32px] border-2 transition-all ${darkMode ? 'border-white/5 bg-[#121212]' : 'border-[#f5faf4] bg-[#fdfdfc]'}`}>
                        <div className="flex items-center gap-3 mb-8">
                          <div className={`p-3 rounded-2xl border ${darkMode ? 'bg-white/5 border-white/10 text-[#8ecb84]' : 'bg-white text-[#2d5a27]'}`}><Utensils size={18} /></div>
                          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#6a9966]">{meal}</span>
                        </div>
                        <div className="space-y-6">
                          {dailyDiet[meal].map((item, idx) => {
                            const isCompleted = completedItems[`${meal}-${idx}`];
                            return (
                              <div key={idx} className={`flex justify-between items-center transition-all ${isCompleted ? 'opacity-30 grayscale' : 'opacity-100'}`}>
                                <div className="flex-1 min-w-0 pr-4">
                                  <p className={`text-sm font-bold truncate ${textMain}`}>{item.name}</p>
                                  <p className={`text-[10px] ${darkMode ? 'text-white/40' : 'text-gray-400'}`}>{item.calories} kcal • {item.grams}g</p>
                                </div>
                                <button onClick={() => toggleItem(meal, idx)} disabled={isCompleted} className={isCompleted ? 'text-[#8ecb84]' : 'text-gray-300 hover:text-[#8ecb84]'}>
                                  {isCompleted ? <CheckCircle2 size={24} /> : <Circle size={24} />}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            ) : (
              <div className="h-full flex flex-col items-center justify-center p-12 rounded-2xl border-2 border-dashed border-white/10">
                <p className={`font-serif text-xl italic mb-4 ${textMain}`}>No diet plan active for today.</p>
                <button onClick={() => handleNav('/generate-weekly')} className="text-[10px] font-bold uppercase text-[#2d5a27]">Generate your first plan →</button>
              </div>
            )}
          </div>
        </motion.div>
      </motion.main>
    </motion.div>
  );
};

export default Dashboard;