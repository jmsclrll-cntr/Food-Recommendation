import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LogOut, User, Droplets, ArrowRight, CheckCircle2, Circle, Loader2, Utensils, Eye, Moon, Sun, Trophy, PartyPopper
} from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { useDarkMode } from '../hooks/useDarkMode';
import { getThemeStyles } from '../theme/styles';

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
  const [user, setUser] = useState(null);
  const [dailyDiet, setDailyDiet] = useState(null);
  const [loadingDiet, setLoadingDiet] = useState(true);
  const [completedItems, setCompletedItems] = useState({});
  const [darkMode, toggleDarkMode] = useDarkMode();
  const [completedDays, setCompletedDays] = useState(0);
  const [imageErrors, setImageErrors] = useState({});

  const styles = getThemeStyles(darkMode);
  const { cardBg, border, textMain, textSub } = styles;

  const navigate = useNavigate();

  const today = useMemo(
    () =>
      new Intl.DateTimeFormat('en-US', {
        weekday: 'long'
      }).format(new Date()),
    []
  );

  const [currentImageIdx, setCurrentImageIdx] = useState(0);

  const getImageUrl = (url) => {
    if (!url) return 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=1000';
    try {
      if (url.includes('imgurl=') || url.includes('url=') || url.includes('q=')) {
        const urlObj = new URL(url);
        const imgUrl = urlObj.searchParams.get('imgurl') || urlObj.searchParams.get('url') || urlObj.searchParams.get('q');
        if (imgUrl) {
          let decoded = decodeURIComponent(imgUrl);
          if (!decoded.startsWith('http://') && !decoded.startsWith('https://')) {
            decoded = 'https://' + decoded;
          }
          return decoded;
        }
      }
    } catch (e) {
      console.error("Error parsing search image URL:", e);
    }
    return url;
  };

  const bannerImages = useMemo(() => {
    const images = [];
    if (dailyDiet) {
      ['breakfast', 'lunch', 'dinner'].forEach(meal => {
        if (Array.isArray(dailyDiet[meal])) {
          dailyDiet[meal].forEach(item => {
            const img = item.imageUrl || item.imageURL || item.image || item.imagePath;
            if (img && !img.includes('placeholder')) {
              images.push(getImageUrl(img));
            }
          });
        }
      });
    }
    if (images.length === 0) {
      return [
        "https://images.unsplash.com/photo-1543332164-6e82f3553c46?auto=format&fit=crop&q=80&w=2000",
        "https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&q=80&w=2000",
        "https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&q=80&w=2000",
        "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=2000"
      ];
    }
    return images;
  }, [dailyDiet]);

  useEffect(() => {
    if (bannerImages.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentImageIdx(prev => (prev + 1) % bannerImages.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [bannerImages]);

  useEffect(() => {
    const data = localStorage.getItem('user');

    if (!data) return navigate('/');

    const parsedUser = JSON.parse(data);
    setUser(parsedUser);

    const userId =
      parsedUser.id || parsedUser.uid || parsedUser._id;

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

    const savedProgress = localStorage.getItem(
      `progress_${today}_${userId}`
    );

    if (savedProgress) {
      setCompletedItems(JSON.parse(savedProgress));
    }

    // Load completed days count from localStorage
    const savedDays = localStorage.getItem(`completed_days_${userId}`);
    if (savedDays) setCompletedDays(parseInt(savedDays, 10));
  }, [navigate, today]);

  const toggleItem = (mealType, index) => {
    const itemKey = `${mealType}-${index}`;
    const nextCompleted = !completedItems[itemKey];

    const nextState = {
      ...completedItems,
      [itemKey]: nextCompleted
    };

    if (!nextCompleted) {
      delete nextState[itemKey];
    }

    setCompletedItems(nextState);

    const userId = user.id || user.uid || user._id;

    localStorage.setItem(
      `progress_${today}_${userId}`,
      JSON.stringify(nextState)
    );

    // Check if this toggle completes or breaks the day completion
    const mealCategories = ['breakfast', 'lunch', 'dinner'];
    if (dailyDiet) {
      const totalItems = mealCategories.reduce((acc, meal) =>
        acc + (Array.isArray(dailyDiet[meal]) ? dailyDiet[meal].length : 0), 0);
      
      const completedCount = Object.keys(nextState).filter(k => nextState[k]).length;
      const dayKey = `day_done_${today}_${userId}`;

      if (totalItems > 0 && completedCount >= totalItems) {
        if (!localStorage.getItem(dayKey)) {
          localStorage.setItem(dayKey, '1');
          const prev = parseInt(localStorage.getItem(`completed_days_${userId}`) || '0', 10);
          const next = prev + 1;
          localStorage.setItem(`completed_days_${userId}`, next.toString());
          setCompletedDays(next);
        }
      } else {
        if (localStorage.getItem(dayKey)) {
          localStorage.removeItem(dayKey);
          const prev = parseInt(localStorage.getItem(`completed_days_${userId}`) || '0', 10);
          const next = Math.max(0, prev - 1);
          localStorage.setItem(`completed_days_${userId}`, next.toString());
          setCompletedDays(next);
        }
      }
    }
  };

  const progressPercentage = useMemo(() => {
    if (!dailyDiet) return 0;
    
    // Explicitly count items in valid meal categories
    const mealCategories = ['breakfast', 'lunch', 'dinner'];
    const totalItems = mealCategories.reduce((acc, meal) => {
      return acc + (Array.isArray(dailyDiet[meal]) ? dailyDiet[meal].length : 0);
    }, 0);

    if (totalItems === 0) return 0;

    // Count how many of these specific items are completed
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

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className={`h-screen w-full font-sans antialiased p-6 overflow-hidden flex gap-6 transition-all duration-500 ${
        darkMode ? 'text-white' : 'text-[#1c3a1c]'
      }`}
      style={{
        backgroundImage: darkMode 
          ? 'linear-gradient(rgba(11, 11, 11, 0.88), rgba(11, 11, 11, 0.88)), url("/bg.png")' 
          : 'linear-gradient(rgba(245, 250, 244, 0.88), rgba(245, 250, 244, 0.88)), url("/bg.png")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* SIDEBAR */}
      <motion.aside
        variants={sidebarVariants}
        className="w-[330px] flex flex-col gap-6 h-full flex-shrink-0"
      >
        {/* HEADER */}
        <header className="flex items-center justify-between mb-4 flex-shrink-0">
          <div className="text-left">
            <h2 className={`font-serif text-2xl italic ${textMain}`}>
              NutriFind
            </h2>

            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[#6a9966]">
              User Dashboard
            </p>
          </div>

          <button
            onClick={toggleDarkMode}
            className={`p-2.5 rounded-xl backdrop-blur-md transition-all ${
              darkMode
                ? 'bg-white/10 text-yellow-400 hover:bg-white/20'
                : 'bg-black/10 text-[#1c3a1c] hover:bg-black/20'
            }`}
          >
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </header>

        {/* PROFILE CARD */}
        <motion.div
          whileHover={{ y: -5 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => handleNav('/profile')}
          className={`${cardBg} p-8 clay-card flex flex-col items-center cursor-pointer group transition-all duration-300 backdrop-blur-xl`}
        >
          <div className="relative w-24 h-24 mb-6">
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className={`absolute inset-0 rounded-full scale-110 group-hover:scale-125 transition-transform duration-700 ${
                darkMode
                  ? 'bg-[#8ecb84]/20'
                  : 'bg-[#8ecb84]/10'
              }`}
            />

            <img
              src={
                user.profilePic ||
                `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=500`
              }
              alt="Profile"
              className="relative w-full h-full object-cover rounded-full border-2 border-white shadow-sm"
            />

            <div className="absolute bottom-0 right-0 bg-[#2d5a27] p-1.5 rounded-full text-white border-2 border-white">
              <User size={12} />
            </div>
          </div>

          <span className="text-[9px] font-bold tracking-[0.3em] uppercase text-[#6a9966] mb-1 text-center">
            Authenticated Member
          </span>

          <h2 className={`font-serif text-xl italic mb-6 ${textMain}`}>
            {user.username}
          </h2>

          <div
            className={`pt-6 border-t w-full flex justify-around ${border}`}
          >
            <div className="text-center">
              <p className={`text-[8px] font-black uppercase tracking-widest mb-1 ${textSub}`}>
                Today's Focus
              </p>

              <p className={`text-sm font-bold ${textMain}`}>
                {progressPercentage}%
              </p>
            </div>

            <div className="text-center">
              <p className={`text-[8px] font-black uppercase tracking-widest mb-1 ${textSub}`}>
                Streak
              </p>

              <p className={`text-sm font-bold ${textMain}`}>
                14 Days
              </p>
            </div>
          </div>
        </motion.div>

        {/* MEAL ACHIEVEMENT CARD */}
        {(() => {
          // Determine the tier based on multiples of 7 days
          const tier =
            completedDays >= 28 ? { label: 'Legendary',   sub: 'Unstoppable!', color: '#f5c842', glow: 'rgba(245,200,66,0.25)',  icon: '🏆', image: 'legendary.png' } :
            completedDays >= 21 ? { label: 'Champion',    sub: 'You\'re on fire!', color: '#8ecb84', glow: 'rgba(142,203,132,0.22)', icon: '🥇', image: 'champion.png' } :
            completedDays >= 14 ? { label: 'Dedicated',   sub: 'Solid consistency!', color: '#6ab8ff', glow: 'rgba(106,184,255,0.18)', icon: '🥈', image: 'dedicated.png' } :
            completedDays >= 7  ? { label: 'Consistent',  sub: 'Building momentum!', color: '#a8d8ea', glow: 'rgba(168,216,234,0.15)', icon: '🥉', image: 'consistent.png' } :
                                  { label: 'Beginner',    sub: 'Keep going!', color: '#8ecb84', glow: 'rgba(142,203,132,0.1)',  icon: '💧', image: 'beginner.png' };

          // Calculate progress within the current 7-day cycle
          const currentCycleProgress = completedDays % 7 === 0 && completedDays > 0 ? 7 : completedDays % 7;
          const toGo = 7 - currentCycleProgress;

          return (
            <motion.div
              variants={itemVariants}
              className={`p-8 clay-card flex-1 flex flex-col justify-between relative overflow-hidden transition-all duration-500 ${
                darkMode ? 'bg-[#121212] text-white' : 'bg-[#1c3a1c] text-[#e8f4e5]'
              }`}
            >
              {/* Ambient glow */}
              <motion.div
                animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.65, 0.4] }}
                transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
                style={{ background: `radial-gradient(circle, ${tier.glow} 0%, transparent 70%)` }}
                className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-56 h-56 rounded-full blur-2xl pointer-events-none"
              />

              {/* Header */}
              <div className="relative z-10 flex items-center gap-2 mb-2">
                <Trophy size={13} className="text-[#8ecb84]" />
                <span className="text-[9px] font-bold tracking-[0.3em] uppercase text-[#6a9966]">
                  Diet Achievement
                </span>
              </div>

              {/* Central display */}
              <div className="relative z-10 flex flex-col items-center justify-center flex-1 gap-3 py-4">
                {/* Badge */}
                <motion.div
                  key={tier.label}
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 220, damping: 16 }}
                  className="relative flex items-center justify-center min-h-[96px]"
                >
                  <motion.div
                    animate={{ scale: [1, 1.18, 1], opacity: [0.3, 0.55, 0.3] }}
                    transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                    className="absolute w-24 h-24 rounded-full"
                    style={{ background: `radial-gradient(circle, ${tier.glow} 0%, transparent 70%)` }}
                  />
                  {imageErrors[tier.label.toLowerCase()] ? (
                    <span className="text-7xl drop-shadow-2xl select-none">{tier.icon}</span>
                  ) : (
                    <img
                      src={`/trophies/${tier.image}`}
                      alt={tier.label}
                      className="w-24 h-24 object-contain drop-shadow-2xl select-none relative z-10 animate-pulse"
                      onError={() => {
                        setImageErrors(prev => ({
                          ...prev,
                          [tier.label.toLowerCase()]: true
                        }));
                      }}
                    />
                  )}
                </motion.div>

                {/* Tier name */}
                <motion.div
                  key={tier.label + 'text'}
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="text-center"
                >
                  <p className="font-serif text-2xl italic mb-0.5" style={{ color: tier.color }}>
                    {tier.label}
                  </p>
                  <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-[#6a9966] opacity-70">
                    {tier.sub}
                  </p>
                </motion.div>

                {/* Days counter */}
                <p className="text-[10px] font-black tracking-widest text-[#8ecb84] opacity-80 tabular-nums">
                  {completedDays} Total Days
                </p>

                {/* Day pip indicators for current cycle */}
                <div className="flex gap-2">
                  {Array.from({ length: 7 }).map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: i * 0.05, type: 'spring', stiffness: 300 }}
                      className="w-2.5 h-2.5 rounded-full"
                      style={{
                        background: i < currentCycleProgress ? tier.color : 'rgba(255,255,255,0.12)',
                        boxShadow: i < currentCycleProgress ? `0 0 6px ${tier.color}80` : 'none'
                      }}
                    />
                  ))}
                </div>

                {/* Thin progress bar */}
                <div className="w-full bg-white/10 h-1 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(currentCycleProgress / 7) * 100}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    className="h-full rounded-full"
                    style={{ background: tier.color }}
                  />
                </div>

                <p className="text-[8px] font-bold uppercase tracking-widest text-[#6a9966] opacity-40">
                  {toGo === 0 ? 'Cycle complete!' : `${toGo} day${toGo !== 1 ? 's' : ''} to next tier`}
                </p>
              </div>

              {/* Sign Out */}
              <button
                onClick={() => { localStorage.clear(); navigate('/'); }}
                className={`relative z-10 w-full py-4 clay-btn text-[9px] font-bold uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-2 ${
                  darkMode ? 'text-white/70 hover:bg-white/5 hover:text-white' : 'text-[#6a9966] hover:text-white hover:bg-white/5'
                }`}
              >
                <LogOut size={12} />
                Sign Out
              </button>
            </motion.div>
          );
        })()}
      </motion.aside>




      {/* MAIN CONTENT */}
      <motion.main
        variants={containerVariants}
        className="flex-1 flex flex-col gap-8 h-full min-h-0"
      >
        {/* BANNER */}
        <motion.div
          variants={itemVariants}
          className="h-[300px] flex-shrink-0 relative clay-card overflow-hidden group transition-all duration-500"
        >
          <div className="absolute inset-0 z-0">
            <AnimatePresence mode="popLayout">
              <motion.img
                key={bannerImages[currentImageIdx]}
                src={bannerImages[currentImageIdx]}
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.5, ease: "easeInOut" }}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000"
                alt="Wellness Banner Slide"
              />
            </AnimatePresence>
          </div>

          <div className="absolute inset-0 z-10 bg-gradient-to-r from-[#1c3a1c]/90 via-[#1c3a1c]/40 to-transparent"></div>

          <div className="relative z-10 h-full flex flex-col justify-center px-12">
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-[9px] font-bold tracking-[0.4em] uppercase text-[#8ecb84] mb-4 block"
            >
              Curated Nutrition
            </motion.span>

            <h1 className="font-serif text-5xl italic text-white leading-[1.1] mb-8">
              Sophisticated <br /> organic wellness.
            </h1>

            <div className="flex gap-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleNav('/generate-weekly')}
                className="w-fit bg-[#2d5a27] text-white px-8 py-4 text-[10px] font-bold uppercase tracking-[0.3em] hover:bg-[#1c3a1c] transition-all flex items-center gap-3 clay-btn"
              >
                Generate Weekly Diet Plan
                <ArrowRight size={14} />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleNav('/view-weekly')}
                className="w-fit bg-white/10 backdrop-blur-md text-white px-8 py-4 text-[10px] font-bold uppercase tracking-[0.3em] hover:bg-white/20 transition-all flex items-center gap-3 clay-btn"
              >
                View Weekly Diet Plan
                <Eye size={14} className="text-[#8ecb84]" />
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* DAILY TRACKING */}
        <motion.div
          variants={itemVariants}
          className={`${cardBg} pt-8 pb-8 pl-8 pr-5 clay-card flex-1 flex flex-col overflow-hidden backdrop-blur-xl transition-all duration-500`}
        >
          <header className="flex justify-between items-end mb-8 relative">
            <div className="flex items-center gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-[9px] font-black uppercase tracking-[0.3em] text-[#6a9966]">
                    {today} Protocol
                  </span>
                </div>

                <h4 className={`font-serif text-3xl italic ${textMain}`}>
                  Daily Intake Tracking
                </h4>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className={`text-[8px] font-black uppercase tracking-widest mb-1 ${textSub}`}>
                  Daily Completion
                </p>

                <p
                  className={`text-sm font-bold ${
                    darkMode
                      ? 'text-[#8ecb84]'
                      : 'text-[#2d5a27]'
                  }`}
                >
                  {progressPercentage}%
                </p>
              </div>

              <div
                className={`w-32 h-2 rounded-full overflow-hidden border ${
                  darkMode
                    ? 'bg-white/5 border-white/10'
                    : 'bg-[#f5faf4] border-[#ddd8ce]'
                }`}
              >
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercentage}%` }}
                  className="h-full bg-[#8ecb84]"
                />
              </div>
            </div>
          </header>

          <div className="flex-1 overflow-hidden min-h-0 flex flex-col">
            {loadingDiet ? (
              <div className="h-full flex flex-col items-center justify-center opacity-40">
                <Loader2 className="animate-spin mb-4" />

                <p className="text-xs uppercase font-bold tracking-widest">
                  Synchronizing Plan...
                </p>
              </div>
            ) : dailyDiet ? (
              <div className="relative flex-1 min-h-0 overflow-hidden flex flex-col">
                <AnimatePresence mode="wait">
                  {progressPercentage === 100 ? (
                    <motion.div
                      key="success"
                      initial={{ x: 500, opacity: 0, scale: 0.9 }}
                      animate={{ x: 0, opacity: 1, scale: 1 }}
                      exit={{ x: -500, opacity: 0, scale: 0.9 }}
                      transition={{ 
                        type: 'spring', 
                        damping: 25, 
                        stiffness: 120,
                        mass: 1
                      }}
                      className="flex flex-col items-center justify-center py-10 text-center h-full min-h-[400px]"
                    >
                      <div className="relative mb-8">
                        <motion.div
                          animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
                          transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                          className="absolute inset-0 bg-[#8ecb84]/30 rounded-full blur-3xl"
                        />
                        <div className="relative bg-[#2d5a27] p-8 rounded-full text-white shadow-2xl">
                          <Trophy size={64} />
                        </div>
                        <motion.div
                          animate={{ 
                            rotate: [0, 10, -10, 0],
                            scale: [1, 1.1, 1]
                          }}
                          transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                          className="absolute -top-4 -right-4 text-[#8ecb84] bg-black/20 p-2 rounded-full backdrop-blur-md"
                        >
                          <PartyPopper size={32} />
                        </motion.div>
                      </div>

                      <motion.h3 
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className={`font-serif text-6xl italic mb-6 ${textMain} leading-tight`}
                      >
                        Daily Protocol <br /> Achieved
                      </motion.h3>
                      
                      <motion.p 
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className={`text-base max-w-lg mx-auto mb-12 leading-relaxed opacity-80 ${textSub}`}
                      >
                        You have successfully completed every element of your nutrition plan for today. 
                        Your dedication to organic wellness is paving the way for superior cellular repair.
                      </motion.p>

                      <motion.button
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        onClick={() => handleNav('/view-weekly')}
                        className="bg-[#2d5a27] text-white px-12 py-5 text-[11px] font-black uppercase tracking-[0.5em] hover:bg-[#1c3a1c] hover:scale-105 active:scale-95 transition-all group clay-btn"
                      >
                        Review Weekly Performance
                        <ArrowRight size={14} className="inline-block ml-3 group-hover:translate-x-1 transition-transform" />
                      </motion.button>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="tasks"
                      initial={{ x: 0, opacity: 1 }}
                      exit={{ x: -800, opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
                      className="grid grid-cols-3 gap-6 h-full min-h-0 flex-1"
                    >
                      {['breakfast', 'lunch', 'dinner'].map((meal) => (
                        <div
                          key={meal}
                          className={`relative p-8 clay-card transition-all duration-700 flex flex-col overflow-hidden h-full min-h-0 ${
                            darkMode
                              ? 'bg-[#121212]'
                              : 'bg-[#fdfdfc]'
                          }`}
                        >
                          <div className="flex justify-between items-center mb-8 flex-shrink-0">
                            <div className="flex items-center gap-3">
                              <span className={`text-xs font-black uppercase tracking-[0.3em] ${darkMode ? 'text-[#8ecb84]' : 'text-[#2d5a27]'}`}>
                                {meal}
                              </span>
                            </div>
                          </div>

                          <div className="flex-1 overflow-y-auto pr-1 space-y-6 custom-scrollbar min-h-0">
                            {dailyDiet[meal].map((item, idx) => {
                              const itemKey = `${meal}-${idx}`;
                              const isCompleted = completedItems[itemKey];

                              return (
                                <div 
                                  key={idx} 
                                  style={{
                                    backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.35) 20%, rgba(0,0,0,0.75) 90%), url('${getImageUrl(item.imageUrl || item.imageURL || item.image || item.imagePath)}')`,
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center',
                                  }}
                                  className={`relative group p-6 rounded-2xl border transition-all duration-500 min-h-[220px] flex flex-col justify-end ${
                                    isCompleted 
                                      ? 'border-[#8ecb84]/40 shadow-lg' 
                                      : 'border-white/10 hover:border-white/30 shadow-md'
                                  }`}
                                >
                                  <div className={`flex justify-between items-end transition-all duration-500 ${isCompleted ? 'opacity-40' : 'opacity-100'}`}>
                                    <div className="flex-1 min-w-0 pr-4">
                                      <p className="text-base font-bold text-white mb-1 drop-shadow-md truncate">
                                        {item.name}
                                      </p>
                                      <p className="text-[10px] font-semibold text-white/80 mb-2 drop-shadow-sm">
                                        {item.calories} kcal • {item.grams}g
                                      </p>
                                    </div>

                                    <button
                                      onClick={(e) => { e.stopPropagation(); toggleItem(meal, idx); }}
                                      className={`p-3 rounded-xl transition-all border backdrop-blur-md shadow-sm flex-shrink-0 ${
                                        isCompleted 
                                          ? 'text-[#8ecb84] border-[#8ecb84]/30 bg-[#8ecb84]/15 hover:bg-[#8ecb84]/25 hover:text-red-400 active:scale-90' 
                                          : 'text-white/80 border-white/10 bg-black/40 hover:bg-black/60 hover:text-[#8ecb84] active:scale-90'
                                      }`}
                                    >
                                      {isCompleted ? (
                                        <CheckCircle2 size={20} />
                                      ) : (
                                        <Circle size={20} />
                                      )}
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div
                className={`h-full flex flex-col items-center justify-center text-center p-12 rounded-2xl border-2 border-dashed ${
                  darkMode
                    ? 'bg-[#121212] border-white/10'
                    : 'bg-[#fbfdfa]'
                }`}
              >
                <p className={`font-serif text-xl italic mb-4 ${textMain}`}>
                  No diet plan active for today.
                </p>

                <button
                  onClick={() => handleNav('/generate-weekly')}
                  className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#2d5a27] hover:underline transition-all"
                >
                  Generate your first plan →
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </motion.main>
      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: ${darkMode ? 'rgba(142, 203, 132, 0.3)' : 'rgba(45, 90, 39, 0.3)'};
          border-radius: 9999px;
          transition: all 0.2s ease;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: ${darkMode ? 'rgba(142, 203, 132, 0.5)' : 'rgba(45, 90, 39, 0.5)'};
        }
      ` }} />
    </motion.div>
  );
};

export default Dashboard;