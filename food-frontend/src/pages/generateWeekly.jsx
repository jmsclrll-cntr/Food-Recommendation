import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Loader2, Save, ArrowLeft, Info } from 'lucide-react';

const GenerateWeekly = () => {
  const navigate = useNavigate();

  // --- Logic States ---
  const [user] = useState(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });

  const [loading, setLoading] = useState(true); 
  const [isSyncing, setIsSyncing] = useState(false); 
  const [isSubmitted, setIsSubmitted] = useState(false); 
  const [showToast, setShowToast] = useState(false);
  
  const [activeDayIdx, setActiveDayIdx] = useState(0); 
  const [bmiStatus, setBmiStatus] = useState("");
  const [suggestion, setSuggestion] = useState("");
  const [weeklyPlan, setWeeklyPlan] = useState(null);

  const [formData, setFormData] = useState({
    gender: 'male', height: '', weight: '', age: 25, goal: 'maintain', condition: 'none'
  });

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  // Calculate BMI on the fly
  const bmi = useMemo(() => {
    if (formData.height > 0 && formData.weight > 0) {
      const h = formData.height / 100;
      return (formData.weight / (h * h)).toFixed(1);
    }
    return 0;
  }, [formData.height, formData.weight]);

  // Initial Check
  useEffect(() => {
    if (!user) { navigate('/'); return; }
    setLoading(false); 
  }, [navigate, user]);

  // Live BMI Category Prediction
  useEffect(() => {
    if (bmi > 0 && formData.gender) {
      axios.get(`http://localhost:5000/api/recommendations/suggest?gender=${formData.gender}&bmi=${bmi}`)
        .then(res => {
          setSuggestion(res.data.goal);
          setBmiStatus(res.data.category);
        }).catch(() => console.log("Prediction sync error."));
    }
  }, [bmi, formData.gender]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.height || !formData.weight) {
        alert("Please provide height and weight.");
        return;
    }

    setIsSyncing(true);

    // NECESSARY CHANGE: Ensure all values are sent correctly
    const payload = {
        userId: user.uid || user.id,
        gender: formData.gender,
        height: parseFloat(formData.height),
        weight: parseFloat(formData.weight),
        age: parseFloat(formData.age || 25),
        goal: formData.goal,
        condition: formData.condition,
        bmi: parseFloat(bmi)
    };

    try {
      // 1. Save health data
      await axios.post('http://localhost:5000/api/health/save', payload);
      
      // 2. Fetch the 7-day ML generated plan
      const planRes = await axios.post('http://localhost:5000/api/recommendations/generate-plan', payload);
      
      // Check if data actually exists in response
      if (planRes.data && planRes.data.plan) {
        setWeeklyPlan(planRes.data.plan);
        
        setTimeout(() => {
          setIsSyncing(false);
          setIsSubmitted(true);
          setShowToast(true);
          setTimeout(() => setShowToast(false), 3000); 
        }, 1200);
      } else {
          throw new Error("Empty plan");
      }

    } catch (err) {
      setIsSyncing(false);
      // Detailed error logging to help you debug
      console.error("Submit Error:", err.response?.data || err.message);
      alert("Error: " + (err.response?.data?.error || "Ensure your food database in Firestore is not empty and has breakfast, lunch, and dinner items."));
    }
  };

  const handleSaveToProfile = () => {
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  };

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-[#f5faf4]">
      <Loader2 className="w-8 h-8 animate-spin text-[#6a9966]" />
    </div>
  );

  return (
    <div className="h-screen w-full bg-[#f5faf4] text-[#1c3a1c] font-sans antialiased p-10 overflow-hidden relative">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {showToast && (
          <motion.div 
            initial={{ opacity: 0, y: -50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -50 }}
            className="fixed top-8 left-1/2 -translate-x-1/2 z-[100] bg-[#1c3a1c] text-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3"
          >
            <CheckCircle className="text-[#8ecb84] w-4 h-4" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Plan Synced & Saved</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Syncing Overlay */}
      <AnimatePresence>
        {isSyncing && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[#f5faf4]/60 backdrop-blur-sm flex items-center justify-center"
          >
            <div className="text-center">
                <Loader2 className="w-12 h-12 animate-spin text-[#2d5a27] mx-auto mb-4" />
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#2d5a27]">Analyzing Nutritional Voids...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Save Button (Lower Left) */}
      <AnimatePresence>
        {isSubmitted && (
            <motion.button
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                onClick={handleSaveToProfile}
                className="fixed bottom-10 left-10 z-[60] bg-[#1c3a1c] text-white px-8 py-5 rounded-full shadow-2xl flex items-center gap-4 hover:bg-[#2d5a27] transition-all group"
            >
                <Save className="w-5 h-5 text-[#8ecb84]" />
                <span className="text-[11px] font-black uppercase tracking-[0.2em]">Save Diet to Profile</span>
            </motion.button>
        )}
      </AnimatePresence>

      <div className={`grid h-full transition-all duration-1000 ease-in-out ${isSubmitted ? 'grid-cols-12 gap-10' : 'grid-cols-1'}`}>
        
        {/* LEFT COLUMN: Biometrics Form */}
        <motion.div layout transition={{ type: "spring", stiffness: 60, damping: 15 }}
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
              <h3 className="font-serif text-2xl mb-8 tracking-tight italic">Biometric Input</h3>
              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#5a7054]">Gender</label>
                    <select value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})} className="w-full h-10 bg-transparent border-b-2 border-[#ddd8ce] outline-none font-medium text-sm transition-all">
                      <option value="male">Male</option><option value="female">Female</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#5a7054]">Health Status</label>
                    <select value={formData.condition} onChange={e => setFormData({...formData, condition: e.target.value})} className="w-full h-10 bg-transparent border-b-2 border-[#ddd8ce] outline-none font-medium text-sm transition-all">
                      <option value="none">Healthy</option>
                      <option value="diabetes">Diabetes</option>
                      <option value="hypertension">Hypertension</option>
                      <option value="heart disease">Heart Disease</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#5a7054]">Height (cm)</label>
                    <input type="number" value={formData.height} onChange={e => setFormData({...formData, height: e.target.value})} className="w-full h-10 bg-transparent border-b-2 border-[#ddd8ce] outline-none text-base font-medium" required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#5a7054]">Weight (kg)</label>
                    <input type="number" value={formData.weight} onChange={e => setFormData({...formData, weight: e.target.value})} className="w-full h-10 bg-transparent border-b-2 border-[#ddd8ce] outline-none text-base font-medium" required />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#5a7054]">Intended Goal</label>
                  <select value={formData.goal} onChange={e => setFormData({...formData, goal: e.target.value})} className="w-full h-12 px-5 rounded-xl border-2 border-[#ddd8ce] font-bold text-sm outline-none transition-all focus:border-[#8ecb84]">
                    <option value="lose">Weight Loss</option>
                    <option value="gain">Muscle Gain</option>
                    <option value="maintain">Maintenance</option>
                  </select>
                </div>

                <button type="submit" disabled={isSyncing} className="w-full h-14 bg-[#2d5a27] hover:bg-[#1c3a1c] text-white rounded-xl font-bold text-[11px] uppercase tracking-[0.4em] transition-all active:scale-[0.98] shadow-lg disabled:opacity-50">
                  {isSyncing ? "Syncing..." : (isSubmitted ? 'Update Analysis' : 'Save & Generate Plan')}
                </button>
              </form>
            </main>

            {/* BMI Footer Stats */}
            <div className="grid grid-cols-2 gap-5 flex-shrink-0">
              <div className="bg-[#1c3a1c] rounded-2xl p-6 text-center text-[#e8f4e5] shadow-lg">
                 <p className="text-[8px] font-bold uppercase tracking-[0.4em] text-[#6a9966] mb-2">Calculated BMI</p>
                 <h2 className="text-4xl font-serif mb-2">{bmi}</h2>
                 <div className="px-3 py-1 bg-[#2d5a27] rounded-full text-[8px] font-black uppercase tracking-widest inline-block">{bmiStatus || "Ready"}</div>
              </div>
              <div className="bg-white rounded-2xl p-6 border border-[#ddd8ce] shadow-sm flex flex-col justify-center">
                <div className="flex items-center gap-2 mb-2">
                    <Info size={12} className="text-[#6a9966]" />
                    <h4 className="text-[8px] font-bold uppercase tracking-widest text-[#5a7054]">AI Insight</h4>
                </div>
                <p className="text-[10px] leading-relaxed italic opacity-80">
                    {suggestion ? `Model suggests ${suggestion.toUpperCase()} based on demographic peers.` : "Sync data for AI prediction."}
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        <AnimatePresence>
          {isSubmitted && weeklyPlan && (
            <motion.div initial={{ opacity: 0, x: 100 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}
              className="col-span-8 h-full pt-[104px]"
            >
              <div className="grid grid-cols-4 grid-rows-2 gap-4 h-[calc(100%-140px)]">
                
                {/* 1. FOCUS DAY PANEL */}
                <motion.div layout key={days[activeDayIdx]} className="col-span-1 row-span-2 bg-white rounded-2xl p-8 border-2 border-[#2d5a27] shadow-xl flex flex-col overflow-hidden">
                  <span className="text-[9px] font-black text-[#2d5a27] uppercase tracking-[0.3em] mb-4">{days[activeDayIdx]} Plan</span>
                  <h4 className="font-serif italic text-3xl mb-8 text-[#1c3a1c]">Daily Nutrients</h4>
                  
                  <div className="space-y-6 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                    {['breakfast', 'lunch', 'dinner'].map((mealType) => {
                      const meal = weeklyPlan[days[activeDayIdx]][mealType];
                      return (
                        <div key={mealType} className="border-b border-[#f5faf4] pb-5 group">
                          <p className="text-[8px] font-bold uppercase text-[#6a9966] mb-1">{mealType}</p>
                          <h5 className="font-bold text-sm text-[#1c3a1c] group-hover:text-[#2d5a27] transition-colors">{meal?.name || "Selection Pending"}</h5>
                          <p className="text-[10px] opacity-60 mb-3">{meal?.calories || 0} kcal</p>
                          {meal?.imageUrl && (
                              <img src={meal.imageUrl} alt="meal" className="w-full h-24 object-cover rounded-xl shadow-sm border border-[#ddd8ce]" />
                          )}
                        </div>
                      )
                    })}
                    <div className="pt-4 mt-auto">
                        <p className="text-[9px] font-bold text-[#5a7054] uppercase tracking-widest text-center">
                            Daily Target: {weeklyPlan[days[activeDayIdx]].dailyCaloriesTarget || weeklyPlan[days[activeDayIdx]].dailyTotal} Kcal
                        </p>
                    </div>
                  </div>
                </motion.div>

                {days.map((day, idx) => {
                  if (idx === activeDayIdx) return null; 
                  return (
                    <motion.div 
                      key={day} 
                      onClick={() => setActiveDayIdx(idx)}
                      whileHover={{ y: -8, borderColor: '#2d5a27' }}
                      className="bg-white rounded-2xl p-6 border border-[#ddd8ce] shadow-sm flex flex-col justify-center cursor-pointer transition-all group relative overflow-hidden"
                    >
                      <div className="absolute top-0 left-0 w-1 h-full bg-[#f5faf4] group-hover:bg-[#2d5a27] transition-all" />
                      <span className="text-[8px] font-black text-[#6a9966] uppercase tracking-[0.2em] mb-2">Day 0{idx + 1}</span>
                      <h4 className="font-serif italic text-xl text-[#1c3a1c] mb-1 group-hover:translate-x-1 transition-transform">{day}</h4>
                      <p className="text-[9px] opacity-40 font-bold uppercase tracking-tighter">
                        {weeklyPlan[day]?.dailyCaloriesTarget || weeklyPlan[day]?.dailyTotal} kcal
                      </p>
                    </motion.div>
                  )
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f5faf4; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #ddd8ce; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #6a9966; }
      `}} />
    </div>
  );
};

export default GenerateWeekly;