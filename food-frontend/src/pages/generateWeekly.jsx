import { useEffect, useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle, Loader2, Save, ArrowLeft, Info, X, Eye, AlertCircle, Trash2, Sun, Moon 
} from 'lucide-react';

const GenerateWeekly = () => {
  const navigate = useNavigate();

  // --- DARK MODE LOGIC ---
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');
  useEffect(() => {
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  const bgMain = darkMode ? 'bg-[#0d110d]' : 'bg-[#f5faf4]';
  const cardBg = darkMode ? 'bg-[#1a1c1a]' : 'bg-white';
  const border = darkMode ? 'border-white/10' : 'border-[#ddd8ce]';
  const textMain = darkMode ? 'text-white' : 'text-[#1c3a1c]';
  const textSub = darkMode ? 'text-white/60' : 'text-[#5a7054]';
  const optionStyles = darkMode ? 'bg-[#1a1c1a] text-white' : 'bg-white text-[#1c3a1c]';

  // --- ORIGINAL LOGIC & STATE ---
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
  const [swappingMeal, setSwappingMeal] = useState(null); 
  const [dbAlternatives, setDbAlternatives] = useState([]);
  const [viewingDetails, setViewingDetails] = useState(null);

  const [formData, setFormData] = useState({
    gender: 'male', height: '', weight: '', age: 25, goal: 'maintain', condition: 'none'
  });

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  // Logic: BMI Calculation
  const bmi = useMemo(() => {
    if (formData.height > 0 && formData.weight > 0) {
      const h = formData.height / 100;
      return (formData.weight / (h * h)).toFixed(1);
    }
    return 0;
  }, [formData.height, formData.weight]);

  // Logic: Redirect if no user
  useEffect(() => {
    if (!user) { navigate('/'); return; }
    setLoading(false); 
  }, [navigate, user]);

  // Logic: AI Suggestion Sync
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

  // Logic: Fetch Plan
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

  // Logic: Save to DB
  const handleSaveToProfile = async () => {
    if (!user) return;
    try {
      setIsSyncing(true);
      await axios.post('http://localhost:5000/api/diets/save-weekly', {
        userId: user.id || user.uid || user._id,
        plan: weeklyPlan
      });
      setShowToast(true);
      setTimeout(() => navigate('/dashboard'), 2500);
    } catch (err) { alert("Failed to save."); } 
    finally { setIsSyncing(false); }
  };

  if (loading) return <div className={`h-screen flex items-center justify-center ${bgMain}`}><Loader2 className="animate-spin text-[#6a9966]" /></div>;

  return (
    <div className={`h-screen w-full ${bgMain} ${textMain} p-10 overflow-hidden relative transition-colors duration-500`}>
      
      {/* HEADER */}
      <header className="flex items-center justify-between mb-8 relative z-50">
        <div className="flex items-center gap-6">
          <button onClick={() => navigate('/dashboard')} className={`text-[10px] font-bold uppercase tracking-[0.3em] ${textSub} hover:text-[#8ecb84] flex items-center gap-2 transition-all`}>
              <ArrowLeft size={14} /> Hub
          </button>
          <div className="text-left">
            <h2 className="font-serif text-2xl italic">NutriFind</h2>
            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[#6a9966]">Biometric Intelligence</p>
          </div>
        </div>
        <button onClick={() => setDarkMode(!darkMode)} className={`p-2.5 rounded-xl backdrop-blur-md transition-all ${darkMode ? 'bg-white/10 text-yellow-400 hover:bg-white/20' : 'bg-black/10 text-[#1c3a1c] hover:bg-black/5'}`}>
          {darkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </header>

      <div className={`grid h-full transition-all duration-1000 ${isSubmitted ? 'grid-cols-12 gap-10' : 'grid-cols-1'}`}>
        
        {/* LEFT COLUMN (SIDEBAR) */}
        <motion.div layout className={`${isSubmitted ? 'col-span-4' : 'max-w-xl mx-auto w-full'} flex flex-col h-full gap-6`}>
            {/* Input Card */}
            <main className={`${cardBg} rounded-[2rem] p-8 border ${border} shadow-sm overflow-y-auto transition-colors custom-scrollbar`}>
              <h3 className="font-serif text-3xl mb-8 italic">Biometrics</h3>
              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className={`text-[9px] font-bold uppercase tracking-widest ${textSub}`}>Gender</label>
                    <select value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})} className={`w-full h-10 ${darkMode ? 'bg-[#1a1c1a]' : 'bg-transparent'} border-b ${border} outline-none text-sm`}>
                      <option className={optionStyles} value="male">Male</option><option className={optionStyles} value="female">Female</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className={`text-[9px] font-bold uppercase tracking-widest ${textSub}`}>Status</label>
                    <select value={formData.condition} onChange={e => setFormData({...formData, condition: e.target.value})} className={`w-full h-10 ${darkMode ? 'bg-[#1a1c1a]' : 'bg-transparent'} border-b ${border} outline-none text-sm`}>
                      <option className={optionStyles} value="none">Healthy</option><option className={optionStyles} value="diabetes">Diabetes</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-6">
                    <input type="number" placeholder="Height" value={formData.height} onChange={e => setFormData({...formData, height: e.target.value})} className={`w-full h-10 bg-transparent border-b ${border} outline-none text-sm`} required />
                    <input type="number" placeholder="Weight" value={formData.weight} onChange={e => setFormData({...formData, weight: e.target.value})} className={`w-full h-10 bg-transparent border-b ${border} outline-none text-sm`} required />
                </div>
                <div className="space-y-2">
                  <label className={`text-[9px] font-bold uppercase tracking-widest ${textSub}`}>Goal</label>
                  <select value={formData.goal} onChange={e => setFormData({...formData, goal: e.target.value})} className={`w-full h-12 px-4 rounded-xl border ${suggestion ? 'border-[#8ecb84]' : border} ${darkMode ? 'bg-[#1a1c1a]' : 'bg-white'} text-xs font-bold`}>
                    <option className={optionStyles} value="lose">Weight Loss</option><option className={optionStyles} value="gain">Weight Gain</option><option className={optionStyles} value="maintain">Maintenance</option>
                  </select>
                </div>
                <button type="submit" className="w-full h-14 bg-[#2d5a27] text-white rounded-xl font-bold text-[10px] uppercase tracking-[0.3em] transition-all hover:bg-[#1c3a1c]">
                  {isSyncing ? <Loader2 className="animate-spin mx-auto" /> : "Generate Weekly Plan"}
                </button>
              </form>
            </main>

            {/* RESTORED BMI & INSIGHT CARDS */}
            <div className="grid grid-cols-2 gap-4 pb-10">
              <div className="bg-[#1c3a1c] rounded-[1.5rem] p-6 text-center text-[#e8f4e5] shadow-lg">
                 <p className="text-[8px] font-black uppercase tracking-[0.4em] text-[#6a9966] mb-3">Calculated BMI</p>
                 <h2 className="text-4xl font-serif mb-3">{bmi}</h2>
                 <div className="px-3 py-1 bg-[#2d5a27] rounded-full text-[7px] font-black uppercase tracking-widest inline-block">{bmiStatus || "Ready"}</div>
              </div>
              <div className={`${cardBg} rounded-[1.5rem] p-6 border ${border} shadow-sm flex flex-col justify-center transition-colors`}>
                <div className="flex items-center gap-2 mb-2">
                    <Info size={12} className="text-[#6a9966]" />
                    <h4 className={`text-[8px] font-black uppercase tracking-widest ${textSub}`}>AI Insight</h4>
                </div>
                <p className="text-[10px] leading-relaxed italic opacity-80">
                    {suggestion ? `Recommend ${suggestion.toUpperCase()} based on current biometric data.` : "Input metrics to sync model prediction."}
                </p>
              </div>
            </div>
        </motion.div>

        {/* RIGHT COLUMN (WEEKLY PLAN POP-UP) */}
        {isSubmitted && weeklyPlan && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="col-span-8 flex flex-col gap-6">
            
            {/* Day Selector Icons */}
            <div className="flex items-center gap-3">
              {days.map((day, idx) => (
                <button
                  key={day}
                  onClick={() => setActiveDayIdx(idx)}
                  className={`flex-1 py-3 rounded-2xl border transition-all duration-300 flex flex-col items-center gap-1
                    ${activeDayIdx === idx 
                      ? 'bg-[#2d5a27] border-[#8ecb84] text-white shadow-lg scale-105' 
                      : `${cardBg} ${border} ${textSub} hover:border-[#2d5a27]`
                    }`}
                >
                  <span className="text-[8px] font-black uppercase opacity-60">Day 0{idx+1}</span>
                  <span className="text-[10px] font-black uppercase tracking-tighter">{day.substring(0, 3)}</span>
                </button>
              ))}
            </div>

            {/* Content Stage */}
            <div className="flex-1 relative pb-20">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeDayIdx}
                    initial={{ opacity: 0, scale: 0.98, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 1.02, y: -10 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className={`${cardBg} ${border} border rounded-[2.5rem] p-8 shadow-2xl h-full flex flex-col transition-colors`}
                  >
                    <div className="flex justify-between items-center mb-8 border-b pb-6 border-white/5">
                      <h2 className="font-serif text-3xl italic">{days[activeDayIdx]} Narrative</h2>
                      <div className="text-right">
                        <p className={`text-[10px] font-black uppercase tracking-widest ${textSub}`}>Intake Total</p>
                        <p className="text-xl font-serif italic text-[#2d5a27]">{weeklyPlan[days[activeDayIdx]].dailyTotal} kcal</p>
                      </div>
                    </div>

                    <div className="flex-1 grid grid-cols-3 gap-6 overflow-hidden">
                      {['breakfast', 'lunch', 'dinner'].map((m) => (
                        <div key={m} className={`flex flex-col bg-black/5 rounded-3xl p-5 border ${border}`}>
                          <p className="text-[10px] font-black text-[#6a9966] uppercase mb-4 tracking-widest">{m}</p>
                          <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar pr-1">
                            {weeklyPlan[days[activeDayIdx]][m].map((item, idx) => (
                              <div key={idx} className={`${darkMode ? 'bg-white/5' : 'bg-white'} p-3 rounded-xl border ${border} flex justify-between items-center`}>
                                <span className="text-[11px] font-bold truncate flex-1">{item.name}</span>
                                <button onClick={() => setViewingDetails(item)} className="text-[#6a9966] hover:scale-110 transition-transform"><Eye size={16}/></button>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                </AnimatePresence>
            </div>
          </motion.div>
        )}
      </div>

      {/* FOOTER ACTION */}
      {isSubmitted && (
        <button onClick={handleSaveToProfile} className="fixed bottom-10 right-10 bg-[#1c3a1c] text-white px-10 py-5 rounded-full shadow-2xl flex items-center gap-4 hover:scale-105 transition-all z-50">
            <Save size={20} className="text-[#8ecb84]" />
            <span className="text-[11px] font-black uppercase tracking-[0.2em]">Confirm & Save Plan</span>
        </button>
      )}

      {/* SUCCESS TOAST */}
      <AnimatePresence>
        {showToast && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[300] bg-black/60 backdrop-blur-sm flex items-center justify-center">
                <div className={`${cardBg} p-12 rounded-[40px] text-center border-4 border-[#8ecb84]`}>
                    <CheckCircle size={48} className="text-[#2d5a27] mx-auto mb-4" />
                    <h2 className="font-serif text-3xl">Plan Saved!</h2>
                </div>
            </motion.div>
        )}
      </AnimatePresence>

      <style dangerouslySetInnerHTML={{ __html: `.custom-scrollbar::-webkit-scrollbar { width: 3px; } .custom-scrollbar::-webkit-scrollbar-thumb { background: #6a9966; border-radius: 10px; }` }} />
    </div>
  );
};

export default GenerateWeekly;