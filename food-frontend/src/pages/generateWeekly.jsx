import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle, 
  Loader2, 
  Save, 
  ArrowLeft, 
  Info, 
  RefreshCw, 
  X, 
  Eye 
} from 'lucide-react';

const GenerateWeekly = () => {
  const navigate = useNavigate();

  // --- 1. CORE STATE MANAGEMENT ---
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

  // --- 2. INTERACTION STATES (Modals & Selection) ---
  const [swappingMeal, setSwappingMeal] = useState(null); // Stores { type: 'breakfast' | 'lunch' | 'dinner' }
  const [viewingDetails, setViewingDetails] = useState(null); // Stores the full meal object for the detail modal

  // Form Data (Connected to your Database Schema)
  const [formData, setFormData] = useState({
    gender: 'male', 
    height: '', 
    weight: '', 
    age: 25, 
    goal: 'maintain', 
    condition: 'none'
  });

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  // Static alternatives list (Used when user clicks 'Add New' or 'Pick Alternative')
  const alternativesList = [
    { name: "Avocado & Egg Sourdough", calories: 340, protein: 12, grams: 250, sodium: 400, sugar: 4, saturatedFat: 3, type: "Breakfast", imageUrl: "https://images.unsplash.com/photo-1525351484163-7529414344d8?q=80&w=400" },
    { name: "Blueberry Protein Oatmeal", calories: 290, protein: 20, grams: 300, sodium: 150, sugar: 8, saturatedFat: 1, type: "Breakfast", imageUrl: "https://images.unsplash.com/photo-1517673132405-a56a62b18caf?q=80&w=400" },
    { name: "Grilled Salmon Salad", calories: 480, protein: 35, grams: 400, sodium: 600, sugar: 2, saturatedFat: 4, type: "Lunch", imageUrl: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?q=80&w=400" },
    { name: "Quinoa Veggie Stir-fry", calories: 410, protein: 15, grams: 350, sodium: 550, sugar: 5, saturatedFat: 1, type: "Dinner", imageUrl: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=400" }
  ];

  // --- 3. BUSINESS LOGIC ---

  // BMI Calculation (Real-time sync)
  const bmi = useMemo(() => {
    if (formData.height > 0 && formData.weight > 0) {
      const h = formData.height / 100;
      return (formData.weight / (h * h)).toFixed(1);
    }
    return 0;
  }, [formData.height, formData.weight]);

  // Auth Protection
  useEffect(() => {
    if (!user) { navigate('/'); return; }
    setLoading(false); 
  }, [navigate, user]);

  // AI Suggestion Sync (Preserved from original code)
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

  // Submit Handler (POST/PUT + Plan Generation)
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

  // Swap Meal logic
  const swapMeal = (newMeal) => {
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
      
      {/* SYNCING / LOADING OVERLAY */}
      <AnimatePresence>
        {isSyncing && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-[#f5faf4]/70 backdrop-blur-md flex items-center justify-center"
          >
            <div className="text-center">
                <Loader2 className="w-12 h-12 animate-spin text-[#2d5a27] mx-auto mb-4" />
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#2d5a27]">Processing Biometrics & Planning...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className={`grid h-full transition-all duration-1000 ease-in-out ${isSubmitted ? 'grid-cols-12 gap-10' : 'grid-cols-1'}`}>
        
        {/* --- LEFT COLUMN: BIOMETRIC SIDEBAR (EXACT IMAGE UI) --- */}
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
            {/* The Main Form Box */}
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

        {/* --- RIGHT COLUMN: WEEKLY GRID & MODALS --- */}
        <AnimatePresence>
          {isSubmitted && weeklyPlan && (
            <motion.div initial={{ opacity: 0, x: 100 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}
              className="col-span-8 h-full pt-[104px]"
            >
              <div className="grid grid-cols-4 grid-rows-2 gap-4 h-[calc(100%-140px)]">
                
                {/* 1. ACTIVE DAY DETAIL PANEL */}
                <motion.div layout key={days[activeDayIdx]} className="col-span-1 row-span-2 bg-white rounded-2xl p-8 border-2 border-[#2d5a27] shadow-xl flex flex-col overflow-hidden relative">
                  
                  {/* --- NUTRITION INFO MODAL (DARK GREEN - THEMED) --- */}
                  <AnimatePresence>
                    {viewingDetails && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
                            className="absolute inset-0 z-[70] bg-[#1c3a1c] text-white p-8 flex flex-col overflow-y-auto custom-scrollbar"
                        >
                            <div className="flex justify-between items-center mb-8">
                                <h5 className="font-serif italic text-2xl text-[#e8f4e5]">Nutrition Info</h5>
                                <button onClick={() => setViewingDetails(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={24} /></button>
                            </div>

                            {/* PICTURE DISPLAY AREA (WITH THEMED PLACEHOLDER) */}
                            <div className="w-full h-44 rounded-2xl overflow-hidden mb-6 shadow-lg bg-black/20 border border-white/5 flex items-center justify-center">
                                {viewingDetails.imageUrl ? (
                                    <img src={viewingDetails.imageUrl} alt="Meal" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="flex flex-col items-center gap-2 opacity-20">
                                        <div className="w-12 h-12 rounded-full border-2 border-dashed border-white/30 flex items-center justify-center">
                                            <Eye size={20} />
                                        </div>
                                        <span className="text-[9px] font-black uppercase tracking-[0.4em]">Visual Pending</span>
                                    </div>
                                )}
                            </div>

                            {/* BIG FONT FOOD NAME & TYPE */}
                            <div className="mb-10">
                                <h2 className="text-4xl font-bold text-[#8ecb84] leading-tight font-sans italic">
                                    {viewingDetails.name}
                                </h2>
                                <p className="text-[#6a9966] text-[10px] font-black uppercase tracking-[0.3em] mt-2">
                                    TYPE: {viewingDetails.type || viewingDetails.slotType || "Main Dish"}
                                </p>
                            </div>

                            {/* CALORIES & PROTEIN BOXES */}
                            <div className="grid grid-cols-2 gap-4 mb-8">
                                <div className="bg-white/5 border border-white/10 p-5 rounded-2xl text-center">
                                    <p className="text-[10px] font-bold uppercase text-[#6a9966] mb-1 tracking-widest">Calories</p>
                                    <p className="text-2xl font-bold">{viewingDetails.calories} <span className="text-sm font-normal opacity-50">kcal</span></p>
                                </div>
                                <div className="bg-white/5 border border-white/10 p-5 rounded-2xl text-center">
                                    <p className="text-[10px] font-bold uppercase text-[#6a9966] mb-1 tracking-widest">Protein</p>
                                    <p className="text-2xl font-bold">{viewingDetails.protein} <span className="text-sm font-normal opacity-50">g</span></p>
                                </div>
                            </div>

                            {/* DATABASE CONTENTS BREAKDOWN */}
                            <div className="space-y-4 border-t border-white/10 pt-8 mb-10">
                                <div className="flex justify-between items-center px-2">
                                    <span className="text-[11px] font-bold uppercase tracking-widest opacity-40">Grams</span>
                                    <span className="font-mono font-bold text-[#8ecb84]">{viewingDetails.grams || "0"}g</span>
                                </div>
                                <div className="flex justify-between items-center px-2">
                                    <span className="text-[11px] font-bold uppercase tracking-widest opacity-40">Sodium</span>
                                    <span className="font-mono font-bold text-[#8ecb84]">{viewingDetails.sodium || "0"}mg</span>
                                </div>
                                <div className="flex justify-between items-center px-2">
                                    <span className="text-[11px] font-bold uppercase tracking-widest opacity-40">Sugar</span>
                                    <span className="font-mono font-bold text-[#8ecb84]">{viewingDetails.sugar || "0"}g</span>
                                </div>
                                <div className="flex justify-between items-center px-2">
                                    <span className="text-[11px] font-bold uppercase tracking-widest opacity-40">Saturated Fat</span>
                                    <span className="font-mono font-bold text-[#8ecb84]">{viewingDetails.saturatedFat || "0"}g</span>
                                </div>
                            </div>

                            {/* THE TASK: PICK ALTERNATIVE BUTTON */}
                            <button 
                                onClick={() => {
                                    setSwappingMeal({ type: viewingDetails.slotType });
                                    setViewingDetails(null);
                                }}
                                className="w-full py-4 bg-[#8ecb84] text-[#1c3a1c] rounded-xl font-bold uppercase tracking-widest hover:bg-white hover:scale-[1.02] transition-all shadow-lg flex items-center justify-center gap-3 mt-auto"
                            >
                                <RefreshCw size={16} /> Pick Alternative
                            </button>
                        </motion.div>
                    )}
                  </AnimatePresence>

                  {/* ALTERNATIVES LIST MODAL (Triggered by Swap) */}
                  <AnimatePresence>
                    {swappingMeal && (
                      <motion.div initial={{ y: 200, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 200, opacity: 0 }} 
                        className="absolute inset-0 z-[70] bg-white p-6 flex flex-col"
                      >
                        <div className="flex justify-between items-center mb-6">
                            <h5 className="text-[10px] font-black uppercase text-[#2d5a27] tracking-widest">Swap {swappingMeal.type}</h5>
                            <button onClick={() => setSwappingMeal(null)} className="p-1 hover:bg-[#f5faf4] rounded-full transition-colors"><X size={18}/></button>
                        </div>
                        <div className="flex-1 space-y-3 overflow-y-auto custom-scrollbar pr-2">
                            {alternativesList.map((alt, i) => (
                                <button key={i} onClick={() => swapMeal(alt)} 
                                    className="w-full text-left p-4 rounded-xl border border-[#ddd8ce] hover:border-[#2d5a27] hover:bg-[#f5faf4] transition-all group"
                                >
                                    <p className="text-xs font-bold text-[#1c3a1c] mb-1 group-hover:text-[#2d5a27]">{alt.name}</p>
                                    <p className="text-[10px] opacity-40">{alt.calories} kcal | {alt.protein}g Protein</p>
                                </button>
                            ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Main Day Display Contents */}
                  <span className="text-[9px] font-black text-[#2d5a27] uppercase tracking-[0.3em] mb-4">{days[activeDayIdx]} Plan</span>
                  <h4 className="font-serif italic text-3xl mb-8 text-[#1c3a1c]">Daily Nutrients</h4>
                  
                  <div className="flex-1 flex flex-col gap-4 min-h-0">
                    {['breakfast', 'lunch', 'dinner'].map((mealType) => {
                      const meal = weeklyPlan[days[activeDayIdx]][mealType];
                      return (
                        <div key={mealType} className="flex-1 flex flex-col min-h-0">
                          <p className="text-[9px] font-bold uppercase text-[#6a9966] mb-1">{mealType}</p>
                          <div className="flex-1 min-h-0 bg-[#fbfdfa] rounded-xl border-2 border-[#f0f4ef] p-4 flex flex-col justify-between group hover:border-[#2d5a27] transition-all relative">
                            <h5 className="font-bold text-[13px] text-[#1c3a1c] line-clamp-2">{meal?.name || "Calculation in Progress"}</h5>
                            
                            {/* MEAL CARD BUTTONS */}
                            <div className="flex gap-2 mt-3">
                                <button 
                                    onClick={() => setViewingDetails({ ...meal, slotType: mealType })}
                                    className="flex-1 py-2 border border-[#ddd8ce] rounded-lg text-[8px] font-bold uppercase tracking-widest hover:bg-[#1c3a1c] hover:text-white transition-all flex items-center justify-center gap-1"
                                >
                                    <Eye size={10} /> Details
                                </button>
                                <button 
                                    onClick={() => setSwappingMeal({ type: mealType })}
                                    className="flex-1 py-2 bg-[#f5faf4] border border-[#ddd8ce] text-[#2d5a27] rounded-lg text-[8px] font-bold uppercase tracking-widest hover:bg-[#2d5a27] hover:text-white transition-all flex items-center justify-center gap-1"
                                >
                                    <RefreshCw size={10} /> Add New
                                </button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  
                  <div className="pt-4 mt-auto border-t border-[#f0f4ef] text-center">
                    <p className="text-[9px] font-bold text-[#5a7054] uppercase tracking-widest">Daily Energy: {weeklyPlan[days[activeDayIdx]].dailyTotal} kcal</p>
                  </div>
                </motion.div>

                {/* 2. DAY MINI CARDS (Interaction Locked when Modal Active) */}
                {days.map((day, idx) => {
                  if (idx === activeDayIdx) return null; 
                  return (
                    <motion.div 
                      key={day} 
                      onClick={() => !viewingDetails && !swappingMeal && setActiveDayIdx(idx)}
                      whileHover={viewingDetails || swappingMeal ? {} : { scale: 1.05, y: -5, borderColor: '#2d5a27', boxShadow: "0 15px 30px -10px rgba(0,0,0,0.05)" }}
                      className={`bg-white rounded-2xl p-6 border border-[#ddd8ce] shadow-sm flex flex-col justify-center transition-all group relative overflow-hidden ${viewingDetails || swappingMeal ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}`}
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

      {/* 4. CONFIRM & SAVE PLAN (FAB) */}
      <AnimatePresence>
        {isSubmitted && !viewingDetails && (
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

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #6a9966; }
      `}} />
    </div>
  );
};

export default GenerateWeekly;