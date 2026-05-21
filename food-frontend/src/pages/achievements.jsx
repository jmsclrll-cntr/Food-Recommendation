import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Trophy, Lock } from 'lucide-react';
import { useDarkMode } from '../hooks/useDarkMode';
import { getThemeStyles } from '../theme/styles';

import bronzeImg from '../achievements/bronze.png';
import silverImg from '../achievements/silver.png';
import goldImg from '../achievements/gold.png';
import platinumImg from '../achievements/platinum.png';
import diamondImg from '../achievements/diamond.png';

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
  const [darkMode] = useDarkMode();
  const styles = getThemeStyles(darkMode);
  const { bgMain, cardBg, border, textMain, textSub } = styles;

  const [completedDays, setCompletedDays] = useState(0);

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (!user) {
      navigate('/');
      return;
    }
    // Hardcoded mock for now, this would normally fetch from backend
    // You can replace this with actual backend logic later
    setCompletedDays(12); 
  }, [navigate]);

  const achievementsList = [
    { id: 1, label: 'Beginner', sub: 'The journey begins', req: 0, image: bronzeImg, color: '#8ecb84' },
    { id: 2, label: 'Consistent', sub: '7 Days streak', req: 7, image: silverImg, color: '#a8d8ea' },
    { id: 3, label: 'Dedicated', sub: '14 Days streak', req: 14, image: goldImg, color: '#6ab8ff' },
    { id: 4, label: 'Champion', sub: '21 Days streak', req: 21, image: platinumImg, color: '#8ecb84' },
    { id: 5, label: 'Legendary', sub: '28 Days streak', req: 28, image: diamondImg, color: '#f5c842' },
  ];

  return (
    <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className={`min-h-screen w-full ${bgMain} ${textMain} p-6 md:p-10 flex flex-col transition-colors duration-500 overflow-y-auto`}
    >
      <header className="flex justify-between items-center mb-10 relative z-50">
          <div className="flex items-center gap-6">
              <button onClick={() => navigate('/dashboard')} className={`p-3 ${cardBg} rounded-full border ${border} hover:border-[#2d5a27] transition-all group`}>
                  <ArrowLeft size={18} className={`group-hover:text-[#2d5a27] ${darkMode ? 'text-white' : 'text-black'}`} />
              </button>
              <div>
                  <h1 className="font-serif text-3xl italic flex items-center gap-3">
                      <Trophy className="text-[#f5c842]" size={28} />
                      Trophy Room
                  </h1>
                  <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[#6a9966]">Your Diet Milestones</p>
              </div>
          </div>
      </header>

      <div className="max-w-5xl mx-auto w-full flex-1">
        
        <div className="mb-10 text-center">
            <h2 className="text-4xl font-black tabular-nums tracking-tighter mb-2 text-[#8ecb84]">{completedDays}</h2>
            <p className={`text-[10px] font-bold uppercase tracking-[0.3em] ${textSub}`}>Total Days Completed</p>
        </div>

        <motion.div variants={containerVariants} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {achievementsList.map((ach) => {
            const isUnlocked = completedDays >= ach.req;
            return (
              <motion.div 
                key={ach.id}
                variants={itemVariants}
                className={`relative p-8 rounded-3xl border transition-all duration-500 overflow-hidden flex flex-col items-center justify-center min-h-[280px] ${
                    isUnlocked 
                      ? `${cardBg} ${border} shadow-lg hover:-translate-y-2` 
                      : `${darkMode ? 'bg-black/20' : 'bg-black/5'} border-transparent opacity-60 grayscale`
                }`}
              >
                {/* Ambient glow if unlocked */}
                {isUnlocked && (
                  <div 
                    className="absolute inset-0 opacity-20 blur-2xl pointer-events-none"
                    style={{ background: `radial-gradient(circle at center, ${ach.color}, transparent 60%)` }}
                  />
                )}

                <div className="relative z-10 w-32 h-32 mb-6 flex items-center justify-center">
                  {!isUnlocked && (
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm z-20 flex items-center justify-center rounded-full">
                        <Lock size={32} className="text-white/50" />
                    </div>
                  )}
                  <img 
                    src={ach.image} 
                    alt={ach.label}
                    className={`w-full h-full object-contain drop-shadow-2xl transition-all ${isUnlocked ? 'animate-pulse scale-110' : ''}`}
                  />
                </div>

                <div className="relative z-10 text-center">
                  <h3 className="font-serif text-2xl italic mb-1" style={{ color: isUnlocked ? ach.color : undefined }}>
                    {ach.label}
                  </h3>
                  <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#6a9966]">
                    {ach.sub}
                  </p>
                  
                  {!isUnlocked && (
                    <div className="mt-4 inline-block px-3 py-1 bg-black/10 rounded-full border border-black/5 dark:border-white/5">
                        <p className={`text-[8px] font-bold uppercase tracking-widest ${textSub}`}>
                            Requires {ach.req} Days
                        </p>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Achievements;
