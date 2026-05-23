import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    ArrowLeft, History as HistoryIcon, Search, Calendar, ChevronRight,
    Moon, Sun, TrendingUp, Award, CalendarDays
} from 'lucide-react';
import { useDarkMode } from '../hooks/useDarkMode';
import { getThemeStyles } from '../theme/styles';
import axios from 'axios';

const mockHistoryData = [
    { id: 1, week: 'Week 4 (Current)', date: 'May 14 - May 20, 2026', completion: 92, status: 'Active', color: '#8ecb84' },
    { id: 2, week: 'Week 3', date: 'May 7 - May 13, 2026', completion: 100, status: 'Completed', color: '#f5c842' },
    { id: 3, week: 'Week 2', date: 'April 30 - May 6, 2026', completion: 85, status: 'Completed', color: '#6ab8ff' },
    { id: 4, week: 'Week 1', date: 'April 23 - April 29, 2026', completion: 78, status: 'Completed', color: '#a8d8ea' }
];

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

const ViewHistory = () => {
    const navigate = useNavigate();
    const [darkMode, toggleDarkMode] = useDarkMode();
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    
    const styles = getThemeStyles(darkMode);
    const { bgMain, cardBg, border, textMain, textSub, accentText } = styles;

    const getPlanCompletion = (weeklyPlan, userId) => {
        if (!weeklyPlan) return 0;
        let totalItems = 0;
        let completedCount = 0;
        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        
        days.forEach(day => {
            const dayPlan = weeklyPlan[day];
            if (dayPlan && dayPlan.meals) {
                const progress = localStorage.getItem(`progress_${day}_${userId}`);
                const completedItems = progress ? JSON.parse(progress) : {};
                
                ['breakfast', 'lunch', 'dinner'].forEach(meal => {
                    const items = dayPlan.meals[meal] || [];
                    totalItems += items.length;
                    items.forEach((_, idx) => {
                        if (completedItems[`${meal}-${idx}`]) {
                            completedCount++;
                        }
                    });
                });
            }
        });
        
        return totalItems > 0 ? Math.round((completedCount / totalItems) * 100) : 0;
    };

    const formatDateRange = (savedAt) => {
        if (!savedAt) return "N/A";
        let start;
        if (savedAt._seconds || savedAt.seconds) {
            start = new Date((savedAt._seconds || savedAt.seconds) * 1000);
        } else {
            start = new Date(savedAt);
        }
        
        if (isNaN(start.getTime())) return "N/A";
        
        const end = new Date(start.getTime() + 6 * 24 * 60 * 60 * 1000);
        
        const options = { month: 'short', day: 'numeric' };
        const startStr = start.toLocaleDateString('en-US', options);
        const endStr = end.toLocaleDateString('en-US', { ...options, year: 'numeric' });
        
        return `${startStr} - ${endStr}`;
    };

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const storedUser = localStorage.getItem('user');
                if (!storedUser) {
                    navigate('/');
                    return;
                }
                const user = JSON.parse(storedUser);
                const userId = user.id || user.uid || user._id;

                // 1. Fetch current active plan
                let activePlan = null;
                try {
                    const activeRes = await axios.get(`http://localhost:5000/api/diets/weekly/${userId}`);
                    if (activeRes.data && Object.keys(activeRes.data).length > 0) {
                        activePlan = activeRes.data;
                    }
                } catch (e) {
                    console.log("No active weekly plan found.");
                }

                // 2. Fetch history
                let archivedPlans = [];
                try {
                    const historyRes = await axios.get(`http://localhost:5000/api/diets/history/${userId}`);
                    if (Array.isArray(historyRes.data)) {
                        archivedPlans = historyRes.data;
                    }
                } catch (e) {
                    console.error("Error fetching history list:", e);
                }

                // 3. Assemble combined history
                const combined = [];
                const totalPlans = archivedPlans.length + (activePlan ? 1 : 0);
                const colors = ['#f5c842', '#6ab8ff', '#a8d8ea', '#fcb9aa', '#b5e2fa'];

                if (activePlan) {
                    const anyDay = Object.keys(activePlan).find(d => activePlan[d].savedAt);
                    let dateStr = "Current Week";
                    if (anyDay && activePlan[anyDay].savedAt) {
                        const ts = activePlan[anyDay].savedAt;
                        const date = ts._seconds ? new Date(ts._seconds * 1000) : new Date(ts);
                        const end = new Date(date.getTime() + 6 * 24 * 60 * 60 * 1000);
                        dateStr = `${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
                    }

                    combined.push({
                        id: 'active',
                        week: `Week ${totalPlans} (Current)`,
                        date: dateStr,
                        completion: getPlanCompletion(activePlan, userId),
                        status: 'Active',
                        color: '#8ecb84'
                    });
                }

                archivedPlans.forEach((record, index) => {
                    combined.push({
                        id: record.id || `archived-${index}`,
                        week: `Week ${totalPlans - (activePlan ? 1 : 0) - index}`,
                        date: formatDateRange(record.savedAt),
                        completion: record.completion || 0,
                        status: 'Completed',
                        color: colors[index % colors.length]
                    });
                });

                setHistory(combined);
            } catch (error) {
                console.error("Error fetching history:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, [navigate]);

    const avgCompletion = history.length > 0 ? Math.round(history.reduce((acc, h) => acc + h.completion, 0) / history.length) : 0;
    const consistency = history.length === 0 ? 'N/A' :
                        avgCompletion >= 85 ? 'High' :
                        avgCompletion >= 60 ? 'Medium' : 'Low';

    return (
        <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={`min-h-screen w-full ${bgMain} ${textMain} p-6 md:p-10 flex flex-col transition-colors duration-500 overflow-y-auto`}
        >
            {/* Header */}
            <header className="flex justify-between items-center mb-10 relative z-50">
                <div className="flex items-center gap-6">
                    <button onClick={() => navigate('/dashboard')} className={`p-3 ${cardBg} rounded-full border ${border} hover:border-[#2d5a27] transition-all group`}>
                        <ArrowLeft size={18} className={`group-hover:text-[#2d5a27] ${darkMode ? 'text-white' : 'text-black'}`} />
                    </button>
                    <div>
                        <h1 className="font-serif text-3xl italic">Diet History</h1>
                        <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[#6a9966]">Past Protocol Archives</p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {/* Dark Mode Toggle */}
                    <button
                        onClick={toggleDarkMode}
                        className={`p-3 rounded-xl backdrop-blur-md transition-all ${
                            darkMode ? 'bg-white/10 text-yellow-400 hover:bg-white/20' : 'bg-black/10 text-[#1c3a1c] hover:bg-black/5'
                        }`}
                    >
                        {darkMode ? <Sun size={18} /> : <Moon size={18} />}
                    </button>
                </div>
            </header>

            <div className="flex-1 max-w-5xl mx-auto w-full">
                
                {/* Stats Summary Section */}
                <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    <div className={`${cardBg} p-8 rounded-3xl border ${border} flex items-center gap-6 shadow-sm`}>
                        <div className="p-4 bg-[#8ecb84]/20 rounded-2xl text-[#8ecb84]">
                            <HistoryIcon size={32} />
                        </div>
                        <div>
                            <p className={`text-[10px] font-bold uppercase tracking-widest ${textSub} mb-1`}>Total Plans</p>
                            <p className="text-3xl font-serif italic">{history.length} <span className="text-sm font-sans not-italic font-bold opacity-50">{history.length === 1 ? 'Week' : 'Weeks'}</span></p>
                        </div>
                    </div>
                    
                    <div className={`${cardBg} p-8 rounded-3xl border ${border} flex items-center gap-6 shadow-sm`}>
                        <div className="p-4 bg-[#f5c842]/20 rounded-2xl text-[#f5c842]">
                            <Award size={32} />
                        </div>
                        <div>
                            <p className={`text-[10px] font-bold uppercase tracking-widest ${textSub} mb-1`}>Avg Completion</p>
                            <p className="text-3xl font-serif italic">{avgCompletion} <span className="text-sm font-sans not-italic font-bold opacity-50">%</span></p>
                        </div>
                    </div>

                    <div className={`${cardBg} p-8 rounded-3xl border ${border} flex items-center gap-6 shadow-sm`}>
                        <div className="p-4 bg-[#6ab8ff]/20 rounded-2xl text-[#6ab8ff]">
                            <TrendingUp size={32} />
                        </div>
                        <div>
                            <p className={`text-[10px] font-bold uppercase tracking-widest ${textSub} mb-1`}>Consistency</p>
                            <p className="text-3xl font-serif italic">{consistency} <span className="text-sm font-sans not-italic font-bold opacity-50">Rating</span></p>
                        </div>
                    </div>
                </motion.div>

                {/* History Timeline */}
                <motion.div variants={itemVariants}>
                    <div className="flex items-center gap-3 mb-6">
                        <CalendarDays size={18} className="text-[#8ecb84]" />
                        <h2 className="font-serif text-2xl italic">Timeline</h2>
                    </div>

                    <div className="space-y-6 relative before:absolute before:inset-y-0 before:left-8 before:w-0.5 before:bg-[#8ecb84]/30 before:rounded-full">
                        {history.map((record, index) => (
                            <motion.div 
                                key={record.id}
                                variants={itemVariants}
                                whileHover={{ scale: 1.01 }}
                                className={`relative pl-24 transition-all`}
                            >
                                {/* Timeline Dot */}
                                <div className="absolute left-8 -translate-x-1/2 w-4 h-4 rounded-full border-4 shadow-md bg-white border-[#8ecb84] top-1/2 -translate-y-1/2 z-10" 
                                     style={{ borderColor: record.color }}
                                />

                                <div className={`${cardBg} p-6 border ${border} rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-lg transition-shadow cursor-pointer group`}>
                                    <div>
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="font-serif text-xl italic">{record.week}</h3>
                                            <span className={`text-[9px] font-bold uppercase px-3 py-1 rounded-full`}
                                                style={{ 
                                                    backgroundColor: `${record.color}20`,
                                                    color: darkMode ? record.color : '#2d5a27'
                                                }}
                                            >
                                                {record.status}
                                            </span>
                                        </div>
                                        <p className={`text-xs font-semibold ${textSub} flex items-center gap-2`}>
                                            <Calendar size={12} />
                                            {record.date}
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-8">
                                        <div className="text-right">
                                            <p className={`text-[10px] font-bold uppercase tracking-widest ${textSub} mb-1`}>Completion</p>
                                            <div className="flex items-center gap-3">
                                                <div className="w-32 h-2 bg-black/10 rounded-full overflow-hidden border border-black/5 dark:border-white/5">
                                                    <motion.div 
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${record.completion}%` }}
                                                        transition={{ duration: 1, delay: 0.2 + (index * 0.1) }}
                                                        className="h-full rounded-full"
                                                        style={{ backgroundColor: record.color }}
                                                    />
                                                </div>
                                                <span className="font-bold text-sm">{record.completion}%</span>
                                            </div>
                                        </div>
                                        
                                        <div className={`p-2 rounded-xl transition-colors ${darkMode ? 'bg-white/5 group-hover:bg-white/10' : 'bg-black/5 group-hover:bg-black/10'}`}>
                                            <ChevronRight size={20} className={textSub} />
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            </div>
        </motion.div>
    );
};

export default ViewHistory;
