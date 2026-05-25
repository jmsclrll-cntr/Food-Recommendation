import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Trophy, Lock, Sun, Moon, Sparkles, Award } from 'lucide-react';
import { useDarkMode } from '../hooks/useDarkMode';
import { getThemeStyles } from '../theme/styles';
import axios from 'axios';

import bronzeImg from '../achievements/bronze.png';
import silverImg from '../achievements/silver.png';
import goldImg from '../achievements/gold.png';
import platinumImg from '../achievements/platinum.png';
import diamondImg from '../achievements/diamond.png';
import defaultTrophyImg from '../achievements/default_trophy.png';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
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

const Achievements = () => {
  const navigate = useNavigate();
  const [darkMode, toggleDarkMode] = useDarkMode();
  const styles = getThemeStyles(darkMode);
  const { bgMain, cardBg, border, textMain, textSub } = styles;

  const [completedDays, setCompletedDays] = useState(0);
  const [hoveredCard, setHoveredCard] = useState(null);
  const [flippedCards, setFlippedCards] = useState({});

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (!user) {
      navigate('/');
      return;
    }
    
    const parsedUser = JSON.parse(user);
    const userId = parsedUser.id || parsedUser.uid || parsedUser._id;
    
    // Fetch diet history to calculate total completed days dynamically
    axios
      .get(`http://localhost:5000/api/diets/history/${userId}`)
      .then((res) => {
        const history = res.data || [];
        const historyDays = history.reduce((acc, h) => acc + Math.round((h.completion || 0) / 100 * 7), 0);
        
        // Count locally completed days for the current week
        const currentWeekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
          .filter(day => localStorage.getItem(`day_done_${day}_${userId}`) === '1').length;
          
        const totalCompleted = historyDays + currentWeekDays;
        setCompletedDays(totalCompleted);
        localStorage.setItem(`completed_days_${userId}`, totalCompleted.toString());
      })
      .catch((err) => {
        console.error('Error fetching history for achievements:', err);
        // Fallback to localStorage if API fails
        const savedDays = localStorage.getItem(`completed_days_${userId}`);
        if (savedDays) {
          setCompletedDays(parseInt(savedDays, 10));
        } else {
          setCompletedDays(0);
        }
      });
  }, [navigate]);

  const achievementsList = [
    { 
      id: 1, 
      label: 'Beginner', 
      sub: 'The journey begins', 
      req: 0, 
      image: defaultTrophyImg, 
      color: '#8ecb84', 
      glow: 'rgba(142,203,132,0.3)',
      motivation: "Welcome to NutriFind! Your journey to a healthier lifestyle has officially begun. Keep logging in daily to build healthy, organic routines!"
    },
    { 
      id: 2, 
      label: 'Committed', 
      sub: '3 Days streak', 
      req: 3, 
      image: bronzeImg, 
      color: '#cd7f32', 
      glow: 'rgba(205,127,50,0.3)',
      motivation: "3 days completed! You are officially building consistency. Stay focused, fuel your body properly, and keep the momentum going!"
    },
    { 
      id: 3, 
      label: 'Consistent', 
      sub: '7 Days streak', 
      req: 7, 
      image: silverImg, 
      color: '#a8d8ea', 
      glow: 'rgba(168,216,234,0.3)',
      motivation: "A whole week of commitment! You're proving to yourself that you can do this. Unlocking this Silver Trophy is a true badge of honor!"
    },
    { 
      id: 4, 
      label: 'Dedicated', 
      sub: '14 Days streak', 
      req: 14, 
      image: goldImg, 
      color: '#f5c842', 
      glow: 'rgba(245,200,66,0.3)',
      motivation: "Two weeks! Your dedication is shining through. You are building powerful wellness habits. Go get that Golden Trophy!"
    },
    { 
      id: 5, 
      label: 'Champion', 
      sub: '21 Days streak', 
      req: 21, 
      image: platinumImg, 
      color: '#e5e4e2', 
      glow: 'rgba(229,228,226,0.3)',
      motivation: "21 days! They say it takes 21 days to form a habit. You've done it, champion! Your body and mind will thank you for this cellular repair!"
    },
    { 
      id: 6, 
      label: 'Legendary', 
      sub: '30 Days streak', 
      req: 30, 
      image: diamondImg, 
      color: '#b9f2ff', 
      glow: 'rgba(185,242,255,0.3)',
      motivation: "30 days! A full month of consistency. You have achieved legendary status and master-level cellular repair! Absolutely phenomenal!"
    },
  ];

  const handleCardClick = (id) => {
    setFlippedCards(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const unlockedCount = achievementsList.filter(ach => completedDays >= ach.req).length;

  return (
    <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className={`min-h-screen w-full ${bgMain} ${textMain} p-6 md:p-10 flex flex-col transition-colors duration-500 overflow-y-auto`}
        style={{
          backgroundImage: darkMode 
            ? 'linear-gradient(rgba(13, 17, 13, 0.90), rgba(13, 17, 13, 0.90)), url("/bg.png")' 
            : 'linear-gradient(rgba(245, 250, 244, 0.90), rgba(245, 250, 244, 0.90)), url("/bg.png")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
    >
      {/* Header Container */}
      <header className="max-w-5xl mx-auto w-full flex justify-between items-center mb-10 relative z-50">
          <div className="flex items-center gap-6">
              <motion.button 
                  onClick={() => navigate('/dashboard')} 
                  whileHover={{ x: -4 }}
                  whileTap={{ scale: 0.95 }}
                  className={`p-3 ${cardBg} rounded-full border ${border} hover:border-[#2d5a27] transition-all group flex items-center justify-center shadow-md`}
              >
                  <ArrowLeft size={18} className={`group-hover:text-[#2d5a27] transition-colors ${darkMode ? 'text-white' : 'text-[#2d5a27]'}`} />
              </motion.button>
              <div>
                  <h1 className="font-serif text-3xl italic flex items-center gap-3">
                      <Trophy className="text-[#f5c842] drop-shadow-[0_2px_8px_rgba(245,200,66,0.3)] animate-pulse" size={28} />
                      Trophy Room
                  </h1>
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-[#6a9966] mt-1">Your Diet Milestones</p>
              </div>
          </div>
          
          {/* Enhanced Light/Dark Mode Button */}
          <motion.button 
              onClick={toggleDarkMode} 
              whileHover={{ scale: 1.05, rotate: 15 }}
              whileTap={{ scale: 0.95 }}
              title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
              className={`p-3 rounded-2xl border transition-all duration-300 relative group flex items-center justify-center shadow-lg ${
                  darkMode 
                      ? 'bg-white/5 border-white/10 text-yellow-400 hover:bg-white/10 shadow-[0_0_20px_rgba(234,179,8,0.15)] hover:border-yellow-400/30' 
                      : 'bg-white border-[#ddd8ce] text-gray-700 hover:bg-black/5 hover:border-[#2d5a27]/30 hover:shadow-[0_0_20px_rgba(45,90,39,0.15)]'
              }`}
          >
              {darkMode ? (
                  <Sun size={18} className="text-yellow-400 transition-transform duration-300" />
              ) : (
                  <Moon size={18} className="text-[#2d5a27] transition-transform duration-300" />
              )}
          </motion.button>
      </header>

      {/* Main Grid & Content */}
      <div className="max-w-5xl mx-auto w-full flex-1">
        
        {/* Growth Stats Overview Card */}
        <div className={`mb-10 p-6 md:p-8 rounded-3xl border backdrop-blur-xl ${cardBg} ${border} shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden`}>
            {/* Ambient background glow inside the panel */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-[#8ecb84]/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex items-center gap-5 z-10">
                <div className={`p-4 rounded-2xl ${darkMode ? 'bg-[#8ecb84]/10' : 'bg-[#8ecb84]/15'} border ${darkMode ? 'border-[#8ecb84]/20' : 'border-[#8ecb84]/35'} text-[#8ecb84] flex items-center justify-center shadow-md`}>
                    <Award size={36} className="text-[#8ecb84] animate-spin-slow" />
                </div>
                <div>
                    <h3 className="font-serif text-xl italic mb-1">Your Dietary Milestones</h3>
                    <p className={`text-xs ${textSub}`}>Complete your daily protocol tasks on the dashboard to build your streak!</p>
                </div>
            </div>

            {/* Metrics */}
            <div className="flex gap-8 items-center z-10">
                <div className="text-center">
                    <h4 className="text-4xl font-black tabular-nums tracking-tighter text-[#8ecb84] mb-1">
                        {completedDays}
                    </h4>
                    <p className={`text-xs font-black uppercase tracking-[0.15em] ${textSub}`}>Total Days Streak</p>
                </div>
                <div className={`h-10 w-[1px] ${border}`} />
                <div className="text-center">
                    <h4 className="text-4xl font-black tabular-nums tracking-tighter text-[#6a9966] mb-1">
                        {unlockedCount} <span className={`text-lg font-medium ${textSub}`}>/ {achievementsList.length}</span>
                    </h4>
                    <p className={`text-xs font-black uppercase tracking-[0.15em] ${textSub}`}>Trophies Unlocked</p>
                </div>
            </div>
        </div>

        {/* 3D Flipping Grid */}
        <motion.div variants={containerVariants} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-12">
          {achievementsList.map((ach) => {
            const isUnlocked = completedDays >= ach.req;
            const progress = Math.min(100, Math.round((completedDays / (ach.req || 1)) * 100));
            const isFlipped = flippedCards[ach.id] || hoveredCard === ach.id;

            return (
              <div
                key={ach.id}
                className="perspective-1000 w-full h-[320px] cursor-pointer group"
                onClick={() => handleCardClick(ach.id)}
                onMouseEnter={() => setHoveredCard(ach.id)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                <motion.div
                  animate={{ rotateY: isFlipped ? 180 : 0 }}
                  transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
                  style={{ transformStyle: 'preserve-3d' }}
                  className="relative w-full h-full w-full h-full transition-shadow duration-500 rounded-3xl"
                >
                  
                  {/* FRONT FACE */}
                  <div
                    className={`absolute inset-0 backface-hidden w-full h-full p-6 rounded-3xl border flex flex-col items-center justify-between transition-all duration-500 ${
                      isUnlocked
                        ? `${cardBg} ${border} shadow-lg shadow-black/5 hover:shadow-xl hover:shadow-[#8ecb84]/5`
                        : `${darkMode ? 'bg-black/30 border-white/5' : 'bg-black/5 border-[#ddd8ce]'} opacity-90`
                    }`}
                    style={{ transform: 'rotateY(0deg)', backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
                  >
                    {/* Glowing color ring if unlocked */}
                    {isUnlocked && (
                      <div
                        className="absolute inset-0 opacity-20 blur-3xl pointer-events-none transition-all duration-500 rounded-3xl"
                        style={{ background: `radial-gradient(circle at center, ${ach.color}, transparent 60%)` }}
                      />
                    )}

                    {/* Top Status Tag */}
                    <div className="w-full flex justify-between items-center z-10">
                      <span className={`text-xs font-black uppercase tracking-wider ${darkMode ? 'text-white/40' : 'text-black/40'}`}>
                        Milestone {ach.id}
                      </span>
                      {isUnlocked ? (
                        <span className="flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full bg-[#8ecb84]/15 border border-[#8ecb84]/30 text-[#8ecb84] shadow-sm">
                          <Sparkles size={10} className="text-[#8ecb84]" /> Unlocked
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full bg-black/20 border border-white/5 text-white/50 shadow-inner">
                          <Lock size={10} /> Locked
                        </span>
                      )}
                    </div>

                    {/* Central Trophy Presentation */}
                    <motion.div 
                        className="relative w-36 h-36 flex items-center justify-center select-none"
                        animate={isUnlocked ? { y: [0, -6, 0] } : {}}
                        transition={isUnlocked ? { repeat: Infinity, duration: 4, ease: "easeInOut" } : {}}
                    >
                        {/* Glow halo behind trophy */}
                        {isUnlocked && (
                          <div 
                              className="absolute w-24 h-24 rounded-full opacity-45 blur-2xl pointer-events-none"
                              style={{ background: `radial-gradient(circle, ${ach.glow} 0%, transparent 70%)` }}
                          />
                        )}
                        
                        {/* Locked overlay shield */}
                        {!isUnlocked && (
                          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] z-20 flex items-center justify-center rounded-full border border-white/10 shadow-lg w-28 h-28 m-auto">
                              <Lock size={28} className="text-white/80 drop-shadow-md" />
                          </div>
                        )}

                        <img
                          src={ach.image}
                          alt={ach.label}
                          className={`w-28 h-28 object-contain relative z-10 transition-all duration-500 filter ${
                            isUnlocked 
                              ? 'grayscale-0 scale-100 drop-shadow-[0_10px_20px_rgba(0,0,0,0.15)] group-hover:scale-105' 
                              : 'grayscale opacity-25 scale-90'
                          }`}
                        />
                    </motion.div>

                    {/* Bottom Labeling */}
                    <div className="text-center z-10 w-full">
                      <h3 className="font-serif text-2xl italic tracking-wide">{ach.label}</h3>
                      <p className="text-xs font-black uppercase tracking-wider text-[#6a9966] mt-1">{ach.sub}</p>
                      
                      <div className="mt-2 text-xs font-medium tracking-wide opacity-0 group-hover:opacity-60 transition-opacity duration-300 flex items-center justify-center gap-1">
                        <span>Tap / Hover to flip</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* BACK FACE */}
                  <div
                    className={`absolute inset-0 backface-hidden w-full h-full p-6 rounded-3xl border flex flex-col justify-between transition-all duration-500 ${
                      darkMode 
                        ? 'bg-[#151715] border-white/10 shadow-inner' 
                        : 'bg-[#f4f7f3] border-[#ddd8ce] shadow-inner'
                    }`}
                    style={{ transform: 'rotateY(180deg)', backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
                  >
                    {/* Header info */}
                    <div className="w-full flex justify-between items-center">
                      <span className={`text-xs font-black uppercase tracking-[0.2em] ${textSub}`}>
                        Lvl {ach.id} Reward
                      </span>
                      <span className="font-serif text-sm italic font-semibold" style={{ color: ach.color }}>
                        {ach.label}
                      </span>
                    </div>

                    {/* Motivation Message Block */}
                    <div className="flex-1 flex flex-col justify-center items-center py-2 px-1 text-center">
                      <p className={`text-xs leading-relaxed italic font-medium opacity-90 text-pretty ${darkMode ? 'text-white/80' : 'text-gray-700'}`}>
                        &ldquo;{ach.motivation}&rdquo;
                      </p>
                    </div>

                    {/* Streak Progress Details */}
                    <div className="w-full">
                      <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider mb-2">
                        <span className={textSub}>Streak Requirement</span>
                        <span className={isUnlocked ? 'text-[#8ecb84]' : textMain}>
                          {completedDays} / {ach.req} Days
                        </span>
                      </div>
                      
                      <div className={`w-full h-2 rounded-full overflow-hidden border relative ${
                        darkMode ? 'bg-white/5 border-white/10' : 'bg-black/5 border-[#ddd8ce]'
                      }`}>
                        <motion.div
                           initial={{ width: 0 }}
                           animate={{ width: `${progress}%` }}
                           className="h-full rounded-full"
                           style={{
                             backgroundColor: ach.color,
                             boxShadow: `0 0 10px ${ach.color}50`
                           }}
                        />
                      </div>
                      
                      {!isUnlocked && (
                        <p className="text-xs font-medium tracking-wide mt-2 text-right opacity-70">
                          {ach.req - completedDays} more day{ach.req - completedDays > 1 ? 's' : ''} to unlock!
                        </p>
                      )}
                    </div>

                    {/* Status Badge */}
                    <div className="w-full mt-4">
                      {isUnlocked ? (
                        <div className="w-full text-center py-2 rounded-xl text-xs font-black uppercase tracking-widest text-[#2d5a27] bg-[#8ecb84]/20 border border-[#8ecb84]/35 shadow-sm shadow-[#8ecb84]/5">
                          Trophy Unlocked ✨
                        </div>
                      ) : (
                        <div className="w-full text-center py-2 rounded-xl text-xs font-black uppercase tracking-widest text-white/50 bg-black/25 border border-white/5 shadow-inner">
                          Locked ({progress}%) 🔒
                        </div>
                      )}
                    </div>
                  </div>

                </motion.div>
              </div>
            );
          })}
        </motion.div>
      </div>

      {/* Global CSS for 3D Transform & Perspectives */}
      <style dangerouslySetInnerHTML={{ __html: `
        .perspective-1000 {
          perspective: 1000px;
        }
        .backface-hidden {
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
        }
        .animate-spin-slow {
          animation: spin 8s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      ` }} />
    </motion.div>
  );
};

export default Achievements;
