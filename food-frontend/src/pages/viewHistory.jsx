import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    ArrowLeft, History as HistoryIcon, Calendar, ChevronDown, ChevronUp,
    Moon, Sun, TrendingUp, TrendingDown, Award, CalendarDays, Trash2, Loader2,
    Zap, Utensils, Flame, ArrowUpRight, ArrowDownRight, Minus, Lightbulb,
    Heart, Scale, Ruler, Activity, Target, Sparkles
} from 'lucide-react';
import { useDarkMode } from '../hooks/useDarkMode';
import { getThemeStyles } from '../theme/styles';
import axios from 'axios';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.1 }
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

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// ─── Helpers ──────────────────────────────────────────────
const calcWeekTotals = (plan) => {
    let calories = 0, sugar = 0, grams = 0, mealCount = 0;
    if (!plan) return { calories, sugar, grams, mealCount };
    DAYS.forEach(day => {
        const meals = plan[day];
        if (meals) {
            ['breakfast', 'lunch', 'dinner'].forEach(type => {
                (meals[type] || []).forEach(item => {
                    calories += (item.calories || 0);
                    sugar += (item.sugar || 0);
                    grams += (item.grams || 0);
                    mealCount++;
                });
            });
        }
    });
    return { calories, sugar, grams, mealCount };
};

const calcDailyAvg = (total, days = 7) => Math.round(total / days);

// Find the closest weight_history entry to a given date
const findClosestWeight = (weightLogs, targetDate) => {
    if (!weightLogs || weightLogs.length === 0) return null;
    let closest = null;
    let minDiff = Infinity;
    weightLogs.forEach(log => {
        const logTime = log.createdAt?._seconds 
            ? log.createdAt._seconds * 1000 
            : new Date(log.createdAt).getTime();
        const diff = Math.abs(logTime - targetDate);
        if (diff < minDiff) {
            minDiff = diff;
            closest = log;
        }
    });
    return closest;
};

// ─── Motivational Quotes ──────────────────────────────────
const motivationalQuotes = [
    "Every meal is a chance to nourish your body. You're building a healthier you, one bite at a time! 💪",
    "Progress isn't always linear — but showing up every week proves you're committed. Keep going! 🌟",
    "Small changes lead to big transformations. Your consistency is your superpower! 🔥",
    "You didn't come this far to only come this far. The best results are still ahead! 🚀",
    "Discipline is choosing between what you want NOW and what you want MOST. You're choosing wisely! ✨",
    "Your body is a reflection of your habits. These weekly improvements are proof of your dedication! 🏆",
    "Champions aren't made in the gym — they're made in the kitchen. You're doing amazing! 💚",
    "Remember: this isn't a diet, it's a lifestyle upgrade. And you're acing it! 🌿"
];

const ViewHistory = () => {
    const navigate = useNavigate();
    const [darkMode, toggleDarkMode] = useDarkMode();
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedWeek, setExpandedWeek] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [userId, setUserId] = useState(null);
    const [activePlanData, setActivePlanData] = useState(null);
    const [archivedPlansData, setArchivedPlansData] = useState([]);
    const [healthProfile, setHealthProfile] = useState(null);
    const [weightHistory, setWeightHistory] = useState([]);
    const [activeMetric, setActiveMetric] = useState('calories'); // 'calories', 'weight', 'adherence', 'sugar'
    const [hoveredPoint, setHoveredPoint] = useState(null);
    
    const styles = getThemeStyles(darkMode);
    const { bgMain, cardBg, border, textMain, textSub } = styles;

    const getPlanCompletion = (weeklyPlan, uid) => {
        if (!weeklyPlan) return 0;
        let totalItems = 0;
        let completedCount = 0;
        DAYS.forEach(day => {
            const dayPlan = weeklyPlan[day];
            if (dayPlan && dayPlan.meals) {
                const progress = localStorage.getItem(`progress_${day}_${uid}`);
                const completedItems = progress ? JSON.parse(progress) : {};
                ['breakfast', 'lunch', 'dinner'].forEach(meal => {
                    const items = dayPlan.meals[meal] || [];
                    totalItems += items.length;
                    items.forEach((_, idx) => {
                        if (completedItems[`${meal}-${idx}`]) completedCount++;
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
        return `${start.toLocaleDateString('en-US', options)} - ${end.toLocaleDateString('en-US', { ...options, year: 'numeric' })}`;
    };

    const getTimestamp = (savedAt) => {
        if (!savedAt) return 0;
        if (savedAt._seconds) return savedAt._seconds * 1000;
        if (savedAt.seconds) return savedAt.seconds * 1000;
        return new Date(savedAt).getTime();
    };

    const handleDeletePlan = async () => {
        if (!window.confirm("⚠️ WARNING: Are you sure you want to delete your active weekly diet plan? This will clear your database plans and active checklists. This action cannot be undone.")) {
            return;
        }
        try {
            setIsDeleting(true);
            await axios.delete(`http://localhost:5000/api/diets/weekly/${userId}`);
            DAYS.forEach(day => {
                localStorage.removeItem(`progress_${day}_${userId}`);
                localStorage.removeItem(`day_done_${day}_${userId}`);
            });
            setActivePlanData(null);
            setHistory(prev => prev.filter(h => h.id !== 'active'));
        } catch (err) {
            console.error("Failed to delete plan:", err);
        } finally {
            setIsDeleting(false);
        }
    };

    useEffect(() => {
        const fetchAll = async () => {
            try {
                const storedUser = localStorage.getItem('user');
                if (!storedUser) { navigate('/'); return; }
                const user = JSON.parse(storedUser);
                const uid = user.id || user.uid || user._id;
                setUserId(uid);

                // Fetch all data in parallel
                const [activeRes, historyRes, healthRes, weightRes] = await Promise.allSettled([
                    axios.get(`http://localhost:5000/api/diets/weekly/${uid}`),
                    axios.get(`http://localhost:5000/api/diets/history/${uid}`),
                    axios.get(`http://localhost:5000/api/health/${uid}`),
                    axios.get(`http://localhost:5000/api/health/weight-history/${uid}`)
                ]);

                let activePlan = null;
                if (activeRes.status === 'fulfilled' && activeRes.value.data && Object.keys(activeRes.value.data).length > 0) {
                    activePlan = activeRes.value.data;
                    setActivePlanData(activeRes.value.data);
                }

                let archivedPlans = [];
                if (historyRes.status === 'fulfilled' && Array.isArray(historyRes.value.data)) {
                    archivedPlans = historyRes.value.data;
                    setArchivedPlansData(historyRes.value.data);
                }

                if (healthRes.status === 'fulfilled' && healthRes.value.data) {
                    setHealthProfile(healthRes.value.data);
                }

                if (weightRes.status === 'fulfilled' && Array.isArray(weightRes.value.data)) {
                    setWeightHistory(weightRes.value.data);
                }

                // Assemble timeline
                const combined = [];
                const totalPlans = archivedPlans.length + (activePlan ? 1 : 0);
                const colors = ['#f5c842', '#6ab8ff', '#a8d8ea', '#fcb9aa', '#b5e2fa'];

                if (activePlan) {
                    const anyDay = Object.keys(activePlan).find(d => activePlan[d].savedAt);
                    let dateStr = "Current Week";
                    let savedAt = null;
                    if (anyDay && activePlan[anyDay].savedAt) {
                        savedAt = activePlan[anyDay].savedAt;
                        const ts = savedAt;
                        const date = ts._seconds ? new Date(ts._seconds * 1000) : new Date(ts);
                        const end = new Date(date.getTime() + 6 * 24 * 60 * 60 * 1000);
                        dateStr = `${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
                    }
                    combined.push({
                        id: 'active',
                        week: `Week ${totalPlans} (Current)`,
                        date: dateStr,
                        completion: getPlanCompletion(activePlan, uid),
                        status: 'Active',
                        color: '#8ecb84',
                        savedAt
                    });
                }

                archivedPlans.forEach((record, index) => {
                    combined.push({
                        id: record.id || `archived-${index}`,
                        week: `Week ${totalPlans - (activePlan ? 1 : 0) - index}`,
                        date: formatDateRange(record.savedAt),
                        completion: record.completion || 0,
                        status: 'Completed',
                        color: colors[index % colors.length],
                        savedAt: record.savedAt
                    });
                });

                setHistory(combined);
            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchAll();
    }, [navigate]);

    // Build plan data lookup
    const planDataMap = useMemo(() => {
        const map = {};
        if (activePlanData) {
            const normalized = {};
            DAYS.forEach(day => {
                if (activePlanData[day]?.meals) normalized[day] = activePlanData[day].meals;
                else if (activePlanData[day]) normalized[day] = activePlanData[day];
            });
            map['active'] = normalized;
        }
        archivedPlansData.forEach((record, idx) => {
            map[record.id || `archived-${idx}`] = record.plan || {};
        });
        return map;
    }, [activePlanData, archivedPlansData]);

    // Per-week overview data: biometrics + nutrition totals
    const weekOverviews = useMemo(() => {
        return history.map(week => {
            const plan = planDataMap[week.id];
            const totals = calcWeekTotals(plan);
            const timestamp = getTimestamp(week.savedAt);
            const weightEntry = findClosestWeight(weightHistory, timestamp);

            return {
                ...week,
                totals,
                dailyAvgCal: calcDailyAvg(totals.calories),
                dailyAvgSugar: calcDailyAvg(totals.sugar),
                weight: weightEntry?.weight || healthProfile?.weight || null,
                bmi: weightEntry?.bmi || healthProfile?.bmi || null,
                height: healthProfile?.height || null,
                goal: healthProfile?.goal || null,
                targetCalories: healthProfile?.targetCalories || null,
                tdee: healthProfile?.tdee || null,
                bmr: healthProfile?.bmr || null,
                age: healthProfile?.age || null,
                gender: healthProfile?.gender || null,
                activity: healthProfile?.activity || null
            };
        });
    }, [history, planDataMap, weightHistory, healthProfile]);

    const chronologicalWeeks = useMemo(() => {
        return [...weekOverviews].reverse();
    }, [weekOverviews]);

    // Week-to-week comparison data (consecutive pairs)
    const comparisons = useMemo(() => {
        if (weekOverviews.length < 2) return [];
        const result = [];
        for (let i = 0; i < weekOverviews.length - 1; i++) {
            const newer = weekOverviews[i];
            const older = weekOverviews[i + 1];

            const weightDiff = (newer.weight && older.weight) ? +(newer.weight - older.weight).toFixed(1) : null;
            const bmiDiff = (newer.bmi && older.bmi) ? +(newer.bmi - older.bmi).toFixed(1) : null;
            const calDiff = newer.dailyAvgCal - older.dailyAvgCal;
            const sugarDiff = newer.totals.sugar - older.totals.sugar;
            const completionDiff = newer.completion - older.completion;
            const gramsDiff = newer.totals.grams - older.totals.grams;

            // Determine overall trajectory
            let positiveSignals = 0;
            let negativeSignals = 0;

            // For weight loss goal: weight going down = good
            const isLossGoal = newer.goal === 'lose' || newer.goal === 'Lose Weight';
            if (weightDiff !== null) {
                if (isLossGoal) {
                    if (weightDiff < 0) positiveSignals++; else if (weightDiff > 0) negativeSignals++;
                } else {
                    if (weightDiff > 0) positiveSignals++; else if (weightDiff < 0) negativeSignals++;
                }
            }
            if (bmiDiff !== null) {
                if (bmiDiff < 0) positiveSignals++; else if (bmiDiff > 0.5) negativeSignals++;
            }
            if (completionDiff > 0) positiveSignals++;
            else if (completionDiff < -10) negativeSignals++;
            if (calDiff < 0 && isLossGoal) positiveSignals++;

            const trajectory = positiveSignals > negativeSignals ? 'improving'
                             : negativeSignals > positiveSignals ? 'declining' 
                             : 'stable';

            result.push({
                newer, older,
                weightDiff, bmiDiff, calDiff, sugarDiff, completionDiff, gramsDiff,
                trajectory
            });
        }
        return result;
    }, [weekOverviews]);

    // Generate insights + motivation
    const insightsAndMotivation = useMemo(() => {
        if (comparisons.length === 0) return null;
        const latest = comparisons[0];
        const insights = [];

        // Weight
        if (latest.weightDiff !== null) {
            if (latest.weightDiff < 0) {
                insights.push({
                    icon: <Scale size={15} />,
                    text: `You lost ${Math.abs(latest.weightDiff)} kg since last week! Your body is responding to the discipline.`,
                    type: 'success'
                });
            } else if (latest.weightDiff > 0) {
                insights.push({
                    icon: <Scale size={15} />,
                    text: `Weight went up by ${latest.weightDiff} kg. Don't worry — fluctuations are normal. Focus on the long-term trend.`,
                    type: 'warning'
                });
            } else {
                insights.push({
                    icon: <Scale size={15} />,
                    text: `Weight remained stable. Your current intake is balancing your output perfectly.`,
                    type: 'neutral'
                });
            }
        }

        // BMI
        if (latest.bmiDiff !== null) {
            if (latest.bmiDiff < 0) {
                insights.push({
                    icon: <Heart size={15} />,
                    text: `BMI dropped by ${Math.abs(latest.bmiDiff)} — you're moving closer to a healthier range.`,
                    type: 'success'
                });
            } else if (latest.bmiDiff > 0) {
                insights.push({
                    icon: <Heart size={15} />,
                    text: `BMI increased by ${latest.bmiDiff}. Consider reducing calorie-dense foods and increasing fiber intake.`,
                    type: 'warning'
                });
            }
        }

        // Calories
        if (latest.calDiff < -100) {
            insights.push({
                icon: <Flame size={15} />,
                text: `Daily calorie average dropped by ${Math.abs(latest.calDiff)} kcal — great calorie management.`,
                type: 'success'
            });
        } else if (latest.calDiff > 100) {
            insights.push({
                icon: <Flame size={15} />,
                text: `Daily calories increased by ${latest.calDiff} kcal. Try swapping high-calorie items for lighter options.`,
                type: 'warning'
            });
        }

        // Completion
        if (latest.completionDiff > 0) {
            insights.push({
                icon: <Target size={15} />,
                text: `Plan adherence improved by ${latest.completionDiff}% — consistency is the key to results!`,
                type: 'success'
            });
        } else if (latest.completionDiff < -15) {
            insights.push({
                icon: <Target size={15} />,
                text: `Completion dropped by ${Math.abs(latest.completionDiff)}%. Try meal-prepping to make it easier to follow through.`,
                type: 'warning'
            });
        }

        // Sugar
        if (latest.sugarDiff > 15) {
            insights.push({
                icon: <Zap size={15} />,
                text: `Sugar intake rose by ${latest.sugarDiff}g this week. Watch out for hidden sugars in sauces and drinks.`,
                type: 'warning'
            });
        } else if (latest.sugarDiff < -10) {
            insights.push({
                icon: <Zap size={15} />,
                text: `Sugar intake decreased by ${Math.abs(latest.sugarDiff)}g — excellent discipline on reducing sweeteners!`,
                type: 'success'
            });
        }

        if (insights.length === 0) {
            insights.push({
                icon: <Sparkles size={15} />,
                text: 'All metrics are steady. You\'re on a solid, sustainable path — keep it up!',
                type: 'neutral'
            });
        }

        // Pick a motivation based on trajectory
        const quoteIdx = Math.floor(Date.now() / 86400000) % motivationalQuotes.length;
        const motivation = motivationalQuotes[quoteIdx];

        return { insights, motivation, trajectory: latest.trajectory };
    }, [comparisons]);

    const avgCompletion = history.length > 0 ? Math.round(history.reduce((acc, h) => acc + h.completion, 0) / history.length) : 0;

    // Calculate total completed days from history + active week
    const completedDays = useMemo(() => {
        const historyDays = archivedPlansData.reduce((acc, h) => acc + Math.round((h.completion || 0) / 100 * 7), 0);
        const currentWeekDays = userId ? ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
            .filter(day => localStorage.getItem(`day_done_${day}_${userId}`) === '1').length : 0;
        return historyDays + currentWeekDays;
    }, [archivedPlansData, userId]);

    const activeTier = useMemo(() => {
        if (completedDays >= 30) return { label: 'Legendary', sub: 'Master-level cellular repair!', color: '#b9f2ff', req: 30, icon: '🏆', glow: 'rgba(185,242,255,0.25)', nextReq: 35 };
        if (completedDays >= 21) return { label: 'Champion', sub: '21 days formed habit!', color: '#e5e4e2', req: 21, icon: '🥇', glow: 'rgba(229,228,226,0.22)', nextReq: 30 };
        if (completedDays >= 14) return { label: 'Dedicated', sub: 'Solid consistency!', color: '#f5c842', req: 14, icon: '🥈', glow: 'rgba(245,200,66,0.18)', nextReq: 21 };
        if (completedDays >= 7) return { label: 'Consistent', sub: 'Building momentum!', color: '#a8d8ea', req: 7, icon: '🥉', glow: 'rgba(168,216,234,0.15)', nextReq: 14 };
        if (completedDays >= 3) return { label: 'Committed', sub: '3 days completed streak!', color: '#cd7f32', req: 3, icon: '🎗️', glow: 'rgba(205,127,50,0.12)', nextReq: 7 };
        return { label: 'Beginner', sub: 'The journey begins!', color: '#8ecb84', req: 0, icon: '🌱', glow: 'rgba(142,203,132,0.1)', nextReq: 3 };
    }, [completedDays]);

    if (loading) return (
        <div className={`h-screen flex flex-col items-center justify-center ${bgMain}`}>
            <Loader2 className="animate-spin text-[#6a9966] mb-4" size={32} />
            <p className="text-xs font-black uppercase tracking-[0.4em] text-[#6a9966]">Loading History</p>
        </div>
    );

    // Diff badge component
    const DiffBadge = ({ value, unit = '', invert = false, decimals = 0 }) => {
        if (value === null || value === undefined) return <span className={`text-xs ${textSub}`}>—</span>;
        const isPositive = invert ? value < 0 : value > 0;
        const isNegative = invert ? value > 0 : value < 0;
        const isZero = value === 0;
        const color = isPositive ? 'text-emerald-500' : isNegative ? 'text-orange-500' : textSub;
        const Icon = isPositive ? ArrowUpRight : isNegative ? ArrowDownRight : Minus;
        const formatted = decimals > 0 ? Math.abs(value).toFixed(decimals) : Math.abs(value);
        return (
            <span className={`text-xs font-bold flex items-center gap-0.5 ${color}`}>
                <Icon size={12} />
                {value > 0 ? '+' : value < 0 ? '-' : ''}{formatted}{unit}
            </span>
        );
    };

    return (
        <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={`min-h-screen w-full ${bgMain} ${textMain} p-6 md:p-10 flex flex-col transition-colors duration-500 overflow-y-auto`}
            style={{
                backgroundImage: darkMode 
                    ? 'linear-gradient(rgba(13, 17, 13, 0.92), rgba(13, 17, 13, 0.92)), url("/bg.png")' 
                    : 'linear-gradient(rgba(245, 250, 244, 0.92), rgba(245, 250, 244, 0.92)), url("/bg.png")',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
            }}
        >
            {/* Header */}
            <header className="flex justify-between items-center mb-10 relative z-50">
                <div className="flex items-center gap-6">
                    <button onClick={() => navigate('/dashboard')} className={`p-3 ${cardBg} rounded-full border ${border} hover:border-[#2d5a27] transition-all group`}>
                        <ArrowLeft size={18} className={`group-hover:text-[#2d5a27] ${darkMode ? 'text-white' : 'text-black'}`} />
                    </button>
                    <div>
                        <h1 className="font-serif text-3xl italic">Diet History</h1>
                        <p className="text-xs font-black uppercase tracking-[0.2em] text-[#6a9966]">Weekly Overviews · Biometrics · Insights</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {activePlanData && (
                        <button
                            onClick={handleDeletePlan}
                            disabled={isDeleting}
                            className={`p-3 rounded-xl backdrop-blur-md transition-all ${
                                darkMode ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20' : 'bg-red-500/10 text-red-600 hover:bg-red-500/20'
                            }`}
                            title="Delete Active Weekly Plan"
                        >
                            {isDeleting ? <Loader2 className="animate-spin" size={18} /> : <Trash2 size={18} />}
                        </button>
                    )}
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

            <div className="flex-1 max-w-6xl mx-auto w-full space-y-10">

                {/* ════════ ACHIEVEMENTS & STREAK SUMMARY ════════ */}
                <motion.div 
                    variants={itemVariants}
                    className={`${cardBg} rounded-2xl border ${border} p-6 md:p-8 relative overflow-hidden backdrop-blur-xl shadow-xl transition-all duration-500`}
                >
                    <div className="absolute top-0 right-0 w-80 h-80 bg-[#8ecb84]/5 rounded-full blur-3xl pointer-events-none" />
                    
                    <div className="flex flex-col lg:flex-row items-center justify-between gap-8 relative z-10">
                        {/* Left Side: Current Streak & Tier */}
                        <div className="flex items-center gap-6 flex-1 w-full">
                            <div className="relative w-24 h-24 flex items-center justify-center rounded-2xl border bg-black/15 border-white/5 shadow-inner">
                                <motion.div
                                    animate={{ scale: [1, 1.1, 1] }}
                                    transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                                    className="text-5xl select-none"
                                >
                                    {activeTier.icon}
                                </motion.div>
                                <div className="absolute -inset-0.5 rounded-2xl opacity-30 blur-md pointer-events-none" style={{ background: activeTier.glow }} />
                            </div>
                            
                            <div className="flex-1">
                                <span className="text-[9px] font-black uppercase tracking-[0.25em] text-[#6a9966] block mb-1">
                                    Current Achievement Tier
                                </span>
                                <h3 className="font-serif text-3xl italic font-bold mb-1 flex items-center gap-2" style={{ color: activeTier.color }}>
                                    {activeTier.label} Status
                                    <Sparkles size={18} className="text-[#f5c842] animate-pulse" />
                                </h3>
                                <p className={`text-xs font-semibold leading-relaxed ${textSub}`}>
                                    {activeTier.sub} You have completed a total of <span className="font-bold text-[#8ecb84] text-sm">{completedDays} day{completedDays !== 1 ? 's' : ''}</span> of diet protocols.
                                </p>
                            </div>
                        </div>

                        {/* Right Side: Milestones Horizontal Checklist */}
                        <div className="flex-1 w-full">
                            <div className="flex justify-between items-center mb-3">
                                <span className={`text-[9px] font-black uppercase tracking-wider ${textSub}`}>Streak Progression</span>
                                <span className="text-xs font-black uppercase tracking-wider text-[#8ecb84]">
                                    {completedDays} / {activeTier.nextReq} Days
                                </span>
                            </div>
                            
                            {/* Progress bar */}
                            <div className={`w-full h-2.5 rounded-full overflow-hidden border mb-6 relative ${darkMode ? 'bg-white/5 border-white/10' : 'bg-black/5 border-[#ddd8ce]'}`}>
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${Math.min(100, Math.round((completedDays / activeTier.nextReq) * 100))}%` }}
                                    transition={{ duration: 1, ease: "easeOut" }}
                                    className="h-full rounded-full"
                                    style={{
                                        backgroundColor: activeTier.color,
                                        boxShadow: `0 0 12px ${activeTier.color}60`
                                    }}
                                />
                            </div>

                            {/* Badge milestones */}
                            <div className="grid grid-cols-6 gap-2">
                                {[
                                    { label: 'Beginner', req: 0, icon: '🌱', color: '#8ecb84' },
                                    { label: 'Committed', req: 3, icon: '🎗️', color: '#cd7f32' },
                                    { label: 'Consistent', req: 7, icon: '🥉', color: '#a8d8ea' },
                                    { label: 'Dedicated', req: 14, icon: '🥈', color: '#f5c842' },
                                    { label: 'Champion', req: 21, icon: '🥇', color: '#e5e4e2' },
                                    { label: 'Legendary', req: 30, icon: '🏆', color: '#b9f2ff' }
                                ].map((badge, idx) => {
                                    const isUnlocked = completedDays >= badge.req;
                                    return (
                                        <div 
                                            key={idx}
                                            className={`p-2 rounded-xl border flex flex-col items-center gap-1 transition-all duration-300 ${
                                                isUnlocked
                                                    ? `${darkMode ? 'bg-white/[0.04]' : 'bg-black/[0.02]'} border-white/10 text-white shadow-sm`
                                                    : 'opacity-30 border-dashed border-white/5 text-gray-500 shadow-none'
                                            }`}
                                            title={`${badge.label}: Requires ${badge.req} Days`}
                                        >
                                            <span className={`text-xl ${isUnlocked ? 'scale-100' : 'scale-90 grayscale'}`}>
                                                {isUnlocked ? badge.icon : '🔒'}
                                            </span>
                                            <span className="text-[8px] font-black uppercase tracking-tighter truncate w-full text-center" style={{ color: isUnlocked ? badge.color : undefined }}>
                                                {badge.label}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* ════════ PROGRESS CHART ════════ */}
                {chronologicalWeeks.length > 0 && (
                    <motion.div 
                        variants={itemVariants}
                        className={`${cardBg} rounded-2xl border ${border} p-6 md:p-8 relative overflow-hidden backdrop-blur-xl shadow-xl transition-all duration-500`}
                    >
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                            <div>
                                <h2 className="font-serif text-2xl italic flex items-center gap-2">
                                    <TrendingUp size={20} className="text-[#8ecb84]" />
                                    Progress Timeline
                                </h2>
                                <p className="text-xs text-gray-400 mt-1 uppercase tracking-wider font-bold">Week-to-Week Comparison Graph</p>
                            </div>
                            
                            {/* Metric Tabs */}
                            <div className="flex flex-wrap gap-2">
                                {[
                                    { id: 'calories', label: 'Calories' },
                                    { id: 'weight', label: 'Weight' },
                                    { id: 'adherence', label: 'Adherence' },
                                    { id: 'sugar', label: 'Sugar' }
                                ].map(tab => (
                                    <button
                                        key={tab.id}
                                        onClick={() => { setActiveMetric(tab.id); setHoveredPoint(null); }}
                                        className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all ${
                                            activeMetric === tab.id
                                                ? 'bg-[#2d5a27] text-white border-[#2d5a27] shadow-md shadow-[#2d5a27]/20'
                                                : darkMode
                                                ? 'bg-white/5 border-white/10 hover:bg-white/10 text-white/80'
                                                : 'bg-black/5 border-black/5 hover:bg-black/10 text-gray-700'
                                        }`}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Chart Render Area */}
                        {(() => {
                            const width = 800;
                            const height = 280;
                            const paddingLeft = 60;
                            const paddingRight = 40;
                            const paddingTop = 30;
                            const paddingBottom = 40;
                            const N = chronologicalWeeks.length;
                            
                            const getMetricValue = (week, metric) => {
                                switch (metric) {
                                    case 'calories': return week.dailyAvgCal || 0;
                                    case 'weight': return week.weight || 0;
                                    case 'adherence': return week.completion || 0;
                                    case 'sugar': return week.totals.sugar || 0;
                                    default: return 0;
                                }
                            };
                            
                            const getMetricUnit = (metric) => {
                                switch (metric) {
                                    case 'calories': return ' kcal';
                                    case 'weight': return ' kg';
                                    case 'adherence': return '%';
                                    case 'sugar': return 'g';
                                    default: return '';
                                }
                            };

                            const getMetricColor = (metric) => {
                                switch (metric) {
                                    case 'calories': return '#ff7b72';
                                    case 'weight': return '#8ecb84';
                                    case 'adherence': return '#f5c842';
                                    case 'sugar': return '#6ab8ff';
                                    default: return '#8ecb84';
                                }
                            };

                            const vals = chronologicalWeeks.map(w => getMetricValue(w, activeMetric));
                            let minVal = Math.min(...vals);
                            let maxVal = Math.max(...vals);
                            
                            if (minVal === maxVal) {
                                minVal = Math.max(0, minVal - 10);
                                maxVal = maxVal + 10;
                            } else {
                                const range = maxVal - minVal;
                                minVal = Math.max(0, minVal - range * 0.15);
                                maxVal = maxVal + range * 0.15;
                            }

                            const yCoord = (val) => height - paddingBottom - ((val - minVal) / (maxVal - minVal)) * (height - paddingBottom - paddingTop);
                            const xStep = N > 1 ? (width - paddingLeft - paddingRight) / (N - 1) : 0;
                            
                            const points = chronologicalWeeks.map((week, idx) => {
                                const x = N > 1 ? paddingLeft + idx * xStep : (width - paddingLeft - paddingRight) / 2 + paddingLeft;
                                const val = getMetricValue(week, activeMetric);
                                const y = yCoord(val);
                                return { x, y, val, label: week.week, date: week.date };
                            });

                            let linePath = "";
                            let areaPath = "";
                            
                            if (points.length > 0) {
                                if (N === 1) {
                                    linePath = `M ${paddingLeft} ${points[0].y} L ${width - paddingRight} ${points[0].y}`;
                                    areaPath = `M ${paddingLeft} ${points[0].y} L ${width - paddingRight} ${points[0].y} L ${width - paddingRight} ${height - paddingBottom} L ${paddingLeft} ${height - paddingBottom} Z`;
                                } else {
                                    linePath = `M ${points[0].x} ${points[0].y}`;
                                    points.slice(1).forEach(p => {
                                        linePath += ` L ${p.x} ${p.y}`;
                                    });
                                    areaPath = `${linePath} L ${points[points.length - 1].x} ${height - paddingBottom} L ${points[0].x} ${height - paddingBottom} Z`;
                                }
                            }

                            const handleMouseMove = (e) => {
                                const rect = e.currentTarget.getBoundingClientRect();
                                const cX = e.clientX - rect.left;
                                const cY = e.clientY - rect.top;
                                const x = cX * (width / rect.width);
                                const y = cY * (height / rect.height);

                                let closestIdx = 0;
                                let minDistance = Infinity;
                                points.forEach((p, idx) => {
                                    const dist = Math.abs(p.x - x);
                                    if (dist < minDistance) {
                                        minDistance = dist;
                                        closestIdx = idx;
                                    }
                                });

                                const pt = points[closestIdx];
                                setHoveredPoint({
                                    index: closestIdx,
                                    x: pt.x,
                                    y: pt.y,
                                    val: pt.val,
                                    label: pt.label,
                                    date: pt.date
                                });
                            };

                            const handleMouseLeave = () => {
                                setHoveredPoint(null);
                            };

                            const activeColor = getMetricColor(activeMetric);
                            const activeUnit = getMetricUnit(activeMetric);

                            // Helper for horizontal grid lines
                            const gridLinesCount = 4;
                            const gridLines = Array.from({ length: gridLinesCount }).map((_, i) => {
                                const ratio = i / (gridLinesCount - 1);
                                const val = minVal + ratio * (maxVal - minVal);
                                const y = height - paddingBottom - ratio * (height - paddingBottom - paddingTop);
                                return { val, y };
                            });

                            return (
                                <div className="relative w-full overflow-hidden">
                                    <svg 
                                        viewBox={`0 0 ${width} ${height}`} 
                                        className="w-full h-auto cursor-crosshair"
                                        onMouseMove={handleMouseMove}
                                        onMouseLeave={handleMouseLeave}
                                    >
                                        <defs>
                                            {/* Line Glow and Area Gradient */}
                                            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor={activeColor} stopOpacity={0.25} />
                                                <stop offset="100%" stopColor={activeColor} stopOpacity={0.0} />
                                            </linearGradient>
                                            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                                                <feGaussianBlur stdDeviation="4" result="blur" />
                                                <feMerge>
                                                    <feMergeNode in="blur" />
                                                    <feMergeNode in="SourceGraphic" />
                                                </feMerge>
                                            </filter>
                                        </defs>

                                        {/* Grid Lines */}
                                        {gridLines.map((line, i) => (
                                            <g key={i} className="opacity-15">
                                                <line 
                                                    x1={paddingLeft} 
                                                    y1={line.y} 
                                                    x2={width - paddingRight} 
                                                    y2={line.y} 
                                                    stroke={darkMode ? 'white' : 'black'} 
                                                    strokeWidth={1}
                                                    strokeDasharray="4 4"
                                                />
                                                <text
                                                    x={paddingLeft - 10}
                                                    y={line.y + 4}
                                                    textAnchor="end"
                                                    className={`text-[10px] font-bold ${darkMode ? 'fill-white' : 'fill-black'}`}
                                                >
                                                    {Math.round(line.val)}
                                                </text>
                                            </g>
                                        ))}

                                        {/* X Axis Labels */}
                                        {points.map((p, i) => (
                                            <text
                                                key={i}
                                                x={p.x}
                                                y={height - 15}
                                                textAnchor="middle"
                                                className={`text-[10px] font-black uppercase tracking-wider ${
                                                    hoveredPoint?.index === i
                                                        ? darkMode ? 'fill-[#8ecb84]' : 'fill-[#2d5a27]'
                                                        : darkMode ? 'fill-white/40' : 'fill-black/40'
                                                }`}
                                            >
                                                {p.label.split(' ')[0]}
                                            </text>
                                        ))}

                                        {/* Gradient Area Below Curve */}
                                        {areaPath && (
                                            <path d={areaPath} fill="url(#areaGradient)" />
                                        )}

                                        {/* Curve */}
                                        {linePath && (
                                            <path 
                                                d={linePath} 
                                                fill="none" 
                                                stroke={activeColor} 
                                                strokeWidth={3} 
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                filter="url(#glow)"
                                            />
                                        )}

                                        {/* Data Markers */}
                                        {points.map((p, i) => {
                                            const isHovered = hoveredPoint?.index === i;
                                            return (
                                                <g key={i}>
                                                    <circle
                                                        cx={p.x}
                                                        cy={p.y}
                                                        r={isHovered ? 6 : 4}
                                                        fill={isHovered ? '#fff' : activeColor}
                                                        stroke={activeColor}
                                                        strokeWidth={isHovered ? 4 : 2}
                                                    />
                                                    {isHovered && (
                                                        <line
                                                            x1={p.x}
                                                            y1={p.y}
                                                            x2={p.x}
                                                            y2={height - paddingBottom}
                                                            stroke={activeColor}
                                                            strokeWidth={1}
                                                            strokeDasharray="2 2"
                                                            className="opacity-50"
                                                        />
                                                    )}
                                                </g>
                                            );
                                        })}
                                    </svg>

                                    {/* Glassmorphic Tooltip Overlay */}
                                    <AnimatePresence>
                                        {hoveredPoint && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, y: 5, scale: 0.95 }}
                                                transition={{ duration: 0.15 }}
                                                style={{
                                                    position: 'absolute',
                                                    left: `${(hoveredPoint.x / width) * 100}%`,
                                                    top: `${(hoveredPoint.y / height) * 100 - 30}%`,
                                                    transform: 'translate(-50%, -100%)',
                                                    pointerEvents: 'none'
                                                }}
                                                className={`z-50 px-4 py-3 rounded-2xl border shadow-xl flex flex-col gap-1 backdrop-blur-xl ${
                                                    darkMode 
                                                        ? 'bg-[#151515]/95 border-white/10 text-white shadow-black/40' 
                                                        : 'bg-white/95 border-black/10 text-[#1c3a1c] shadow-black/10'
                                                }`}
                                            >
                                                <span className="text-[10px] font-black uppercase tracking-wider text-[#6a9966] leading-none mb-1">
                                                    {hoveredPoint.label}
                                                </span>
                                                <span className="text-sm font-bold leading-none flex items-center gap-1.5">
                                                    <span 
                                                        className="w-2.5 h-2.5 rounded-full inline-block" 
                                                        style={{ backgroundColor: activeColor }}
                                                    />
                                                    {hoveredPoint.val.toLocaleString()}{activeUnit}
                                                </span>
                                                <span className="text-[9px] text-gray-400 font-semibold mt-1">
                                                    {hoveredPoint.date}
                                                </span>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            );
                        })()}
                    </motion.div>
                )}

                {/* ════════ WEEK OVERVIEW CARDS ════════ */}
                <motion.div variants={itemVariants}>
                    <div className="flex items-center gap-3 mb-6">
                        <CalendarDays size={18} className="text-[#8ecb84]" />
                        <h2 className="font-serif text-2xl italic">Weekly Overviews</h2>
                    </div>

                    {history.length === 0 ? (
                        <div className={`${cardBg} rounded-2xl border ${border} p-16 text-center`}>
                            <HistoryIcon size={48} className={`mx-auto mb-4 ${textSub}`} />
                            <h3 className="font-serif text-xl italic mb-2">No History Yet</h3>
                            <p className={`text-sm ${textSub}`}>Complete a weekly plan to see your progress tracked here.</p>
                        </div>
                    ) : (
                        <div className="space-y-5">
                            {weekOverviews.map((week, index) => {
                                const isExpanded = expandedWeek === week.id;
                                return (
                                    <motion.div
                                        key={week.id}
                                        variants={itemVariants}
                                        className={`${cardBg} rounded-2xl border ${border} overflow-hidden transition-shadow hover:shadow-lg`}
                                    >
                                        {/* Week Header */}
                                        <div 
                                            className={`p-6 cursor-pointer flex items-center justify-between ${darkMode ? 'bg-white/[0.03]' : 'bg-[#fbfdfa]'}`}
                                            onClick={() => setExpandedWeek(isExpanded ? null : week.id)}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: week.color }} />
                                                <div>
                                                    <div className="flex items-center gap-3">
                                                        <h3 className="font-serif text-xl italic">{week.week}</h3>
                                                        <span className="text-xs font-bold uppercase px-3 py-1 rounded-full"
                                                            style={{ backgroundColor: `${week.color}20`, color: darkMode ? week.color : '#2d5a27' }}>
                                                            {week.status}
                                                        </span>
                                                    </div>
                                                    <p className={`text-xs font-semibold ${textSub} flex items-center gap-2 mt-1`}>
                                                        <Calendar size={12} />{week.date}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-6">
                                                {/* Quick stats in header */}
                                                <div className="hidden md:flex items-center gap-6">
                                                    <div className="text-right">
                                                        <p className={`text-xs font-black uppercase tracking-wider ${textSub}`}>Completion</p>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <div className="w-20 h-1.5 bg-black/10 rounded-full overflow-hidden">
                                                                <motion.div 
                                                                    initial={{ width: 0 }}
                                                                    animate={{ width: `${week.completion}%` }}
                                                                    transition={{ duration: 1, delay: 0.2 + index * 0.1 }}
                                                                    className="h-full rounded-full"
                                                                    style={{ backgroundColor: week.color }}
                                                                />
                                                            </div>
                                                            <span className="text-xs font-bold">{week.completion}%</span>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className={`text-xs font-black uppercase tracking-wider ${textSub}`}>Calories</p>
                                                        <p className="text-xs font-bold mt-1">{week.totals.calories.toLocaleString()} <span className={`font-normal ${textSub}`}>kcal</span></p>
                                                    </div>
                                                    {week.weight && (
                                                        <div className="text-right">
                                                            <p className={`text-xs font-black uppercase tracking-wider ${textSub}`}>Weight</p>
                                                            <p className="text-xs font-bold mt-1">{week.weight} <span className={`font-normal ${textSub}`}>kg</span></p>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className={`p-2 rounded-xl transition-colors ${darkMode ? 'bg-white/5' : 'bg-black/5'}`}>
                                                    {isExpanded ? <ChevronUp size={18} className={textSub} /> : <ChevronDown size={18} className={textSub} />}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Expanded Overview */}
                                        <AnimatePresence>
                                            {isExpanded && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    transition={{ duration: 0.3 }}
                                                    className="overflow-hidden"
                                                >
                                                    <div className={`px-6 pb-6 border-t ${border}`}>

                                                        {/* Biometrics Row */}
                                                        <div className="mt-5 mb-5">
                                                            <p className="text-xs font-black uppercase tracking-wider text-[#6a9966] mb-3">Biometrics Snapshot</p>
                                                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                                                                {week.weight && (
                                                                    <div className={`p-4 rounded-xl ${darkMode ? 'bg-white/5' : 'bg-[#f5faf4]'}`}>
                                                                        <div className="flex items-center gap-2 mb-2">
                                                                            <Scale size={13} className="text-[#8ecb84]" />
                                                                            <p className={`text-xs font-bold uppercase ${textSub}`}>Weight</p>
                                                                        </div>
                                                                        <p className="text-lg font-bold">{week.weight} <span className={`text-xs font-normal ${textSub}`}>kg</span></p>
                                                                    </div>
                                                                )}
                                                                {week.bmi && (
                                                                    <div className={`p-4 rounded-xl ${darkMode ? 'bg-white/5' : 'bg-[#f5faf4]'}`}>
                                                                        <div className="flex items-center gap-2 mb-2">
                                                                            <Heart size={13} className="text-[#f5c842]" />
                                                                            <p className={`text-xs font-bold uppercase ${textSub}`}>BMI</p>
                                                                        </div>
                                                                        <p className="text-lg font-bold">{typeof week.bmi === 'number' ? week.bmi.toFixed(1) : week.bmi}</p>
                                                                    </div>
                                                                )}
                                                                {week.height && (
                                                                    <div className={`p-4 rounded-xl ${darkMode ? 'bg-white/5' : 'bg-[#f5faf4]'}`}>
                                                                        <div className="flex items-center gap-2 mb-2">
                                                                            <Ruler size={13} className="text-[#6ab8ff]" />
                                                                            <p className={`text-xs font-bold uppercase ${textSub}`}>Height</p>
                                                                        </div>
                                                                        <p className="text-lg font-bold">{week.height} <span className={`text-xs font-normal ${textSub}`}>m</span></p>
                                                                    </div>
                                                                )}
                                                                {week.tdee && (
                                                                    <div className={`p-4 rounded-xl ${darkMode ? 'bg-white/5' : 'bg-[#f5faf4]'}`}>
                                                                        <div className="flex items-center gap-2 mb-2">
                                                                            <Activity size={13} className="text-[#fcb9aa]" />
                                                                            <p className={`text-xs font-bold uppercase ${textSub}`}>TDEE</p>
                                                                        </div>
                                                                        <p className="text-lg font-bold">{Math.round(week.tdee)} <span className={`text-xs font-normal ${textSub}`}>kcal</span></p>
                                                                    </div>
                                                                )}
                                                                {week.bmr && (
                                                                    <div className={`p-4 rounded-xl ${darkMode ? 'bg-white/5' : 'bg-[#f5faf4]'}`}>
                                                                        <div className="flex items-center gap-2 mb-2">
                                                                            <Flame size={13} className="text-[#ff7b72]" />
                                                                            <p className={`text-xs font-bold uppercase ${textSub}`}>BMR</p>
                                                                        </div>
                                                                        <p className="text-lg font-bold">{Math.round(week.bmr)} <span className={`text-xs font-normal ${textSub}`}>kcal</span></p>
                                                                    </div>
                                                                )}
                                                                {week.targetCalories && (
                                                                    <div className={`p-4 rounded-xl ${darkMode ? 'bg-white/5' : 'bg-[#f5faf4]'}`}>
                                                                        <div className="flex items-center gap-2 mb-2">
                                                                            <Target size={13} className="text-[#8ecb84]" />
                                                                            <p className={`text-xs font-bold uppercase ${textSub}`}>Target</p>
                                                                        </div>
                                                                        <p className="text-lg font-bold">{Math.round(week.targetCalories)} <span className={`text-xs font-normal ${textSub}`}>kcal</span></p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                            {/* Extra profile info */}
                                                            {(week.age || week.gender || week.activity || week.goal) && (
                                                                <div className="flex flex-wrap gap-3 mt-3">
                                                                    {week.gender && (
                                                                        <span className={`text-xs font-bold uppercase px-3 py-1.5 rounded-lg ${darkMode ? 'bg-white/5' : 'bg-[#f5faf4]'}`}>
                                                                            {week.gender}
                                                                        </span>
                                                                    )}
                                                                    {week.age && (
                                                                        <span className={`text-xs font-bold uppercase px-3 py-1.5 rounded-lg ${darkMode ? 'bg-white/5' : 'bg-[#f5faf4]'}`}>
                                                                            Age: {week.age}
                                                                        </span>
                                                                    )}
                                                                    {week.activity && (
                                                                        <span className={`text-xs font-bold uppercase px-3 py-1.5 rounded-lg ${darkMode ? 'bg-white/5' : 'bg-[#f5faf4]'}`}>
                                                                            Activity: {week.activity}
                                                                        </span>
                                                                    )}
                                                                    {week.goal && (
                                                                        <span className={`text-xs font-bold uppercase px-3 py-1.5 rounded-lg ${darkMode ? 'bg-emerald-500/10 text-emerald-500' : 'bg-emerald-50 text-emerald-700'}`}>
                                                                            Goal: {week.goal}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Nutrition Totals Row */}
                                                        <div className="mb-2">
                                                            <p className="text-xs font-black uppercase tracking-wider text-[#6a9966] mb-3">Nutrition Totals</p>
                                                            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                                                                <div className={`p-4 rounded-xl ${darkMode ? 'bg-white/5' : 'bg-[#f5faf4]'}`}>
                                                                    <p className={`text-xs font-bold uppercase ${textSub} mb-1`}>Total Calories</p>
                                                                    <p className="text-lg font-bold">{week.totals.calories.toLocaleString()} <span className={`text-xs font-normal ${textSub}`}>kcal</span></p>
                                                                </div>
                                                                <div className={`p-4 rounded-xl ${darkMode ? 'bg-white/5' : 'bg-[#f5faf4]'}`}>
                                                                    <p className={`text-xs font-bold uppercase ${textSub} mb-1`}>Daily Avg</p>
                                                                    <p className="text-lg font-bold">{week.dailyAvgCal} <span className={`text-xs font-normal ${textSub}`}>kcal/day</span></p>
                                                                </div>
                                                                <div className={`p-4 rounded-xl ${darkMode ? 'bg-white/5' : 'bg-[#f5faf4]'}`}>
                                                                    <p className={`text-xs font-bold uppercase ${textSub} mb-1`}>Total Sugar</p>
                                                                    <p className="text-lg font-bold">{week.totals.sugar} <span className={`text-xs font-normal ${textSub}`}>g</span></p>
                                                                </div>
                                                                <div className={`p-4 rounded-xl ${darkMode ? 'bg-white/5' : 'bg-[#f5faf4]'}`}>
                                                                    <p className={`text-xs font-bold uppercase ${textSub} mb-1`}>Total Portions</p>
                                                                    <p className="text-lg font-bold">{(week.totals.grams / 1000).toFixed(1)} <span className={`text-xs font-normal ${textSub}`}>kg</span></p>
                                                                </div>
                                                                <div className={`p-4 rounded-xl ${darkMode ? 'bg-white/5' : 'bg-[#f5faf4]'}`}>
                                                                    <p className={`text-xs font-bold uppercase ${textSub} mb-1`}>Meals Logged</p>
                                                                    <p className="text-lg font-bold">{week.totals.mealCount} <span className={`text-xs font-normal ${textSub}`}>items</span></p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </motion.div>
                                );
                            })}
                        </div>
                    )}
                </motion.div>

                {/* ════════ WEEK-TO-WEEK COMPARISON ════════ */}
                {comparisons.length > 0 && (
                    <motion.div variants={itemVariants}>
                        <div className="flex items-center gap-3 mb-6">
                            <TrendingUp size={18} className="text-[#f5c842]" />
                            <h2 className="font-serif text-2xl italic">Week-to-Week Comparison</h2>
                        </div>

                        <div className="space-y-5">
                            {comparisons.map((cmp, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, y: 15 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 + idx * 0.15 }}
                                    className={`${cardBg} rounded-2xl border ${border} overflow-hidden`}
                                >
                                    {/* Comparison Header */}
                                    <div className={`px-6 py-4 flex items-center justify-between ${darkMode ? 'bg-white/[0.03]' : 'bg-[#fbfdfa]'} border-b ${border}`}>
                                        <div className="flex items-center gap-3">
                                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cmp.older.color }} />
                                            <span className="text-xs font-black uppercase tracking-wider">{cmp.older.week}</span>
                                            <span className={`text-xs ${textSub}`}>→</span>
                                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cmp.newer.color }} />
                                            <span className="text-xs font-black uppercase tracking-wider">{cmp.newer.week}</span>
                                        </div>
                                        <span className={`text-xs font-bold uppercase px-3 py-1 rounded-full ${
                                            cmp.trajectory === 'improving' 
                                                ? darkMode ? 'bg-emerald-500/15 text-emerald-400' : 'bg-emerald-50 text-emerald-700'
                                                : cmp.trajectory === 'declining'
                                                ? darkMode ? 'bg-orange-500/15 text-orange-400' : 'bg-orange-50 text-orange-700'
                                                : darkMode ? 'bg-white/10 text-white/60' : 'bg-black/5 text-black/50'
                                        }`}>
                                            {cmp.trajectory === 'improving' ? '↑ Improving' : cmp.trajectory === 'declining' ? '↓ Needs Attention' : '— Stable'}
                                        </span>
                                    </div>

                                    {/* Comparison Grid */}
                                    <div className="p-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                                        {/* Weight */}
                                        <div className={`p-4 rounded-xl ${darkMode ? 'bg-white/5' : 'bg-[#f5faf4]'}`}>
                                            <div className="flex items-center gap-2 mb-2">
                                                <Scale size={13} className="text-[#8ecb84]" />
                                                <p className={`text-xs font-bold uppercase ${textSub}`}>Weight</p>
                                            </div>
                                            {cmp.newer.weight ? (
                                                <>
                                                    <p className="text-lg font-bold">{cmp.newer.weight} <span className={`text-xs font-normal ${textSub}`}>kg</span></p>
                                                    <div className="mt-1"><DiffBadge value={cmp.weightDiff} unit="kg" invert={true} decimals={1} /></div>
                                                </>
                                            ) : <p className={`text-sm ${textSub}`}>—</p>}
                                        </div>

                                        {/* BMI */}
                                        <div className={`p-4 rounded-xl ${darkMode ? 'bg-white/5' : 'bg-[#f5faf4]'}`}>
                                            <div className="flex items-center gap-2 mb-2">
                                                <Heart size={13} className="text-[#f5c842]" />
                                                <p className={`text-xs font-bold uppercase ${textSub}`}>BMI</p>
                                            </div>
                                            {cmp.newer.bmi ? (
                                                <>
                                                    <p className="text-lg font-bold">{typeof cmp.newer.bmi === 'number' ? cmp.newer.bmi.toFixed(1) : cmp.newer.bmi}</p>
                                                    <div className="mt-1"><DiffBadge value={cmp.bmiDiff} invert={true} decimals={1} /></div>
                                                </>
                                            ) : <p className={`text-sm ${textSub}`}>—</p>}
                                        </div>

                                        {/* Daily Calories */}
                                        <div className={`p-4 rounded-xl ${darkMode ? 'bg-white/5' : 'bg-[#f5faf4]'}`}>
                                            <div className="flex items-center gap-2 mb-2">
                                                <Flame size={13} className="text-[#ff7b72]" />
                                                <p className={`text-xs font-bold uppercase ${textSub}`}>Daily Cal</p>
                                            </div>
                                            <p className="text-lg font-bold">{cmp.newer.dailyAvgCal} <span className={`text-xs font-normal ${textSub}`}>kcal</span></p>
                                            <div className="mt-1"><DiffBadge value={cmp.calDiff} unit="" invert={true} /></div>
                                        </div>

                                        {/* Sugar */}
                                        <div className={`p-4 rounded-xl ${darkMode ? 'bg-white/5' : 'bg-[#f5faf4]'}`}>
                                            <div className="flex items-center gap-2 mb-2">
                                                <Zap size={13} className="text-[#6ab8ff]" />
                                                <p className={`text-xs font-bold uppercase ${textSub}`}>Sugar</p>
                                            </div>
                                            <p className="text-lg font-bold">{cmp.newer.totals.sugar} <span className={`text-xs font-normal ${textSub}`}>g</span></p>
                                            <div className="mt-1"><DiffBadge value={cmp.sugarDiff} unit="g" invert={true} /></div>
                                        </div>

                                        {/* Portions */}
                                        <div className={`p-4 rounded-xl ${darkMode ? 'bg-white/5' : 'bg-[#f5faf4]'}`}>
                                            <div className="flex items-center gap-2 mb-2">
                                                <Utensils size={13} className="text-[#fcb9aa]" />
                                                <p className={`text-xs font-bold uppercase ${textSub}`}>Portions</p>
                                            </div>
                                            <p className="text-lg font-bold">{(cmp.newer.totals.grams / 1000).toFixed(1)} <span className={`text-xs font-normal ${textSub}`}>kg</span></p>
                                            <div className="mt-1"><DiffBadge value={+(cmp.gramsDiff / 1000).toFixed(1)} unit="kg" decimals={1} /></div>
                                        </div>

                                        {/* Completion */}
                                        <div className={`p-4 rounded-xl ${darkMode ? 'bg-white/5' : 'bg-[#f5faf4]'}`}>
                                            <div className="flex items-center gap-2 mb-2">
                                                <Target size={13} className="text-[#a8d8ea]" />
                                                <p className={`text-xs font-bold uppercase ${textSub}`}>Completion</p>
                                            </div>
                                            <p className="text-lg font-bold">{cmp.newer.completion} <span className={`text-xs font-normal ${textSub}`}>%</span></p>
                                            <div className="mt-1"><DiffBadge value={cmp.completionDiff} unit="%" /></div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* ════════ INSIGHTS & MOTIVATION ════════ */}
                {insightsAndMotivation && (
                    <motion.div variants={itemVariants} className="space-y-5">
                        
                        {/* Insights */}
                        <div className={`${cardBg} rounded-2xl border ${border} p-6`}>
                            <div className="flex items-center gap-3 mb-5">
                                <div className="p-2 bg-[#8ecb84]/20 rounded-xl text-[#8ecb84]">
                                    <Lightbulb size={18} />
                                </div>
                                <h3 className="text-xs font-black uppercase tracking-[0.15em]">Progress Insights</h3>
                            </div>
                            <div className="space-y-3">
                                {insightsAndMotivation.insights.map((ins, idx) => (
                                    <motion.div
                                        key={idx}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.3 + idx * 0.1 }}
                                        className={`flex items-start gap-3 p-4 rounded-xl ${
                                            ins.type === 'success' ? darkMode ? 'bg-emerald-500/10' : 'bg-emerald-50'
                                            : ins.type === 'warning' ? darkMode ? 'bg-orange-500/10' : 'bg-orange-50'
                                            : darkMode ? 'bg-white/5' : 'bg-[#f5faf4]'
                                        }`}
                                    >
                                        <div className={`mt-0.5 flex-shrink-0 ${
                                            ins.type === 'success' ? 'text-emerald-500'
                                            : ins.type === 'warning' ? 'text-orange-500'
                                            : 'text-[#6a9966]'
                                        }`}>
                                            {ins.icon}
                                        </div>
                                        <p className={`text-sm leading-relaxed ${textMain}`}>{ins.text}</p>
                                    </motion.div>
                                ))}
                            </div>
                        </div>

                        {/* Motivational Banner */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.8 }}
                            className="relative overflow-hidden rounded-2xl"
                        >
                            <div className={`p-8 ${
                                insightsAndMotivation.trajectory === 'improving'
                                    ? 'bg-gradient-to-r from-[#2d5a27] to-[#3a7a32]'
                                    : insightsAndMotivation.trajectory === 'declining'
                                    ? 'bg-gradient-to-r from-[#5a3a27] to-[#7a5232]'
                                    : 'bg-gradient-to-r from-[#2d4a5a] to-[#325a7a]'
                            }`}>
                                <div className="flex items-start gap-4">
                                    <div className="p-3 bg-white/15 rounded-2xl text-white flex-shrink-0">
                                        <Sparkles size={24} />
                                    </div>
                                    <div>
                                        <p className="text-xs font-black uppercase tracking-[0.2em] text-white/60 mb-2">Keep Going!</p>
                                        <p className="text-white text-base leading-relaxed font-medium">
                                            {insightsAndMotivation.motivation}
                                        </p>
                                        {insightsAndMotivation.trajectory === 'improving' && (
                                            <p className="text-white/70 text-sm mt-3 italic">
                                                Your numbers prove it — you're on the right track. Don't stop now.
                                            </p>
                                        )}
                                        {insightsAndMotivation.trajectory === 'declining' && (
                                            <p className="text-white/70 text-sm mt-3 italic">
                                                A setback is a setup for a comeback. Adjust, refocus, and crush next week.
                                            </p>
                                        )}
                                        {insightsAndMotivation.trajectory === 'stable' && (
                                            <p className="text-white/70 text-sm mt-3 italic">
                                                Stability is strength. Maintain your routine and the results will follow.
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                            {/* Decorative circles */}
                            <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/5 rounded-full" />
                            <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-white/5 rounded-full" />
                        </motion.div>
                    </motion.div>
                )}

            </div>
        </motion.div>
    );
};

export default ViewHistory;
