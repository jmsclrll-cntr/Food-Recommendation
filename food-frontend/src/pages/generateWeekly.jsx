import { useEffect, useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle, Loader2, Save, ArrowLeft, Info, X, Eye, Trash2, Sun, Moon,
  Plus, RefreshCw, Search, Activity, Zap, AlertCircle
} from 'lucide-react';
import { useDarkMode } from '../hooks/useDarkMode';
import { DAYS } from '../utils/constants';

const GenerateWeekly = () => {
  const navigate = useNavigate();
  const [darkMode, toggleDarkMode] = useDarkMode();

  // --- NEUBRUTALIST THEME CONSTANTS ---
  const panelBg = darkMode ? 'bg-[#2b1d4d]' : 'bg-[#fff7e8]';
  const cardBg = darkMode ? 'bg-[#3d2969]' : 'bg-white';
  const textMain = darkMode ? 'text-white' : 'text-[#2d1b4e]';
  const textSub = darkMode ? 'text-purple-200' : 'text-[#5c4b7f]';
  const border = 'border-[4px] border-black';
  const shadow = 'shadow-[8px_8px_0px_#000]';
  const accentYellow = 'bg-[#ffcf5a]';

  // --- LOGIC & STATE ---
  const [user] = useState(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });

  const [loading, setLoading] = useState(true); 
  const [isSyncing, setIsSyncing] = useState(false); 
  const [isSubmitted, setIsSubmitted] = useState(false); 
  const [isSaving, setIsSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [activeDayIdx, setActiveDayIdx] = useState(0); 
  const [bmiStatus, setBmiStatus] = useState("");
  const [suggestion, setSuggestion] = useState("");
  const [weeklyPlan, setWeeklyPlan] = useState(null);
  const [dailyTarget, setDailyTarget] = useState(0);
  const [swappingMeal, setSwappingMeal] = useState(null); 
  const [dbAlternatives, setDbAlternatives] = useState([]);
  const [viewingDetails, setViewingDetails] = useState(null);
  const [isAddingTo, setIsAddingTo] = useState(null); 
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAllergies, setSelectedAllergies] = useState([]);
  const [allergySearch, setAllergySearch] = useState("");
  const [matchingIngredients, setMatchingIngredients] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const allergyContainerRef = useRef(null);

  const [formData, setFormData] = useState({
    gender: '', height: '', weight: '', age: '', goal: '', conditions: [], activity: ''
  });

  const DYNAMIC_DAYS = useMemo(() => {
    const todayIndex = new Date().getDay();
    const jsDay = todayIndex === 0 ? 6 : todayIndex - 1;
    return [...DAYS.slice(jsDay), ...DAYS.slice(0, jsDay)];
  }, []);

  const filteredAlternatives = useMemo(() => {
    if (!searchQuery) return dbAlternatives;
    return dbAlternatives.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [dbAlternatives, searchQuery]);

  // --- BIOMETRIC MATH ---
  const bmi = useMemo(() => {
    if (formData.height > 0 && formData.weight > 0) {
      const h = formData.height / 100;
      return (formData.weight / (h * h)).toFixed(1);
    }
    return 0;
  }, [formData.height, formData.weight]);

  const calculatedBmr = useMemo(() => {
    const w = parseFloat(formData.weight);
    const h = parseFloat(formData.height);
    const a = parseFloat(formData.age);
    if (isNaN(w) || isNaN(h) || isNaN(a) || w <= 0 || h <= 0 || a <= 0) return 0;
    let val = (10 * w) + (6.25 * h) - (5 * a);
    if (formData.gender?.toLowerCase() === 'male') val += 5; else val -= 161;
    return Math.round(val);
  }, [formData.weight, formData.height, formData.age, formData.gender]);

  const calculatedTdee = useMemo(() => {
    if (calculatedBmr <= 0) return 0;
    const ACTIVITY_FACTORS = {
      sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, very_active: 1.9
    };
    const factor = ACTIVITY_FACTORS[formData.activity?.toLowerCase()] || 1.3;
    return Math.round(calculatedBmr * factor);
  }, [calculatedBmr, formData.activity]);

  const generateInsight = () => {
    if (!suggestion) return "Input metrics to sync model prediction.";
    const actMap = { sedentary: "sedentary", light: "lightly active", moderate: "moderately active", active: "very active", very_active: "super active" };
    const act = actMap[formData.activity] || "active";
    return `Your baseline metabolic rate (BMR) is ${calculatedBmr} kcal. Based on your ${act} lifestyle, you burn roughly ${calculatedTdee} kcal daily. To achieve your ${suggestion.toUpperCase()} goal, your plan is adjusted. Your BMI of ${bmi} indicates a ${bmiStatus} category. Exclusions: ${selectedAllergies.length > 0 ? selectedAllergies.join(', ') : 'None'}.`;
  };

  const parseIngredients = (ing) => {
    if (!ing) return [];
    if (Array.isArray(ing)) return ing;
    if (typeof ing === 'string') {
      if (ing.startsWith('[') && ing.endsWith(']')) {
        try { return JSON.parse(ing); } catch (e) { return ing.split(',').map(x => x.trim()); }
      }
      return ing.split(',').map(x => x.trim());
    }
    return [];
  };

  // --- EFFECTS ---
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (allergyContainerRef.current && !allergyContainerRef.current.contains(e.target)) setShowDropdown(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (allergySearch) {
        axios.get(`http://localhost:5000/api/recommendations/search-ingredients?q=${allergySearch}`)
          .then(res => setMatchingIngredients(res.data));
      }
    }, 150);
    return () => clearTimeout(delayDebounce);
  }, [allergySearch]);

  useEffect(() => {
    if (!user) navigate('/');
    else setLoading(false); 
  }, [navigate, user]);

  useEffect(() => {
    if (bmi > 0 && formData.gender) {
      axios.get(`http://localhost:5000/api/recommendations/suggest?gender=${formData.gender}&bmi=${bmi}`)
        .then(res => {
          let recGoal = res.data.goal?.toLowerCase() || 'maintain';
          setSuggestion(recGoal);
          setBmiStatus(res.data.category);
          setFormData(prev => ({ ...prev, goal: prev.goal || recGoal }));
        });
    }
  }, [bmi, formData.gender]);

  // --- HANDLERS ---
  const toggleCondition = (cond) => {
    setFormData(prev => ({
      ...prev,
      conditions: prev.conditions.includes(cond) ? prev.conditions.filter(c => c !== cond) : [...prev.conditions, cond]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSyncing(true);
    try {
      const planRes = await axios.post('http://localhost:5000/api/recommendations/generate-plan', { 
        ...formData, allergies: selectedAllergies 
      });
      setWeeklyPlan(planRes.data.plan);
      setDailyTarget(planRes.data.dailyTarget);
      setIsSubmitted(true);
    } catch (err) { alert("Generation error."); }
    finally { setIsSyncing(false); }
  };

  const handleSave = async () => {
    try {
      const userId = user.uid || user.id || user._id;
      setIsSaving(true);
      await axios.post('http://localhost:5000/api/diets/save-weekly', { userId, plan: weeklyPlan });
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2000);
    } catch (err) { alert("Save error."); }
    finally { setIsSaving(false); }
  };

  const handleDeleteItem = (day, mealType, idx) => {
    const updatedPlan = { ...weeklyPlan };
    const removedItem = updatedPlan[day][mealType][idx];
    updatedPlan[day][mealType].splice(idx, 1);
    updatedPlan[day].dailyTotal -= (removedItem.calories || 0);
    setWeeklyPlan(updatedPlan);
  };

  const handleOpenSwap = async (item, day, mealType, idx) => {
    setSwappingMeal({ day, mealType, idx, original: item });
    setIsSyncing(true);
    try {
      const res = await axios.get(`http://localhost:5000/api/recommendations/alternatives?type=${mealType}&condition=${formData.conditions.join(',')}&allergies=${encodeURIComponent(JSON.stringify(selectedAllergies))}`);
      setDbAlternatives(res.data);
    } finally { setIsSyncing(false); }
  };

  const handleOpenAdd = async (day, mealType) => {
    setIsAddingTo({ day, mealType });
    setIsSyncing(true);
    try {
      const res = await axios.get(`http://localhost:5000/api/recommendations/alternatives?type=${mealType}&condition=${formData.conditions.join(',')}&allergies=${encodeURIComponent(JSON.stringify(selectedAllergies))}`);
      setDbAlternatives(res.data);
    } finally { setIsSyncing(false); }
  };

  const handleSelectFood = (food) => {
    const updatedPlan = { ...weeklyPlan };
    if (swappingMeal) {
      const { day, mealType, idx, original } = swappingMeal;
      updatedPlan[day][mealType][idx] = food;
      updatedPlan[day].dailyTotal = updatedPlan[day].dailyTotal - (original.calories || 0) + (food.calories || 0);
      setSwappingMeal(null);
    } else if (isAddingTo) {
      const { day, mealType } = isAddingTo;
      updatedPlan[day][mealType].push(food);
      updatedPlan[day].dailyTotal += (food.calories || 0);
      setIsAddingTo(null);
    }
    setWeeklyPlan(updatedPlan);
    setDbAlternatives([]);
    setSearchQuery("");
  };

  if (loading) return <div className={`h-screen flex items-center justify-center ${panelBg} font-black text-2xl`}>BOOTING...</div>;

  return (
    <div className={`h-screen w-full p-4 md:p-6 overflow-hidden relative flex flex-col transition-all duration-500`}
      style={{ background: darkMode ? 'linear-gradient(135deg,#1d1436,#241744,#301c56)' : 'linear-gradient(135deg,#ffe9b3,#ffd86b,#ffb347)' }}>
      
      {/* HEADER */}
      <header className="flex items-center justify-between mb-4 relative z-50">
        <div className="flex items-center gap-6">
          <button onClick={() => navigate('/dashboard')} className={`px-5 py-2 bg-black text-white ${border} shadow-[4px_4px_0px_#ffcf5a] text-[10px] font-black uppercase hover:translate-x-[2px] hover:shadow-none transition-all`}>
              <ArrowLeft size={14} className="inline mr-2" /> HUB
          </button>
          <div className="text-left hidden sm:block">
            <h2 className={`text-2xl font-black ${textMain}`}>NutriFind</h2>
            <p className="text-[9px] font-black uppercase text-[#ffcf5a] drop-shadow-[1px_1px_0px_#000]">Biometric Generator</p>
          </div>
        </div>
        <button onClick={toggleDarkMode} className={`w-11 h-11 rounded-full ${border} shadow-[4px_4px_0px_#000] flex items-center justify-center transition-all ${darkMode ? 'bg-[#ffcf5a] text-black' : 'bg-[#2b1d4d] text-white'}`}>
          {darkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </header>

      <div className={`grid flex-1 min-h-0 gap-8 ${isSubmitted ? 'grid-cols-12' : 'grid-cols-1 overflow-y-auto custom-scrollbar'}`}>
        
        {/* SIDEBAR: INPUT PANEL */}
        <motion.div layout className={`${isSubmitted ? 'col-span-4 lg:col-span-3 overflow-y-auto custom-scrollbar pr-2' : 'max-w-2xl mx-auto w-full'} flex flex-col gap-6`}>
            {!isSubmitted ? (
              <div className={`${cardBg} ${border} ${shadow} p-8 rounded-[30px]`}>
                <h3 className={`text-3xl font-black uppercase mb-6 ${textMain}`}>Biometrics</h3>
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className={`text-[10px] font-black uppercase ${textSub}`}>Gender</label>
                      <select value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})} className="w-full h-12 px-4 border-[3px] border-black rounded-xl font-bold bg-white text-black outline-none" required>
                        <option value="" disabled>Select</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className={`text-[10px] font-black uppercase ${textSub}`}>Age</label>
                      <input type="number" value={formData.age} onChange={e => setFormData({...formData, age: e.target.value})} className="w-full h-12 px-4 border-[3px] border-black rounded-xl font-bold bg-white text-black" required />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className={`text-[10px] font-black uppercase ${textSub}`}>Height (cm)</label>
                      <input type="number" value={formData.height} onChange={e => setFormData({...formData, height: e.target.value})} className="w-full h-12 px-4 border-[3px] border-black rounded-xl font-bold bg-white text-black" required />
                    </div>
                    <div className="space-y-1">
                      <label className={`text-[10px] font-black uppercase ${textSub}`}>Weight (kg)</label>
                      <input type="number" value={formData.weight} onChange={e => setFormData({...formData, weight: e.target.value})} className="w-full h-12 px-4 border-[3px] border-black rounded-xl font-bold bg-white text-black" required />
                    </div>
                  </div>

                  {/* ACTIVITY LEVEL - SYNCED TO GOAL STYLE */}
                  <div className="space-y-1">
                    <label className={`text-[10px] font-black uppercase ${textSub}`}>Activity Level</label>
                    <select value={formData.activity} onChange={e => setFormData({...formData, activity: e.target.value})} className={`${accentYellow} w-full h-14 border-[4px] border-black rounded-xl font-black text-black shadow-[4px_4px_0px_#000] outline-none cursor-pointer`} required>
                      <option value="" disabled>Select Intensity</option>
                      <option value="sedentary">Sedentary (No Exercise)</option>
                      <option value="light">Lightly Active (1-3 days/wk)</option>
                      <option value="moderate">Moderately Active (3-5 days/wk)</option>
                      <option value="active">Very Active (6-7 days/wk)</option>
                      <option value="very_active">Athlete (Xtreme Exercise)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className={`text-[10px] font-black uppercase ${textSub}`}>Goal</label>
                    <select value={formData.goal} onChange={e => setFormData({...formData, goal: e.target.value})} className={`${accentYellow} w-full h-14 border-[4px] border-black rounded-xl font-black text-black shadow-[4px_4px_0px_#000] outline-none cursor-pointer`}>
                      <option value="lose">Weight Loss {suggestion === 'lose' && '★'}</option>
                      <option value="gain">Weight Gain {suggestion === 'gain' && '★'}</option>
                      <option value="maintain">Maintenance {suggestion === 'maintain' && '★'}</option>
                    </select>
                  </div>

                  {/* Conditions & Allergies kept from source */}
                  <div className="space-y-2">
                    <label className={`text-[10px] font-black uppercase ${textSub}`}>Conditions</label>
                    <div className="flex flex-wrap gap-2">
                      {['Diabetes', 'Hypertension', 'Heart Disease'].map(c => (
                        <div key={c} onClick={() => toggleCondition(c.toLowerCase())} className={`px-3 py-1.5 border-[2px] border-black rounded-lg text-[9px] font-black uppercase cursor-pointer transition-all ${formData.conditions.includes(c.toLowerCase()) ? 'bg-black text-white' : 'bg-white shadow-[3px_3px_0px_#000]'}`}>{c}</div>
                      ))}
                    </div>
                  </div>

                  <div ref={allergyContainerRef} className="space-y-2 relative">
                    <label className={`text-[10px] font-black uppercase ${textSub}`}>Exclude Ingredients</label>
                    <div className="relative">
                      <input type="text" placeholder="Search allergens..." value={allergySearch} onChange={e => {setAllergySearch(e.target.value); setShowDropdown(true);}} onFocus={() => setShowDropdown(true)} className="w-full h-12 pl-10 border-[3px] border-black rounded-xl font-bold text-black outline-none shadow-[4px_4px_0px_#000]" />
                      <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 opacity-50" />
                      {showDropdown && matchingIngredients.length > 0 && (
                        <div className="absolute left-0 right-0 top-full mt-2 bg-white border-[3px] border-black p-4 rounded-xl shadow-[8px_8px_0px_#000] z-[100] max-h-48 overflow-y-auto custom-scrollbar">
                          {matchingIngredients.map(ing => (
                            <label key={ing} className="flex items-center gap-3 p-2 hover:bg-[#ffcf5a]/20 cursor-pointer rounded-lg">
                              <input type="checkbox" checked={selectedAllergies.includes(ing)} onChange={() => setSelectedAllergies(p => p.includes(ing) ? p.filter(x => x !== ing) : [...p, ing])} className="w-4 h-4 border-2 border-black" />
                              <span className="text-xs font-black text-black">{ing}</span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                        {selectedAllergies.map(a => (
                            <span key={a} onClick={() => setSelectedAllergies(p => p.filter(x => x !== a))} className="text-[8px] font-black bg-black text-white px-2 py-0.5 rounded cursor-pointer hover:bg-red-500 flex items-center gap-1 uppercase">
                                {a} <X size={8} />
                            </span>
                        ))}
                    </div>
                  </div>

                  <button type="submit" className="w-full h-14 bg-black text-white font-black uppercase border-[4px] border-black shadow-[6px_6px_0px_#ffcf5a] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none flex items-center justify-center gap-2">
                    {isSyncing ? <Loader2 className="animate-spin" /> : "GENERATE PROTOCOL →"}
                  </button>
                </form>
              </div>
            ) : (
              <div className={`${cardBg} ${border} ${shadow} p-6 rounded-[25px]`}>
                <h4 className={`text-xl font-black mb-4 text-center ${textMain} uppercase`}>Profile</h4>
                <div className="space-y-2 mb-6">
                  {Object.entries({ Gender: formData.gender, Age: formData.age, BMI: bmi, Goal: formData.goal }).map(([k,v]) => (
                    <div key={k} className="flex justify-between border-b-[2px] border-black/10 pb-1">
                      <span className="text-[9px] font-black uppercase opacity-60">{k}</span>
                      <span className="text-sm font-black capitalize">{v}</span>
                    </div>
                  ))}
                </div>
                <div className="flex gap-4">
                  <button onClick={() => setIsSubmitted(false)} className="flex-1 py-3 bg-white border-[3px] border-black font-black text-[9px] uppercase shadow-[4px_4px_0px_#000]">Edit Inputs</button>
                  <button onClick={handleSave} className={`${accentYellow} flex-1 py-3 border-[3px] border-black font-black text-[9px] uppercase shadow-[4px_4px_0px_#000]`}>{isSaving ? 'Saving...' : 'Save Plan'}</button>
                </div>
              </div>
            )}

            {/* METABOLIC CARDS: Wrapped to ensure they fit sidebar height */}
            <div className="flex flex-col gap-4 pb-4">
                <div className={`p-4 ${accentYellow} ${border} ${shadow} rounded-[20px] text-center min-h-fit`}>
                    <p className="text-[9px] font-black uppercase mb-1">Calculated BMI</p>
                    <h3 className="text-4xl font-black text-black">{bmi || "—"}</h3>
                    <span className="text-[10px] font-black bg-black text-white px-3 py-1 rounded-full uppercase tracking-tighter">{bmiStatus || "Ready"}</span>
                </div>

                <div className={`p-4 bg-black text-white ${border} ${shadow} rounded-[20px] min-h-fit`}>
                    <p className="text-[9px] font-black uppercase text-center mb-3 opacity-50 tracking-widest">Daily Metabolism</p>
                    <div className="flex justify-between items-center px-4">
                        <div className="text-center">
                            <p className="text-xl font-black italic">{calculatedBmr || "—"}</p>
                            <p className="text-[7px] font-black uppercase opacity-60">BMR (Base)</p>
                        </div>
                        <div className="w-[2px] h-8 bg-white/20" />
                        <div className="text-center">
                            <p className="text-xl font-black italic">{calculatedTdee || "—"}</p>
                            <p className="text-[7px] font-black uppercase opacity-60">TDEE (Active)</p>
                        </div>
                    </div>
                </div>

                <div className={`p-5 bg-white ${border} ${shadow} rounded-[20px] min-h-fit`}>
                    <div className="flex items-center gap-2 mb-2"><Info size={14} /><span className="text-[10px] font-black uppercase">AI Insight</span></div>
                    <p className="text-[11px] font-bold leading-relaxed italic">{generateInsight()}</p>
                </div>
            </div>
        </motion.div>

        {/* RESULTS PANEL */}
        {isSubmitted && weeklyPlan && (
          <div className="col-span-12 lg:col-span-9 flex flex-col gap-4 min-h-0">
            <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar shrink-0">
              {DYNAMIC_DAYS.map((day, idx) => (
                <button key={day} onClick={() => setActiveDayIdx(idx)} className={`min-w-[90px] py-3 border-[3px] border-black font-black uppercase text-[10px] transition-all ${activeDayIdx === idx ? 'bg-[#ffcf5a] translate-y-1 shadow-none' : 'bg-white shadow-[4px_4px_0px_#000]'}`}>{day.substring(0, 3)}</button>
              ))}
            </div>

            <div className={`${cardBg} ${border} ${shadow} p-6 rounded-[35px] flex-1 flex flex-col min-h-0`}>
                <div className="flex justify-between items-center mb-6 border-b-[4px] border-black pb-4 shrink-0">
                    <h2 className={`text-2xl font-black uppercase ${textMain}`}>{DYNAMIC_DAYS[activeDayIdx]} Schedule</h2>
                    <div className="flex gap-6 text-right">
                        <div>
                          <p className="text-[9px] font-black uppercase opacity-50">Intake</p>
                          <p className="text-xl font-black">{weeklyPlan[DYNAMIC_DAYS[activeDayIdx]].dailyTotal} KCAL</p>
                        </div>
                        <div className="pl-6 border-l-[3px] border-black">
                          <p className="text-[9px] font-black uppercase opacity-50">Daily Goal</p>
                          <p className="text-xl font-black text-black/40">{dailyTarget || calculatedTdee} KCAL</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1 overflow-y-auto custom-scrollbar pr-2 pb-2">
                    {['breakfast', 'lunch', 'dinner'].map(m => (
                        <div key={m} className="bg-gray-100/50 border-[3px] border-black rounded-[25px] p-4 flex flex-col h-full min-h-[400px]">
                            <h5 className="text-center font-black uppercase mb-4 text-[10px] bg-black text-white py-1.5 tracking-widest shrink-0">{m}</h5>
                            <div className="space-y-4 flex-1 overflow-y-auto custom-scrollbar pr-1">
                                {weeklyPlan[DYNAMIC_DAYS[activeDayIdx]][m].map((item, idx) => (
                                    <div key={idx} className="bg-white border-[3px] border-black p-4 rounded-xl shadow-[4px_4px_0px_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all">
                                        <p className="font-black text-[11px] leading-tight mb-2 uppercase text-black line-clamp-2">{item.name}</p>
                                        <div className="flex justify-between mb-4">
                                            <span className="text-[9px] font-black bg-[#ffcf5a] px-2 py-0.5 border-2 border-black">{item.calories} kcal</span>
                                            <span className="text-[9px] font-black bg-gray-200 px-2 py-0.5 border-2 border-black">{item.grams}g</span>
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => setViewingDetails(item)} title="Details" className="flex-1 p-2 border-[2px] border-black bg-white hover:bg-[#ffcf5a] shadow-[2px_2px_0px_#000]"><Eye size={14} className="mx-auto" /></button>
                                            <button onClick={() => handleOpenSwap(item, DYNAMIC_DAYS[activeDayIdx], m, idx)} title="Swap" className="flex-1 p-2 border-[2px] border-black bg-white hover:bg-[#ffcf5a] shadow-[2px_2px_0px_#000]"><RefreshCw size={14} className="mx-auto" /></button>
                                            <button onClick={() => handleDeleteItem(DYNAMIC_DAYS[activeDayIdx], m, idx)} title="Delete" className="flex-1 p-2 border-[2px] border-black bg-red-100 text-red-600 shadow-[2px_2px_0px_#000]"><Trash2 size={14} className="mx-auto" /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <button onClick={() => handleOpenAdd(DYNAMIC_DAYS[activeDayIdx], m)} className="mt-4 py-3 bg-white border-[3px] border-black font-black uppercase text-[10px] shadow-[4px_4px_0px_#000] hover:translate-x-[2px] active:translate-y-[2px] transition-all shrink-0">+ Add Meal</button>
                        </div>
                    ))}
                </div>
            </div>
          </div>
        )}
      </div>

      {/* MODAL: MEAL DETAILS */}
      <AnimatePresence>
        {viewingDetails && (
          <div className="fixed inset-0 z-[200] bg-black/80 flex items-center justify-center p-4" onClick={() => setViewingDetails(null)}>
            <motion.div initial={{ scale: 0.8, rotate: -1 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0.8 }} className="bg-white border-[5px] border-black shadow-[15px_15px_0px_#ffcf5a] p-8 rounded-[40px] max-w-lg w-full relative" onClick={e => e.stopPropagation()}>
              <button onClick={() => setViewingDetails(null)} className="absolute top-4 right-4 bg-black text-white p-2 border-[3px] border-black hover:rotate-90 transition-transform"><X size={20} /></button>
              <h3 className="text-3xl font-black uppercase mb-6 pr-8">{viewingDetails.name}</h3>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-[#ffcf5a] border-[4px] border-black p-4 font-black text-center shadow-[5px_5px_0px_#000]">
                    <p className="text-[10px] uppercase opacity-50">Energy</p>
                    <p className="text-2xl">{viewingDetails.calories} kcal</p>
                </div>
                <div className="bg-black text-white border-[4px] border-black p-4 font-black text-center shadow-[5px_5px_0px_#000]">
                    <p className="text-[10px] uppercase opacity-50">Weight</p>
                    <p className="text-2xl">{viewingDetails.grams}g</p>
                </div>
              </div>
              <div className="border-t-[3px] border-black pt-4">
                <p className="text-[11px] font-black uppercase mb-3 flex items-center gap-2"><Activity size={14} /> Nutrition Data</p>
                <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto custom-scrollbar pr-2">
                    {parseIngredients(viewingDetails.ingredients).map((ing, i) => (
                        <span key={i} className="px-3 py-1.5 bg-white border-[2px] border-black text-[10px] font-black rounded-lg shadow-[3px_3px_0px_#000] uppercase">
                            {ing}
                        </span>
                    ))}
                </div>
              </div>
              <button onClick={() => setViewingDetails(null)} className="w-full mt-8 py-4 bg-black text-white font-black uppercase border-[4px] border-black shadow-[5px_5px_0px_#ffcf5a] active:translate-x-[2px] transition-all">Close Analysis</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: SWAP & SEARCH */}
      <AnimatePresence>
        {(swappingMeal || isAddingTo) && (
          <div className="fixed inset-0 z-[200] bg-black/80 flex items-center justify-center p-4">
            <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }} className="bg-white border-[5px] border-black shadow-[20px_20px_0px_#ffcf5a] p-6 md:p-10 rounded-[40px] max-w-5xl w-full h-[85vh] flex flex-col relative" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-6 border-b-[5px] border-black pb-4 shrink-0">
                <h2 className="text-2xl font-black uppercase tracking-tighter">
                    {swappingMeal ? `Swap: ${swappingMeal.original.name}` : `Options for ${isAddingTo.mealType}`}
                </h2>
                <button onClick={() => { setSwappingMeal(null); setIsAddingTo(null); setDbAlternatives([]); }} className="p-3 border-[3px] border-black bg-black text-white shadow-[4px_4px_0px_#ffcf5a]"><X size={24} /></button>
              </div>

              <div className="mb-8 relative shrink-0">
                <input type="text" placeholder="Search database..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full h-16 pl-14 border-[4px] border-black rounded-2xl font-black text-lg shadow-[6px_6px_0px_#000] outline-none" />
                <Search size={28} className="absolute left-5 top-1/2 -translate-y-1/2" />
              </div>
              
              <div className="flex-1 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pr-4 custom-scrollbar">
                {isSyncing ? (
                    <div className="col-span-full flex flex-col items-center justify-center py-20">
                        <Zap size={60} className="animate-bounce mb-4 text-[#ffcf5a]" />
                        <p className="font-black uppercase tracking-widest text-xl opacity-50">Searching Database...</p>
                    </div>
                ) : filteredAlternatives.map((alt) => (
                  <div key={alt._id || alt.name} onClick={() => handleSelectFood(alt)} className="bg-white border-[3px] border-black p-4 rounded-2xl shadow-[8px_8px_0px_#000] cursor-pointer hover:translate-x-[-4px] hover:translate-y-[-4px] hover:shadow-[12px_12px_0px_#000] transition-all group">
                    <div className="h-32 rounded-xl border-[2px] border-black overflow-hidden mb-3">
                      <img src={alt.imageUrl || alt.imageURL || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=1000'} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="food" />
                    </div>
                    <h4 className="font-black text-sm text-black uppercase truncate mb-1">{alt.name}</h4>
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-[10px] font-black uppercase opacity-40">{alt.calories} KCAL</span>
                        <span className="text-[10px] font-black uppercase opacity-40">{alt.grams}G</span>
                    </div>
                    <div className="w-full py-2.5 bg-black text-white text-center font-black uppercase text-[10px] border-[2px] border-black group-hover:bg-[#ffcf5a] group-hover:text-black">Select Meal</div>
                  </div>
                ))}
                {filteredAlternatives.length === 0 && !isSyncing && (
                  <div className="col-span-full py-20 text-center">
                    <AlertCircle size={48} className="mx-auto mb-4 opacity-20" />
                    <p className="font-black uppercase text-2xl opacity-10">No Matches Found</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* TOAST NOTIFICATION */}
      <AnimatePresence>
        {showToast && (
            <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }} className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[300] bg-[#ffcf5a] border-[4px] border-black px-8 py-4 rounded-2xl shadow-[10px_10px_0px_#000] flex items-center gap-4">
                <CheckCircle className="text-black" size={24} />
                <span className="font-black uppercase tracking-widest text-sm text-black">Protocol Locked & Saved</span>
            </motion.div>
        )}
      </AnimatePresence>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 10px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: black; border-radius: 20px; border: 3px solid ${darkMode ? '#2b1d4d' : '#fff7e8'}; }
        .custom-scrollbar { scrollbar-width: thin; scrollbar-color: black transparent; }
        
        input:focus, select:focus { 
          outline: none; 
          border-color: black; 
          background-color: ${darkMode ? '#4d348a' : '#fff9eb'} !important; 
          transform: translate(-2px, -2px);
          box-shadow: 6px 6px 0px #000;
        }
        
        .line-clamp-2 { 
          display: -webkit-box; 
          -webkit-line-clamp: 2; 
          -webkit-box-orient: vertical; 
          overflow: hidden; 
        }

        /* Prevent background scrolling when modal is open */
        body {
          overflow: hidden;
        }
      ` }} />
    </div>
  );
};

export default GenerateWeekly;