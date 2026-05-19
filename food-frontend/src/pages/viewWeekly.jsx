import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    ArrowLeft, Calendar, Utensils, Zap, Loader2, Info, 
    ChevronRight, ChevronLeft, Sun, Moon, CheckCircle2, AlertCircle
} from 'lucide-react';
import axios from 'axios';
import MissionCompleteSticker from '../components/MissionCompleteSticker';
import { useDarkMode } from '../hooks/useDarkMode';

import { DAYS } from '../utils/constants';

const ViewWeekly = () => {
    const navigate = useNavigate();
    const [weeklyPlan, setWeeklyPlan] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeDayIdx, setActiveDayIdx] = useState(0);
    const [darkMode, toggleDarkMode] = useDarkMode();

    // --- NEUBRUTALIST THEME CONSTANTS ---
    const panelBg = darkMode ? 'bg-[#2b1d4d]' : 'bg-[#fff7e8]';
    const cardBg = darkMode ? 'bg-[#3d2969]' : 'bg-white';
    const textMain = darkMode ? 'text-white' : 'text-[#2d1b4e]';
    const textSub = darkMode ? 'text-purple-200' : 'text-[#5c4b7f]';
    const border = 'border-[4px] border-black';
    const shadow = 'shadow-[8px_8px_0px_#000]';
    const accentYellow = 'bg-[#ffcf5a]';
    
    const standardDays = DAYS;
    const [orderedDays, setOrderedDays] = useState(standardDays);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (!storedUser) return navigate('/');
        const user = JSON.parse(storedUser);
        const userId = user.id || user.uid || user._id;

        axios.get(`http://localhost:5000/api/diets/weekly/${userId}`)
            .then(res => {
                const planData = res.data;
                setWeeklyPlan(planData);
                
                const anyDay = Object.keys(planData).find(d => planData[d].savedAt);
                if (anyDay) {
                    const timestamp = planData[anyDay].savedAt;
                    let savedDate;
                    
                    if (timestamp && timestamp._seconds) {
                        savedDate = new Date(timestamp._seconds * 1000);
                    } else {
                        savedDate = new Date(timestamp);
                    }

                    if (!isNaN(savedDate.getTime())) {
                        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                        const startDayName = dayNames[savedDate.getDay()];
                        
                        const startIndex = standardDays.indexOf(startDayName);
                        if (startIndex !== -1) {
                            const rotated = [
                                ...standardDays.slice(startIndex),
                                ...standardDays.slice(0, startIndex)
                            ];
                            setOrderedDays(rotated);
                        }
                    }
                }
                setLoading(false);
            })
            .catch(err => {
                console.error("Fetch error:", err);
                setLoading(false);
            });
    }, [navigate]);

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
            const items = dayPlan.meals?.[meal] || [];
            totalItems += items.length;
            items.forEach((_, idx) => {
                if (completedItems[`${meal}-${idx}`]) completedCount++;
            });
        });
        return totalItems > 0 && completedCount >= totalItems;
    };

    if (loading) return (
        <div className={`h-screen flex flex-col items-center justify-center ${panelBg} font-black text-2xl`}>
            <Loader2 className="animate-spin mb-4" size={48} />
            <p className="uppercase tracking-widest">Booting Protocol...</p>
        </div>
    );

    if (!weeklyPlan) return (
        <div className={`h-screen flex flex-col items-center justify-center ${panelBg} p-10 text-center`}>
            <div className={`max-w-md p-10 ${cardBg} ${border} ${shadow} rounded-[40px]`}>
                <AlertCircle size={64} className="mx-auto mb-6 text-red-500" />
                <h2 className={`text-3xl font-black uppercase mb-4 ${textMain}`}>Empty Archive</h2>
                <p className={`text-sm font-bold mb-8 ${textSub}`}>No saved protocol found in the database. You must generate a biometric plan first.</p>
                <button onClick={() => navigate('/generate-weekly')} className={`w-full py-4 bg-black text-white font-black uppercase border-[4px] border-black shadow-[6px_6px_0px_#ffcf5a] transition-all hover:translate-x-[2px]`}>
                    Initialize Generator
                </button>
            </div>
        </div>
    );

    const activeDay = orderedDays[activeDayIdx];
    const currentDayPlan = weeklyPlan[activeDay]?.meals;

    return (
        <div className={`h-screen w-full p-6 md:p-8 overflow-hidden relative flex flex-col transition-all duration-500`}
             style={{ background: darkMode ? 'linear-gradient(135deg,#1d1436,#241744,#301c56)' : 'linear-gradient(135deg,#ffe9b3,#ffd86b,#ffb347)' }}>
            
            {/* Header */}
            <header className="flex justify-between items-center mb-8 flex-shrink-0 relative z-50">
                <div className="flex items-center gap-6">
                    <button onClick={() => navigate('/dashboard')} className={`px-5 py-2 bg-black text-white ${border} shadow-[4px_4px_0px_#ffcf5a] text-[10px] font-black uppercase hover:translate-x-[2px] hover:shadow-none transition-all`}>
                        <ArrowLeft size={14} className="inline mr-2" /> HUB
                    </button>
                    <div>
                        <h1 className={`text-2xl font-black ${textMain}`}>Weekly Protocol</h1>
                        <p className="text-[9px] font-black uppercase text-[#ffcf5a] drop-shadow-[1px_1px_0px_#000]">Nutrition Archive</p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className={`${cardBg} ${border} shadow-[4px_4px_0px_#000] px-6 py-2 flex items-center gap-4`}>
                        <div className="text-right">
                            <p className="text-[8px] font-black uppercase opacity-40">Timeline</p>
                            <p className="text-xs font-black uppercase">{activeDay}</p>
                        </div>
                        <Calendar size={18} />
                    </div>
                    <button onClick={toggleDarkMode} className={`w-11 h-11 rounded-full ${border} shadow-[4px_4px_0px_#000] flex items-center justify-center transition-all ${darkMode ? 'bg-[#ffcf5a] text-black' : 'bg-[#2b1d4d] text-white'}`}>
                        {darkMode ? <Sun size={18} /> : <Moon size={18} />}
                    </button>
                </div>
            </header>

            <div className="flex-1 grid grid-cols-12 gap-8 min-h-0">
                {/* Sidebar Days */}
                <div className="col-span-12 lg:col-span-3 flex lg:flex-col gap-3 overflow-x-auto lg:overflow-y-auto pb-4 lg:pb-0 lg:pr-2 custom-scrollbar shrink-0">
                    {orderedDays.map((day, idx) => (
                        <button 
                            key={day} 
                            onClick={() => setActiveDayIdx(idx)}
                            className={`min-w-[140px] lg:w-full p-4 border-[3px] border-black transition-all text-left flex items-center justify-between group relative ${activeDayIdx === idx ? `${accentYellow} translate-y-1 shadow-none` : `bg-white ${shadow} hover:-translate-y-1`}`}
                        >
                            <div className="relative z-10">
                                <p className="text-[8px] font-black uppercase opacity-60 mb-1">Index 0{idx+1}</p>
                                <p className="font-black text-sm uppercase text-black">{day}</p>
                            </div>
                            {isDayComplete(day) && <CheckCircle2 size={16} className="text-green-600" />}
                            <div className={`p-1.5 border-2 border-black rounded shadow-[2px_2px_0px_#000] ${activeDayIdx === idx ? 'bg-black text-white' : 'bg-gray-100'}`}>
                                <ChevronRight size={12} />
                            </div>
                        </button>
                    ))}
                </div>

                {/* Main Content Area */}
                <div className={`${cardBg} col-span-12 lg:col-span-9 flex flex-col overflow-hidden relative ${border} ${shadow} rounded-[35px]`}>
                    <div className={`p-6 md:p-8 border-b-[4px] border-black flex justify-between items-center shrink-0`}>
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-black text-[#ffcf5a] border-[3px] border-black rounded-xl flex items-center justify-center shadow-[4px_4px_0px_#000]">
                                <Utensils size={24} />
                            </div>
                            <h2 className={`text-2xl md:text-3xl font-black uppercase flex items-center gap-4 ${textMain}`}>
                                {activeDay}
                                {isDayComplete(activeDay) && (
                                    <div className="scale-[0.6] origin-left">
                                        <MissionCompleteSticker />
                                    </div>
                                )}
                            </h2>
                        </div>
                        <div className="flex gap-4">
                            <button onClick={() => setActiveDayIdx(prev => Math.max(0, prev - 1))} disabled={activeDayIdx === 0} className="p-3 bg-white border-[3px] border-black shadow-[4px_4px_0px_#000] hover:translate-x-1 disabled:opacity-30"><ChevronLeft size={20}/></button>
                            <button onClick={() => setActiveDayIdx(prev => Math.min(6, prev + 1))} disabled={activeDayIdx === 6} className="p-3 bg-white border-[3px] border-black shadow-[4px_4px_0px_#000] hover:translate-x-1 disabled:opacity-30"><ChevronRight size={20}/></button>
                        </div>
                    </div>

                    {/* Meal Grid */}
                    <div className="flex-1 p-6 md:p-8 overflow-y-auto custom-scrollbar">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {['breakfast', 'lunch', 'dinner'].map((type) => (
                                <div key={type} className="flex flex-col h-full bg-gray-100/30 border-[3px] border-black rounded-[25px] p-4">
                                    <div className="bg-black text-white py-1.5 mb-4 text-center">
                                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em]">{type}</h3>
                                    </div>
                                    <div className="space-y-4 flex-1">
                                        {currentDayPlan?.[type]?.map((meal, mIdx) => (
                                            <motion.div 
                                                initial={{ opacity: 0, scale: 0.95 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                key={mIdx} 
                                                className={`bg-white border-[3px] border-black p-4 rounded-xl shadow-[4px_4px_0px_#000]`}
                                            >
                                                <p className="font-black text-xs uppercase mb-3 line-clamp-2 text-black">{meal.name}</p>
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="text-[9px] font-black bg-[#ffcf5a] border-2 border-black px-2 py-0.5">{meal.calories} KCAL</span>
                                                    <span className="text-[9px] font-black bg-gray-200 border-2 border-black px-2 py-0.5">{meal.grams}G</span>
                                                </div>
                                                {meal.sugar !== undefined && (
                                                    <div className="text-[8px] font-black uppercase opacity-40">Sugar: {meal.sugar}g</div>
                                                )}
                                            </motion.div>
                                        ))}
                                        {(!currentDayPlan?.[type] || currentDayPlan[type].length === 0) && (
                                            <div className="py-10 text-center border-[3px] border-dashed border-black/10 rounded-xl">
                                                <p className="text-[10px] font-black uppercase opacity-20">No Data</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    {/* Nutritional Footer */}
                    <div className="p-6 bg-black text-white flex flex-col md:flex-row justify-between items-center gap-4 shrink-0">
                        <div className="flex items-center gap-6">
                            <div className="flex items-center gap-3">
                                <Info size={16} className="text-[#ffcf5a]" />
                                <p className="text-[9px] font-black uppercase opacity-60">Daily Matrix</p>
                            </div>
                            <div className="hidden md:block h-6 w-[2px] bg-white/20"></div>
                            <p className="text-xl font-black uppercase">
                                Intake: <span className="text-[#ffcf5a]">{currentDayPlan?.dailyTotal || 0}</span> <span className="text-[10px] opacity-40">Calories</span>
                            </p>
                        </div>
                        <div className={`flex items-center gap-2 px-6 py-2 ${accentYellow} text-black border-[3px] border-black shadow-[4px_4px_0px_#fff] rounded-full`}>
                            <Zap size={14} className="animate-pulse" />
                            <span className="text-[9px] font-black uppercase">Protocol Active: Day 0{activeDayIdx+1}</span>
                        </div>
                    </div>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{ __html: `
                .custom-scrollbar::-webkit-scrollbar { width: 10px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: black; border-radius: 20px; border: 3px solid ${darkMode ? '#2b1d4d' : '#fff7e8'}; }
                .custom-scrollbar { scrollbar-width: thin; scrollbar-color: black transparent; }
                .line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
            ` }} />
        </div>
    );
};

export default ViewWeekly;