import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle, Loader2, Save, ArrowLeft, Info, RefreshCw, X, Eye, AlertCircle, Trash2 
} from 'lucide-react';

const GenerateWeekly = () => {
  const navigate = useNavigate();

  // --- 1. CORE STATE MANAGEMENT (YOUR ORIGINAL STATES) ---
  const [user] = useState(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });

  const [loading, setLoading] = useState(true); 
  const [isSyncing, setIsSyncing] = useState(false); 
  const [isSubmitted, setIsSubmitted] = useState(false); 
  const [showToast, setShowToast] = useState(false);
  const [errorNotif, setErrorNotif] = useState("");

  
  const [activeDayIdx, setActiveDayIdx] = useState(0); 
  const [bmiStatus, setBmiStatus] = useState("");
  const [suggestion, setSuggestion] = useState("");
  const [weeklyPlan, setWeeklyPlan] = useState(null);
  const [dailyTarget, setDailyTarget] = useState(0);

  // Interaction States
  const [swappingMeal, setSwappingMeal] = useState(null); 
  const [dbAlternatives, setDbAlternatives] = useState([]);
  const [viewingDetails, setViewingDetails] = useState(null);
  const [hoveredFood, setHoveredFood] = useState(null);
  const hoverTimerRef = useRef(null);

  // YOUR ORIGINAL FORM DATA
  const [formData, setFormData] = useState({
    gender: 'male', 
    height: '', 
    weight: '', 
    age: 25, 
    goal: 'maintain', 
    condition: 'none'
  });

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  // Validate daily calories against target whenever plan changes
  useEffect(() => {
    if (!weeklyPlan || !dailyTarget) return;
    const dayName = days[activeDayIdx];
    const currentTotal = weeklyPlan[dayName]?.dailyTotal ?? 0;
    if (Math.abs(currentTotal - dailyTarget) > 50) {
      setErrorNotif(`Calories (${currentTotal}) differ from target (${dailyTarget}) by >50 kcal. Adjust meals.`);
    } else {
      setErrorNotif('');
    }
  }, [weeklyPlan, dailyTarget, activeDayIdx, days]);

  // YOUR ORIGINAL BMI LOGIC
  const bmi = useMemo(() => {
    if (formData.height > 0 && formData.weight > 0) {
      const h = formData.height / 100;
      return (formData.weight / (h * h)).toFixed(1);
    }
    return 0;
  }, [formData.height, formData.weight]);

  useEffect(() => {
    if (!user) { navigate('/'); return; }
    setLoading(false); 
  }, [navigate, user]);

  // YOUR ORIGINAL AI SUGGESTION SYNC
  useEffect(() => {
    if (bmi > 0 && formData.gender) {
      axios.get(`http://localhost:5000/api/recommendations/suggest?gender=${formData.gender}&bmi=${bmi}`)
        .then(res => {
          setSuggestion(res.data.goal);
          setBmiStatus(res.data.category);
          setFormData(prev => ({ ...prev, goal: res.data.goal }));
        }).catch(() => console.log("Prediction sync error."));
    }
  }, [bmi, formData.gender]);

  // FETCH DB ALTERNATIVES
  useEffect(() => {
    if (swappingMeal) {
        axios.get(`http://localhost:5000/api/recommendations/alternatives?type=${swappingMeal.type}&condition=${formData.condition}`)
            .then(res => setDbAlternatives(res.data))
            .catch(() => alert("Database fetch error: 404 Route Not Found. Ensure recommendationRoutes.js is updated."));
    }
  }, [swappingMeal, formData.condition]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.height || !formData.weight) return;
    setIsSyncing(true);
    try {
      const planRes = await axios.post('http://localhost:5000/api/recommendations/generate-plan', formData);
      if (planRes.data && planRes.data.plan) {
        setWeeklyPlan(planRes.data.plan);
        setDailyTarget(planRes.data.dailyTarget);
        setIsSyncing(false);
        setIsSubmitted(true);
      }
    } catch (err) {
      setIsSyncing(false);
      alert("Error generating plan.");
    }
  };

  const addMeal = (newMeal) => {
    const dayName = days[activeDayIdx];
    const updatedPlan = JSON.parse(JSON.stringify(weeklyPlan));
    
    // If index is present, it's a swap (replace), otherwise it's an add (push)
    if (swappingMeal.index !== undefined) {
      updatedPlan[dayName][swappingMeal.type][swappingMeal.index] = newMeal;
    } else {
      updatedPlan[dayName][swappingMeal.type].push(newMeal);
    }

    const dayData = updatedPlan[dayName];
    const newTotal = [...dayData.breakfast, ...dayData.lunch, ...dayData.dinner].reduce((sum, item) => sum + (item.calories || 0), 0);
    updatedPlan[dayName].dailyTotal = Math.round(newTotal);
    setWeeklyPlan(updatedPlan);
    setSwappingMeal(null);
    setHoveredFood(null);
  };

  const removeMeal = (mealType, idx) => {
    const dayName = days[activeDayIdx];
    const updatedPlan = JSON.parse(JSON.stringify(weeklyPlan));
    if (updatedPlan[dayName][mealType].length <= 1) return; // keep at least 1
    updatedPlan[dayName][mealType].splice(idx, 1);
    const dayData = updatedPlan[dayName];
    const newTotal = [...dayData.breakfast, ...dayData.lunch, ...dayData.dinner].reduce((sum, item) => sum + (item.calories || 0), 0);
    updatedPlan[dayName].dailyTotal = Math.round(newTotal);
    setWeeklyPlan(updatedPlan);
  };

  const handleHoverStart = (food) => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = setTimeout(() => setHoveredFood(food), 2000);
  };
  const handleHoverEnd = () => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    setHoveredFood(null);
  };

  const handleSaveToProfile = async () => {
    if (!user) return;
    const currentTotal = weeklyPlan[days[activeDayIdx]].dailyTotal;
    if (weeklyPlan[days[activeDayIdx]].dailyTotal > dailyTarget || (dailyTarget - weeklyPlan[days[activeDayIdx]].dailyTotal) > 50) {
        setErrorNotif(`Condition failed: Current calories (${currentTotal}) differ from target (${dailyTarget}) by >50 kcal. Adjust meals.`);
        setTimeout(() => setErrorNotif(""), 5000);
        return;
    }

    try {
      setIsSyncing(true);
      await axios.post('http://localhost:5000/api/diets/save-weekly', {
        userId: user.id || user.uid || user._id,
        plan: weeklyPlan
      });
      setShowToast(true);
      setTimeout(() => {
        setShowToast(false);
        navigate('/dashboard');
      }, 2500);
    } catch (err) {
      console.error("Save Error:", err);
      alert("Failed to save plan. Check console for details.");
    } finally {
      setIsSyncing(false);
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-[#f5faf4]"><Loader2 className="animate-spin text-[#6a9966]" /></div>;

  return (
    <div className="h-screen w-full bg-[#f5faf4] text-[#1c3a1c] p-10 overflow-hidden relative">
      
      {/* ERROR NOTIFICATION */}
      <AnimatePresence>
        {errorNotif && (
            <motion.div initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -50, opacity: 0 }}
                className="fixed top-10 left-1/2 -translate-x-1/2 z-[200] bg-red-600 text-white px-8 py-4 rounded-full shadow-2xl flex items-center gap-3"
            >
                <AlertCircle size={20} />
                <span className="text-[10px] font-bold uppercase tracking-widest">{errorNotif}</span>
            </motion.div>
        )}
      </AnimatePresence>
      
      {/* SUCCESS NOTIFICATION */}
      <AnimatePresence>
        {showToast && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-[300] flex items-center justify-center bg-[#1c3a1c]/60 backdrop-blur-sm"
            >
                <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-white p-12 rounded-[40px] shadow-2xl text-center max-w-sm mx-4 border-4 border-[#8ecb84]">
                    <div className="w-20 h-20 bg-[#f5faf4] rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                        <CheckCircle size={48} className="text-[#2d5a27]" />
                    </div>
                    <h2 className="font-serif text-3xl text-[#1c3a1c] mb-2">Plan Saved!</h2>
                    <p className="text-sm text-[#5a7054] mb-8 uppercase tracking-widest font-bold">Synchronized to Profile</p>
                    <div className="flex items-center justify-center gap-3 text-[#6a9966] text-[10px] font-black uppercase tracking-[0.2em]">
                        <Loader2 className="animate-spin" size={14} />
                        Returning to Hub...
                    </div>
                </motion.div>
            </motion.div>
        )}
      </AnimatePresence>

      <div className={`grid h-full transition-all duration-1000 ${isSubmitted ? 'grid-cols-12 gap-10' : 'grid-cols-1'}`}>
        
        {/* --- LEFT COLUMN: YOUR ORIGINAL BIOMETRIC SIDEBAR --- */}
        <motion.div layout transition={{ type: "spring", stiffness: 60 }}
          className={`${isSubmitted ? 'col-span-4' : 'max-w-xl mx-auto w-full'} flex flex-col h-full`}
        >
          <header className="flex items-center gap-6 mb-8 flex-shrink-0">
            <button onClick={() => navigate('/dashboard')} className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#5a7054] hover:text-[#2d5a27] flex items-center gap-2 transition-all">
                <ArrowLeft size={14} /> Hub
            </button>
            <div className="text-left">
              <h2 className="font-serif text-2xl italic">NutriFind</h2>
              <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[#6a9966]">Biometric Intelligence</p>
            </div>
          </header>

          <div className="flex flex-col gap-6 flex-grow overflow-hidden pb-4">
            <main className="bg-white rounded-2xl p-10 border border-[#ddd8ce] shadow-sm overflow-y-auto">
              <h3 className="font-serif text-3xl mb-12 tracking-tight italic">Biometric Input</h3>
              <form onSubmit={handleSubmit} className="space-y-12">
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#5a7054]">Gender</label>
                    <select value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})} className="w-full h-10 bg-transparent border-b-2 border-[#ddd8ce] outline-none font-medium text-sm transition-all focus:border-[#2d5a27]">
                      <option value="male">Male</option><option value="female">Female</option>
                    </select>
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#5a7054]">Health Status</label>
                    <select value={formData.condition} onChange={e => setFormData({...formData, condition: e.target.value})} className="w-full h-10 bg-transparent border-b-2 border-[#ddd8ce] outline-none font-medium text-sm transition-all focus:border-[#2d5a27]">
                      <option value="none">Healthy</option>
                      <option value="diabetes">Diabetes</option>
                      <option value="hypertension">Hypertension</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#5a7054]">Height (cm)</label>
                    <input type="number" value={formData.height} onChange={e => setFormData({...formData, height: e.target.value})} className="w-full h-10 bg-transparent border-b-2 border-[#ddd8ce] outline-none text-base font-medium focus:border-[#2d5a27]" placeholder="000" required />
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#5a7054]">Weight (kg)</label>
                    <input type="number" value={formData.weight} onChange={e => setFormData({...formData, weight: e.target.value})} className="w-full h-10 bg-transparent border-b-2 border-[#ddd8ce] outline-none text-base font-medium focus:border-[#2d5a27]" placeholder="00" required />
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#5a7054]">Intended Goal</label>
                  <select 
                    value={formData.goal} 
                    onChange={e => setFormData({...formData, goal: e.target.value})} 
                    className={`w-full h-14 px-5 rounded-xl border-2 font-bold text-sm outline-none transition-all ${suggestion ? 'border-[#8ecb84] bg-[#f5faf4]' : 'border-[#ddd8ce]'}`}
                  >
                    <option value="lose">Weight Loss {suggestion === 'lose' ? '(Recommended)' : ''}</option>
                    <option value="gain">Gain Weight {suggestion === 'gain' ? '(Recommended)' : ''}</option>
                    <option value="maintain">Maintenance {suggestion === 'maintain' ? '(Recommended)' : ''}</option>
                  </select>
                </div>

                <button type="submit" className="w-full h-16 bg-[#2d5a27] hover:bg-[#1c3a1c] text-white rounded-xl font-bold text-[11px] uppercase tracking-[0.4em] transition-all shadow-xl active:scale-[0.98]">
                  Save & Generate Plan
                </button>
              </form>
            </main>

            {/* Calculated Results Area */}
            <div className="grid grid-cols-2 gap-5 flex-shrink-0">
              <div className="bg-[#1c3a1c] rounded-2xl p-6 text-center text-[#e8f4e5] shadow-lg">
                 <p className="text-[8px] font-bold uppercase tracking-[0.4em] text-[#6a9966] mb-4">Calculated BMI</p>
                 <h2 className="text-4xl font-serif mb-4">{bmi}</h2>
                 <div className="px-4 py-1.5 bg-[#2d5a27] rounded-full text-[8px] font-black uppercase tracking-widest inline-block">{bmiStatus || "Ready"}</div>
              </div>
              <div className="bg-white rounded-2xl p-6 border border-[#ddd8ce] shadow-sm flex flex-col justify-center">
                <div className="flex items-center gap-2 mb-2">
                    <Info size={12} className="text-[#6a9966]" />
                    <h4 className="text-[8px] font-bold uppercase tracking-widest text-[#5a7054]">AI Insight</h4>
                </div>
                <p className="text-[10px] leading-relaxed italic opacity-80">
                    {suggestion ? `Recommend ${suggestion.toUpperCase()} based on your current metrics.` : "Sync data for model prediction."}
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* --- RIGHT COLUMN: WEEKLY GRID & ACTIVE DAY PANEL --- */}
        {isSubmitted && weeklyPlan && (
          <motion.div initial={{ opacity: 0, x: 100 }} animate={{ opacity: 1, x: 0 }} className="col-span-8 h-full pt-[104px]">
            <div className="grid grid-cols-4 grid-rows-2 gap-4 h-[calc(100%-140px)]">
              
              <motion.div key={days[activeDayIdx]} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="col-span-1 row-span-2 bg-white rounded-2xl p-8 border-2 border-[#2d5a27] shadow-xl flex flex-col relative overflow-hidden h-full max-h-full">
                
                {/* DETAILS MODAL */}
                <AnimatePresence>
                    {viewingDetails && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-[70] bg-[#1c3a1c] text-white p-6 flex flex-col overflow-y-auto custom-scrollbar">
                            <div className="flex justify-between items-center mb-4"><h5 className="font-serif italic text-xl">Nutrition Facts</h5><button onClick={() => setViewingDetails(null)} className="hover:text-[#8ecb84] transition-colors"><X size={20}/></button></div>
                            {viewingDetails.image ? <img src={viewingDetails.image} alt={viewingDetails.name} className="w-full h-36 object-cover rounded-xl mb-4" /> : <div className="w-full h-36 rounded-xl mb-4 bg-gradient-to-br from-[#2d5a27] to-[#8ecb84] flex items-center justify-center"><span className="text-4xl">🍽️</span></div>}
                            <h2 className="text-xl font-bold text-[#8ecb84] italic mb-4 leading-tight">{viewingDetails.name}</h2>
                            <div className="grid grid-cols-2 gap-3 mb-4">
                                <div className="bg-white/10 p-4 rounded-xl text-center"><p className="text-[9px] uppercase tracking-widest text-[#8ecb84] mb-1">Calories</p><p className="text-base font-bold">{viewingDetails.calories} kcal</p></div>
                                <div className="bg-white/10 p-4 rounded-xl text-center"><p className="text-[9px] uppercase tracking-widest text-[#8ecb84] mb-1">Serving</p><p className="text-base font-bold">{viewingDetails.grams}g</p></div>
                                {viewingDetails.sugar !== undefined && <div className="bg-white/10 p-4 rounded-xl text-center"><p className="text-[9px] uppercase tracking-widest text-[#8ecb84] mb-1">Sugar</p><p className="text-base font-bold">{viewingDetails.sugar}g</p></div>}
                                {viewingDetails.sodium !== undefined && <div className="bg-white/10 p-4 rounded-xl text-center"><p className="text-[9px] uppercase tracking-widest text-[#8ecb84] mb-1">Sodium</p><p className="text-base font-bold">{viewingDetails.sodium}mg</p></div>}
                            </div>
                            <div className="mt-auto space-y-2">
                                <button onClick={() => { setSwappingMeal({type: viewingDetails.slotType, index: viewingDetails.index}); setViewingDetails(null); }} className="w-full py-4 bg-[#8ecb84] text-[#1c3a1c] rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-[#a8dba0] transition-colors">Pick Alternative</button>
                                <button onClick={() => { removeMeal(viewingDetails.slotType, viewingDetails.index); setViewingDetails(null); }} className="w-full py-3 bg-red-500/20 text-red-300 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-red-500/40 transition-colors flex items-center justify-center gap-2"><Trash2 size={14}/> Remove This Meal</button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ADD MODAL */}
                <AnimatePresence>
                    {swappingMeal && (
                        <motion.div initial={{ y: 300 }} animate={{ y: 0 }} exit={{ y: 300 }} className="absolute inset-0 z-[70] bg-white p-6 flex flex-col shadow-2xl">
                            <div className="flex justify-between mb-4 font-bold text-xs tracking-widest text-[#2d5a27]"><span>FOOD SELECTION</span><button onClick={() => { setSwappingMeal(null); setHoveredFood(null); }}><X size={20}/></button></div>
                            <p className="text-xs text-gray-400 mb-3 italic">Hover 2s to preview details</p>
                            <div className="flex-1 space-y-2 overflow-y-auto pr-2 custom-scrollbar relative">
                                {dbAlternatives.map((alt, i) => (
                                    <button key={i} onClick={() => addMeal(alt)} onMouseEnter={() => handleHoverStart(alt)} onMouseLeave={handleHoverEnd} className="w-full text-left p-4 rounded-xl border hover:border-[#2d5a27] hover:bg-[#f5faf4] transition-all group relative">
                                        <div className="flex items-center gap-3">
                                            {alt.image ? <img src={alt.image} alt={alt.name} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" /> : <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#2d5a27] to-[#8ecb84] flex items-center justify-center flex-shrink-0"><span className="text-sm">🍽️</span></div>}
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold text-[#1c3a1c] group-hover:text-[#2d5a27] truncate">{alt.name}</p>
                                                <p className="text-xs opacity-40">{alt.calories} kcal · {alt.grams}g</p>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                                {/* Hover Preview Tooltip */}
                                <AnimatePresence>
                                    {hoveredFood && (
                                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.2 }} className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[100] w-80 bg-[#1c3a1c] text-white rounded-2xl shadow-2xl p-6 border border-[#2d5a27]">
                                            {hoveredFood.image ? <img src={hoveredFood.image} alt={hoveredFood.name} className="w-full h-40 object-cover rounded-xl mb-4" /> : <div className="w-full h-40 rounded-xl mb-4 bg-gradient-to-br from-[#2d5a27] to-[#8ecb84] flex items-center justify-center"><span className="text-5xl">🍽️</span></div>}
                                            <h4 className="font-bold text-[#8ecb84] text-base mb-3">{hoveredFood.name}</h4>
                                            <div className="grid grid-cols-2 gap-2 text-center">
                                                <div className="bg-white/10 p-3 rounded-lg"><p className="text-[9px] uppercase text-[#8ecb84]">Calories</p><p className="text-sm font-bold">{hoveredFood.calories} kcal</p></div>
                                                <div className="bg-white/10 p-3 rounded-lg"><p className="text-[9px] uppercase text-[#8ecb84]">Serving</p><p className="text-sm font-bold">{hoveredFood.grams}g</p></div>
                                                {hoveredFood.sugar !== undefined && <div className="bg-white/10 p-3 rounded-lg"><p className="text-[9px] uppercase text-[#8ecb84]">Sugar</p><p className="text-sm font-bold">{hoveredFood.sugar}g</p></div>}
                                                {hoveredFood.sodium !== undefined && <div className="bg-white/10 p-3 rounded-lg"><p className="text-[9px] uppercase text-[#8ecb84]">Sodium</p><p className="text-sm font-bold">{hoveredFood.sodium}mg</p></div>}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <span className="text-xs font-black text-[#2d5a27] uppercase tracking-[0.3em] mb-4">{days[activeDayIdx]} Plan</span>
                <div className="flex-1 flex flex-col gap-3 min-h-0 overflow-hidden">
                  {['breakfast', 'lunch', 'dinner'].map((m) => (
                    <div key={m} className="flex-1 min-h-0 bg-[#fbfdfa] rounded-xl border-2 p-4 flex flex-col group hover:border-[#2d5a27] transition-all">
                        <p className="text-[10px] font-bold uppercase text-[#6a9966] mb-2">{m}</p>
                        <div className="flex-1 overflow-y-auto space-y-1.5 mb-2 custom-scrollbar">
                            {weeklyPlan[days[activeDayIdx]][m].map((item, idx) => (
                                <div key={idx} className="flex justify-between items-center bg-white p-2.5 rounded-lg border text-xs font-bold text-[#1c3a1c]">
                                    <span className="truncate flex-1 mr-2">{item.name}</span>
                                    <span className="text-[10px] text-gray-400 mr-2 flex-shrink-0">{item.calories} kcal</span>
                                    <button onClick={() => setViewingDetails({...item, slotType: m, index: idx})} className="hover:text-[#2d5a27] transition-colors flex-shrink-0" title="View details"><Eye size={16}/></button>
                                </div>
                            ))}
                        </div>
                        <button onClick={() => setSwappingMeal({type: m})} className="w-full py-2.5 bg-[#f5faf4] border text-[#2d5a27] rounded-lg text-[10px] font-bold uppercase hover:bg-[#2d5a27] hover:text-white transition-all">+ Add Food</button>
                    </div>
                  ))}
                </div>
                <div className="pt-4 mt-6 border-t text-center flex-shrink-0">
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Goal: {dailyTarget} kcal</p>
                    <p className={`text-xl font-serif italic ${(weeklyPlan[days[activeDayIdx]].dailyTotal > dailyTarget || (dailyTarget - weeklyPlan[days[activeDayIdx]].dailyTotal) > 50) ? 'text-red-500' : 'text-[#2d5a27]'}`}>
                        {weeklyPlan[days[activeDayIdx]].dailyTotal} <span className="text-[10px] font-sans not-italic font-bold">kcal</span>
                    </p>
                </div>
              </motion.div>

              {days.map((day, idx) => idx !== activeDayIdx && (
                <div key={day} onClick={() => setActiveDayIdx(idx)} className="h-full bg-white rounded-2xl p-6 border border-[#ddd8ce] shadow-sm flex flex-col justify-center cursor-pointer hover:border-[#2d5a27] transition-all group">
                    <span className="text-[8px] font-black text-[#6a9966] uppercase mb-2">Day 0{idx+1}</span>
                    <h4 className="font-serif italic text-xl">{day}</h4>
                    <p className="text-[9px] opacity-40 font-bold uppercase mt-1">{weeklyPlan[day]?.dailyTotal} kcal</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {isSubmitted && (
        <button onClick={handleSaveToProfile} className="fixed bottom-10 right-10 bg-[#1c3a1c] text-white px-10 py-5 rounded-full shadow-2xl flex items-center gap-4 hover:scale-105 transition-all">
            <Save size={20} className="text-[#8ecb84]" />
            <span className="text-[11px] font-black uppercase tracking-[0.2em]">Confirm & Save Plan</span>
        </button>
      )}

      <style dangerouslySetInnerHTML={{ __html: `.custom-scrollbar::-webkit-scrollbar { width: 4px; } .custom-scrollbar::-webkit-scrollbar-thumb { background: #6a9966; border-radius: 10px; }` }} />
    </div>
  );
};

export default GenerateWeekly;