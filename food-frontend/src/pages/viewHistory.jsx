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

                // For now, we only fetch the CURRENT active weekly plan 
                // because the backend doesn't save an archive of old plans yet!
                const res = await axios.get(`http://localhost:5000/api/diets/weekly/${userId}`);
                const planData = res.data;

                if (planData && Object.keys(planData).length > 0) {
                    // Find the timestamp
                    const anyDay = Object.keys(planData).find(d => planData[d].savedAt);
                    let dateStr = "Current Week";
                    if (anyDay && planData[anyDay].savedAt) {
                        const ts = planData[anyDay].savedAt;
                        const date = new Date((ts._seconds || ts.seconds) * 1000);
                        dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                    }

                    // Push the current plan as the first "Active" history record.
                    // We mock completion to 0% because completion tracking isn't built yet!
                    setHistory([
                        { 
                            id: 1, 
                            week: 'Active Protocol', 
                            date: `Started: ${dateStr}`, 
                            completion: 0, 
                            status: 'Active', 
                            color: '#8ecb84' 
                        }
                    ]);
                }
            } catch (error) {
                console.error("Error fetching history:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, [navigate]);

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
                            <p className="text-3xl font-serif italic">4 <span className="text-sm font-sans not-italic font-bold opacity-50">Weeks</span></p>
                        </div>
                    </div>
                    
                    <div className={`${cardBg} p-8 rounded-3xl border ${border} flex items-center gap-6 shadow-sm`}>
                        <div className="p-4 bg-[#f5c842]/20 rounded-2xl text-[#f5c842]">
                            <Award size={32} />
                        </div>
                        <div>
                            <p className={`text-[10px] font-bold uppercase tracking-widest ${textSub} mb-1`}>Avg Completion</p>
                            <p className="text-3xl font-serif italic">88 <span className="text-sm font-sans not-italic font-bold opacity-50">%</span></p>
                        </div>
                    </div>

                    <div className={`${cardBg} p-8 rounded-3xl border ${border} flex items-center gap-6 shadow-sm`}>
                        <div className="p-4 bg-[#6ab8ff]/20 rounded-2xl text-[#6ab8ff]">
                            <TrendingUp size={32} />
                        </div>
                        <div>
                            <p className={`text-[10px] font-bold uppercase tracking-widest ${textSub} mb-1`}>Consistency</p>
                            <p className="text-3xl font-serif italic">High <span className="text-sm font-sans not-italic font-bold opacity-50">Rating</span></p>
                        </div>
                    </div>
                </motion.div>

                {/* ATTENTION ALERT FOR THE USER */}
                <motion.div variants={itemVariants} className="mb-8 p-6 bg-red-500/10 border border-red-500/20 rounded-2xl relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-1 h-full bg-red-500"></div>
                    <h3 className="text-red-500 font-bold mb-2 flex items-center gap-2">
                        <TrendingUp size={16} />
                        SYSTEM NOTICE: Backend Features Required
                    </h3>
                    <p className={`text-sm ${textSub} leading-relaxed`}>
                        This page is now successfully fetching from the database! However, it is currently only displaying your <strong>Active Protocol</strong>. 
                        To populate this history timeline properly, we need to build two backend mechanisms:
                        <br/><br/>
                        1. <strong>Archiving System:</strong> Currently, generating a new plan overwrites the old one. We need to save old plans to a new <code>dietHistory</code> collection instead of deleting them. <br/>
                        2. <strong>Completion Tracking:</strong> The system needs a way to track which meals you actually ate each day to calculate the % completion shown below.
                    </p>
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
