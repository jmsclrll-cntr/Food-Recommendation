import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Loader2, Save, ArrowLeft, Info, RefreshCw, X, Eye } from 'lucide-react';

const GenerateWeekly = () => {
  const navigate = useNavigate();

  // --- Logic States (Preserved) ---
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

  // --- New Added States for Interaction ---
  const [swappingMeal, setSwappingMeal] = useState(null); // { type: 'breakfast' | 'lunch' | 'dinner' }
  const [viewingDetails, setViewingDetails] = useState(null); // Stores the meal object being viewed

  // Static alternatives list (Connect to your database later)
  const alternativesList = [
    { name: "Avocado & Egg Sourdough", calories: 340, protein: "12g", carbs: "35g" },
    { name: "Blueberry Protein Oatmeal", calories: 290, protein: "20g", carbs: "40g" },
    { name: "Grilled Salmon Salad", calories: 480, protein: "35g", carbs: "10g" },
    { name: "Quinoa Veggie Stir-fry", calories: 410, protein: "15g", carbs: "55g" },
    { name: "Lean Turkey Wrap", calories: 380, protein: "25g", carbs: "30g" }
  ];

  const [formData, setFormData] = useState({
    gender: 'male', 
    height: '', 
    weight: '', 
    age: 25, 
    goal: 'maintain', 
    condition: 'none'
  });

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  // Logic Preserved: BMI Calculation
  const bmi = useMemo(() => {
    if (formData.height > 0 && formData.weight > 0) {
      const h = formData.height / 100;
      return (formData.weight / (h * h)).toFixed(1);
    }
    return 0;
  }, [formData.height, formData.weight]);

  // Logic Preserved: Auth Check
  useEffect(() => {
    if (!user) { navigate('/'); return; }
    setLoading(false); 
  }, [navigate, user]);

  // Logic Preserved: Live BMI Prediction Sync
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

  // Logic Preserved: Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.height || !formData.weight) {
        alert("Please provide height and weight.");
        return;
    }
    setIsSyncing(true);
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
      if (!isSubmitted) {
        await axios.post('http://localhost:5000/api/health/save', payload);
      } else {
        await axios.put(`http://localhost:5000/api/health/update/${user.uid || user.id}`, payload);
      }
      const planRes = await axios.post('http://localhost:5000/api/recommendations/generate-plan', payload);
      if (planRes.data && planRes.data.plan) {
        setWeeklyPlan(planRes.data.plan);
        setTimeout(() => {
          setIsSyncing(false);
          setIsSubmitted(true);
          setShowToast(true);
          setTimeout(() => setShowToast(false), 3000); 
        }, 1200);
      }
    } catch (err) {
      setIsSyncing(false);
      alert("Error generating plan.");
    }
  };

  // Logic Added: Calorie-checked swap
  const swapMeal = (newMeal) => {
    const currentMeal = weeklyPlan[days[activeDayIdx]][swappingMeal.type];
    const calorieDiff = Math.abs(currentMeal.calories - newMeal.calories);

    if (calorieDiff > 50) {
      alert(`Cannot swap: This meal has ${newMeal.calories} kcal, which deviates by more than 50 kcal from your target.`);
      return;
    }

    const updatedPlan = { ...weeklyPlan };
    updatedPlan[days[activeDayIdx]][swappingMeal.type] = newMeal;
    setWeeklyPlan(updatedPlan);
    setSwappingMeal(null);
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
      
      {/* Syncing Overlay (Preserved) */}
      <AnimatePresence>
        {isSyncing && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[#f5faf4]/60 backdrop-blur-sm flex items-center justify-center"
          >
            <div className="text-center">
                <Loader2 className="w-12 h-12 animate-spin text-[#2d5a27] mx-auto mb-4" />
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#2d5a27]">Analyzing Biometrics & Generating Plan...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Save Button (MOVED TO BOTTOM RIGHT) */}
      <AnimatePresence>
        {isSubmitted && !swappingMeal && (
            <motion.button
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                onClick={handleSaveToProfile}
                className="fixed bottom-10 right-10 z-[60] bg-[#1c3a1c] text-white px-8 py-5 rounded-full shadow-2xl flex items-center gap-4 hover:bg-[#2d5a27] hover:scale-105 transition-all group"
            >
                <Save className="w-5 h-5 text-[#8ecb84]" />
                <span className="text-[11px] font-black uppercase tracking-[0.2em]">Confirm & Save Plan</span>
            </motion.button>
        )}
      </AnimatePresence>

      <div className={`grid h-full transition-all duration-1000 ease-in-out ${isSubmitted ? 'grid-cols-12 gap-10' : 'grid-cols-1'}`}>
        
        {/* LEFT COLUMN: Biometrics Form (Preserved UI Exactly) */}
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
                  <select 
                    value={formData.goal} 
                    onChange={e => setFormData({...formData, goal: e.target.value})} 
                    className={`w-full h-12 px-5 rounded-xl border-2 font-bold text-sm outline-none transition-all ${suggestion ? 'border-[#8ecb84] bg-[#f5faf4]' : 'border-[#ddd8ce]'}`}
                  >
                    <option value="lose">Weight Loss {suggestion === 'lose' ? '(Most Preferred)' : ''}</option>
                    <option value="gain">Gain Weight {suggestion === 'gain' ? '(Most Preferred)' : ''}</option>
                    <option value="maintain">Maintenance {suggestion === 'maintain' ? '(Most Preferred)' : ''}</option>
                  </select>
                </div>

                <button type="submit" disabled={isSyncing} className="w-full h-14 bg-[#2d5a27] hover:bg-[#1c3a1c] text-white rounded-xl font-bold text-[11px] uppercase tracking-[0.4em] transition-all active:scale-[0.98] shadow-lg disabled:opacity-50">
                  {isSyncing ? "Syncing..." : (isSubmitted ? 'Update Analysis' : 'Save & Generate Plan')}
                </button>
              </form>
            </main>

            {/* BMI Preserved Footer */}
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
                    {suggestion ? `Model recommends ${suggestion.toUpperCase()} based on your BMI category.` : "Sync data for AI prediction."}
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* RIGHT COLUMN: Focus Day Wireframe Layout */}
        <AnimatePresence>
          {isSubmitted && weeklyPlan && (
            <motion.div initial={{ opacity: 0, x: 100 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}
              className="col-span-8 h-full pt-[104px]"
            >
              <div className="grid grid-cols-4 grid-rows-2 gap-4 h-[calc(100%-140px)]">
                
                {/* WIREFRAME: Active Day Panel */}
                <motion.div layout key={days[activeDayIdx]} className="col-span-1 row-span-2 bg-white rounded-2xl p-8 border-2 border-[#2d5a27] shadow-xl flex flex-col overflow-hidden relative">
                  
                  {/* Swap Selection Modal */}
                  <AnimatePresence>
                    {swappingMeal && (
                      <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} 
                        className="absolute inset-0 z-50 bg-white p-6 flex flex-col">
                        <div className="flex justify-between items-center mb-6">
                            <h5 className="text-[10px] font-black uppercase text-[#2d5a27] tracking-widest">Swap Meal (+/- 50 kcal)</h5>
                            <button onClick={() => setSwappingMeal(null)} className="p-2 hover:bg-[#f5faf4] rounded-full"><X size={18} /></button>
                        </div>
                        <div className="flex-1 space-y-3 overflow-y-auto custom-scrollbar">
                            {alternativesList.map((alt, i) => (
                                <button key={i} onClick={() => swapMeal(alt)} 
                                    className="w-full text-left p-4 rounded-xl border border-[#ddd8ce] hover:border-[#2d5a27] hover:bg-[#f5faf4] transition-all group">
                                    <p className="text-xs font-bold text-[#1c3a1c] group-hover:text-[#2d5a27] mb-1">{alt.name}</p>
                                    <p className="text-[10px] opacity-40">{alt.calories} kcal</p>
                                </button>
                            ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Details Modal */}
                  <AnimatePresence>
                    {viewingDetails && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
                            className="absolute inset-0 z-50 bg-[#1c3a1c] text-white p-8 flex flex-col">
                            <div className="flex justify-between items-center mb-10">
                                <h5 className="font-serif italic text-2xl">Nutrition Info</h5>
                                <button onClick={() => setViewingDetails(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X/></button>
                            </div>
                            <div className="space-y-6">
                                <h2 className="text-3xl font-bold text-[#8ecb84] leading-tight">{viewingDetails.name}</h2>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-white/10 p-4 rounded-xl text-center"><p className="text-[8px] uppercase opacity-50 mb-1">Calories</p><p className="font-bold">{viewingDetails.calories} kcal</p></div>
                                    <div className="bg-white/10 p-4 rounded-xl text-center"><p className="text-[8px] uppercase opacity-50 mb-1">Protein</p><p className="font-bold">{viewingDetails.protein || "20g"}</p></div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                  </AnimatePresence>

                  <span className="text-[9px] font-black text-[#2d5a27] uppercase tracking-[0.3em] mb-4">{days[activeDayIdx]} Plan</span>
                  <h4 className="font-serif italic text-3xl mb-8 text-[#1c3a1c]">Daily Nutrients</h4>
                  
                  <div className="flex-1 flex flex-col gap-4 min-h-0">
                    {['breakfast', 'lunch', 'dinner'].map((mealType) => {
                      const meal = weeklyPlan[days[activeDayIdx]][mealType];
                      return (
                        <div key={mealType} className="flex-1 flex flex-col min-h-0">
                          <p className="text-[9px] font-bold uppercase text-[#6a9966] mb-1">{mealType}</p>
                          <div className="flex-1 min-h-0 bg-[#fbfdfa] rounded-xl border-2 border-[#f0f4ef] p-4 flex flex-col justify-between group hover:border-[#2d5a27] transition-colors relative">
                            <h5 className="font-bold text-[13px] text-[#1c3a1c] group-hover:text-[#2d5a27] leading-tight line-clamp-2">{meal?.name || "Pending Selection"}</h5>
                            <button 
                                onClick={() => setViewingDetails(meal)}
                                className="w-full py-1.5 border border-[#ddd8ce] rounded-lg text-[8px] font-bold uppercase tracking-widest hover:bg-[#1c3a1c] hover:text-white transition-all flex items-center justify-center gap-2"
                            >
                                <Eye size={10} /> Details
                            </button>
                          </div>
                          <button 
                            onClick={() => setSwappingMeal({ type: mealType })}
                            className="mt-2 w-full py-2 bg-[#f5faf4] border border-[#ddd8ce] text-[#2d5a27] rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-[#8ecb84] hover:text-white hover:border-[#2d5a27] transition-all flex items-center justify-center gap-2"
                          >
                            <RefreshCw size={10} /> Add New
                          </button>
                        </div>
                      )
                    })}
                  </div>
                  
                  <div className="pt-4 mt-auto border-t border-[#f0f4ef] text-center">
                    <p className="text-[9px] font-bold text-[#5a7054] uppercase tracking-widest">Daily Target: {weeklyPlan[days[activeDayIdx]].dailyTotal} kcal</p>
                  </div>
                </motion.div>

                {/* Day Mini Cards (Preserved) */}
                {days.map((day, idx) => {
                  if (idx === activeDayIdx) return null; 
                  return (
                    <motion.div 
                      key={day} 
                      onClick={() => !swappingMeal && !viewingDetails && setActiveDayIdx(idx)}
                      whileHover={swappingMeal || viewingDetails ? {} : { scale: 1.05, y: -5, borderColor: '#2d5a27', boxShadow: "0 15px 30px -10px rgba(0,0,0,0.1)" }}
                      className={`bg-white rounded-2xl p-6 border border-[#ddd8ce] shadow-sm flex flex-col justify-center transition-all group relative overflow-hidden ${swappingMeal || viewingDetails ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      <div className="absolute top-0 left-0 w-1 h-full bg-[#f5faf4] group-hover:bg-[#2d5a27] transition-all" />
                      <span className="text-[8px] font-black text-[#6a9966] uppercase tracking-[0.2em] mb-2">Day 0{idx + 1}</span>
                      <h4 className="font-serif italic text-xl text-[#1c3a1c] mb-1 group-hover:translate-x-1 transition-transform">{day}</h4>
                      <p className="text-[9px] opacity-40 font-bold uppercase tracking-tighter">{weeklyPlan[day]?.dailyTotal} kcal</p>
                    </motion.div>
                  )
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #ddd8ce; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #6a9966; }
      `}} />
    </div>
  );
};

export default GenerateWeekly;