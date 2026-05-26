import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    ArrowLeft, Calendar, Utensils, Zap, Loader2, Info, 
    ChevronRight, ChevronLeft, Sun, Moon, CheckCircle2, X, Eye
} from 'lucide-react';
import axios from 'axios';
import MissionCompleteSticker from '../components/MissionCompleteSticker';
import { useDarkMode } from '../hooks/useDarkMode';
import { getThemeStyles } from '../theme/styles';

import { DAYS } from '../utils/constants';

const ViewWeekly = () => {
    const navigate = useNavigate();
    const [weeklyPlan, setWeeklyPlan] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeDayIdx, setActiveDayIdx] = useState(0);
    const [viewingDetails, setViewingDetails] = useState(null);
    const [darkMode, toggleDarkMode] = useDarkMode();

    const styles = getThemeStyles(darkMode);
    const { bgMain, cardBg, border, textMain, textSub, accentText } = styles;
    
    const standardDays = DAYS;
    const [orderedDays, setOrderedDays] = useState(standardDays);

    useEffect(() => {
        if (orderedDays && orderedDays.length > 0) {
            const todayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });
            const todayIndex = orderedDays.indexOf(todayName);
            if (todayIndex !== -1 && activeDayIdx !== todayIndex) {
                setActiveDayIdx(todayIndex);
            }
        }
    }, [orderedDays]);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (!storedUser) return navigate('/');
        const user = JSON.parse(storedUser);
        const userId = user.id || user.uid || user._id;

        axios.get(`http://localhost:5000/api/diets/weekly/${userId}`)
            .then(res => {
                const planData = res.data;
                setWeeklyPlan(planData);
                
                // Determine the starting day from the savedAt timestamp
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

    if (loading) return (
        <div className={`h-screen flex flex-col items-center justify-center ${bgMain}`}>
            <Loader2 className="animate-spin text-[#6a9966] mb-4" size={32} />
            <p className="text-xs font-black uppercase tracking-[0.4em] text-[#6a9966]">Loading Your Protocol</p>
        </div>
    );

    if (!weeklyPlan) return (
        <div className={`h-screen flex flex-col items-center justify-center ${bgMain} text-center p-10`}>
            <h2 className={`font-serif text-3xl italic mb-4 ${textMain}`}>No Weekly Plan Found</h2>
            <p className={`text-sm mb-8 ${textSub}`}>You haven't saved a weekly plan yet. Generate one to get started.</p>
            <button onClick={() => navigate('/generate-weekly')} className="bg-[#2d5a27] text-white px-8 py-4 font-bold text-xs uppercase tracking-[0.3em] clay-btn">Generate Now</button>
        </div>
    );

    const activeDay = orderedDays[activeDayIdx];
    const currentDayPlan = weeklyPlan[activeDay]?.meals;

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
                if (completedItems[`${meal}-${idx}`]) {
                    completedCount++;
                }
            });
        });
        
        return totalItems > 0 && completedCount >= totalItems;
    };

    // Render ingredients for the selected detailed view
   const renderIngredients = () => {
        const ing = viewingDetails?.ingredients;
        if (!ing) return null;

        let list = [];
        if (Array.isArray(ing)) {
            list = ing;
        } else if (typeof ing === 'string') {
            if (ing.trim().startsWith('[') && ing.trim().endsWith(']')) {
                try {
                    list = JSON.parse(ing);
                } catch (e) {
                    list = ing.split(',').map(x => x.trim());
                }
            } else {
                list = ing.split(',').map(x => x.trim());
            }
        }

        list = list.filter(item => item && item.trim().length > 0);
        if (list.length === 0) return null;

        return (
            <div className="mt-6 border-t border-white/5 pt-6">
                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[#2d5a27] dark:text-[#5cb351] mb-3">Ingredients</p>
                <div className="flex flex-wrap gap-2">
                    {list.map((item, idx) => (
                        <span 
                            key={idx} 
                            className={`px-3 py-1.5 text-[10px] font-bold rounded-lg border ${
                                darkMode 
                                    ? 'bg-white/5 border-white/10 text-white/80' 
                                    : 'bg-[#f5faf4] border-[#2d5a27]/10 text-[#2d5a27]'
                            } transition-colors`}
                        >
                            {item}
                        </span>
                    ))}
                </div>
            </div>
        );
    };
 



    const getImageUrl = (url) => {
        if (!url) return 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=1000';
        try {
            if (url.includes('imgurl=') || url.includes('url=') || url.includes('q=')) {
                const urlObj = new URL(url);
                const imgUrl = urlObj.searchParams.get('imgurl') || urlObj.searchParams.get('url') || urlObj.searchParams.get('q');
                if (imgUrl) {
                    let decoded = decodeURIComponent(imgUrl);
                    if (!decoded.startsWith('http://') && !decoded.startsWith('https://')) decoded = 'https://' + decoded;
                    return decoded;
                }
            }
        } catch (e) {}
        return url;
    };

    return (
        <div className={`h-screen w-full ${bgMain} ${textMain} p-10 flex flex-col overflow-hidden transition-colors duration-500`}>
            
            <header className="flex justify-between items-center mb-10 flex-shrink-0 relative z-50">
                <div className="flex items-center gap-6">
                    <button onClick={() => navigate('/dashboard')} className={`p-3 ${cardBg} rounded-full border ${border} hover:border-[#2d5a27] transition-all group`}>
                        <ArrowLeft size={18} className={`group-hover:text-[#2d5a27] ${darkMode ? 'text-white' : 'text-black'}`} />
                    </button>
                    <div>
                        <h1 className="font-serif text-3xl italic">Weekly Diet</h1>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className={`${cardBg} px-6 py-3 flex items-center gap-4 transition-colors clay-card`}>
                        <div className="text-right">
                            <p className="text-xs font-black uppercase opacity-50 tracking-wider">Current Day</p>
                            <p className="text-sm font-bold">{activeDay}</p>
                        </div>
                        <Calendar className={accentText} size={20} />
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={toggleDarkMode}
                            className={`p-3 rounded-xl backdrop-blur-md transition-all ${
                                darkMode ? 'bg-white/10 text-yellow-400 hover:bg-white/20' : 'bg-black/10 text-[#1c3a1c] hover:bg-black/5'
                            }`}
                        >
                            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
                        </button>
                    </div>
                </div>
            </header>

            <div className="flex-1 grid grid-cols-12 gap-8 min-h-0">
                <div className="col-span-2 space-y-3 overflow-y-auto pr-2 custom-scrollbar">
                    {orderedDays.map((day, idx) => (
                        <button 
                            key={day} 
                            onClick={() => setActiveDayIdx(idx)}
                            className={`w-full p-4 transition-all text-left flex items-center justify-between group relative overflow-visible clay-btn
                                ${activeDayIdx === idx 
                                    ? 'bg-[#1c3a1c] text-white scale-105' 
                                    : `${cardBg} hover:border-[#2d5a27]`}`}
                        >
                            <div className="relative z-10">
                                <p className={`text-xs font-black uppercase tracking-wider mb-1 ${activeDayIdx === idx ? 'text-[#8ecb84]' : 'text-[#6a9966]'}`}>Day 0{idx+1}</p>
                                <p className={`font-serif text-xl italic ${activeDayIdx === idx ? 'text-white' : textMain}`}>{day}</p>
                            </div>

                            {isDayComplete(day) && <span className="absolute right-4 top-4 text-[#8ecb84]"><CheckCircle2 size={16} /></span>}

                            <div className={`relative z-10 p-2 rounded-lg transition-colors ${activeDayIdx === idx ? 'bg-[#2d5a27]' : 'bg-black/5 text-[#2d5a27]'}`}>
                                {activeDayIdx === idx ? <Zap size={14} /> : <ChevronRight size={14} />}
                            </div>
                        </button>
                    ))}
                </div>

                <div className={`${cardBg} col-span-10 flex flex-col overflow-hidden relative transition-colors clay-card`}>
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
                            <button onClick={() => setActiveDayIdx(prev => Math.max(0, prev - 1))} disabled={activeDayIdx === 0} className={`p-4 ${cardBg} hover:opacity-70 disabled:opacity-30 transition-all clay-btn`}><ChevronLeft size={20}/></button>
                            <button onClick={() => setActiveDayIdx(prev => Math.min(6, prev + 1))} disabled={activeDayIdx === 6} className={`p-4 ${cardBg} hover:opacity-70 disabled:opacity-30 transition-all clay-btn`}><ChevronRight size={20}/></button>
                        </div>
                    </div>

                    <div className="flex-1 p-10 overflow-y-auto custom-scrollbar">
                        <div className="grid grid-cols-3 gap-8">
                            {['breakfast', 'lunch', 'dinner'].map((type) => (
                                <div key={type} className="space-y-6">
                                    <div className={`flex items-center gap-3 border-b ${border} pb-4`}>
                                        <span className="w-2 h-2 rounded-full bg-[#8ecb84]"></span>
                                        <h3 className={`text-xs font-black uppercase tracking-[0.2em] ${darkMode ? 'text-[#8ecb84]' : 'text-[#2d5a27]'}`}>{type}</h3>
                                    </div>
                                    <div className="space-y-4">
                                        {currentDayPlan?.[type]?.map((meal, mIdx) => (
                                            <motion.div 
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                key={mIdx} 
                                                onClick={() => setViewingDetails(meal)}
                                                className="border min-h-[280px] p-6 flex flex-col gap-4 group/item transition-all rounded-xl relative overflow-hidden shadow-lg border-white/10 cursor-pointer"
                                            >
                                                <div 
                                                    className="absolute inset-0 z-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
                                                    style={{ backgroundImage: `url('${getImageUrl(meal.imageUrl || meal.imageURL || meal.image || meal.imagePath)}')` }}
                                                />
                                                <div className="absolute inset-0 z-0 bg-black/40 group-hover:bg-black/30 transition-colors duration-300" />
                                                <div className="flex-1 relative z-10 flex flex-col justify-end">
                                                    <span className="text-base font-black block mb-1 leading-tight text-white drop-shadow-sm">{meal.name}</span>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[10px] font-bold text-white/80 uppercase tracking-widest">{meal.calories} kcal</span>
                                                        <span className="w-1 h-1 rounded-full bg-[#5cb351]"></span>
                                                        <span className="text-[10px] font-bold text-white/80 uppercase tracking-widest">{meal.grams}g</span>
                                                        {meal.sugar !== undefined && (
                                                            <>
                                                                <span className="w-1 h-1 rounded-full bg-[#5cb351]"></span>
                                                                <span className="text-[10px] font-bold text-white/80 uppercase tracking-widest">Sugar {meal.sugar}g</span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                        {(!currentDayPlan?.[type] || currentDayPlan[type].length === 0) && (
                                            <div className="py-10 text-center border-2 border-dashed border-white/10 rounded-3xl opacity-30">
                                                <p className="text-xs font-black uppercase">No meals defined</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{ __html: `.custom-scrollbar::-webkit-scrollbar { width: 4px; } .custom-scrollbar::-webkit-scrollbar-thumb { background: #6a9966; border-radius: 10px; }` }} />

            <AnimatePresence>
                {viewingDetails && (
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="fixed inset-0 z-[400] bg-black/80 flex items-center justify-center p-6"
                        onClick={() => setViewingDetails(null)}
                    >
                        <motion.div 
                            initial={{ opacity: 0, y: 24 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 16 }}
                            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                            className={`${cardBg} w-full max-w-4xl overflow-hidden relative clay-card`}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex flex-col md:flex-row h-full">
                                <div className="md:w-[55%] h-80 md:h-auto bg-gray-100 overflow-hidden relative">
                                    <img 
                                        src={getImageUrl(viewingDetails.imageUrl || viewingDetails.imageURL || viewingDetails.image || viewingDetails.imagePath)} 
                                        alt={viewingDetails.name}
                                        className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-8">
                                        <h2 className="font-serif text-3xl italic text-white">{viewingDetails.name}</h2>
                                    </div>
                                </div>
                                <div className="md:w-[45%] p-8 overflow-y-auto max-h-[85vh] custom-scrollbar">
                                    <div className="flex justify-between items-start mb-6">
                                        <div>
                                            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[#2d5a27] dark:text-[#5cb351] mb-1">Nutritional Analysis</p>
                                            <p className={`text-xs ${textSub} italic`}>Organic Recommendation</p>
                                        </div>
                                        <button onClick={() => setViewingDetails(null)} className={`p-2 rounded-xl ${darkMode ? 'bg-white/5 hover:bg-white/10' : 'bg-black/5 hover:bg-black/10'} clay-btn`}><X size={18}/></button>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 mb-8">
                                        <div className={`p-4 rounded-xl ${darkMode ? 'bg-white/5' : 'bg-[#f5faf4]'} border ${border}`}>
                                            <p className="text-[8px] font-black uppercase text-[#2d5a27] dark:text-[#5cb351] mb-1">Energy</p>
                                            <p className="text-xl font-serif italic text-[#2d5a27] dark:text-[#5cb351]">{viewingDetails.calories} <span className="text-[10px] not-italic font-bold opacity-40">kcal</span></p>
                                        </div>
                                        <div className={`p-4 rounded-xl ${darkMode ? 'bg-white/5' : 'bg-[#f5faf4]'} border ${border}`}>
                                            <p className="text-[8px] font-black uppercase text-[#2d5a27] dark:text-[#5cb351] mb-1">Portion</p>
                                            <p className="text-xl font-serif italic text-[#2d5a27] dark:text-[#5cb351]">{viewingDetails.grams} <span className="text-[10px] not-italic font-bold opacity-40">g</span></p>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        {[
                                            { label: 'Protein', value: viewingDetails.protein, unit: 'g' },
                                            { label: 'Carbs', value: viewingDetails.carbs || viewingDetails.carbohydrates, unit: 'g' },
                                            { label: 'Fats', value: viewingDetails.fat || viewingDetails.saturatedFat, unit: 'g' },
                                            { label: 'Sugar', value: viewingDetails.sugar, unit: 'g' },
                                            { label: 'Sodium', value: viewingDetails.sodium, unit: 'mg' },
                                            { label: 'Fiber', value: viewingDetails.fiber, unit: 'g' },
                                        ]
                                        .filter(n => n.value !== undefined && n.value !== null)
                                        .map((n, i) => (
                                            <div key={i} className="flex justify-between items-center py-2 border-b border-white/5">
                                                <span className={`text-[10px] font-bold uppercase tracking-widest ${textSub}`}>{n.label}</span>
                                                <span className="text-xs font-bold">{n.value}{n.unit}</span>
                                            </div>
                                        ))}
                                    </div>

                                    {renderIngredients()}

                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ViewWeekly;