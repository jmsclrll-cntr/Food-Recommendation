import { useEffect, useState } from 'react'; // Removed unused React
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion'; // Removed unused AnimatePresence
import { 
    ArrowLeft, Calendar, Utensils, Zap, Loader2, Info, 
    ChevronRight, ChevronLeft, Sun, Moon, CheckCircle2
} from 'lucide-react';
import axios from 'axios';

const MissionCompleteSticker = () => (
    <motion.div
        initial={{ scale: 2, opacity: 0, rotate: -45 }}
        animate={{ scale: 1, opacity: 1, rotate: -12 }}
        transition={{ type: 'spring', damping: 12, stiffness: 200 }}
        className="pointer-events-none z-20 flex-shrink-0"
    >
        <div className="relative flex items-center justify-center opacity-80">
            {/* Outer Grunge Circle */}
            <div className="w-20 h-20 border-4 border-red-600/60 rounded-full flex items-center justify-center p-1 border-dashed">
                <div className="w-full h-full border-2 border-red-600/40 rounded-full flex items-center justify-center">
                    <div className="border-2 border-red-700/70 px-3 py-1.5 transform rotate-2">
                        <div className="flex flex-col items-center">
                            <span className="text-[7px] font-black text-red-700/80 uppercase tracking-tighter leading-none mb-0.5">MISSION</span>
                            <div className="h-[1.5px] w-full bg-red-700/60 mb-0.5"></div>
                            <span className="text-[12px] font-black text-red-700 uppercase leading-none tracking-tight">COMPLETE</span>
                            <div className="h-[1.5px] w-full bg-red-700/60 mt-0.5"></div>
                            <div className="flex gap-0.5 mt-0.5">
                                {[1,2,3].map(i => <span key={i} className="text-[7px] text-red-700/80">★</span>)}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </motion.div>
);

const ViewWeekly = () => {
    const navigate = useNavigate();
    const [weeklyPlan, setWeeklyPlan] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeDayIdx, setActiveDayIdx] = useState(0);

    // --- DARK MODE LOGIC ---
    const [darkMode, setDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');

    useEffect(() => {
        localStorage.setItem('theme', darkMode ? 'dark' : 'light');
    }, [darkMode]);

    // THEME HELPERS
    const bgMain = darkMode ? 'bg-[#0d110d]' : 'bg-[#f5faf4]';
    const cardBg = darkMode ? 'bg-[#1a1c1a]' : 'bg-white';
    const border = darkMode ? 'border-white/10' : 'border-[#ddd8ce]';
    const textMain = darkMode ? 'text-white' : 'text-[#1c3a1c]';
    const textSub = darkMode ? 'text-white/60' : 'text-[#5a7054]';
    const accentText = darkMode ? 'text-[#8ecb84]' : 'text-[#2d5a27]';
    
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (!storedUser) return navigate('/');
        const user = JSON.parse(storedUser);
        const userId = user.id || user.uid || user._id;

        axios.get(`http://localhost:5000/api/diets/weekly/${userId}`)
            .then(res => {
                setWeeklyPlan(res.data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Fetch error:", err);
                setLoading(false);
            });
    }, [navigate]);

    if (loading) return (
        <div className={`h-screen flex flex-col items-center justify-center ${bgMain}`}>
            <Loader2 className="animate-spin text-[#6a9966] mb-4" size={32} />
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#6a9966]">Loading Your Protocol</p>
        </div>
    );

    if (!weeklyPlan) return (
        <div className={`h-screen flex flex-col items-center justify-center ${bgMain} text-center p-10`}>
            <h2 className={`font-serif text-3xl italic mb-4 ${textMain}`}>No Weekly Plan Found</h2>
            <p className={`text-sm mb-8 ${textSub}`}>You haven't saved a weekly plan yet. Generate one to get started.</p>
            <button onClick={() => navigate('/generate-weekly')} className="bg-[#2d5a27] text-white px-8 py-4 rounded-xl font-bold text-[10px] uppercase tracking-[0.3em]">Generate Now</button>
        </div>
    );

    const activeDay = days[activeDayIdx];
    const currentDayPlan = weeklyPlan[activeDay];

    const isDayComplete = (dayName) => {
        if (!weeklyPlan || !weeklyPlan[dayName]) return false;
        
        const storedUser = localStorage.getItem('user');
        if (!storedUser) return false;
        const user = JSON.parse(storedUser);
        const userId = user.id || user.uid || user._id;
        
        const progress = localStorage.getItem(`progress_${dayName}_${userId}`);
        if (!progress) return false;
        
        const completedItems = JSON.parse(progress);
        const dayPlan = weeklyPlan[dayName];
        
        const mealCategories = ['breakfast', 'lunch', 'dinner'];
        let totalItems = 0;
        let completedCount = 0;

        mealCategories.forEach(meal => {
            const items = dayPlan[meal] || [];
            totalItems += items.length;
            items.forEach((_, idx) => {
                if (completedItems[`${meal}-${idx}`]) {
                    completedCount++;
                }
            });
        });
        
        return totalItems > 0 && completedCount >= totalItems;
    };

    return (
        <div className={`h-screen w-full ${bgMain} ${textMain} p-10 flex flex-col overflow-hidden transition-colors duration-500`}>
            
            {/* Header */}
            <header className="flex justify-between items-center mb-10 flex-shrink-0 relative z-50">
                <div className="flex items-center gap-6">
                    <button onClick={() => navigate('/dashboard')} className={`p-3 ${cardBg} rounded-full border ${border} hover:border-[#2d5a27] transition-all group`}>
                        <ArrowLeft size={18} className={`group-hover:text-[#2d5a27] ${darkMode ? 'text-white' : 'text-black'}`} />
                    </button>
                    <div>
                        <h1 className="font-serif text-3xl italic">Weekly Protocol</h1>
                        <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[#6a9966]">Comprehensive Nutrition Overview</p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className={`${cardBg} px-6 py-3 rounded-2xl border ${border} flex items-center gap-4 transition-colors`}>
                        <div className="text-right">
                            <p className="text-[8px] font-black uppercase opacity-40">Current Day</p>
                            <p className="text-sm font-bold">{activeDay}</p>
                        </div>
                        <Calendar className={accentText} size={20} />
                    </div>

                    {/* Dark Mode Toggle */}
                    <button
                        onClick={() => setDarkMode(!darkMode)}
                        className={`p-3 rounded-xl backdrop-blur-md transition-all ${
                            darkMode ? 'bg-white/10 text-yellow-400 hover:bg-white/20' : 'bg-black/10 text-[#1c3a1c] hover:bg-black/5'
                        }`}
                    >
                        {darkMode ? <Sun size={18} /> : <Moon size={18} />}
                    </button>
                </div>
            </header>

            <div className="flex-1 grid grid-cols-12 gap-8 min-h-0">
                {/* Day Navigation Sidebar */}
                <div className="col-span-3 space-y-3 overflow-y-auto pr-2 custom-scrollbar">
                    {days.map((day, idx) => (
                        <button 
                            key={day} 
                            onClick={() => setActiveDayIdx(idx)}
                            className={`w-full p-6 rounded-2xl border-2 transition-all text-left flex items-center justify-between group relative overflow-visible
                                ${activeDayIdx === idx 
                                    ? 'border-[#2d5a27] bg-[#1c3a1c] text-white shadow-lg' 
                                    : `${border} ${cardBg} hover:border-[#2d5a27]`}`}
                        >
                            <div className="relative z-10">
                                <p className={`text-[8px] font-black uppercase tracking-widest mb-1 ${activeDayIdx === idx ? 'text-[#8ecb84]' : 'text-[#6a9966]'}`}>Day 0{idx+1}</p>
                                <p className={`font-serif text-xl italic ${activeDayIdx === idx ? 'text-white' : textMain}`}>{day}</p>
                            </div>

                            {isDayComplete(day) && <span className="absolute right-4 top-4 text-[#8ecb84]"><CheckCircle2 size={16} /></span>}

                            <div className={`relative z-10 p-2 rounded-lg transition-colors ${activeDayIdx === idx ? 'bg-[#2d5a27]' : 'bg-black/5 text-[#2d5a27]'}`}>
                                {activeDayIdx === idx ? <Zap size={14} /> : <ChevronRight size={14} />}
                            </div>
                        </button>
                    ))}
                </div>

                {/* Day Details View */}
                <div className={`${cardBg} col-span-9 rounded-[40px] border ${border} shadow-sm flex flex-col overflow-hidden relative transition-colors`}>
                    <div className={`p-10 border-b ${border} flex justify-between items-center ${darkMode ? 'bg-white/5' : 'bg-[#fbfdfa]'}`}>
                        <div className="flex items-center gap-4 relative">
                            <div className="w-12 h-12 bg-[#2d5a27] rounded-2xl flex items-center justify-center text-white shadow-lg shadow-[#2d5a27]/20">
                                <Utensils size={24} />
                            </div>
                            <h2 className="font-serif text-4xl italic flex items-center gap-4">
                                {activeDay}'s Schedule
                                {isDayComplete(activeDay) && (
                                    <div className="scale-75 origin-left">
                                        <MissionCompleteSticker />
                                    </div>
                                )}
                            </h2>
                        </div>
                        <div className="flex gap-4">
                            <button onClick={() => setActiveDayIdx(prev => Math.max(0, prev - 1))} disabled={activeDayIdx === 0} className={`p-4 ${cardBg} border ${border} rounded-2xl hover:opacity-70 disabled:opacity-30`}><ChevronLeft size={20}/></button>
                            <button onClick={() => setActiveDayIdx(prev => Math.min(6, prev + 1))} disabled={activeDayIdx === 6} className={`p-4 ${cardBg} border ${border} rounded-2xl hover:opacity-70 disabled:opacity-30`}><ChevronRight size={20}/></button>
                        </div>
                    </div>

                    <div className="flex-1 p-10 overflow-y-auto custom-scrollbar">
                        <div className="grid grid-cols-3 gap-8">
                            {['breakfast', 'lunch', 'dinner'].map((type) => (
                                <div key={type} className="space-y-6">
                                    <div className={`flex items-center gap-3 border-b ${border} pb-4`}>
                                        <span className="w-2 h-2 rounded-full bg-[#8ecb84]"></span>
                                        <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-[#6a9966]">{type}</h3>
                                    </div>
                                    <div className="space-y-4">
                                        {currentDayPlan?.[type]?.map((meal, mIdx) => (
                                            <motion.div 
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                key={mIdx} 
                                                className={`${darkMode ? 'bg-white/5' : 'bg-[#f5faf4]'} p-5 rounded-3xl border ${border} group hover:border-[#8ecb84] transition-all`}
                                            >
                                                <div className="flex justify-between items-start mb-3">
                                                    <p className={`text-sm font-bold leading-tight flex-1 ${textMain}`}>{meal.name}</p>
                                                    <p className={`text-[10px] font-black ${darkMode ? 'bg-black/40 text-[#8ecb84]' : 'bg-white text-[#2d5a27]'} px-2 py-1 rounded-lg ml-2`}>{meal.calories} kcal</p>
                                                </div>
                                                <div className="flex items-center gap-4 text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                                                    <span className="flex items-center gap-1"><Zap size={10} className="text-[#8ecb84]"/> {meal.grams}g</span>
                                                    {meal.sugar !== undefined && <span>· Sugar {meal.sugar}g</span>}
                                                </div>
                                            </motion.div>
                                        ))}
                                        {(!currentDayPlan?.[type] || currentDayPlan[type].length === 0) && (
                                            <div className="py-10 text-center border-2 border-dashed border-white/10 rounded-3xl opacity-30">
                                                <p className="text-[9px] font-black uppercase">No meals defined</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    {/* Nutritional Footer */}
                    <div className="p-8 bg-[#1c3a1c] text-white flex justify-between items-center">
                        <div className="flex items-center gap-8">
                            <div className="flex items-center gap-3">
                                <Info size={16} className="text-[#8ecb84]" />
                                <p className="text-[10px] font-bold uppercase tracking-widest text-[#6a9966]">Daily Summary</p>
                            </div>
                            <div className="h-4 w-px bg-white/10"></div>
                            <p className="text-2xl font-serif italic">
                                Total Intake: <span className="text-[#8ecb84]">{currentDayPlan?.dailyTotal || 0}</span> <span className="text-xs not-italic font-sans font-bold opacity-40 uppercase tracking-widest">Calories</span>
                            </p>
                        </div>
                        <div className="flex items-center gap-2 px-6 py-2 bg-white/10 rounded-full border border-white/5">
                            <div className="w-2 h-2 rounded-full bg-[#8ecb84] animate-pulse"></div>
                            <span className="text-[9px] font-black uppercase tracking-widest">Active Protocol Day 0{activeDayIdx+1}</span>
                        </div>
                    </div>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{ __html: `.custom-scrollbar::-webkit-scrollbar { width: 4px; } .custom-scrollbar::-webkit-scrollbar-thumb { background: #6a9966; border-radius: 10px; }` }} />
        </div>
    );
};

export default ViewWeekly;