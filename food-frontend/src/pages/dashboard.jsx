import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LogOut, User, Droplets, ArrowRight, CheckCircle2, Circle, Loader2, Utensils, Eye, Moon, Sun, Trophy, PartyPopper
} from 'lucide-react';
import axios from 'axios';
import { useDarkMode } from '../hooks/useDarkMode';
import { generateRandomAvatar } from '../utils/avatarGenerator';

// Neo-Brutalist Animation Variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  exit: { opacity: 0, y: 20 }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20, rotate: -2 },
  visible: { 
    opacity: 1, 
    y: 0, 
    rotate: 0, 
    transition: { type: 'spring', stiffness: 120, damping: 12 } 
  }
};

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [dailyDiet, setDailyDiet] = useState(null);
  const [loadingDiet, setLoadingDiet] = useState(true);
  const [completedItems, setCompletedItems] = useState({});
  const [darkMode, toggleDarkMode] = useDarkMode();

  const navigate = useNavigate();
  const today = useMemo(() => new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(new Date()), []);

  useEffect(() => {
    const data = localStorage.getItem('user');
    if (!data) return navigate('/');
    const parsedUser = JSON.parse(data);
    setUser(parsedUser);
    const userId = parsedUser.id || parsedUser.uid || parsedUser._id;

    axios.get(`http://localhost:5000/api/diets/day/${today}/${userId}`)
      .then((res) => {
        setDailyDiet(res.data.meals);
        setLoadingDiet(false);
      })
      .catch((err) => {
        console.error('No plan for today:', err);
        setLoadingDiet(false);
      });

    const savedProgress = localStorage.getItem(`progress_${today}_${userId}`);
    if (savedProgress) setCompletedItems(JSON.parse(savedProgress));
  }, [navigate, today]);

  // Logic to determine which avatar to show
  const displayAvatar = useMemo(() => {
    if (!user) return "";
    return user.profilePic || generateRandomAvatar(user.username || user.name || "U");
  }, [user]);

  const toggleItem = (mealType, index) => {
    const itemKey = `${mealType}-${index}`;
    if (completedItems[itemKey]) return;
    const nextState = { ...completedItems, [itemKey]: true };
    setCompletedItems(nextState);
    const userId = user.id || user.uid || user._id;
    localStorage.setItem(`progress_${today}_${userId}`, JSON.stringify(nextState));
  };

  const progressPercentage = useMemo(() => {
    if (!dailyDiet) return 0;
    const mealCategories = ['breakfast', 'lunch', 'dinner'];
    const totalItems = mealCategories.reduce((acc, meal) => acc + (Array.isArray(dailyDiet[meal]) ? dailyDiet[meal].length : 0), 0);
    if (totalItems === 0) return 0;
    let completedCount = 0;
    mealCategories.forEach(meal => {
      if (Array.isArray(dailyDiet[meal])) {
        dailyDiet[meal].forEach((_, idx) => { if (completedItems[`${meal}-${idx}`]) completedCount++; });
      }
    });
    return Math.round((completedCount / totalItems) * 100);
  }, [completedItems, dailyDiet]);

  const handleNav = (path) => navigate(path);

  // DESIGN HELPERS
  const cardBg = darkMode ? 'bg-[#3d2969]' : 'bg-white';
  const textMain = darkMode ? 'text-white' : 'text-[#2d1b4e]';
  const textSub = darkMode ? 'text-purple-200' : 'text-[#5c4b7f]';
  const borderStyle = 'border-[4px] border-black';
  const shadowStyle = 'shadow-[8px_8px_0px_#000]';

  if (!user) return null;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="h-screen w-full font-sans p-8 overflow-hidden flex flex-col md:flex-row gap-8 transition-all duration-500"
      style={{
        background: darkMode
          ? 'linear-gradient(135deg,#1d1436,#241744,#301c56)'
          : 'linear-gradient(135deg,#ffe9b3,#ffd86b,#ffb347)',
      }}
    >
      {/* SIDEBAR */}
      <motion.aside variants={itemVariants} className="w-full md:w-[360px] flex flex-col gap-6 h-full">
        {/* LOGO BOX */}
        <div className={`${cardBg} ${borderStyle} ${shadowStyle} p-6 rounded-[24px] flex items-center justify-between`}>
          <div>
            <h2 className={`text-2xl font-black ${textMain}`}>NutriFind</h2>
            <p className="text-[10px] font-black uppercase tracking-widest text-[#ffcf5a] drop-shadow-[1px_1px_0px_#000]">Member Hub</p>
          </div>
          <button onClick={toggleDarkMode} className={`w-10 h-10 rounded-full border-[3px] border-black flex items-center justify-center transition-all ${darkMode ? 'bg-[#ffcf5a] text-black' : 'bg-[#2b1d4d] text-white'}`}>
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>

        {/* PROFILE BLOCK */}
        <div 
          onClick={() => handleNav('/profile')}
          className={`${cardBg} ${borderStyle} ${shadowStyle} p-8 rounded-[30px] flex flex-col items-center cursor-pointer transition-transform hover:translate-x-[-2px] hover:translate-y-[-2px]`}
        >
          <div className="w-20 h-20 mb-4 border-[4px] border-black rounded-full overflow-hidden shadow-[4px_4px_0px_#000] bg-white">
            <img 
                src={displayAvatar} 
                alt="Profile" 
                className="w-full h-full object-cover" 
                onError={(e) => { e.target.src = generateRandomAvatar(user.username || "U"); }}
            />
          </div>
          <h3 className={`text-xl font-black mb-4 ${textMain}`}>{user.username || user.name}</h3>
          
          <div className="grid grid-cols-2 w-full gap-4 border-t-[3px] border-black pt-4">
            <div className="text-center">
              <p className={`text-[8px] font-black uppercase ${textSub}`}>Focus</p>
              <p className={`text-sm font-black ${textMain}`}>{progressPercentage}%</p>
            </div>
            <div className="text-center border-l-[3px] border-black">
              <p className={`text-[8px] font-black uppercase ${textSub}`}>Streak</p>
              <p className={`text-sm font-black ${textMain}`}>14 Days</p>
            </div>
          </div>
        </div>

        {/* HYDRATION BLOCK */}
        <div className={`flex-1 ${darkMode ? 'bg-[#ff7eb6]' : 'bg-[#7effd4]'} ${borderStyle} ${shadowStyle} rounded-[30px] p-8 flex flex-col justify-between overflow-hidden relative`}>
            <div className="absolute top-[-20px] right-[-20px] w-32 h-32 bg-white/20 rounded-full blur-2xl" />
            <div className="relative z-10">
                <div className="flex items-center gap-2 mb-2">
                    <Droplets size={16} className="text-black" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-black">Hydration Goal</span>
                </div>
                <h3 className="text-3xl font-black text-black leading-tight">Keep the <br/> Water Flowing.</h3>
                <div className="mt-6 bg-black h-4 rounded-full border-[2px] border-black p-[2px]">
                    <div className="h-full bg-white rounded-full" style={{ width: '80%' }}></div>
                </div>
            </div>

           <button 
  onClick={() => { 
    // ONLY remove the session/user, don't clear the whole storage!
    localStorage.removeItem('user'); 
    // Optional: if you have a token, remove it too
    // localStorage.removeItem('token'); 
    navigate('/'); 
  }} 
  className="w-full bg-black text-white py-4 rounded-[15px] font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors"
>
  <LogOut size={14} /> Sign Out
</button>
        </div>
      </motion.aside>

      {/* MAIN CONTENT */}
      <motion.main variants={containerVariants} className="flex-1 flex flex-col gap-8 h-full min-h-0">
        {/* BANNER */}
        <motion.div variants={itemVariants} className={`h-[280px] flex-shrink-0 relative ${borderStyle} ${shadowStyle} rounded-[35px] overflow-hidden group`}>
          <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-all" />
          <div className="relative z-10 h-full flex flex-col justify-center px-10">
            <h1 className="text-5xl font-black text-white leading-none mb-6 drop-shadow-[4px_4px_0px_#000]">
              YOUR DAILY <br/> FUEL STATION.
            </h1>
            <div className="flex gap-4">
              <button onClick={() => handleNav('/generate-weekly')} className="bg-[#ffcf5a] text-black border-[3px] border-black shadow-[4px_4px_0px_#000] px-6 py-3 font-black text-[11px] uppercase tracking-widest flex items-center gap-2 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all">
                Generate Plan <ArrowRight size={14} />
              </button>
              <button onClick={() => handleNav('/view-weekly')} className="bg-white text-black border-[3px] border-black shadow-[4px_4px_0px_#000] px-6 py-3 font-black text-[11px] uppercase tracking-widest flex items-center gap-2 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all">
                View Weekly <Eye size={14} />
              </button>
            </div>
          </div>
        </motion.div>

        {/* DIET TRACKING */}
        <motion.div variants={itemVariants} className={`${cardBg} ${borderStyle} ${shadowStyle} rounded-[35px] p-8 flex flex-col flex-1 overflow-hidden`}>
          <div className="flex flex-col sm:flex-row justify-between items-end mb-8 gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-[#ffcf5a] drop-shadow-[1px_1px_0px_#000] mb-1">{today} Mission</p>
              <h4 className={`text-4xl font-black ${textMain}`}>Protocol Tracker</h4>
            </div>
            <div className="flex flex-col items-end gap-2">
              <p className={`text-[10px] font-black uppercase ${textSub}`}>Progress: {progressPercentage}%</p>
              <div className="w-48 h-6 bg-black rounded-full border-[3px] border-black p-[3px]">
                <div className="h-full bg-[#ffcf5a] rounded-full transition-all duration-500" style={{ width: `${progressPercentage}%` }} />
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar">
            {loadingDiet ? (
               <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-[#ffcf5a]" size={40} /></div>
            ) : dailyDiet ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {['breakfast', 'lunch', 'dinner'].map((meal) => (
                  <div key={meal} className={`bg-white/5 border-[3px] border-black rounded-[25px] p-6 shadow-[5px_5px_0px_#000]`}>
                    <div className="flex items-center gap-2 mb-6">
                        <Utensils size={18} className="text-[#ffcf5a]" />
                        <span className={`text-[12px] font-black uppercase tracking-widest ${textMain}`}>{meal}</span>
                    </div>
                    
                    <div className="space-y-4">
                      {dailyDiet[meal] && dailyDiet[meal].map((item, idx) => {
                        const itemKey = `${meal}-${idx}`;
                        const isDone = completedItems[itemKey];
                        return (
                          <div 
                            key={idx} 
                            onClick={() => toggleItem(meal, idx)}
                            className={`p-4 border-[3px] border-black rounded-[18px] cursor-pointer transition-all ${isDone ? 'bg-[#ffcf5a]/20 opacity-50' : 'bg-white hover:bg-[#ffcf5a]/10 shadow-[3px_3px_0px_#000]'}`}
                          >
                            <div className="flex justify-between items-center">
                              <div className="min-w-0">
                                <p className="text-sm font-black text-black truncate">{item.name}</p>
                                <p className="text-[10px] font-bold text-gray-500">{item.calories} kcal</p>
                              </div>
                              {isDone ? <CheckCircle2 className="text-green-600" size={24} /> : <Circle className="text-gray-300" size={24} />}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
                <div className="h-full flex flex-col items-center justify-center border-[4px] border-dashed border-black/20 rounded-[30px] py-20">
                    <p className={`text-xl font-black ${textSub} mb-4`}>NO ACTIVE PROTOCOL</p>
                    <button onClick={() => handleNav('/generate-weekly')} className="text-sm font-black underline uppercase tracking-widest">Generate Now →</button>
                </div>
            )}
          </div>
        </motion.div>
      </motion.main>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 10px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: black; border-radius: 20px; border: 3px solid ${darkMode ? '#2b1d4d' : '#fff7e8'}; }
        .custom-scrollbar { scrollbar-width: thin; scrollbar-color: black transparent; }
      ` }} />
    </motion.div>
  );
};

export default Dashboard;