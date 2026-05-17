import { useEffect, useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle, Loader2, Save, ArrowLeft, Info, X, Eye, Trash2, Sun, Moon,
  Plus, RefreshCw, Search
} from 'lucide-react';
import { useDarkMode } from '../hooks/useDarkMode';
import { getThemeStyles } from '../theme/styles';
import { DAYS } from '../utils/constants';

const GenerateWeekly = () => {
  const navigate = useNavigate();
  const [darkMode, toggleDarkMode] = useDarkMode();
  const styles = getThemeStyles(darkMode);
  const { bgMain, cardBg, border, textMain, textSub, optionStyles } = styles;

  const DYNAMIC_DAYS = useMemo(() => {
    const todayIndex = new Date().getDay();
    const jsDay = todayIndex === 0 ? 6 : todayIndex - 1;
    return [...DAYS.slice(jsDay), ...DAYS.slice(0, jsDay)];
  }, []);

  // --- ORIGINAL LOGIC & STATE ---
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
  const [dailyTarget, setDailyTarget] = useState(0);
  const [swappingMeal, setSwappingMeal] = useState(null); 
  const [dbAlternatives, setDbAlternatives] = useState([]);
  const [viewingDetails, setViewingDetails] = useState(null);
  const [isAddingTo, setIsAddingTo] = useState(null); // { day, type }
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAllergies, setSelectedAllergies] = useState([]);
  const [allergySearch, setAllergySearch] = useState("");
  const [matchingIngredients, setMatchingIngredients] = useState([]);
  const [allIngredients, setAllIngredients] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const allergyContainerRef = useRef(null);

  const [formData, setFormData] = useState({
    gender: 'male', height: '', weight: '', age: 25, goal: 'maintain', condition: 'none', activity: 'moderate'
  });

  // Logic: BMI Calculation
  const bmi = useMemo(() => {
    if (formData.height > 0 && formData.weight > 0) {
      const h = formData.height / 100;
      return (formData.weight / (h * h)).toFixed(1);
    }
    return 0;
  }, [formData.height, formData.weight]);

  // BMR & TDEE Calculations using Mifflin-St Jeor Equation
  const calculatedBmr = useMemo(() => {
    const w = parseFloat(formData.weight);
    const h = parseFloat(formData.height);
    const a = parseFloat(formData.age);
    if (isNaN(w) || isNaN(h) || isNaN(a) || w <= 0 || h <= 0 || a <= 0) return 0;

    let val = (10 * w) + (6.25 * h) - (5 * a);
    if (formData.gender?.toLowerCase() === 'male') {
      val += 5;
    } else {
      val -= 161;
    }
    return Math.round(val);
  }, [formData.weight, formData.height, formData.age, formData.gender]);

  const calculatedTdee = useMemo(() => {
    if (calculatedBmr <= 0) return 0;
    const ACTIVITY_FACTORS = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      very_active: 1.9
    };
    const factor = ACTIVITY_FACTORS[formData.activity?.toLowerCase()] || 1.3;
    return Math.round(calculatedBmr * factor);
  }, [calculatedBmr, formData.activity]);

  // Click-outside listener to hide ingredients dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (allergyContainerRef.current && !allergyContainerRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Preload unique ingredients on mount
  useEffect(() => {
    axios.get('http://localhost:5000/api/recommendations/ingredients')
      .then(res => {
        setAllIngredients(res.data);
        setMatchingIngredients(res.data.slice(0, 15));
      }).catch(err => console.error("Error preloading ingredients:", err));
  }, []);
 
  // Live allergy search via backend sequential search algorithm
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      axios.get(`http://localhost:5000/api/recommendations/search-ingredients?q=${allergySearch}`)
        .then(res => {
          setMatchingIngredients(res.data);
        }).catch(err => console.error("Allergy search error:", err));
    }, 150);
 
    return () => clearTimeout(delayDebounce);
  }, [allergySearch]);
 
  // Logic: Redirect if no user
  useEffect(() => {
    if (!user) { navigate('/'); return; }
    setLoading(false); 
  }, [navigate, user]);

  // Load user biometrics if they exist
  useEffect(() => {
    if (user) {
      const userId = user.id || user.uid || user._id;
      axios.get(`http://localhost:5000/api/health/${userId}`)
        .then(res => {
          if (res.data) {
            setFormData({
              gender: res.data.gender || 'male',
              height: res.data.height || '',
              weight: res.data.weight || '',
              age: res.data.age || 25,
              goal: res.data.goal || 'maintain',
              condition: res.data.condition || 'none',
              activity: res.data.activity || 'moderate'
            });
            if (res.data.bmi) {
              setBmiStatus(res.data.bmiCategory || "");
            }
          }
        }).catch(err => console.log("No saved biometrics found or error fetching."));
    }
  }, [user]);

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
      const planRes = await axios.post('http://localhost:5000/api/recommendations/generate-plan', { ...formData, allergies: selectedAllergies });
      if (planRes.data && planRes.data.plan) {
        setWeeklyPlan(planRes.data.plan);
        setDailyTarget(planRes.data.dailyTarget);
        setIsSyncing(false);
        setIsSubmitted(true);

        // Sync with health log database
        const userId = user.id || user.uid || user._id;
        try {
          await axios.put(`http://localhost:5000/api/health/update/${userId}`, {
            ...formData,
            bmi: bmi
          });
        } catch (err) {
          if (err.response && err.response.status === 404) {
            await axios.post('http://localhost:5000/api/health/save', {
              userId,
              ...formData,
              bmi: bmi
            });
          }
        }
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

  // --- NEW INTERACTIVE LOGIC ---
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
      const res = await axios.get(`http://localhost:5000/api/recommendations/alternatives?type=${mealType}&condition=${formData.condition}&allergies=${encodeURIComponent(JSON.stringify(selectedAllergies))}`);
      setDbAlternatives(res.data);
    } catch (err) { alert("Failed to fetch alternatives."); }
    finally { setIsSyncing(false); }
  };

  const handleOpenAdd = async (day, mealType) => {
    setIsAddingTo({ day, mealType });
    setIsSyncing(true);
    try {
      const res = await axios.get(`http://localhost:5000/api/recommendations/alternatives?type=${mealType}&condition=${formData.condition}&allergies=${encodeURIComponent(JSON.stringify(selectedAllergies))}`);
      setDbAlternatives(res.data);
    } catch (err) { alert("Failed to fetch options."); }
    finally { setIsSyncing(false); }
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

  const filteredAlternatives = useMemo(() => {
    if (!searchQuery) return dbAlternatives;
    return dbAlternatives.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [dbAlternatives, searchQuery]);

  const getImageUrl = (url) => {
    if (!url) return 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=1000';
    try {
      // Decode if it's a search engine redirect or viewer link
      if (url.includes('imgurl=') || url.includes('url=') || url.includes('q=')) {
        const urlObj = new URL(url);
        const imgUrl = urlObj.searchParams.get('imgurl') || urlObj.searchParams.get('url') || urlObj.searchParams.get('q');
        if (imgUrl) {
          let decoded = decodeURIComponent(imgUrl);
          if (!decoded.startsWith('http://') && !decoded.startsWith('https://')) {
            decoded = 'https://' + decoded;
          }
          return decoded;
        }
      }
    } catch (e) {
      console.error("Error parsing search image URL:", e);
    }
    return url;
  };

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

    // Filter empty items
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

  if (loading) return <div className={`h-screen flex items-center justify-center ${bgMain}`}><Loader2 className="animate-spin text-[#2d5a27] dark:text-[#5cb351]" /></div>;

  return (
    <div className={`h-screen w-full ${bgMain} ${textMain} p-10 overflow-hidden relative flex flex-col transition-all duration-500 ease-in-out`}>
      
      {/* HEADER */}
      <header className="flex items-center justify-between mb-8 relative z-50">
        <div className="flex items-center gap-6">
          <button onClick={() => navigate('/dashboard')} className={`text-[10px] font-bold uppercase tracking-[0.3em] ${textSub} hover:text-[#2d5a27] dark:hover:text-[#5cb351] flex items-center gap-2 transition-all`}>
              <ArrowLeft size={14} /> Hub
          </button>
          <div className="text-left">
            <h2 className="font-serif text-2xl italic">NutriFind</h2>
            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[#2d5a27] dark:text-[#5cb351]">Biometric Intelligence</p>
          </div>
        </div>
        <button onClick={toggleDarkMode} className={`p-2.5 rounded-xl transition-all ${darkMode ? 'bg-white/10 text-yellow-400 hover:bg-white/20' : 'bg-black/10 text-[#2d5a27] dark:text-[#5cb351] hover:bg-black/5'}`}>
          {darkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </header>
 
      <div className={`grid flex-1 min-h-0 transition-all duration-1000 ${isSubmitted ? 'grid-cols-12 gap-10' : 'grid-cols-1'}`}>
        
        {/* LEFT COLUMN (SIDEBAR) */}
        <motion.div layout className={`${isSubmitted ? 'col-span-4' : 'max-w-xl mx-auto w-full'} flex flex-col h-full gap-6 min-h-0`}>
            {/* Input Card */}
            <main className={`${cardBg} p-8 clay-card overflow-y-auto transition-colors custom-scrollbar`}>
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
                <div className="grid grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <label className={`text-[9px] font-bold uppercase tracking-widest ${textSub}`}>Height (cm)</label>
                      <input type="number" placeholder="Height" value={formData.height} onChange={e => setFormData({...formData, height: e.target.value})} className={`w-full h-10 bg-transparent border-b ${border} outline-none text-sm`} required />
                    </div>
                    <div className="space-y-2">
                      <label className={`text-[9px] font-bold uppercase tracking-widest ${textSub}`}>Weight (kg)</label>
                      <input type="number" placeholder="Weight" value={formData.weight} onChange={e => setFormData({...formData, weight: e.target.value})} className={`w-full h-10 bg-transparent border-b ${border} outline-none text-sm`} required />
                    </div>
                    <div className="space-y-2">
                      <label className={`text-[9px] font-bold uppercase tracking-widest ${textSub}`}>Age (yrs)</label>
                      <input type="number" placeholder="Age" value={formData.age} onChange={e => setFormData({...formData, age: e.target.value})} className={`w-full h-10 bg-transparent border-b ${border} outline-none text-sm`} required />
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className={`text-[9px] font-bold uppercase tracking-widest ${textSub}`}>Activity Level</label>
                    <select value={formData.activity} onChange={e => setFormData({...formData, activity: e.target.value})} className={`w-full h-12 px-4 border ${border} ${darkMode ? 'bg-[#1a1c1a]' : 'bg-white'} text-xs font-bold clay-input`}>
                      <option className={optionStyles} value="sedentary">Sedentary (No Exercise)</option>
                      <option className={optionStyles} value="light">Lightly Active (1-3 days/wk)</option>
                      <option className={optionStyles} value="moderate">Moderately Active (3-5 days/wk)</option>
                      <option className={optionStyles} value="active">Very Active (6-7 days/wk)</option>
                      <option className={optionStyles} value="very_active">Super Active (Extreme)</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className={`text-[9px] font-bold uppercase tracking-widest ${textSub}`}>Goal</label>
                    <select value={formData.goal} onChange={e => setFormData({...formData, goal: e.target.value})} className={`w-full h-12 px-4 border ${suggestion ? 'border-[#2d5a27] dark:border-[#5cb351]' : border} ${darkMode ? 'bg-[#1a1c1a]' : 'bg-white'} text-xs font-bold clay-input`}>
                      <option className={optionStyles} value="lose">Weight Loss {suggestion === 'lose' && '(most pick)'}</option>
                      <option className={optionStyles} value="gain">Weight Gain {suggestion === 'gain' && '(most pick)'}</option>
                      <option className={optionStyles} value="maintain">Maintenance {suggestion === 'maintain' && '(most pick)'}</option>
                    </select>
                  </div>
                </div>
 
                {/* Allergy Filter Section */}
                <div ref={allergyContainerRef} className="space-y-4 pt-4 border-t border-white/5 relative">
                  <div className="flex items-center justify-between">
                    <label className={`text-[9px] font-bold uppercase tracking-widest ${textSub}`}>Allergies & Excluded Ingredients</label>
                    <span className="text-[8px] font-bold uppercase px-2 py-0.5 bg-[#2d5a27]/10 dark:bg-[#5cb351]/10 text-[#2d5a27] dark:text-[#5cb351] rounded-full">KNN Filter</span>
                  </div>
                  
                  {/* Allergy Search Input & Dropdown container */}
                  <div className="relative">
                    <input 
                      type="text" 
                      placeholder="Search ingredients..." 
                      value={allergySearch} 
                      onChange={e => {
                        setAllergySearch(e.target.value);
                        setShowDropdown(true);
                      }} 
                      onFocus={() => setShowDropdown(true)}
                      onClick={() => setShowDropdown(prev => !prev)}
                      className={`w-full h-11 pl-10 pr-4 rounded-xl border ${border} ${darkMode ? 'bg-[#1a1c1a] text-white' : 'bg-white text-black'} text-xs font-semibold outline-none transition-all duration-300 focus:border-[#2d5a27] dark:focus:border-[#5cb351] clay-input`}
                    />
                    <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 opacity-45" />

                    {/* Matching Ingredients list with checkboxes as real floating absolute dropdown overlay */}
                    {showDropdown && matchingIngredients.length > 0 && (
                      <div className={`absolute left-0 right-0 mt-2 max-h-48 overflow-y-auto space-y-2.5 p-3.5 border ${border} rounded-xl shadow-2xl z-[99] custom-scrollbar ${
                        darkMode ? 'bg-[#1a1c1a] text-white' : 'bg-white text-black'
                      }`}>
                        {matchingIngredients.map(ing => {
                          const isChecked = selectedAllergies.includes(ing);
                          return (
                            <label key={ing} className="flex items-center gap-3 cursor-pointer select-none group">
                              <input 
                                type="checkbox" 
                                checked={isChecked}
                                onChange={() => {
                                  if (isChecked) {
                                    setSelectedAllergies(prev => prev.filter(x => x !== ing));
                                  } else {
                                    setSelectedAllergies(prev => [...prev, ing]);
                                  }
                                }}
                                className="hidden"
                              />
                              <div className={`w-[18px] h-[18px] rounded-md flex items-center justify-center border transition-all duration-300 ${
                                isChecked 
                                  ? 'bg-[#2d5a27] dark:bg-[#5cb351] border-transparent scale-105' 
                                  : `border-black/20 dark:border-white/20 hover:border-[#2d5a27] dark:hover:border-[#5cb351]`
                              }`}>
                                {isChecked && <CheckCircle size={10} className="text-white" />}
                              </div>
                              <span className="text-[11px] font-semibold opacity-75 group-hover:opacity-100 transition-opacity">{ing}</span>
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>
 
                  {/* Selected Allergies wrap */}
                  {selectedAllergies.length > 0 && (
                    <div className="space-y-2 pt-2">
                      <p className={`text-[8px] font-black uppercase tracking-widest ${textSub} opacity-40`}>Active Exclusions ({selectedAllergies.length})</p>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedAllergies.map(ing => (
                          <div 
                            key={ing} 
                            onClick={() => setSelectedAllergies(prev => prev.filter(x => x !== ing))}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider cursor-pointer border border-[#2d5a27]/20 dark:border-[#5cb351]/20 hover:bg-[#2d5a27]/10 dark:hover:bg-[#5cb351]/10 hover:border-red-500/50 hover:text-red-500 transition-all duration-300 ${
                              darkMode ? 'bg-[#5cb351]/10 text-[#5cb351]' : 'bg-[#2d5a27]/10 text-[#2d5a27]'
                            }`}
                          >
                            {ing} <X size={10} className="opacity-60" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
 
                <button type="submit" className={`w-full h-14 bg-[#2d5a27] dark:bg-[#5cb351] text-white font-bold text-[10px] uppercase tracking-[0.3em] transition-all hover:scale-[1.02] active:scale-[0.98] clay-btn`}>
                  {isSyncing ? <Loader2 className="animate-spin mx-auto" /> : "Generate Weekly Plan"}
                </button>
              </form>
            </main>

            {/* RESTORED BMI & INSIGHT CARDS */}
            <div className="grid grid-cols-2 gap-4 pb-10">
              {/* Calculated BMI */}
              <div className="bg-[#2d5a27] dark:bg-[#5cb351] p-6 text-center text-[#e8f4e5] clay-card flex flex-col justify-center items-center">
                 <p className="text-[8px] font-black uppercase tracking-[0.4em] text-[#2d5a27] dark:text-white/60 mb-2">Calculated BMI</p>
                 <h2 className="text-4xl font-serif mb-2 text-white">{bmi || "—"}</h2>
                 <div className="px-3 py-1 bg-[#2d5a27] dark:bg-[#5cb351] rounded-[10px] text-[7px] font-black uppercase tracking-widest inline-block shadow-inner">{bmiStatus || "Ready"}</div>
              </div>

              {/* Live BMR & TDEE */}
              <div className={`${cardBg} p-6 text-center transition-colors clay-card flex flex-col justify-center`}>
                 <p className={`text-[8px] font-black uppercase tracking-[0.4em] ${textSub} mb-3`}>Daily Metabolism</p>
                 <div className="flex justify-around items-center w-full">
                   <div>
                     <p className="text-xl font-serif italic text-[#2d5a27] dark:text-[#5cb351]">{calculatedBmr || "—"}</p>
                     <p className={`text-[6px] font-black uppercase tracking-widest ${textSub} opacity-50`}>BMR (kcal)</p>
                   </div>
                   <div className="w-[1px] h-8 bg-black/10 dark:bg-white/10"></div>
                   <div>
                     <p className="text-xl font-serif italic text-[#2d5a27] dark:text-[#5cb351]">{calculatedTdee || "—"}</p>
                     <p className={`text-[6px] font-black uppercase tracking-widest ${textSub} opacity-50`}>TDEE (kcal)</p>
                   </div>
                 </div>
              </div>

              {/* AI Insight */}
              <div className={`${cardBg} p-6 col-span-2 flex flex-col justify-center transition-colors clay-card`}>
                <div className="flex items-center gap-2 mb-2">
                    <Info size={12} className="text-[#2d5a27] dark:text-[#5cb351]" />
                    <h4 className={`text-[8px] font-black uppercase tracking-widest ${textSub}`}>AI Insight</h4>
                </div>
                <p className="text-[10px] leading-relaxed italic opacity-80">
                    {suggestion ? `Recommend ${suggestion.toUpperCase()} based on Mifflin-St Jeor daily metabolism of ${calculatedTdee || '—'} kcal.` : "Input metrics to sync model prediction."}
                </p>
              </div>
            </div>

            {/* RELOCATED SAVE BUTTON */}
            {isSubmitted && (
              <motion.button 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={handleSaveToProfile} 
                className={`w-full py-5 bg-[#2d5a27] dark:bg-[#5cb351] text-white flex items-center justify-center gap-4 hover:scale-[1.02] active:scale-[0.98] transition-all z-50 mb-10 clay-btn`}
              >
                  <Save size={20} className="text-white" />
                  <span className="text-[11px] font-black uppercase tracking-[0.2em]">Confirm & Save Plan</span>
              </motion.button>
            )}
        </motion.div>

        {/* RIGHT COLUMN (WEEKLY PLAN POP-UP) */}
        {isSubmitted && weeklyPlan && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="col-span-8 flex flex-col gap-6 min-h-0">
            
            {/* Day Selector Icons */}
            <div className="flex items-center gap-3">
              {DYNAMIC_DAYS.map((day, idx) => (
                <button
                  key={day}
                  onClick={() => setActiveDayIdx(idx)}
                  className={`flex-1 py-3 transition-all duration-300 flex flex-col items-center gap-1 clay-btn
                    ${activeDayIdx === idx 
                      ? 'bg-[#2d5a27] dark:bg-[#5cb351] text-white scale-105' 
                      : `${cardBg} ${textSub} hover:border-[#2d5a27] dark:hover:border-[#5cb351]`
                    }`}
                >
                  <span className="text-[8px] font-black uppercase opacity-60">Day 0{idx+1}</span>
                  <span className="text-[10px] font-black uppercase tracking-tighter">{day.substring(0, 3)}</span>
                </button>
              ))}
            </div>
 
            {/* Content Stage */}
            <div className="flex-1 min-h-0 flex flex-col">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeDayIdx}
                    initial={{    opacity: 0, scale: 0.98, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 1.02, y: -10 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className={`${cardBg} p-8 flex-1 flex flex-col min-h-0 transition-colors clay-card`}
                  >
                    <div className="flex justify-between items-center mb-8 border-b pb-6 border-white/5">
                      <h2 className="font-serif text-3xl italic">{DYNAMIC_DAYS[activeDayIdx]} Narrative</h2>
                      <div className="flex gap-8 text-right">
                        <div>
                          <p className={`text-[10px] font-black uppercase tracking-widest ${textSub}`}>Intake Total</p>
                          <p className={`text-xl font-serif italic ${darkMode ? 'text-[#5cb351]' : 'text-[#2d5a27]'}`}>{weeklyPlan[DYNAMIC_DAYS[activeDayIdx]].dailyTotal} <span className="text-[10px] not-italic font-bold opacity-40">kcal</span></p>
                        </div>
                        {dailyTarget > 0 && (
                          <div className="pl-8 border-l border-white/5">
                            <p className={`text-[10px] font-black uppercase tracking-widest ${textSub}`}>Target Goal</p>
                            <p className={`text-xl font-serif italic ${darkMode ? 'text-[#5cb351]' : 'text-[#2d5a27]'}`}>{dailyTarget} <span className="text-[10px] not-italic font-bold opacity-40">kcal</span></p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex-1 grid grid-cols-3 gap-6 min-h-0">
                      {['breakfast', 'lunch', 'dinner'].map((m) => (
                        <div key={m} className={`flex flex-col bg-black/5 border ${darkMode ? 'border-white/10' : 'border-[#2d5a27]/10'} rounded-xl p-5 h-full min-h-0`}>
                          <p className={`text-xs font-black uppercase mb-4 tracking-widest ${darkMode ? 'text-[#5cb351]' : 'text-[#2d5a27]'}`}>{m}</p>
                          <div className="flex-1 space-y-4 overflow-y-auto pr-2 custom-scrollbar">
                            {weeklyPlan[DYNAMIC_DAYS[activeDayIdx]][m].map((item, idx) => (
                              <div key={idx} className={`${darkMode ? 'bg-white/5 border-white/20' : 'bg-white border-[#2d5a27]/30'} border p-5 flex flex-col gap-4 group/item transition-all clay-card`}>
                                <div className="flex-1">
                                  <span className="text-sm font-black block mb-1 leading-tight">{item.name}</span>
                                  <div className="flex items-center gap-2">
                                    <span className={`text-[10px] font-bold ${textSub} opacity-50 uppercase tracking-widest`}>{item.calories} kcal</span>
                                    <span className={`w-1 h-1 rounded-full ${darkMode ? 'bg-[#5cb351]/30' : 'bg-[#2d5a27]/30'}`}></span>
                                    <span className={`text-[10px] font-bold ${textSub} opacity-50 uppercase tracking-widest`}>{item.grams}g</span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 pt-4 border-t border-white/5">
                                  <button 
                                    onClick={() => setViewingDetails(item)} 
                                    className={`flex-1 py-2 flex items-center justify-center gap-2 transition-all bg-[#2d5a27] dark:bg-[#5cb351] text-white hover:scale-105 clay-btn`}
                                  >
                                    <Eye size={14}/> 
                                    <span className="text-[8px] font-black uppercase tracking-widest">Details</span>
                                  </button>
                                  <button 
                                    onClick={() => handleOpenSwap(item, DYNAMIC_DAYS[activeDayIdx], m, idx)} 
                                    className={`flex-1 py-2 flex items-center justify-center gap-2 transition-all bg-[#2d5a27] dark:bg-[#5cb351] text-white hover:scale-105 clay-btn`}
                                  >
                                    <RefreshCw size={14}/> 
                                    <span className="text-[8px] font-black uppercase tracking-widest">Swap</span>
                                  </button>
                                  <button 
                                    onClick={() => handleDeleteItem(DYNAMIC_DAYS[activeDayIdx], m, idx)} 
                                    className={`flex-1 py-2 flex items-center justify-center gap-2 transition-all bg-[#2d5a27] dark:bg-[#5cb351] text-white hover:scale-105 clay-btn`}
                                  >
                                    <Trash2 size={14}/> 
                                    <span className="text-[8px] font-black uppercase tracking-widest">Drop</span>
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                          <button 
                            onClick={() => handleOpenAdd(DYNAMIC_DAYS[activeDayIdx], m)}
                            className={`w-full py-3 mt-4 text-[9px] font-black uppercase tracking-widest ${textSub} hover:border-[#2d5a27] dark:hover:border-[#5cb351] hover:text-[#2d5a27] dark:hover:text-[#5cb351] transition-all flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] clay-btn`}
                          >
                            <Plus size={12} /> Add Meal
                          </button>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                </AnimatePresence>
            </div>
          </motion.div>
        )}
      </div>


      {/* ITEM DETAILS MODAL */}
      <AnimatePresence>
        {viewingDetails && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[400] bg-black/80 flex items-center justify-center p-6"
            onClick={() => setViewingDetails(null)}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
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
                <div className="md:w-[45%] p-8 overflow-y-auto max-h-[85vh]">
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

                  {/* INGREDIENTS */}
                  {renderIngredients()}

                  <button 
                    onClick={() => setViewingDetails(null)}
                    className="w-full py-4 bg-[#2d5a27] dark:bg-[#5cb351] text-white font-bold text-[9px] uppercase tracking-[0.3em] hover:bg-[#1c3a1c] dark:hover:bg-[#3d8a35] transition-all mt-8 clay-btn"
                  >
                    Close Protocol
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SELECTION MODAL (For Swap/Add) */}
      <AnimatePresence>
        {(swappingMeal || isAddingTo) && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[400] bg-black/80 flex items-center justify-center p-6"
            onClick={() => { setSwappingMeal(null); setIsAddingTo(null); setDbAlternatives([]); setSearchQuery(""); }}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className={`${cardBg} w-full max-w-4xl h-[80vh] overflow-hidden relative flex flex-col clay-card`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-10 border-b border-white/5 flex justify-between items-center">
                <div>
                  <h2 className="font-serif text-3xl italic">
                    {swappingMeal ? `Swap ${swappingMeal.original.name}` : `Add to ${isAddingTo.type} Schedule`}
                  </h2>
                  <p className={`text-[10px] font-black uppercase tracking-widest ${textSub} mt-2`}>
                    Browse biological alternatives for {swappingMeal?.mealType || isAddingTo?.type}
                  </p>
                </div>
                <button onClick={() => { setSwappingMeal(null); setIsAddingTo(null); setDbAlternatives([]); }} className={`p-3 rounded-xl ${darkMode ? 'bg-white/5 hover:bg-white/10' : 'bg-black/5 hover:bg-black/10'} clay-btn`}><X size={20}/></button>
              </div>

              <div className="p-10 flex-1 overflow-hidden flex flex-col gap-8">
                <div className="relative">
                  <Search className={`absolute left-4 top-1/2 -translate-y-1/2 ${textSub}`} size={18} />
                  <input 
                    type="text" 
                    placeholder="Search database..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`w-full h-14 pl-12 pr-6 ${darkMode ? 'bg-white/5' : 'bg-[#f5faf4]'} border ${border} outline-none focus:border-[#2d5a27] dark:focus:border-[#5cb351] transition-all clay-input`}
                  />
                </div>

                <div className="flex-1 overflow-y-auto grid grid-cols-3 gap-4 custom-scrollbar pr-2">
                  {filteredAlternatives.map((alt) => (
                    <motion.div 
                      key={alt.id}
                      whileHover={{ y: -5 }}
                      onClick={() => handleSelectFood(alt)}
                      className={`${darkMode ? 'bg-white/5' : 'bg-white'} border ${border} p-4 cursor-pointer group transition-all clay-card`}
                    >
                      <div className="h-32 rounded-xl overflow-hidden mb-4">
                        <img src={getImageUrl(alt.imageUrl || alt.imageURL || alt.image || alt.imagePath)} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      </div>
                      <h4 className="text-sm font-bold truncate mb-1">{alt.name}</h4>
                      <p className={`text-[10px] ${textSub}`}>{alt.calories} kcal • {alt.grams}g</p>
                      <button className="w-full mt-4 py-2 bg-[#2d5a27]/10 dark:bg-[#5cb351]/10 text-[#2d5a27] dark:text-[#5cb351] rounded-lg text-[9px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all">Select</button>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SUCCESS TOAST */}
      <AnimatePresence>
        {showToast && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[300] bg-black/60 backdrop-blur-sm flex items-center justify-center">
                <div className={`${cardBg} p-12 rounded-[20px] text-center border-4 border-[#2d5a27] dark:border-[#5cb351]`}>
                    <CheckCircle size={48} className="text-[#2d5a27] dark:text-[#5cb351] mx-auto mb-4" />
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